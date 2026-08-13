# The Next.js application. Vercel still builds this repository from source; this
# image exists so the same application can be run locally next to the PostgreSQL
# container, and optionally behind the shared Traefik proxy.

FROM node:22-bookworm-slim AS base
# Prisma's query engine links against OpenSSL, which the slim image omits.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle by the compiler, so
# this has to be a build argument rather than a container environment variable.
ARG NEXT_PUBLIC_CACHE_VERSION=1
ENV NEXT_PUBLIC_CACHE_VERSION=$NEXT_PUBLIC_CACHE_VERSION
# Deliberately `next build` and not `npm run build`: the packaged build script
# also runs the scraper that repopulates PostgreSQL, which must never happen
# while an image is being built. .next/cache is ~200 MB of webpack cache that
# `next start` never reads.
RUN npx next build && rm -rf .next/cache

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# The generated Prisma client; `npm ci` above installs @prisma/client but cannot
# generate it without the schema and the prisma CLI.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
# --chown in the COPY rather than a later chown, which would duplicate the whole
# .next layer. next/image writes optimised images under .next/cache at runtime,
# so it has to be writable by the unprivileged user.
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build /app/public ./public
COPY next.config.js jsconfig.json ./

USER node
RUN mkdir -p .next/cache
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./node_modules/.bin/next", "start"]

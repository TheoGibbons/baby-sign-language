FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global prisma@5.21.1

COPY prisma ./prisma

ENTRYPOINT ["prisma", "migrate", "deploy"]

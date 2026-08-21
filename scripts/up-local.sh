#!/usr/bin/env bash
set -Eeuo pipefail

# Starts the local stack standalone: PostgreSQL plus the Next.js app on a
# loopback port, with no proxy and no shared Docker network. Pass
# --database-only to keep just the database and run `npm run dev` on the host.

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

database_only=false
if [[ "${1:-}" == "--database-only" ]]; then
  database_only=true
fi

# This project used to read .env.database. An existing checkout still has that
# file, and silently starting with different credentials is worse than stopping.
if [[ ! -f .env && -f .env.database ]]; then
  echo "This project now reads .env, not .env.database." >&2
  echo "Rename it once, then re-run:  mv .env.database .env" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

compose=(docker compose --env-file .env)
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait postgres
"${compose[@]}" --profile tools run --rm --build migrate

if [[ "$database_only" == false ]]; then
  "${compose[@]}" up -d --build --wait --wait-timeout 180 app
fi

"${compose[@]}" ps

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ "$database_only" == false ]]; then
  echo "App: http://localhost:${APP_PORT:-3082}"
fi
echo "Local DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=require&connection_limit=1"

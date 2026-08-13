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

if [[ ! -f .env.database ]]; then
  cp .env.database.example .env.database
fi

compose=(docker compose --env-file .env.database)
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait postgres
"${compose[@]}" --profile tools run --rm --build migrate

if [[ "$database_only" == false ]]; then
  "${compose[@]}" up -d --build --wait --wait-timeout 180 app
fi

"${compose[@]}" ps

set -a
# shellcheck disable=SC1091
source .env.database
set +a

if [[ "$database_only" == false ]]; then
  echo "App: http://localhost:${APP_PORT:-3082}"
fi
echo "Local DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=require&connection_limit=1"

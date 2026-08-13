#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

if [[ ! -f .env.database ]]; then
  cp .env.database.example .env.database
fi

compose=(docker compose --env-file .env.database)
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait postgres
"${compose[@]}" --profile tools run --rm --build migrate
"${compose[@]}" ps

set -a
# shellcheck disable=SC1091
source .env.database
set +a
echo "Local DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=require&connection_limit=1"

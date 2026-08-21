#!/usr/bin/env bash
set -Eeuo pipefail

# Starts the local stack behind the shared proxy from ~/projects/hobby-traefik.
# The -f files are passed explicitly so Compose does not also load the
# standalone docker-compose.override.yml and publish a redundant host port.

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

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

if ! docker network inspect traefik-public >/dev/null 2>&1; then
  echo "The traefik-public network is missing. Start hobby-traefik locally first." >&2
  exit 1
fi

compose=(docker compose --env-file .env -f docker-compose.yml -f docker-compose.traefik.yml)
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait postgres
"${compose[@]}" --profile tools run --rm --build migrate
"${compose[@]}" up -d --build --remove-orphans --wait --wait-timeout 180 app
"${compose[@]}" ps

set -a
# shellcheck disable=SC1091
source .env
set +a
echo "App: http://${APP_HOST:-signs.localhost}:${TRAEFIK_HTTP_PORT:-8085}"

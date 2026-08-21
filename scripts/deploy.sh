#!/usr/bin/env bash
set -Eeuo pipefail

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
  echo "Missing $repo_dir/.env; copy .env.production.example and configure it." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" || "$POSTGRES_PASSWORD" == "CHANGE_ME" || "$POSTGRES_PASSWORD" == "baby-signs-local-only" ]]; then
  echo "Set a strong, URL-safe POSTGRES_PASSWORD in .env." >&2
  exit 1
fi

if [[ -z "${POSTGRES_ALLOWED_CIDRS:-}" || "$POSTGRES_ALLOWED_CIDRS" == *CHANGE_ME* ]]; then
  echo "Set POSTGRES_ALLOWED_CIDRS to Vercel's static egress IP address(es)." >&2
  exit 1
fi

if [[ "$POSTGRES_ALLOWED_CIDRS" == *"0.0.0.0/0"* && "${ALLOW_PUBLIC_DATABASE:-false}" != "true" ]]; then
  echo "Refusing an internet-wide database allowlist without ALLOW_PUBLIC_DATABASE=true." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Refusing to deploy over tracked changes in $repo_dir" >&2
  exit 1
fi

git pull --ff-only

compose=(docker compose --env-file .env)
"${compose[@]}" config --quiet
"${compose[@]}" up -d --build --wait postgres

# Capture a recoverable snapshot immediately before applying schema changes.
"$repo_dir/scripts/backup.sh"
"${compose[@]}" --profile tools run --rm --build migrate
"${compose[@]}" ps
"${compose[@]}" port postgres 5432

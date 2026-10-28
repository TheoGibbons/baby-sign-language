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

pulled_from="$(git rev-parse HEAD)"
git pull --ff-only

# Bash keeps running the copy of this script it started with, not the one just
# pulled, so a change to deploy.sh would otherwise take effect one deploy late.
# Start over on the new copy; its own pull then finds nothing new.
if ! git diff --quiet "$pulled_from" HEAD -- scripts/deploy.sh; then
  echo "scripts/deploy.sh changed; restarting on the new copy."
  exec bash "$repo_dir/scripts/deploy.sh" "$@"
fi

compose=(docker compose --env-file .env)
"${compose[@]}" config --quiet

# Without this every build attaches a fresh provenance attestation, which gives
# an unchanged image a new ID, and the server's Compose (2.40) recreates any
# container whose image ID changed, restarting PostgreSQL on every deploy. These
# images never leave the host, so nothing reads it.
export BUILDX_NO_DEFAULT_ATTESTATIONS=1
"${compose[@]}" up -d --build --wait postgres

# Capture a recoverable snapshot immediately before applying schema changes.
"$repo_dir/scripts/backup.sh"
"${compose[@]}" --profile tools run --rm --build migrate
"${compose[@]}" ps
"${compose[@]}" port postgres 5432

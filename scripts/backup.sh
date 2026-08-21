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
  echo "Missing $repo_dir/.env" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

backup_dir="$repo_dir/backups"
mkdir -p "$backup_dir"
backup_file="$backup_dir/${POSTGRES_DB:-baby_signs}-$(date -u +%Y%m%dT%H%M%SZ).dump"

compose=(docker compose --env-file .env)
"${compose[@]}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-baby_signs}" -d "${POSTGRES_DB:-baby_signs}" --format=custom \
  > "$backup_file"

chmod 600 "$backup_file"
echo "Backup written to $backup_file"

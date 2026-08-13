#!/bin/sh
set -eu

tls_dir=/var/lib/postgresql/tls
tls_host=${POSTGRES_TLS_HOST:-localhost}
allowed_cidrs=${POSTGRES_ALLOWED_CIDRS:-127.0.0.1/32}

case "$tls_host" in
  *[!A-Za-z0-9._-]*|'')
    echo "POSTGRES_TLS_HOST contains unsupported characters: $tls_host" >&2
    exit 1
    ;;
esac

install -d -m 700 -o postgres -g postgres "$tls_dir"

if [ ! -s "$tls_dir/server.key" ] || [ ! -s "$tls_dir/server.crt" ]; then
  if printf '%s\n' "$tls_host" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
    subject_alt_name="IP:$tls_host"
  else
    subject_alt_name="DNS:$tls_host"
  fi

  openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 825 \
    -subj "/CN=$tls_host" \
    -addext "subjectAltName=$subject_alt_name" \
    -keyout "$tls_dir/server.key" \
    -out "$tls_dir/server.crt"
fi

chown postgres:postgres "$tls_dir/server.key" "$tls_dir/server.crt"
chmod 600 "$tls_dir/server.key"
chmod 644 "$tls_dir/server.crt"

hba_tmp="$tls_dir/pg_hba.conf.tmp"
cidrs_tmp="$tls_dir/allowed-cidrs.tmp"
printf '%s\n' "$allowed_cidrs" | tr ',' '\n' > "$cidrs_tmp"
{
  echo 'local all all trust'
  echo 'hostnossl all all 0.0.0.0/0 reject'
  echo 'hostnossl all all ::0/0 reject'
  # Compose migration jobs and host connections through Docker's bridge.
  echo 'hostssl all all samenet scram-sha-256'

  while IFS= read -r cidr; do
    cidr=$(printf '%s' "$cidr" | tr -d ' ')
    if ! printf '%s\n' "$cidr" | grep -Eq '^[0-9A-Fa-f:.]+/[0-9]{1,3}$'; then
      echo "Invalid CIDR in POSTGRES_ALLOWED_CIDRS: $cidr" >&2
      exit 1
    fi
    printf 'hostssl all all %s scram-sha-256\n' "$cidr"
  done < "$cidrs_tmp"
} > "$hba_tmp"

rm -f "$cidrs_tmp"

chown postgres:postgres "$hba_tmp"
chmod 600 "$hba_tmp"
mv "$hba_tmp" "$tls_dir/pg_hba.conf"

exec /usr/local/bin/docker-entrypoint.sh "$@"

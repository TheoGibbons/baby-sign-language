# Baby Sign Language

A Next.js sign-language reference app. **The application is deployed on Vercel**; only
its PostgreSQL database runs from this repository's Docker Compose project on the EC2
instance. The same Compose project also builds and runs the app, so the whole thing
comes up locally with one command — that path is for local use only.

> **Upgrading an existing checkout:** this project now reads `.env`, not
> `.env.database`. Rename it once — `mv .env.database .env` — on the server and on any
> development machine. The scripts stop with that instruction rather than starting
> with different credentials.

## Deploying to LIVE

Production here means **the database only**. `scripts/deploy.sh` names the postgres
service explicitly and never starts the app service. Traefik is not involved:
PostgreSQL is TCP traffic, not HTTP.

Choose a DNS name such as `db.example.com` and point it at the instance's public IP
first — the container generates a TLS certificate for that name.

```bash
git clone https://github.com/TheoGibbons/baby-sign-language.git ~/projects/baby-sign-language
cd ~/projects/baby-sign-language
cp .env.production.example .env

# Generate a URL-safe password to paste in below:
openssl rand -hex 32

# Set before continuing:
#   POSTGRES_PASSWORD        the value generated above
#   POSTGRES_TLS_HOST        the database DNS name, e.g. db.example.com
#   POSTGRES_ALLOWED_CIDRS   Vercel static egress IPs, each /32, comma separated
#   ALLOW_PUBLIC_DATABASE    only if you must use 0.0.0.0/0 — see Security notes
nano .env

bash scripts/deploy.sh
```

The script refuses placeholder credentials and refuses an internet-wide allowlist
unless explicitly acknowledged, fast-forwards the checkout, builds and starts
PostgreSQL, writes a timestamped pre-migration dump under `backups/`, runs
`prisma migrate deploy`, and reports the published port.

Security group — note that this database is reached from Vercel, so unlike the other
projects on this instance its allowed source is not a single administrator IP:

| TCP port | Allowed source | Purpose |
|---|---|---|
| 22 | Administrator IP | SSH and deployment |
| 5436 | Vercel static egress IP(s) | Application database traffic |

Do not route 5436 through hobby-traefik; it must be an ordinary EC2 TCP ingress rule.
Match the same `/32` addresses in `POSTGRES_ALLOWED_CIDRS`, giving two independent
enforcement layers. Read [Security notes](#security-notes) before using `0.0.0.0/0`.

Finally, point Vercel at it — see [Configuration](#configuration).

## Deploying to LIVE with hobby-traefik

Not applicable in production: the app runs on Vercel and the only thing on this
instance is PostgreSQL, which Traefik cannot route because it is not HTTP.

`docker-compose.traefik.yml` and `docker-compose.prod.yml` do exist and would put the
app behind the shared proxy with HTTPS. They are unused today, and kept so that moving
the app off Vercel is a deployment change rather than a redesign. If you ever do that,
the app service joins `traefik-public` and PostgreSQL still does not.

## Deploying Locally

Starts PostgreSQL and the application together, standalone, on loopback ports.

```bash
git clone https://github.com/TheoGibbons/baby-sign-language.git ~/projects/baby-sign-language
cd ~/projects/baby-sign-language
cp .env.example .env

# .env works as shipped for local use — local-only credentials, loopback binds.
bash scripts/up-local.sh
```

Open <http://localhost:3082>. PostgreSQL is on `127.0.0.1:5436`, and the script applies
the tracked Prisma migrations before starting the app.

Pass `--database-only` to run just the database, then work on the app with hot reload
on the host — see [Development](#development).

## Deploying Locally with hobby-traefik

Start the shared proxy first if it is not already running:

```bash
git clone https://github.com/TheoGibbons/hobby-traefik.git ~/projects/hobby-traefik
cd ~/projects/hobby-traefik
cp .env.example .env
bash scripts/up-local.sh
```

Then:

```bash
git clone https://github.com/TheoGibbons/baby-sign-language.git ~/projects/baby-sign-language
cd ~/projects/baby-sign-language
cp .env.traefik.example .env

bash scripts/up-local-traefik.sh
```

Open <http://signs.localhost:8085>. The script passes its `-f` files explicitly, so
Compose does not also load the standalone port override — only Traefik fronts the app.
PostgreSQL keeps its own host port in both modes because it is not HTTP.

## Setup push-to-deploy

`.github/workflows/deploy-database.yml` runs on a push to `main`, but **only when
database infrastructure, migrations or the deployment scripts change** — application
changes deploy through Vercel's own Git integration. It SSHes to the instance and runs
`bash scripts/deploy.sh` in `~/projects/baby-sign-language`.

**Part 1 — once per server, not once per project.** The instance needs to read GitHub
so `git pull --ff-only` works. Skip this if another project on the same box has
already done it; skip it entirely if this repository is public.

```bash
# On the EC2 instance. Create a fine-grained PAT with Contents: Read-only,
# scoped to the repositories this box deploys:
#   https://github.com/settings/personal-access-tokens
read -rsp 'PAT: ' PAT && echo

git config --global credential.helper store
printf 'https://x-access-token:%s@github.com\n' "$PAT" > ~/.git-credentials
chmod 600 ~/.git-credentials
```

A deploy key cannot be shared between projects: GitHub binds one to a single
repository and rejects the same key on a second with "Key is already in use". One
PAT covers every repository on the box.

**Part 2 — once per repository.** The same EC2 keypair is reused for every project,
so only these four secrets are new. Create a GitHub environment named `production`,
then:

```bash
# Locally, with the gh CLI authenticated:
gh secret set EC2_HOST            --env production --body '<ec2-public-dns>'
gh secret set EC2_USER            --env production --body 'ubuntu'
gh secret set EC2_SSH_PRIVATE_KEY --env production < ~/.ssh/<ec2-deploy-key>
gh secret set EC2_KNOWN_HOSTS     --env production \
  --body "$(ssh-keyscan -H <ec2-public-dns> 2>/dev/null)"
```

The deploy stops rather than overwrite tracked files edited directly on the server.

## What it is

A sign-language reference for babies and toddlers: a searchable list of signs with
video demonstrations and synonym matching. The interesting split is deployment — the
app is serverless on Vercel, while its database is a plain container on a box we own,
reached over TLS across the internet.

## How it works

The Compose stack contains:

- PostgreSQL 16 with a persistent data volume.
- A persistent, automatically generated TLS certificate.
- `pg_hba.conf` rules that reject non-TLS TCP connections and allow only the
  configured client CIDRs plus the private Docker network.
- An on-demand Prisma migration image, behind the `tools` profile.
- The application image built from the repository root [Dockerfile](Dockerfile).

The server uses SCRAM password authentication and TLS 1.2 or newer. Local and
production instances use the same `docker-compose.yml` with different `.env` files.

| File | Purpose |
|---|---|
| `docker-compose.yml` | Proxy-agnostic PostgreSQL, migrations and app |
| `docker-compose.override.yml` | Standalone loopback port, loaded automatically |
| `docker-compose.traefik.yml` | Shared `traefik-public` network and routing labels |
| `docker-compose.prod.yml` | HTTPS overlay, unused while the app lives on Vercel |

The two modes are mutually exclusive. Plain `docker compose` commands pick up the
standalone override and publish `APP_PORT`; the Traefik script passes its `-f` files
explicitly, which suppresses that override.

The Compose project is named `baby-sign-language-database`, which now covers more than
the database. The name is kept because renaming it would orphan the live
`baby-sign-language-database_database-data` volume and bring PostgreSQL up empty.

The application image runs `next build` without a database and `next start` as an
unprivileged user. It deliberately does not run `npm run build`, whose script also
invokes the scraper that repopulates PostgreSQL.

## Configuration

| File | Copied to | Purpose |
|---|---|---|
| `.env.example` | `.env` | Local standalone: local-only credentials, loopback binds |
| `.env.traefik.example` | `.env` | Local through the shared proxy; adds `APP_HOST` |
| `.env.production.example` | `.env` | The server: real password, TLS host, allowed CIDRs |
| `.env.local.example` | `.env.local` | Next.js running on the host, outside Docker |

### Pointing Vercel at the database

Set this environment variable in the Vercel project for Production, using the real
password, database hostname and port:

```dotenv
DATABASE_URL=postgresql://baby_signs:PASSWORD@db.example.com:5436/baby_signs?sslmode=require&connection_limit=1&pool_timeout=10&connect_timeout=10
```

A hexadecimal password needs no URL encoding. If you choose one containing reserved
URL characters, percent-encode them.

`sslmode=require` is mandatory — the container refuses plaintext connections. The
generated certificate is self-signed, so this encrypts traffic but does not validate
the server's identity; CIDR allowlisting remains important. For strict verification,
replace the generated certificate with one signed by a trusted CA and give Prisma the
CA certificate.

Select a Vercel function region close to the EC2 region to reduce query latency. This
is a direct connection rather than a serverless pool; `connection_limit=1` and the
shared Prisma client in `src/lib/prisma.js` limit connection growth. If traffic becomes
bursty, add PgBouncer or move to managed Postgres with serverless pooling.

After saving the variable, redeploy the Vercel application. Preview deployments should
use a separate database or omit `DATABASE_URL`; do not point untrusted preview branches
at production data.

## Operating it

On-demand compressed dump:

```bash
bash scripts/backup.sh
```

Backups are written to the ignored `backups/` directory with mode `0600`. Copy them off
the instance to S3 or another host and schedule the command with a systemd timer or
cron. A backup stored only on the same EC2 disk is not disaster recovery.

The named volumes `baby-sign-language-database_database-data` and
`baby-sign-language-database_database-tls` survive `docker compose down`. **Never run
`docker compose down -v`** unless both the database and its generated TLS material are
intentionally being destroyed.

Populate the sign records and export the search index when intentionally needed:

```bash
npm run populate-db
npm run export-sign-names
```

`public/static/data/sign-names.json` can be supplied to an LLM to generate
`public/static/data/sign-synonyms.json`; use only genuine synonyms mapped to exact
canonical sign names.

## Security notes

This is the one database on the instance that is **not** restricted to a single
administrator IP, because Vercel has to reach it.

The recommended setup requires Vercel's Static IPs add-on or Secure Compute. Ordinary
Vercel deployments use dynamic outbound addresses, which cannot be expressed as a
narrow allowlist. See Vercel's
[fixed-IP guidance](https://vercel.com/kb/guide/can-i-get-a-fixed-ip-address).

If static egress is unavailable, setting both `POSTGRES_ALLOWED_CIDRS=0.0.0.0/0` and
`ALLOW_PUBLIC_DATABASE=true` permits Vercel's dynamic addresses. **This exposes the
PostgreSQL login endpoint to the entire internet and is explicitly not recommended** —
`scripts/deploy.sh` refuses it without that second flag for exactly that reason. A
managed serverless Postgres service is safer in that situation.

Two layers protect this port and both matter, because Docker publishes ports by
writing DNAT rules straight into iptables and so bypasses host firewalls such as
`ufw`: the EC2 security group, and `pg_hba.conf` via `POSTGRES_ALLOWED_CIDRS`.

## Development

Run only the database in Docker and Next.js on the host, for hot reload:

```bash
bash scripts/up-local.sh --database-only
cp .env.local.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

Rebuild the container after changing application code; the image is built once and
`next start` serves the compiled output:

```bash
docker compose --env-file .env up -d --build app
```

A bare `docker compose up -d --build` also works and publishes the same port, but it
skips the migration container, which sits behind the `tools` profile. Use
`scripts/up-local.sh` at least once against a new database volume so the schema exists.

To create a schema migration:

```bash
npx prisma migrate dev
```

Commit the generated directory under `prisma/migrations/`. Production runs
`prisma migrate deploy`; it never uses the development migration command.

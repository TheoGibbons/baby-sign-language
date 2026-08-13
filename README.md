# Baby Sign Language

The Next.js application is deployed on Vercel. Its PostgreSQL database runs as
a separate Docker Compose project on EC2. Traefik is not involved: PostgreSQL is
TCP database traffic, not HTTP, and is published directly on a dedicated port.

## Local development

Start the local TLS-enabled database:

```bash
./scripts/up-local.sh
```

The script creates `.env.database` from `.env.database.example`, starts
PostgreSQL on `127.0.0.1:5436`, and applies the tracked Prisma migrations. The
local checkout may remain at `~/projects/baby-sign-language`. Copy `.env.example`
to `.env.local` if the application is not already configured:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

To create a schema migration during development:

```bash
npx prisma migrate dev
```

Commit the generated directory under `prisma/migrations/`. Production runs
`prisma migrate deploy`; it never uses the development migration command.

## Database layout

The Compose stack contains only:

- PostgreSQL 16 with a persistent data volume.
- A persistent, automatically generated TLS certificate.
- `pg_hba.conf` rules that reject non-TLS TCP connections and allow only the
  configured client CIDRs plus the private Docker network.
- An on-demand Prisma migration image.

The server uses SCRAM password authentication and TLS 1.2 or newer. Local and
production instances use the same [docker-compose.yml](docker-compose.yml), with
different `.env.database` files.

## Deploy the database on EC2

This is independent of `hobby-traefik`; the proxy does not need a configuration
change or a shared Docker network.

First, choose a DNS name such as `db.example.com` and point it at the EC2 public
IP. Then clone and configure the database checkout:

```bash
git clone git@github.com:TheoGibbons/baby-sign-language.git ~/projects/baby-sign-language
cd ~/projects/baby-sign-language
cp .env.database.production.example .env.database
openssl rand -hex 32
nano .env.database
./scripts/deploy.sh
```

Put the generated password in `POSTGRES_PASSWORD`. Set `POSTGRES_TLS_HOST` to the
database DNS name and `POSTGRES_ALLOWED_CIDRS` to Vercel's static outbound IPs,
each suffixed with `/32`.

The deployment script:

1. Refuses placeholder credentials and unsafe public exposure unless explicitly
   acknowledged.
2. Fast-forwards the EC2 Git checkout.
3. Builds and starts PostgreSQL.
4. Writes a timestamped pre-migration dump under `backups/`.
5. Runs `prisma migrate deploy` and reports the published port.

### Network access

The recommended production setup requires Vercel's Static IPs add-on or Secure
Compute. Normal Vercel deployments use dynamic outbound addresses, which cannot
be safely expressed as a narrow EC2 allowlist. See Vercel's
[fixed-IP guidance](https://vercel.com/kb/guide/can-i-get-a-fixed-ip-address).

Configure the EC2 security group:

| TCP port | Source | Purpose |
|---|---|---|
| 22 | Administrator IP | SSH and deployment |
| 5436 | Vercel static egress IP(s) | Application database traffic |

Do not add port 5436 to `hobby-traefik`; it must be an ordinary EC2 TCP ingress
rule. Match the same `/32` addresses in `POSTGRES_ALLOWED_CIDRS`, giving two
independent enforcement layers.

If static egress is unavailable, setting both
`POSTGRES_ALLOWED_CIDRS=0.0.0.0/0` and `ALLOW_PUBLIC_DATABASE=true` permits Vercel's
dynamic addresses. This exposes the PostgreSQL login endpoint to the entire
internet and is explicitly not recommended. A managed serverless Postgres
service is safer in that situation.

### Configure Vercel

Set this environment variable in the Vercel project for Production. Use the
real password, database hostname, and port:

```dotenv
DATABASE_URL=postgresql://baby_signs:PASSWORD@db.example.com:5436/baby_signs?sslmode=require&connection_limit=1&pool_timeout=10&connect_timeout=10
```

The generated password is hexadecimal and therefore needs no URL encoding. If
you choose a password containing reserved URL characters, percent-encode them.

Use `sslmode=require`: the container refuses plaintext connections. The initial
certificate is self-signed, so this encrypts traffic but does not validate the
server's public identity. Static-IP allowlisting remains important. For strict
certificate verification, replace the generated certificate with one signed by
a trusted CA and provide Prisma with the CA certificate.

Select a Vercel function region close to the EC2 region to reduce query latency.
This is a direct database connection rather than a serverless connection pool;
`connection_limit=1` and the shared Prisma client in `src/lib/prisma.js` limit
connection growth. If traffic becomes bursty, add PgBouncer or move to a managed
Postgres offering with serverless pooling.

After saving the variable, redeploy the Vercel application. Preview deployments
should use a separate database or omit `DATABASE_URL`; do not point untrusted
preview branches at the production database.

## Push-to-deploy for database changes

`.github/workflows/deploy-database.yml` runs only when database infrastructure,
migrations, or its deployment scripts change. Create a GitHub environment named
`production` containing:

| Secret | Value |
|---|---|
| `EC2_HOST` | EC2 public DNS name or IP |
| `EC2_USER` | Deployment user, usually `ubuntu` |
| `EC2_SSH_PRIVATE_KEY` | Private deployment key |
| `EC2_KNOWN_HOSTS` | Verified SSH known-hosts entry |

The EC2 checkout needs a repository deploy key so `git pull --ff-only` succeeds.
Vercel continues deploying the application through its existing Git integration.
The workflow uses the same `~/projects/baby-sign-language` checkout path on EC2.

## Backups

Create an on-demand compressed PostgreSQL dump with:

```bash
./scripts/backup.sh
```

Backups are written to the ignored `backups/` directory with mode `0600`. Copy
them off the EC2 instance to S3 or another host and schedule the command with a
systemd timer or cron. A backup stored only on the same EC2 disk is not disaster
recovery.

The named volumes `baby-sign-language-database_database-data` and
`baby-sign-language-database_database-tls` survive `docker compose down`. Never
run `docker compose down -v` unless both the database and its generated TLS
material are intentionally being destroyed.

## Data utilities

Populate the sign records and export the search index when intentionally needed:

```bash
npm run populate-db
npm run export-sign-names
```

`public/static/data/sign-names.json` can be supplied to an LLM to generate
`public/static/data/sign-synonyms.json`; use only genuine synonyms mapped to
exact canonical sign names.

# Windows 11 production-local deployment

## Scope and safety

`docker-compose.production.yml` runs the active Arabic RTL expense tracker on a
single Windows 11 computer. It starts `web`, `api`, PostgreSQL, Redis, MinIO,
an idempotent private-bucket initializer, and a non-destructive Prisma migration
job. It does not start n8n, Telegram, backups, reports, or any new product
module.

The deployment reuses the existing Compose volume names:

- `claims-os_claims_postgres_data`
- `claims-os_claims_redis_data`
- `claims-os_claims_minio_data`

They persist across container, Docker Desktop, and normal Compose restarts.
Never use `docker compose down --volumes`, `pnpm infra:reset`, or `prisma migrate
reset` with application data. The supplied migration job uses only `prisma migrate
deploy`.

Before an update that includes a Prisma migration, make and verify a database and
attachment backup using the owner-approved process. Backup scheduling, Drive
location, retention, and restore rehearsal remain BKP-001 decisions; this
deployment does not invent them.

## Prerequisites

1. Install Docker Desktop with the WSL2 backend, start it, and enable its WSL
   integration for the distribution used to operate this repository.
2. In PowerShell, confirm `docker version` and `docker compose version` succeed.
3. Obtain a trusted, persistent registry source for the pinned MinIO and `mc`
   images if the default upstream registry does not serve them. Recent MinIO
   registry withdrawals mean some networks require the optional `MINIO_IMAGE`
   and `MINIO_MC_IMAGE` mirror overrides. Mirror the exact vetted images; do not
   substitute a different storage product or an unpinned `latest` tag.
4. Copy the template and choose unique secrets. Use URL-safe characters, or
   percent-encode special characters in `DATABASE_URL` and `REDIS_URL`.

```powershell
Copy-Item .env.production.example .env.production
notepad .env.production
```

Do not commit `.env.production`. Development `.env` files and
`docker-compose.yml` remain separate from this production-local configuration.

## Network model

The `frontend` Docker network contains `web` and `api`. The private `backend`
network contains `api`, PostgreSQL, Redis, MinIO, `minio-init`, and `migrate`.
The backend network is Docker-internal and has no Windows/LAN route. Only this
mapping is published:

```text
${WEB_BIND_ADDRESS}:${WEB_PORT} -> web:3000
```

The safe default is `127.0.0.1:3000`, accessible only from the Windows host.
The API uses `postgres`, `redis`, and `minio` Docker DNS names. The web server
uses `API_INTERNAL_URL=http://api:4000/api/v1`; no `NEXT_PUBLIC_*` variable
contains a service DNS name or credential.

## First start (host-only)

Keep the defaults below for a browser on the Windows machine:

```dotenv
WEB_BIND_ADDRESS=127.0.0.1
WEB_PORT=3000
WEB_PUBLIC_URL=http://localhost:3000
NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS=localhost:3000
```

Validate the resolved configuration before building. This command confirms that
only `web` has a `ports:` entry and that variables resolved as intended; inspect
the output without sharing secrets.

```powershell
pnpm prod:config
pnpm prod:build
pnpm prod:up
pnpm prod:status
```

`migrate` and `minio-init` are expected to show `Exited (0)` after successful
one-shot work. Long-running services should become `healthy`. Check readiness
from the web container (the API itself is intentionally not published):

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml exec web node -e "fetch('http://api:4000/api/v1/health/ready').then(r => { console.log(r.status); process.exit(r.ok ? 0 : 1) })"
```

Open `http://localhost:3000`. Upload/download an attachment through the Arabic
web application; MinIO is never opened to the browser.

## Private-LAN access

Choose the current host LAN address or, preferably, a stable LAN hostname. Do
not place a fixed address in source control. Then set all three values together:

```dotenv
WEB_BIND_ADDRESS=0.0.0.0
WEB_PORT=3000
WEB_PUBLIC_URL=http://192.168.x.y:3000
NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS=192.168.x.y:3000
```

Use the actual host address shown by:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' }
```

Create a firewall rule for the selected port on Private networks only; restrict
the remote subnet if known (example uses a typical private `/24` and must be
adapted to the real network):

```powershell
New-NetFirewallRule -DisplayName 'Claims OS private LAN web' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private -RemoteAddress 192.168.1.0/24
```

Restart the stack after changing build-time Web settings:

```powershell
pnpm prod:down
pnpm prod:up
```

On a phone or another computer on the same trusted Wi-Fi/LAN, browse to the
configured `WEB_PUBLIC_URL`. Do not create a Public-profile firewall rule or
port-forward the application to the internet. The app is unavailable while the
Windows host or Docker Desktop is stopped.

## Routine operations

```powershell
# Start/rebuild and wait for dependency ordering
pnpm prod:up

# Status and logs
pnpm prod:status
pnpm prod:logs

# Safe stop: preserves all named volumes
pnpm prod:down

# Apply the already-committed non-destructive migrations explicitly
pnpm prod:migrate

# View the resolved topology / check that only web is exposed
pnpm prod:config
```

For a safe application update: make/verify a backup, pull the reviewed source
change, review `.env.production` compatibility, run `pnpm prod:build`, then
`pnpm prod:up`, inspect `pnpm prod:status`, call the readiness command above,
and verify a project total plus an attachment. Do not change existing database
or object-store credentials after their volumes are initialized without an
explicit credential migration plan.

## Troubleshooting

- **MinIO image pull fails:** set `MINIO_IMAGE` and `MINIO_MC_IMAGE` to an
  owner-approved, pinned mirror of the documented images, then run
  `pnpm prod:config` again. Do not use `latest` or delete the MinIO volume.
- **`migrate` exits non-zero:** inspect `docker compose ... logs migrate`; fix
  connection/configuration issues and rerun `pnpm prod:migrate`. Do not reset
  the database.
- **API never becomes healthy:** inspect `docker compose ... logs api`; its
  readiness checks PostgreSQL, Redis, and the private bucket without exposing
  their credentials.
- **Phone cannot connect:** confirm both devices use the same trusted network,
  the browser URL exactly matches `WEB_PUBLIC_URL`, Windows Firewall is Private
  only, and `WEB_BIND_ADDRESS=0.0.0.0`. Do not expose API, database, Redis, or
  MinIO ports to troubleshoot.
- **A Server Action origin is rejected:** add the exact browser host and port
  (no scheme) to `NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS`, rebuild with
  `pnpm prod:up`, and keep `WEB_PUBLIC_URL` and API CORS aligned.

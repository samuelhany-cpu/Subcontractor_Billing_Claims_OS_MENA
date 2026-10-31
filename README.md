# Local Project Expense Tracker

This monorepo contains the Next.js web application, NestJS API, shared packages,
and local infrastructure for a single-user, Arabic-only project expense tracker
hosted on a Windows computer and available on its private LAN.

The source requirements and implementation order begin at
[`docs/00_README.md`](docs/00_README.md).

For the complete Windows Docker Desktop deployment (including private-LAN
access and persistent-volume safety), see
[`docs/engineering/04_WINDOWS_LOCAL_DEPLOYMENT.md`](docs/engineering/04_WINDOWS_LOCAL_DEPLOYMENT.md).

## Prerequisites

- Node.js 20.11 or later
- Corepack and pnpm 10.19.0
- Docker Desktop or Docker Engine with Compose
- PowerShell 7 or a POSIX-compatible shell for the examples below

Prisma is pinned to 6.19.3 because it supports the repository's Node 20
baseline. The root pnpm policy allows lifecycle scripts only for Prisma and its
engine package.

## First-time setup

Enable the package manager and install the exact lockfile:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Create local environment files from the safe development templates:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The templates contain development-only placeholders. Do not reuse them in a
shared, staging, or production environment. Local `.env` files are ignored by
Git.

## Local infrastructure

Start PostgreSQL, Redis, MinIO, and the one-shot private bucket initializer:

```bash
pnpm infra:up
pnpm infra:status
pnpm infra:check
```

The default loopback-only development service addresses are:

| Dependency               | Address                 |
| ------------------------ | ----------------------- |
| PostgreSQL               | `localhost:55432`       |
| Redis                    | `localhost:6379`        |
| MinIO S3 API             | `http://localhost:9000` |
| MinIO management console | `http://localhost:9001` |

Use the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` values from the local root
`.env` file to sign into the console. The configured object-storage bucket is
private and is created idempotently by `minio-init`.

View status or logs and stop services without deleting their named volumes:

```bash
pnpm infra:status
pnpm infra:logs
pnpm infra:down
```

Normal stop/start operations preserve PostgreSQL, Redis, and MinIO data.

To intentionally destroy all local infrastructure data, run the explicitly
destructive command:

```bash
pnpm infra:reset
```

Never run `infra:reset` against data that has not been backed up.

## Applications

After infrastructure is healthy, run the applications in separate terminals:

```bash
pnpm dev:api
pnpm dev:web
```

Default addresses:

- API: `http://localhost:4000/api/v1`
- Web scaffold: `http://localhost:3000`

The API currently exposes diagnostics only:

| Endpoint                   | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `GET /api/v1/health/live`  | Fast process liveness; never calls external dependencies |
| `GET /api/v1/health/ready` | PostgreSQL, Redis, and object-storage readiness          |

Readiness returns HTTP 200 only when every check is `up`; otherwise it returns
HTTP 503 with sanitized dependency states.

```bash
curl -i http://localhost:4000/api/v1/health/live
curl -i http://localhost:4000/api/v1/health/ready
```

## Runtime configuration

API configuration is validated at startup and injected as an immutable typed
object. Invalid URLs, ports, booleans, empty credentials, and production use of
documented local defaults fail before the application listens.

Database, Redis, and object-storage credentials are server-only. The web
template contains only `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL`. Never
place a server credential in a variable prefixed with `NEXT_PUBLIC_`.

The standalone connectivity check reports dependency names and readiness only;
it never logs connection strings, access keys, secret keys, or signed URLs.
It loads the committed development placeholders from
`apps/api/.env.test.example`; explicitly supplied process variables take
precedence, so customized local dependency credentials can be tested without
committing a local `.env`.

## Request correlation and logs

Every API response includes `x-correlation-id`. A caller value is preserved
when it is 1–128 characters, starts with an alphanumeric character, and
contains only letters, digits, `.`, `_`, `:`, or `-`; missing or invalid values
are replaced with a UUID. This identifier is diagnostic context, never an
authorization credential.

Pino emits structured records with service, environment, event, timestamp, and
correlation context. `LOG_LEVEL` selects the threshold. `LOG_FORMAT=json` is
the default and is mandatory in production; `LOG_FORMAT=pretty` is an explicit
local-development option. `REQUEST_LOGGING=false` disables completion records
without disabling correlation. Successful diagnostics traffic logs at debug
to reduce probe noise.

Request/response bodies are not logged. Authorization, cookies,
password/token/key/secret fields, connection URLs, and signed URLs are
redacted. Unexpected errors return RFC 7807 details with a correlation ID and
never expose stack traces or raw dependency errors.

## Quality and test commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter ./apps/api test:e2e
pnpm build
```

Docker-backed connectivity is deliberately separate from unit and API smoke
tests:

```bash
pnpm infra:check
pnpm --filter ./apps/api test:infra
```

## Troubleshooting

- If Docker commands cannot connect, start Docker Desktop or the Docker daemon.
- If a port is already in use, change the corresponding port in the root
  `.env`, then update the matching URL in `apps/api/.env`.
- If configuration validation fails, compare the named field with
  `apps/api/.env.example`; errors never echo secret values.
- If MinIO is healthy but the bucket is missing, inspect
  `docker compose logs minio-init` and rerun `pnpm infra:up`.
- If readiness is HTTP 503, run `pnpm infra:status`, `pnpm infra:check`, and
  inspect project-owned logs with `pnpm infra:logs`. The response intentionally
  identifies only which dependency is down.
- If local credentials were changed after volumes were created, use the
  previous credentials or intentionally reset local data with
  `pnpm infra:reset`.
- `pnpm install` is expected to run lifecycle scripts only for
  `@prisma/engines` and `prisma`. Do not broaden the allowlist.

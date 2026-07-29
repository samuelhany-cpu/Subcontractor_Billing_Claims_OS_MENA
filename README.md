# Subcontractor Billing & Claims OS for MENA

This monorepo contains the Next.js web application, NestJS API, shared packages,
and local infrastructure for the bilingual Subcontractor Billing & Claims OS.
The source requirements and implementation order begin at
[`docs/00_README.md`](docs/00_README.md).

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

The default loopback-only service addresses are:

| Dependency               | Address                 |
| ------------------------ | ----------------------- |
| PostgreSQL               | `localhost:55432`       |
| Redis                    | `localhost:6379`        |
| MinIO S3 API             | `http://localhost:9000` |
| MinIO management console | `http://localhost:9001` |

Use the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` values from the local root
`.env` file to sign into the console. The `claims-documents-local` bucket is
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

- API scaffold: `http://localhost:4000`
- Web scaffold: `http://localhost:3000`

FOUND-001B does not add the complete health API or business endpoints.

## Runtime configuration

API configuration is validated at startup and injected as an immutable typed
object. Invalid URLs, ports, booleans, empty credentials, and production use of
documented local defaults fail before the application listens.

Database, Redis, and object-storage credentials are server-only. The web
template contains only `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL`. Never
place a server credential in a variable prefixed with `NEXT_PUBLIC_`.

The standalone connectivity check reports dependency names and readiness only;
it never logs connection strings, access keys, secret keys, or signed URLs.

## Quality and test commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @claims-os/api test:e2e
pnpm build
```

Docker-backed connectivity is deliberately separate from unit and API smoke
tests:

```bash
pnpm infra:check
```

## Troubleshooting

- If Docker commands cannot connect, start Docker Desktop or the Docker daemon.
- If a port is already in use, change the corresponding port in the root
  `.env`, then update the matching URL in `apps/api/.env`.
- If configuration validation fails, compare the named field with
  `apps/api/.env.example`; errors never echo secret values.
- If MinIO is healthy but the bucket is missing, inspect
  `docker compose logs minio-init` and rerun `pnpm infra:up`.
- If local credentials were changed after volumes were created, use the
  previous credentials or intentionally reset local data with
  `pnpm infra:reset`.
- `pnpm install` is expected to run lifecycle scripts only for
  `@prisma/engines` and `prisma`. Do not broaden the allowlist.

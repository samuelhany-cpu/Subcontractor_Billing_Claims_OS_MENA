# FOUND-001B — Local infrastructure and runtime configuration

## Scope and requirements

This slice implements the local PostgreSQL, Redis, and private S3-compatible
storage foundation plus typed runtime validation. It covers foundation portions
of NFR-024, NFR-026, NFR-050, NFR-052, NFR-054, and NFR-062.

No authentication, tenant data, business tables, migrations, queues, financial
logic, complete health endpoints, or document workflows were introduced.

## Infrastructure decisions

- PostgreSQL: `postgres:16.14-alpine`, host `127.0.0.1:55432`, container `5432`.
- Redis: `redis:7.4.10-alpine`, password-protected, AOF enabled, host
  `127.0.0.1:6379`.
- MinIO: `minio/minio:RELEASE.2025-09-07T16-13-09Z-cpuv1`, host API `9000`,
  console `9001`.
- MinIO client: `minio/mc:RELEASE.2025-08-13T08-35-41Z-cpuv1`.
- The one-shot initializer creates `claims-documents-local` idempotently and
  explicitly sets anonymous access to private.
- Named volumes persist all three dependencies across ordinary `down`/`up`.
- All published ports bind to loopback only. Compose service names provide
  internal container networking.

Port 5432 was already owned by an unrelated local process during the first live
run. The project host port was therefore changed reversibly to 55432; the
container/network port remains the PostgreSQL standard 5432.

## Runtime configuration

Zod validates runtime mode, host, port, public URLs, CORS origins, log level,
PostgreSQL and Redis protocols, object-storage endpoint/region/bucket,
non-empty credentials, and strict booleans. The secure-storage flag must match
the endpoint protocol. Production rejects documented local database, endpoint,
and object-storage defaults.

Nest receives one immutable typed configuration token. Infrastructure providers
do not read `process.env` directly. Redacted diagnostic configuration replaces
database/Redis URLs and both object-storage credentials. The browser projection
contains only application and API URLs.

## Adapter decisions

- Prisma 6.19.3 is pinned because the workspace Node 20.14 runtime is below
  Prisma 7's documented Node 20.19 minimum. Prisma uses the PostgreSQL driver
  adapter and a schema with no domain models.
- The root pnpm lifecycle allowlist contains only `prisma` and
  `@prisma/engines`. The blocked `@prisma/client` postinstall is unnecessary
  because typecheck and build explicitly run deterministic client generation.
- PostgreSQL and Redis connections are controlled/lazy, idempotent, injectable,
  and closed on application shutdown.
- The storage adapter uses the AWS S3 contract, generates UUID object keys,
  supports private put/get/delete, limits signed reads to 15 minutes, and never
  exposes MinIO-specific behavior to domain code.
- Dependency errors translate to dependency names only and discard provider
  messages that may contain credentials.

## Environment variables

API variables: `NODE_ENV`, `API_HOST`, `API_PORT`, `API_PUBLIC_URL`, `WEB_URL`,
`CORS_ORIGINS`, `LOG_LEVEL`, `DATABASE_URL`, `REDIS_URL`,
`OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_BUCKET`,
`OBJECT_STORAGE_ACCESS_KEY`, `OBJECT_STORAGE_SECRET_KEY`,
`OBJECT_STORAGE_SECURE`, and `OBJECT_STORAGE_FORCE_PATH_STYLE`.

Web variables: `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` only.

Compose variables are documented in the root `.env.example`. All values are
explicit development placeholders and local `.env` files remain ignored.

## Deferred scope

The complete `/api/v1/health` surface, request correlation, structured logging,
queue readiness, localization shell, domain schema, and production deployment
configuration remain separate bounded tasks.

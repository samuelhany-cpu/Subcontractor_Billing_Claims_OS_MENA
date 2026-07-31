# Local Project Expense Tracker API

The NestJS API is versioned under `/api/v1`. FOUND-001C exposes only the public,
read-only diagnostics routes:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

Liveness has no dependency coupling. Readiness checks PostgreSQL, Redis, and
private S3-compatible storage concurrently, bounds each check with
`HEALTH_CHECK_TIMEOUT_MS`, and returns HTTP 503 if any check is down.

All responses carry `x-correlation-id`. Structured logs are JSON by default;
pretty output must be explicitly configured for local development and is
rejected in production. Never add request bodies, response bodies, credentials,
signed URLs, or commercial data to ordinary request logs.

Run isolated tests without Docker:

```bash
pnpm --filter ./apps/api test
pnpm --filter ./apps/api test:e2e
```

Run the real-adapter readiness test only after `pnpm infra:up`:

```bash
pnpm --filter ./apps/api test:infra
```

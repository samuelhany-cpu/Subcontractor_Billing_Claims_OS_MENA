# FOUND-001B Test Report

Date: 2026-07-29

## Environment

- Docker Engine: 29.5.3
- Docker Compose: 5.1.4
- pnpm: 10.19.0
- Node.js: 20.14.0

## Passing validation

| Command                                 | Result                                                              |
| --------------------------------------- | ------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`        | Passed; lockfile current and only Prisma engine/CLI scripts trusted |
| `pnpm format:check`                     | Passed                                                              |
| `pnpm lint`                             | Passed                                                              |
| `pnpm typecheck`                        | Passed                                                              |
| `pnpm test`                             | Passed: 25 API tests and one domain test                            |
| `pnpm --filter @claims-os/api test:e2e` | Passed: API smoke test without live dependency coupling             |
| `pnpm build`                            | Passed for API, web, domain, and UI                                 |
| `docker compose config`                 | Passed with explicit pinned images and loopback ports               |
| `pnpm infra:up`                         | Passed after changing the project host PostgreSQL port to 55432     |
| `pnpm infra:status`                     | PostgreSQL, Redis, and MinIO healthy; initializer exited 0          |
| `pnpm infra:check`                      | Passed before and after restart; all dependencies ready             |
| `pnpm infra:down`                       | Passed; named volumes preserved                                     |

## Live infrastructure evidence

- PostgreSQL accepted Prisma `SELECT 1`.
- Redis returned `PONG`.
- MinIO accepted an authenticated private-bucket readiness check.
- MinIO initializer reported the bucket access permission as private.
- The PostgreSQL, Redis, and MinIO named-volume identities and creation times
  were unchanged across a normal `down`/`up` cycle.
- The final `infra:down` removed containers and the network but not volumes.

## Tests added

- Valid environment parsing and documented defaults.
- Missing database URL, invalid Redis protocol, invalid storage endpoint, empty
  access/secret keys, invalid port, invalid boolean, secure-protocol mismatch,
  and production-local-default rejection.
- Secret redaction and browser-safe configuration projection.
- PostgreSQL and Redis controlled connection and clean-shutdown lifecycles.
- PostgreSQL, Redis, and S3 error translation without provider detail leakage.
- Private object upload/read/delete, server-generated keys, bucket readiness,
  and signed-read expiry limits.

## Failures resolved

- The initial `infra:up` found host port 5432 already allocated by an unrelated
  service. No external process was stopped; this project now defaults to 55432.
- Prisma 7 generation failed because Node 20.14 is below Prisma 7's documented
  Node 20.19 minimum. Prisma was pinned to compatible security-fix release
  6.19.3.
- An initial parallel gate run caused Windows Prisma generator file contention
  and Next.js memory exhaustion. Sequential final typecheck/build runs pass.
- Initial strict lint and validation-test findings were corrected; no checks
  were bypassed.

## Non-blocking observations

- The AWS SDK warns that releases published after the first week of January
  2027 will require Node 22. Current pinned packages run successfully on the
  repository's Node 20 baseline. A planned runtime upgrade should precede that
  support deadline.
- `@prisma/client` postinstall remains blocked intentionally; explicit
  `prisma generate` in typecheck/build makes it unnecessary.

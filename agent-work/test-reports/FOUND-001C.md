# FOUND-001C — Test Report

## Result

FOUND-001C acceptance checks pass. No implementation gap was found. The two missing task records were added during REPO-001; no business behavior was introduced.

## Acceptance evidence

| Capability               | Evidence                                                                                      | Result |
| ------------------------ | --------------------------------------------------------------------------------------------- | ------ |
| Versioned liveness       | E2e request to `/api/v1/health/live`; unit test proves no dependency calls                    | Pass   |
| Readiness status         | Unit/e2e tests cover all-up, individual/multiple failures, timeout, concurrency, HTTP 200/503 | Pass   |
| PostgreSQL readiness     | Live `SELECT 1` adapter check through infrastructure suite                                    | Pass   |
| Redis readiness          | Live `PING` plus controlled unavailable Redis returning sanitized 503                         | Pass   |
| Object-storage readiness | Live private-bucket `HeadBucket` adapter check                                                | Pass   |
| Correlation ID           | Preserved caller IDs, generated UUIDs, invalid input replacement, parallel isolation          | Pass   |
| Structured logging       | Pino configuration, event fields, route/status/duration levels                                | Pass   |
| Sensitive-data redaction | Credentials, cookies, tokens, connection/signed URLs, errors, circular objects                | Pass   |
| Centralized errors       | Correlated RFC 7807 expected and generic unexpected responses                                 | Pass   |
| Graceful shutdown        | Shutdown hooks, lifecycle events, PostgreSQL/Redis/S3 cleanup unit/live evidence              | Pass   |
| Documentation            | Root/API usage, old OpenAPI diagnostics contract, implementation note, test report            | Pass   |

## Commands and results

| Command                                                                                                         | Result                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm exec prettier --write agent-work/implementation-notes/REPO-001-change-classification.md`                  | Classification formatted                                                                |
| `pnpm --filter @claims-os/api test -- --runInBand`                                                              | Command-shape error: literal `--` made Jest treat the option as a pattern; no tests ran |
| `pnpm --filter @claims-os/api exec jest --runInBand`                                                            | Pass: 12 suites, 67 tests                                                               |
| `pnpm --filter @claims-os/api test:e2e`                                                                         | Pass: 1 suite, 8 tests                                                                  |
| `docker compose ps` before daemon startup                                                                       | Expected environment failure: Docker Desktop was not running                            |
| Docker Desktop startup and `docker info`                                                                        | Pass: daemon 29.5.3 ready                                                               |
| `pnpm infra:up`                                                                                                 | Pass: PostgreSQL, Redis, MinIO running; MinIO healthy                                   |
| `pnpm infra:check`                                                                                              | Pass: PostgreSQL, Redis, object storage ready                                           |
| `pnpm --filter @claims-os/api test:infra`                                                                       | Pass: 1 suite, 2 tests; Jest emitted a late-handle timing warning                       |
| `pnpm --filter @claims-os/api exec jest --config test/jest-infrastructure.json --runInBand --detectOpenHandles` | Pass: 1 suite, 2 tests; no open handle reported                                         |
| `pnpm format:check`                                                                                             | Pass                                                                                    |
| `pnpm lint`                                                                                                     | Pass                                                                                    |
| `pnpm typecheck`                                                                                                | Pass                                                                                    |

## Counts

- API unit: 67 passed, 0 failed, 0 skipped.
- API e2e: 8 passed, 0 failed, 0 skipped.
- Live infrastructure: 2 passed, 0 failed, 0 skipped.
- Total FOUND-001C-specific/API checks in these suites: 77 passed.

## Warnings

The AWS SDK emitted its forward-looking Node support warning. It did not affect test results and requires no dependency change inside FOUND-001C.

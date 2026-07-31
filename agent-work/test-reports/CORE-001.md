# CORE-001 — Test report

## Result

CORE-001 passes all repository, Prisma, migration, persistence, constraint, audit, security, and scope gates.

## Final commands and results

- pnpm install --frozen-lockfile — pass; lockfile current.
- pnpm format:check — pass.
- pnpm lint — pass.
- pnpm typecheck — pass; strict workspaces and Prisma generation.
- pnpm test — pass; API 15 suites/87 tests plus 1 domain test.
- pnpm --filter @claims-os/api test:e2e — pass; 1 suite/8 tests.
- pnpm build — pass.
- docker compose config — pass.
- pnpm infra:up — pass.
- pnpm infra:check — pass; PostgreSQL, Redis, and MinIO ready.
- Both required prisma validate commands — pass.
- Required prisma generate command — pass.
- pnpm --filter @claims-os/api test:database — pass; 1 suite/10 tests.
- pnpm infra:down — pass; repository Compose services stopped.
- git diff --check — pass.

## Test counts

- Workspace unit tests: 88 passed (87 API and 1 shared-domain), 0 failed, 0 skipped.
- New CORE-001 unit tests: 20 passed (5 schema, 10 decimal, 5 audit).
- API e2e: 8 passed, 0 failed, 0 skipped.
- Database integration: 10 passed, 0 failed, 0 skipped.
- Migration lifecycle validations: 4 passed—empty deploy, second no-op deploy, clean status, and empty schema diff.

## Database coverage

Verified all approved tables, indexes, unique constraints, checks, foreign keys, decimal precision, date-only types, empty counts, restrictive deletion, soft deletion, and audit immutability.

Exact round trips cover 0.10, 0.20, 0.30, 521310.00, four-place quantity/unit price, and 9999999999999999.99. Date-only data round-trips without a day shift.

Tests reject zero/negative expense, transfer, and agreement values and all requested duplicates. Tests accept optional payee phone/company, null import category/payee, archived records, soft-deleted records, and data from which a negative balance can later be derived.

Audit tests cover append, transactions, before/after JSON, Decimal strings, secret redaction, correlation IDs, lack of service update/delete methods, and database rejection of UPDATE/DELETE.

## Policy scans

- Tracked runtime .env files: 0.
- Strong secret/private-key patterns: 0.
- Explicit application any annotations: 0.
- Skipped/todo tests: 0.
- parseFloat, Math.round, or Number financial paths: 0.
- Forbidden models: 0.
- Migration INSERT statements: 0.
- Active Claims/auth/tenant/RBAC/accounting models: 0.
- Active/documented Prisma schemas: exact match.

## Corrections during implementation

The Windows harness was changed from a .cmd spawn to pnpm's native executable. PostgreSQL catalog name fields were cast to text for the PG adapter. Lint removed one stale variable. E2E identified that AuditService had been exported before provider registration; it was registered and the complete final suite was rerun successfully.

These were implementation-time corrections. The final run has no failing checks.

## Non-failing warnings

pnpm continues intentionally ignoring the @prisma/client lifecycle script; explicit generation passes. The existing AWS SDK warns that future releases after early January 2027 require Node 22; pinned dependencies pass with repository Node 20.14.0.

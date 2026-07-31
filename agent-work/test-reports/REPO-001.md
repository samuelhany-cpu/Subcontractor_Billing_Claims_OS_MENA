# REPO-001 — Test Report

## Result

FOUND-001C and PIVOT-001 were separated into focused commits and the complete post-separation quality suite passes. No business-domain implementation was added and CORE-001 was not started.

## Full validation

| Command/check                                                              | Result                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                           | Pass; lockfile current across six workspaces              |
| `pnpm format:check`                                                        | Pass                                                      |
| `pnpm lint`                                                                | Pass                                                      |
| `pnpm typecheck`                                                           | Pass; strict workspace checks and Prisma generation       |
| `pnpm test`                                                                | Pass; 12 API suites / 67 tests plus 1 shared-domain test  |
| `pnpm --filter @claims-os/api test:e2e`                                    | Pass; 1 suite / 8 tests                                   |
| `pnpm build`                                                               | Pass; API, web, domain, and UI (Turbo cache hits allowed) |
| `docker compose config`                                                    | Pass                                                      |
| `pnpm infra:up`                                                            | Pass; PostgreSQL, Redis, MinIO running; MinIO healthy     |
| `pnpm infra:check`                                                         | Pass; all three dependencies ready                        |
| `pnpm --filter @claims-os/api test:infra`                                  | Pass; 1 suite / 2 tests                                   |
| Infrastructure Jest with `--detectOpenHandles`                             | Pass; 1 suite / 2 tests, no handle reported               |
| Live Prisma `validate`                                                     | Pass; intentionally model-free schema                     |
| Reference Prisma `validate`                                                | Pass; expense-tracker documentation schema valid          |
| Prisma 6 `migrate diff --from-empty --to-schema-datamodel ... --exit-code` | Pass; no difference detected                              |
| `git diff --check` and `git diff --cached --check`                         | Pass before each commit and after separation              |

## Test counts

- Workspace unit tests: 68 passed, 0 failed, 0 skipped.
- API e2e: 8 passed, 0 failed, 0 skipped.
- Live infrastructure: 2 passed, 0 failed, 0 skipped.
- Total executed test assertions across these suites: 78 passed.

## Policy and consistency checks

| Check                                                                          | Result                                                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Live Prisma model declarations                                                 | 0                                                                     |
| Legacy Claims/BOQ/payment-application/auth/tenant/RBAC/membership source paths | 0                                                                     |
| Explicit TypeScript `any` annotations                                          | 0; five `expect.any(...)` Jest matcher calls are not type annotations |
| Skipped test declarations                                                      | 0                                                                     |
| Tracked runtime `.env` files                                                   | 0; safe `.env.example` templates remain tracked                       |
| Strong access-token/private-key signatures                                     | 0                                                                     |
| Active legacy-planning filenames                                               | 0                                                                     |
| Root/API/docs product identity                                                 | Local Project Expense Tracker                                         |
| Claims archive entry point                                                     | Present                                                               |
| CORE-001 implementation                                                        | Not started                                                           |

## Non-failing warnings and command corrections

- The AWS SDK warns that releases published after early January 2027 will require Node 22; current Node 20.14.0 validation passes against the pinned dependencies.
- `@prisma/client` lifecycle scripts remain intentionally ignored; deterministic generation during typecheck/build passes.
- `pnpm --filter @claims-os/api test -- --runInBand` passed a literal separator to Jest and ran zero tests. `pnpm --filter @claims-os/api exec jest --runInBand` then ran and passed all 67 API unit tests.
- Docker was initially unavailable because Docker Desktop was stopped. After startup, daemon 29.5.3 and all live adapter checks passed.

## Commit evidence

- FOUND-001C: `1110186`
- PIVOT-001: `9c462f2`
- REPO-001: this maintenance commit; final hash is reported after creation.

After this report is committed, the final checks are `git status --short` (no output) and `git log --oneline --decorate -5` (three new commits above FOUND-001B).

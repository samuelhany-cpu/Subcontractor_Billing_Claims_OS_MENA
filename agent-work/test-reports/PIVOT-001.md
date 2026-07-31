# PIVOT-001 — Test Report

## Result

PIVOT-001 documentation, planning, and repository-alignment checks pass. REPO-001 reviewed and committed FOUND-001C separately before staging the focused pivot state. The repository quality suite passes after two behavior-preserving test lint fixes that belong to FOUND-001C.

## Quality gates

| Gate                         | Result               | Evidence                                                                                                                                                                       |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frozen install               | Pass                 | `pnpm install --frozen-lockfile`; lockfile current across six workspace projects                                                                                               |
| Format                       | Pass                 | `pnpm format:check`; initial failure was limited to three new PIVOT markdown files, then passed after Prettier                                                                 |
| Lint                         | Pass                 | `pnpm lint`; initial inherited test errors were corrected with mock-call assertions and contextual Nest application typing                                                     |
| Strict typecheck             | Pass                 | `pnpm typecheck`; four workspace typecheck tasks passed and Prisma Client generated                                                                                            |
| Unit tests                   | Pass                 | `pnpm test`; 12 API suites / 67 API tests plus one shared-domain boundary test passed                                                                                          |
| API e2e                      | Pass                 | `pnpm --filter ./apps/api test:e2e`; 1 suite / 8 tests passed                                                                                                                  |
| Production build             | Pass                 | `pnpm build`; API, web, domain, and UI builds passed                                                                                                                           |
| Live Prisma schema           | Pass                 | `prisma validate`; the live schema remains valid and contains no domain models                                                                                                 |
| Migration check              | Pass                 | Prisma 6 `migrate diff --from-empty --to-schema-datamodel ... --exit-code`; no difference detected                                                                             |
| Reference Prisma schema      | Pass                 | `prisma validate --schema ../../docs/schemas/schema.prisma`; valid documentation-only reference schema                                                                         |
| Docker Compose config        | Pass                 | `docker compose config --quiet`                                                                                                                                                |
| Diff whitespace              | Pass                 | `git diff --check`                                                                                                                                                             |
| Archive completeness         | Pass                 | All 39 prior docs exist in the required archive; 38 match HEAD blobs exactly and archived `schemas/openapi.yaml` preserves pre-existing uncommitted health/readiness additions |
| Active legacy business paths | Pass                 | No Claims/BOQ/payment-application/tenant/auth/RBAC/membership/certificate/retention/variation source path exists under `apps/` or `packages/`                                  |
| Clean worktree               | Resolved by REPO-001 | FOUND-001C was committed first; remaining pivot and REPO records are committed separately                                                                                      |
| Focused commit               | Pass                 | PIVOT-001 is staged only after FOUND-001C and excludes REPO-001 records                                                                                                        |

## Corrections made during verification

- Replaced unbound Jest method assertions in `redis.service.spec.ts` with direct mock-call assertions.
- Added contextual `INestApplication<App>` typing to the secondary infrastructure-test application.
- No runtime behavior or business-domain logic changed.

## Warnings

- API e2e emitted the AWS SDK notice that releases published after early January 2027 will require Node 22. The current run on Node 20.14.0 passed and matches the repository's existing Node 20 baseline.
- The first migration-diff attempt used the newer Prisma option `--to-schema`; it failed at CLI parsing only. The version-correct Prisma 6 option `--to-schema-datamodel` passed with no difference.

## Forbidden-scope verification

No project, category, payee, agreement, expense, transfer, audit, import, automation, or backup table was added to the live Prisma schema. No authentication, tenancy, RBAC, Telegram workflow, parser provider, connectivity method, paid service, OCR, tax, or accounting behavior was implemented or selected.

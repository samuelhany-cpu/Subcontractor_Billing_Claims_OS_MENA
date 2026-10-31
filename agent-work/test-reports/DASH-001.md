# DASH-001 Test Report

## Scope

Stabilization of global and project dashboards on current `master`, including Prisma generation ordering in CI and backend aggregation correctness.

## Verification results

| Gate                          | Result                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`           | PASS                                                                                                     |
| Prisma generation before lint | PASS                                                                                                     |
| `pnpm lint`                   | PASS; existing frontend unused-parameter and transfer-test suppression warnings remain, with zero errors |
| `pnpm typecheck`              | PASS                                                                                                     |
| `pnpm test`                   | PASS; API 25 suites / 143 tests, web 16 files / 37 tests, domain 17 tests                                |
| `pnpm build`                  | PASS                                                                                                     |

## Focused backend coverage

- Exact Decimal category/payee/expense/transfer amounts.
- Unclassified expense grouping.
- `deletedAt: null` filters on all dashboard aggregation/activity queries.
- Archived projects retain dashboard analytics while global totals remain active-project scoped.
- Empty datasets return stable zero totals and 12 zero-value weekly buckets.
- Monday week boundaries use the Africa/Cairo calendar across UTC midnight.

## CI stabilization

The Quality workflow now runs Prisma Client generation and `pnpm --filter @claims-os/domain build` after dependency installation and before lint. The clean artifact-free reproduction produced 513 API lint errors; the domain build removes the unresolved `@claims-os/domain` declaration cascade. ESLint and TypeScript rules were not weakened. The transfer mock typing issue was corrected so strict typecheck also passes.

## Scope boundary

No RPT-001 work, financial-rule changes, schema migration, backup behavior, or unrelated product changes were introduced.

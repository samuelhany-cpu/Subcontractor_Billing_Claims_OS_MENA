# Database development

The active Prisma contract is `schema.prisma` and must remain aligned with `../../../docs/schemas/schema.prisma`.

## Safe commands

- Validate: `pnpm --filter @claims-os/api exec prisma validate --schema prisma/schema.prisma`
- Generate: `pnpm --filter @claims-os/api exec prisma generate --schema prisma/schema.prisma`
- Isolated migration and persistence suite: `pnpm --filter @claims-os/api test:database`

The database suite creates a uniquely named local PostgreSQL database, applies migrations twice, checks migration status and schema diff, runs integration tests, and drops only that generated database. It does not reset or modify the normal local development database.

## CORE-001 migration

`20260801000000_expense_tracker_foundation` creates the approved Local Project Expense Tracker tables and enums without seed data. Its custom SQL adds positive-value checks for expenses, transfers, and agreements, plus a trigger that rejects updates and deletes against `AuditEvent`. Isolated cleanup can still drop the temporary database.

Financial columns use PostgreSQL `decimal`: money is `(18,2)` and quantity/unit price are `(18,4)`. TypeScript code must use the centralized Prisma Decimal helpers under `src/shared/decimal`; JavaScript numbers and `parseFloat` are not persistence paths.

Never use a destructive reset against a database that may contain user data. Add future migrations rather than rewriting committed migration history.

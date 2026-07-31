# Execution State

- Current phase: Repository pivot complete
- Current task: PIVOT-001 — Repository alignment
- Requirement IDs: PIVOT-001
- Status: Complete; focused commit separated from FOUND-001C by REPO-001
- Completed foundation: FOUND-001A commit `648f7b5`; FOUND-001B commit `5669b7f`; FOUND-001C commit `1110186`
- Open decisions: OPEN-001 through OPEN-005 remain unresolved and unchanged
- Current quality gates: Frozen install, format, lint, strict typecheck, unit tests, API e2e, build, Prisma validation/migration diff, Compose config, and diff check pass
- Next eligible task: CORE-001 — Database foundation (not started)

## Dependency-ordered implementation queue

1. `CORE-001` — Prisma models, migrations, decimal configuration, and audit foundation.
2. `PRJ-001` — Projects, opening balances, archive/restore, and project selection.
3. `CAT-001` — Categories, subcategories, deactivation, ordering, and unclassified support.
4. `PAY-001` — Payees and one agreement per payee/project with derived totals.
5. `EXP-001` — Expense entry, exact calculation rules, lists, filters, and attachments.
6. `TRF-001` — Incoming transfers and project funding totals.
7. `EXP-002` — Expense recycle bin, restore, and audit views.
8. `DASH-001` — Global and project dashboards.
9. `RPT-001` — Date-range reports and one-sheet Excel export.
10. `IMP-001` — Legacy and organized Excel preview/commit/import reporting.
11. `TEL-001` — Provider-neutral automation APIs and idempotent drafts.
12. `TEL-002` — n8n workflows; live activation remains gated by OPEN-001 and OPEN-002.
13. `BKP-001` — Backup package, Google Drive workflow, and restore rehearsal; scheduling remains gated by OPEN-003 through OPEN-005.
14. `REL-001` — Windows/LAN production-local release and full acceptance suite.

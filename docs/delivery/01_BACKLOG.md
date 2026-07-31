# Delivery Backlog

The target is the full scoped application, delivered incrementally.

## PIVOT-001 — Repository alignment

- Preserve completed foundation.
- Archive old Claims docs.
- Replace docs with this pack.
- Rename product references.
- Remove planned tenancy/auth/RBAC scope.
- Verify no Claims domain code is active.

## CORE-001 — Database foundation

- Implement Prisma models and migrations.
- Seed no invented categories; allow setup/import to create them.
- Decimal configuration.
- Audit infrastructure.
- Migration tests.

## PRJ-001 — Projects

- CRUD.
- Opening balance.
- Archive/restore.
- Project selector.

## CAT-001 — Categories

- Category/subcategory management.
- Reorder/deactivate.
- Unclassified support.

## PAY-001 — Payees and agreements

- Payee CRUD.
- Optional phone/company.
- Agreement total and derived paid/remaining.

## EXP-001 — Expenses

- List, filters, search.
- Create/edit.
- Calculation rules.
- Optional attachment.
- Source tracking.

## EXP-002 — Recycle bin and audit

- Soft delete.
- Restore.
- Audit views.

## TRF-001 — Incoming transfers

- Date/amount.
- Edit/delete/restore.
- Funding totals.

## DASH-001 — Dashboard

- Global and project dashboards.
- Cards, charts, top payees, recent activity.

## RPT-001 — Reports and Excel export

- Daily/weekly/monthly/custom.
- One-sheet export.
- Organized columns.

## IMP-001 — Legacy/current Excel import

- Preview.
- Mapping.
- Validation.
- Commit.
- Duplicate handling.
- Import report.

## TEL-001 — Automation API

- Drafts.
- Idempotent confirmation.
- Query endpoints.
- Last-expense endpoints.
- Binary export endpoint.

## TEL-002 — n8n workflows

- Chat restriction.
- Arabic conversation.
- Confirmation.
- Supported intents.
- Optional images.
- Error handling.
- Connectivity decision must be resolved first.

## BKP-001 — Daily backup

- Backup package.
- Google Drive n8n workflow.
- Status display.
- Restore rehearsal.

## REL-001 — Windows local release

- Production-local Docker Compose.
- LAN access.
- Windows firewall guide.
- Startup/restart behavior.
- Full acceptance suite.

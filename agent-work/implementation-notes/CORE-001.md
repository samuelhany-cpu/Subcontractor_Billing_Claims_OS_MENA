# CORE-001 — Database foundation

## Outcome

CORE-001 implements the approved Local Project Expense Tracker database contract without adding API endpoints, screens, workflows, parsing, dashboards, or business CRUD services.

## Schema

The active and documented Prisma schemas are byte-aligned and define all 13 approved models: Project, Category, Subcategory, Payee, Agreement, Expense, Transfer, Attachment, AuditEvent, AutomationDraft, ImportJob, ImportRow, and AppSetting.

They define all 8 approved enums: ProjectStatus, PayeeType, RecordSource, AuditAction, AutomationIntent, AutomationDraftStatus, ImportJobStatus, and ImportRowStatus.

The schema uses UUID identifiers, PostgreSQL date-only transaction/opening-balance dates, timestamps, nullable import-compatible classification, soft-delete timestamps, and documented restrictive relations. ImportRow has an explicit optional Expense relation so its resulting expense identifier has referential integrity.

No user, authentication, tenancy, RBAC, Claims, tax, invoice, ledger, inventory, payroll, or other undocumented model exists.

## Migration

Migration name: 20260801000000_expense_tracker_foundation.

Generated SQL creates the approved enums, 13 tables, unique constraints, reporting/soft-delete/import/audit indexes, and restrictive financial foreign keys. ImportJob-to-ImportRow uses the documented cascade: removing preview rows cannot delete an Expense; ImportRow-to-Expense is restrictive.

Custom reviewed SQL adds the Expense_amount_positive, Transfer_amount_positive, and Agreement_totalAmount_positive checks, plus prevent_audit_event_mutation() and the AuditEvent_append_only trigger.

The trigger rejects UPDATE and DELETE on AuditEvent. It intentionally does not block schema teardown or TRUNCATE, allowing isolated test-database cleanup without weakening normal row immutability. No seed or INSERT statement exists.

## Decimal foundation

Prisma.Decimal is the centralized implementation:

- Money: Decimal(18,2).
- Quantity and unit price: Decimal(18,4).
- Validated plain decimal strings only; exponent notation, whitespace, JavaScript number paths, excess scale, and excess precision are rejected.
- Explicit ROUND_HALF_UP monetary rounding.
- Decimal serialization uses strings and fixed two/four-place helpers.
- Comparison stays in Decimal arithmetic.

The helpers do not implement expense calculation, project balance, or agreement formulas.

## Audit foundation

AuditService.append accepts action, entity type/id, source, before/after snapshots, and correlation ID. It is injectable through InfrastructureModule and accepts an explicit Prisma transaction client.

It exposes no update/delete operation and does not use broad Prisma middleware. Audit JSON serializes Decimal and bigint as strings, dates as ISO strings, redacts sensitive keys, rejects unsafe financial JavaScript numbers, and rejects circular/unsupported data.

## Migration-test isolation

The test:database script creates a unique expense_tracker_core_001 process/timestamp database on repository-local PostgreSQL. It applies migrations twice, checks status and schema diff, runs catalog/persistence/constraint/audit tests, then drops only that generated database. The normal local development database is never reset or migrated by this harness.

## Database-enforced rules

- Positive Expense.amount, Transfer.amount, and Agreement.totalAmount.
- Documented unique names, keys, pairs, object keys, and import source rows.
- Exact decimal precision and PostgreSQL date types.
- Restrictive deletion for financial references.
- Expense and Transfer soft-delete columns and indexes.
- Audit append-only trigger.
- Import preview-row cascade cannot remove a committed Expense.

## Deferred application rules

The following remain application-level: manual/calculated amount selection; quantity × unit-price calculation; category required for manual entry but nullable for import; category/subcategory semantic matching; archived-project write prevention; project/agreement formulas; Cairo report boundaries; import/Telegram idempotency workflows; attachment validation/private access; and the AppSetting secret prohibition.

## Scope confirmation

No seed categories or other records were added. No endpoint, UI, Telegram/n8n flow, Excel parser, dashboard query, CRUD service, auth, tenancy, RBAC, tax, Claims, or accounting implementation was introduced.

Next eligible task: PRJ-001.

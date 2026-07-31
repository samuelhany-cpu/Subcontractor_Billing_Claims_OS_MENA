# Local Project Expense Tracker — Documentation Pack

## Purpose

This repository documents a **single-user, Arabic-only, locally hosted application** that replaces the current project-expense Excel workbook.

The product manages:

- Multiple projects.
- Project expenses.
- Incoming project transfers.
- Opening balances.
- Suppliers, craftsmen, workers, and companies.
- One agreement total per payee per project.
- Paid and remaining amounts.
- Daily, weekly, monthly, and custom-period reports.
- One-sheet Excel exports.
- Excel imports, including the current legacy workbook.
- Optional invoice/receipt images.
- Telegram interaction through n8n.
- Recycle bin and change history.
- Daily backup to Google Drive.

## Explicitly excluded

- Taxes.
- Electronic invoicing.
- Claims and payment applications.
- Double-entry accounting.
- General ledger.
- Branches.
- Multiple users.
- Login page.
- Roles and permissions.
- Payroll.
- Inventory.
- Procurement.
- Dark mode.
- OCR of invoice images.
- Public cloud hosting.

## Existing foundation to preserve

The current implementation foundation is reusable:

- pnpm/Turborepo monorepo.
- Next.js web app.
- NestJS API.
- PostgreSQL.
- Redis.
- MinIO / S3-compatible storage.
- Docker Compose.
- Typed environment configuration.
- CI, lint, typecheck, tests, and builds.
- Health, readiness, correlation, and logging if already completed.

## Document reading order

1. `product/01_DECISION_LOG.md`
2. `source-analysis/01_SOURCE_WORKBOOK_ANALYSIS.md`
3. `product/02_PRODUCT_VISION.md`
4. `product/03_SCOPE.md`
5. `product/04_PRD.md`
6. `product/05_FUNCTIONAL_REQUIREMENTS.md`
7. `product/06_BUSINESS_RULES.md`
8. `product/07_USER_FLOWS.md`
9. `product/08_INFORMATION_ARCHITECTURE.md`
10. `product/09_UI_SPEC.md`
11. `architecture/01_SYSTEM_ARCHITECTURE.md`
12. `architecture/02_DATA_MODEL.md`
13. `schemas/schema.prisma`
14. `schemas/openapi.yaml`
15. `integrations/01_N8N_TELEGRAM_SPEC.md`
16. `integrations/02_EXCEL_IMPORT_EXPORT_SPEC.md`
17. `integrations/03_BACKUP_GOOGLE_DRIVE_SPEC.md`
18. `integrations/04_N8N_WORKFLOW_BLUEPRINT.md`
19. `engineering/01_SECURITY_AND_LOCAL_NETWORK.md`
20. `engineering/02_TEST_STRATEGY.md`
21. `engineering/03_ACCEPTANCE_CRITERIA.md`
22. `engineering/04_WINDOWS_LOCAL_DEPLOYMENT.md`
23. `delivery/01_BACKLOG.md`
24. `delivery/02_PIVOT_MIGRATION_PLAN.md`
25. `delivery/03_OPEN_DECISIONS.md`
26. `prompts/CODEX_MASTER_PROMPT.md`
27. `prompts/FIRST_CODEX_TASK.md`

## Source-of-truth rule

If a document conflicts with the user decision log, the decision log wins.

Codex must not invent product features or alter financial formulas without updating the decision log and receiving user approval.

# Requirement Coverage

Current status: DASH-001 is complete and verified. RPT-001 remains not started.

## TEL-001 verification update

- TEL-001 Phase 1 is VERIFIED — NOT DEPLOYED: authenticated, server-owned
  single-chat drafts; Zod validation; transactional confirmation; immutable
  result linkage; Telegram source/audit attribution; and PostgreSQL exactly-once
  verification are implemented.
- TEL-002A long-polling gateway and private n8n Router are deployed with a
  registered authenticated production webhook and durable gateway offsets. A
  live `/start` reply is verified; expense, transfer, and balance conversations
  remain follow-on work.
- A restore-verified external production backup exists. After explicit owner
  approval, the additive AutomationDraft result-link migration was applied and
  post-deployment reconciliation, readiness, and authorization verification
  passed.

## DASH-001 verification update

- RPT-005 is implemented and verified: global/project dashboard cards, active-project summaries, category distribution, 12-week trend, top payees, and recent expenses/transfers.
- Dashboard analytics use active records only, preserve exact Decimal money strings, retain archived-project read-only analytics, and calculate Monday week buckets using Africa/Cairo calendar dates.
- Backup status remains deferred to BKP-001; no backup behavior was invented.
- This verification section supersedes the historical RPT status row retained below for audit continuity.

EXP-001 delivers active Expense entry/edit/listing and private attachments. Soft-delete, restore, recycle-bin, and audit-history workflows remain explicitly deferred to EXP-002.

| Requirement IDs | Status   | Current evidence                                                                                                                                                                                                           | Remaining gap                                                         |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| PIVOT-001       | Complete | Commits 9c462f2 and 108acb1                                                                                                                                                                                                | None                                                                  |
| CORE-001        | Complete | Commit 789ee73; aligned schemas, migration, Decimal/audit infrastructure, isolated database tests                                                                                                                          | None                                                                  |
| PRJ-001–PRJ-007 | Complete | Commit ff9feb7; shared contracts, Nest routes/services/state guard/totals, Arabic RTL Projects UI and selector, tests                                                                                                      | None                                                                  |
| CAT-001–CAT-005 | Complete | Shared contracts/helpers; audited Nest category/subcategory lifecycle, complete ordering and effective selection; Arabic RTL settings UI; isolated PostgreSQL and frontend tests                                           | Reporting consumes the completed unclassified helper later in RPT-001 |
| AUD-001–AUD-003 | Complete | Transactional meaningful events with safe operation-specific snapshots, Decimal strings, source, and correlation ID for Project, Category, Payee, Agreement, Transfer, and Expense create/update/delete/restore operations | None                                                                  |
| PAY-001–PAY-009 | Complete | Shared contracts; audited Payee lifecycle; four-field server search; exact grouped global/per-Project totals; Arabic RTL list/detail/forms; isolated PostgreSQL and frontend tests                                         | None                                                                  |
| AGR-001–AGR-006 | Complete | Separate Agreement create/update API; unique positive total; derived exact paid/remaining/overpayment; archived Project guard; transactional audit                                                                         | None                                                                  |
| EXP-001–EXP-007 | Complete | Exact manual/calculated entry, active Project/classification/Payee enforcement, date-only values, active edit, Arabic RTL list/form/detail                                                                                 | None                                                                  |
| EXP-008–EXP-009 | Complete | Soft delete via POST /expenses/{id}/delete, restore via POST /expenses/{id}/restore, status filter (ACTIVE/DELETED/ALL), Recycle Bin UI, and transactional audit events                                                    | None                                                                  |
| EXP-010–EXP-015 | Complete | Trusted WEB source with all committed sources readable/filterable; import references preserved; bounded filters/search/sort; private validated streamed attachments                                                        | Future import/Telegram writers remain their own bounded tasks         |
| EXP-016         | Complete | Expense lists, Project totals, Payee totals, and Agreement calculations exclude soft-deleted records and dynamically restore on restoration                                                                                | None                                                                  |

| TRF-001–TRF-007 | Complete | Transfer create/update/soft-delete/restore API, inclusive filters, status (ACTIVE/DELETED/ALL), NEWEST/OLDEST sort, exact Decimal funding calculations, Arabic RTL UI, isolated PostgreSQL tests | None |

| RPT-001–RPT-004, RPT-006–RPT-009 | Not started | Date-range reporting and one-sheet export remain pending | RPT-001 |
| RPT-005 | Complete | Global/project dashboard cards, active-project summaries, category distribution, Cairo-aware 12-week trend, top payees, and recent activity; exact Decimal and soft-delete behavior verified | Backup status remains deferred to BKP-001 |
| IMP-001–IMP-010 | Database foundation complete; workflow not started | Import metadata, statuses, hashes, row uniqueness, optional Expense relation | IMP-001 |
| TEL-001 | Deployed and verified | Authenticated, owner-scoped Automation API; transactional idempotent expense/transfer confirmation, audit/source attribution, real PostgreSQL concurrency/rollback tests, restore-verified backup, production migration, health, and reconciliation | Telegram transport/workflow remains TEL-002 |
| TEL-002A | Complete and live-verified | Private long-poll gateway, persistent offsets, gateway/n8n authentication, registered Arabic `/start`/`/help` Router workflow, private egress, and owner-verified live response | TEL-002B financial conversations |
| TEL-002B–TEL-016 | Not started | Financial conversations and other Telegram workflows remain pending | TEL-002 follow-on work |
| BKP-001–BKP-004 | Not started | No backup behavior added | BKP-001; scheduling gated by OPEN-003–OPEN-005 |

## Preserved technical foundation

| Completed task | Preserved capability                                                                | Evidence |
| -------------- | ----------------------------------------------------------------------------------- | -------- |
| FOUND-001A     | pnpm/Turborepo, strict TypeScript, CI and quality scripts                           | 648f7b5  |
| FOUND-001B     | PostgreSQL, Redis, private S3/MinIO, typed configuration, injectable Prisma adapter | 5669b7f  |
| FOUND-001C     | Health/readiness, correlation, logging, RFC 7807 errors                             | 1110186  |
| CORE-001       | Approved schema/migration, exact Decimal helpers, immutable transactional audit     | 789ee73  |
| PRJ-001        | Project API/UI, totals, selector, archive/restore state guard                       | ff9feb7  |
| CAT-001        | Global category/subcategory API/UI, ordering, activity, unclassified helper         | e628480  |
| PAY-001        | Global Payee API/UI, exact grouped totals, Project Agreements, activity lifecycle   | 8945cca  |

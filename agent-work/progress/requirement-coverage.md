# Requirement Coverage

CORE-001 supplies the approved persistence foundation. Business behavior remains owned by its later bounded slice; a table or constraint does not mark an API/UI workflow complete.

| Requirement IDs | Status                                                 | Current evidence                                                                                        | Remaining gap                                                  |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| PIVOT-001       | Complete                                               | Commits 9c462f2 and 108acb1                                                                             | None                                                           |
| CORE-001        | Complete                                               | Aligned schemas, migration, Decimal/audit infrastructure, isolated database tests                       | None                                                           |
| PRJ-001–PRJ-007 | Database foundation complete; application not started  | Project uniqueness, opening balance/date, archive state                                                 | PRJ-001                                                        |
| EXP-001–EXP-016 | Database foundation complete; application not started  | Exact Expense fields, nullable import classification, sources, soft delete, attachments, checks/indexes | EXP-001 and EXP-002                                            |
| TRF-001–TRF-007 | Database foundation complete; application not started  | Transfer date/amount/source/soft delete and checks/indexes                                              | TRF-001                                                        |
| CAT-001–CAT-005 | Database foundation complete; application not started  | Category hierarchy, uniqueness, ordering, active flags, unclassified Expense support                    | CAT-001                                                        |
| PAY-001–PAY-009 | Database foundation complete; application not started  | Payee fields/types/optional values and indexes                                                          | PAY-001                                                        |
| AGR-001–AGR-006 | Database foundation complete; application not started  | Unique Project/Payee Agreement and positive exact total; no derived columns                             | PAY-001                                                        |
| RPT-001–RPT-009 | Not started                                            | Reporting/date indexes only                                                                             | DASH-001 and RPT-001                                           |
| IMP-001–IMP-010 | Database foundation complete; workflow not started     | Import metadata, statuses, hashes, row uniqueness, optional Expense relation                            | IMP-001                                                        |
| TEL-001–TEL-016 | Database foundation complete; API/workflow not started | AutomationDraft intent/status/payload/idempotency storage only                                          | TEL-001/TEL-002; activation gated by OPEN-001/OPEN-002         |
| AUD-001–AUD-003 | Reusable foundation complete; domain events deferred   | Audit model/indexes, append-only trigger, transactional AuditService, safe JSON/Decimal handling        | Later mutation slices append events; history API/UI in EXP-002 |
| BKP-001–BKP-004 | Not started                                            | No backup behavior added                                                                                | BKP-001; scheduling gated by OPEN-003–OPEN-005                 |

## Preserved technical foundation

| Completed task | Preserved capability                                                                | Evidence |
| -------------- | ----------------------------------------------------------------------------------- | -------- |
| FOUND-001A     | pnpm/Turborepo, strict TypeScript, CI and quality scripts                           | 648f7b5  |
| FOUND-001B     | PostgreSQL, Redis, private S3/MinIO, typed configuration, injectable Prisma adapter | 5669b7f  |
| FOUND-001C     | Health/readiness, correlation, logging, RFC 7807 errors                             | 1110186  |

# Functional Requirements

## Projects

- **PRJ-001** Create a project with a required unique name.
- **PRJ-002** Edit an active project name.
- **PRJ-003** Set optional opening balance amount and date.
- **PRJ-004** Archive a project without deleting transactions.
- **PRJ-005** Restore an archived project.
- **PRJ-006** Filter active and archived projects.
- **PRJ-007** Show project-level totals.

## Expenses

- **EXP-001** Add an expense to a selected active project.
- **EXP-002** Required fields: date, description, category, amount.
- **EXP-003** Optional fields: subcategory, payee, invoice number, quantity, unit, unit price, payment method, notes, attachment.
- **EXP-004** Remove the legacy `مبلغ العملية` field entirely.
- **EXP-005** When quantity and unit price exist, calculate amount exactly as quantity × unit price.
- **EXP-006** When quantity or unit price is missing, require manually entered amount.
- **EXP-007** Edit an active expense.
- **EXP-008** Soft-delete an expense.
- **EXP-009** Restore an expense from the recycle bin.
- **EXP-010** Record source as web, Telegram, or Excel import.
- **EXP-011** Store original import source reference when imported.
- **EXP-012** Filter by project, date range, category, subcategory, payee, payment method, and source.
- **EXP-013** Search description, payee, company, invoice number, and notes.
- **EXP-014** Show newest and oldest sorting options.
- **EXP-015** Attach zero or more images/files to an expense.
- **EXP-016** Exclude deleted expenses from all summaries and agreement paid totals.

## Incoming transfers

- **TRF-001** Add an incoming transfer to a selected active project.
- **TRF-002** User-visible required fields: date and amount.
- **TRF-003** Edit a transfer while recording history.
- **TRF-004** Archive/soft-delete an incorrect transfer with history.
- **TRF-005** Restore a deleted transfer.
- **TRF-006** Include opening balance in total project funding.
- **TRF-007** Calculate available balance as total funding minus active expenses.

## Categories

- **CAT-001** Create, rename, reorder, and deactivate categories.
- **CAT-002** Create, rename, reorder, and deactivate subcategories.
- **CAT-003** Prevent deleting a category that is referenced; allow deactivation.
- **CAT-004** Imported blank categories remain unclassified.
- **CAT-005** Reports support unclassified expenses.

## Payees

- **PAY-001** Create a payee with required name and type.
- **PAY-002** Payee type: supplier, craftsman, worker, company, or other.
- **PAY-003** Specialty is optional.
- **PAY-004** Phone is optional.
- **PAY-005** Company name is optional.
- **PAY-006** Notes are optional.
- **PAY-007** Show total paid by project.
- **PAY-008** Show total paid across all projects.
- **PAY-009** Search by name, company, phone, or specialty.

## Agreements

- **AGR-001** Maintain at most one agreement per payee per project.
- **AGR-002** Agreement total must be positive.
- **AGR-003** Paid amount is the sum of active expenses in that project assigned to that payee.
- **AGR-004** Remaining = agreement total − paid.
- **AGR-005** Show overpayment when remaining is negative.
- **AGR-006** Updating an agreement total creates a history event.

## Dashboard and reports

- **RPT-001** Daily report.
- **RPT-002** Weekly report using Africa/Cairo calendar dates.
- **RPT-003** Monthly report.
- **RPT-004** Custom date range report.
- **RPT-005** Display all dashboard cards approved in DEC-039.
- **RPT-006** Export one Excel worksheet.
- **RPT-007** Export organized columns.
- **RPT-008** Include report summary and applied filters.
- **RPT-009** Telegram can request and receive the Excel file.

## Excel import

- **IMP-001** Upload `.xlsx`.
- **IMP-002** Detect legacy workbook columns described in source analysis.
- **IMP-003** Support organized export-format re-import.
- **IMP-004** Preview valid, invalid, skipped, and duplicate rows.
- **IMP-005** Do not import amount-only legacy rows.
- **IMP-006** Ignore total/formula rows.
- **IMP-007** Commit import idempotently.
- **IMP-008** Generate an import result report.
- **IMP-009** Preserve source file, sheet, and row reference.
- **IMP-010** Do not infer missing data.

## Telegram/n8n

- **TEL-001** Restrict bot processing to one configured Telegram chat ID.
- **TEL-002** Reject or ignore other chats.
- **TEL-003** Require confirmation before create/update/delete.
- **TEL-004** Add expense.
- **TEL-005** Add incoming transfer.
- **TEL-006** Edit last expense.
- **TEL-007** Cancel last expense through soft delete.
- **TEL-008** Query today expenses.
- **TEL-009** Query current week expenses.
- **TEL-010** Query project available balance.
- **TEL-011** Query total paid to a named payee.
- **TEL-012** Request Excel report.
- **TEL-013** Attach optional invoice image.
- **TEL-014** Do not perform OCR.
- **TEL-015** Make confirmation idempotent.
- **TEL-016** Use application APIs, never direct database access.

## History and backup

- **AUD-001** Record create, update, delete, restore, import, export, archive, and agreement changes.
- **AUD-002** Record source: web, Telegram, import, system.
- **AUD-003** Record before/after JSON where appropriate.
- **BKP-001** Create a daily backup package.
- **BKP-002** Upload daily backup package to Google Drive.
- **BKP-003** Backup PostgreSQL data and attachment objects.
- **BKP-004** Provide a documented restore procedure.

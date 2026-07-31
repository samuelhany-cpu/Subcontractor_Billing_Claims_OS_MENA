# Test Strategy

## Unit tests

### Expense calculation
- Quantity × unit price.
- Decimal rounding to two amount decimals.
- Manual amount path.
- Missing amount.
- Zero and negative values.
- Large values.
- Quantity/unit-price precision.

### Project balance
- Opening balance only.
- Transfers only.
- Expenses only.
- Combined.
- Negative balance.
- Deleted and restored records.

### Agreement
- No payments.
- Partial paid.
- Fully paid.
- Overpaid.
- Deleted expense excluded.
- Restored expense included.

### Date ranges
- Today in Africa/Cairo.
- Week boundaries.
- Month boundaries.
- Leap dates.
- No UTC shift.

## Integration tests

- Project create/archive/restore.
- Category/subcategory lifecycle.
- Payee and agreement.
- Expense create/update/delete/restore.
- Transfer create/update/delete/restore.
- Dashboard aggregation.
- Audit event creation.
- Attachment upload/download authorization model.
- Automation draft idempotency.
- Import preview/commit.

## Excel tests

- Import current legacy workbook fixture.
- Verify 70 meaningful rows imported.
- Verify imported total is 521,310 EGP.
- Verify incomplete amount-only rows skipped.
- Verify unexplained formula ignored.
- Verify totals recompute from imported expenses.
- Export one worksheet.
- Verify Arabic headers.
- Verify values and date cells.
- Re-import organized export.
- Duplicate file/row detection.
- Large report generation.

## Telegram contract tests

Test the application endpoints, not Telegram itself:

- Create draft.
- Confirm once.
- Confirm twice returns same result.
- Cancel.
- Expired draft.
- Invalid chat ID at n8n workflow level.
- Last expense edit/delete semantics.
- Excel binary response.

## End-to-end tests

- Create project with opening balance.
- Add transfer.
- Add expenses.
- Add payee agreement.
- Verify dashboard and report.
- Delete/restore expense.
- Export Excel.
- Import legacy workbook.
- Attachment upload and retrieval.

## Backup tests

- Generate backup archive.
- Validate manifest/checksums.
- Restore into empty test environment.
- Compare record counts and totals.
- Verify attachments.

## Non-functional tests

- 100,000 expense query/report benchmark.
- LAN-access smoke test.
- No-auth route behavior.
- Secret scan.
- Docker restart persistence.

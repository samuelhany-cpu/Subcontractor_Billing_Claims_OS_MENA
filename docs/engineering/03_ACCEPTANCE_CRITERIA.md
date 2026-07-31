# Acceptance Criteria

## Product acceptance

### Projects
- Multiple projects can be created.
- Archived projects retain all data.
- Archived projects do not accept new transactions until restored.

### Expenses
- User can enter the same information represented by the organized Excel columns.
- No `مبلغ العملية` field appears.
- Quantity × unit price calculates correctly.
- Manual amount works when quantity/pricing is absent.
- Delete moves expense to recycle bin.
- Restore returns it to totals.

### Transfers
- User selects project and enters only date and amount.
- Opening balance works.
- Balance formula is correct.

### Payees/agreements
- Phone and company are optional.
- Agreement total, paid, remaining, and overpaid are visible.
- Paid total changes when expenses are added/deleted/restored.

### Reports
- Daily, weekly, monthly, custom filters work.
- One-sheet Excel is generated.
- Telegram receives the Excel file.

### Import
- Current workbook imports without manual cleanup.
- Incomplete rows are skipped.
- Initial imported total is 521,310 EGP; the skipped 4,465 EGP may be entered manually later.
- The 363,360 formula is absent.
- Import result is auditable.
- Re-import does not duplicate committed rows silently.

### Telegram
- Only configured chat is processed.
- Every write requires confirmation.
- Supported commands work.
- Optional image can attach.
- No OCR occurs.

### Local hosting
- Runs on Windows.
- Phone on same LAN can open web app.
- No login page exists.
- Daily Google Drive backup completes after configuration.

## Quality gates

- Install succeeds.
- Formatting passes.
- Lint passes.
- Strict typecheck passes.
- Unit/integration/e2e tests pass.
- Production build passes.
- Migrations apply from empty database.
- Docker Compose starts cleanly.
- Backup restore test passes before final release.
- No secrets are committed.

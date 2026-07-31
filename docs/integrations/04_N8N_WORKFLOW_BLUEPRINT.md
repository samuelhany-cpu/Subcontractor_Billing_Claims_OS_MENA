# n8n Workflow Blueprint

This is a blueprint, not an exported n8n JSON file. Node versions must match the installed n8n version.

## Workflow 1 — Telegram Router

1. Telegram Trigger.
2. Normalize update:
   - message
   - callback_query
   - photo/document
3. Validate allowed chat ID.
4. Resolve callback versus text.
5. Route intent:
   - expense
   - transfer
   - edit
   - cancel
   - today
   - week
   - balance
   - payee total
   - Excel
6. Call child workflow.
7. Global error response.

## Workflow 2 — Add Expense

1. Receive normalized message.
2. Parse structured fields using provider-neutral parser.
3. Resolve project through API.
4. Resolve category/subcategory through API.
5. Resolve payee:
   - exact one match → use
   - zero → leave blank or ask
   - multiple → ask owner
6. Ask for missing required fields.
7. Create automation draft through API.
8. Send confirmation with inline keyboard.
9. On callback:
   - confirm → confirm draft endpoint
   - edit → collect field and create new draft version
   - cancel → cancel draft
10. Send result and project balance.

## Workflow 3 — Add Transfer

1. Parse project/date/amount.
2. Ask for missing fields.
3. Create draft.
4. Confirm.
5. Send updated balance.

## Workflow 4 — Edit Last Expense

1. Ask/select project if missing.
2. Request latest active expense.
3. Display values.
4. Ask which field changes.
5. Validate new value.
6. Create update draft.
7. Confirm.
8. Apply update.
9. Send revised expense and balance.

## Workflow 5 — Cancel Last Expense

1. Resolve project.
2. Fetch last active expense.
3. Display exact expense.
4. Confirm deletion.
5. Soft delete idempotently.
6. Send updated balance.

## Workflow 6 — Queries

### Today/week
- Resolve project.
- Call report summary.
- Format count, total, and top rows.

### Balance
- Call dashboard.
- Return funding, expenses, balance.

### Payee total
- Search payee.
- Confirm match if ambiguous.
- Return project and all-project totals.

## Workflow 7 — Excel

1. Resolve project and period.
2. Call Excel endpoint.
3. Receive binary.
4. Send Telegram document.
5. Do not persist binary beyond execution needs.

## Workflow 8 — Daily Backup

1. Schedule Trigger at a later owner-selected Cairo time.
2. Call backup command/endpoint.
3. Read produced archive.
4. Upload to owner-selected Google Drive folder.
5. Confirm checksum and upload.
6. Record backup status.
7. Notify owner only on failure, unless changed later.

## Callback data

Keep callback data short and opaque:

- `d:<draftId>:c` confirm
- `d:<draftId>:e` edit
- `d:<draftId>:x` cancel

Never place amounts, project names, or secrets in callback data.

## State

Application automation drafts are authoritative.

Do not rely only on n8n in-memory execution state for pending financial actions.

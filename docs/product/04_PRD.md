# Product Requirements Document

## 1. User

A single owner/operator manages project expenses and project funding.

There are no employee accounts, clients, roles, invitations, or login flows.

## 2. Primary workflows

### Expense workflow
1. Select project.
2. Enter expense data.
3. Optionally select/create payee.
4. Optionally attach invoice/receipt image.
5. Save.
6. Dashboard and reports update immediately.
7. Change is written to history.

### Incoming transfer workflow
1. Select project.
2. Enter transfer date and amount.
3. Save.
4. Project funding total and balance update.
5. Change is written to history.

### Payee agreement workflow
1. Select project and payee.
2. Enter agreement total.
3. Paid amount is calculated from active expenses assigned to that payee in the project.
4. Remaining is calculated.
5. The screen shows overpayment when paid exceeds the agreement.

### Excel import workflow
1. Upload workbook.
2. Select project or create it.
3. System detects supported legacy/organized columns.
4. Show preview and validation messages.
5. User commits import.
6. System records imported rows and skipped rows.
7. Duplicate re-import is prevented or clearly flagged.

### Telegram workflow
1. Owner sends Arabic message to bot.
2. n8n validates Telegram chat ID.
3. n8n parses intent and required fields.
4. Missing required fields are requested.
5. n8n displays a confirmation summary.
6. Only after confirmation does n8n call the app API.
7. Bot returns success and updated project balance.

## 3. Dashboard

### Global dashboard
- Project selector.
- Active and archived project counts.
- Total incoming transfers across active projects.
- Total expenses across active projects.
- Combined available balance.
- Recent operations.

### Project dashboard
- Opening balance.
- Incoming transfers.
- Total funding.
- Total expenses.
- Available balance.
- Materials/category total.
- Works/category total.
- Expense count.
- Top payees by amount.
- Expenses by week/month.
- Category distribution.
- Latest expenses and transfers.

Category cards must use configured category names. If `خامات` or `أعمال` are renamed or absent, the dashboard must not break.

## 4. Data integrity

- All financial values use exact decimal arithmetic.
- Currency is fixed to EGP.
- Negative expense and transfer amounts are invalid.
- Zero amounts are invalid.
- Deleted expenses are excluded from all totals.
- Restored expenses return to totals.
- Archived projects retain all records.
- Dates use Africa/Cairo semantics.
- Excel serial dates are converted accurately.

## 5. Performance targets

For normal personal use:

- Dashboard initial load under 2 seconds on the LAN after warm startup.
- Common list/filter operations under 1 second for up to 100,000 expenses.
- Excel report generation under 15 seconds for 100,000 rows.
- Telegram confirmation response under 10 seconds excluding third-party AI latency.

## 6. Reliability

- Daily backup workflow.
- Soft delete for expenses.
- Audit history.
- Idempotent Telegram confirmation.
- Idempotent Excel import commit.
- No direct n8n database writes.

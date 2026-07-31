# User Flows

## A. Create project

1. Open projects.
2. Select `مشروع جديد`.
3. Enter project name.
4. Optionally enter opening balance and its date.
5. Save.
6. Open project dashboard.

## B. Add expense from web

1. Select project.
2. Select `إضافة مصروف`.
3. Enter date and description.
4. Select category and optional subcategory.
5. Select existing payee or create one.
6. Enter quantity/unit price or manual amount.
7. Enter optional payment method, invoice number, notes, and image.
8. Save.
9. Show success and updated available balance.

## C. Delete and restore expense

1. Open expense.
2. Select delete.
3. Confirm.
4. Expense moves to recycle bin.
5. Open recycle bin.
6. Select restore.
7. Expense returns to reports and totals.

## D. Add incoming transfer

1. Select project.
2. Select `إضافة تحويل`.
3. Enter date and amount.
4. Save.
5. Show updated funding and balance.

## E. Add payee agreement

1. Open payee in project.
2. Enter agreement total.
3. Save.
4. App displays paid amount from existing active expenses.
5. App displays remaining or overpaid value.

## F. Export expenses

1. Open reports.
2. Select project.
3. Select daily, weekly, monthly, or custom.
4. Optionally apply category/payee filters.
5. Preview totals.
6. Select Excel export.
7. Download one-sheet workbook.

## G. Import workbook

1. Open import.
2. Upload `.xlsx`.
3. Select/create project.
4. Review mapped columns.
5. Review valid, skipped, and duplicate rows.
6. Commit.
7. View import result.
8. Open imported project.

## H. Telegram add expense

1. Send message, for example:
   - `دفعت 10000 جنيه للكهربائي النهاردة في فيلا العبور`
2. n8n validates chat ID.
3. n8n identifies project, date, amount, description/category/payee if available.
4. n8n asks only for missing required fields.
5. n8n shows confirmation.
6. Owner confirms.
7. n8n calls app API.
8. Bot returns saved expense and updated balance.

## I. Telegram Excel

1. Send:
   - `طلعلي مصروفات الأسبوع لفيلا العبور`
2. n8n resolves project and date range.
3. n8n requests export API.
4. API returns `.xlsx`.
5. n8n sends file to Telegram.

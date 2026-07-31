# n8n Telegram Integration Specification

## Ownership boundary

n8n owns:

- Telegram Trigger.
- Arabic intent parsing.
- Missing-field questions.
- Inline confirmation buttons.
- Telegram file receiving/sending.
- Calling the application API.
- Formatting Telegram replies.

The application owns:

- Validation.
- Projects, expenses, transfers, payees, agreements.
- Amount calculations.
- Idempotency.
- Reports and Excel generation.
- Attachment storage.
- Audit history.

n8n must never write directly to PostgreSQL.

## Required configuration

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_CHAT_ID`
- `APP_INTERNAL_API_URL`
- Parser provider credentials: **open decision**
- Public webhook/connectivity configuration: **open decision**

## Connectivity status

The host is local Windows and no public method has been selected.

The workflow must not assume Cloudflare Tunnel, a domain, or a VPS until the owner chooses one.

Telegram's hosted Bot API webhook delivery requires a reachable webhook URL. The final deployment document must be updated after selection.

## Supported intents

1. Add expense.
2. Add incoming transfer.
3. Edit last expense.
4. Cancel last expense.
5. Today expenses.
6. Current week expenses.
7. Remaining balance.
8. Total paid to a payee.
9. Export Excel.

## Authorization

At workflow start:

- Compare incoming `message.chat.id` or callback chat ID with `TELEGRAM_ALLOWED_CHAT_ID`.
- If it does not match, stop without calling the application.
- Do not reveal project or financial data.

## Expense flow

Example:

`دفعت 10000 جنيه للكهربائي النهاردة في فيلا العبور`

Target structured draft:

```json
{
  "intent": "ADD_EXPENSE",
  "projectName": "فيلا العبور",
  "expenseDate": "2026-07-31",
  "description": "دفعة للكهربائي",
  "amount": "10000.00",
  "categoryName": "أعمال",
  "subcategoryName": "كهرباء",
  "payeeName": null,
  "paymentMethod": null,
  "notes": null
}
```

The parser may leave values null. It must not invent:

- Project.
- Amount.
- Date when not safely resolved.
- Payee identity.
- Category.
- Payment method.

Required before confirmation:

- Project.
- Date.
- Description.
- Amount.
- Category, unless importing an unclassified legacy row.

Confirmation message:

```text
تأكيد المصروف

المشروع: فيلا العبور
التاريخ: 31/07/2026
البيان: دفعة للكهربائي
الفئة: أعمال
التصنيف: كهرباء
المورد/الصنايعي: غير محدد
القيمة: 10,000 جنيه
طريقة الدفع: غير محددة

[تأكيد] [تعديل] [إلغاء]
```

## Incoming transfer flow

Visible data:

- Project.
- Date.
- Amount.

Example:

`استلمت تحويل 100000 جنيه لفيلا العبور`

Confirmation is mandatory.

## Edit last expense

1. Resolve selected/default project.
2. Call API for the latest active Telegram/web expense as defined by the endpoint.
3. Show current values.
4. Ask which field to edit.
5. Show complete confirmation.
6. Apply only after confirmation.

## Cancel last expense

- Show the exact last expense.
- Ask for confirmation.
- Call soft-delete endpoint.
- Return updated balance.
- Repeated callback must not delete another expense.

## Queries

### Today/week
Return:

- Date range.
- Expense count.
- Total.
- Optional top categories.
- Last few rows.

### Balance
Return:

- Opening balance.
- Incoming transfers.
- Expenses.
- Available balance.

### Payee total
Resolve a payee by exact or user-confirmed match. Never silently choose between multiple similar payees.

### Excel
Call the application export endpoint and send the returned binary as a Telegram document.

## Images

- Image is optional.
- No OCR.
- Image may be sent before or after expense text as supported by the workflow.
- n8n downloads the Telegram file and uploads it to the application attachment endpoint.
- The application returns attachment metadata.
- Do not retain unnecessary binary data in n8n execution history.

## Draft/idempotency

Create an application automation draft before confirmation.

Idempotency key example:

`telegram:<chatId>:<messageId>:<intent>:<confirmationVersion>`

Confirm endpoint must return the already-created transaction when called repeatedly.

## Timezone

All natural-language dates such as `النهاردة` and week boundaries use `Africa/Cairo`.

## Error behavior

- Missing project: ask the owner to choose.
- Multiple payees: show options.
- Invalid amount: ask again.
- Archived project: tell the owner to restore it in the web app.
- App unavailable: do not claim the transaction was saved.
- Export failure: return a clear retry message.

## n8n workflow groups

1. `Telegram Router`
2. `Expense Conversation`
3. `Transfer Conversation`
4. `Edit/Delete Last Expense`
5. `Queries`
6. `Excel Export`
7. `Error Handler`
8. `Daily Backup`

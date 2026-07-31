# Business Rules

## Amount calculation

### Calculated amount

If both quantity and unit price are present:

`amount = quantity × unit price`

- Use decimal arithmetic.
- Amount is not independently editable in this state.
- Changing quantity or unit price recalculates amount.

### Manual amount

If either quantity or unit price is absent:

- Amount is entered manually.
- Amount must be greater than zero.

### Units

`unit` is optional free text, such as:

- طن
- متر
- عربية
- ساعة
- قطعة

No unit-conversion engine is required.

## Project funding

`totalFunding = openingBalance + sum(active incoming transfers)`

## Project expenses

`totalExpenses = sum(active expenses)`

## Available balance

`availableBalance = totalFunding − totalExpenses`

A negative result is allowed and must be displayed clearly.

## Category totals

Each category total is calculated from active expenses assigned to that category.

Blank/unclassified imported rows are grouped under `غير مصنف`.

## Payee totals

`paidToPayeeInProject = sum(active expenses where projectId and payeeId match)`

## Agreement remaining

`agreementRemaining = agreementTotal − paidToPayeeInProject`

- A negative value indicates overpayment.
- The application must not silently cap remaining at zero.

## Deletion

- Delete means soft delete.
- Deleted records leave reports and balances.
- Restore returns them to reports and balances.
- History remains immutable.

## Archive

- Archived projects are read-only by default.
- Existing reports and exports remain available.
- Restore is required before adding a new expense or transfer.

## Telegram confirmation

- Parsed text is not a financial transaction.
- A transaction exists only after explicit confirmation.
- Repeated callback confirmation must create at most one transaction.

## Dates

- Application timezone: `Africa/Cairo`.
- Date-only expense and transfer fields must not shift due to UTC conversion.
- Today/week/month reports use Cairo calendar boundaries.

## Currency

- All monetary records are EGP.
- No currency selector or exchange rates.

## Import

- Missing data is not inferred.
- Total rows are not imported.
- Formula-only summary rows are not imported.
- Source row references are retained.

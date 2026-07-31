# Source Workbook Analysis

## Source

Workbook: `فيلا العبور - Copy (2).xlsx`

- Worksheet count: 1.
- Worksheet name: `Sheet1`.
- Used range: `A1:L118`.
- Project title: `فيلا العبور`.

## Legacy expense columns

| Column | Legacy header | New mapping |
|---|---|---|
| A | المسلسل | Import row reference only; app generates its own ID. |
| B | التاريخ | `expenseDate` |
| C | البيان | `description` |
| D | الفئه | `category` |
| E | اسم المورد | `payee` |
| F | مبلغ العمليه | Ignored and removed. |
| G | اسم الشركه | Optional `payee.companyName` |
| H | رقم التليفون | Optional `payee.phone` |
| I | رقم الفاتوره | Optional `invoiceNumber` |
| J | الوحدات | Optional `quantity` |
| K | سعر الوحده | Optional `unitPrice` |
| L | القيمه | `amount` |

## Observed data

- Expense sequence numbers: 1 through 73.
- Rows with meaningful date/description data: sequence 1 through 70.
- Three incomplete rows have only amounts:
  - 2,250 EGP
  - 165 EGP
  - 2,050 EGP
- Those three rows must not be imported automatically.
- Date range in meaningful rows: 27 June 2026 through 25 July 2026.
- Workbook total formula: `=SUM(L7:L94)`.
- Displayed total: 525,775 EGP.
- The three incomplete amount-only rows total 4,465 EGP.
- Because those rows are intentionally skipped, the expected initial imported expense total is 521,310 EGP.
- Main visible categories: `خامات` and `اعمال`, with some blank categories.
- The incoming transfer section is empty and totals zero.

## Formulas to preserve or discard

### Preserve as application logic

- When quantity and unit price are both present:
  - `amount = quantity × unitPrice`
- Project total expenses:
  - Sum of active, non-deleted expenses.
- Incoming transfer total:
  - Sum of active, non-deleted incoming transfers.
- Project balance:
  - Opening balance + incoming transfers − expenses.

### Discard

The workbook contains this formula:

`=L7+L8+L9+L18+L19+L20+L22+L31+L34+L39+L44+L55+L56+L57+L58+4050+4050+2025`

It displays 363,360 EGP. The owner confirmed it has no defined meaning, so it must not be migrated, modeled, displayed, or tested.

## Import behavior for the current workbook

1. Create project `فيلا العبور`.
2. Read rows beginning at the legacy table.
3. Import rows only when:
   - date exists, and
   - description exists, and
   - amount exists and is positive.
4. Ignore totals, formulas, blank sections, and incomplete amount-only rows.
5. Preserve text values as supplied.
6. Convert Excel serial dates to real dates.
7. Do not repair or infer missing categories, payees, phone numbers, invoice numbers, quantities, or prices.
8. Create/reuse payees by exact imported name within the import preview.
9. Show a preview before committing.
10. Record source file name, sheet name, and source row number for traceability.

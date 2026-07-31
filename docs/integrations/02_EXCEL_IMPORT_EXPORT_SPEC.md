# Excel Import and Export Specification

## Export

### Worksheet count

Exactly one worksheet.

Default worksheet name:

`المصروفات`

### Layout

Rows 1–6: report metadata and summary.

- Project.
- Report period.
- Generated time.
- Opening balance.
- Incoming transfers.
- Total expenses.
- Available balance.
- Expense count.

Expense table columns:

1. المسلسل
2. التاريخ
3. المشروع
4. البيان
5. الفئة
6. التصنيف
7. المورد أو الصنايعي
8. اسم الشركة
9. رقم الهاتف
10. رقم الفاتورة
11. الكمية
12. الوحدة
13. سعر الوحدة
14. القيمة
15. طريقة الدفع
16. الملاحظات
17. مصدر الإدخال

### Formatting

- Arabic RTL worksheet.
- EGP number format.
- Real Excel date cells.
- Frozen header.
- Auto-filter.
- Sensible widths and wrapped text.
- Totals are formulas or server-calculated verified values.
- No hidden worksheets.
- No macros.

### Report presets

- Today.
- Current week.
- Current month.
- Custom range.

### Telegram

The API generates the file. n8n sends it unchanged.

## Import

### Supported sources

1. Legacy workbook matching `فيلا العبور`.
2. The organized export format.

### Legacy mapping

| Legacy | Target |
|---|---|
| التاريخ | expenseDate |
| البيان | description |
| الفئه | category |
| اسم المورد | payee name |
| اسم الشركه | payee company |
| رقم التليفون | payee phone |
| رقم الفاتوره | invoice number |
| الوحدات | quantity |
| سعر الوحده | unit price |
| القيمه | amount |
| مبلغ العمليه | ignored |

### Preview states

- Valid.
- Invalid.
- Skipped.
- Duplicate.

### Validation

Required for import:

- Date.
- Description.
- Positive amount.

Category and payee may be blank.

### Current workbook special rules

- Ignore the unexplained 363,360 formula.
- Ignore the total 525,775 row.
- Ignore the incoming-transfer total section.
- Skip the three rows containing only 2,250, 165, and 2,050.
- Do not infer their details.

### Duplicate protection

- Compute file SHA-256.
- Compute stable row hash from mapped values and source row.
- Re-uploading the same committed file must be detected.
- Preview must show duplicate rows.
- Commit must be idempotent.

### Import traceability

Store:

- File name.
- File checksum.
- Sheet name.
- Source row.
- Raw row.
- Mapped row.
- Validation messages.
- Resulting expense ID.

### Payee behavior

- During a single preview, exact identical payee names reuse one proposed payee.
- No fuzzy merge.
- Existing exact-name matches may be proposed, but the preview must show the match.
- Phone/company are optional and imported as supplied.

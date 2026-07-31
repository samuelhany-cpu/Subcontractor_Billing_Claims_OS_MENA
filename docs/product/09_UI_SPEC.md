# UI Specification

## Language and direction

- Arabic only.
- RTL everywhere.
- Light mode only.
- EGP display using Arabic labels.
- Dates shown in `DD/MM/YYYY`.
- No language switcher.
- No theme switcher.
- No login screen.

## Layout

### Desktop
- Right-side navigation.
- Main content area.
- Project selector in top bar.
- Primary action button `إضافة مصروف`.

### Mobile/LAN phone
- Bottom or drawer navigation.
- Large touch targets.
- Expense form optimized for one-hand data entry.
- Tables become cards or horizontal scroll without hiding amounts.

## Dashboard cards

1. الرصيد الافتتاحي
2. إجمالي التحويلات
3. إجمالي التمويل
4. إجمالي المصروفات
5. الرصيد المتبقي
6. عدد المصروفات
7. إجمالي الفئات المهمة مثل خامات/أعمال when configured

## Dashboard visuals

- Expense trend by week/month.
- Category distribution.
- Top payees.
- Latest expenses.
- Latest incoming transfers.
- Backup status.

## Expense form

Required:
- التاريخ
- البيان
- الفئة
- القيمة or quantity + unit price

Optional:
- التصنيف
- المورد/الصنايعي
- رقم الفاتورة
- الكمية
- الوحدة
- سعر الوحدة
- طريقة الدفع
- الملاحظات
- صورة فاتورة/إيصال

Behavior:
- When quantity and unit price are present, show calculated amount read-only.
- When either is absent, show editable amount.
- Inline create buttons for payee/category/subcategory.
- Save button disabled while invalid.
- On save, show updated project balance.

## Tables

- Arabic headers.
- Sticky header.
- Search and filters.
- Amount column prominent.
- Deleted records only appear in recycle bin.
- Imported rows show source badge.
- Telegram rows show Telegram badge.

## Destructive actions

- Delete requires confirmation.
- Delete message explicitly says record can be restored.
- Archive requires confirmation.
- Restore is a clear primary action in recycle bin.

## Empty states

- No projects: create first project.
- No expenses: add first expense or import Excel.
- No transfers: add opening balance or incoming transfer.
- No payees: create during expense entry.

# Scope

## In scope

### Projects
- Create, edit, list, open, archive, restore.
- Opening balance.
- Project dashboard.
- Multiple projects.

### Expenses
- Create, view, edit, soft delete, restore.
- Date, description, category, subcategory, payee, invoice number, quantity, unit, unit price, amount, payment method, notes, optional image.
- Manual amount when quantity/unit price are incomplete.
- Automatic amount when quantity and unit price are both present.
- Source tracking: web, Telegram, Excel import.

### Incoming transfers
- Create and list project transfers.
- Visible input: date and amount.
- Include opening balance in the project funding total.
- Edit/correct with history.

### Categories
- Editable categories.
- Editable subcategories.
- Initial expected concepts: materials and works, without hard-coding them as immutable.

### Payees
- Supplier, craftsman, worker, company, or other.
- Name, type, specialty, optional phone, optional company, notes.
- Paid total by project and across projects.

### Agreements
- One agreement per payee per project.
- Total agreement amount.
- Paid amount derived from active project expenses assigned to the payee.
- Remaining amount = agreement amount − paid amount.
- Overpayment is visible and not silently prevented.

### Reports
- Daily, weekly, monthly, and custom date range.
- Summary cards.
- Expense list.
- One-sheet Excel output.
- Telegram delivery of Excel.

### Import
- Current legacy workbook.
- Future compatible Excel files.
- Preview, validation, import report, and duplicate protection.

### Telegram through n8n
- Single allowed Telegram chat.
- Confirmation before save.
- Supported operations listed in DEC-020.
- Optional image attachment.
- No OCR.

### Local operation
- Windows host.
- LAN web access.
- No login page.
- Daily Google Drive backup.
- EGP only.
- Arabic RTL and light mode.

## Out of scope

- Claims.
- BOQ.
- Payment applications.
- Certifications.
- Taxes.
- VAT.
- Electronic invoice/receipt.
- Double-entry accounting.
- General ledger.
- Balance sheet.
- Payroll.
- Inventory.
- Purchase orders.
- Asset management.
- Branches.
- Multiple users.
- Role-based permissions.
- Authentication UI.
- Dark mode.
- OCR.
- Mobile native app.
- Public SaaS tenancy.
- Cash-box or bank account balances.
- Internal money transfers between payment locations.

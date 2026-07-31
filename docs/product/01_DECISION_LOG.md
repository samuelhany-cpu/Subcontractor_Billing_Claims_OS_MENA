# Product Decision Log

This file records the owner's confirmed decisions.

| ID | Decision |
|---|---|
| DEC-001 | The app supports multiple projects. |
| DEC-002 | Projects can be archived and later viewed/restored. |
| DEC-003 | Remove the legacy `مبلغ العملية` field. |
| DEC-004 | If quantity and unit price are present, amount is calculated as quantity × unit price. Otherwise amount is entered manually. |
| DEC-005 | Keep editable top-level categories, initially represented by `خامات` and `أعمال`. |
| DEC-006 | Support editable subcategories. |
| DEC-007 | Ignore the legacy unexplained formula totaling 363,360 EGP. It has no product meaning. |
| DEC-008 | Do not import the three incomplete legacy rows containing only 2,250, 165, and 2,050 EGP. They may be entered manually later. |
| DEC-009 | Incoming transfers are money received from the project owner/client for project spending. |
| DEC-010 | Transfer input fields visible to the user are date and amount. The selected project supplies the project relationship. |
| DEC-011 | Project available balance = opening balance + incoming transfers − active expenses. |
| DEC-012 | A project may have an opening balance. |
| DEC-013 | Payee fields: name, type, specialty, optional phone, optional company, and notes. |
| DEC-014 | Track agreement total, paid amount, and remaining amount for a payee in a project. |
| DEC-015 | Payments to a craftsman/payee are recorded as project expenses, not as a separate advance-accounting concept. |
| DEC-016 | Record only payment method; do not maintain cash-box, bank, or wallet balances. |
| DEC-017 | Do not support transfers between cash/bank locations. |
| DEC-018 | Telegram bot is restricted to the owner's Telegram account/chat. |
| DEC-019 | Telegram must show a confirmation summary before writing any transaction. |
| DEC-020 | Telegram operations: add expense, add incoming transfer, edit last expense, cancel last expense, show today/week expenses, show remaining balance, show total paid to a person, export Excel. |
| DEC-021 | Invoice/receipt images are optional. No OCR is required. |
| DEC-022 | The public connectivity method for Telegram/n8n is not selected yet. |
| DEC-023 | Excel export uses the organized column structure in this documentation. |
| DEC-024 | Reports support daily, weekly, monthly, and custom date ranges. |
| DEC-025 | Each exported report uses one worksheet only. |
| DEC-026 | Telegram can send the generated Excel report file. |
| DEC-027 | Deleted expenses go to a recycle bin and can be restored. |
| DEC-028 | Keep a change history for create, update, delete, restore, import, and export actions. |
| DEC-029 | Support future Excel imports. |
| DEC-030 | Import the current workbook as-is without manual data cleansing. |
| DEC-031 | Host on a Windows computer. |
| DEC-032 | The host computer normally remains powered on. |
| DEC-033 | The web app is accessible from phones and devices on the same private LAN. |
| DEC-034 | No application login page. |
| DEC-035 | Daily backups are uploaded to Google Drive. |
| DEC-036 | Currency is EGP only. |
| DEC-037 | Interface language is Arabic only and RTL. |
| DEC-038 | Light mode only. |
| DEC-039 | Dashboard includes all approved summary cards, charts, top payees, and recent activity. |
| DEC-040 | n8n is used to implement the Telegram bot workflows. |
| DEC-041 | The app is a personal project expense tracker, not a legal accounting system or ERP. |

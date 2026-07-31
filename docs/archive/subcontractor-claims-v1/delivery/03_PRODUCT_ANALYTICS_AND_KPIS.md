# Product Analytics and KPIs

## Product events

Track privacy-conscious events such as:

- organization_created
- project_created
- boq_import_started
- boq_import_completed
- valuation_period_opened
- progress_entry_updated
- application_created
- application_validation_failed
- application_submitted
- application_revised
- variation_created
- variation_submitted
- variation_approved
- certificate_finalized
- invoice_issued
- payment_recorded
- report_exported

Do not include customer document text or sensitive financial details in analytics payloads.

## Activation definition

A customer is activated when it has:

1. Created a project
2. Published a BOQ
3. Created a valuation period
4. Submitted a payment application

## Core SaaS metrics

- Trial-to-activated conversion
- Activated-to-paid conversion
- Time to first application
- Weekly active organizations
- Monthly retained organizations
- Gross revenue retention
- Net revenue retention
- Logo churn
- Average revenue per account
- Support hours per account

## Product-value metrics

- Applications submitted per active project
- Average preparation duration
- First-pass acceptance proxy
- Days to certification
- Days to collection
- Variation value tracked
- Retention value tracked and released
- Forecast accuracy
- Percentage of invoices overdue

## Customer-success health score

Potential inputs:

- Recent login and application activity
- Number of active projects
- Data completeness
- Unresolved import errors
- Overdue workflow tasks
- Support-ticket trend
- Export/report use

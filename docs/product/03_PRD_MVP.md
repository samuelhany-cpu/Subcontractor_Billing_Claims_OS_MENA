# Product Requirements Document — MVP

## 1. MVP objective

Deliver a usable commercial-management system for subcontractors that replaces the monthly Excel-to-PDF payment application workflow and adds traceability through certification and collection.

## 2. Target users

- Commercial manager
- Quantity surveyor
- Finance manager
- Project manager
- Company owner

## 3. Core user journeys

### Journey A — Set up a project

1. Create client and project.
2. Select country, currency, language, and timezone.
3. Add contract dates and commercial terms.
4. Import BOQ from XLSX/CSV.
5. Validate totals and publish the contract baseline.

### Journey B — Prepare monthly payment application

1. Create valuation period.
2. Enter current progress quantities or percentages.
3. Add eligible variations and materials on site.
4. Review deductions, retention, tax, and advance recovery.
5. Attach evidence.
6. Run validation checks.
7. Submit application and generate PDF/XLSX package.

### Journey C — Revise and certify

1. Record reviewer comments.
2. Create a revision without overwriting the submitted version.
3. Record certified quantities and amounts.
4. Generate variance report between claimed and certified.
5. Close period when certificate is final.

### Journey D — Invoice and collect

1. Create invoice from certificate.
2. Record due date and tax details.
3. Record full or partial payment.
4. Allocate payment to invoice.
5. Show overdue balance and aging.
6. Update cash forecast.

### Journey E — Manage variations

1. Register instruction or potential variation.
2. Record estimated value and status.
3. Attach evidence and correspondence.
4. Submit quotation or claim.
5. Record approved or rejected value.
6. Include approved or provisionally claimable amount in a payment application.

## 4. MVP features and acceptance outcomes

### 4.1 Authentication and organization

- Email/password authentication
- Optional email one-time code
- Organization creation
- User invitation
- Role assignment
- Session and audit controls

**Outcome:** A tenant owner can invite a QS and finance manager with different permissions.

### 4.2 Clients, projects, and contracts

- Client and contact records
- Project metadata
- Contract reference and dates
- Currency, tax, retention, advance, payment terms
- Contract amendments

**Outcome:** Contract commercial terms drive downstream calculations.

### 4.3 BOQ

- XLSX/CSV import with mapping
- Hierarchical sections
- Item code, description, unit, quantity, rate, amount
- Provisional sums and optional items
- Validation and duplicate checks
- Baseline lock and versioning

**Outcome:** Imported total reconciles with the contract baseline or displays an explicit variance.

### 4.4 Progress valuation

- Valuation periods
- Previous, current, and cumulative quantities
- Percentage-based or quantity-based entry
- Guardrails against unauthorized over-valuation
- Notes and evidence per line

**Outcome:** The system calculates current and cumulative earned value consistently.

### 4.5 Payment applications

- Draft, validation, submission, revision, and withdrawal
- Numbering per project
- Summary and detailed sheets
- Variation and materials-on-site components
- Retention, advance recovery, tax, other deductions
- PDF/XLSX export

**Outcome:** A QS can generate a complete application package with traceable calculations.

### 4.6 Variations

- Potential, instructed, priced, submitted, approved, rejected, disputed, closed
- Estimated, submitted, and approved values
- Evidence checklist
- Inclusion rules for payment applications

**Outcome:** The organization can see potential revenue at risk and approved variation value.

### 4.7 Certificates

- Record certificate number/date
- Certified line values or summarized adjustments
- Claimed vs certified variance
- Retention and deductions as certified
- Attachment of signed certificate

**Outcome:** Certified value reconciles to invoicing and forecast.

### 4.8 Invoices and collections

- Invoice generated from certificate
- Due date and payment terms
- Partial payments and allocations
- Credit note placeholder workflow
- Aging buckets

**Outcome:** Finance can identify overdue receivables and record settlement.

### 4.9 Dashboards

- Contract value
- Claimed to date
- Certified to date
- Invoiced to date
- Collected to date
- Outstanding receivables
- Retention held
- Approved and pending variations
- 13-week expected cash-in forecast

### 4.10 Documents and audit

- Attach files to project, variation, application, certificate, or invoice
- Version metadata
- Comments and @mentions
- Immutable audit log for critical actions

### 4.11 Localization

- Arabic and English UI
- RTL/LTR layouts
- Locale-aware dates and numbers
- English/Arabic report headers
- Project-level report language preference

## 5. MVP exclusions

- General ledger and journal entries
- Purchase orders and supplier payments
- Payroll
- Inventory
- Full scheduling and delay analysis
- Automated legal entitlement assessment
- Automated government invoice submission
- Native mobile applications
- Offline-first mobile data collection
- BIM integration

## 6. Product guardrails

- The platform may calculate contractual formulas configured by the user.
- The platform must not present legal conclusions as facts.
- AI-generated summaries must link to source records and be reviewable.
- No amount may be deleted after submission; corrections require reversals or versions.

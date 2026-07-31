# Business Requirements Document

## 1. Business objective

Build a multi-tenant SaaS platform that enables subcontractors to manage the full commercial lifecycle from contract setup and progress measurement through payment application, certification, invoicing, collection, retention release, and commercial reporting.

## 2. Business outcomes

The product must enable customers to:

- Prepare monthly payment applications faster and with fewer errors
- Establish a single source of truth for contract and BOQ values
- Preserve evidence for variations and commercial claims
- Track where each submitted amount is in the approval chain
- Identify overdue certificates, invoices, and collections
- Forecast incoming cash by project and period
- Identify unrecovered retention and advances
- Reduce dependency on uncontrolled spreadsheets

## 3. Stakeholders

### Customer stakeholders

- Company owner / general manager
- Commercial director
- Finance manager
- Quantity surveyor
- Project manager
- Site engineer
- Document controller
- External reviewer or approver

### Product stakeholders

- Product owner
- Business analyst
- UX designer
- Software architect
- Backend and frontend engineers
- QA engineer
- DevOps engineer
- Customer success and implementation specialist

## 4. In-scope business capabilities

1. Organization and subscription management
2. Customer/client and project records
3. Contract commercial terms
4. BOQ/Schedule of Values import and maintenance
5. Progress period creation and valuation
6. Payment application preparation and submission
7. Variation order and claim evidence register
8. Approval and revision workflow
9. Payment certificate recording and reconciliation
10. Invoice issuance tracking
11. Collection and payment allocation
12. Retention and advance-payment recovery
13. Cash-flow forecast and aging
14. Reporting and export
15. Comments, notifications, attachments, and audit history
16. Arabic and English localization

## 5. Business rules summary

- A project belongs to exactly one tenant organization.
- A project may have one active base contract and multiple amendments.
- A payment application is linked to one contract and one valuation period.
- Payment application line values derive from BOQ progress, approved variations, materials on site, or other contract-defined components.
- Submitted applications are immutable; revisions create a new version.
- Certified amounts may differ from claimed amounts and must be stored separately.
- Invoices must reference a certificate or explicitly record an exception reason.
- Payments may be allocated across one or more invoices.
- Retention is calculated using contract rules and caps.
- Advance recovery is calculated using contract rules and may vary by period.
- Currency values must preserve source currency and exchange-rate context when consolidation is required.
- Every business record must carry tenant ownership and audit metadata.

## 6. Constraints

- The first release is web-based.
- The system must support low-to-moderate connectivity and autosave draft work.
- The system must support Arabic RTL and English LTR.
- Financial calculations must be deterministic and reproducible.
- The system must export human-readable PDF and spreadsheet reports.
- The MVP does not replace statutory accounting software.

## 7. Assumptions

- Customers can provide existing BOQ and project data in spreadsheet form.
- Pilot customers will accept a guided onboarding process.
- External client-side reviewers may initially use secure links or limited portal accounts.
- Contract templates vary; the MVP uses configurable terms rather than attempting complete legal interpretation.

## 8. Success criteria

- A pilot customer can configure a project and produce the first payment application without engineering support.
- A payment application can be traced from line item to supporting evidence and final certificate.
- The dashboard reconciles claimed, certified, invoiced, collected, retained, and overdue amounts.
- All key calculations have automated tests and visible calculation breakdowns.
- The system prevents cross-tenant data access.

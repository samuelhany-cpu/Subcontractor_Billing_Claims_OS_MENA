# Release Plan and Product Backlog

The plan is organized by delivery sequence, not calendar promises.

## Epic 0 — Discovery and pilot validation

- Interview commercial managers and quantity surveyors
- Collect real payment application templates
- Collect BOQ samples
- Document retention and advance variants
- Map at least three project workflows
- Secure design-partner agreements

## Epic 1 — Foundation

### Stories

- Initialize monorepo and CI
- Establish environments and configuration
- Implement authentication
- Implement tenant and membership model
- Implement RBAC and project-level access
- Add localization framework
- Add audit event foundation

### Exit criteria

- Tenant isolation integration tests pass
- Arabic and English shell works
- Users can be invited and assigned roles

## Epic 2 — Clients, projects, and contracts

- Client records
- Project setup
- Contract commercial terms
- Retention and advance configuration
- Contract baseline workflow
- Project dashboard shell

## Epic 3 — BOQ and progress

- BOQ import wizard
- Validation and error report
- BOQ version publish
- Valuation period creation
- Progress-entry grid
- Cumulative calculation engine
- Evidence attachments

## Epic 4 — Payment applications

- Create application from valuation period
- Summary calculations
- Internal validation
- Submit and version
- PDF/XLSX export
- Revision workflow
- Application comments

## Epic 5 — Variations and evidence

- Variation register
- Status workflow
- Estimated/submitted/approved values
- Evidence checklist
- Application inclusion
- Aging dashboard

## Epic 6 — Certification

- Record certificate
- Claimed vs certified reconciliation
- Corrected-certificate workflow
- Certificate attachments
- Commercial variance report

## Epic 7 — Invoices, payments, and retention

- Invoice creation
- Payment allocation
- Aging
- Retention ledger
- Advance outstanding balance
- Reversal handling

## Epic 8 — Forecast and reporting

- Organization commercial dashboard
- 13-week forecast
- Project cash view
- Exportable reports
- Scheduled alerts

## Epic 9 — Pilot hardening

- Security review
- Performance tuning
- Backup and restore test
- Import migration tools
- Guided onboarding
- Product analytics
- Support runbook

## Initial priority backlog

| ID | Story | Priority | Dependency |
|---|---|---:|---|
| P-001 | Tenant-safe authentication and membership | Must | None |
| P-002 | Role and permission engine | Must | P-001 |
| P-003 | Project and client creation | Must | P-001 |
| P-004 | Contract commercial configuration | Must | P-003 |
| P-005 | BOQ CSV/XLSX import | Must | P-004 |
| P-006 | BOQ validation and publish | Must | P-005 |
| P-007 | Valuation period and progress grid | Must | P-006 |
| P-008 | Calculation engine | Must | P-004 |
| P-009 | Draft payment application | Must | P-007,P-008 |
| P-010 | Submission and immutable version | Must | P-009 |
| P-011 | PDF/XLSX export | Must | P-010 |
| P-012 | Variation register | Must | P-003 |
| P-013 | Certificate reconciliation | Must | P-010 |
| P-014 | Invoice and payment allocation | Must | P-013 |
| P-015 | Dashboard reconciliation | Must | P-014 |
| P-016 | Arabic RTL verification | Must | All UI |
| P-017 | External reviewer portal | Should | P-010 |
| P-018 | Scheduled notifications | Should | P-014 |
| P-019 | 13-week forecast | Should | P-014 |
| P-020 | Accounting integration | Later | Pilot demand |

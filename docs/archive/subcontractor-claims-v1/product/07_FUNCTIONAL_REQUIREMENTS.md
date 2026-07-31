# Functional Requirements

Requirement identifiers are stable and should be referenced in issues and tests.

## Identity and tenancy

- **FR-001** The system shall allow a user to authenticate using email and password.
- **FR-002** The system shall support organization membership and project-level access.
- **FR-003** The system shall prevent users from accessing data belonging to another organization.
- **FR-004** The system shall support invitation, acceptance, suspension, and removal of users.
- **FR-005** The system shall record security-sensitive actions in an audit log.

## Project and contract

- **FR-010** The system shall create and maintain client and project records.
- **FR-011** The system shall store project country, currency, timezone, language, and tax configuration.
- **FR-012** The system shall create a base contract and amendments.
- **FR-013** The system shall store retention, advance recovery, payment terms, and valuation rules.
- **FR-014** The system shall prevent direct modification of a published contract baseline.

## BOQ

- **FR-020** The system shall import BOQ items from XLSX or CSV.
- **FR-021** The system shall map source columns before import.
- **FR-022** The system shall support sections and hierarchical BOQ structure.
- **FR-023** The system shall calculate line amount as quantity multiplied by rate using decimal-safe arithmetic.
- **FR-024** The system shall validate duplicate item codes and invalid quantities/rates.
- **FR-025** The system shall version published BOQ baselines.

## Progress

- **FR-030** The system shall create valuation periods per project.
- **FR-031** The system shall capture current quantity or current completion percentage.
- **FR-032** The system shall calculate cumulative quantity and value.
- **FR-033** The system shall display previous, current, and cumulative values.
- **FR-034** The system shall flag progress exceeding configured limits.
- **FR-035** The system shall allow evidence attachment and notes per progress line.

## Payment applications

- **FR-040** The system shall create a payment application from a valuation period.
- **FR-041** The system shall calculate gross work value, variations, materials on site, deductions, retention, tax, advance recovery, and net claim.
- **FR-042** The system shall validate required data before submission.
- **FR-043** The system shall assign project-specific sequential numbers.
- **FR-044** The system shall create immutable submitted versions.
- **FR-045** The system shall export summary and detailed reports to PDF and XLSX.
- **FR-046** The system shall allow authorized withdrawal with reason.

## Variations

- **FR-050** The system shall create variation records from potential instruction through closure.
- **FR-051** The system shall store estimated, submitted, and approved values separately.
- **FR-052** The system shall store instruction, notice, quotation, and approval dates.
- **FR-053** The system shall attach evidence and correspondence.
- **FR-054** The system shall show aging by status.
- **FR-055** The system shall control whether a variation can be included in a payment application.

## Certification

- **FR-060** The system shall record certificates against payment applications.
- **FR-061** The system shall store certified amounts separately from claimed amounts.
- **FR-062** The system shall produce claimed-vs-certified variance reports.
- **FR-063** The system shall support corrected certificates without deleting prior records.

## Invoices and payments

- **FR-070** The system shall create an invoice from a final certificate.
- **FR-071** The system shall calculate due date from configured terms or allow authorized override.
- **FR-072** The system shall record partial and full payments.
- **FR-073** The system shall allocate one payment across one or more invoices.
- **FR-074** The system shall show aging buckets and overdue balances.
- **FR-075** The system shall track retention due and released.

## Reporting and forecast

- **FR-080** The system shall display claimed, certified, invoiced, collected, and outstanding totals.
- **FR-081** The system shall provide project and organization dashboards.
- **FR-082** The system shall calculate a configurable 13-week cash-in forecast.
- **FR-083** The system shall show pending and approved variation values.
- **FR-084** The system shall export filtered reports.

## Localization

- **FR-090** The system shall support Arabic RTL and English LTR.
- **FR-091** The system shall format dates, numbers, and currencies by locale.
- **FR-092** The system shall support bilingual report labels.

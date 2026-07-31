# Subcontractor Billing & Claims OS for MENA

## AI Development Pack

This repository-ready documentation pack defines the product, MVP scope, architecture, data model, APIs, security baseline, delivery backlog, and execution instructions for Claude and Codex.

## Product statement

A bilingual Arabic/English SaaS platform that helps subcontractors and specialist contractors prepare payment applications, manage variations and claims evidence, track certifications and collections, monitor retention and advance recovery, and forecast project cash flow.

## Primary customer

MENA subcontractors and specialist contractors managing multiple active projects and relying on Excel, PDFs, email, and WhatsApp to prepare and collect monthly payments.

## MVP promise

> Convert contract BOQ progress into a complete payment application, track it through review and certification, and show what is expected to be collected, delayed, retained, or at risk.

## Read order for AI agents

1. `product/01_PRODUCT_VISION.md`
2. `product/02_BRD.md`
3. `product/03_PRD_MVP.md`
4. `product/04_SCOPE_AND_NON_GOALS.md`
5. `product/05_PERSONAS_AND_JTBD.md`
6. `product/06_WORKFLOWS_AND_STATE_MACHINES.md`
7. `architecture/01_SYSTEM_ARCHITECTURE.md`
8. `architecture/02_DATA_MODEL.md`
9. `architecture/03_RBAC_AND_TENANCY.md`
10. `schemas/database_schema.sql`
11. `schemas/openapi.yaml`
12. `engineering/01_ENGINEERING_STANDARDS.md`
13. `engineering/02_SECURITY_AND_PRIVACY.md`
14. `engineering/03_TEST_STRATEGY.md`
15. `delivery/01_RELEASE_PLAN_AND_BACKLOG.md`
16. `prompts/CLAUDE_MASTER_PROMPT.md` or `prompts/CODEX_MASTER_PROMPT.md`

## Required implementation discipline

- Do not expand MVP scope without recording an Architecture Decision Record.
- Treat money, percentages, tax, retention, and progress calculations as deterministic domain logic with automated tests.
- Every business row must be tenant-scoped.
- Every material state change must be audit-logged.
- Arabic RTL and English LTR are MVP requirements, not future enhancements.
- Never use floating-point values for money.
- Do not claim legal or contractual correctness; the product supports contract administration but does not adjudicate legal entitlement.

## Repository shape

```text
apps/
  web/                 Next.js web application
  api/                 NestJS modular-monolith API
packages/
  domain/              shared domain types and calculation rules
  ui/                  shared design system
  config/              eslint, typescript, prettier
  test-utils/          fixtures and test helpers
infra/
  docker/
  terraform/           optional after pilot
  monitoring/
docs/                  copy of this documentation pack
```

## MVP modules

- Identity, organizations, memberships, and roles
- Clients, projects, contracts, currencies, taxes, and terms
- BOQ / Schedule of Values
- Monthly progress measurement
- Payment applications
- Variation order register and evidence
- Payment certificates
- Commercial invoices and collections
- Retention and advance-payment recovery
- Documents, comments, approvals, notifications, and audit log
- Cash-flow and aging dashboards
- Arabic/English localization and export-ready reports

## Non-MVP modules

- Full accounting general ledger
- Procurement and inventory
- Payroll and HR
- Primavera/MS Project scheduling
- BIM authoring
- Government tax submission
- Banking integration
- Dispute adjudication or legal advice
- AI-generated legal claims

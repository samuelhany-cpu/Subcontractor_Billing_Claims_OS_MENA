# Architecture Decision Record Log

## ADR-001 — Modular monolith for MVP

**Decision:** Use one deployable backend with explicit domain modules.

**Reason:** Faster delivery and simpler operations while preserving future extraction boundaries.

## ADR-002 — Shared-schema multi-tenancy

**Decision:** Use tenant IDs in a shared PostgreSQL schema.

**Reason:** Efficient SaaS operations and analytics for early scale.

**Controls:** Mandatory tenant context, repository filters, tests, optional PostgreSQL RLS.

## ADR-003 — Immutable submitted financial versions

**Decision:** Submitted applications, final certificates, and issued invoices cannot be overwritten.

**Reason:** Financial traceability and dispute evidence.

## ADR-004 — Exact decimal arithmetic

**Decision:** Use database numeric types and a decimal library.

**Reason:** JavaScript floating-point arithmetic is not acceptable for contract values.

## ADR-005 — REST API

**Decision:** Use versioned REST with OpenAPI.

**Reason:** Broad integration compatibility and clear contracts.

## ADR-006 — Background exports and imports

**Decision:** Use queue-backed jobs for large imports, exports, scanning, and notifications.

**Reason:** Reliability and API responsiveness.

## ADR-007 — Arabic and English as MVP languages

**Decision:** Localization and RTL support are foundational.

**Reason:** Regional product positioning and pilot usability.

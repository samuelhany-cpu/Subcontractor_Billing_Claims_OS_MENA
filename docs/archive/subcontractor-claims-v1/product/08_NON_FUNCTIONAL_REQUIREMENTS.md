# Non-Functional Requirements

## Performance

- **NFR-001** Standard authenticated pages should reach usable content within 3 seconds on a typical broadband connection for datasets within MVP limits.
- **NFR-002** Common API reads should have p95 server response time below 500 ms excluding large exports.
- **NFR-003** Long-running imports and exports shall execute asynchronously with visible status.
- **NFR-004** Pagination and server-side filtering are required for all large lists.

## Availability and recovery

- **NFR-010** Target monthly availability for pilot: 99.5% excluding announced maintenance.
- **NFR-011** Production database backups shall be automated and encrypted.
- **NFR-012** Target RPO: 24 hours for pilot, improving before general availability.
- **NFR-013** Target RTO: 8 hours for pilot, improving before general availability.

## Security

- **NFR-020** All traffic shall use TLS.
- **NFR-021** Passwords shall use an approved adaptive hashing algorithm.
- **NFR-022** Authorization shall be enforced server-side.
- **NFR-023** All tenant-owned queries shall require tenant scope.
- **NFR-024** Sensitive configuration shall be stored in a secrets manager or protected runtime environment.
- **NFR-025** Critical actions shall be audit logged.
- **NFR-026** File uploads shall be scanned and restricted by type and size.

## Data integrity

- **NFR-030** Money shall be stored in integer minor units or exact decimal types.
- **NFR-031** Quantity and percentage precision shall be configurable within defined limits.
- **NFR-032** Submitted financial records shall be immutable and versioned.
- **NFR-033** Database constraints shall enforce unique numbering and valid relationships.
- **NFR-034** Every calculated output shall expose a reproducible breakdown.

## Usability and accessibility

- **NFR-040** The product shall support desktop and tablet responsive layouts.
- **NFR-041** Keyboard navigation shall be supported for primary workflows.
- **NFR-042** Forms shall provide clear field-level validation.
- **NFR-043** Arabic layouts shall be tested independently, not mechanically mirrored.
- **NFR-044** Core workflows should target WCAG 2.1 AA practices.

## Maintainability

- **NFR-050** The backend shall use a modular-monolith architecture with explicit module boundaries.
- **NFR-051** Domain calculations shall be isolated from transport and persistence layers.
- **NFR-052** New business rules require automated tests.
- **NFR-053** Public APIs shall be versioned.
- **NFR-054** Database migrations shall be forward-only and reviewed.

## Observability

- **NFR-060** The system shall emit structured logs with request and tenant correlation IDs.
- **NFR-061** Production errors shall be captured in an error-tracking system.
- **NFR-062** Health, latency, queue, and database metrics shall be monitored.
- **NFR-063** Audit logs shall be separate from application debug logs.

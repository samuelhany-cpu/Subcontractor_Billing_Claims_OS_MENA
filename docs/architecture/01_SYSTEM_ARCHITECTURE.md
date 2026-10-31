# System Architecture

## Style

Modular monolith.

## Technology

- Web: Next.js, TypeScript, Arabic RTL.
- API: NestJS, TypeScript.
- Database: PostgreSQL.
- ORM: Prisma, matching the existing foundation.
- Cache/transient state: Redis.
- Attachments: MinIO through S3-compatible abstraction.
- Automation: future self-hosted n8n integration (not part of the active runtime).
- Local runtime: Docker Compose on Windows.
- Spreadsheet generation/import: server-side library selected by the implementation team, with formula-safe tests.
- Currency math: decimal library plus PostgreSQL `numeric`.

## Production-local topology

```text
Phone / LAN Browser
        |
        v
Next.js Web (only published container port)
        |
        v
NestJS API (internal Docker network)
   |        |          |
   v        v          v
Postgres   Redis      MinIO

frontend network: web <-> api
backend network (internal): api <-> postgres, redis, minio
```

## Exposure rules

- Web app is accessible on the private LAN.
- API is not directly published to the LAN in production-local mode when reverse proxying through the web container is available.
- PostgreSQL, Redis, and MinIO are not publicly exposed.
- n8n and Telegram are not started by the production-local Compose file. Their
  activation remains separately gated by OPEN-001 and OPEN-002.
- The web process makes server-side API calls through `API_INTERNAL_URL`; a
  browser never resolves a Docker service name or receives backend credentials.
- No app login page, per owner decision.

## Modules

- Projects
- Categories
- Payees
- Agreements
- Expenses
- Transfers
- Dashboard
- Reports
- Excel Import
- Excel Export
- Attachments
- Recycle Bin
- Audit History
- Automation Drafts
- Backup
- Settings

## Module dependency rules

- Reports read through public application services, not direct cross-module table writes.
- n8n uses HTTP APIs, not PostgreSQL.
- Expense module owns amount calculation.
- Dashboard owns no financial data; it queries expense and transfer services.
- Agreements derive paid values from Expense queries.
- Audit receives application events.
- Attachments are referenced by expense records but stored through an object-storage interface.

## No-auth architecture

There is no interactive account system.

The app assumes trusted access to the private LAN. This does not remove:

- Input validation.
- CSRF protection where applicable.
- Safe file handling.
- Audit history.
- Telegram chat ID restriction.
- Network exposure controls.

## Existing foundation compatibility

Do not rewrite the completed foundation unless necessary.

Remove or do not implement:

- Tenant context.
- RBAC.
- User membership.
- Authentication flows.

Preserve:

- Health/readiness.
- Correlation IDs.
- Structured logging.
- Environment validation.
- Docker infrastructure.
- Tests and CI.

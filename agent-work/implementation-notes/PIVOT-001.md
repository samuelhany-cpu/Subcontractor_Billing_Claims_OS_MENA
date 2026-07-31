# PIVOT-001 — Repository alignment

## Objective and requirement mapping

This slice implements delivery backlog item `PIVOT-001`. It aligns active documentation and planning with the Local Project Expense Tracker while preserving completed and in-progress technical foundation. It intentionally implements none of the business requirement IDs listed in `docs/product/05_FUNCTIONAL_REQUIREMENTS.md`.

Acceptance evidence required by the task:

- old Claims documentation is retained under `docs/archive/subcontractor-claims-v1/`;
- the Local Project Expense Tracker pack is installed at the `docs/` root;
- active README product descriptions identify the new product;
- active planning uses the new requirement IDs and starts with `CORE-001`;
- code is inventoried before any business-code deletion;
- no project, expense, transfer, payee, agreement, category, audit, import, automation, or backup tables are created;
- OPEN-001 through OPEN-005 remain unresolved.

## Preflight findings

- `master` starts from two completed commits:
  - `648f7b5` — FOUND-001A monorepo quality baseline;
  - `5669b7f` — FOUND-001B local runtime dependencies and configuration.
- The worktree was already dirty before PIVOT-001. It contained an uncommitted FOUND-001C-style health/observability slice, lockfile changes, the staged documentation pack under `docs/Local_Project_Expense_Tracker/`, and a copy of the old docs under `docs/archive/ClaimsOS/`.
- Those pre-existing API and lockfile changes were preserved and are not attributed to this task.
- Both the archived Claims pack and the complete new documentation pack were read in their prescribed orders before repository edits.

## Documentation and planning changes

- Moved the old product pack to `docs/archive/subcontractor-claims-v1/`.
- Installed the new pack directly at `docs/` and removed the empty staging directory.
- Updated the root and API README product descriptions.
- Replaced active README examples that depended on the legacy package scope with path-based pnpm filters.
- Reset execution state and requirement coverage to the new backlog and functional requirement IDs.
- Added a dependency-ordered queue beginning with `CORE-001`.
- Did not select Telegram connectivity, parser provider, backup time, Drive folder, or retention policy.

## Code inventory

| Area                      | Evidence                                                                                                | Classification and disposition                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo and CI           | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.github/workflows/quality.yml`, `packages/config` | Valid foundation; preserve                                                                                                                                          |
| Web scaffold              | `apps/web`                                                                                              | Valid Next.js foundation; preserve; no Claims business screens found                                                                                                |
| API configuration         | `apps/api/src/config`                                                                                   | Valid typed environment foundation; preserve                                                                                                                        |
| PostgreSQL/Prisma         | `apps/api/prisma/schema.prisma`, database adapter                                                       | Valid foundation; schema contains no domain models or migrations                                                                                                    |
| Redis                     | `apps/api/src/infrastructure/redis`                                                                     | Valid foundation; preserve                                                                                                                                          |
| Object storage            | `apps/api/src/infrastructure/object-storage`                                                            | Valid private S3-compatible foundation; preserve                                                                                                                    |
| Health/readiness          | `apps/api/src/health`, infrastructure readiness tests                                                   | Owned by FOUND-001C and committed separately as `1110186`; preserve                                                                                                 |
| HTTP/observability        | `apps/api/src/http`, `apps/api/src/observability`                                                       | Owned by FOUND-001C and committed separately as `1110186`; preserve                                                                                                 |
| Shared domain/UI packages | `packages/domain`, `packages/ui`                                                                        | Empty/framework-neutral boundaries; preserve; no Claims rules found                                                                                                 |
| Active business modules   | source-tree and Prisma inspection                                                                       | None found: no Claims, BOQ, payment-application, tenancy, membership, authentication, RBAC, tax, certificate, retention, or variation module/model/migration exists |

## Obsolete and compatibility inventory

| Item                                                                                            | State                                                           | Disposition                                                                                              |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Claims product requirements, schemas, samples, and prompts                                      | Obsolete product definition                                     | Archived intact under `docs/archive/subcontractor-claims-v1/`; not active source of truth                |
| `@claims-os/*` package scope and root package name                                              | Legacy technical identifier established by completed foundation | Retained to avoid a cross-cutting package/lockfile rename during the pivot and to protect inherited work |
| `claims-os-api` service name                                                                    | Legacy diagnostic identifier                                    | Retained for compatibility; it does not activate a Claims domain                                         |
| Compose project, volume, database, credential-placeholder, and bucket names containing `claims` | Legacy local infrastructure identifiers                         | Retained because renaming can orphan existing named volumes/data; no business meaning is inferred        |
| Object-storage test strings such as `Tenant Evidence`                                           | Legacy test fixture wording                                     | Retained as non-domain adapter tests; candidate for a later isolated naming cleanup                      |

No old business code was deleted because none exists. No preserved infrastructure was rewritten solely for branding.

## Implementation queue

The dependency-ordered queue is maintained in `agent-work/progress/execution-state.md`. It begins with `CORE-001`, then project/category/payee foundations, expenses and transfers, reporting/import, automation, backup, and Windows release.

## Risks and follow-up

- Technical identifiers still contain legacy branding. A future isolated rename should include an explicit data-preservation plan for Docker volumes and local object storage.
- REPO-001 reviewed and committed FOUND-001C separately before staging the focused PIVOT-001 state; no foundation work is attributed to the pivot commit.
- Business implementation must not start until PIVOT-001 verification is recorded; the next eligible slice is `CORE-001`.

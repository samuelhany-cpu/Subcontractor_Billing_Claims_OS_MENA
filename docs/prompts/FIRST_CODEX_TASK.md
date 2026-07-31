# First Codex Task — PIVOT-001

## Objective

Align the existing repository with the new Local Project Expense Tracker documentation while preserving all valid completed foundation work.

## Preflight

- Inspect Git status and log.
- Read current old docs and this new pack.
- Identify completed tasks.
- Identify any active Claims domain code.
- Do not rewrite completed commits.
- Do not begin business implementation in this task.

## Work

1. Move existing Claims product docs to:
   - `docs/archive/subcontractor-claims-v1/`
2. Install the new documentation pack at `docs/`.
3. Update root README product description.
4. Remove active planning references to:
   - Claims
   - BOQ
   - payment applications
   - tenancy
   - authentication
   - RBAC
5. Preserve:
   - apps
   - packages
   - Docker infrastructure
   - Prisma foundation
   - logging/health
   - tests/CI
6. Inspect code for old business modules.
7. Do not delete old business code without a written inventory and evidence.
8. Create new requirement coverage file using the new requirement IDs.
9. Create a dependency-ordered implementation queue beginning with `CORE-001`.

## Required outputs

- `agent-work/implementation-notes/PIVOT-001.md`
- `agent-work/test-reports/PIVOT-001.md`
- updated execution state
- updated requirement coverage
- inventory of preserved and obsolete code
- one focused commit if all checks pass

## Quality gates

- frozen install
- format check
- lint
- strict typecheck
- tests
- API e2e
- build
- Docker Compose config
- clean worktree

## Forbidden

- Do not create project/expense/payee tables yet.
- Do not choose open decisions.
- Do not implement Telegram workflows.
- Do not implement auth.
- Do not implement taxes or accounting.

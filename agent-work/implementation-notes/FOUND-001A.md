# FOUND-001A — Monorepo quality baseline

## Scope

Establish the dependency-correct repository baseline requested by
`docs/prompts/FIRST_CODEX_TASK.md`: Turborepo orchestration, strict shared
TypeScript defaults, explicit shared package boundaries, repeatable root quality
commands, and CI.

## Requirements and acceptance

- NFR-050: preserve modular-monolith boundaries.
- NFR-051: isolate future domain calculations from apps.
- NFR-052: provide an automated test gate for new business rules.
- NFR-053: preserve the versioned REST requirement for the API follow-up.
- NFR-054: prepare forward-only migration validation without creating business
  tables in this task.
- First-task acceptance: clean install and CI commands must pass.

## Deliberate limits

No authentication, tenant tables, migrations, financial calculations, or
business endpoints are introduced. The UI package exposes framework-neutral
localization shell types only; the actual bilingual route shell is a later,
testable foundation slice.

# FOUND-001A Test Report

Date: 2026-07-29

## Passing validation

| Command                                 | Result                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`        | Passed; all six workspace projects resolved from the repository lockfile |
| `pnpm format:check`                     | Passed                                                                   |
| `pnpm lint`                             | Passed for API and web workspaces                                        |
| `pnpm typecheck`                        | Passed for API, web, domain, and UI workspaces                           |
| `pnpm test`                             | Passed: one API unit test and one domain boundary unit test              |
| `pnpm --filter @claims-os/api test:e2e` | Passed: one API end-to-end smoke test                                    |
| `pnpm build`                            | Passed for API, web, domain, and UI workspaces                           |

## Review checks

- No matching private-key, AWS access-key, API-key assignment, or password
  assignment patterns were found outside documentation and dependencies.
- No skipped tests were found.
- No explicit `any` usage was found in application or package source.
- Generated build output, dependency folders, local environment files, and
  Turbo/Next caches are ignored.

## Warnings and limits

- pnpm reports that pre-existing Prisma engine lifecycle scripts are blocked by
  its build-script approval policy. Prisma has no schema and is not exercised by
  this task; no install policy was weakened.
- Docker infrastructure, migration validation, dependency health checks, and
  localization behavior are outside FOUND-001A and remain unverified.

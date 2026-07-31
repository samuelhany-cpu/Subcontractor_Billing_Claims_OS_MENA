# REPO-001 — Separate and commit FOUND-001C and PIVOT-001

## Objective

Produce an auditable Git history for the valid uncommitted FOUND-001C and PIVOT-001 work without resetting, cleaning, discarding, rewriting, or reimplementing it. CORE-001 was not started.

## Preflight

The repository began REPO-001 on `master` at:

- `5669b7f` — FOUND-001B;
- `648f7b5` — FOUND-001A.

The worktree contained the complete FOUND-001C API foundation, the complete PIVOT-001 documentation/product pivot, current progress files, and no unrelated/unknown changes. `git diff --check` passed.

The mandatory FOUND-001C implementation note and test report were missing. The implementation itself was complete, so only those approved-scope records were added.

## Classification

Every path from `git status --porcelain=v1 -uall` was classified in `agent-work/implementation-notes/REPO-001-change-classification.md`.

- FOUND-001C: API health/readiness, correlation, logging, centralized errors, lifecycle, configuration, dependencies, tests, and dedicated FOUND records.
- PIVOT-001: product identity, active expense-tracker docs, preserved Claims archive, current progress/coverage, and dedicated PIVOT records.
- Shared current-state records: execution state and requirement coverage; assigned to PIVOT-001 as permitted.
- Unrelated or unknown: none.

## Mixed-file handling

Three tracked files contained both tasks:

| File                        | FOUND-001C intermediate state                                               | PIVOT-001 final state                                           |
| --------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `README.md`                 | Old product identity plus new diagnostics/observability usage               | New product identity and path-based package commands            |
| `apps/api/README.md`        | `Claims OS API` title plus FOUND diagnostics documentation                  | Local Project Expense Tracker API title and path-based commands |
| `docs/schemas/openapi.yaml` | Old Claims API contract plus health/readiness/problem correlation additions | New Local Project Expense Tracker reference API contract        |

Verified intermediate files were created under `F:\tmp\repo-001-found-001c`, written as Git blobs with `git hash-object -w`, and placed only in the index with explicit `git update-index --cacheinfo`. The worktree final versions were never replaced or discarded. Both cached diffs were reviewed with `git diff --cached --check`, `git diff --cached --name-status`, `git diff --cached --stat`, and `git diff --cached`.

## Commit separation

- `1110186` — `feat(api): add health and request observability foundation [FOUND-001C]`
- `9c462f2` — `chore(product): pivot to local project expense tracker [PIVOT-001]`
- REPO-001 records — `chore(repo): record pivot commit separation [REPO-001]`

The REPO-001 maintenance commit hash cannot be embedded in its own content; it is reported in the completion response and visible in Git history.

## FOUND-001C validation

Verified:

- dependency-free liveness;
- bounded concurrent readiness;
- PostgreSQL `SELECT 1` readiness;
- Redis `PING` readiness and controlled-down behavior;
- object-storage private-bucket readiness;
- caller/generated correlation IDs and parallel isolation;
- structured Pino logging and route/status/duration events;
- sensitive key, credential, connection URL, signed URL, and error redaction;
- centralized correlated RFC 7807 handling;
- shutdown hooks, lifecycle events, and PostgreSQL/Redis/S3 cleanup;
- 67 API unit tests, 8 API e2e tests, and 2 live infrastructure tests.

The infrastructure suite's one late-handle timing warning did not reproduce with `--detectOpenHandles`; that diagnostic run passed with no reported handle.

## PIVOT-001 validation

- `docs/00_README.md` is the Local Project Expense Tracker entry point.
- Claims documentation remains intact under `docs/archive/subcontractor-claims-v1/`.
- Root and API README identities use Local Project Expense Tracker.
- No active old-planning filename remains.
- Execution state shows PIVOT-001 complete, FOUND-001C committed, and CORE-001 next eligible but not started.
- Requirement coverage uses only active expense-tracker requirement IDs while preserving foundation evidence.
- OPEN-001 through OPEN-005 remain unresolved.

## Compromises and corrections

- A third commit is necessary because REPO-001 records must contain the already-created PIVOT-001 hash; self-referential inclusion in the PIVOT commit is impossible.
- Two test-only lint corrections made during PIVOT verification belong to FOUND-001C and were committed there.
- One malformed targeted Jest invocation ran zero tests; it was immediately replaced by the correct executable invocation, which ran all 67 API unit tests.
- Docker Desktop was initially stopped; it was started to complete real-adapter validation.
- Legacy technical `claims` identifiers remain intentionally compatible and are not an active Claims business domain.

## Final repository state

After committing these REPO-001 records, `git status --short` is expected to produce no output. This assertion is verified immediately after the maintenance commit; if it does not hold, REPO-001 is not complete.

# REPO-001 — Change Classification

## Scope and method

This report classifies every path reported by `git status --porcelain=v1 -uall` during REPO-001 preflight, plus the mandatory records that REPO-001 must create. Tracked diffs, all untracked API files, the complete new documentation pack, and the preserved Claims archive were inspected. No unrelated or unknown change remains after classification.

Three files contain mixed task history and require explicit intermediate index blobs rather than worktree rewrites: `README.md`, `apps/api/README.md`, and `docs/schemas/openapi.yaml`. The progress files intentionally represent only latest current state and belong to PIVOT-001, as permitted by REPO-001.

A third `REPO-001` maintenance commit is necessary because the final records must contain the already-created PIVOT-001 commit hash; a commit cannot truthfully contain its own hash.

## Per-file classification

| File path | Preflight status | Owning task | Reason | Mixed hunks/state | Planned commit |
| --- | --- | --- | --- | --- | --- || `README.md` | `M` | FOUND-001C + PIVOT-001 | FOUND-001C diagnostics/observability usage plus PIVOT product identity and path-based command wording | Yes | Split: FOUND-001C intermediate blob, then PIVOT-001 final blob |
| `agent-work/progress/execution-state.md` | `M` | Shared progress/documentation state | Latest current state after both tasks; historical FOUND state must not be fabricated | No | PIVOT-001 |
| `agent-work/progress/requirement-coverage.md` | `M` | Shared progress/documentation state | Latest active expense-tracker coverage plus preserved foundation summary | No | PIVOT-001 |
| `apps/api/.env.example` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/.env.test.example` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/README.md` | `M` | FOUND-001C + PIVOT-001 | FOUND-001C API diagnostics documentation with PIVOT title and path-based command wording | Yes | Split: FOUND-001C intermediate blob, then PIVOT-001 final blob |
| `apps/api/package.json` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/app.controller.spec.ts` | `D` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/app.controller.ts` | `D` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/app.module.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/app.service.ts` | `D` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/config/api-config.module.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/config/api-config.spec.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/config/api-config.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/infrastructure/check-infrastructure.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/infrastructure/infrastructure.module.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/infrastructure/object-storage/object-storage.service.spec.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/infrastructure/object-storage/object-storage.service.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/infrastructure/redis/redis.service.spec.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/infrastructure/redis/redis.service.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/main.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/test/setup-environment.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/test/app.e2e-spec.ts` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `docs/00_README.md` | `M` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/ARABIC_HANDOFF_GUIDE.md` | `M` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/FILE_INVENTORY.json` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/MANIFEST.json` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/architecture/01_SYSTEM_ARCHITECTURE.md` | `M` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/architecture/02_DATA_MODEL.md` | `M` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/architecture/03_RBAC_AND_TENANCY.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/architecture/04_CALCULATION_RULES.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/01_RELEASE_PLAN_AND_BACKLOG.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/02_ACCEPTANCE_CRITERIA.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/03_PRODUCT_ANALYTICS_AND_KPIS.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/04_RISK_REGISTER.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/05_ADR_LOG.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/06_DEFINITION_OF_READY_AND_DONE.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/07_PILOT_PLAN.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/08_PRICING_ASSUMPTIONS.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/01_ENGINEERING_STANDARDS.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/02_SECURITY_AND_PRIVACY.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/03_TEST_STRATEGY.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/04_OBSERVABILITY_AND_RUNBOOK.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/01_PRODUCT_VISION.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/02_BRD.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/03_PRD_MVP.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/04_SCOPE_AND_NON_GOALS.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/05_PERSONAS_AND_JTBD.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/06_WORKFLOWS_AND_STATE_MACHINES.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/07_FUNCTIONAL_REQUIREMENTS.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/08_NON_FUNCTIONAL_REQUIREMENTS.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/09_UX_INFORMATION_ARCHITECTURE.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/10_GLOSSARY.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/prompts/AGENT_HANDOFF_WORKFLOW.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/prompts/CLAUDE_MASTER_PROMPT.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/prompts/CODEX_MASTER_PROMPT.md` | `M` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/prompts/FIRST_CLAUDE_TASK.md` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/prompts/FIRST_CODEX_TASK.md` | `M` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/samples/sample_boq.csv` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/samples/sample_project.json` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/schemas/database_schema.sql` | `D` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/schemas/openapi.yaml` | `M` | FOUND-001C + PIVOT-001 | FOUND-001C added diagnostics contract to old API schema; PIVOT replaces active contract with expense-tracker API | Yes (historical whole-file states) | Split: archived pre-pivot contract in FOUND-001C, final active contract in PIVOT-001 |
| `pnpm-lock.yaml` | `M` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `agent-work/implementation-notes/PIVOT-001.md` | `??` | PIVOT-001 | Dedicated pivot implementation or verification record | No | PIVOT-001 |
| `agent-work/test-reports/PIVOT-001.md` | `??` | PIVOT-001 | Dedicated pivot implementation or verification record | No | PIVOT-001 |
| `apps/api/src/app.setup.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/app.setup.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/health/health.contract.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/health/health.controller.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/health/health.module.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/health/health.service.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/health/health.service.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/health/readiness-check.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/http/http-exception.filter.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/http/http-exception.filter.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/http/problem-details.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/application-lifecycle.service.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/application-lifecycle.service.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/correlation-context.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/correlation-context.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/correlation.middleware.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/correlation.middleware.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/observability.module.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/request-logging.middleware.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/request-logging.middleware.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/structured-logger.service.spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/src/observability/structured-logger.service.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/test/health-infrastructure.infra-spec.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/test/jest-infrastructure.json` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `apps/api/test/setup-infrastructure-environment.ts` | `??` | FOUND-001C | Health/readiness, correlation, structured logging, error handling, lifecycle, configuration, dependency, or supporting test change | No | FOUND-001C |
| `docs/REFERENCES.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/00_README.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/ARABIC_HANDOFF_GUIDE.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/FILE_INVENTORY.json` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/MANIFEST.json` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/architecture/01_SYSTEM_ARCHITECTURE.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/architecture/02_DATA_MODEL.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/architecture/03_RBAC_AND_TENANCY.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/architecture/04_CALCULATION_RULES.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/01_RELEASE_PLAN_AND_BACKLOG.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/02_ACCEPTANCE_CRITERIA.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/03_PRODUCT_ANALYTICS_AND_KPIS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/04_RISK_REGISTER.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/05_ADR_LOG.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/06_DEFINITION_OF_READY_AND_DONE.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/07_PILOT_PLAN.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/delivery/08_PRICING_ASSUMPTIONS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/engineering/01_ENGINEERING_STANDARDS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/engineering/02_SECURITY_AND_PRIVACY.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/engineering/03_TEST_STRATEGY.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/engineering/04_OBSERVABILITY_AND_RUNBOOK.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/01_PRODUCT_VISION.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/02_BRD.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/03_PRD_MVP.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/04_SCOPE_AND_NON_GOALS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/05_PERSONAS_AND_JTBD.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/06_WORKFLOWS_AND_STATE_MACHINES.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/07_FUNCTIONAL_REQUIREMENTS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/08_NON_FUNCTIONAL_REQUIREMENTS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/09_UX_INFORMATION_ARCHITECTURE.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/product/10_GLOSSARY.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/prompts/AGENT_HANDOFF_WORKFLOW.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/prompts/CLAUDE_MASTER_PROMPT.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/prompts/CODEX_MASTER_PROMPT.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/prompts/FIRST_CLAUDE_TASK.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/prompts/FIRST_CODEX_TASK.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/samples/sample_boq.csv` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/samples/sample_project.json` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/schemas/database_schema.sql` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/archive/subcontractor-claims-v1/schemas/openapi.yaml` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/01_BACKLOG.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/02_PIVOT_MIGRATION_PLAN.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/delivery/03_OPEN_DECISIONS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/01_SECURITY_AND_LOCAL_NETWORK.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/02_TEST_STRATEGY.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/03_ACCEPTANCE_CRITERIA.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/engineering/04_WINDOWS_LOCAL_DEPLOYMENT.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/integrations/01_N8N_TELEGRAM_SPEC.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/integrations/02_EXCEL_IMPORT_EXPORT_SPEC.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/integrations/03_BACKUP_GOOGLE_DRIVE_SPEC.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/integrations/04_N8N_WORKFLOW_BLUEPRINT.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/01_DECISION_LOG.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/02_PRODUCT_VISION.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/03_SCOPE.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/04_PRD.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/05_FUNCTIONAL_REQUIREMENTS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/06_BUSINESS_RULES.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/07_USER_FLOWS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/08_INFORMATION_ARCHITECTURE.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/product/09_UI_SPEC.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/samples/legacy_excel_mapping.json` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/samples/sample_api_payloads.json` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/schemas/schema.prisma` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `docs/source-analysis/01_SOURCE_WORKBOOK_ANALYSIS.md` | `??` | PIVOT-001 | New active expense-tracker documentation, removal of old active docs, or preserved Claims archive | No | PIVOT-001 |
| `agent-work/implementation-notes/FOUND-001C.md` | `new` | FOUND-001C | Required completion record missing at preflight | No | FOUND-001C |
| `agent-work/test-reports/FOUND-001C.md` | `new` | FOUND-001C | Required verification record missing at preflight | No | FOUND-001C |
| `agent-work/implementation-notes/REPO-001-change-classification.md` | `new` | Shared progress/documentation state | Mandatory per-file classification report | No | REPO-001 |
| `agent-work/implementation-notes/REPO-001.md` | `new` | Shared progress/documentation state | Final separation and commit-history record | No | REPO-001 |
| `agent-work/test-reports/REPO-001.md` | `new` | Shared progress/documentation state | Final post-commit validation record | No | REPO-001 |

## Separation rules

- FOUND-001C receives all API implementation/configuration/dependency/test paths, the two dedicated FOUND records, and historical pre-pivot versions of the three mixed files.
- PIVOT-001 receives the final versions of the mixed files, all active/archived product documentation, current progress/coverage, and PIVOT records.
- REPO-001 receives only this classification and the final separation/validation records.
- No file is discarded, reset, cleaned, or rewritten in the worktree to manufacture history. Mixed historical states are written only to the Git index for the relevant commit.

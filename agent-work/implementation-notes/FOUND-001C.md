# FOUND-001C — Health and request observability foundation

## Scope and requirements

FOUND-001C completes the reusable API diagnostics and request-observability foundation deferred by FOUND-001B. It covers the approved foundation portions of:

- `NFR-053` — public API versioning under `/api/v1`;
- `NFR-060` — structured request logs and correlation identifiers;
- `NFR-062` — liveness/readiness and PostgreSQL, Redis, and object-storage dependency visibility.

This slice adds no business domain, authentication, tenancy, RBAC, financial calculation, or database model.

## Implemented behavior

### Health and readiness

- `GET /api/v1/health/live` returns process liveness without calling dependencies.
- `GET /api/v1/health/ready` checks PostgreSQL, Redis, and private S3-compatible object storage concurrently.
- Each dependency check is bounded by validated `HEALTH_CHECK_TIMEOUT_MS` configuration.
- Readiness returns HTTP 200 only when all dependencies are up and HTTP 503 otherwise.
- Responses and warning logs expose stable dependency names/states only, never provider errors or credentials.
- The standalone infrastructure check uses the committed safe `.env.test.example` placeholders unless explicitly overridden.

### Correlation and request logging

- Every request receives `x-correlation-id`.
- Safe caller identifiers are preserved; absent or invalid values are replaced with UUIDs.
- `AsyncLocalStorage` isolates correlation state across concurrent requests.
- Request completion/abort logs contain method, normalized route, status, duration, event, and correlation context.
- Successful health probes log at debug; readiness failures log at warn.
- `REQUEST_LOGGING=false` disables completion records without disabling correlation.

### Structured logging and errors

- Pino emits JSON logs with service, environment, timestamp, level, event, and correlation context.
- Pretty output is explicit local-development behavior and is rejected in production configuration.
- Sensitive key patterns, credentials, cookies, tokens, connection URLs, signed URLs, circular data, and raw error messages are sanitized.
- A global exception filter returns RFC 7807 problem details.
- Unexpected errors return a generic correlated 500 response and are logged once without provider details.

### Lifecycle and shutdown

- Bootstrap buffers logs until the structured logger is installed.
- The API prefix, CORS, logger, and Nest shutdown hooks are configured in one reusable setup function.
- Startup and shutdown lifecycle events are structured.
- PostgreSQL disconnects, Redis quits/disconnects without retry, and the S3 client is destroyed on application shutdown.
- Startup failure writes one minimal sanitized fatal JSON record and sets a failing process exit code.

## Configuration and dependencies

Added runtime fields:

- `SERVICE_NAME`
- `LOG_FORMAT`
- `REQUEST_LOGGING`
- `HEALTH_CHECK_TIMEOUT_MS`

Added runtime packages:

- `pino`
- `pino-pretty`

Added the isolated `test:infra` script and infrastructure Jest configuration for real-adapter readiness tests.

## File ownership

FOUND-001C owns the API health, HTTP, observability, bootstrap/setup, lifecycle, dependency-readiness, configuration, environment-template, package/lockfile, and related test changes classified in `agent-work/implementation-notes/REPO-001-change-classification.md`.

The root README, API README, and old active OpenAPI contract contain mixed FOUND-001C/PIVOT-001 history. REPO-001 stages their pre-pivot FOUND-001C states in this commit and their final expense-tracker states in PIVOT-001 without modifying or discarding the worktree versions.

## Verification corrections

During PIVOT-001 verification, two inherited test-only lint issues were corrected:

- Redis shutdown assertions inspect mock call arrays instead of passing unbound mock methods.
- The secondary live-infrastructure Nest application uses contextual `INestApplication<App>` typing.

These changes do not alter runtime behavior.

## Deliberate limits

- External production error-tracking integration (`NFR-061`) is not claimed by this task.
- Queue readiness and metrics remain deferred because no queue/business workload exists yet.
- Legacy `claims` technical identifiers remain for compatibility and are not business-domain implementation.
- The AWS SDK currently supports the repository Node 20 baseline but warns that releases after early January 2027 will require Node 22.

# Observability and Operations Runbook

## Telemetry

### Logs

Structured JSON logs with:

- timestamp
- level
- service
- environment
- request_id
- correlation_id
- tenant_id where safe
- user_id where safe
- route/job
- duration
- error code

Do not log document content, passwords, tokens, or full financial exports.

### Metrics

- API request count, latency, and error rate
- Database pool usage and slow queries
- Queue depth, failures, and retry count
- Export duration and failure rate
- Authentication failures
- File scan failures
- Tenant storage usage
- Notification delivery failures

### Product-operational metrics

- BOQ imports completed/failed
- Applications submitted
- Certificate reconciliation failures
- Payment allocation errors
- Dashboard refresh age

## Health endpoints

- Liveness
- Readiness
- Database dependency
- Redis dependency
- Storage dependency
- Queue dependency

Do not expose sensitive diagnostics publicly.

## Incident severity

- **SEV-1:** cross-tenant exposure, widespread outage, confirmed data loss
- **SEV-2:** major workflow unavailable, financial integrity risk
- **SEV-3:** degraded feature or limited customer impact
- **SEV-4:** minor defect

## Immediate response priorities

1. Contain access or mutation
2. Preserve evidence and logs
3. Disable affected feature if needed
4. Notify responsible team
5. Restore service safely
6. Communicate verified facts
7. Conduct post-incident review

## Backup and restore

- Automated database backups
- Object storage versioning or backup policy
- Periodic restore test
- Documented ownership of recovery
- Restore into isolated environment before production replacement

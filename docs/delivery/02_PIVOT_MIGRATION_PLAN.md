# Pivot Migration Plan

## Current project

The repository began as a Subcontractor Billing & Claims OS.

The business direction is replaced by the Local Project Expense Tracker.

## Preserve

- Repository history and existing commits.
- Monorepo.
- Next.js app.
- NestJS API.
- PostgreSQL/Prisma foundation.
- Redis.
- MinIO/S3 adapter.
- Environment validation.
- Docker Compose.
- CI and tests.
- Health/readiness/logging.

## Archive

Move old product documents to:

`docs/archive/subcontractor-claims-v1/`

Do not delete history.

## Remove from active plan

- Multi-tenancy.
- Authentication.
- Users/memberships.
- RBAC.
- Claims.
- BOQ.
- Payment applications.
- Certifications.
- Tax/accounting scope.

## Code inspection

Before deleting code:

1. Identify whether any business-domain code exists.
2. Do not delete infrastructure code merely because names contain old product branding.
3. Remove only uncommitted or isolated Claims domain code after diff review.
4. Keep commits focused.
5. Update environment variable names only when necessary.

## Documentation placement

Install this pack as the new `docs/` root, preserving:

`docs/archive/subcontractor-claims-v1/`

## Migration completion

- Build passes.
- Tests pass.
- No active documentation points to Claims as the current product.
- Execution-state and requirement coverage are reset for the new IDs.
- Worktree clean.

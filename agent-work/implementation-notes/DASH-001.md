# DASH-001 — Global and Project Dashboards

## Delivered

- `GET /api/v1/dashboard` returns aggregate financial totals across active projects, active/archived project counts, active project cards, category totals, a 12-week expense trend, top payees, and latest expenses/transfers.
- `GET /api/v1/projects/{projectId}/dashboard` now includes the same analytics for the selected project while preserving exact existing totals.
- The Next.js home route is now the global dashboard; project detail screens include project dashboard analytics.
- The interface is Arabic, RTL, responsive, and uses native CSS visualizations rather than an additional chart dependency.

## Deliberate boundaries

- All money returned by the API remains serialized from Prisma Decimal values.
- Soft-deleted expenses/transfers are excluded from every dashboard aggregate and activity list.
- Only active projects are included in the global financial totals. Archived-project counts are shown separately.
- Backup status is not invented; it remains deferred to `BKP-001` because backup behavior has not been implemented.

## Verification

- Focused API project tests pass.
- Web Vitest suite passes, including dashboard rendering coverage.
- Workspace lint passes.
- Live `GET /api/v1/dashboard` returns the expected zero-state contract on an empty database.

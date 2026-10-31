# TEL-001 Production Backup and Deployment Readiness

Status: DEPLOYED AND VERIFIED

The existing backup was re-inspected and restore-rehearsed for deployment
preparation. No replacement backup was created.

## Verified backup

- PostgreSQL custom-format backup: `F:\ClaimsOS-Backups\claims-os-prod-20261031-234405.dump`
  (84,047 bytes; SHA-256
  `6C7C181766B6E8F4DA39B434DBEDB234D8FC7E1E7DC29F0D7F1B9FEC99936380`).
- Non-secret manifest: `F:\ClaimsOS-Backups\claims-os-prod-20261031-234405.manifest.json`
  (SHA-256 `68368CEAD9203533B31CD74012352F928C0B0CFA4AC45210CFE3C7E6DCB09ACB`).
- The dump was listed successfully with PostgreSQL 16.14 tools and restored to a
  separate disposable PostgreSQL 16.14 container. It was never restored over
  production.
- The private MinIO bucket was read successfully into
  `F:\ClaimsOS-Backups\claims-os-prod-minio-20261031-234603`. Production has
  zero Attachment rows and zero attachment bytes, so the verified storage
  snapshot contains zero object files and zero bytes.

## Production / restored reconciliation

| Metric                |   Production |     Restored |
| --------------------- | -----------: | -----------: |
| Projects              |            1 |            1 |
| Expenses              |          157 |          157 |
| Transfers             |            1 |            1 |
| Expense total (EGP)   | 1,055,067.00 | 1,055,067.00 |
| Transfer total (EGP)  | 1,000,000.00 | 1,000,000.00 |
| Excel-import expenses |          157 |          157 |
| Nullable legacy dates |           49 |           49 |
| Audit events          |            3 |            3 |
| Automation drafts     |            0 |            0 |

All reconciliation values match exactly using PostgreSQL `DECIMAL` text output.
The fresh rehearsal also confirmed zero Attachment rows and zero attachment
bytes in both production and the restored database.

## Migration and runtime review

Production has the foundation and nullable-historical-date migrations applied.
`20261031010000_automation_draft_results` is the only pending migration. It is
additive only: two nullable columns (`resultEntityType`, `resultEntityId`) on
`AutomationDraft`; it does not alter or delete existing financial records.

The production Compose update supplies the existing protected automation secret
and allowed-chat ID to the API without putting either value in source control.
Resolved Compose configuration is valid. Production is currently healthy, API
readiness returned HTTP 200 through the Web container, and only Web is host
published (`127.0.0.1:3000`).

## Owner-approved deployment sequence

```powershell
pnpm prod:config
docker compose --env-file .env.production -f docker-compose.production.yml build api migrate
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d --no-deps --force-recreate api
pnpm prod:status
docker compose --env-file .env.production -f docker-compose.production.yml exec web node -e "fetch('http://api:4000/api/v1/health/ready').then(r => { console.log(r.status); process.exit(r.ok ? 0 : 1) })"
```

After readiness, compare the reconciliation metrics above, browse the existing
Web application, and confirm an unauthenticated request to an Automation route
returns HTTP 401. Do not submit a draft during this smoke check.

## Recovery plan

If image startup or readiness fails, stop the rollout and inspect API/migration
logs. The migration is additive, so the prior API image can be restored without
database rollback. Do not restore the database automatically. A database
restore from the verified external dump requires a separate explicit approval
because it replaces production data.

## Deployment execution — 2026-11-01

Owner approval was received after the backup rehearsal. The migration image and
API image were built, `prisma migrate deploy` applied
`20261031010000_automation_draft_results`, and only the `api` container was
recreated. PostgreSQL, Redis, MinIO, Web, and all persistent volumes remained
in place.

- API readiness through the Web container: HTTP 200.
- Unauthenticated Automation route: HTTP 401.
- Web home page: HTTP 200.
- Only Web is host-published at `127.0.0.1:3000`; API, PostgreSQL, Redis, and
  MinIO have no host-published ports.
- Post-deployment financial reconciliation exactly matched the pre-deployment
  baseline: 1 project, 157 expenses totaling 1,055,067.00 EGP, one transfer
  totaling 1,000,000.00 EGP, 49 undated legacy expenses, three audit events,
  zero Automation drafts, and zero attachments.

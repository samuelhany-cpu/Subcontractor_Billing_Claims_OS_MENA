# Daily Google Drive Backup Specification

## Requirement

Create one backup every day and upload it to Google Drive.

## Backup contents

- PostgreSQL logical dump.
- MinIO attachment objects.
- Application configuration metadata excluding secrets.
- Backup manifest with:
  - timestamp
  - app version/commit
  - database schema version
  - file checksums
  - object count
  - dump size

## Excluded

- `.env` files.
- Telegram bot token.
- Google credentials.
- n8n encryption key.
- Raw application logs unless explicitly added later.
- Build artifacts.

## Process

1. Scheduled n8n workflow starts daily.
2. Execute an application-controlled backup command or endpoint.
3. Backup process writes a timestamped archive to a local backup directory.
4. Compute checksum.
5. n8n uploads the archive to the configured Google Drive folder.
6. n8n records success/failure.
7. Application dashboard shows latest backup status.

## File naming

`project-expense-tracker-backup-YYYYMMDD-HHmmss.zip`

Timezone: Africa/Cairo.

## Restore

Restore is a deliberate manual operation:

1. Stop application writes.
2. Verify archive checksum.
3. Restore PostgreSQL dump.
4. Restore attachment objects.
5. Run schema compatibility check.
6. Start application.
7. Verify dashboard totals and attachment access.

## Open settings

The owner has not selected:

- Exact daily backup time.
- Google Drive folder.
- Retention period.
- Whether local archives are deleted after confirmed upload.

Codex must not choose these values silently.

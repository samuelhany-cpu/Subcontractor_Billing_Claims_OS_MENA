# Windows Local Deployment

## Target

- Windows host.
- Computer usually on.
- App available to phones and devices on the same private LAN.
- No public web-app access.
- No app login.

## Runtime

Use the existing Docker Compose foundation.

Production-local services:

- web
- api
- postgres
- redis
- minio
- n8n
- optional reverse proxy if required by final topology

## Network publication

- Publish the web app to the host/LAN.
- Keep API internal where the web layer can proxy it.
- Keep PostgreSQL and Redis internal.
- Keep MinIO private.
- Bind n8n editor to localhost/private administration.
- Public Telegram webhook exposure remains blocked until OPEN-001 is decided.

## Startup

The final repository must provide Windows-friendly commands/scripts for:

- start
- stop
- status
- logs
- backup now
- restore instructions
- update/restart

No destructive reset command runs automatically.

## LAN access

- Web listens on `0.0.0.0` inside its container.
- Windows firewall permits the chosen web port on Private networks only.
- Documentation shows how to find the host LAN IP.
- Do not hard-code the current IP.
- Phone and host must be on the same network.

## Persistence

Named volumes or bind mounts persist:

- PostgreSQL data.
- Redis data if required.
- MinIO attachments.
- n8n data.
- local backup staging.

## Restart behavior

- Containers restart after Docker/Windows restart when configured.
- Health checks gate dependent services.
- Application shows dependency failures clearly.
- No data initialization overwrites existing records.

## Update process

1. Create/verify backup.
2. Pull/build new application version.
3. Apply migrations.
4. Start services.
5. Run health/readiness.
6. Verify project totals.
7. Keep rollback instructions.

## Final activation checklist

- LAN access verified from phone.
- No database port exposed publicly.
- MinIO bucket private.
- n8n editor not public.
- Telegram allowed chat verified.
- Backup uploaded and restore rehearsed.

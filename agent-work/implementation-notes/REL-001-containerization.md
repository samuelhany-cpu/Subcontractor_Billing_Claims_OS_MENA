# REL-001 production-local containerization

Implemented a separate `docker-compose.production.yml` so the existing
development Compose workflow and `claims-os_*` named volumes remain compatible.

- `web` is the sole published service; its bind address defaults to loopback and
  is configurable for a Private-network LAN deployment.
- `api` connects to `postgres`, `redis`, and `minio` through Docker DNS on an
  internal backend network. Next.js uses server-only `API_INTERNAL_URL`.
- PostgreSQL, Redis, and MinIO reuse explicit existing volume names. Migration
  uses only `prisma migrate deploy`; initialization creates the private bucket
  idempotently.
- API production validation now allows Docker-private service names while still
  rejecting loopback endpoints, documented development credentials, and
  `CHANGE_ME` placeholders.
- Web and API use multi-stage, non-root production images. Prisma is a
  production dependency solely because the one-shot migration image must run
  the locked Prisma CLI without downloading tools at startup.

n8n, Telegram, backups, and RPT-001 were not started or changed.

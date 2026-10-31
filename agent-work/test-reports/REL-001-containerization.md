# REL-001 containerization verification

## Passed

- `pnpm install --frozen-lockfile`
- `pnpm format:check`
- `pnpm lint` (no errors; existing warnings only)
- `pnpm typecheck`
- `pnpm test` — API: 25 suites / 148 tests; Web: 16 files / 37 tests
- `pnpm build`
- API production configuration tests — 27 tests, including private Docker DNS,
  loopback rejection, and deployment-placeholder rejection
- `docker compose --env-file .env.production -f docker-compose.production.yml config --quiet`
- Web, API, and migration Docker image builds from workspace source. Final
  images run as non-root; API image entrypoint is `node dist/main.js`.

## Static topology checks

- Resolved Compose configuration has `backend.internal: true`.
- Only `web` has a published port (`127.0.0.1:3000` in the verification env).
- API, PostgreSQL, Redis, MinIO, migration, and bucket initialization have no
  host port publications.

## Runtime limitation

End-to-end `compose up` was not run against the existing persistent volumes:
the supplied verification credentials differ from any owner data and this work
does not alter credentials or risk an existing database. In addition, both
historical Docker Hub MinIO tags and the documented Quay fallback returned no
manifest in this Docker Desktop environment. Configure the documented pinned
`MINIO_IMAGE` and `MINIO_MC_IMAGE` mirror overrides, then run the first-start
and health commands in `docs/engineering/04_WINDOWS_LOCAL_DEPLOYMENT.md`.

Therefore LAN access, live migration on a fresh database, attachment transfer,
restart persistence, and browser acceptance remain owner-environment runtime
checks; they are not claimed as passed.

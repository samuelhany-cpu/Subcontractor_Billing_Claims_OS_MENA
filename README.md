# Subcontractor Billing & Claims OS for MENA

This repository contains the bilingual web and API foundation for the
Subcontractor Billing & Claims OS. Product and engineering requirements live in
[`docs/00_README.md`](docs/00_README.md).

## Prerequisites

- Node.js 20 or later
- Corepack with pnpm
- Docker with Docker Compose (required by a later foundation slice)

## Workspace commands

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the generated application scaffolds with:

```bash
pnpm dev:web
pnpm dev:api
```

Local infrastructure, validated environment configuration, dependency-aware
health checks, and the bilingual route shell are tracked as subsequent
foundation slices. Do not use the current starter applications as a production
deployment.

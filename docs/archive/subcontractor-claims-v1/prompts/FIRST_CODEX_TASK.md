# First Task for Codex

Implement the repository foundation only.

## Required output

- pnpm/Turborepo monorepo
- `apps/web`
- `apps/api`
- `packages/domain`
- `packages/ui`
- `packages/config`
- Local Docker Compose for PostgreSQL, Redis, and object-storage emulator
- Formatting, linting, strict TypeScript, and unit-test setup
- CI workflow for install, lint, typecheck, test, and build
- Environment example files
- Health endpoint skeleton
- Basic English/Arabic localization shell
- Documentation folder copied into repository

## Do not implement yet

- Authentication provider
- Business database tables
- BOQ logic
- Payment applications
- Any feature not needed for foundation

## Acceptance

- Clean install succeeds
- Local infrastructure starts
- Web and API run
- CI commands pass
- Arabic and English layout switch works
- No secrets are committed

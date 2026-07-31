# Engineering Standards

## 1. General

- TypeScript strict mode is mandatory.
- No `any` without written justification.
- Domain rules belong in domain services or value objects.
- Controllers validate and delegate; they do not calculate commercial values.
- Repository implementations do not contain presentation logic.
- All modules expose explicit public interfaces.

## 2. Repository workflow

- Protected `main` branch
- Feature branches
- Pull request required
- Small, reviewable changes
- Conventional commits
- CI must pass before merge

Suggested commit prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `docs:`
- `chore:`
- `security:`

## 3. API standards

- REST under `/api/v1`
- JSON request/response
- RFC 7807-style problem responses
- Idempotency keys for create/submit/payment operations where duplicate requests are costly
- Cursor or page-based pagination with documented limits
- ISO 8601 timestamps
- Explicit currency codes
- No financial totals accepted from the client without server recalculation

## 4. Validation

- Transport validation with Zod/class-validator or equivalent
- Domain validation separately enforced
- Database constraints as final defense
- Human-readable error codes

Example:

```json
{
  "type": "https://example.com/problems/application-validation",
  "title": "Payment application cannot be submitted",
  "status": 422,
  "code": "APPLICATION_VALIDATION_FAILED",
  "errors": [
    {"field": "retention", "code": "RETENTION_EXCEEDS_CAP"}
  ]
}
```

## 5. Frontend standards

- Server-side authorization is authoritative
- Client-side permission checks improve UX only
- Form drafts autosave when practical
- Tables use server-side pagination and filtering
- Arabic and English snapshots for key layouts
- Financial fields display currency and precision consistently
- Every calculated total provides a breakdown drawer or link

## 6. Database standards

- Snake_case database names
- UTC `timestamptz`
- UUID identifiers
- Required `tenant_id`, `created_at`, `updated_at`
- Index tenant + common filters
- Unique constraints include tenant where appropriate
- Migrations reviewed and tested against representative data

## 7. Error handling

- Do not expose stack traces or internal identifiers to end users
- Use correlation IDs
- Log structured context without sensitive document contents
- Background failures must be visible and retryable

## 8. Definition of done

A story is complete when:

- Acceptance criteria pass
- Unit and integration tests are added
- Authorization is tested
- Audit behavior is verified where applicable
- Arabic/English UI is checked
- API and documentation are updated
- No critical static-analysis or dependency issues remain

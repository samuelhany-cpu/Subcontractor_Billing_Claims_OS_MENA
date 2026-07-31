# Claude–Codex Handoff Workflow

## Roles

### Claude

- Product/architecture reasoning
- Requirement interpretation
- Task decomposition
- ADR ownership
- Design and PR review
- Risk and consistency checks

### Codex

- Repository inspection
- Implementation
- Migrations
- Tests
- CI fixes
- Small documentation updates

## Recommended loop

1. Claude reads docs and prepares one issue.
2. Issue includes requirement IDs, acceptance criteria, API/data impact, and test cases.
3. Codex implements on a feature branch.
4. Codex runs all required checks and produces implementation summary.
5. Claude reviews diff against docs and acceptance criteria.
6. Codex addresses review comments.
7. Claude approves or requests another cycle.
8. Merge and update release checklist.

## Issue template

```md
# Title

## Business outcome

## Requirements
- FR-...
- NFR-...

## Scope

## Out of scope

## Data changes

## API changes

## Authorization

## Acceptance criteria

## Test cases

## Documentation updates
```

## Pull-request checklist

- [ ] Tenant scope is enforced
- [ ] Permission checks are server-side
- [ ] Money uses exact decimal arithmetic
- [ ] State transitions are valid
- [ ] Audit event is generated where required
- [ ] English and Arabic UI are considered
- [ ] Unit tests added
- [ ] Integration/authorization tests added
- [ ] OpenAPI updated
- [ ] Migrations reviewed
- [ ] No unrelated scope

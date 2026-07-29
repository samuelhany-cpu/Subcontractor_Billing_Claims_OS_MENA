# MVP Acceptance Criteria

## Organization and access

- A user cannot access any resource belonging to an organization where the user has no active membership.
- An organization owner can invite a user and assign a role.
- A project-restricted user sees only assigned projects.

## Contract and BOQ

- A user can configure currency, retention, advance recovery, tax, and payment terms.
- A valid BOQ spreadsheet imports with a reconciliation summary.
- Invalid rows are reported without silently changing values.
- Publishing locks the baseline.

## Progress and application

- Previous, current, and cumulative quantities reconcile.
- The application summary equals the sum of its traceable components.
- Retention cannot exceed configured cap.
- Advance recovery cannot exceed outstanding advance.
- Submission creates an immutable snapshot.
- Revision preserves previous submitted versions.

## Variation

- Estimated, submitted, and approved values remain distinct.
- Evidence can be linked and downloaded by authorized users.
- Status transitions follow the defined state machine.
- Only eligible variations can be included in the application.

## Certification

- Claimed and certified amounts can be compared by line or adjustment.
- A final certificate cannot be edited; correction creates a superseding record.
- The certificate updates certified-to-date dashboards.

## Invoice and collection

- Invoice due date follows configured terms unless an authorized override is documented.
- Partial payments reduce balance correctly.
- Payment allocation is transactional.
- Reversal restores the prior balance and records an audit event.
- Aging changes based on due date and outstanding balance.

## Localization

- Core workflows are usable in Arabic RTL and English LTR.
- Export templates are readable in both languages.
- Currency and date formatting follow locale and project settings.

## Audit and security

- Submission, certification, invoice issuance, payment, reversal, and role changes appear in audit history.
- Cross-tenant test suite passes.
- Direct object-ID manipulation cannot bypass access controls.

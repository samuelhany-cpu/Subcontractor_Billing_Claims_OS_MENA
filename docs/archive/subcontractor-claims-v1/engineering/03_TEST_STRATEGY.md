# Test Strategy

## 1. Testing pyramid

### Unit tests

Focus on:

- Money and decimal value objects
- BOQ calculations
- Progress accumulation
- Retention and cap rules
- Advance recovery
- Tax and deduction order
- Payment application totals
- Certified variance
- Invoice balance and aging
- State-machine transitions

### Integration tests

Focus on:

- Repository tenant scoping
- Database constraints
- API authorization
- Import and export jobs
- Versioning and audit events
- Payment allocation transactions

### End-to-end tests

Critical paths:

1. Create organization and invite user
2. Create project and contract
3. Import BOQ
4. Enter progress
5. Submit payment application
6. Revise application
7. Record certificate
8. Issue invoice
9. Record partial and final payment
10. Verify dashboard reconciliation

## 2. Mandatory security tests

- User from tenant A cannot read or mutate tenant B records
- Guessing object IDs never bypasses authorization
- External share link cannot access unshared objects
- Expired and revoked links fail
- Submitted versions cannot be edited
- Duplicate idempotency key does not duplicate payments or submissions

## 3. Calculation test fixtures

Create fixtures covering:

- Zero retention
- Retention with cap reached mid-period
- Multiple tax configurations
- Advance fully recovered
- Partial certification
- Negative adjustment
- Variation approved after prior submissions
- Currency precision differences
- Rounding at line and total level
- Partial payment allocations

## 4. Localization tests

- Arabic navigation and forms
- RTL tables and dialogs
- Arabic PDF layout
- English PDF layout
- Currency and date formatting
- Mixed Arabic/English project names

## 5. Performance tests

Representative pilot limits:

- 100 active projects per tenant
- 20,000 BOQ items per large project
- 36 valuation periods
- 10,000 documents per tenant

Test:

- BOQ list and filtering
- Application calculation
- Export generation
- Dashboard aggregation

## 6. Quality gates

- All domain calculation tests pass
- Coverage threshold for domain package: target 90% statements/branches
- No critical security scan findings
- End-to-end critical path passes
- Migration tested from clean and previous schema
- Accessibility smoke checks pass

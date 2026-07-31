# Calculation Rules

All formulas must be implemented in the shared domain package and covered by deterministic tests.

## 1. BOQ baseline amount

```text
Baseline Amount = Baseline Quantity × Contract Rate
```

## 2. Progress valuation

```text
Cumulative Quantity = Previous Certified or Accepted Quantity + Current Quantity
Cumulative Gross Value = Cumulative Quantity × Rate
Current Gross Value = Cumulative Gross Value − Previous Gross Value
```

Project configuration determines whether previous value is based on previously claimed, internally approved, or certified quantity. The default should be previous submitted value for application preparation, with certified comparison stored separately.

## 3. Payment application summary

A configurable calculation order is required. Default:

```text
Gross Work Value
+ Approved/Eligible Variation Value
+ Materials on Site
+ Other Additions
= Gross Claim Before Deductions
− Retention
− Advance Recovery
− Other Contractual Deductions
= Net Before Tax
+ Tax
= Current Amount Claimed
```

The configuration must explicitly define whether tax applies before or after specific deductions.

## 4. Retention

Default formula:

```text
Period Retention = Eligible Retention Base × Retention Rate
Cumulative Retention = min(Previous Retention + Period Retention, Retention Cap)
```

Support:

- Percentage retention
- Fixed cap
- Cap as percentage of contract value
- Different rates for work and materials
- Release stages recorded separately

## 5. Advance recovery

Support these configurable methods:

- Fixed percentage of eligible gross value
- Fixed amount per period
- Recovery after threshold
- Manual authorized amount

```text
Cumulative Recovery ≤ Original Advance Amount
Outstanding Advance = Original Advance − Cumulative Recovery
```

## 6. Certified variance

```text
Certification Variance = Claimed Amount − Certified Amount
Certification Rate = Certified Amount / Claimed Amount
```

When claimed amount is zero, certification rate is null, not zero.

## 7. Invoice balance

```text
Invoice Balance = Invoice Gross Amount − Allocated Payments − Applied Credits
```

## 8. Aging

Aging uses invoice due date:

- Current / not due
- 1–30 days overdue
- 31–60 days
- 61–90 days
- 91–120 days
- More than 120 days

## 9. Cash forecast

Initial MVP forecast:

- Open invoices: expected on due date adjusted by client delay factor
- Certified not invoiced: expected invoice date plus payment terms
- Submitted not certified: scenario-weighted estimate based on status and historical cycle
- Draft applications excluded from committed forecast but may appear in pipeline

Forecast assumptions must be visible and editable. Do not present probabilistic forecast as guaranteed cash.

## 10. Rounding

- Store high precision.
- Apply contractual rounding rules at line, section, or total level as configured.
- Record rounding adjustments explicitly.
- Tests must cover cumulative rounding drift.

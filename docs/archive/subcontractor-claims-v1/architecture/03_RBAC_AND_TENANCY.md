# RBAC and Multi-Tenancy

## 1. Roles

### Organization Owner

- Full organization access
- Subscription and billing
- User and role administration
- All projects and reports

### Organization Admin

- User administration excluding ownership transfer
- Client and project setup
- Configuration and reports

### Commercial Manager

- Contracts, BOQ, applications, variations, certificates
- Commercial dashboards
- Approvals within configured limits

### Quantity Surveyor

- Progress entry
- Draft applications
- Variations and evidence
- Cannot finalize certificates or record payments by default

### Finance Manager

- Certificates read access
- Invoices, payments, aging, and forecast
- Financial exports

### Project Manager

- Project overview
- Progress confirmation
- Variation evidence and comments
- Limited commercial visibility based on policy

### Site Engineer

- Evidence upload
- Progress input subject to approval
- Variation initiation

### Viewer / Auditor

- Read-only access to assigned projects and audit history

### External Reviewer

- Limited access to explicitly shared applications or variation packages
- Comment, request revision, or acknowledge
- No organization-wide visibility

## 2. Permission model

Use named permissions rather than role checks in business code.

Examples:

- `project.read`
- `project.manage`
- `contract.publish`
- `boq.import`
- `boq.publish`
- `progress.edit`
- `application.create`
- `application.submit`
- `application.withdraw`
- `variation.approve_internal`
- `certificate.finalize`
- `invoice.issue`
- `payment.record`
- `report.export`
- `user.manage`
- `audit.read`

Roles map to permission sets. Project-level assignments may narrow organization-level roles.

## 3. Tenant resolution

- Auth token identifies user.
- Request includes active organization context.
- Server validates active membership.
- Tenant ID is injected into application context.
- Client-supplied tenant IDs are ignored for authorization.

## 4. Data-access rule

All repository methods for tenant-owned data must require a `TenantContext` parameter.

Bad:

```ts
findProjectById(projectId)
```

Required:

```ts
findProjectById({ tenantId, projectId })
```

## 5. External sharing

Use expiring, revocable share records or restricted external accounts.

Requirements:

- Explicit record scope
- Expiration
- Optional email verification
- View/download/comment permissions
- Access log
- Revocation

## 6. Segregation-of-duties recommendations

Configurable controls:

- Draft creator cannot submit above threshold
- Payment recorder cannot approve own reversal
- Certificate finalization requires commercial-manager permission
- Ownership and role changes require re-authentication

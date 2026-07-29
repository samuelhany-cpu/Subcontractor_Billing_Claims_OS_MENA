# Security and Privacy Baseline

## 1. Security objectives

- Strict tenant isolation
- Protection of commercial and contractual data
- Traceable high-risk actions
- Secure file handling
- Least-privilege access
- Recoverability and incident visibility

## 2. Threats to prioritize

- Cross-tenant data access
- Broken object-level authorization
- Unauthorized export links
- Malicious file upload
- Credential stuffing and session theft
- Privilege escalation
- Tampering with submitted financial records
- Duplicate payment or submission requests
- Sensitive data leakage through logs or AI services

## 3. Authentication

- Secure password hashing
- Rate limiting and lockout controls
- Email verification
- Session rotation
- Optional MFA before general availability
- Re-authentication for ownership, export, and role changes

## 4. Authorization

- Server-side permission checks on every business operation
- Tenant and project scope enforced in repository layer
- Deny by default
- Dedicated tests for IDOR and cross-tenant access

## 5. Financial-record integrity

- Submitted application versions are immutable
- Final certificates require privileged action
- Payment reversals create reversal records rather than deletion
- Audit log includes actor, timestamp, tenant, object, old/new summary, reason, and correlation ID
- Consider hash chaining or append-only audit storage after pilot

## 6. Files

- Direct upload using short-lived signed URLs
- Allowlist file types
- Size limits
- Malware scanning
- Randomized storage keys
- Private buckets
- Signed download URLs
- Content disposition controls
- No execution of user files

## 7. Encryption

- TLS in transit
- Provider-managed encryption at rest
- Encrypted backups
- Secrets outside source control
- Field-level encryption for selected sensitive identifiers if required

## 8. Privacy

- Data-processing inventory
- Customer-controlled retention settings
- Export and deletion workflow subject to financial-record obligations
- Regional hosting options considered for enterprise customers
- Subprocessor register
- Do not send customer documents to external AI providers by default

## 9. AI features

Any future AI feature must:

- Be opt-in
- Identify source records
- Avoid legal conclusions
- Avoid training on customer data without explicit agreement
- Redact sensitive information where practical
- Record prompt/model/version for auditable outputs

## 10. Security gates before pilot

- Dependency and secret scanning
- SAST
- Tenant-isolation tests
- File-upload abuse tests
- Backup restore exercise
- Basic penetration test
- Incident response contacts and process

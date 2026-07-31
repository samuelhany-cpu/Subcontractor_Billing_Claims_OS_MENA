-- Subcontractor Billing & Claims OS for MENA
-- Initial logical schema for MVP. Review and split into migrations before implementation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'suspended', 'closed');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'closed');
CREATE TYPE contract_status AS ENUM ('draft', 'published', 'superseded', 'closed');
CREATE TYPE application_status AS ENUM ('draft', 'ready_for_review', 'submitted', 'under_review', 'revision_requested', 'partially_certified', 'certified', 'withdrawn', 'closed');
CREATE TYPE variation_status AS ENUM ('potential', 'instructed', 'priced', 'submitted', 'clarification_requested', 'partially_approved', 'approved', 'rejected', 'disputed', 'closed', 'closed_no_claim');
CREATE TYPE certificate_status AS ENUM ('expected', 'received_draft', 'reconciliation_in_progress', 'final', 'superseded', 'invoiced');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_status AS ENUM ('recorded', 'reversed');

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text,
    display_name text NOT NULL,
    preferred_locale text NOT NULL DEFAULT 'en',
    email_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    legal_name text,
    default_currency char(3) NOT NULL DEFAULT 'USD',
    default_locale text NOT NULL DEFAULT 'en',
    timezone text NOT NULL DEFAULT 'UTC',
    status tenant_status NOT NULL DEFAULT 'trial',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    user_id uuid NOT NULL REFERENCES users(id),
    role_key text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id)
);

CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    name text NOT NULL,
    legal_name text,
    tax_identifier text,
    country_code char(2),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz
);
CREATE INDEX clients_tenant_idx ON clients(tenant_id, name);

CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    client_id uuid REFERENCES clients(id),
    reference text NOT NULL,
    name text NOT NULL,
    country_code char(2) NOT NULL,
    currency_code char(3) NOT NULL,
    timezone text NOT NULL,
    reporting_locale text NOT NULL DEFAULT 'en',
    status project_status NOT NULL DEFAULT 'draft',
    start_date date,
    planned_completion_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, reference)
);
CREATE INDEX projects_tenant_status_idx ON projects(tenant_id, status);

CREATE TABLE project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    membership_id uuid NOT NULL REFERENCES memberships(id),
    role_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, membership_id)
);

CREATE TABLE contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    reference text NOT NULL,
    status contract_status NOT NULL DEFAULT 'draft',
    currency_code char(3) NOT NULL,
    original_value numeric(20,4) NOT NULL DEFAULT 0,
    current_approved_value numeric(20,4) NOT NULL DEFAULT 0,
    retention_rate numeric(9,6) NOT NULL DEFAULT 0,
    retention_cap_type text NOT NULL DEFAULT 'percentage_of_contract',
    retention_cap_value numeric(20,4) NOT NULL DEFAULT 0,
    advance_amount numeric(20,4) NOT NULL DEFAULT 0,
    advance_recovery_method text NOT NULL DEFAULT 'percentage',
    advance_recovery_rate numeric(9,6) NOT NULL DEFAULT 0,
    payment_term_days integer NOT NULL DEFAULT 30,
    tax_rate numeric(9,6) NOT NULL DEFAULT 0,
    calculation_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    effective_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, project_id, reference)
);

CREATE TABLE contract_amendments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    contract_id uuid NOT NULL REFERENCES contracts(id),
    reference text NOT NULL,
    description text,
    approved_value_delta numeric(20,4) NOT NULL DEFAULT 0,
    effective_date date,
    status text NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (contract_id, reference)
);

CREATE TABLE boq_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    contract_id uuid NOT NULL REFERENCES contracts(id),
    version_number integer NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    source_filename text,
    baseline_total numeric(20,4) NOT NULL DEFAULT 0,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id),
    UNIQUE (contract_id, version_number)
);

CREATE TABLE boq_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    boq_version_id uuid NOT NULL REFERENCES boq_versions(id),
    parent_section_id uuid REFERENCES boq_sections(id),
    code text,
    name_en text NOT NULL,
    name_ar text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE boq_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    boq_version_id uuid NOT NULL REFERENCES boq_versions(id),
    section_id uuid REFERENCES boq_sections(id),
    item_code text NOT NULL,
    description_en text NOT NULL,
    description_ar text,
    unit text NOT NULL,
    item_type text NOT NULL DEFAULT 'measured_work',
    baseline_quantity numeric(20,6) NOT NULL DEFAULT 0,
    rate numeric(20,6) NOT NULL DEFAULT 0,
    baseline_amount numeric(20,4) NOT NULL DEFAULT 0,
    max_valuation_quantity numeric(20,6),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (boq_version_id, item_code)
);
CREATE INDEX boq_items_version_sort_idx ON boq_items(boq_version_id, sort_order);

CREATE TABLE valuation_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    contract_id uuid NOT NULL REFERENCES contracts(id),
    period_number integer NOT NULL,
    date_from date NOT NULL,
    date_to date NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (contract_id, period_number)
);

CREATE TABLE progress_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    valuation_period_id uuid NOT NULL REFERENCES valuation_periods(id),
    boq_item_id uuid NOT NULL REFERENCES boq_items(id),
    previous_quantity numeric(20,6) NOT NULL DEFAULT 0,
    current_quantity numeric(20,6) NOT NULL DEFAULT 0,
    cumulative_quantity numeric(20,6) NOT NULL DEFAULT 0,
    previous_value numeric(20,4) NOT NULL DEFAULT 0,
    current_value numeric(20,4) NOT NULL DEFAULT 0,
    cumulative_value numeric(20,4) NOT NULL DEFAULT 0,
    notes text,
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (valuation_period_id, boq_item_id)
);

CREATE TABLE variations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    contract_id uuid NOT NULL REFERENCES contracts(id),
    reference text NOT NULL,
    title text NOT NULL,
    description text,
    status variation_status NOT NULL DEFAULT 'potential',
    instruction_reference text,
    instruction_date date,
    notice_date date,
    submission_date date,
    decision_date date,
    estimated_value numeric(20,4) NOT NULL DEFAULT 0,
    submitted_value numeric(20,4) NOT NULL DEFAULT 0,
    approved_value numeric(20,4) NOT NULL DEFAULT 0,
    currency_code char(3) NOT NULL,
    inclusion_policy text NOT NULL DEFAULT 'approved_only',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, reference)
);
CREATE INDEX variations_project_status_idx ON variations(project_id, status);

CREATE TABLE payment_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    contract_id uuid NOT NULL REFERENCES contracts(id),
    valuation_period_id uuid NOT NULL REFERENCES valuation_periods(id),
    application_number integer NOT NULL,
    status application_status NOT NULL DEFAULT 'draft',
    current_version_id uuid,
    submitted_at timestamptz,
    closed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (contract_id, application_number),
    UNIQUE (valuation_period_id)
);

CREATE TABLE payment_application_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    payment_application_id uuid NOT NULL REFERENCES payment_applications(id),
    version_number integer NOT NULL,
    supersedes_version_id uuid REFERENCES payment_application_versions(id),
    status text NOT NULL DEFAULT 'draft',
    currency_code char(3) NOT NULL,
    gross_work_value numeric(20,4) NOT NULL DEFAULT 0,
    variation_value numeric(20,4) NOT NULL DEFAULT 0,
    materials_on_site_value numeric(20,4) NOT NULL DEFAULT 0,
    other_additions numeric(20,4) NOT NULL DEFAULT 0,
    retention numeric(20,4) NOT NULL DEFAULT 0,
    advance_recovery numeric(20,4) NOT NULL DEFAULT 0,
    other_deductions numeric(20,4) NOT NULL DEFAULT 0,
    net_before_tax numeric(20,4) NOT NULL DEFAULT 0,
    tax numeric(20,4) NOT NULL DEFAULT 0,
    amount_claimed numeric(20,4) NOT NULL DEFAULT 0,
    calculation_snapshot jsonb NOT NULL,
    submitted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id),
    UNIQUE (payment_application_id, version_number)
);

ALTER TABLE payment_applications
    ADD CONSTRAINT payment_applications_current_version_fk
    FOREIGN KEY (current_version_id) REFERENCES payment_application_versions(id);

CREATE TABLE application_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    application_version_id uuid NOT NULL REFERENCES payment_application_versions(id),
    boq_item_id uuid NOT NULL REFERENCES boq_items(id),
    previous_quantity numeric(20,6) NOT NULL DEFAULT 0,
    current_quantity numeric(20,6) NOT NULL DEFAULT 0,
    cumulative_quantity numeric(20,6) NOT NULL DEFAULT 0,
    rate numeric(20,6) NOT NULL DEFAULT 0,
    previous_value numeric(20,4) NOT NULL DEFAULT 0,
    current_value numeric(20,4) NOT NULL DEFAULT 0,
    cumulative_value numeric(20,4) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_version_id, boq_item_id)
);

CREATE TABLE application_variations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    application_version_id uuid NOT NULL REFERENCES payment_application_versions(id),
    variation_id uuid NOT NULL REFERENCES variations(id),
    previous_value numeric(20,4) NOT NULL DEFAULT 0,
    current_value numeric(20,4) NOT NULL DEFAULT 0,
    cumulative_value numeric(20,4) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_version_id, variation_id)
);

CREATE TABLE certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    payment_application_id uuid NOT NULL REFERENCES payment_applications(id),
    supersedes_certificate_id uuid REFERENCES certificates(id),
    certificate_number text,
    status certificate_status NOT NULL DEFAULT 'expected',
    certificate_date date,
    currency_code char(3) NOT NULL,
    gross_certified numeric(20,4) NOT NULL DEFAULT 0,
    retention_certified numeric(20,4) NOT NULL DEFAULT 0,
    advance_recovery_certified numeric(20,4) NOT NULL DEFAULT 0,
    other_deductions_certified numeric(20,4) NOT NULL DEFAULT 0,
    tax_certified numeric(20,4) NOT NULL DEFAULT 0,
    net_certified numeric(20,4) NOT NULL DEFAULT 0,
    reconciliation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    finalized_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    certificate_id uuid REFERENCES certificates(id),
    invoice_number text NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    currency_code char(3) NOT NULL,
    issue_date date,
    due_date date,
    net_amount numeric(20,4) NOT NULL DEFAULT 0,
    tax_amount numeric(20,4) NOT NULL DEFAULT 0,
    gross_amount numeric(20,4) NOT NULL DEFAULT 0,
    outstanding_amount numeric(20,4) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, invoice_number)
);
CREATE INDEX invoices_tenant_status_due_idx ON invoices(tenant_id, status, due_date);

CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    client_id uuid REFERENCES clients(id),
    reference text,
    payment_date date NOT NULL,
    currency_code char(3) NOT NULL,
    amount numeric(20,4) NOT NULL,
    status payment_status NOT NULL DEFAULT 'recorded',
    reversal_of_payment_id uuid REFERENCES payments(id),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id)
);

CREATE TABLE payment_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    payment_id uuid NOT NULL REFERENCES payments(id),
    invoice_id uuid NOT NULL REFERENCES invoices(id),
    allocated_amount numeric(20,4) NOT NULL CHECK (allocated_amount > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (payment_id, invoice_id)
);

CREATE TABLE retention_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid NOT NULL REFERENCES projects(id),
    certificate_id uuid REFERENCES certificates(id),
    event_type text NOT NULL,
    amount numeric(20,4) NOT NULL,
    event_date date NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    project_id uuid REFERENCES projects(id),
    storage_key text NOT NULL,
    original_filename text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    checksum_sha256 text,
    scan_status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id)
);

CREATE TABLE document_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    document_id uuid NOT NULL REFERENCES documents(id),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    category text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_links_entity_idx ON document_links(tenant_id, entity_type, entity_id);

CREATE TABLE comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES users(id),
    resolved_at timestamptz
);

CREATE TABLE audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    actor_user_id uuid REFERENCES users(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    project_id uuid REFERENCES projects(id),
    reason text,
    change_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    correlation_id text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_tenant_time_idx ON audit_events(tenant_id, occurred_at DESC);

-- Recommended application-side controls:
-- 1. Every query includes tenant_id.
-- 2. Submitted versions and final certificates are immutable.
-- 3. Payment allocation and invoice balance updates occur in one transaction.
-- 4. Add PostgreSQL RLS policies before general availability.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const activeSchemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
const documentedSchemaPath = resolve(
  process.cwd(),
  '../../docs/schemas/schema.prisma',
);
const migrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260801000000_expense_tracker_foundation/migration.sql',
);

function declarations(source: string, keyword: 'enum' | 'model'): string[] {
  return [...source.matchAll(new RegExp(`^\\s*${keyword}\\s+(\\w+)`, 'gm'))]
    .map((match) => match[1])
    .filter((name): name is string => name !== undefined)
    .sort();
}

describe('CORE-001 schema contract', () => {
  const activeSchema = readFileSync(activeSchemaPath, 'utf8');
  const documentedSchema = readFileSync(documentedSchemaPath, 'utf8');
  const migration = readFileSync(migrationPath, 'utf8');

  it('keeps the active and documented Prisma schemas aligned', () => {
    expect(activeSchema).toBe(documentedSchema);
  });

  it('contains exactly the approved models', () => {
    expect(declarations(activeSchema, 'model')).toEqual(
      [
        'Project',
        'Category',
        'Subcategory',
        'Payee',
        'Agreement',
        'Expense',
        'Transfer',
        'Attachment',
        'AuditEvent',
        'AutomationDraft',
        'ImportJob',
        'ImportRow',
        'AppSetting',
      ].sort(),
    );
  });

  it('contains exactly the approved enums', () => {
    expect(declarations(activeSchema, 'enum')).toEqual(
      [
        'ProjectStatus',
        'PayeeType',
        'RecordSource',
        'AuditAction',
        'AutomationIntent',
        'AutomationDraftStatus',
        'ImportJobStatus',
        'ImportRowStatus',
      ].sort(),
    );
  });

  it('contains no forbidden business, auth, tenancy, or accounting models', () => {
    const forbidden = [
      'User',
      'Account',
      'Session',
      'Organization',
      'Tenant',
      'Membership',
      'Role',
      'Permission',
      'Branch',
      'Tax',
      'Invoice',
      'Journal',
      'Ledger',
      'Claim',
      'BOQ',
      'PaymentApplication',
      'Inventory',
      'Payroll',
    ];

    expect(declarations(activeSchema, 'model')).not.toEqual(
      expect.arrayContaining(forbidden),
    );
  });

  it('records custom checks and append-only audit enforcement without seed SQL', () => {
    expect(migration).toContain('CONSTRAINT "Expense_amount_positive"');
    expect(migration).toContain('CONSTRAINT "Transfer_amount_positive"');
    expect(migration).toContain('CONSTRAINT "Agreement_totalAmount_positive"');
    expect(migration).toContain('CREATE TRIGGER "AuditEvent_append_only"');
    expect(migration).not.toMatch(/\bINSERT\s+INTO\b/i);
  });
});

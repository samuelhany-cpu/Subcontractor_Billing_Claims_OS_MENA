import { PrismaPg } from '@prisma/adapter-pg';
import {
  AuditAction,
  Prisma,
  PrismaClient,
  ProjectStatus,
  RecordSource,
} from '@prisma/client';
import { AuditService } from '../src/audit/audit.service';
import {
  parseMoney,
  parseQuantity,
  parseUnitPrice,
  serializeMoney,
  serializeQuantity,
} from '../src/shared/decimal/decimal';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL is required for database integration tests');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

describe('CORE-001 migrated database', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('starts with zero business and technical records', async () => {
    const counts = await Promise.all([
      prisma.project.count(),
      prisma.category.count(),
      prisma.subcategory.count(),
      prisma.payee.count(),
      prisma.agreement.count(),
      prisma.expense.count(),
      prisma.transfer.count(),
      prisma.attachment.count(),
      prisma.auditEvent.count(),
      prisma.automationDraft.count(),
      prisma.importJob.count(),
      prisma.importRow.count(),
      prisma.appSetting.count(),
    ]);

    expect(counts).toEqual(Array.from({ length: 13 }, () => 0));
  });

  it('creates exactly the approved tables and no forbidden domain tables', async () => {
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>(
      Prisma.sql`
        SELECT table_name::text AS table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `,
    );
    const tables = rows
      .map((row) => row.table_name)
      .filter((name) => name !== '_prisma_migrations');

    expect(tables).toEqual(
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
    expect(tables.join(' ')).not.toMatch(
      /User|Account|Session|Organization|Tenant|Membership|Role|Permission|Tax|Invoice|Journal|Ledger|Claim|BOQ|PaymentApplication|Inventory|Payroll/i,
    );
  });

  it('has the expected indexes, unique constraints, foreign keys, and checks', async () => {
    const indexRows = await prisma.$queryRaw<Array<{ indexname: string }>>(
      Prisma.sql`
        SELECT indexname::text AS indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
      `,
    );
    const indexes = new Set(indexRows.map((row) => row.indexname));

    for (const expected of [
      'Project_name_key',
      'Agreement_projectId_payeeId_key',
      'Category_name_key',
      'Subcategory_categoryId_name_key',
      'AutomationDraft_idempotencyKey_key',
      'Attachment_objectKey_key',
      'ImportRow_importJobId_sourceRow_key',
      'Expense_projectId_expenseDate_idx',
      'Expense_projectId_deletedAt_idx',
      'Transfer_projectId_transferDate_idx',
      'Transfer_projectId_deletedAt_idx',
      'ImportJob_fileSha256_idx',
      'ImportRow_rowHash_idx',
      'AuditEvent_entityType_entityId_idx',
      'AuditEvent_createdAt_idx',
    ]) {
      expect(indexes.has(expected)).toBe(true);
    }

    const constraintRows = await prisma.$queryRaw<
      Array<{ conname: string; contype: string }>
    >(Prisma.sql`
      SELECT conname::text AS conname, contype::text AS contype
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
    `);
    const constraints = new Map(
      constraintRows.map((row) => [row.conname, row.contype]),
    );

    expect(constraints.get('Expense_amount_positive')).toBe('c');
    expect(constraints.get('Transfer_amount_positive')).toBe('c');
    expect(constraints.get('Agreement_totalAmount_positive')).toBe('c');
    expect(constraints.get('Expense_projectId_fkey')).toBe('f');
    expect(constraints.get('Agreement_payeeId_fkey')).toBe('f');
    expect(constraints.get('ImportRow_expenseId_fkey')).toBe('f');
  });

  it('uses exact numeric precision and PostgreSQL date-only columns', async () => {
    const columns = await prisma.$queryRaw<
      Array<{
        table_name: string;
        column_name: string;
        data_type: string;
        numeric_precision: number | null;
        numeric_scale: number | null;
      }>
    >(Prisma.sql`
      SELECT table_name::text AS table_name, column_name::text AS column_name, data_type::text AS data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'Project' AND column_name IN ('openingBalance', 'openingBalanceDate'))
          OR (table_name = 'Agreement' AND column_name = 'totalAmount')
          OR (table_name = 'Expense' AND column_name IN ('expenseDate', 'quantity', 'unitPrice', 'amount'))
          OR (table_name = 'Transfer' AND column_name IN ('transferDate', 'amount'))
        )
    `);

    const byColumn = new Map(
      columns.map((column) => [
        `${column.table_name}.${column.column_name}`,
        column,
      ]),
    );

    for (const name of [
      'Project.openingBalance',
      'Agreement.totalAmount',
      'Expense.amount',
      'Transfer.amount',
    ]) {
      expect(byColumn.get(name)).toMatchObject({
        data_type: 'numeric',
        numeric_precision: 18,
        numeric_scale: 2,
      });
    }
    for (const name of ['Expense.quantity', 'Expense.unitPrice']) {
      expect(byColumn.get(name)).toMatchObject({
        data_type: 'numeric',
        numeric_precision: 18,
        numeric_scale: 4,
      });
    }
    for (const name of [
      'Project.openingBalanceDate',
      'Expense.expenseDate',
      'Transfer.transferDate',
    ]) {
      expect(byColumn.get(name)?.data_type).toBe('date');
    }
  });

  it('round-trips exact monetary, quantity, unit-price, large, and date values', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'round-trip-project',
        openingBalance: parseMoney('521310.00'),
        openingBalanceDate: new Date('2026-08-01T00:00:00.000Z'),
      },
    });

    const inputs = [
      ['0.10', 'decimal-0.10'],
      ['0.20', 'decimal-0.20'],
      ['0.30', 'decimal-0.30'],
      ['9999999999999999.99', 'large-valid'],
    ] as const;
    for (const [amount, description] of inputs) {
      await prisma.expense.create({
        data: {
          projectId: project.id,
          expenseDate: new Date('2026-08-01T00:00:00.000Z'),
          description,
          amount: parseMoney(amount),
          ...(description === 'decimal-0.30'
            ? {
                quantity: parseQuantity('3.0000'),
                unitPrice: parseUnitPrice('12150.0000'),
              }
            : {}),
        },
      });
    }

    const storedProject = await prisma.project.findUniqueOrThrow({
      where: { id: project.id },
    });
    const storedExpenses = await prisma.expense.findMany({
      where: { projectId: project.id },
      orderBy: { description: 'asc' },
    });

    expect(serializeMoney(storedProject.openingBalance)).toBe('521310.00');
    expect(storedProject.openingBalanceDate?.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
    expect(
      storedExpenses.map((expense) => serializeMoney(expense.amount)).sort(),
    ).toEqual(['0.10', '0.20', '0.30', '9999999999999999.99']);
    const precisionExpense = storedExpenses.find(
      (expense) => expense.description === 'decimal-0.30',
    );
    expect(
      serializeQuantity(precisionExpense?.quantity ?? new Prisma.Decimal(0)),
    ).toBe('3.0000');
    expect(
      serializeQuantity(precisionExpense?.unitPrice ?? new Prisma.Decimal(0)),
    ).toBe('12150.0000');
    expect(storedExpenses[0]?.expenseDate?.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
  });

  it('rejects non-positive financial transaction and agreement values', async () => {
    const project = await prisma.project.create({
      data: { name: 'positive-constraint-project' },
    });
    const payee = await prisma.payee.create({
      data: { name: 'positive-constraint-payee', type: 'OTHER' },
    });

    for (const amount of ['0.00', '-0.01']) {
      await expect(
        prisma.expense.create({
          data: {
            projectId: project.id,
            expenseDate: new Date('2026-08-01T00:00:00.000Z'),
            description: `invalid expense ${amount}`,
            amount: new Prisma.Decimal(amount),
          },
        }),
      ).rejects.toThrow();

      await expect(
        prisma.transfer.create({
          data: {
            projectId: project.id,
            transferDate: new Date('2026-08-01T00:00:00.000Z'),
            amount: new Prisma.Decimal(amount),
          },
        }),
      ).rejects.toThrow();

      await expect(
        prisma.agreement.create({
          data: {
            projectId: project.id,
            payeeId: payee.id,
            totalAmount: new Prisma.Decimal(amount),
          },
        }),
      ).rejects.toThrow();
    }
  });

  it('enforces every documented uniqueness rule', async () => {
    const project = await prisma.project.create({
      data: { name: 'unique-project' },
    });
    await expect(
      prisma.project.create({ data: { name: project.name } }),
    ).rejects.toThrow();

    const category = await prisma.category.create({
      data: { name: 'unique-category' },
    });
    await expect(
      prisma.category.create({ data: { name: category.name } }),
    ).rejects.toThrow();

    await prisma.subcategory.create({
      data: { categoryId: category.id, name: 'unique-subcategory' },
    });
    await expect(
      prisma.subcategory.create({
        data: { categoryId: category.id, name: 'unique-subcategory' },
      }),
    ).rejects.toThrow();

    const payee = await prisma.payee.create({
      data: { name: 'agreement-payee', type: 'SUPPLIER' },
    });
    await prisma.agreement.create({
      data: {
        projectId: project.id,
        payeeId: payee.id,
        totalAmount: parseMoney('1.00'),
      },
    });
    await expect(
      prisma.agreement.create({
        data: {
          projectId: project.id,
          payeeId: payee.id,
          totalAmount: parseMoney('2.00'),
        },
      }),
    ).rejects.toThrow();

    await prisma.automationDraft.create({
      data: {
        telegramChatId: 'chat',
        intent: 'ADD_EXPENSE',
        payload: {},
        idempotencyKey: 'unique-idempotency-key',
        expiresAt: new Date('2026-08-02T00:00:00.000Z'),
      },
    });
    await expect(
      prisma.automationDraft.create({
        data: {
          telegramChatId: 'chat',
          intent: 'ADD_EXPENSE',
          payload: {},
          idempotencyKey: 'unique-idempotency-key',
          expiresAt: new Date('2026-08-02T00:00:00.000Z'),
        },
      }),
    ).rejects.toThrow();

    const importJob = await prisma.importJob.create({
      data: {
        projectId: project.id,
        fileName: 'source.xlsx',
        fileSha256: 'a'.repeat(64),
        sheetName: 'Sheet1',
      },
    });
    await prisma.importRow.create({
      data: {
        importJobId: importJob.id,
        sourceRow: 7,
        rowHash: 'b'.repeat(64),
        status: 'VALID',
        rawData: {},
      },
    });
    await expect(
      prisma.importRow.create({
        data: {
          importJobId: importJob.id,
          sourceRow: 7,
          rowHash: 'c'.repeat(64),
          status: 'VALID',
          rawData: {},
        },
      }),
    ).rejects.toThrow();
  });

  it('accepts documented optional, archived, unclassified, soft-delete, and negative-balance data', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'optional-data-project',
        status: ProjectStatus.ARCHIVED,
        archivedAt: new Date('2026-08-01T01:00:00.000Z'),
        openingBalance: parseMoney('-10.00'),
      },
    });
    const payee = await prisma.payee.create({
      data: {
        name: 'optional-data-payee',
        type: 'WORKER',
        phone: null,
        companyName: null,
      },
    });
    const expense = await prisma.expense.create({
      data: {
        projectId: project.id,
        expenseDate: new Date('2026-08-01T00:00:00.000Z'),
        description: 'unclassified imported expense',
        categoryId: null,
        payeeId: null,
        source: RecordSource.EXCEL_IMPORT,
        amount: parseMoney('20.00'),
        deletedAt: new Date('2026-08-01T02:00:00.000Z'),
      },
    });
    const transfer = await prisma.transfer.create({
      data: {
        projectId: project.id,
        transferDate: new Date('2026-08-01T00:00:00.000Z'),
        amount: parseMoney('10.00'),
        deletedAt: new Date('2026-08-01T02:00:00.000Z'),
      },
    });

    expect(payee.phone).toBeNull();
    expect(payee.companyName).toBeNull();
    expect(expense.categoryId).toBeNull();
    expect(expense.payeeId).toBeNull();
    expect(expense.deletedAt).not.toBeNull();
    expect(transfer.deletedAt).not.toBeNull();
    expect(project.status).toBe(ProjectStatus.ARCHIVED);
    expect(project.openingBalance.isNegative()).toBe(true);
  });

  it('restricts deletion of financially referenced records without cascading', async () => {
    const project = await prisma.project.create({
      data: { name: 'restricted-delete-project' },
    });
    const category = await prisma.category.create({
      data: { name: 'restricted-delete-category' },
    });
    const payee = await prisma.payee.create({
      data: { name: 'restricted-delete-payee', type: 'COMPANY' },
    });
    await prisma.expense.create({
      data: {
        projectId: project.id,
        expenseDate: new Date('2026-08-01T00:00:00.000Z'),
        description: 'financial reference',
        categoryId: category.id,
        payeeId: payee.id,
        amount: parseMoney('1.00'),
      },
    });

    await expect(
      prisma.project.delete({ where: { id: project.id } }),
    ).rejects.toThrow();
    await expect(
      prisma.category.delete({ where: { id: category.id } }),
    ).rejects.toThrow();
    await expect(
      prisma.payee.delete({ where: { id: payee.id } }),
    ).rejects.toThrow();
    expect(
      await prisma.expense.count({ where: { projectId: project.id } }),
    ).toBe(1);
  });

  it('appends immutable audit JSON with safe decimals and transaction support', async () => {
    const audit = new AuditService(prisma);
    const event = await prisma.$transaction((transaction) =>
      audit.append(
        {
          action: AuditAction.CREATE,
          entityType: 'Expense',
          entityId: 'audit-expense-id',
          source: RecordSource.WEB,
          before: { amount: parseMoney('0.20') },
          after: {
            amount: parseMoney('0.30'),
            databaseUrl: 'must-not-be-written',
          },
          correlationId: 'core-001-correlation',
        },
        transaction,
      ),
    );

    const stored = await prisma.auditEvent.findUniqueOrThrow({
      where: { id: event.id },
    });
    expect(stored.beforeData).toEqual({ amount: '0.2' });
    expect(stored.afterData).toEqual({
      amount: '0.3',
      databaseUrl: '[REDACTED]',
    });
    expect(stored.correlationId).toBe('core-001-correlation');

    await expect(
      prisma.auditEvent.update({
        where: { id: event.id },
        data: { entityType: 'Changed' },
      }),
    ).rejects.toThrow(/append-only/i);
    await expect(
      prisma.auditEvent.delete({ where: { id: event.id } }),
    ).rejects.toThrow(/append-only/i);
    expect(await prisma.auditEvent.count({ where: { id: event.id } })).toBe(1);
  });
});

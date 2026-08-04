import {
  AttachmentMetadata,
  ExpenseListResponse,
  ExpenseResponse,
  PayeeDetailResponse,
  ProjectResponse,
} from '@claims-os/domain';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { AuditService } from '../src/audit/audit.service';
import { DATABASE_CLIENT } from '../src/infrastructure/database/database.service';
import { ObjectStorageService } from '../src/infrastructure/object-storage/object-storage.service';
import { CORRELATION_HEADER } from '../src/observability/correlation-context';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);

function loggerMock() {
  return {
    debug: jest.fn(),
    error: jest.fn(),
    event: jest.fn(),
    fatal: jest.fn(),
    log: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
  };
}

describe('Expenses API against isolated PostgreSQL and private MinIO', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let storage: ObjectStorageService;
  let projectId: string;
  let categoryId: string;
  let subcategoryId: string;
  let otherCategoryId: string;
  let payeeId: string;
  let otherPayeeId: string;
  let manualExpenseId: string;
  let calculatedExpenseId: string;
  let attachmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StructuredLoggerService)
      .useValue(loggerMock())
      .compile();
    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    prisma = app.get<PrismaClient>(DATABASE_CLIENT);
    storage = app.get(ObjectStorageService);
    await prisma.$connect();
  });

  afterAll(async () => {
    const objects = await prisma.attachment.findMany({
      select: { objectKey: true },
    });
    for (const { objectKey } of objects) {
      await storage.deletePrivateObject(objectKey);
    }
    await app.close();
    await prisma.$disconnect();
  });

  it('starts empty, creates dependencies, validates required input, and rolls back on audit failure', async () => {
    expect(await prisma.expense.count()).toBe(0);
    expect(await prisma.attachment.count()).toBe(0);
    const project = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Expense Project', openingBalance: '50000.00' })
      .expect(201);
    projectId = (project.body as ProjectResponse).id;
    const category = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Materials Test' })
      .expect(201);
    categoryId = (category.body as { id: string }).id;
    const subcategory = await request(app.getHttpServer())
      .post(`/api/v1/categories/${categoryId}/subcategories`)
      .send({ name: 'Cement Test' })
      .expect(201);
    subcategoryId = (subcategory.body as { id: string }).id;
    const otherCategory = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Works Test' })
      .expect(201);
    otherCategoryId = (otherCategory.body as { id: string }).id;
    const payee = await request(app.getHttpServer())
      .post('/api/v1/payees')
      .send({
        name: 'Expense Supplier',
        type: 'SUPPLIER',
        companyName: 'Search Company',
      })
      .expect(201);
    payeeId = (payee.body as { id: string }).id;
    const otherPayee = await request(app.getHttpServer())
      .post('/api/v1/payees')
      .send({ name: 'Other Payee', type: 'OTHER' })
      .expect(201);
    otherPayeeId = (otherPayee.body as { id: string }).id;

    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-01',
        description: 'Missing category',
        amount: '10.00',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-01',
        description: 'Untrusted source',
        categoryId,
        amount: '10.00',
        source: 'TELEGRAM',
      })
      .expect(400);

    const auditFailure = jest
      .spyOn(app.get(AuditService), 'append')
      .mockRejectedValueOnce(new Error('forced Expense audit failure'));
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-01',
        description: 'Must roll back',
        categoryId,
        amount: '10.00',
      })
      .expect(500);
    auditFailure.mockRestore();
    expect(await prisma.expense.count()).toBe(0);
  });

  it('creates manual and calculated Expenses with stable dates and exact strings', async () => {
    const manual = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set(CORRELATION_HEADER, 'expense-create-manual')
      .send({
        projectId,
        expenseDate: '2026-08-01',
        description: '  Manual expense  ',
        categoryId,
        amount: '0.10',
      })
      .expect(201);
    const manualBody = manual.body as ExpenseResponse;
    manualExpenseId = manualBody.id;
    expect(manualBody).toMatchObject({
      expenseDate: '2026-08-01',
      description: 'Manual expense',
      amount: '0.10',
      quantity: null,
      unitPrice: null,
      source: 'WEB',
      attachments: [],
    });

    const calculated = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set(CORRELATION_HEADER, 'expense-create-calculated')
      .send({
        projectId,
        expenseDate: '2026-08-02',
        description: 'Cement purchase',
        categoryId,
        subcategoryId,
        payeeId,
        invoiceNumber: 'INV-100',
        quantity: '3.0000',
        unit: '??',
        unitPrice: '12150.0000',
        paymentMethod: 'Cash',
        notes: 'Searchable note',
      })
      .expect(201);
    const calculatedBody = calculated.body as ExpenseResponse;
    calculatedExpenseId = calculatedBody.id;
    expect(calculatedBody).toMatchObject({
      amount: '36450.00',
      quantity: '3.0000',
      unitPrice: '12150.0000',
      invoiceNumber: 'INV-100',
    });

    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-02',
        description: 'Redundant amount',
        categoryId,
        quantity: '3.0000',
        unitPrice: '10.0000',
        amount: '30.00',
      })
      .expect(400);
    const persisted = await prisma.expense.findUniqueOrThrow({
      where: { id: calculatedExpenseId },
    });
    expect(persisted.expenseDate.toISOString().slice(0, 10)).toBe('2026-08-02');
    expect(persisted.amount.toFixed(2)).toBe('36450.00');
  });

  it('enforces effective active classification and Payee rules while preserving unchanged history', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${categoryId}/deactivate`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${calculatedExpenseId}`)
      .send({ description: 'Historical inactive category' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-03',
        description: 'Assign inactive category',
        categoryId,
        amount: '10.00',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${categoryId}/reactivate`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/subcategories/${subcategoryId}/deactivate`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${calculatedExpenseId}`)
      .send({ notes: 'Keep historical subcategory' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-03',
        description: 'Inactive subcategory',
        categoryId,
        subcategoryId,
        amount: '10.00',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/subcategories/${subcategoryId}/reactivate`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/payees/${payeeId}/deactivate`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${calculatedExpenseId}`)
      .send({ invoiceNumber: 'INV-101' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .send({
        projectId,
        expenseDate: '2026-08-03',
        description: 'Inactive payee',
        categoryId,
        payeeId,
        amount: '10.00',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/payees/${payeeId}/reactivate`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${calculatedExpenseId}`)
      .send({ categoryId: otherCategoryId })
      .expect(400);
  });

  it('lists, searches, filters, sorts, paginates, and excludes deleted Expenses', async () => {
    await prisma.expense.createMany({
      data: [
        {
          projectId,
          expenseDate: new Date('2026-07-30T00:00:00.000Z'),
          description: 'Telegram expense',
          categoryId,
          payeeId,
          invoiceNumber: 'TG-1',
          amount: '20.00',
          source: 'TELEGRAM',
        },
        {
          projectId,
          expenseDate: new Date('2026-07-29T00:00:00.000Z'),
          description: 'Old import',
          categoryId: null,
          amount: '30.00',
          source: 'EXCEL_IMPORT',
          notes: 'Import search phrase',
        },
        {
          projectId,
          expenseDate: new Date('2026-07-28T00:00:00.000Z'),
          description: 'Deleted fixture',
          categoryId,
          amount: '999.00',
          deletedAt: new Date(),
        },
      ],
    });
    const all = await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .expect(200);
    const allBody = all.body as ExpenseListResponse;
    expect(allBody.items).toHaveLength(4);
    expect(allBody.items[0]?.expenseDate).toBe('2026-08-02');
    expect(allBody.pagination).toMatchObject({
      page: 1,
      pageSize: 25,
      totalItems: 4,
      totalPages: 1,
    });

    const oldest = await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .query({ sort: 'OLDEST', pageSize: 1, page: 2 })
      .expect(200);
    expect((oldest.body as ExpenseListResponse).pagination.totalPages).toBe(4);

    const filters = [
      { projectId },
      { from: '2026-08-01', to: '2026-08-02' },
      { categoryId },
      { subcategoryId },
      { payeeId },
      { paymentMethod: 'Cash' },
      { source: 'TELEGRAM' },
      { search: 'INV-101' },
      { search: 'Search Company' },
      { search: 'Import search phrase' },
    ];
    for (const query of filters) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/expenses')
        .query(query)
        .expect(200);
      expect(
        (response.body as ExpenseListResponse).items.length,
      ).toBeGreaterThan(0);
    }
    await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .query({ from: '2026-08-02', to: '2026-08-01' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/expenses?pageSize=101')
      .expect(400);
  });

  it('updates amount modes and fields without changing source or auditing no-ops', async () => {
    const calculated = await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${manualExpenseId}`)
      .set(CORRELATION_HEADER, 'expense-update-calculated')
      .send({
        expenseDate: '2026-08-03',
        description: 'Switch to calculated',
        categoryId: otherCategoryId,
        payeeId: otherPayeeId,
        quantity: '1.0050',
        unitPrice: '1.0000',
        amount: null,
      })
      .expect(200);
    expect(calculated.body).toMatchObject({
      amount: '1.01',
      quantity: '1.0050',
      unitPrice: '1.0000',
      source: 'WEB',
    });
    const manual = await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${manualExpenseId}`)
      .send({
        unitPrice: null,
        amount: '100.00',
        payeeId: null,
        invoiceNumber: '',
        paymentMethod: '',
        notes: '',
      })
      .expect(200);
    expect(manual.body).toMatchObject({
      amount: '100.00',
      quantity: '1.0050',
      unitPrice: null,
      payee: null,
      invoiceNumber: null,
      paymentMethod: null,
      notes: null,
    });
    const before = await prisma.auditEvent.count();
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${manualExpenseId}`)
      .send({ description: 'Switch to calculated' })
      .expect(200);
    expect(await prisma.auditEvent.count()).toBe(before);
  });

  it('updates existing Project, Payee, and Agreement totals without persisting derived values', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/payees/${payeeId}/agreement`)
      .send({ totalAmount: '30000.00' })
      .expect(201);
    const aggregate = await prisma.expense.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { amount: true },
    });
    const project = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}`)
      .expect(200);
    expect((project.body as ProjectResponse).totals.totalExpenses).toBe(
      aggregate._sum.amount?.toFixed(2),
    );
    const payee = await request(app.getHttpServer())
      .get(`/api/v1/payees/${payeeId}`)
      .expect(200);
    const payeeBody = payee.body as PayeeDetailResponse;
    const expectedPaid = await prisma.expense.aggregate({
      where: { projectId, payeeId, deletedAt: null },
      _sum: { amount: true },
    });
    expect(payeeBody.totalPaid).toBe(expectedPaid._sum.amount?.toFixed(2));
    expect(payeeBody.projects[0]?.agreement?.paidAmount).toBe(
      expectedPaid._sum.amount?.toFixed(2),
    );

    const projectTotalBefore = (project.body as ProjectResponse).totals
      .totalExpenses;
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${calculatedExpenseId}`)
      .send({
        payeeId: otherPayeeId,
        categoryId: otherCategoryId,
        subcategoryId: null,
      })
      .expect(200);
    const after = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}`)
      .expect(200);
    expect((after.body as ProjectResponse).totals.totalExpenses).toBe(
      projectTotalBefore,
    );
    const oldPayee = await request(app.getHttpServer())
      .get(`/api/v1/payees/${payeeId}`)
      .expect(200);
    expect((oldPayee.body as PayeeDetailResponse).totalPaid).toBe('20.00');
    expect(
      await prisma.agreement.findFirst({
        where: { projectId, payeeId },
        select: { totalAmount: true },
      }),
    ).toEqual({ totalAmount: new Prisma.Decimal('30000.00') });
  });

  it('uploads, lists, and streams private Attachments with content validation and limits', async () => {
    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .set(CORRELATION_HEADER, 'attachment-add')
      .attach('file', png, {
        filename: 'invoice.png',
        contentType: 'image/png',
      })
      .expect(201);
    const metadata = uploaded.body as AttachmentMetadata;
    attachmentId = metadata.id;
    expect(metadata).toMatchObject({
      expenseId: manualExpenseId,
      originalName: 'invoice.png',
      mimeType: 'image/png',
      sizeBytes: String(png.length),
    });
    expect(metadata.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(metadata)).not.toContain('objectKey');

    const list = await request(app.getHttpServer())
      .get(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .expect(200);
    expect(list.body as AttachmentMetadata[]).toHaveLength(1);
    const content = await request(app.getHttpServer())
      .get(`/api/v1/attachments/${attachmentId}/content`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(content.body).toEqual(png);
    expect(content.headers['cache-control']).toBe('private, no-store');
    expect(content.headers['content-disposition']).toContain('attachment');

    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .attach('file', png, {
        filename: 'wrong.pdf',
        contentType: 'application/pdf',
      })
      .expect(415);
    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .attach('file', Buffer.alloc(0), {
        filename: 'empty.png',
        contentType: 'image/png',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);

    for (let index = 1; index < 10; index += 1) {
      await request(app.getHttpServer())
        .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
        .attach('file', png, {
          filename: `invoice-${String(index)}.png`,
          contentType: 'image/png',
        })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .attach('file', png, {
        filename: 'eleven.png',
        contentType: 'image/png',
      })
      .expect(409);
  });

  it('keeps archived Expense reads and Attachment streams available while rejecting writes', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/archive`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/expenses/${manualExpenseId}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/attachments/${attachmentId}/content`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${manualExpenseId}`)
      .send({ description: 'Rejected archived update' })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/attachments`)
      .attach('file', png, {
        filename: 'archived.png',
        contentType: 'image/png',
      })
      .expect(409);
    const archivedList = await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .query({ projectId })
      .expect(200);
    expect((archivedList.body as ExpenseListResponse).items.length).toBe(4);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/restore`)
      .expect(200);
  });

  it('hides deleted fixtures, exposes no delete/restore API, and keeps audit immutable', async () => {
    const deleted = await prisma.expense.findFirstOrThrow({
      where: { description: 'Deleted fixture' },
    });
    await request(app.getHttpServer())
      .get(`/api/v1/expenses/${deleted.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/expenses/${deleted.id}`)
      .send({ description: 'Must not change' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/expenses/${manualExpenseId}`)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/v1/expenses/${manualExpenseId}/restore`)
      .expect(404);

    const event = await prisma.auditEvent.findFirstOrThrow({
      where: {
        entityType: 'Expense',
        correlationId: 'expense-update-calculated',
      },
    });
    expect(event.afterData).toMatchObject({
      operation: 'update',
      amount: '1.01',
      source: 'WEB',
    });
    await expect(
      prisma.$executeRawUnsafe(
        'UPDATE "AuditEvent" SET "entityType" = \'Changed\' WHERE "id" = $1',
        event.id,
      ),
    ).rejects.toThrow();
    expect(await prisma.transfer.count()).toBe(0);
    expect(await prisma.importJob.count()).toBe(0);
  });
});

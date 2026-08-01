import {
  AgreementResponse,
  PayeeDetailResponse,
  PayeeResponse,
} from '@claims-os/domain';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { AuditService } from '../src/audit/audit.service';
import { DATABASE_CLIENT } from '../src/infrastructure/database/database.service';
import { CORRELATION_HEADER } from '../src/observability/correlation-context';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

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

describe('Payees and Agreements API against an isolated migrated database', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let supplierId: string;
  let activeProjectId: string;
  let archivedProjectId: string;
  let softOnlyProjectId: string;

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
    await prisma.$connect();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('starts empty, validates required fields, and rolls back on audit failure', async () => {
    expect(await prisma.payee.count()).toBe(0);
    expect(
      (await request(app.getHttpServer()).get('/api/v1/payees').expect(200))
        .body,
    ).toEqual([]);
    await request(app.getHttpServer())
      .post('/api/v1/payees')
      .send({ name: ' ', type: 'SUPPLIER' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/payees')
      .send({ name: 'مورد', type: 'INVALID' })
      .expect(400);

    const failedAudit = jest
      .spyOn(app.get(AuditService), 'append')
      .mockRejectedValueOnce(new Error('forced audit failure'));
    await request(app.getHttpServer())
      .post('/api/v1/payees')
      .send({ name: 'يجب التراجع عنه', type: 'OTHER' })
      .expect(500);
    failedAudit.mockRestore();
    expect(await prisma.payee.count()).toBe(0);
  });

  it('creates every type, permits duplicate names, and preserves optional nulls', async () => {
    const fixtures = [
      {
        name: '  مورد النور  ',
        type: 'SUPPLIER',
        specialty: 'خامات',
        phone: '0100',
        companyName: 'النور',
        notes: 'ملاحظة',
      },
      { name: 'حسن', type: 'CRAFTSMAN', specialty: 'نجارة' },
      { name: 'أحمد', type: 'WORKER', phone: '0111' },
      {
        name: 'شركة البناء',
        type: 'COMPANY',
        companyName: 'شركة البناء المتحدة',
      },
      { name: 'حسن', type: 'OTHER' },
    ] as const;
    const created: PayeeResponse[] = [];
    for (const fixture of fixtures) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payees')
        .set(CORRELATION_HEADER, 'payee-create')
        .send(fixture)
        .expect(201);
      created.push(response.body as PayeeResponse);
    }
    supplierId = created[0]!.id;
    expect(created[0]).toMatchObject({
      name: 'مورد النور',
      isActive: true,
      totalPaid: '0.00',
    });
    expect(created[1]).toMatchObject({
      phone: null,
      companyName: null,
      notes: null,
    });
    expect(created.filter(({ name }) => name === 'حسن')).toHaveLength(2);
    expect(
      await prisma.auditEvent.count({ where: { entityType: 'Payee' } }),
    ).toBe(5);
  });

  it('searches the four approved fields and applies status filters', async () => {
    for (const term of ['النور', 'المتحدة', '0100', 'نجارة']) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payees')
        .query({ search: `  ${term}  ` })
        .expect(200);
      expect((response.body as PayeeResponse[]).length).toBeGreaterThan(0);
    }
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/payees')
          .query({ search: 'غير موجود' })
          .expect(200)
      ).body,
    ).toEqual([]);

    await request(app.getHttpServer())
      .post(`/api/v1/payees/${supplierId}/deactivate`)
      .expect(200);
    const active = await request(app.getHttpServer())
      .get('/api/v1/payees')
      .expect(200);
    expect(
      (active.body as PayeeResponse[]).some(({ id }) => id === supplierId),
    ).toBe(false);
    const inactive = await request(app.getHttpServer())
      .get('/api/v1/payees?status=INACTIVE')
      .expect(200);
    expect((inactive.body as PayeeResponse[]).map(({ id }) => id)).toContain(
      supplierId,
    );
    await request(app.getHttpServer())
      .post(`/api/v1/payees/${supplierId}/deactivate`)
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/payees/${supplierId}/reactivate`)
      .expect(200);
  });

  it('updates in place, clears optional fields, skips no-op audit, and reports unknown ids', async () => {
    const before = await prisma.auditEvent.count();
    await request(app.getHttpServer())
      .patch(`/api/v1/payees/${supplierId}`)
      .send({ name: 'مورد النور' })
      .expect(200);
    expect(await prisma.auditEvent.count()).toBe(before);
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/payees/${supplierId}`)
      .set(CORRELATION_HEADER, 'payee-update')
      .send({
        name: 'مورد النور المحدث',
        type: 'COMPANY',
        specialty: '',
        phone: '',
        companyName: 'الشركة الجديدة',
        notes: '',
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      id: supplierId,
      type: 'COMPANY',
      specialty: null,
      phone: null,
      notes: null,
    });
    await request(app.getHttpServer())
      .patch('/api/v1/payees/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      .send({ name: 'مفقود' })
      .expect(404);
  });

  it('creates Project fixtures and derives grouped paid totals from non-deleted Expenses', async () => {
    async function createProject(name: string): Promise<string> {
      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({ name })
        .expect(201);
      return (response.body as { id: string }).id;
    }
    activeProjectId = await createProject('المشروع النشط');
    archivedProjectId = await createProject('المشروع المؤرشف');
    softOnlyProjectId = await createProject('مصروف محذوف فقط');

    await prisma.expense.createMany({
      data: [
        {
          projectId: activeProjectId,
          payeeId: supplierId,
          expenseDate: new Date('2026-08-01T00:00:00.000Z'),
          description: 'أول',
          amount: '0.10',
        },
        {
          projectId: activeProjectId,
          payeeId: supplierId,
          expenseDate: new Date('2026-08-01T00:00:00.000Z'),
          description: 'ثان',
          amount: '0.20',
        },
        {
          projectId: archivedProjectId,
          payeeId: supplierId,
          expenseDate: new Date('2026-08-01T00:00:00.000Z'),
          description: 'مؤرشف',
          amount: '120.00',
        },
        {
          projectId: softOnlyProjectId,
          payeeId: supplierId,
          expenseDate: new Date('2026-08-01T00:00:00.000Z'),
          description: 'محذوف',
          amount: '999.00',
          deletedAt: new Date(),
        },
      ],
    });
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/payees/${supplierId}`)
      .expect(200);
    const body = detail.body as PayeeDetailResponse;
    expect(body.totalPaid).toBe('120.30');
    expect(body.projects.map(({ projectId }) => projectId)).toEqual([
      archivedProjectId,
      activeProjectId,
    ]);
    expect(body.projects.map(({ projectId }) => projectId)).not.toContain(
      softOnlyProjectId,
    );
    const list = await request(app.getHttpServer())
      .get('/api/v1/payees?status=ALL')
      .expect(200);
    expect(
      (list.body as PayeeResponse[]).find(({ id }) => id === supplierId)
        ?.totalPaid,
    ).toBe('120.30');
  });

  it('creates, rejects duplicate, updates, and reads exact Agreement summaries', async () => {
    const created = await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${activeProjectId}/payees/${supplierId}/agreement`,
      )
      .set(CORRELATION_HEADER, 'agreement-create')
      .send({ totalAmount: '100.00', notes: 'اتفاق أول' })
      .expect(201);
    expect(created.body).toMatchObject({
      totalAmount: '100.00',
      paidAmount: '0.30',
      remainingAmount: '99.70',
      overpaidAmount: '0.00',
    });
    await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${activeProjectId}/payees/${supplierId}/agreement`,
      )
      .send({ totalAmount: '200.00' })
      .expect(409);
    for (const totalAmount of ['0.00', '-1.00']) {
      await request(app.getHttpServer())
        .patch(
          `/api/v1/projects/${activeProjectId}/payees/${supplierId}/agreement`,
        )
        .send({ totalAmount })
        .expect(400);
    }
    const updated = await request(app.getHttpServer())
      .patch(
        `/api/v1/projects/${activeProjectId}/payees/${supplierId}/agreement`,
      )
      .set(CORRELATION_HEADER, 'agreement-update')
      .send({ totalAmount: '0.20', notes: '' })
      .expect(200);
    expect(updated.body).toMatchObject({
      totalAmount: '0.20',
      paidAmount: '0.30',
      remainingAmount: '-0.10',
      overpaidAmount: '0.10',
      notes: null,
    });
    const read = await request(app.getHttpServer())
      .get(`/api/v1/projects/${activeProjectId}/payees/${supplierId}/agreement`)
      .expect(200);
    expect((read.body as AgreementResponse).remainingAmount).toBe('-0.10');
  });

  it('keeps archived Project summaries readable and rejects Agreement writes', async () => {
    await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${archivedProjectId}/payees/${supplierId}/agreement`,
      )
      .send({ totalAmount: '100.00' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${archivedProjectId}/archive`)
      .expect(200);
    const read = await request(app.getHttpServer())
      .get(
        `/api/v1/projects/${archivedProjectId}/payees/${supplierId}/agreement`,
      )
      .expect(200);
    expect(read.body).toMatchObject({
      projectStatus: 'ARCHIVED',
      paidAmount: '120.00',
      remainingAmount: '-20.00',
      overpaidAmount: '20.00',
    });
    await request(app.getHttpServer())
      .patch(
        `/api/v1/projects/${archivedProjectId}/payees/${supplierId}/agreement`,
      )
      .send({ totalAmount: '200.00' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${softOnlyProjectId}/archive`)
      .expect(200);
    await request(app.getHttpServer())
      .post(
        `/api/v1/projects/${softOnlyProjectId}/payees/${supplierId}/agreement`,
      )
      .send({ totalAmount: '10.00' })
      .expect(409);
  });

  it('keeps audit events immutable and stores correlation and Decimal strings', async () => {
    const event = await prisma.auditEvent.findFirstOrThrow({
      where: { entityType: 'Agreement', correlationId: 'agreement-update' },
    });
    expect(event.afterData).toMatchObject({
      operation: 'update',
      totalAmount: '0.2',
    });
    await expect(
      prisma.$executeRawUnsafe(
        'UPDATE "AuditEvent" SET "entityType" = \'Changed\' WHERE "id" = $1',
        event.id,
      ),
    ).rejects.toThrow();
    expect(await prisma.category.count()).toBe(0);
    expect(await prisma.transfer.count()).toBe(0);
  });
});

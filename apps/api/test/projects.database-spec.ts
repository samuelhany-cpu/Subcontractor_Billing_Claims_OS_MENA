import { ProjectDashboardResponse, ProjectResponse } from '@claims-os/domain';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { DATABASE_CLIENT } from '../src/infrastructure/database/database.service';
import { CORRELATION_HEADER } from '../src/observability/correlation-context';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';
import { ProjectStateService } from '../src/projects/project-state.service';

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

describe('Projects API against an isolated migrated database', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let firstProjectId: string;

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

  it('validates names and creates a signed, date-stable project without login or seeds', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set(CORRELATION_HEADER, 'project-invalid')
      .send({ name: '   ' })
      .expect(400);
    const invalidBody = invalid.body as unknown as Readonly<
      Record<string, unknown>
    >;
    expect(invalidBody).toMatchObject({
      code: 'VALIDATION_ERROR',
      correlationId: 'project-invalid',
    });

    const created = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set(CORRELATION_HEADER, 'project-create')
      .send({
        name: '  مشروع النيل  ',
        openingBalance: '-100.00',
        openingBalanceDate: '2026-08-01',
      })
      .expect(201);

    const createdBody = created.body as unknown as ProjectResponse;
    expect(createdBody).toMatchObject({
      name: 'مشروع النيل',
      status: 'ACTIVE',
      openingBalance: '-100.00',
      openingBalanceDate: '2026-08-01',
      archivedAt: null,
      totals: {
        totalIncomingTransfers: '0.00',
        totalExpenses: '0.00',
        totalFunding: '-100.00',
        availableBalance: '-100.00',
        expenseCount: 0,
      },
    });
    firstProjectId = createdBody.id;
    expect(await prisma.category.count()).toBe(0);
    expect(await prisma.project.count()).toBe(1);
    const auditEvent = await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: firstProjectId },
    });
    expect(auditEvent).toMatchObject({
      action: 'CREATE',
      source: 'WEB',
      correlationId: 'project-create',
    });
    expect(auditEvent.afterData).toEqual(
      expect.objectContaining({
        openingBalance: '-100.00',
        openingBalanceDate: '2026-08-01',
      }),
    );
  });

  it('rejects duplicate names and creates multiple projects with omitted optional values', async () => {
    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'مشروع النيل' })
      .expect(409);
    const duplicateBody = duplicate.body as unknown as Readonly<
      Record<string, unknown>
    >;
    expect(duplicateBody.code).toBe('PROJECT_NAME_CONFLICT');

    const second = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'مشروع الواحة' })
      .expect(201);
    const secondBody = second.body as unknown as ProjectResponse;
    expect(secondBody).toMatchObject({
      openingBalance: '0.00',
      openingBalanceDate: null,
    });
  });

  it('aggregates exact active rows, excludes deleted rows, and keeps negative balances', async () => {
    await prisma.transfer.createMany({
      data: [
        {
          projectId: firstProjectId,
          transferDate: new Date('2026-08-02T00:00:00.000Z'),
          amount: new Prisma.Decimal('150.00'),
        },
        {
          projectId: firstProjectId,
          transferDate: new Date('2026-08-02T00:00:00.000Z'),
          amount: new Prisma.Decimal('50.00'),
          deletedAt: new Date(),
        },
      ],
    });
    await prisma.expense.createMany({
      data: [
        {
          projectId: firstProjectId,
          expenseDate: new Date('2026-08-03T00:00:00.000Z'),
          description: 'مصروف نشط',
          amount: new Prisma.Decimal('70.00'),
        },
        {
          projectId: firstProjectId,
          expenseDate: new Date('2026-08-03T00:00:00.000Z'),
          description: 'مصروف محذوف',
          amount: new Prisma.Decimal('30.00'),
          deletedAt: new Date(),
        },
      ],
    });

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/projects/${firstProjectId}`)
      .expect(200);
    const detailBody = detail.body as unknown as ProjectResponse;
    expect(detailBody.totals).toEqual({
      totalIncomingTransfers: '150.00',
      totalExpenses: '70.00',
      totalFunding: '50.00',
      availableBalance: '-20.00',
      expenseCount: 1,
    });
    const dashboard = await request(app.getHttpServer())
      .get(`/api/v1/projects/${firstProjectId}/dashboard`)
      .expect(200);
    const dashboardBody = dashboard.body as unknown as ProjectDashboardResponse;
    expect(dashboardBody).toMatchObject({
      projectId: firstProjectId,
      availableBalance: '-20.00',
    });
    for (const key of [
      'openingBalance',
      'totalIncomingTransfers',
      'totalExpenses',
      'totalFunding',
      'availableBalance',
    ]) {
      expect(typeof dashboardBody[key as keyof ProjectDashboardResponse]).toBe(
        'string',
      );
    }
  });

  it('lists active, archived, and all projects with deterministic stable results', async () => {
    const active = await request(app.getHttpServer())
      .get('/api/v1/projects?status=ACTIVE')
      .expect(200);
    const activeBody = active.body as unknown as readonly ProjectResponse[];
    expect(activeBody).toHaveLength(2);
    const all = await request(app.getHttpServer())
      .get('/api/v1/projects?status=ALL')
      .expect(200);
    const allBody = all.body as unknown as readonly ProjectResponse[];
    expect(allBody.map((project) => project.id)).toEqual(
      activeBody.map((project) => project.id),
    );
    await request(app.getHttpServer())
      .get('/api/v1/projects?status=UNKNOWN')
      .expect(400);
  });

  it('updates active fields and writes safe before/after audit values', async () => {
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${firstProjectId}`)
      .set(CORRELATION_HEADER, 'project-update')
      .send({
        name: 'مشروع النيل المحدّث',
        openingBalance: '-50.00',
        openingBalanceDate: null,
      })
      .expect(200);
    const updatedBody = updated.body as unknown as ProjectResponse;
    expect(updatedBody).toMatchObject({
      name: 'مشروع النيل المحدّث',
      openingBalance: '-50.00',
      openingBalanceDate: null,
    });
    const event = await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: firstProjectId, action: 'UPDATE' },
    });
    expect(event).toMatchObject({ correlationId: 'project-update' });
    expect(event.beforeData).toEqual(
      expect.objectContaining({
        openingBalance: '-100.00',
        openingBalanceDate: '2026-08-01',
      }),
    );
    expect(event.afterData).toEqual(
      expect.objectContaining({
        openingBalance: '-50.00',
        openingBalanceDate: null,
      }),
    );
  });

  it('archives without deleting relations, keeps totals readable, and enforces read-only state', async () => {
    const archived = await request(app.getHttpServer())
      .post(`/api/v1/projects/${firstProjectId}/archive`)
      .set(CORRELATION_HEADER, 'project-archive')
      .expect(200);
    const archivedBody = archived.body as unknown as ProjectResponse;
    expect(archivedBody.status).toBe('ARCHIVED');
    expect(archivedBody.archivedAt).toEqual(expect.any(String));
    expect(archivedBody.totals.availableBalance).toBe('30.00');
    expect(
      await prisma.expense.count({ where: { projectId: firstProjectId } }),
    ).toBe(2);
    expect(
      await prisma.transfer.count({ where: { projectId: firstProjectId } }),
    ).toBe(2);

    const blocked = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${firstProjectId}`)
      .set(CORRELATION_HEADER, 'project-archived-edit')
      .send({ name: 'غير مسموح' })
      .expect(409);
    const blockedBody = blocked.body as unknown as Readonly<
      Record<string, unknown>
    >;
    expect(blockedBody).toMatchObject({
      code: 'PROJECT_ARCHIVED',
      correlationId: 'project-archived-edit',
    });
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${firstProjectId}/archive`)
      .expect(409);

    const archivedList = await request(app.getHttpServer())
      .get('/api/v1/projects?status=ARCHIVED')
      .expect(200);
    const archivedListBody =
      archivedList.body as unknown as readonly ProjectResponse[];
    expect(archivedListBody.map((project) => project.id)).toContain(
      firstProjectId,
    );
    await expect(
      app.get(ProjectStateService).assertAcceptsWrites(firstProjectId),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('restores the same record and rejects duplicate state transitions', async () => {
    const restored = await request(app.getHttpServer())
      .post(`/api/v1/projects/${firstProjectId}/restore`)
      .set(CORRELATION_HEADER, 'project-restore')
      .expect(200);
    const restoredBody = restored.body as unknown as ProjectResponse;
    expect(restoredBody).toMatchObject({
      id: firstProjectId,
      status: 'ACTIVE',
      archivedAt: null,
    });
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${firstProjectId}/restore`)
      .expect(409);
    await expect(
      app.get(ProjectStateService).assertAcceptsWrites(firstProjectId),
    ).resolves.toMatchObject({ id: firstProjectId });
    expect(
      await prisma.auditEvent.count({
        where: {
          entityId: firstProjectId,
          action: { in: ['ARCHIVE', 'UNARCHIVE'] },
        },
      }),
    ).toBe(2);
  });

  it('returns correlated RFC 7807 not-found errors and never requires user context', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/projects/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      .set(CORRELATION_HEADER, 'missing-project')
      .expect(404);
    expect(response.type).toMatch(/application\/problem\+json/);
    const problemBody = response.body as unknown as Readonly<
      Record<string, unknown>
    >;
    expect(problemBody).toMatchObject({
      code: 'PROJECT_NOT_FOUND',
      correlationId: 'missing-project',
    });
    expect(await prisma.project.count()).toBe(2);
  });
});

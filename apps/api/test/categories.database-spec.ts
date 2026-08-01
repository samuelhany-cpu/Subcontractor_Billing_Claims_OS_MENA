import {
  CategoryResponse,
  SubcategoryResponse,
  toClassificationOptions,
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

describe('Categories API against an isolated migrated database', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;
  let firstId: string;
  let secondId: string;
  let thirdId: string;
  let firstSubcategoryId: string;
  let secondSubcategoryId: string;

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

  it('starts empty, defaults to active, validates names, and rolls back when audit fails', async () => {
    expect(await prisma.category.count()).toBe(0);
    const empty = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect(200);
    expect(empty.body).toEqual([]);

    const invalid = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set(CORRELATION_HEADER, 'category-invalid')
      .send({ name: '   ' })
      .expect(400);
    expect(invalid.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      correlationId: 'category-invalid',
    });

    const audit = app.get(AuditService);
    const failedAudit = jest
      .spyOn(audit, 'append')
      .mockRejectedValueOnce(new Error('forced audit failure'));
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'يجب التراجع عنها' })
      .expect(500);
    failedAudit.mockRestore();
    expect(await prisma.category.count()).toBe(0);
  });

  it('creates trimmed categories in deterministic order with no additional records', async () => {
    const created: CategoryResponse[] = [];
    for (const name of ['  الفئة الأولى  ', 'الفئة الثانية', 'الفئة الثالثة']) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set(CORRELATION_HEADER, 'category-create')
        .send({ name })
        .expect(201);
      created.push(response.body as CategoryResponse);
    }
    firstId = created[0]!.id;
    secondId = created[1]!.id;
    thirdId = created[2]!.id;
    expect(
      created.map(({ name, sortOrder, isActive }) => ({
        name,
        sortOrder,
        isActive,
      })),
    ).toEqual([
      { name: 'الفئة الأولى', sortOrder: 0, isActive: true },
      { name: 'الفئة الثانية', sortOrder: 1, isActive: true },
      { name: 'الفئة الثالثة', sortOrder: 2, isActive: true },
    ]);
    expect(await prisma.subcategory.count()).toBe(0);
    expect(await prisma.project.count()).toBe(0);
    expect(
      await prisma.auditEvent.count({ where: { entityType: 'Category' } }),
    ).toBe(3);

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'الفئة الأولى' })
      .expect(409);
    expect((duplicate.body as Readonly<Record<string, unknown>>).code).toBe(
      'CATEGORY_NAME_CONFLICT',
    );
  });

  it('requires a complete unique global reorder and persists deterministic order atomically', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories/reorder')
      .send({ orderedIds: [firstId, firstId, thirdId] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/categories/reorder')
      .send({ orderedIds: [firstId, secondId] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/categories/reorder')
      .send({
        orderedIds: [firstId, secondId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
      })
      .expect(400);

    const audit = app.get(AuditService);
    const failedAudit = jest
      .spyOn(audit, 'append')
      .mockRejectedValueOnce(new Error('forced reorder audit failure'));
    await request(app.getHttpServer())
      .post('/api/v1/categories/reorder')
      .send({ orderedIds: [thirdId, firstId, secondId] })
      .expect(500);
    failedAudit.mockRestore();
    expect(
      (
        await prisma.category.findMany({
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        })
      ).map(({ id }) => id),
    ).toEqual([firstId, secondId, thirdId]);

    const reordered = await request(app.getHttpServer())
      .post('/api/v1/categories/reorder')
      .set(CORRELATION_HEADER, 'category-reorder')
      .send({ orderedIds: [thirdId, firstId, secondId] })
      .expect(200);
    expect((reordered.body as CategoryResponse[]).map(({ id }) => id)).toEqual([
      thirdId,
      firstId,
      secondId,
    ]);
    const event = await prisma.auditEvent.findFirstOrThrow({
      where: { entityType: 'CategoryOrder' },
    });
    expect(event).toMatchObject({
      entityId: 'global',
      correlationId: 'category-reorder',
    });
    expect(event.afterData).toEqual({
      operation: 'reorder',
      orderedIds: [thirdId, firstId, secondId],
    });
  });

  it('renames in place, rejects duplicates and unknown records, and skips no-op audit', async () => {
    const beforeAudit = await prisma.auditEvent.count();
    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${firstId}`)
      .send({ name: 'الفئة الأولى' })
      .expect(200);
    expect(await prisma.auditEvent.count()).toBe(beforeAudit);

    const renamed = await request(app.getHttpServer())
      .patch(`/api/v1/categories/${firstId}`)
      .set(CORRELATION_HEADER, 'category-rename')
      .send({ name: 'الفئة المعدلة' })
      .expect(200);
    expect((renamed.body as CategoryResponse).id).toBe(firstId);
    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${firstId}`)
      .send({ name: 'الفئة الثانية' })
      .expect(409);
    await request(app.getHttpServer())
      .patch('/api/v1/categories/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      .send({ name: 'مفقودة' })
      .expect(404);
  });

  it('creates scoped subcategories with parent-local uniqueness and deterministic order', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/subcategories`)
      .send({ name: '  فرعي مشترك  ' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/subcategories`)
      .send({ name: 'فرعي ثان' })
      .expect(201);
    const firstBody = first.body as SubcategoryResponse;
    const secondBody = second.body as SubcategoryResponse;
    firstSubcategoryId = firstBody.id;
    secondSubcategoryId = secondBody.id;
    expect(firstBody).toMatchObject({
      categoryId: firstId,
      name: 'فرعي مشترك',
      sortOrder: 0,
      isActive: true,
    });
    expect(secondBody.sortOrder).toBe(1);

    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/subcategories`)
      .send({ name: 'فرعي مشترك' })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${secondId}/subcategories`)
      .send({ name: 'فرعي مشترك' })
      .expect(201);
    await request(app.getHttpServer())
      .post(
        '/api/v1/categories/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/subcategories',
      )
      .send({ name: 'مفقود' })
      .expect(404);
  });

  it('renames and completely reorders only children of the requested parent', async () => {
    const renamed = await request(app.getHttpServer())
      .patch(`/api/v1/subcategories/${firstSubcategoryId}`)
      .send({ name: 'فرعي معدل' })
      .expect(200);
    expect((renamed.body as SubcategoryResponse).id).toBe(firstSubcategoryId);
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/subcategories/reorder`)
      .send({ orderedIds: [secondSubcategoryId, firstSubcategoryId] })
      .expect(200)
      .expect(({ body }) =>
        expect((body as SubcategoryResponse[]).map(({ id }) => id)).toEqual([
          secondSubcategoryId,
          firstSubcategoryId,
        ]),
      );
    const foreign = await prisma.subcategory.findFirstOrThrow({
      where: { categoryId: secondId },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/subcategories/reorder`)
      .send({ orderedIds: [secondSubcategoryId, foreign.id] })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/subcategories/reorder`)
      .send({ orderedIds: [firstSubcategoryId, firstSubcategoryId] })
      .expect(400);
  });

  it('preserves historical and null classifications through deactivation and rename', async () => {
    const project = await prisma.project.create({
      data: { name: 'مشروع اختبار الفئات' },
    });
    const classified = await prisma.expense.create({
      data: {
        projectId: project.id,
        expenseDate: new Date('2026-08-01T00:00:00.000Z'),
        description: 'مصروف مصنف',
        categoryId: firstId,
        subcategoryId: firstSubcategoryId,
        amount: new Prisma.Decimal('10.00'),
      },
    });
    const unclassified = await prisma.expense.create({
      data: {
        projectId: project.id,
        expenseDate: new Date('2026-08-01T00:00:00.000Z'),
        description: 'مصروف مستورد غير مصنف',
        categoryId: null,
        subcategoryId: null,
        source: 'EXCEL_IMPORT',
        amount: new Prisma.Decimal('20.00'),
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/deactivate`)
      .set(CORRELATION_HEADER, 'category-deactivate')
      .expect(200);
    const storedSubcategory = await prisma.subcategory.findUniqueOrThrow({
      where: { id: firstSubcategoryId },
    });
    expect(storedSubcategory.isActive).toBe(true);
    expect(
      await prisma.expense.findUniqueOrThrow({ where: { id: classified.id } }),
    ).toMatchObject({
      categoryId: firstId,
      subcategoryId: firstSubcategoryId,
    });
    expect(
      await prisma.expense.findUniqueOrThrow({
        where: { id: unclassified.id },
      }),
    ).toMatchObject({
      categoryId: null,
      subcategoryId: null,
    });
    expect(await prisma.category.count({ where: { name: 'غير مصنف' } })).toBe(
      0,
    );

    const active = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect(200);
    expect(
      (active.body as CategoryResponse[]).map(({ id }) => id),
    ).not.toContain(firstId);
    const all = await request(app.getHttpServer())
      .get('/api/v1/categories?status=ALL')
      .expect(200);
    expect(
      toClassificationOptions(all.body as CategoryResponse[]).map(
        ({ id }) => id,
      ),
    ).not.toContain(firstId);

    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${firstId}`)
      .send({ name: 'الفئة التاريخية' })
      .expect(200);
    expect(
      (await prisma.expense.findUniqueOrThrow({ where: { id: classified.id } }))
        .categoryId,
    ).toBe(firstId);
  });

  it('supports explicit state transitions and effective child selection without mutating parent state', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/subcategories/${firstSubcategoryId}/deactivate`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/subcategories/${firstSubcategoryId}/deactivate`)
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/subcategories/${firstSubcategoryId}/reactivate`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/reactivate`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${firstId}/reactivate`)
      .expect(409);

    const options = toClassificationOptions(
      (await request(app.getHttpServer()).get('/api/v1/categories').expect(200))
        .body as CategoryResponse[],
    );
    expect(options.find(({ id }) => id === firstId)?.subcategories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstSubcategoryId }),
      ]),
    );
  });

  it('filters active, inactive, and all records, returns ordered trees, and exposes no hard delete', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/categories/${secondId}/deactivate`)
      .expect(200);
    const inactive = await request(app.getHttpServer())
      .get('/api/v1/categories?status=INACTIVE')
      .expect(200);
    expect((inactive.body as CategoryResponse[]).map(({ id }) => id)).toEqual([
      secondId,
    ]);
    const all = await request(app.getHttpServer())
      .get('/api/v1/categories?status=ALL')
      .expect(200);
    expect((all.body as CategoryResponse[]).map(({ id }) => id)).toEqual([
      thirdId,
      firstId,
      secondId,
    ]);
    const first = (all.body as CategoryResponse[]).find(
      ({ id }) => id === firstId,
    );
    expect(first?.subcategories.map(({ id }) => id)).toEqual([
      secondSubcategoryId,
      firstSubcategoryId,
    ]);
    expect(first).not.toHaveProperty('expenses');
    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${firstId}`)
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/categories?status=UNKNOWN')
      .expect(400);
  });

  it('returns correlated RFC 7807 errors and stores explicit operation audit data', async () => {
    const missing = await request(app.getHttpServer())
      .patch('/api/v1/subcategories/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      .set(CORRELATION_HEADER, 'missing-subcategory')
      .send({ name: 'مفقود' })
      .expect(404);
    expect(missing.type).toMatch(/application\/problem\+json/);
    expect(missing.body).toMatchObject({
      code: 'SUBCATEGORY_NOT_FOUND',
      correlationId: 'missing-subcategory',
    });
    const operations = (
      await prisma.auditEvent.findMany({
        where: {
          entityType: {
            in: [
              'Category',
              'Subcategory',
              'CategoryOrder',
              'SubcategoryOrder',
            ],
          },
        },
        select: { beforeData: true, afterData: true },
      })
    )
      .flatMap(({ beforeData, afterData }) => [beforeData, afterData])
      .filter(
        (value): value is Prisma.JsonObject =>
          value !== null && !Array.isArray(value),
      )
      .map((value) => value.operation);
    expect(operations).toEqual(
      expect.arrayContaining([
        'create',
        'rename',
        'reorder',
        'deactivate',
        'reactivate',
      ]),
    );
    expect(await prisma.category.count({ where: { name: 'غير مصنف' } })).toBe(
      0,
    );
  });
});

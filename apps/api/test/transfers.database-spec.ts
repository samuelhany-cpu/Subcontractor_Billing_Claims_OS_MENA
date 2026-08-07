/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ProjectResponse,
  TransferListResponse,
  TransferResponse,
} from '@claims-os/domain';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { DATABASE_CLIENT } from '../src/infrastructure/database/database.service';

describe('Transfers API against isolated PostgreSQL', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    prisma = app.get<PrismaClient>(DATABASE_CLIENT);
    await prisma.$connect();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('creates, lists, updates, soft-deletes, and restores transfers while updating project funding totals', async () => {
    // 1. Create active Project
    const project = await prisma.project.create({
      data: {
        name: 'مشروع إنشاء البرج التمويلي',
        openingBalance: new Prisma.Decimal('100000.00'),
        openingBalanceDate: new Date('2026-01-01T00:00:00.000Z'),
        status: 'ACTIVE',
      },
    });

    // 2. Create Transfer via API
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/transfers')
      .send({
        projectId: project.id,
        transferDate: '2026-08-04',
        amount: '50000.00',
      })
      .expect(201);

    const transfer = createRes.body as unknown as TransferResponse;
    expect(transfer.id).toBeDefined();
    expect(transfer.projectId).toBe(project.id);
    expect(transfer.transferDate).toBe('2026-08-04');
    expect(transfer.amount).toBe('50000.00');
    expect(transfer.source).toBe('WEB');
    expect(transfer.deletedAt).toBeNull();

    // Verify Project totals include the active transfer:
    // openingBalance (100000) + totalIncomingTransfers (50000) = totalFunding (150000)
    const projectRes1 = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}`)
      .expect(200);

    const projectData1 = projectRes1.body as unknown as ProjectResponse;
    expect(projectData1.totals.totalIncomingTransfers).toBe('50000.00');
    expect(projectData1.totals.totalFunding).toBe('150000.00');
    expect(projectData1.totals.availableBalance).toBe('150000.00');

    // 3. List Transfers
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/transfers')
      .query({ projectId: project.id, status: 'ACTIVE' })
      .expect(200);

    const list1 = listRes.body as unknown as TransferListResponse;
    expect(list1.items.length).toBe(1);
    expect(list1.items[0]?.id).toBe(transfer.id);

    // 4. Update Transfer
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/transfers/${transfer.id}`)
      .send({
        amount: '75000.00',
      })
      .expect(200);

    const updatedTransfer = updateRes.body as unknown as TransferResponse;
    expect(updatedTransfer.amount).toBe('75000.00');

    // Verify updated Project funding totals
    const projectRes2 = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}`)
      .expect(200);

    const projectData2 = projectRes2.body as unknown as ProjectResponse;
    expect(projectData2.totals.totalIncomingTransfers).toBe('75000.00');
    expect(projectData2.totals.totalFunding).toBe('175000.00');

    // 5. Soft Delete Transfer
    const deleteRes = await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transfer.id}/delete`)
      .expect(200);

    const deletedTransfer = deleteRes.body as unknown as TransferResponse;
    expect(deletedTransfer.deletedAt).not.toBeNull();

    // Verify ACTIVE list excludes soft-deleted transfer
    const listActiveRes = await request(app.getHttpServer())
      .get('/api/v1/transfers')
      .query({ projectId: project.id, status: 'ACTIVE' })
      .expect(200);
    const listActive = listActiveRes.body as unknown as TransferListResponse;
    expect(listActive.items.length).toBe(0);

    // Verify DELETED list includes soft-deleted transfer
    const listDeletedRes = await request(app.getHttpServer())
      .get('/api/v1/transfers')
      .query({ projectId: project.id, status: 'DELETED' })
      .expect(200);
    const listDeleted = listDeletedRes.body as unknown as TransferListResponse;
    expect(listDeleted.items.length).toBe(1);

    // Verify funding totals exclude soft-deleted transfer
    const projectRes3 = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}`)
      .expect(200);

    const projectData3 = projectRes3.body as unknown as ProjectResponse;
    expect(projectData3.totals.totalIncomingTransfers).toBe('0.00');
    expect(projectData3.totals.totalFunding).toBe('100000.00');

    // 6. Restore Transfer
    const restoreRes = await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transfer.id}/restore`)
      .expect(200);

    const restoredTransfer = restoreRes.body as unknown as TransferResponse;
    expect(restoredTransfer.deletedAt).toBeNull();

    // Verify funding totals include restored transfer
    const projectRes4 = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}`)
      .expect(200);

    const projectData4 = projectRes4.body as unknown as ProjectResponse;
    expect(projectData4.totals.totalIncomingTransfers).toBe('75000.00');
    expect(projectData4.totals.totalFunding).toBe('175000.00');

    // 7. Verify Archived Project Guard
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'ARCHIVED' },
    });

    // Write operation on archived project must be rejected with 409 Conflict
    await request(app.getHttpServer())
      .patch(`/api/v1/transfers/${transfer.id}`)
      .send({ amount: '80000.00' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transfer.id}/delete`)
      .expect(409);

    // Read operation on archived project must succeed
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/transfers/${transfer.id}`)
      .expect(200);
    const fetchedTransfer = getRes.body as unknown as TransferResponse;
    expect(fetchedTransfer.id).toBe(transfer.id);
  });
});

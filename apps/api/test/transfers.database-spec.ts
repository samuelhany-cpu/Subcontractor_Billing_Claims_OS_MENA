import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/infrastructure/database/database.service';
import { Prisma } from '@prisma/client';
import {
  ProjectDashboardResponse,
  TransferListResponse,
  TransferResponse,
} from '@claims-os/domain';
import { App } from 'supertest/types';

describe('Transfers API against isolated PostgreSQL', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    db = app.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates, lists, updates, soft-deletes, and restores transfers while updating project funding totals', async () => {
    const server = app.getHttpServer() as App;

    // 1. Create active Project
    const project = await db.project.create({
      data: {
        name: 'مشروع إنشاء البرج التمويلي',
        openingBalance: new Prisma.Decimal('100000.00'),
        openingDate: new Date('2026-01-01T00:00:00.000Z'),
        status: 'ACTIVE',
      },
    });

    // 2. Create Transfer via API
    const createRes = await request(server)
      .post('/transfers')
      .send({
        projectId: project.id,
        transferDate: '2026-08-04',
        amount: '50000.00',
      })
      .expect(201);

    const transfer = createRes.body as TransferResponse;
    expect(transfer.id).toBeDefined();
    expect(transfer.projectId).toBe(project.id);
    expect(transfer.transferDate).toBe('2026-08-04');
    expect(transfer.amount).toBe('50000.00');
    expect(transfer.source).toBe('WEB');
    expect(transfer.deletedAt).toBeNull();

    // Verify Project totals include the active transfer:
    // openingBalance (100000) + totalIncomingTransfers (50000) = totalFunding (150000)
    const projectDashboardRes1 = await request(server)
      .get(`/projects/${project.id}/dashboard`)
      .expect(200);

    const dashboard1 = projectDashboardRes1.body as ProjectDashboardResponse;
    expect(dashboard1.totals.totalIncomingTransfers).toBe('50000.00');
    expect(dashboard1.totals.totalFunding).toBe('150000.00');
    expect(dashboard1.totals.availableBalance).toBe('150000.00');

    // 3. List Transfers
    const listRes = await request(server)
      .get('/transfers')
      .query({ projectId: project.id, status: 'ACTIVE' })
      .expect(200);

    const list1 = listRes.body as TransferListResponse;
    expect(list1.items.length).toBe(1);
    expect(list1.items[0]?.id).toBe(transfer.id);

    // 4. Update Transfer
    const updateRes = await request(server)
      .patch(`/transfers/${transfer.id}`)
      .send({
        amount: '75000.00',
      })
      .expect(200);

    const updatedTransfer = updateRes.body as TransferResponse;
    expect(updatedTransfer.amount).toBe('75000.00');

    // Verify updated Project funding totals
    const projectDashboardRes2 = await request(server)
      .get(`/projects/${project.id}/dashboard`)
      .expect(200);

    const dashboard2 = projectDashboardRes2.body as ProjectDashboardResponse;
    expect(dashboard2.totals.totalIncomingTransfers).toBe('75000.00');
    expect(dashboard2.totals.totalFunding).toBe('175000.00');

    // 5. Soft Delete Transfer
    const deleteRes = await request(server)
      .post(`/transfers/${transfer.id}/delete`)
      .expect(200);

    const deletedTransfer = deleteRes.body as TransferResponse;
    expect(deletedTransfer.deletedAt).not.toBeNull();

    // Verify ACTIVE list excludes soft-deleted transfer
    const listActiveRes = await request(server)
      .get('/transfers')
      .query({ projectId: project.id, status: 'ACTIVE' })
      .expect(200);
    const listActive = listActiveRes.body as TransferListResponse;
    expect(listActive.items.length).toBe(0);

    // Verify DELETED list includes soft-deleted transfer
    const listDeletedRes = await request(server)
      .get('/transfers')
      .query({ projectId: project.id, status: 'DELETED' })
      .expect(200);
    const listDeleted = listDeletedRes.body as TransferListResponse;
    expect(listDeleted.items.length).toBe(1);

    // Verify funding totals exclude soft-deleted transfer
    const projectDashboardRes3 = await request(server)
      .get(`/projects/${project.id}/dashboard`)
      .expect(200);

    const dashboard3 = projectDashboardRes3.body as ProjectDashboardResponse;
    expect(dashboard3.totals.totalIncomingTransfers).toBe('0.00');
    expect(dashboard3.totals.totalFunding).toBe('100000.00');

    // 6. Restore Transfer
    const restoreRes = await request(server)
      .post(`/transfers/${transfer.id}/restore`)
      .expect(200);

    const restoredTransfer = restoreRes.body as TransferResponse;
    expect(restoredTransfer.deletedAt).toBeNull();

    // Verify funding totals include restored transfer
    const projectDashboardRes4 = await request(server)
      .get(`/projects/${project.id}/dashboard`)
      .expect(200);

    const dashboard4 = projectDashboardRes4.body as ProjectDashboardResponse;
    expect(dashboard4.totals.totalIncomingTransfers).toBe('75000.00');
    expect(dashboard4.totals.totalFunding).toBe('175000.00');

    // 7. Verify Archived Project Guard
    await db.project.update({
      where: { id: project.id },
      data: { status: 'ARCHIVED' },
    });

    // Write operation on archived project must be rejected with 409 Conflict
    await request(server)
      .patch(`/transfers/${transfer.id}`)
      .send({ amount: '80000.00' })
      .expect(409);

    await request(server).post(`/transfers/${transfer.id}/delete`).expect(409);

    // Read operation on archived project must succeed
    const getRes = await request(server)
      .get(`/transfers/${transfer.id}`)
      .expect(200);
    const fetchedTransfer = getRes.body as TransferResponse;
    expect(fetchedTransfer.id).toBe(transfer.id);
  });
});

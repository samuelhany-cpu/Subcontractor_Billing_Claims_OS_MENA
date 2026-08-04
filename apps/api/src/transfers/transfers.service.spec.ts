import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersRepository } from './transfers.repository';
import { ProjectStateService } from '../projects/project-state.service';
import { AuditService } from '../audit/audit.service';
import { CorrelationContext } from '../observability/correlation-context';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';

import { Prisma } from '@prisma/client';

describe('TransfersService', () => {
  let service: TransfersService;
  let repository: jest.Mocked<TransfersRepository>;
  let projectState: jest.Mocked<ProjectStateService>;
  let audit: jest.Mocked<AuditService>;
  let db: jest.Mocked<DatabaseService>;

  const mockTransferRecord = {
    id: 't0000000-0000-0000-0000-000000000001',
    projectId: 'p0000000-0000-0000-0000-000000000001',
    project: {
      id: 'p0000000-0000-0000-0000-000000000001',
      name: 'مشروع برج الأمل',
      status: 'ACTIVE' as const,
    },
    transferDate: new Date('2026-08-04T00:00:00.000Z'),
    amount: new Prisma.Decimal('25000.00'),
    source: 'WEB' as const,
    deletedAt: null,
    createdAt: new Date('2026-08-04T10:00:00.000Z'),
    updatedAt: new Date('2026-08-04T10:00:00.000Z'),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findManyAndCount: jest.fn(),
    };
    const mockState = {
      assertAcceptsWrites: jest.fn(),
    };
    const mockAudit = {
      append: jest.fn(),
    };
    const mockCorrelation = {
      getCorrelationId: jest.fn().mockReturnValue('test-correlation-id'),
    };
    const mockDb = {
      $transaction: jest.fn((cb) => cb(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: TransfersRepository, useValue: mockRepo },
        { provide: ProjectStateService, useValue: mockState },
        { provide: AuditService, useValue: mockAudit },
        { provide: CorrelationContext, useValue: mockCorrelation },
        { provide: DATABASE_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    repository = module.get(TransfersRepository);
    projectState = module.get(ProjectStateService);
    audit = module.get(AuditService);
    db = module.get(DatabaseService);
  });

  it('creates a transfer successfully and writes audit snapshot', async () => {
    projectState.assertAcceptsWrites.mockResolvedValue();
    repository.create.mockResolvedValue(mockTransferRecord);

    const result = await service.create({
      projectId: 'p0000000-0000-0000-0000-000000000001',
      transferDate: '2026-08-04',
      amount: '25000.00',
    });

    expect(projectState.assertAcceptsWrites).toHaveBeenCalledWith(
      'p0000000-0000-0000-0000-000000000001',
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        entityType: 'Transfer',
        entityId: 't0000000-0000-0000-0000-000000000001',
      }),
      expect.anything(),
    );
    expect(result.amount).toBe('25000.00');
    expect(result.source).toBe('WEB');
  });

  it('throws NotFoundException when fetching unknown transfer ID', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.get('unknown-id')).rejects.toThrow(NotFoundException);
  });

  it('performs soft-delete and appends DELETE audit snapshot', async () => {
    projectState.assertAcceptsWrites.mockResolvedValue();
    repository.findById.mockResolvedValue(mockTransferRecord);
    const deletedRecord = {
      ...mockTransferRecord,
      deletedAt: new Date('2026-08-04T12:00:00.000Z'),
    };
    repository.update.mockResolvedValue(deletedRecord);

    const result = await service.delete('t0000000-0000-0000-0000-000000000001');

    expect(repository.update).toHaveBeenCalledWith(
      't0000000-0000-0000-0000-000000000001',
      expect.objectContaining({ deletedAt: expect.any(Date) }),
      expect.anything(),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        entityType: 'Transfer',
      }),
      expect.anything(),
    );
    expect(result.deletedAt).not.toBeNull();
  });

  it('restores a soft-deleted transfer successfully', async () => {
    projectState.assertAcceptsWrites.mockResolvedValue();
    const deletedRecord = {
      ...mockTransferRecord,
      deletedAt: new Date('2026-08-04T12:00:00.000Z'),
    };
    repository.findById.mockResolvedValue(deletedRecord);
    repository.update.mockResolvedValue(mockTransferRecord);

    const result = await service.restore(
      't0000000-0000-0000-0000-000000000001',
    );

    expect(repository.update).toHaveBeenCalledWith(
      't0000000-0000-0000-0000-000000000001',
      { deletedAt: null },
      expect.anything(),
    );
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RESTORE',
        entityType: 'Transfer',
      }),
      expect.anything(),
    );
    expect(result.deletedAt).toBeNull();
  });
});

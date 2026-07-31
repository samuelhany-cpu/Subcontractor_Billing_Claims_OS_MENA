import { AuditAction, AuditEvent, Prisma, RecordSource } from '@prisma/client';
import { REDACTED_VALUE } from '../config/api-config';
import { serializeAuditSnapshot } from './audit-json';
import { AuditService, AuditWriteClient } from './audit.service';

const auditEvent: AuditEvent = {
  id: '2c32f592-4a1d-4fd8-97bb-e040fb786c8e',
  action: AuditAction.CREATE,
  entityType: 'Expense',
  entityId: 'expense-id',
  source: RecordSource.WEB,
  beforeData: null,
  afterData: { amount: '0.30' },
  correlationId: 'correlation-id',
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
};

describe('AuditService', () => {
  it('appends a safely serialized event through the injected client', async () => {
    const create = jest.fn().mockResolvedValue(auditEvent);
    const writer = {
      auditEvent: { create },
    } as unknown as AuditWriteClient;
    const service = new AuditService(writer);

    await expect(
      service.append({
        action: AuditAction.CREATE,
        entityType: 'Expense',
        entityId: 'expense-id',
        source: RecordSource.WEB,
        after: {
          amount: new Prisma.Decimal('0.30'),
          password: 'must-not-be-written',
        },
        correlationId: 'correlation-id',
      }),
    ).resolves.toBe(auditEvent);

    expect(create).toHaveBeenCalledWith({
      data: {
        action: AuditAction.CREATE,
        entityType: 'Expense',
        entityId: 'expense-id',
        source: RecordSource.WEB,
        afterData: {
          amount: '0.3',
          password: REDACTED_VALUE,
        },
        correlationId: 'correlation-id',
      },
    });
  });

  it('supports an explicit transaction-compatible writer', async () => {
    const defaultCreate = jest.fn();
    const transactionCreate = jest.fn().mockResolvedValue(auditEvent);
    const service = new AuditService({
      auditEvent: { create: defaultCreate },
    } as unknown as AuditWriteClient);
    const transaction = {
      auditEvent: { create: transactionCreate },
    } as unknown as AuditWriteClient;

    await service.append(
      {
        action: AuditAction.UPDATE,
        entityType: 'Project',
        source: RecordSource.SYSTEM,
      },
      transaction,
    );

    expect(transactionCreate).toHaveBeenCalledTimes(1);
    expect(defaultCreate).not.toHaveBeenCalled();
  });

  it('exposes no update or delete operation', () => {
    const service = new AuditService({
      auditEvent: { create: jest.fn() },
    } as unknown as AuditWriteClient);

    expect('update' in service).toBe(false);
    expect('delete' in service).toBe(false);
  });
});

describe('serializeAuditSnapshot', () => {
  it('preserves dates, bigint, arrays, and ordinary counts', () => {
    expect(
      serializeAuditSnapshot({
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        sizeBytes: 12n,
        tags: ['one', true],
        count: 2,
        totalRows: 3,
      }),
    ).toEqual({
      createdAt: '2026-08-01T00:00:00.000Z',
      sizeBytes: '12',
      tags: ['one', true],
      count: 2,
      totalRows: 3,
    });
  });

  it('rejects unsafe financial numbers and circular values', () => {
    expect(() => serializeAuditSnapshot({ amount: 0.1 })).toThrow(TypeError);

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => serializeAuditSnapshot(circular)).toThrow(TypeError);
  });
});

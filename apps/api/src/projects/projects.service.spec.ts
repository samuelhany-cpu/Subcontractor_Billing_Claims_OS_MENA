import { Prisma, ProjectStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ProjectTotalsService } from './project-totals.service';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

const record = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مشروع',
  status: ProjectStatus.ACTIVE,
  openingBalance: new Prisma.Decimal('0.00'),
  openingBalanceDate: null,
  archivedAt: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
};
const zeroTotals = {
  totalIncomingTransfers: '0.00',
  totalExpenses: '0.00',
  totalFunding: '0.00',
  availableBalance: '0.00',
  expenseCount: 0,
};

describe('ProjectsService audit transactions', () => {
  it('passes the same transaction to project creation and audit append', async () => {
    const transaction = { marker: 'transaction' };
    const create = jest.fn().mockResolvedValue(record);
    const append = jest.fn().mockResolvedValue({});
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation(transaction),
      ),
      create,
    } as unknown as ProjectsRepository;
    const totals = {
      forProject: jest.fn().mockResolvedValue(zeroTotals),
    } as unknown as ProjectTotalsService;
    const audit = { append } as unknown as AuditService;

    await new ProjectsService(repository, totals, audit).create(
      { name: 'مشروع' },
      'corr-1',
    );

    expect(create).toHaveBeenCalledWith(expect.any(Object), transaction);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: record.id, correlationId: 'corr-1' }),
      transaction,
    );
  });

  it('does not complete a mutation when audit append fails', async () => {
    const transaction = { marker: 'transaction' };
    const forProject = jest.fn();
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation(transaction),
      ),
      create: jest.fn().mockResolvedValue(record),
    } as unknown as ProjectsRepository;
    const totals = { forProject } as unknown as ProjectTotalsService;
    const audit = {
      append: jest.fn().mockRejectedValue(new Error('audit failed')),
    } as unknown as AuditService;

    await expect(
      new ProjectsService(repository, totals, audit).create({ name: 'مشروع' }),
    ).rejects.toThrow('audit failed');
    expect(forProject).not.toHaveBeenCalled();
  });

  it('does not append a misleading audit event for a no-op update', async () => {
    const transaction = { marker: 'transaction' };
    const update = jest.fn();
    const append = jest.fn();
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation(transaction),
      ),
      findById: jest.fn().mockResolvedValue(record),
      update,
    } as unknown as ProjectsRepository;
    const totals = {
      forProject: jest.fn().mockResolvedValue(zeroTotals),
    } as unknown as ProjectTotalsService;
    const audit = { append } as unknown as AuditService;

    await new ProjectsService(repository, totals, audit).update(record.id, {
      name: record.name,
      openingBalance: '0.00',
    });

    expect(update).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
  });
});

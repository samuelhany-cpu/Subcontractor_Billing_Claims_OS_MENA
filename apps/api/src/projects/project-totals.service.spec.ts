import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { ProjectTotalsService } from './project-totals.service';
import { ProjectsRepository } from './projects.repository';

function project(
  openingBalance: string,
  status: ProjectStatus = ProjectStatus.ACTIVE,
): Project {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'مشروع اختبار',
    status,
    openingBalance: new Prisma.Decimal(openingBalance),
    openingBalanceDate: null,
    archivedAt: status === ProjectStatus.ARCHIVED ? new Date() : null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}

describe('ProjectTotalsService', () => {
  it('combines opening balance, transfers, and expenses exactly', async () => {
    const record = project('0.10');
    const repository = {
      aggregates: jest.fn().mockResolvedValue(
        new Map([
          [
            record.id,
            {
              projectId: record.id,
              transferTotal: new Prisma.Decimal('0.20'),
              expenseTotal: new Prisma.Decimal('0.30'),
              expenseCount: 2,
            },
          ],
        ]),
      ),
    } as unknown as ProjectsRepository;

    const result = await new ProjectTotalsService(repository).forProject(
      record,
    );

    expect(result).toEqual({
      totalIncomingTransfers: '0.20',
      totalExpenses: '0.30',
      totalFunding: '0.30',
      availableBalance: '0.00',
      expenseCount: 2,
    });
  });

  it('returns fixed exact zeros for empty aggregates', async () => {
    const repository = {
      aggregates: jest.fn().mockResolvedValue(new Map()),
    } as unknown as ProjectsRepository;
    const result = await new ProjectTotalsService(repository).forProject(
      project('0.00'),
    );
    expect(result).toEqual({
      totalIncomingTransfers: '0.00',
      totalExpenses: '0.00',
      totalFunding: '0.00',
      availableBalance: '0.00',
      expenseCount: 0,
    });
  });

  it('preserves a negative available balance for archived projects', async () => {
    const record = project('-10.00', ProjectStatus.ARCHIVED);
    const repository = {
      aggregates: jest.fn().mockResolvedValue(
        new Map([
          [
            record.id,
            {
              projectId: record.id,
              transferTotal: new Prisma.Decimal('5.00'),
              expenseTotal: new Prisma.Decimal('20.00'),
              expenseCount: 1,
            },
          ],
        ]),
      ),
    } as unknown as ProjectsRepository;
    const result = await new ProjectTotalsService(repository).forProject(
      record,
    );
    expect(result.availableBalance).toBe('-25.00');
  });
});

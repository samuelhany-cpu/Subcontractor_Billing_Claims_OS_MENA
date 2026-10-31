import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { DashboardService, startOfCairoWeek } from './dashboard.service';
import { ProjectsRepository } from './projects.repository';
import { ProjectTotalsService } from './project-totals.service';

const project: Project = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مشروع الاختبار',
  status: ProjectStatus.ARCHIVED,
  openingBalance: new Prisma.Decimal('100.10'),
  openingBalanceDate: null,
  archivedAt: new Date('2026-01-10T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-10T00:00:00.000Z'),
};

type QueryArgs = {
  readonly where: { readonly deletedAt: null; readonly [key: string]: unknown };
};
type QueryResult = readonly unknown[];

function databaseMock() {
  const expenseGroupBy = jest.fn<Promise<QueryResult>, [QueryArgs]>();
  expenseGroupBy
    .mockResolvedValueOnce([
      {
        categoryId: '22222222-2222-4222-8222-222222222222',
        _sum: { amount: new Prisma.Decimal('10.10') },
        _count: { id: 2 },
      },
      {
        categoryId: null,
        _sum: { amount: new Prisma.Decimal('2.20') },
        _count: { id: 1 },
      },
    ])
    .mockResolvedValueOnce([
      {
        payeeId: '33333333-3333-4333-8333-333333333333',
        _sum: { amount: new Prisma.Decimal('10.10') },
      },
    ])
    .mockResolvedValueOnce([
      {
        expenseDate: new Date('2026-01-05T00:00:00.000Z'),
        _sum: { amount: new Prisma.Decimal('12.30') },
      },
    ]);

  return {
    expense: {
      groupBy: expenseGroupBy,
      findMany: jest.fn<Promise<QueryResult>, [QueryArgs]>().mockResolvedValue([
        {
          id: '44444444-4444-4444-8444-444444444444',
          expenseDate: new Date('2026-01-05T00:00:00.000Z'),
          description: 'اختبار مصروف',
          amount: new Prisma.Decimal('12.30'),
          category: { name: 'خامات' },
          payee: { name: 'مورد اختبار' },
        },
      ]),
    },
    transfer: {
      findMany: jest.fn<Promise<QueryResult>, [QueryArgs]>().mockResolvedValue([
        {
          id: '55555555-5555-4555-8555-555555555555',
          transferDate: new Date('2026-01-04T00:00:00.000Z'),
          amount: new Prisma.Decimal('50.00'),
        },
      ]),
    },
    category: {
      findMany: jest.fn<Promise<QueryResult>, [QueryArgs]>().mockResolvedValue([
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'خامات',
        },
      ]),
    },
    payee: {
      findMany: jest.fn<Promise<QueryResult>, [QueryArgs]>().mockResolvedValue([
        {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'مورد اختبار',
        },
      ]),
    },
  };
}

describe('DashboardService', () => {
  it('aggregates exact money, keeps unclassified rows, and excludes soft-deleted records', async () => {
    const database = databaseMock();
    const service = new DashboardService(
      database as never,
      {} as ProjectsRepository,
      {} as ProjectTotalsService,
    );

    const result = await service.forProject(project, {
      totalIncomingTransfers: '50.00',
      totalExpenses: '12.30',
      totalFunding: '150.10',
      availableBalance: '137.80',
      expenseCount: 3,
    });

    expect(result.status).toBe('ARCHIVED');
    expect(result.categoryTotals).toEqual([
      {
        categoryId: '22222222-2222-4222-8222-222222222222',
        categoryName: 'خامات',
        amount: '10.10',
        expenseCount: 2,
      },
      {
        categoryId: null,
        categoryName: 'غير مصنف',
        amount: '2.20',
        expenseCount: 1,
      },
    ]);
    expect(result.topPayees[0]).toEqual({
      payeeId: '33333333-3333-4333-8333-333333333333',
      payeeName: 'مورد اختبار',
      amount: '10.10',
    });
    expect(result.recentExpenses.at(0)?.amount).toBe('12.30');
    expect(result.recentTransfers.at(0)?.amount).toBe('50.00');
    expect(
      database.expense.groupBy.mock.calls.map(([args]) => args.where.deletedAt),
    ).toEqual([null, null, null]);
    expect(
      database.expense.findMany.mock.calls[0]?.[0].where.deletedAt,
    ).toBeNull();
    expect(
      database.transfer.findMany.mock.calls[0]?.[0].where.deletedAt,
    ).toBeNull();
  });

  it('uses Monday Cairo calendar boundaries across UTC midnight', () => {
    expect(startOfCairoWeek(0, new Date('2026-01-04T21:30:00.000Z'))).toEqual(
      new Date('2025-12-29T00:00:00.000Z'),
    );
    expect(startOfCairoWeek(0, new Date('2026-01-04T22:30:00.000Z'))).toEqual(
      new Date('2026-01-05T00:00:00.000Z'),
    );
  });
});

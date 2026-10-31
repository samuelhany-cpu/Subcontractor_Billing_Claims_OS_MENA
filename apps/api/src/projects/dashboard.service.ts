import {
  DashboardCategoryTotal,
  DashboardExpense,
  DashboardPayeeTotal,
  DashboardTransfer,
  DashboardTrendPoint,
  GlobalDashboardResponse,
  ProjectDashboardResponse,
  ProjectTotals,
} from '@claims-os/domain';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Project, ProjectStatus } from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { serializeMoney } from '../shared/decimal/decimal';
import { serializeDateOnly, mapProject } from './project-mapper';
import { ProjectsRepository } from './projects.repository';
import { ProjectTotalsService } from './project-totals.service';

const unclassifiedName = 'غير مصنف';
const weekCount = 12;
const recentLimit = 5;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: PrismaClient,
    private readonly projects: ProjectsRepository,
    private readonly totals: ProjectTotalsService,
  ) {}

  async forProject(
    project: Project,
    totals: ProjectTotals,
  ): Promise<ProjectDashboardResponse> {
    return {
      projectId: project.id,
      status: project.status,
      openingBalance: serializeMoney(project.openingBalance),
      ...totals,
      ...(await this.analytics([project.id])),
    };
  }

  async global(): Promise<GlobalDashboardResponse> {
    const [active, archived] = await Promise.all([
      this.projects.list(ProjectStatus.ACTIVE),
      this.projects.list(ProjectStatus.ARCHIVED),
    ]);
    const projectTotals = await this.totals.forProjects(active);
    const combined = active.reduce<ProjectTotals>(
      (current, project) => {
        const totals = projectTotals.get(project.id);
        if (totals === undefined) return current;
        return {
          totalIncomingTransfers: serializeMoney(
            new Prisma.Decimal(current.totalIncomingTransfers).plus(
              totals.totalIncomingTransfers,
            ),
          ),
          totalExpenses: serializeMoney(
            new Prisma.Decimal(current.totalExpenses).plus(
              totals.totalExpenses,
            ),
          ),
          totalFunding: serializeMoney(
            new Prisma.Decimal(current.totalFunding).plus(totals.totalFunding),
          ),
          availableBalance: serializeMoney(
            new Prisma.Decimal(current.availableBalance).plus(
              totals.availableBalance,
            ),
          ),
          expenseCount: current.expenseCount + totals.expenseCount,
        };
      },
      {
        totalIncomingTransfers: '0.00',
        totalExpenses: '0.00',
        totalFunding: '0.00',
        availableBalance: '0.00',
        expenseCount: 0,
      },
    );

    return {
      activeProjectCount: active.length,
      archivedProjectCount: archived.length,
      projects: active.map((project) => {
        const totals = projectTotals.get(project.id);
        if (totals === undefined)
          throw new Error('Project totals were not produced');
        return mapProject(project, totals);
      }),
      ...combined,
      ...(await this.analytics(active.map((project) => project.id))),
    };
  }

  private async analytics(projectIds: readonly string[]): Promise<{
    readonly categoryTotals: readonly DashboardCategoryTotal[];
    readonly weeklyExpenses: readonly DashboardTrendPoint[];
    readonly topPayees: readonly DashboardPayeeTotal[];
    readonly recentExpenses: readonly DashboardExpense[];
    readonly recentTransfers: readonly DashboardTransfer[];
  }> {
    const where = { projectId: { in: [...projectIds] }, deletedAt: null };
    const trendStart = startOfCairoWeek(weekCount - 1);
    const [
      categoryRows,
      payeeRows,
      dailyRows,
      recentExpenses,
      recentTransfers,
    ] = await Promise.all([
      this.database.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.database.expense.groupBy({
        by: ['payeeId'],
        where: { ...where, payeeId: { not: null } },
        _sum: { amount: true },
      }),
      this.database.expense.groupBy({
        by: ['expenseDate'],
        where: { ...where, expenseDate: { gte: trendStart } },
        _sum: { amount: true },
      }),
      this.database.expense.findMany({
        where,
        include: { category: true, payee: true },
        orderBy: [
          { expenseDate: 'desc' },
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
        take: recentLimit,
      }),
      this.database.transfer.findMany({
        where,
        orderBy: [
          { transferDate: 'desc' },
          { createdAt: 'desc' },
          { id: 'asc' },
        ],
        take: recentLimit,
      }),
    ]);

    const categoryIds = categoryRows
      .map((row) => row.categoryId)
      .filter((id): id is string => id !== null);
    const payeeIds = payeeRows
      .map((row) => row.payeeId)
      .filter((id): id is string => id !== null);
    const [categories, payees] = await Promise.all([
      this.database.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      }),
      this.database.payee.findMany({
        where: { id: { in: payeeIds } },
        select: { id: true, name: true },
      }),
    ]);
    const categoryNames = new Map(categories.map((row) => [row.id, row.name]));
    const payeeNames = new Map(payees.map((row) => [row.id, row.name]));

    const categoryTotals = categoryRows
      .map<DashboardCategoryTotal>((row) => ({
        categoryId: row.categoryId,
        categoryName:
          row.categoryId === null
            ? unclassifiedName
            : (categoryNames.get(row.categoryId) ?? unclassifiedName),
        amount: serializeMoney(row._sum.amount ?? new Prisma.Decimal(0)),
        expenseCount: row._count.id,
      }))
      .sort(compareAmounts);

    const topPayees = payeeRows
      .filter(
        (row): row is typeof row & { payeeId: string } => row.payeeId !== null,
      )
      .map<DashboardPayeeTotal>((row) => ({
        payeeId: row.payeeId,
        payeeName: payeeNames.get(row.payeeId) ?? 'مورد غير معروف',
        amount: serializeMoney(row._sum.amount ?? new Prisma.Decimal(0)),
      }))
      .sort(compareAmounts)
      .slice(0, 5);

    return {
      categoryTotals,
      weeklyExpenses: buildWeeklyTrend(dailyRows),
      topPayees,
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        expenseDate: serializeDateOnly(expense.expenseDate) ?? '',
        description: expense.description,
        amount: serializeMoney(expense.amount),
        categoryName: expense.category?.name ?? unclassifiedName,
        payeeName: expense.payee?.name ?? null,
      })),
      recentTransfers: recentTransfers.map((transfer) => ({
        id: transfer.id,
        transferDate: serializeDateOnly(transfer.transferDate) ?? '',
        amount: serializeMoney(transfer.amount),
      })),
    };
  }
}

function compareAmounts<T extends { readonly amount: string }>(
  left: T,
  right: T,
): number {
  return new Prisma.Decimal(right.amount).comparedTo(left.amount);
}

export function startOfCairoWeek(weeksBack = 0, now = new Date()): Date {
  const result = cairoCalendarDate(now);
  const offset = (result.getUTCDay() + 6) % 7;
  result.setUTCDate(result.getUTCDate() - offset - weeksBack * 7);
  return result;
}

function startOfDateOnlyWeek(date: Date): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const offset = (result.getUTCDay() + 6) % 7;
  result.setUTCDate(result.getUTCDate() - offset);
  return result;
}

function cairoCalendarDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return new Date(
    Date.UTC(
      Number(values.get('year')),
      Number(values.get('month')) - 1,
      Number(values.get('day')),
    ),
  );
}

function buildWeeklyTrend(
  rows: readonly {
    readonly expenseDate: Date | null;
    readonly _sum: { readonly amount: Prisma.Decimal | null };
  }[],
): readonly DashboardTrendPoint[] {
  const firstWeek = startOfCairoWeek(weekCount - 1);
  const buckets = Array.from({ length: weekCount }, (_, index) => {
    const week = new Date(firstWeek);
    week.setUTCDate(week.getUTCDate() + index * 7);
    return [serializeDateOnly(week) ?? '', new Prisma.Decimal(0)] as const;
  });
  const byWeek = new Map(buckets);
  for (const row of rows) {
    if (row.expenseDate === null) continue;
    const key = serializeDateOnly(startOfDateOnlyWeek(row.expenseDate)) ?? '';
    byWeek.set(
      key,
      (byWeek.get(key) ?? new Prisma.Decimal(0)).plus(row._sum.amount ?? 0),
    );
  }
  return buckets.map(([periodStart]) => ({
    periodStart,
    amount: serializeMoney(byWeek.get(periodStart) ?? new Prisma.Decimal(0)),
  }));
}

import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Project, ProjectStatus } from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';

export type ProjectDataClient = Pick<
  Prisma.TransactionClient,
  'project' | 'expense' | 'transfer'
>;

export interface ProjectAggregate {
  readonly projectId: string;
  readonly expenseTotal: Prisma.Decimal;
  readonly transferTotal: Prisma.Decimal;
  readonly expenseCount: number;
}

@Injectable()
export class ProjectsRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: PrismaClient,
  ) {}

  transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.database.$transaction(operation);
  }

  create(
    data: Prisma.ProjectCreateInput,
    client: ProjectDataClient = this.database,
  ): Promise<Project> {
    return client.project.create({ data });
  }

  update(
    id: string,
    data: Prisma.ProjectUpdateInput,
    client: ProjectDataClient = this.database,
  ): Promise<Project> {
    return client.project.update({ where: { id }, data });
  }

  findById(
    id: string,
    client: ProjectDataClient = this.database,
  ): Promise<Project | null> {
    return client.project.findUnique({ where: { id } });
  }

  list(status: ProjectStatus | undefined): Promise<readonly Project[]> {
    return this.database.project.findMany({
      where: status === undefined ? {} : { status },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  async aggregates(
    projectIds: readonly string[],
  ): Promise<ReadonlyMap<string, ProjectAggregate>> {
    if (projectIds.length === 0) {
      return new Map();
    }

    const [expenses, transfers] = await Promise.all([
      this.database.expense.groupBy({
        by: ['projectId'],
        where: { projectId: { in: [...projectIds] }, deletedAt: null },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.database.transfer.groupBy({
        by: ['projectId'],
        where: { projectId: { in: [...projectIds] }, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const expenseByProject = new Map(
      expenses.map((row) => [row.projectId, row] as const),
    );
    const transferByProject = new Map(
      transfers.map((row) => [row.projectId, row] as const),
    );

    return new Map(
      projectIds.map((projectId) => {
        const expense = expenseByProject.get(projectId);
        const transfer = transferByProject.get(projectId);
        return [
          projectId,
          {
            projectId,
            expenseTotal: expense?._sum.amount ?? new Prisma.Decimal(0),
            transferTotal: transfer?._sum.amount ?? new Prisma.Decimal(0),
            expenseCount: expense?._count.id ?? 0,
          },
        ] as const;
      }),
    );
  }
}

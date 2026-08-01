import { PayeeListQuery } from '@claims-os/domain';
import { Inject, Injectable } from '@nestjs/common';
import {
  Agreement,
  Payee,
  Prisma,
  PrismaClient,
  Project,
} from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';

export type PayeeDataClient = Pick<
  Prisma.TransactionClient,
  'payee' | 'agreement' | 'expense' | 'project' | 'auditEvent'
>;

export interface PayeeProjectRow extends Project {
  readonly agreements: readonly Agreement[];
}

@Injectable()
export class PayeesRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: PrismaClient,
  ) {}

  transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.database.$transaction(operation);
  }

  list(query: PayeeListQuery): Promise<readonly Payee[]> {
    const search =
      query.search === undefined
        ? {}
        : {
            OR: [
              { name: { contains: query.search } },
              { companyName: { contains: query.search } },
              { phone: { contains: query.search } },
              { specialty: { contains: query.search } },
            ],
          };
    return this.database.payee.findMany({
      where: {
        ...(query.status === 'ALL'
          ? {}
          : { isActive: query.status === 'ACTIVE' }),
        ...search,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  findPayee(
    id: string,
    client: PayeeDataClient = this.database,
  ): Promise<Payee | null> {
    return client.payee.findUnique({ where: { id } });
  }

  findProject(
    id: string,
    client: PayeeDataClient = this.database,
  ): Promise<Project | null> {
    return client.project.findUnique({ where: { id } });
  }

  createPayee(
    data: Prisma.PayeeCreateInput,
    client: PayeeDataClient,
  ): Promise<Payee> {
    return client.payee.create({ data });
  }

  updatePayee(
    id: string,
    data: Prisma.PayeeUpdateInput,
    client: PayeeDataClient,
  ): Promise<Payee> {
    return client.payee.update({ where: { id }, data });
  }

  async paidByPayee(
    payeeIds: readonly string[],
    client: PayeeDataClient = this.database,
  ): Promise<ReadonlyMap<string, Prisma.Decimal>> {
    if (payeeIds.length === 0) return new Map();
    const rows = await client.expense.groupBy({
      by: ['payeeId'],
      where: {
        payeeId: { in: [...payeeIds] },
        deletedAt: null,
      },
      _sum: { amount: true },
    });
    return new Map(
      rows.flatMap((row) =>
        row.payeeId === null
          ? []
          : [[row.payeeId, row._sum.amount ?? new Prisma.Decimal(0)] as const],
      ),
    );
  }

  async paidByProject(
    payeeId: string,
    client: PayeeDataClient = this.database,
  ): Promise<ReadonlyMap<string, Prisma.Decimal>> {
    const rows = await client.expense.groupBy({
      by: ['projectId'],
      where: { payeeId, deletedAt: null },
      _sum: { amount: true },
    });
    return new Map(
      rows.map(
        (row) =>
          [row.projectId, row._sum.amount ?? new Prisma.Decimal(0)] as const,
      ),
    );
  }

  qualifyingProjects(payeeId: string): Promise<readonly PayeeProjectRow[]> {
    return this.database.project.findMany({
      where: {
        OR: [
          { agreements: { some: { payeeId } } },
          { expenses: { some: { payeeId, deletedAt: null } } },
        ],
      },
      include: { agreements: { where: { payeeId } } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  findAgreement(
    projectId: string,
    payeeId: string,
    client: PayeeDataClient = this.database,
  ): Promise<Agreement | null> {
    return client.agreement.findUnique({
      where: { projectId_payeeId: { projectId, payeeId } },
    });
  }

  createAgreement(
    data: Prisma.AgreementUncheckedCreateInput,
    client: PayeeDataClient,
  ): Promise<Agreement> {
    return client.agreement.create({ data });
  }

  updateAgreement(
    id: string,
    data: Prisma.AgreementUpdateInput,
    client: PayeeDataClient,
  ): Promise<Agreement> {
    return client.agreement.update({ where: { id }, data });
  }

  async paidForPair(
    projectId: string,
    payeeId: string,
    client: PayeeDataClient = this.database,
  ): Promise<Prisma.Decimal> {
    const result = await client.expense.aggregate({
      where: { projectId, payeeId, deletedAt: null },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  }
}

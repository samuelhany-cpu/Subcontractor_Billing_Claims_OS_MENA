import { ExpenseListQuery } from '@claims-os/domain';
import { Inject, Injectable } from '@nestjs/common';
import {
  Attachment,
  Category,
  Expense,
  Payee,
  Prisma,
  PrismaClient,
  Project,
  Subcategory,
} from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { parseDateOnly } from '../projects/project-mapper';

export type ExpenseDataClient = Pick<
  Prisma.TransactionClient,
  | 'attachment'
  | 'auditEvent'
  | 'category'
  | 'expense'
  | 'payee'
  | 'project'
  | 'subcategory'
>;

export interface ExpandedExpense extends Expense {
  readonly project: Project;
  readonly category: Category | null;
  readonly subcategory: Subcategory | null;
  readonly payee: Payee | null;
  readonly attachments: readonly Attachment[];
}

export interface ExpensePage {
  readonly rows: readonly ExpandedExpense[];
  readonly totalItems: number;
}

const expandedExpense = {
  project: true,
  category: true,
  subcategory: true,
  payee: true,
  attachments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ExpenseInclude;

@Injectable()
export class ExpensesRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: PrismaClient,
  ) {}

  transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.database.$transaction(operation);
  }

  async list(query: ExpenseListQuery): Promise<ExpensePage> {
    const where = this.listWhere(query);
    const direction = query.sort === 'NEWEST' ? 'desc' : 'asc';
    const [rows, totalItems] = await Promise.all([
      this.database.expense.findMany({
        where,
        include: expandedExpense,
        orderBy: [
          { expenseDate: direction },
          { createdAt: direction },
          { id: 'asc' },
        ],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.database.expense.count({ where }),
    ]);
    return { rows, totalItems };
  }

  findExpanded(
    expenseId: string,
    client: ExpenseDataClient = this.database,
  ): Promise<ExpandedExpense | null> {
    return client.expense.findFirst({
      where: { id: expenseId, deletedAt: null },
      include: expandedExpense,
    });
  }

  findExpandedWithDeleted(
    expenseId: string,
    client: ExpenseDataClient = this.database,
  ): Promise<ExpandedExpense | null> {
    return client.expense.findFirst({
      where: { id: expenseId },
      include: expandedExpense,
    });
  }

  findCategory(
    categoryId: string,
    client: ExpenseDataClient,
  ): Promise<Category | null> {
    return client.category.findUnique({ where: { id: categoryId } });
  }

  findSubcategory(
    subcategoryId: string,
    client: ExpenseDataClient,
  ): Promise<Subcategory | null> {
    return client.subcategory.findUnique({ where: { id: subcategoryId } });
  }

  findPayee(payeeId: string, client: ExpenseDataClient): Promise<Payee | null> {
    return client.payee.findUnique({ where: { id: payeeId } });
  }

  create(
    data: Prisma.ExpenseUncheckedCreateInput,
    client: ExpenseDataClient,
  ): Promise<Expense> {
    return client.expense.create({ data });
  }

  update(
    expenseId: string,
    data: Prisma.ExpenseUncheckedUpdateInput,
    client: ExpenseDataClient,
  ): Promise<Expense> {
    return client.expense.update({ where: { id: expenseId }, data });
  }

  attachmentCount(
    expenseId: string,
    client: ExpenseDataClient = this.database,
  ): Promise<number> {
    return client.attachment.count({ where: { expenseId } });
  }

  createAttachment(
    data: Prisma.AttachmentUncheckedCreateInput,
    client: ExpenseDataClient,
  ): Promise<Attachment> {
    return client.attachment.create({ data });
  }

  findAttachment(
    attachmentId: string,
  ): Promise<
    (Attachment & { expense: Expense & { project: Project } }) | null
  > {
    return this.database.attachment.findUnique({
      where: { id: attachmentId },
      include: { expense: { include: { project: true } } },
    });
  }

  private listWhere(query: ExpenseListQuery): Prisma.ExpenseWhereInput {
    const statusCondition =
      query.status === 'ACTIVE'
        ? { deletedAt: null }
        : query.status === 'DELETED'
          ? { deletedAt: { not: null } }
          : {};

    const search =
      query.search === undefined
        ? {}
        : {
            OR: [
              { description: { contains: query.search } },
              { invoiceNumber: { contains: query.search } },
              { notes: { contains: query.search } },
              {
                payee: {
                  is: {
                    OR: [
                      { name: { contains: query.search } },
                      { companyName: { contains: query.search } },
                    ],
                  },
                },
              },
            ],
          };
    return {
      ...statusCondition,
      ...(query.projectId === undefined ? {} : { projectId: query.projectId }),
      ...(query.from === undefined && query.to === undefined
        ? {}
        : {
            expenseDate: {
              ...(query.from === undefined
                ? {}
                : { gte: parseDateOnly(query.from) }),
              ...(query.to === undefined
                ? {}
                : { lte: parseDateOnly(query.to) }),
            },
          }),
      ...(query.categoryId === undefined
        ? {}
        : { categoryId: query.categoryId }),
      ...(query.subcategoryId === undefined
        ? {}
        : { subcategoryId: query.subcategoryId }),
      ...(query.payeeId === undefined ? {} : { payeeId: query.payeeId }),
      ...(query.paymentMethod === undefined
        ? {}
        : { paymentMethod: query.paymentMethod }),
      ...(query.source === undefined ? {} : { source: query.source }),
      ...search,
    };
  }
}

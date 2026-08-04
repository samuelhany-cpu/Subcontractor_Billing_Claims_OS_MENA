import {
  CreateExpenseRequest,
  ExpenseListQuery,
  ExpenseListResponse,
  ExpenseResponse,
  UpdateExpenseRequest,
} from '@claims-os/domain';
import { Injectable } from '@nestjs/common';
import { AuditAction, Expense, Prisma, RecordSource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { parseDateOnly } from '../projects/project-mapper';
import { ProjectStateService } from '../projects/project-state.service';
import {
  categoryInactive,
  categoryNotFound,
  expenseNotFound,
  payeeInactive,
  payeeNotFound,
  subcategoryInactive,
  subcategoryMismatch,
  subcategoryNotFound,
} from './expense-errors';
import {
  ExpenseAmountResult,
  ExpenseAmountService,
} from './expense-amount.service';
import { expenseSnapshot, mapExpense } from './expense-mapper';
import {
  ExpandedExpense,
  ExpenseDataClient,
  ExpensesRepository,
} from './expenses.repository';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expenses: ExpensesRepository,
    private readonly amounts: ExpenseAmountService,
    private readonly projects: ProjectStateService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ExpenseListQuery): Promise<ExpenseListResponse> {
    const page = await this.expenses.list(query);
    return {
      items: page.rows.map(mapExpense),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: page.totalItems,
        totalPages:
          page.totalItems === 0
            ? 0
            : Math.ceil(page.totalItems / query.pageSize),
      },
    };
  }

  async get(expenseId: string): Promise<ExpenseResponse> {
    return mapExpense(await this.requireExpense(expenseId));
  }

  create(
    input: CreateExpenseRequest,
    correlationId?: string,
  ): Promise<ExpenseResponse> {
    return this.expenses.transaction(async (transaction) => {
      await this.projects.assertAcceptsWrites(input.projectId, transaction);
      await this.validateClassification(
        input.categoryId,
        input.subcategoryId ?? null,
        true,
        true,
        transaction,
      );
      await this.validatePayee(input.payeeId ?? null, true, transaction);
      const amount = this.amounts.create(input);
      const created = await this.expenses.create(
        {
          projectId: input.projectId,
          expenseDate: parseDateOnly(input.expenseDate),
          description: input.description,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId ?? null,
          payeeId: input.payeeId ?? null,
          invoiceNumber: input.invoiceNumber ?? null,
          quantity: amount.quantity,
          unit: input.unit ?? null,
          unitPrice: amount.unitPrice,
          amount: amount.amount,
          paymentMethod: input.paymentMethod ?? null,
          notes: input.notes ?? null,
          source: RecordSource.WEB,
        },
        transaction,
      );
      await this.audit.append(
        {
          action: AuditAction.CREATE,
          entityType: 'Expense',
          entityId: created.id,
          source: RecordSource.WEB,
          after: expenseSnapshot('create', created),
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        transaction,
      );
      return mapExpense(await this.requireExpense(created.id, transaction));
    });
  }

  update(
    expenseId: string,
    input: UpdateExpenseRequest,
    correlationId?: string,
  ): Promise<ExpenseResponse> {
    return this.expenses.transaction(async (transaction) => {
      const current = await this.requireExpense(expenseId, transaction);
      await this.projects.assertAcceptsWrites(current.projectId, transaction);

      const categoryId = input.categoryId ?? current.categoryId;
      const subcategoryId =
        input.subcategoryId === undefined
          ? current.subcategoryId
          : input.subcategoryId;
      const categoryChanged =
        input.categoryId !== undefined &&
        input.categoryId !== current.categoryId;
      const subcategoryChanged =
        input.subcategoryId !== undefined &&
        input.subcategoryId !== current.subcategoryId;
      await this.validateClassification(
        categoryId,
        subcategoryId,
        categoryChanged,
        subcategoryChanged || categoryChanged,
        transaction,
      );

      const payeeId =
        input.payeeId === undefined ? current.payeeId : input.payeeId;
      await this.validatePayee(
        payeeId,
        input.payeeId !== undefined && input.payeeId !== current.payeeId,
        transaction,
      );

      const financialChanged =
        input.quantity !== undefined ||
        input.unitPrice !== undefined ||
        input.amount !== undefined;
      const amount = financialChanged
        ? this.amounts.update(current, input)
        : {
            amount: current.amount,
            quantity: current.quantity,
            unitPrice: current.unitPrice,
          };
      const desired = this.desiredState(
        current,
        input,
        categoryId,
        subcategoryId,
        payeeId,
        amount,
      );
      if (this.isSame(current, desired)) {
        return mapExpense(current);
      }

      const updated = await this.expenses.update(
        expenseId,
        desired,
        transaction,
      );
      await this.audit.append(
        {
          action: AuditAction.UPDATE,
          entityType: 'Expense',
          entityId: expenseId,
          source: RecordSource.WEB,
          before: expenseSnapshot('update', current),
          after: expenseSnapshot('update', updated),
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        transaction,
      );
      return mapExpense(await this.requireExpense(expenseId, transaction));
    });
  }

  private async validateClassification(
    categoryId: string | null,
    subcategoryId: string | null,
    categoryAssignmentChanged: boolean,
    subcategoryAssignmentChanged: boolean,
    client: ExpenseDataClient,
  ): Promise<void> {
    if (categoryId === null) {
      if (subcategoryId !== null) throw subcategoryMismatch();
      return;
    }
    const category = await this.expenses.findCategory(categoryId, client);
    if (category === null) throw categoryNotFound();
    if (
      (categoryAssignmentChanged || subcategoryAssignmentChanged) &&
      !category.isActive
    ) {
      throw categoryInactive();
    }
    if (subcategoryId === null) return;
    const subcategory = await this.expenses.findSubcategory(
      subcategoryId,
      client,
    );
    if (subcategory === null) throw subcategoryNotFound();
    if (subcategory.categoryId !== categoryId) throw subcategoryMismatch();
    if (subcategoryAssignmentChanged && !subcategory.isActive) {
      throw subcategoryInactive();
    }
  }

  private async validatePayee(
    payeeId: string | null,
    assignmentChanged: boolean,
    client: ExpenseDataClient,
  ): Promise<void> {
    if (payeeId === null) return;
    const payee = await this.expenses.findPayee(payeeId, client);
    if (payee === null) throw payeeNotFound();
    if (assignmentChanged && !payee.isActive) throw payeeInactive();
  }

  private desiredState(
    current: Expense,
    input: UpdateExpenseRequest,
    categoryId: string | null,
    subcategoryId: string | null,
    payeeId: string | null,
    amount: ExpenseAmountResult,
  ): Prisma.ExpenseUncheckedUpdateInput {
    return {
      expenseDate:
        input.expenseDate === undefined
          ? current.expenseDate
          : parseDateOnly(input.expenseDate),
      description: input.description ?? current.description,
      categoryId,
      subcategoryId,
      payeeId,
      invoiceNumber:
        input.invoiceNumber === undefined
          ? current.invoiceNumber
          : input.invoiceNumber,
      quantity: amount.quantity,
      unit: input.unit === undefined ? current.unit : input.unit,
      unitPrice: amount.unitPrice,
      amount: amount.amount,
      paymentMethod:
        input.paymentMethod === undefined
          ? current.paymentMethod
          : input.paymentMethod,
      notes: input.notes === undefined ? current.notes : input.notes,
    };
  }

  private isSame(
    current: Expense,
    desired: Prisma.ExpenseUncheckedUpdateInput,
  ): boolean {
    const quantity = desired.quantity as Prisma.Decimal | null;
    const unitPrice = desired.unitPrice as Prisma.Decimal | null;
    return (
      current.expenseDate.getTime() ===
        (desired.expenseDate as Date).getTime() &&
      current.description === desired.description &&
      current.categoryId === desired.categoryId &&
      current.subcategoryId === desired.subcategoryId &&
      current.payeeId === desired.payeeId &&
      current.invoiceNumber === desired.invoiceNumber &&
      this.sameNullableDecimal(current.quantity, quantity) &&
      current.unit === desired.unit &&
      this.sameNullableDecimal(current.unitPrice, unitPrice) &&
      current.amount.equals(desired.amount as Prisma.Decimal) &&
      current.paymentMethod === desired.paymentMethod &&
      current.notes === desired.notes
    );
  }

  private sameNullableDecimal(
    left: Prisma.Decimal | null,
    right: Prisma.Decimal | null,
  ): boolean {
    return left === null || right === null
      ? left === right
      : left.equals(right);
  }

  private async requireExpense(
    expenseId: string,
    client?: ExpenseDataClient,
  ): Promise<ExpandedExpense> {
    const expense = await this.expenses.findExpanded(expenseId, client);
    if (expense === null) throw expenseNotFound();
    return expense;
  }
}

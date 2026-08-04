import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  parseMoney,
  parseQuantity,
  parseUnitPrice,
  roundMoney,
} from '../shared/decimal/decimal';
import { invalidExpenseAmount } from './expense-errors';

export interface ExpenseAmountInput {
  readonly amount?: string | undefined;
  readonly quantity?: string | undefined;
  readonly unitPrice?: string | undefined;
}

export interface ExistingExpenseAmount {
  readonly amount: Prisma.Decimal;
  readonly quantity: Prisma.Decimal | null;
  readonly unitPrice: Prisma.Decimal | null;
}

export interface ExpenseAmountResult {
  readonly amount: Prisma.Decimal;
  readonly quantity: Prisma.Decimal | null;
  readonly unitPrice: Prisma.Decimal | null;
}

export interface ExpenseAmountUpdate {
  readonly amount?: string | null | undefined;
  readonly quantity?: string | null | undefined;
  readonly unitPrice?: string | null | undefined;
}

@Injectable()
export class ExpenseAmountService {
  create(input: ExpenseAmountInput): ExpenseAmountResult {
    return this.resolve(
      input.quantity === undefined ? null : this.quantity(input.quantity),
      input.unitPrice === undefined ? null : this.unitPrice(input.unitPrice),
      input.amount === undefined ? undefined : this.money(input.amount),
    );
  }

  update(
    current: ExistingExpenseAmount,
    input: ExpenseAmountUpdate,
  ): ExpenseAmountResult {
    const quantity =
      input.quantity === undefined
        ? current.quantity
        : input.quantity === null
          ? null
          : this.quantity(input.quantity);
    const unitPrice =
      input.unitPrice === undefined
        ? current.unitPrice
        : input.unitPrice === null
          ? null
          : this.unitPrice(input.unitPrice);
    const amount =
      input.amount === undefined
        ? undefined
        : input.amount === null
          ? null
          : this.money(input.amount);

    return this.resolve(
      quantity,
      unitPrice,
      amount === undefined ? current.amount : amount,
      input.amount !== undefined,
    );
  }

  private resolve(
    quantity: Prisma.Decimal | null,
    unitPrice: Prisma.Decimal | null,
    manualAmount: Prisma.Decimal | null | undefined,
    amountWasSupplied = manualAmount !== undefined,
  ): ExpenseAmountResult {
    if (quantity !== null && unitPrice !== null) {
      if (amountWasSupplied && manualAmount !== null) {
        throw invalidExpenseAmount(
          'Do not supply a manual amount with quantity and unit price.',
        );
      }
      let amount: Prisma.Decimal;
      try {
        amount = parseMoney(roundMoney(quantity.mul(unitPrice)).toFixed(2));
      } catch {
        throw invalidExpenseAmount(
          'Calculated amount exceeds the supported monetary precision.',
        );
      }
      if (amount.lte(0)) {
        throw invalidExpenseAmount('Calculated amount must be positive.');
      }
      return { amount, quantity, unitPrice };
    }

    if (manualAmount === undefined || manualAmount === null) {
      throw invalidExpenseAmount(
        'A manual amount is required when quantity or unit price is missing.',
      );
    }
    if (manualAmount.lte(0)) {
      throw invalidExpenseAmount('Manual amount must be positive.');
    }
    return { amount: manualAmount, quantity, unitPrice };
  }

  private money(value: string): Prisma.Decimal {
    try {
      return parseMoney(value);
    } catch {
      throw invalidExpenseAmount('Manual amount is invalid.');
    }
  }

  private quantity(value: string): Prisma.Decimal {
    try {
      const parsed = parseQuantity(value);
      if (parsed.lte(0)) throw new Error('non-positive');
      return parsed;
    } catch {
      throw invalidExpenseAmount('Quantity must be a positive exact decimal.');
    }
  }

  private unitPrice(value: string): Prisma.Decimal {
    try {
      const parsed = parseUnitPrice(value);
      if (parsed.lte(0)) throw new Error('non-positive');
      return parsed;
    } catch {
      throw invalidExpenseAmount(
        'Unit price must be a positive exact decimal.',
      );
    }
  }
}

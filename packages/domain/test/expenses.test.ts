import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CreateExpenseSchema,
  ExpenseListQuerySchema,
  UpdateExpenseSchema,
} from '../src/expenses.js';

const ids = {
  projectId: '11111111-1111-4111-8111-111111111111',
  categoryId: '22222222-2222-4222-8222-222222222222',
};

test('manual Expense input requires exact positive amount and normalizes text', () => {
  const parsed = CreateExpenseSchema.parse({
    ...ids,
    expenseDate: '2026-08-01',
    description: '  شراء خامات  ',
    amount: '100.00',
    notes: '   ',
  });
  assert.equal(parsed.description, 'شراء خامات');
  assert.equal(parsed.notes, null);
  assert.equal(
    CreateExpenseSchema.safeParse({ ...parsed, amount: '0.00' }).success,
    false,
  );
  assert.equal(
    CreateExpenseSchema.safeParse({ ...parsed, amount: '-1.00' }).success,
    false,
  );
});

test('calculated Expense input rejects a client-supplied amount', () => {
  const calculated = {
    ...ids,
    expenseDate: '2026-08-01',
    description: 'أسمنت',
    quantity: '3.0000',
    unitPrice: '12150.0000',
  };
  assert.equal(CreateExpenseSchema.safeParse(calculated).success, true);
  assert.equal(
    CreateExpenseSchema.safeParse({ ...calculated, amount: '36450.00' })
      .success,
    false,
  );
});

test('manual mode permits one informational calculation input only', () => {
  const base = {
    ...ids,
    expenseDate: '2026-08-01',
    description: 'نقل',
    amount: '100.00',
  };
  assert.equal(
    CreateExpenseSchema.safeParse({ ...base, quantity: '2.0000' }).success,
    true,
  );
  assert.equal(
    CreateExpenseSchema.safeParse({ ...base, unitPrice: '50.0000' }).success,
    true,
  );
});

test('Expense update is strict, non-empty, and permits optional clears', () => {
  assert.equal(UpdateExpenseSchema.safeParse({}).success, false);
  assert.deepEqual(
    UpdateExpenseSchema.parse({
      subcategoryId: null,
      payeeId: null,
      invoiceNumber: '',
    }),
    { subcategoryId: null, payeeId: null, invoiceNumber: null },
  );
  assert.equal(
    UpdateExpenseSchema.safeParse({
      quantity: '1.0000',
      unitPrice: '1.0000',
      amount: '1.00',
    }).success,
    false,
  );
});

test('Expense list applies approved defaults and trims empty search', () => {
  assert.deepEqual(ExpenseListQuerySchema.parse({}), {
    sort: 'NEWEST',
    status: 'ACTIVE',
    page: 1,
    pageSize: 25,
    paymentMethod: undefined,
    search: undefined,
  });
  assert.equal(
    ExpenseListQuerySchema.parse({ status: 'DELETED' }).status,
    'DELETED',
  );
  assert.equal(ExpenseListQuerySchema.parse({ status: 'ALL' }).status, 'ALL');

  assert.equal(
    ExpenseListQuerySchema.safeParse({ pageSize: '101' }).success,
    false,
  );
  assert.equal(
    ExpenseListQuerySchema.safeParse({
      from: '2026-08-02',
      to: '2026-08-01',
    }).success,
    false,
  );
});

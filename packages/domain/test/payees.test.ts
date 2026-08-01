import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AgreementInputSchema,
  CreatePayeeSchema,
  PayeeListQuerySchema,
  UpdatePayeeSchema,
} from '../src/payees.js';

test('payee contracts validate types, trim fields, and normalize optional text', () => {
  assert.deepEqual(
    CreatePayeeSchema.parse({
      name: '  مورد النور  ',
      type: 'SUPPLIER',
      phone: '   ',
    }),
    {
      name: 'مورد النور',
      type: 'SUPPLIER',
      phone: null,
    },
  );
  assert.equal(
    CreatePayeeSchema.safeParse({ name: ' ', type: 'WORKER' }).success,
    false,
  );
  assert.equal(
    CreatePayeeSchema.safeParse({ name: 'عامل', type: 'INVALID' }).success,
    false,
  );
});
test('payee list defaults active and trims search', () => {
  assert.deepEqual(PayeeListQuerySchema.parse({}), {
    status: 'ACTIVE',
    search: undefined,
  });
  assert.deepEqual(
    PayeeListQuerySchema.parse({ status: 'ALL', search: '  أحمد  ' }),
    { status: 'ALL', search: 'أحمد' },
  );
});
test('payee update requires a field and permits clearing optional fields', () => {
  assert.equal(UpdatePayeeSchema.safeParse({}).success, false);
  assert.deepEqual(UpdatePayeeSchema.parse({ companyName: '' }), {
    companyName: null,
  });
});
test('agreement total is an exact positive decimal string', () => {
  assert.equal(
    AgreementInputSchema.safeParse({ totalAmount: '0.00' }).success,
    false,
  );
  assert.equal(
    AgreementInputSchema.safeParse({ totalAmount: '-1.00' }).success,
    false,
  );
  assert.equal(
    AgreementInputSchema.safeParse({ totalAmount: 12.5 }).success,
    false,
  );
  assert.deepEqual(
    AgreementInputSchema.parse({ totalAmount: '36450.00', notes: '' }),
    { totalAmount: '36450.00', notes: null },
  );
});

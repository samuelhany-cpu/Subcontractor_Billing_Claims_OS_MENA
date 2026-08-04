import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ExpenseAmountService } from './expense-amount.service';

describe('ExpenseAmountService', () => {
  const service = new ExpenseAmountService();

  it('preserves a positive manual amount exactly', () => {
    expect(service.create({ amount: '0.10' }).amount.toFixed(2)).toBe('0.10');
  });

  it.each([{ amount: '0.00' }, { amount: '-1.00' }, {}])(
    'rejects invalid manual input %#',
    (input) => {
      expect(() => service.create(input)).toThrow(HttpException);
    },
  );

  it('multiplies four-place quantity and unit price exactly', () => {
    const result = service.create({
      quantity: '3.0000',
      unitPrice: '12150.0000',
    });
    expect(result.amount.toFixed(2)).toBe('36450.00');
    expect(result.quantity?.toFixed(4)).toBe('3.0000');
    expect(result.unitPrice?.toFixed(4)).toBe('12150.0000');
  });

  it('uses ROUND_HALF_UP at the monetary boundary', () => {
    expect(
      service
        .create({ quantity: '1.0050', unitPrice: '1.0000' })
        .amount.toFixed(2),
    ).toBe('1.01');
  });

  it('rejects a redundant manual amount in calculated mode', () => {
    expect(() =>
      service.create({
        quantity: '2.0000',
        unitPrice: '5.0000',
        amount: '10.00',
      }),
    ).toThrow(HttpException);
  });

  it('supports switching between manual and calculated modes', () => {
    const current = {
      amount: new Prisma.Decimal('20.00'),
      quantity: null,
      unitPrice: null,
    };
    const calculated = service.update(current, {
      quantity: '2.0000',
      unitPrice: '12.5000',
      amount: null,
    });
    expect(calculated.amount.toFixed(2)).toBe('25.00');
    const manual = service.update(calculated, {
      unitPrice: null,
      amount: '30.00',
    });
    expect(manual.amount.toFixed(2)).toBe('30.00');
    expect(manual.quantity?.toFixed(4)).toBe('2.0000');
    expect(manual.unitPrice).toBeNull();
  });

  it('does not use binary floating point for decimal addition', () => {
    const exact = new Prisma.Decimal('0.10').plus(new Prisma.Decimal('0.20'));
    expect(exact.toFixed(2)).toBe('0.30');
  });
});

import { describe, expect, it } from 'vitest';
import { calculateExpenseAmount } from './expense-form-state';

describe('calculateExpenseAmount', () => {
  it('calculates exact four-decimal inputs without binary floating point', () => {
    expect(calculateExpenseAmount('3.0000', '12150.0000')).toBe('36450.00');
  });

  it('uses ROUND_HALF_UP at the monetary boundary', () => {
    expect(calculateExpenseAmount('1.0000', '1.0050')).toBe('1.01');
  });

  it('requires two positive valid calculation inputs', () => {
    expect(calculateExpenseAmount('1', '')).toBeNull();
    expect(calculateExpenseAmount('0', '10')).toBeNull();
    expect(calculateExpenseAmount('1', '-10')).toBeNull();
    expect(calculateExpenseAmount('1.00001', '10')).toBeNull();
  });
});

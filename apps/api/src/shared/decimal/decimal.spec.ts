import { Prisma } from '@prisma/client';
import {
  compareDecimals,
  MONEY_ROUNDING_MODE,
  parseDecimalString,
  parseMoney,
  parseQuantity,
  parseUnitPrice,
  roundMoney,
  serializeDecimal,
  serializeMoney,
  serializeQuantity,
} from './decimal';

describe('decimal foundation', () => {
  it('adds 0.10 and 0.20 exactly', () => {
    const result = parseMoney('0.10').plus(parseMoney('0.20'));

    expect(serializeMoney(result)).toBe('0.30');
  });

  it('multiplies quantity by unit price exactly without using number', () => {
    const result = parseQuantity('3.0000').times(parseUnitPrice('12150.0000'));

    expect(serializeMoney(roundMoney(result))).toBe('36450.00');
  });

  it('subtracts exact monetary values', () => {
    const result = parseMoney('19600.00').minus(parseMoney('9600.00'));

    expect(serializeMoney(result)).toBe('10000.00');
  });

  it('preserves quantity and unit-price scale when serialized', () => {
    expect(serializeQuantity(parseQuantity('1.2345'))).toBe('1.2345');
    expect(serializeQuantity(parseUnitPrice('12150.0000'))).toBe('12150.0000');
  });

  it('serializes API values as strings', () => {
    const value = parseDecimalString('521310.00');

    expect(typeof serializeDecimal(value)).toBe('string');
    expect(serializeMoney(value)).toBe('521310.00');
  });

  it('compares decimal values exactly', () => {
    expect(compareDecimals('0.10', '0.1')).toBe(0);
    expect(compareDecimals('0.20', '0.30')).toBe(-1);
    expect(compareDecimals('10000.00', '9600.00')).toBe(1);
  });

  it('uses explicit half-up monetary rounding', () => {
    expect(MONEY_ROUNDING_MODE).toBe(Prisma.Decimal.ROUND_HALF_UP);
    expect(serializeMoney(roundMoney('1.005'))).toBe('1.01');
  });

  it('rejects exponent, whitespace, and JavaScript number input paths', () => {
    expect(() => parseMoney('1e2')).toThrow(TypeError);
    expect(() => parseMoney(' 1.00')).toThrow(TypeError);
    expect(() => parseMoney(1 as unknown as string)).toThrow(TypeError);
  });

  it('rejects excess storage scale or precision', () => {
    expect(() => parseMoney('1.001')).toThrow(RangeError);
    expect(() => parseQuantity('1.00001')).toThrow(RangeError);
    expect(() => parseMoney('10000000000000000.00')).toThrow(RangeError);
  });

  it('allows negative exact values for calculations that may be negative', () => {
    expect(serializeMoney(parseMoney('-100.00'))).toBe('-100.00');
  });
});

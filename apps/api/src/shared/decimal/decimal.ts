import { Prisma } from '@prisma/client';

export type ExactDecimalInput = string | Prisma.Decimal;

export const MONEY_SCALE = 2;
export const QUANTITY_SCALE = 4;
export const MONEY_PRECISION = 18;
export const QUANTITY_PRECISION = 18;
export const MONEY_ROUNDING_MODE = Prisma.Decimal.ROUND_HALF_UP;

const DECIMAL_STRING_PATTERN = /^-?\d+(?:\.\d+)?$/;

function parseExact(value: ExactDecimalInput): Prisma.Decimal {
  if (typeof value === 'string') {
    if (!DECIMAL_STRING_PATTERN.test(value)) {
      throw new TypeError('Decimal values must be plain validated strings');
    }
    return new Prisma.Decimal(value);
  }

  if (!Prisma.Decimal.isDecimal(value)) {
    throw new TypeError('Decimal values must not be JavaScript numbers');
  }

  return new Prisma.Decimal(value);
}

function assertFits(
  value: Prisma.Decimal,
  precision: number,
  scale: number,
): Prisma.Decimal {
  if (value.decimalPlaces() > scale) {
    throw new RangeError(`Decimal value exceeds scale ${scale}`);
  }

  const fixed = value.abs().toFixed(scale);
  const integerPart = fixed.split('.')[0] ?? '0';
  const significantIntegerDigits = integerPart.replace(/^0+/, '').length;

  if (significantIntegerDigits > precision - scale) {
    throw new RangeError(`Decimal value exceeds precision ${precision}`);
  }

  return value;
}

export function parseDecimalString(value: string): Prisma.Decimal {
  return parseExact(value);
}

export function parseMoney(value: string): Prisma.Decimal {
  return assertFits(parseExact(value), MONEY_PRECISION, MONEY_SCALE);
}

export function parseQuantity(value: string): Prisma.Decimal {
  return assertFits(parseExact(value), QUANTITY_PRECISION, QUANTITY_SCALE);
}

export function parseUnitPrice(value: string): Prisma.Decimal {
  return assertFits(parseExact(value), QUANTITY_PRECISION, QUANTITY_SCALE);
}

export function serializeDecimal(value: Prisma.Decimal): string {
  return value.toString();
}

export function serializeMoney(value: Prisma.Decimal): string {
  return value.toFixed(MONEY_SCALE);
}

export function serializeQuantity(value: Prisma.Decimal): string {
  return value.toFixed(QUANTITY_SCALE);
}

export function compareDecimals(
  left: ExactDecimalInput,
  right: ExactDecimalInput,
): -1 | 0 | 1 {
  const comparison = parseExact(left).comparedTo(parseExact(right));
  return comparison < 0 ? -1 : comparison > 0 ? 1 : 0;
}

export function roundMoney(value: ExactDecimalInput): Prisma.Decimal {
  return parseExact(value).toDecimalPlaces(MONEY_SCALE, MONEY_ROUNDING_MODE);
}

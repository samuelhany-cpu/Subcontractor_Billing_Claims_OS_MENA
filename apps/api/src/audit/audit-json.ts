import { Prisma } from '@prisma/client';
import { REDACTED_VALUE } from '../config/api-config';

export type AuditSnapshot = Readonly<Record<string, unknown>>;

const sensitiveKeyPattern =
  /authorization|cookie|password|passphrase|token|api[_-]?key|access[_-]?key|secret|credential|database[_-]?url|redis[_-]?url|signed[_-]?url/i;
const financialKeyPattern =
  /^(?:amount|openingBalance|balance|unitPrice|price|quantity|totalAmount|paidAmount|remainingAmount|paid|remaining)$/i;

type AuditJsonValue = Prisma.InputJsonValue | null;

function serializeValue(
  value: unknown,
  key: string,
  seen: WeakSet<object>,
): AuditJsonValue {
  if (sensitiveKeyPattern.test(key)) {
    return REDACTED_VALUE;
  }

  if (Prisma.Decimal.isDecimal(value)) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Audit JSON cannot contain non-finite numbers');
    }
    if (financialKeyPattern.test(key)) {
      throw new TypeError(
        'Financial audit values must be Decimal instances or strings',
      );
    }
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'undefined') {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, key, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      throw new TypeError('Audit JSON cannot contain circular references');
    }

    seen.add(value);
    const result: Record<string, AuditJsonValue> = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      result[nestedKey] = serializeValue(nestedValue, nestedKey, seen);
    }
    seen.delete(value);
    return result;
  }

  throw new TypeError('Audit JSON contains an unsupported value');
}

export function serializeAuditSnapshot(
  snapshot: AuditSnapshot,
): Prisma.InputJsonObject {
  return serializeValue(
    snapshot,
    '',
    new WeakSet<object>(),
  ) as Prisma.InputJsonObject;
}

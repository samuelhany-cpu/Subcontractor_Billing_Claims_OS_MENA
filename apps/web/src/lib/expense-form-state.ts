export interface ExpenseFormState {
  readonly error: string | null;
  readonly success: string | null;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export const emptyExpenseFormState: ExpenseFormState = {
  error: null,
  success: null,
  fieldErrors: {},
};

function scaledFour(value: string): bigint | null {
  if (!/^(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/.test(value)) return null;
  const [integer = '0', fraction = ''] = value.split('.');
  const result =
    BigInt(integer) * BigInt(10_000) +
    BigInt(fraction.padEnd(4, '0').slice(0, 4));
  return result > BigInt(0) ? result : null;
}

export function calculateExpenseAmount(
  quantity: string,
  unitPrice: string,
): string | null {
  const quantityValue = scaledFour(quantity);
  const priceValue = scaledFour(unitPrice);
  if (quantityValue === null || priceValue === null) return null;
  const product = quantityValue * priceValue;
  const scaleToCents = BigInt(1_000_000);
  const wholeCents = product / scaleToCents;
  const remainder = product % scaleToCents;
  const rounded =
    remainder >= BigInt(500_000) ? wholeCents + BigInt(1) : wholeCents;
  return `${rounded / BigInt(100)}.${(rounded % BigInt(100))
    .toString()
    .padStart(2, '0')}`;
}

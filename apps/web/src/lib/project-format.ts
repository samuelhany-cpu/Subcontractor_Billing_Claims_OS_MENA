export function formatMoney(value: string): string {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integer = '0', fraction = '00'] = unsigned.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return `${negative ? '−' : ''}${grouped}.${fraction.padEnd(2, '0')} ج.م`;
}

export function formatDate(value: string | null): string {
  if (value === null) {
    return 'بدون تاريخ';
  }
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function moneyCents(value: string): bigint {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integer = '0', fraction = ''] = unsigned.split('.');
  const cents =
    BigInt(integer) * BigInt(100) + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  return negative ? -cents : cents;
}

export function moneyFromCents(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  return `${negative ? '-' : ''}${absolute / BigInt(100)}.${(
    absolute % BigInt(100)
  )
    .toString()
    .padStart(2, '0')}`;
}

export function subtractMoney(left: string, right: string): string {
  return moneyFromCents(moneyCents(left) - moneyCents(right));
}

export function overpaidMoney(total: string, paid: string): string {
  const difference = moneyCents(paid) - moneyCents(total);
  return moneyFromCents(difference > BigInt(0) ? difference : BigInt(0));
}

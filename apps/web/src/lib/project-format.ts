export function formatMoney(value: string): string {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [integer = '0', fraction = '00'] = unsigned.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return `${negative ? '−' : ''}${grouped}.${fraction.padEnd(2, '0')} ج.م`;
}

export function formatDate(value: string | null): string {
  if (value === null) {
    return 'غير محدد';
  }
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

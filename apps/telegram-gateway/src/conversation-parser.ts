export type TelegramIntent =
  | 'ADD_EXPENSE'
  | 'ADD_TRANSFER'
  | 'QUERY_BALANCE'
  | 'START'
  | 'HELP'
  | 'UNKNOWN';

export type ParsedTelegramMessage = {
  readonly intent: TelegramIntent;
  readonly amount?: string;
  readonly expenseDate?: string;
  readonly description?: string;
};

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

function latinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) =>
    String(arabicDigits.indexOf(digit)),
  );
}

function cairoDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`;
}

function normalizedMoney(text: string): string | undefined {
  const match = latinDigits(text).match(
    /(?:^|\s)(\d{1,16}(?:[.,]\d{1,2})?)(?:\s*)(?:جنيه|جنية|egp|£)?(?:\s|$)/iu,
  );
  if (match === null) return undefined;
  const captured = match[1];
  if (captured === undefined) return undefined;
  const amount = captured.replace(',', '.');
  if (!/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(amount)) return undefined;
  return /[1-9]/.test(amount) ? amount : undefined;
}

/** Deterministic, deliberately conservative Arabic command recognition. */
export function parseTelegramMessage(
  message: string,
  now = new Date(),
): ParsedTelegramMessage {
  const text = message.trim();
  const normalized = latinDigits(text).toLocaleLowerCase('ar-EG');
  if (normalized === '/start') return { intent: 'START' };
  if (normalized === '/help') return { intent: 'HELP' };
  if (
    normalized === '/balance' ||
    normalized.includes('الرصيد') ||
    normalized.includes('فاضل كام')
  )
    return { intent: 'QUERY_BALANCE' };

  const amount = normalizedMoney(text);
  const today = /(?:النهاردة|النهارده|اليوم|today)/iu.test(normalized);
  if (/^\/transfer\b|(?:استلمت|تحويل وارد|تحويل)/iu.test(normalized))
    return {
      intent: 'ADD_TRANSFER',
      ...(amount === undefined ? {} : { amount }),
      ...(today ? { expenseDate: cairoDate(now) } : {}),
    };
  if (/^\/expense\b|(?:دفعت|مصروف|اشتريت)/iu.test(normalized))
    return {
      intent: 'ADD_EXPENSE',
      ...(amount === undefined ? {} : { amount }),
      ...(today ? { expenseDate: cairoDate(now) } : {}),
      description: text,
    };
  return { intent: 'UNKNOWN' };
}

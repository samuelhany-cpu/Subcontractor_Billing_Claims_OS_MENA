import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTelegramMessage } from './conversation-parser.js';

const cairoMorning = new Date('2026-11-01T08:00:00.000Z');

void test('recognizes safe Arabic expense fields without inventing category or project', () => {
  assert.deepEqual(
    parseTelegramMessage('دفعت ٢٥٠٠ جنيه للكهربائي النهاردة', cairoMorning),
    {
      intent: 'ADD_EXPENSE',
      amount: '2500',
      expenseDate: '2026-11-01',
      description: 'دفعت ٢٥٠٠ جنيه للكهربائي النهاردة',
    },
  );
});

void test('recognizes transfer and balance intents with exact money strings', () => {
  assert.deepEqual(
    parseTelegramMessage('استلمت تحويل 100000 جنيه النهاردة', cairoMorning),
    { intent: 'ADD_TRANSFER', amount: '100000', expenseDate: '2026-11-01' },
  );
  assert.deepEqual(parseTelegramMessage('فاضل كام؟'), {
    intent: 'QUERY_BALANCE',
  });
});

void test('does not treat ambiguous text or zero as a financial request', () => {
  assert.deepEqual(parseTelegramMessage('دفعت صفر جنيه'), {
    intent: 'ADD_EXPENSE',
    description: 'دفعت صفر جنيه',
  });
  assert.deepEqual(parseTelegramMessage('ممكن تساعدني؟'), {
    intent: 'UNKNOWN',
  });
});

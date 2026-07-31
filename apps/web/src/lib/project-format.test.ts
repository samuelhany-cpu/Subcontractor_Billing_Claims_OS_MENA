import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from './project-format';

describe('Arabic project formatting', () => {
  it('groups decimal strings without converting them to numbers', () => {
    expect(formatMoney('36450.00')).toBe('36٬450.00 ج.م');
    expect(formatMoney('-10000.20')).toBe('−10٬000.20 ج.م');
  });

  it('displays date-only values as DD/MM/YYYY without parsing a timezone', () => {
    expect(formatDate('2026-08-01')).toBe('01/08/2026');
    expect(formatDate(null)).toBe('غير محدد');
  });
});

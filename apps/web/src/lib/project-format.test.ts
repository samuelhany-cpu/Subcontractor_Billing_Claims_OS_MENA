import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatMoney,
  overpaidMoney,
  subtractMoney,
} from './project-format';

describe('Arabic project formatting', () => {
  it('groups decimal strings without converting them to numbers', () => {
    expect(formatMoney('36450.00')).toBe('36٬450.00 ج.م');
    expect(formatMoney('-10000.20')).toBe('−10٬000.20 ج.م');
  });

  it('displays date-only values as DD/MM/YYYY without parsing a timezone', () => {
    expect(formatDate('2026-08-01')).toBe('01/08/2026');
    expect(formatDate(null)).toBe('غير محدد');
  });

  it('derives exact Agreement remaining and overpayment in integer cents', () => {
    expect(subtractMoney('19600.00', '9600.00')).toBe('10000.00');
    expect(subtractMoney('0.20', '0.30')).toBe('-0.10');
    expect(overpaidMoney('100.00', '120.25')).toBe('20.25');
    expect(overpaidMoney('120.25', '100.00')).toBe('0.00');
  });
});

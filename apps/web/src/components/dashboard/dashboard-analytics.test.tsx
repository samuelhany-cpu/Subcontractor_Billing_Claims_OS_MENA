import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardAnalytics } from './dashboard-analytics';

describe('DashboardAnalytics', () => {
  it('renders dashboard summaries, Arabic empty states, and exact currency values', () => {
    render(
      <DashboardAnalytics
        categoryTotals={[
          {
            categoryId: '11111111-1111-4111-8111-111111111111',
            categoryName: 'خامات',
            amount: '1250.50',
            expenseCount: 2,
          },
        ]}
        weeklyExpenses={[{ periodStart: '2026-10-26', amount: '1250.50' }]}
        topPayees={[
          {
            payeeId: '22222222-2222-4222-8222-222222222222',
            payeeName: 'مورد اختبار',
            amount: '1250.50',
          },
        ]}
        recentExpenses={[
          {
            id: '33333333-3333-4333-8333-333333333333',
            expenseDate: '2026-10-31',
            description: 'أسمنت',
            amount: '1250.50',
            categoryName: 'خامات',
            payeeName: 'مورد اختبار',
          },
        ]}
        recentTransfers={[]}
      />,
    );

    expect(screen.getByText('المصروفات خلال آخر 12 أسبوعًا')).toBeTruthy();
    expect(screen.getByText('خامات')).toBeTruthy();
    expect(screen.getByText('مورد اختبار')).toBeTruthy();
    expect(screen.getByText('أسمنت')).toBeTruthy();
    expect(screen.getByText('لم تُسجل تحويلات واردة بعد.')).toBeTruthy();
    expect(screen.getAllByText('1٬250.50 ج.م')).toHaveLength(4);
  });
});

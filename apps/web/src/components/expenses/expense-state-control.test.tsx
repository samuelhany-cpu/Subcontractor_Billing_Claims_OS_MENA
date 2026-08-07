import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseStateControl } from './expense-state-control';

vi.mock('@/app/expenses/actions', () => ({
  deleteExpenseAction: vi.fn(),
  restoreExpenseAction: vi.fn(),
}));

describe('ExpenseStateControl', () => {
  it('renders active state delete button and toggles confirmation step', () => {
    render(
      <ExpenseStateControl
        archived={false}
        expenseId="exp-1"
        isDeleted={false}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: 'حذف المصروف' });
    expect(deleteBtn).toBeTruthy();

    fireEvent.click(deleteBtn);

    expect(
      screen.getByText('هل أنت تأكد من نقل هذا المصروف إلى سلة المهملات؟'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تأكيد الحذف' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'إلغاء' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));
    expect(screen.getByRole('button', { name: 'حذف المصروف' })).toBeTruthy();
  });

  it('renders restore button when expense is soft-deleted', () => {
    render(
      <ExpenseStateControl archived={false} expenseId="exp-1" isDeleted />,
    );

    expect(
      screen.getByRole('button', { name: 'استعادة المصروف' }),
    ).toBeTruthy();
  });

  it('renders nothing when project is archived', () => {
    const { container } = render(
      <ExpenseStateControl archived expenseId="exp-1" isDeleted={false} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

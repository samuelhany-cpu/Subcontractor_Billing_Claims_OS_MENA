import {
  CategoryResponse,
  PayeeResponse,
  ProjectResponse,
} from '@claims-os/domain';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseForm } from './expense-form';

const timestamp = '2026-08-01T00:00:00.000Z';
const project: ProjectResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مشروع النيل',
  status: 'ACTIVE',
  openingBalance: '0.00',
  openingBalanceDate: null,
  archivedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  totals: {
    totalIncomingTransfers: '0.00',
    totalExpenses: '0.00',
    totalFunding: '0.00',
    availableBalance: '0.00',
    expenseCount: 0,
  },
};

function category(isActive = true): CategoryResponse {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'خامات',
    sortOrder: 0,
    isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
    subcategories: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        categoryId: '22222222-2222-4222-8222-222222222222',
        name: 'أسمنت',
        sortOrder: 0,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  };
}

function payee(isActive = true): PayeeResponse {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'مورد النور',
    type: 'SUPPLIER',
    specialty: null,
    phone: null,
    companyName: null,
    notes: null,
    isActive,
    totalPaid: '0.00',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const action = vi.fn(async () => ({
  error: null,
  success: null,
  fieldErrors: {},
}));

describe('ExpenseForm', () => {
  it('renders required Arabic RTL fields without source, delete, or legacy amount labels', () => {
    const { container } = render(
      <ExpenseForm
        action={action}
        categories={[category()]}
        mode="create"
        payees={[payee()]}
        projects={[project]}
      />,
    );
    expect(container.querySelector('form')?.getAttribute('dir')).toBe('rtl');
    for (const label of ['المشروع', 'التاريخ', 'البيان', 'الفئة', 'القيمة']) {
      expect(
        screen.getByLabelText(label).getAttribute('required'),
      ).not.toBeNull();
    }
    expect(screen.queryByLabelText('المصدر')).toBeNull();
    expect(screen.queryByText('مبلغ العملية')).toBeNull();
    expect(screen.queryByRole('button', { name: /حذف|استعادة/ })).toBeNull();
  });

  it('switches to an exact read-only calculated amount when both inputs exist', () => {
    render(
      <ExpenseForm
        action={action}
        categories={[category()]}
        mode="create"
        payees={[payee()]}
        projects={[project]}
      />,
    );
    fireEvent.change(screen.getByLabelText('الكمية'), {
      target: { value: '3.0000' },
    });
    fireEvent.change(screen.getByLabelText('سعر الوحدة'), {
      target: { value: '12150.0000' },
    });
    const amount = screen.getByLabelText('القيمة') as HTMLInputElement;
    expect(amount.value).toBe('36450.00');
    expect(amount.disabled).toBe(true);
    expect(screen.getByText(/محسوبة تلقائيًا/)).toBeTruthy();
  });

  it('shows only active classifications and Payees for new assignment', () => {
    render(
      <ExpenseForm
        action={action}
        categories={[
          category(),
          {
            ...category(false),
            id: '55555555-5555-4555-8555-555555555555',
            name: 'متوقفة',
          },
        ]}
        mode="create"
        payees={[
          payee(),
          {
            ...payee(false),
            id: '66666666-6666-4666-8666-666666666666',
            name: 'مورد متوقف',
          },
        ]}
        projects={[project]}
      />,
    );
    expect(screen.getByRole('option', { name: 'خامات' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /متوقفة/ })).toBeNull();
    expect(screen.getByRole('option', { name: 'مورد النور' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /مورد متوقف/ })).toBeNull();
  });
});

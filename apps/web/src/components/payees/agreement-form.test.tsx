import { ProjectResponse } from '@claims-os/domain';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgreementForm } from './agreement-form';

const project: ProjectResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مشروع النيل',
  status: 'ACTIVE',
  openingBalance: '0.00',
  openingBalanceDate: null,
  archivedAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  totals: {
    totalIncomingTransfers: '0.00',
    totalExpenses: '0.00',
    totalFunding: '0.00',
    availableBalance: '0.00',
    expenseCount: 0,
  },
};

describe('AgreementForm', () => {
  it('preserves exact decimal input and displays live remaining without numbers', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    render(
      <AgreementForm
        action={action}
        mode="create"
        projects={[project]}
        paidByProject={{ [project.id]: '9600.00' }}
      />,
    );
    fireEvent.change(screen.getByLabelText('إجمالي الاتفاق'), {
      target: { value: '19600.00' },
    });
    expect(screen.getByText(/10.00/)).toBeTruthy();
    expect(screen.getByText('المشروع')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'مشروع النيل' })).toBeTruthy();
  });

  it('shows a signed overpayment and read-only paid summary', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    render(
      <AgreementForm
        action={action}
        mode="update"
        initial={{
          projectId: project.id,
          totalAmount: '100.00',
          paidAmount: '120.25',
          notes: null,
        }}
      />,
    );
    expect(screen.getByText('الزيادة في الدفع')).toBeTruthy();
    expect(screen.getByText('20.25 ج.م')).toBeTruthy();
    expect(screen.queryByLabelText('المشروع')).toBeNull();
    expect(screen.queryByText(/login|user|account/i)).toBeNull();
  });
});

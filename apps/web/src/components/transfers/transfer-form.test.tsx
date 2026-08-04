import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TransferForm } from './transfer-form';

describe('TransferForm', () => {
  const mockProjects = [
    {
      id: 'p1',
      name: 'مشروع البرج',
      status: 'ACTIVE' as const,
      openingBalance: '100000.00',
      openingDate: '2026-01-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totals: {
        totalIncomingTransfers: '0.00',
        totalFunding: '100000.00',
        totalExpenses: '0.00',
        availableBalance: '100000.00',
      },
    },
  ];

  it('renders required Arabic field labels and dir="rtl" attribute', () => {
    const { container } = render(
      <TransferForm action={async () => ({})} projects={mockProjects} />,
    );

    const form = container.querySelector('form');
    expect(form?.getAttribute('dir')).toBe('rtl');
    expect(screen.getByLabelText('المشروع')).toBeDefined();
    expect(screen.getByLabelText('التاريخ')).toBeDefined();
    expect(screen.getByLabelText('المبلغ')).toBeDefined();
  });

  it('sets dir="ltr" attribute on monetary amount input field', () => {
    render(<TransferForm action={async () => ({})} projects={mockProjects} />);

    const amountInput = screen.getByLabelText('المبلغ');
    expect(amountInput.getAttribute('dir')).toBe('ltr');
  });
});

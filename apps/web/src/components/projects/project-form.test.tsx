import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectForm } from './project-form';

vi.mock('@/app/projects/actions', () => ({}));

describe('ProjectForm', () => {
  it('renders Arabic RTL creation fields with exact decimal and date inputs', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    const { container } = render(<ProjectForm action={action} mode="create" />);
    expect(container.querySelector('form')?.getAttribute('dir')).toBe('rtl');
    expect(
      screen.getByLabelText('اسم المشروع').getAttribute('required'),
    ).not.toBeNull();
    expect(
      screen.getByLabelText('الرصيد الافتتاحي').getAttribute('inputmode'),
    ).toBe('decimal');
    expect(
      screen.getByLabelText('تاريخ الرصيد الافتتاحي').getAttribute('type'),
    ).toBe('date');
    expect(screen.queryByText(/login|user|account/i)).toBeNull();
  });

  it('preserves supplied decimal and date strings when editing', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    render(
      <ProjectForm
        action={action}
        mode="edit"
        initial={{
          name: 'مشروع النيل',
          openingBalance: '-100.20',
          openingBalanceDate: '2026-08-01',
        }}
      />,
    );
    expect(
      (screen.getByLabelText('الرصيد الافتتاحي') as HTMLInputElement).value,
    ).toBe('-100.20');
    expect(
      (screen.getByLabelText('تاريخ الرصيد الافتتاحي') as HTMLInputElement)
        .value,
    ).toBe('2026-08-01');
  });
});

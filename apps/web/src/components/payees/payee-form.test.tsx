import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PayeeForm } from './payee-form';

describe('PayeeForm', () => {
  it('renders Arabic RTL fields, all approved types, and optional phone/company', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    const { container } = render(<PayeeForm action={action} mode="create" />);
    expect(container.querySelector('form')?.getAttribute('dir')).toBe('rtl');
    expect(
      screen.getByLabelText('الاسم').getAttribute('required'),
    ).not.toBeNull();
    expect(
      screen.getByLabelText('النوع').getAttribute('required'),
    ).not.toBeNull();
    expect(
      screen.getByLabelText('رقم الهاتف').getAttribute('required'),
    ).toBeNull();
    expect(
      screen.getByLabelText('اسم الشركة').getAttribute('required'),
    ).toBeNull();
    for (const label of ['مورد', 'صنايعي', 'عامل', 'شركة', 'أخرى']) {
      expect(screen.getByRole('option', { name: label })).toBeTruthy();
    }
    expect(screen.queryByText(/login|user|account|expense/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /حذف/ })).toBeNull();
  });

  it('preserves supplied optional profile values for editing', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    render(
      <PayeeForm
        action={action}
        mode="edit"
        initial={{
          name: 'مورد النور',
          type: 'SUPPLIER',
          specialty: 'خامات',
          phone: '0100',
          companyName: 'النور',
          notes: 'ملاحظة',
        }}
      />,
    );
    expect((screen.getByLabelText('الاسم') as HTMLInputElement).value).toBe(
      'مورد النور',
    );
    expect(
      (screen.getByLabelText('رقم الهاتف') as HTMLInputElement).value,
    ).toBe('0100');
    expect(
      (screen.getByLabelText('اسم الشركة') as HTMLInputElement).value,
    ).toBe('النور');
  });
});

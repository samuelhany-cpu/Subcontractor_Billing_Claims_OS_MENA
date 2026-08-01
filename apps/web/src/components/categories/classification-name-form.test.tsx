import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationNameForm } from './classification-name-form';

describe('ClassificationNameForm', () => {
  it('renders an Arabic required keyboard-accessible name field', () => {
    const action = vi.fn(async () => ({ error: null, fieldErrors: {} }));
    render(
      <ClassificationNameForm
        action={action}
        label="اسم الفئة"
        submitLabel="إضافة الفئة"
      />,
    );
    expect(screen.getByLabelText('اسم الفئة').hasAttribute('required')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: 'إضافة الفئة' })).toBeTruthy();
    expect(screen.queryByText(/login|user|account|delete/i)).toBeNull();
  });

  it('shows clear duplicate-name errors returned by the validated action', async () => {
    const action = vi.fn(async () => ({
      error: 'توجد فئة أخرى بالاسم نفسه.',
      fieldErrors: {},
    }));
    render(
      <ClassificationNameForm
        action={action}
        label="اسم الفئة"
        submitLabel="إضافة الفئة"
      />,
    );
    fireEvent.change(screen.getByLabelText('اسم الفئة'), {
      target: { value: 'فئة مكررة' },
    });
    fireEvent.submit(screen.getByLabelText('اسم الفئة').closest('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('بالاسم نفسه'),
    );
  });
});

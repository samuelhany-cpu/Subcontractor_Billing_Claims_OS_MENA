import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PayeeStateControl } from './payee-state-control';

describe('PayeeStateControl', () => {
  it('requires confirmation and explains record preservation before deactivation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const action = vi.fn(async () => ({ error: null }));
    render(<PayeeStateControl active action={action} />);
    fireEvent.click(screen.getByRole('button', { name: 'تعطيل' }));
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('سيظل المستفيد وكل مصروفاته واتفاقياته محفوظة'),
    );
    expect(action).not.toHaveBeenCalled();
  });

  it('reports safe activation failures without exposing internals', async () => {
    const action = vi.fn(async () => ({ error: 'تعذر تحديث الحالة.' }));
    render(<PayeeStateControl active={false} action={action} />);
    fireEvent.click(screen.getByRole('button', { name: 'تفعيل' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('تعذر تحديث الحالة.'),
    );
  });
});

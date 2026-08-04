import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentForm } from './attachment-form';

describe('AttachmentForm', () => {
  it('uses the approved private upload field and file policy', () => {
    const action = vi.fn(async () => ({
      error: null,
      success: null,
      fieldErrors: {},
    }));
    render(<AttachmentForm action={action} />);
    const input = screen.getByLabelText('صورة أو مرفق') as HTMLInputElement;
    expect(input.name).toBe('file');
    expect(input.required).toBe(true);
    expect(input.accept).toBe(
      'image/jpeg,image/png,image/webp,application/pdf',
    );
    expect(screen.getByText(/10 ميجابايت/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /حذف/ })).toBeNull();
  });
});

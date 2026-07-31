import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectTransition } from './project-transition';

describe('ProjectTransition', () => {
  it('requires explicit archive confirmation and explains record retention', async () => {
    const action = vi.fn(async () => undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProjectTransition mode="archive" action={action} />);
    fireEvent.click(screen.getByRole('button', { name: 'أرشفة المشروع' }));
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('الاحتفاظ بجميع سجلاته'),
    );
    expect(action).not.toHaveBeenCalled();
  });

  it('offers a primary restore action for archived projects', async () => {
    const action = vi.fn(async () => undefined);
    render(<ProjectTransition mode="restore" action={action} />);
    fireEvent.click(screen.getByRole('button', { name: 'استعادة المشروع' }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });
});

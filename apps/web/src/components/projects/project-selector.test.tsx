import { ProjectResponse } from '@claims-os/domain';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectSelector } from './project-selector';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ projectId: '11111111-1111-4111-8111-111111111111' }),
}));

const project = (id: string, name: string): ProjectResponse => ({
  id,
  name,
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
});

describe('ProjectSelector', () => {
  beforeEach(() => push.mockClear());

  it('uses the URL project as authoritative and navigates to a selected active project', () => {
    render(
      <ProjectSelector
        projects={[
          project('11111111-1111-4111-8111-111111111111', 'مشروع أول'),
          project('22222222-2222-4222-8222-222222222222', 'مشروع ثان'),
        ]}
      />,
    );
    const selector = screen.getByLabelText(
      'المشروع الحالي',
    ) as HTMLSelectElement;
    expect(selector.value).toBe('11111111-1111-4111-8111-111111111111');
    fireEvent.change(selector, {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    });
    expect(push).toHaveBeenCalledWith(
      '/projects/22222222-2222-4222-8222-222222222222',
    );
    expect(
      screen.getByRole('link', { name: 'عرض المشروعات المؤرشفة' }),
    ).toBeTruthy();
  });

  it('handles the zero-project state', () => {
    render(<ProjectSelector projects={[]} />);
    const selector = screen.getByLabelText(
      'المشروع الحالي',
    ) as HTMLSelectElement;
    expect(selector.disabled).toBe(true);
    expect(screen.getByText('لا توجد مشروعات نشطة')).toBeTruthy();
  });
});

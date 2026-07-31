import { ProjectResponse } from '@claims-os/domain';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectSummary } from './project-summary';

const project: ProjectResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مشروع',
  status: 'ACTIVE',
  openingBalance: '100.00',
  openingBalanceDate: '2026-08-01',
  archivedAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  totals: {
    totalIncomingTransfers: '200.00',
    totalExpenses: '50.00',
    totalFunding: '300.00',
    availableBalance: '250.00',
    expenseCount: 3,
  },
};

describe('ProjectSummary', () => {
  it('renders only the documented Arabic project totals', () => {
    render(<ProjectSummary project={project} />);
    for (const label of [
      'الرصيد الافتتاحي',
      'إجمالي التحويلات',
      'إجمالي التمويل',
      'إجمالي المصروفات',
      'الرصيد المتبقي',
      'عدد المصروفات',
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText('3')).toBeTruthy();
  });
});

import { CategoryResponse } from '@claims-os/domain';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriesManager } from './categories-manager';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  reorderCategories: vi.fn(async () => ({ error: null as string | null })),
  reorderSubcategories: vi.fn(async () => ({ error: null as string | null })),
  setCategoryActivity: vi.fn(async () => ({ error: null as string | null })),
  setSubcategoryActivity: vi.fn(async () => ({ error: null as string | null })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('@/app/settings/categories/actions', () => ({
  createCategoryAction: vi.fn(async () => ({ error: null, fieldErrors: {} })),
  createSubcategoryAction: vi.fn(async () => ({
    error: null,
    fieldErrors: {},
  })),
  renameCategoryAction: vi.fn(async () => ({ error: null, fieldErrors: {} })),
  renameSubcategoryAction: vi.fn(async () => ({
    error: null,
    fieldErrors: {},
  })),
  reorderCategoriesAction: mocks.reorderCategories,
  reorderSubcategoriesAction: mocks.reorderSubcategories,
  setCategoryActivityAction: mocks.setCategoryActivity,
  setSubcategoryActivityAction: mocks.setSubcategoryActivity,
}));

const timestamp = '2026-08-01T00:00:00.000Z';
function category(id: string, name: string, isActive = true): CategoryResponse {
  return {
    id,
    name,
    sortOrder: 0,
    isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
    subcategories: [
      {
        id: `${id.slice(0, 8)}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
        categoryId: id,
        name: `فرعي ${name}`,
        sortOrder: 0,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  };
}

const first = category('11111111-1111-4111-8111-111111111111', 'الفئة الأولى');
const second = category(
  '22222222-2222-4222-8222-222222222222',
  'الفئة الثانية',
);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reorderCategories.mockResolvedValue({ error: null });
});

describe('CategoriesManager', () => {
  it('renders Arabic RTL empty state without defaults, login, or hard-delete actions', () => {
    const { container } = render(
      <CategoriesManager categories={[]} filter="ACTIVE" />,
    );
    expect(container.firstElementChild?.getAttribute('dir')).toBe('rtl');
    expect(screen.getByText('لا توجد فئات بعد')).toBeTruthy();
    expect(screen.getByText(/لا ينشئ النظام فئات افتراضية/)).toBeTruthy();
    expect(screen.queryByText(/خامات|أعمال/)).toBeNull();
    expect(screen.queryByText(/login|user|account|delete/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /حذف/ })).toBeNull();
  });

  it('shows inactive state and explains effective child unavailability', () => {
    render(
      <CategoriesManager
        categories={[
          category('33333333-3333-4333-8333-333333333333', 'فئة متوقفة', false),
        ]}
        filter="INACTIVE"
      />,
    );
    expect(screen.getAllByText('غير نشط').length).toBeGreaterThan(0);
    expect(screen.getByText(/كل تصنيفاتها الفرعية غير متاحة/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تفعيل' })).toBeTruthy();
  });

  it('uses complete-list accessible category order controls', async () => {
    render(<CategoriesManager categories={[first, second]} filter="ALL" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'تحريك لأسفل' })[0]!);
    await waitFor(() =>
      expect(mocks.reorderCategories).toHaveBeenCalledWith([
        second.id,
        first.id,
      ]),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('refetches authoritative order and reports a failed reorder', async () => {
    mocks.reorderCategories.mockResolvedValueOnce({
      error: 'تغيرت القائمة على الخادم. أُعيد تحميل ترتيبها الحالي.',
    });
    render(<CategoriesManager categories={[first, second]} filter="ALL" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'تحريك لأسفل' })[0]!);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('أُعيد تحميل'),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('requires confirmation before deactivation and retains record wording', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CategoriesManager categories={[first]} filter="ACTIVE" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'تعطيل' })[0]!);
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('الاحتفاظ بكل المصروفات'),
    );
    expect(mocks.setCategoryActivity).not.toHaveBeenCalled();
  });

  it('provides touch-sized named controls for subcategory rename and ordering', () => {
    render(<CategoriesManager categories={[first]} filter="ALL" />);
    expect(
      screen.getAllByRole('button', { name: 'تحريك لأعلى' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('تعديل الاسم').length).toBeGreaterThan(1);
    expect(screen.getByText('إضافة تصنيف فرعي')).toBeTruthy();
    expect(screen.getByText(/غير مصنفة للعرض والتقارير فقط/)).toBeTruthy();
  });
});

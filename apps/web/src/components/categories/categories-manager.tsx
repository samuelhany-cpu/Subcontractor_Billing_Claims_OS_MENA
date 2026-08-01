'use client';

import {
  CategoryResponse,
  ClassificationFilter,
  SubcategoryResponse,
} from '@claims-os/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createCategoryAction,
  createSubcategoryAction,
  renameCategoryAction,
  renameSubcategoryAction,
  reorderCategoriesAction,
  reorderSubcategoriesAction,
  setCategoryActivityAction,
  setSubcategoryActivityAction,
} from '@/app/settings/categories/actions';
import { ClassificationNameForm } from './classification-name-form';

const filters: readonly [ClassificationFilter, string][] = [
  ['ACTIVE', 'النشطة'],
  ['INACTIVE', 'غير النشطة'],
  ['ALL', 'الكل'],
];

function swapped(
  ids: readonly string[],
  index: number,
  delta: -1 | 1,
): string[] {
  const target = index + delta;
  if (target < 0 || target >= ids.length) return [...ids];
  const result = [...ids];
  [result[index], result[target]] = [result[target]!, result[index]!];
  return result;
}

function OrderButtons({
  index,
  count,
  disabled,
  onMove,
}: {
  readonly index: number;
  readonly count: number;
  readonly disabled: boolean;
  readonly onMove: (delta: -1 | 1) => void;
}) {
  return (
    <div className="order-buttons" aria-label="تغيير الترتيب">
      <button
        className="button button-quiet"
        type="button"
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        تحريك لأعلى
      </button>
      <button
        className="button button-quiet"
        type="button"
        disabled={disabled || index === count - 1}
        onClick={() => onMove(1)}
      >
        تحريك لأسفل
      </button>
    </div>
  );
}

export function CategoriesManager({
  categories,
  filter,
}: {
  readonly categories: readonly CategoryResponse[];
  readonly filter: ClassificationFilter;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mutationError, setMutationError] = useState<string | null>(null);

  function finish(operation: () => Promise<{ error: string | null }>) {
    if (pending) return;
    setMutationError(null);
    startTransition(async () => {
      const result = await operation();
      if (result.error) setMutationError(result.error);
      router.refresh();
    });
  }

  function moveCategory(index: number, delta: -1 | 1) {
    const orderedIds = swapped(
      categories.map(({ id }) => id),
      index,
      delta,
    );
    finish(() => reorderCategoriesAction(orderedIds));
  }

  function moveSubcategory(
    category: CategoryResponse,
    index: number,
    delta: -1 | 1,
  ) {
    const orderedIds = swapped(
      category.subcategories.map(({ id }) => id),
      index,
      delta,
    );
    finish(() => reorderSubcategoriesAction(category.id, orderedIds));
  }

  function changeCategoryState(category: CategoryResponse) {
    const activate = !category.isActive;
    if (
      !activate &&
      !window.confirm(
        'سيتم تعطيل الفئة للاختيارات الجديدة مع الاحتفاظ بكل المصروفات والتصنيفات الفرعية المرتبطة بها. هل تريد المتابعة؟',
      )
    )
      return;
    finish(() => setCategoryActivityAction(category.id, activate));
  }

  function changeSubcategoryState(subcategory: SubcategoryResponse) {
    const activate = !subcategory.isActive;
    if (
      !activate &&
      !window.confirm(
        'سيتم تعطيل التصنيف الفرعي للاختيارات الجديدة مع الاحتفاظ بالسجلات السابقة. هل تريد المتابعة؟',
      )
    )
      return;
    finish(() => setSubcategoryActivityAction(subcategory.id, activate));
  }

  return (
    <div className="category-settings" dir="rtl">
      <section
        className="create-panel"
        aria-labelledby="create-category-heading"
      >
        <h2 id="create-category-heading">إضافة فئة</h2>
        <ClassificationNameForm
          action={createCategoryAction}
          label="اسم الفئة"
          submitLabel="إضافة الفئة"
        />
      </section>

      <section aria-labelledby="category-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">التصنيفات العامة</p>
            <h2 id="category-list-heading">الفئات والتصنيفات الفرعية</h2>
          </div>
          <nav className="filter-tabs" aria-label="تصفية الفئات">
            {filters.map(([value, label]) => (
              <Link
                className={filter === value ? 'active' : ''}
                href={`/settings/categories?status=${value}`}
                key={value}
                aria-current={filter === value ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {filter !== 'ALL' && categories.length > 1 && (
          <p className="settings-note">
            اعرض «الكل» لتغيير ترتيب الفئات؛ الحفظ يتطلب القائمة الكاملة النشطة
            وغير النشطة.
          </p>
        )}
        <p className="settings-note">
          المصروفات المستوردة بلا فئة تظل غير مصنفة للعرض والتقارير فقط، ولا
          تُنشأ فئة قابلة للتعديل لهذا الغرض.
        </p>
        {mutationError && (
          <p className="form-error" role="alert">
            {mutationError}
          </p>
        )}
        {pending && (
          <p className="mutation-status" role="status">
            جارٍ حفظ التغيير…
          </p>
        )}

        {categories.length === 0 ? (
          <div className="empty-state">
            <h3>
              {filter === 'INACTIVE'
                ? 'لا توجد فئات غير نشطة'
                : 'لا توجد فئات بعد'}
            </h3>
            <p>
              {filter === 'INACTIVE'
                ? 'ستظهر هنا الفئات التي تقوم بتعطيلها.'
                : 'أضف أول فئة يدويًا. لا ينشئ النظام فئات افتراضية.'}
            </p>
          </div>
        ) : (
          <div className="category-list">
            {categories.map((category, categoryIndex) => (
              <article
                className={`category-card ${category.isActive ? '' : 'inactive'}`}
                key={category.id}
              >
                <div className="category-card-heading">
                  <div>
                    <span
                      className={`status-badge ${category.isActive ? '' : 'archived'}`}
                    >
                      {category.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                    <h3>{category.name}</h3>
                    {!category.isActive && (
                      <p className="inactive-help">
                        الفئة وكل تصنيفاتها الفرعية غير متاحة للاختيارات
                        الجديدة، دون تغيير حالة الأبناء المخزنة.
                      </p>
                    )}
                  </div>
                  <div className="classification-actions">
                    <OrderButtons
                      index={categoryIndex}
                      count={categories.length}
                      disabled={pending || filter !== 'ALL'}
                      onMove={(delta) => moveCategory(categoryIndex, delta)}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={pending}
                      onClick={() => changeCategoryState(category)}
                    >
                      {category.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </div>
                </div>

                <details className="rename-panel">
                  <summary>تعديل الاسم</summary>
                  <ClassificationNameForm
                    action={renameCategoryAction.bind(null, category.id)}
                    initialName={category.name}
                    label="اسم الفئة"
                    submitLabel="حفظ الاسم"
                  />
                </details>

                <section
                  className="subcategory-section"
                  aria-label={`التصنيفات الفرعية للفئة ${category.name}`}
                >
                  <div className="subcategory-heading">
                    <h4>التصنيفات الفرعية</h4>
                    <span>{category.subcategories.length}</span>
                  </div>
                  {category.subcategories.length === 0 ? (
                    <p className="subcategory-empty">لا توجد تصنيفات فرعية.</p>
                  ) : (
                    <ul className="subcategory-list">
                      {category.subcategories.map(
                        (subcategory, subcategoryIndex) => (
                          <li
                            className={subcategory.isActive ? '' : 'inactive'}
                            key={subcategory.id}
                          >
                            <div className="subcategory-row">
                              <div>
                                <strong>{subcategory.name}</strong>
                                <span>
                                  {subcategory.isActive ? 'نشط' : 'غير نشط'}
                                </span>
                              </div>
                              <div className="classification-actions">
                                <OrderButtons
                                  index={subcategoryIndex}
                                  count={category.subcategories.length}
                                  disabled={pending}
                                  onMove={(delta) =>
                                    moveSubcategory(
                                      category,
                                      subcategoryIndex,
                                      delta,
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  className="button button-quiet"
                                  disabled={pending}
                                  onClick={() =>
                                    changeSubcategoryState(subcategory)
                                  }
                                >
                                  {subcategory.isActive ? 'تعطيل' : 'تفعيل'}
                                </button>
                              </div>
                            </div>
                            <details className="rename-panel compact">
                              <summary>تعديل الاسم</summary>
                              <ClassificationNameForm
                                action={renameSubcategoryAction.bind(
                                  null,
                                  subcategory.id,
                                )}
                                initialName={subcategory.name}
                                label="اسم التصنيف الفرعي"
                                submitLabel="حفظ الاسم"
                              />
                            </details>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                  <details className="add-subcategory-panel">
                    <summary>إضافة تصنيف فرعي</summary>
                    <ClassificationNameForm
                      action={createSubcategoryAction.bind(null, category.id)}
                      label="اسم التصنيف الفرعي"
                      submitLabel="إضافة التصنيف"
                    />
                  </details>
                </section>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

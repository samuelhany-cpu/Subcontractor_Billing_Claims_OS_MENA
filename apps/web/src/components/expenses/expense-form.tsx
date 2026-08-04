'use client';

import {
  CategoryResponse,
  ExpenseResponse,
  PayeeResponse,
  ProjectResponse,
} from '@claims-os/domain';
import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  calculateExpenseAmount,
  emptyExpenseFormState,
  ExpenseFormState,
} from '@/lib/expense-form-state';
import { formatMoney } from '@/lib/project-format';

function todayInCairo(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Africa/Cairo',
    year: 'numeric',
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function Submit({ mode }: { readonly mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending
        ? 'جارٍ الحفظ…'
        : mode === 'create'
          ? 'حفظ المصروف'
          : 'حفظ التعديلات'}
    </button>
  );
}

export function ExpenseForm({
  action,
  categories,
  initial,
  mode,
  payees,
  projects,
  selectedProjectId,
}: {
  readonly action: (
    state: ExpenseFormState,
    data: FormData,
  ) => Promise<ExpenseFormState>;
  readonly categories: readonly CategoryResponse[];
  readonly initial?: ExpenseResponse;
  readonly mode: 'create' | 'edit';
  readonly payees: readonly PayeeResponse[];
  readonly projects: readonly ProjectResponse[];
  readonly selectedProjectId?: string;
}) {
  const [state, formAction] = useActionState(action, emptyExpenseFormState);
  const [categoryId, setCategoryId] = useState(initial?.category?.id ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? '');
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice ?? '');
  const [manualAmount, setManualAmount] = useState(initial?.amount ?? '');
  const calculatedAmount = useMemo(
    () => calculateExpenseAmount(quantity, unitPrice),
    [quantity, unitPrice],
  );
  const availableCategories = categories.filter(
    (category) => category.isActive || category.id === initial?.category?.id,
  );
  const selectedCategory = categories.find(
    (category) => category.id === categoryId,
  );
  const availableSubcategories = (selectedCategory?.subcategories ?? []).filter(
    (subcategory) =>
      (selectedCategory?.isActive === true && subcategory.isActive) ||
      subcategory.id === initial?.subcategory?.id,
  );
  const availablePayees = payees.filter(
    (payee) => payee.isActive || payee.id === initial?.payee?.id,
  );

  return (
    <form action={formAction} className="project-form expense-form" dir="rtl">
      {mode === 'create' ? (
        <div className="field">
          <label htmlFor="expense-project">المشروع</label>
          <select
            id="expense-project"
            name="projectId"
            defaultValue={selectedProjectId ?? ''}
            required
          >
            <option value="" disabled>
              اختر المشروع
            </option>
            {projects
              .filter((project) => project.status === 'ACTIVE')
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
          {state.fieldErrors.projectId && (
            <p className="field-error">{state.fieldErrors.projectId}</p>
          )}
        </div>
      ) : (
        <p className="field-help">المشروع: {initial?.project.name}</p>
      )}
      <div className="form-row">
        <div className="field">
          <label htmlFor="expense-date">التاريخ</label>
          <input
            id="expense-date"
            name="expenseDate"
            type="date"
            defaultValue={initial?.expenseDate ?? todayInCairo()}
            required
          />
          {state.fieldErrors.expenseDate && (
            <p className="field-error">{state.fieldErrors.expenseDate}</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="expense-description">البيان</label>
          <input
            id="expense-description"
            name="description"
            defaultValue={initial?.description ?? ''}
            required
          />
          {state.fieldErrors.description && (
            <p className="field-error">{state.fieldErrors.description}</p>
          )}
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="expense-category">الفئة</label>
          <select
            id="expense-category"
            name="categoryId"
            value={categoryId}
            required={initial?.category !== null}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {initial?.category === null && (
              <option value="">غير مصنف — سجل مستورد</option>
            )}
            <option value="" disabled={initial?.category !== null}>
              اختر الفئة
            </option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? '' : ' — غير نشطة'}
              </option>
            ))}
          </select>
          <Link className="inline-create-link" href="/settings/categories">
            إضافة فئة
          </Link>
          {state.fieldErrors.categoryId && (
            <p className="field-error">{state.fieldErrors.categoryId}</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="expense-subcategory">التصنيف الفرعي</label>
          <select
            id="expense-subcategory"
            name="subcategoryId"
            defaultValue={initial?.subcategory?.id ?? ''}
          >
            <option value="">بدون تصنيف فرعي</option>
            {availableSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
                {subcategory.isActive ? '' : ' — غير نشط'}
              </option>
            ))}
          </select>
          <Link className="inline-create-link" href="/settings/categories">
            إضافة تصنيف فرعي
          </Link>
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="expense-payee">المورد أو الصنايعي</label>
          <select
            id="expense-payee"
            name="payeeId"
            defaultValue={initial?.payee?.id ?? ''}
          >
            <option value="">غير محدد</option>
            {availablePayees.map((payee) => (
              <option key={payee.id} value={payee.id}>
                {payee.name}
                {payee.isActive ? '' : ' — غير نشط'}
              </option>
            ))}
          </select>
          <Link className="inline-create-link" href="/payees">
            إضافة مورد أو صنايعي
          </Link>
        </div>
        <div className="field">
          <label htmlFor="expense-invoice">رقم الفاتورة</label>
          <input
            id="expense-invoice"
            name="invoiceNumber"
            defaultValue={initial?.invoiceNumber ?? ''}
            maxLength={160}
          />
        </div>
      </div>
      <div className="form-row expense-calculation">
        <div className="field">
          <label htmlFor="expense-quantity">الكمية</label>
          <input
            id="expense-quantity"
            name="quantity"
            value={quantity}
            inputMode="decimal"
            dir="ltr"
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="expense-unit">الوحدة</label>
          <input
            id="expense-unit"
            name="unit"
            defaultValue={initial?.unit ?? ''}
            maxLength={80}
          />
        </div>
        <div className="field">
          <label htmlFor="expense-unit-price">سعر الوحدة</label>
          <input
            id="expense-unit-price"
            name="unitPrice"
            value={unitPrice}
            inputMode="decimal"
            dir="ltr"
            onChange={(event) => setUnitPrice(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="expense-amount">القيمة</label>
          <input
            id="expense-amount"
            name="amount"
            value={calculatedAmount ?? manualAmount}
            disabled={calculatedAmount !== null}
            readOnly={calculatedAmount !== null}
            inputMode="decimal"
            dir="ltr"
            required={calculatedAmount === null}
            onChange={(event) => setManualAmount(event.target.value)}
          />
          <p className="field-help">
            {calculatedAmount === null
              ? 'إدخال يدوي'
              : `محسوبة تلقائيًا: ${formatMoney(calculatedAmount)}`}
          </p>
          {state.fieldErrors.amount && (
            <p className="field-error">{state.fieldErrors.amount}</p>
          )}
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="expense-payment">طريقة الدفع</label>
          <input
            id="expense-payment"
            name="paymentMethod"
            defaultValue={initial?.paymentMethod ?? ''}
            maxLength={120}
          />
        </div>
        <div className="field">
          <label htmlFor="expense-notes">الملاحظات</label>
          <textarea
            id="expense-notes"
            name="notes"
            defaultValue={initial?.notes ?? ''}
            rows={3}
          />
        </div>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
      <Submit mode={mode} />
    </form>
  );
}

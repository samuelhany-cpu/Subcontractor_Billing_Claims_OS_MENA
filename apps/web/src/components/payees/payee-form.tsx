'use client';

import { PayeeType } from '@claims-os/domain';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { emptyPayeeFormState, PayeeFormState } from '@/lib/payee-form-state';

const typeOptions: readonly [PayeeType, string][] = [
  ['SUPPLIER', 'مورد'],
  ['CRAFTSMAN', 'صنايعي'],
  ['WORKER', 'عامل'],
  ['COMPANY', 'شركة'],
  ['OTHER', 'أخرى'],
];

function Submit({ mode }: { readonly mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending
        ? 'جارٍ الحفظ…'
        : mode === 'create'
          ? 'إضافة المستفيد'
          : 'حفظ التعديلات'}
    </button>
  );
}

export function PayeeForm({
  action,
  mode,
  initial,
}: {
  readonly action: (
    state: PayeeFormState,
    data: FormData,
  ) => Promise<PayeeFormState>;
  readonly mode: 'create' | 'edit';
  readonly initial?: {
    readonly name: string;
    readonly type: PayeeType;
    readonly specialty: string | null;
    readonly phone: string | null;
    readonly companyName: string | null;
    readonly notes: string | null;
  };
}) {
  const [state, formAction] = useActionState(action, emptyPayeeFormState);
  return (
    <form
      action={formAction}
      className="project-form payee-form"
      dir="rtl"
      noValidate
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${mode}-payee-name`}>الاسم</label>
          <input
            id={`${mode}-payee-name`}
            name="name"
            defaultValue={initial?.name ?? ''}
            required
            maxLength={200}
          />
          {state.fieldErrors.name && (
            <p className="field-error" role="alert">
              {state.fieldErrors.name}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${mode}-payee-type`}>النوع</label>
          <select
            id={`${mode}-payee-type`}
            name="type"
            defaultValue={initial?.type ?? ''}
            required
          >
            <option value="" disabled>
              اختر النوع
            </option>
            {typeOptions.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          {state.fieldErrors.type && (
            <p className="field-error" role="alert">
              {state.fieldErrors.type}
            </p>
          )}
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${mode}-specialty`}>التخصص</label>
          <input
            id={`${mode}-specialty`}
            name="specialty"
            defaultValue={initial?.specialty ?? ''}
            maxLength={160}
          />
        </div>
        <div className="field">
          <label htmlFor={`${mode}-phone`}>رقم الهاتف</label>
          <input
            id={`${mode}-phone`}
            name="phone"
            defaultValue={initial?.phone ?? ''}
            maxLength={80}
            inputMode="tel"
            dir="ltr"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${mode}-company`}>اسم الشركة</label>
        <input
          id={`${mode}-company`}
          name="companyName"
          defaultValue={initial?.companyName ?? ''}
          maxLength={200}
        />
      </div>
      <div className="field">
        <label htmlFor={`${mode}-notes`}>الملاحظات</label>
        <textarea
          id={`${mode}-notes`}
          name="notes"
          defaultValue={initial?.notes ?? ''}
          rows={3}
        />
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

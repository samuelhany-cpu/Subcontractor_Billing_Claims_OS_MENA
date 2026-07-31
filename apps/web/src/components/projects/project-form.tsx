'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  emptyProjectFormState,
  ProjectFormState,
} from '@/lib/project-form-state';

interface ProjectFormProps {
  readonly action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  readonly initial?: {
    readonly name: string;
    readonly openingBalance: string;
    readonly openingBalanceDate: string | null;
  };
  readonly mode: 'create' | 'edit';
}

function SubmitButton({ mode }: { readonly mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending
        ? 'جارٍ الحفظ…'
        : mode === 'create'
          ? 'إنشاء المشروع'
          : 'حفظ التعديلات'}
    </button>
  );
}

export function ProjectForm({ action, initial, mode }: ProjectFormProps) {
  const [state, formAction] = useActionState(action, emptyProjectFormState);
  return (
    <form action={formAction} className="project-form" dir="rtl" noValidate>
      <div className="field">
        <label htmlFor={`${mode}-project-name`}>اسم المشروع</label>
        <input
          id={`${mode}-project-name`}
          name="name"
          defaultValue={initial?.name ?? ''}
          required
          maxLength={200}
          autoComplete="off"
          aria-describedby={`${mode}-name-error`}
        />
        {state.fieldErrors.name && (
          <p className="field-error" id={`${mode}-name-error`} role="alert">
            {state.fieldErrors.name}
          </p>
        )}
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${mode}-opening-balance`}>الرصيد الافتتاحي</label>
          <input
            id={`${mode}-opening-balance`}
            name="openingBalance"
            defaultValue={initial?.openingBalance ?? ''}
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            aria-describedby={`${mode}-balance-help`}
          />
          <p className="field-help" id={`${mode}-balance-help`}>
            اختياري، ويمكن أن يكون موجبًا أو صفرًا أو سالبًا.
          </p>
          {state.fieldErrors.openingBalance && (
            <p className="field-error" role="alert">
              {state.fieldErrors.openingBalance}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${mode}-opening-date`}>تاريخ الرصيد الافتتاحي</label>
          <input
            id={`${mode}-opening-date`}
            name="openingBalanceDate"
            defaultValue={initial?.openingBalanceDate ?? ''}
            type="date"
            dir="ltr"
          />
          {state.fieldErrors.openingBalanceDate && (
            <p className="field-error" role="alert">
              {state.fieldErrors.openingBalanceDate}
            </p>
          )}
        </div>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton mode={mode} />
    </form>
  );
}

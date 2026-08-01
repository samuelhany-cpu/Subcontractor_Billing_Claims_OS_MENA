'use client';

import { ProjectResponse } from '@claims-os/domain';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { emptyPayeeFormState, PayeeFormState } from '@/lib/payee-form-state';
import {
  formatMoney,
  overpaidMoney,
  subtractMoney,
} from '@/lib/project-format';

function Submit({ mode }: { readonly mode: 'create' | 'update' }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending
        ? 'جارٍ الحفظ…'
        : mode === 'create'
          ? 'إنشاء الاتفاقية'
          : 'تحديث الاتفاقية'}
    </button>
  );
}

export function AgreementForm({
  action,
  mode,
  projects = [],
  paidByProject = {},
  initial,
}: {
  readonly action: (
    state: PayeeFormState,
    data: FormData,
  ) => Promise<PayeeFormState>;
  readonly mode: 'create' | 'update';
  readonly projects?: readonly ProjectResponse[];
  readonly paidByProject?: Readonly<Record<string, string>>;
  readonly initial?: {
    readonly projectId: string;
    readonly totalAmount: string;
    readonly paidAmount: string;
    readonly notes: string | null;
  };
}) {
  const [state, formAction] = useActionState(action, emptyPayeeFormState);
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? projects[0]?.id ?? '',
  );
  const [total, setTotal] = useState(initial?.totalAmount ?? '');
  const paid = initial?.paidAmount ?? paidByProject[projectId] ?? '0.00';
  let remaining = '0.00';
  let overpaid = '0.00';
  if (/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(total)) {
    remaining = subtractMoney(total, paid);
    overpaid = overpaidMoney(total, paid);
  }
  return (
    <form action={formAction} className="agreement-form" dir="rtl" noValidate>
      {mode === 'create' && (
        <div className="field">
          <label htmlFor="agreement-project">المشروع</label>
          <select
            id="agreement-project"
            name="projectId"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            required
          >
            {projects.length === 0 && (
              <option value="">لا توجد مشروعات نشطة متاحة</option>
            )}
            {projects.map((project) => (
              <option value={project.id} key={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {state.fieldErrors.projectId && (
            <p className="field-error">{state.fieldErrors.projectId}</p>
          )}
        </div>
      )}
      <div className="field">
        <label htmlFor={`agreement-total-${initial?.projectId ?? 'new'}`}>
          إجمالي الاتفاق
        </label>
        <input
          id={`agreement-total-${initial?.projectId ?? 'new'}`}
          name="totalAmount"
          value={total}
          onChange={(event) => setTotal(event.target.value)}
          inputMode="decimal"
          dir="ltr"
          placeholder="0.00"
          required
        />
        {state.fieldErrors.totalAmount && (
          <p className="field-error" role="alert">
            {state.fieldErrors.totalAmount}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor={`agreement-notes-${initial?.projectId ?? 'new'}`}>
          الملاحظات
        </label>
        <textarea
          id={`agreement-notes-${initial?.projectId ?? 'new'}`}
          name="notes"
          defaultValue={initial?.notes ?? ''}
          rows={2}
        />
      </div>
      <dl className="agreement-live-summary" aria-label="ملخص الاتفاقية">
        <div>
          <dt>المدفوع</dt>
          <dd dir="ltr">{formatMoney(paid)}</dd>
        </div>
        <div>
          <dt>المتبقي</dt>
          <dd dir="ltr">{formatMoney(remaining)}</dd>
        </div>
        {overpaid !== '0.00' && (
          <div className="overpaid">
            <dt>الزيادة في الدفع</dt>
            <dd dir="ltr">{formatMoney(overpaid)}</dd>
          </div>
        )}
      </dl>
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

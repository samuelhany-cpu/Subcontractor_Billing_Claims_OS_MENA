'use client';

import { useActionState } from 'react';
import { ProjectResponse, TransferResponse } from '@claims-os/domain';
import { TransferActionState } from '@/app/transfers/actions';

function todayInCairo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

export function TransferForm({
  action,
  projects,
  initial,
  mode = 'create',
  selectedProjectId,
}: {
  readonly action: (
    prevState: TransferActionState,
    formData: FormData,
  ) => Promise<TransferActionState>;
  readonly projects: readonly ProjectResponse[];
  readonly initial?: TransferResponse | undefined;
  readonly mode?: 'create' | 'edit' | undefined;
  readonly selectedProjectId?: string | undefined;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');

  return (
    <form action={formAction} className="form-stack" dir="rtl">
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">تم حفظ التحويل بنجاح</p>}

      {mode === 'create' ? (
        <div className="field">
          <label htmlFor="projectId">المشروع</label>
          <select
            defaultValue={selectedProjectId ?? activeProjects[0]?.id ?? ''}
            id="projectId"
            name="projectId"
            required
          >
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.projectId && (
            <p className="field-error">{state.fieldErrors.projectId}</p>
          )}
        </div>
      ) : (
        <div className="field">
          <label>المشروع</label>
          <strong>{initial?.project.name}</strong>
        </div>
      )}

      <div className="field">
        <label htmlFor="transferDate">التاريخ</label>
        <input
          defaultValue={initial?.transferDate ?? todayInCairo()}
          id="transferDate"
          name="transferDate"
          required
          type="date"
        />
        {state.fieldErrors?.transferDate && (
          <p className="field-error">{state.fieldErrors.transferDate}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="amount">المبلغ</label>
        <input
          defaultValue={initial?.amount ?? ''}
          dir="ltr"
          id="amount"
          inputMode="decimal"
          name="amount"
          placeholder="0.00"
          required
          type="text"
        />
        {state.fieldErrors?.amount && (
          <p className="field-error">{state.fieldErrors.amount}</p>
        )}
      </div>

      <div className="form-actions">
        <button
          className="button button-primary"
          disabled={
            pending || (mode === 'create' && activeProjects.length === 0)
          }
          type="submit"
        >
          {pending
            ? 'جارٍ الحفظ…'
            : mode === 'create'
              ? 'إضافة التحويل'
              : 'حفظ التعديلات'}
        </button>
      </div>
    </form>
  );
}

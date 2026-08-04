'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  emptyExpenseFormState,
  ExpenseFormState,
} from '@/lib/expense-form-state';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? 'جارٍ رفع المرفق…' : 'إضافة المرفق'}
    </button>
  );
}

export function AttachmentForm({
  action,
}: {
  readonly action: (
    state: ExpenseFormState,
    data: FormData,
  ) => Promise<ExpenseFormState>;
}) {
  const [state, formAction] = useActionState(action, emptyExpenseFormState);
  return (
    <form action={formAction} className="attachment-form">
      <div className="field">
        <label htmlFor="expense-attachment">صورة أو مرفق</label>
        <input
          id="expense-attachment"
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
        />
        <p className="field-help">
          الصور وملفات PDF فقط، بحد أقصى 10 ميجابايت.
        </p>
      </div>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.success && <p className="form-success">{state.success}</p>}
      <Submit />
    </form>
  );
}

'use client';

import { useActionState, useState } from 'react';
import {
  deleteExpenseAction,
  restoreExpenseAction,
} from '@/app/expenses/actions';
import { emptyExpenseFormState } from '@/lib/expense-form-state';

export function ExpenseStateControl({
  expenseId,
  isDeleted,
  archived,
}: {
  readonly expenseId: string;
  readonly isDeleted: boolean;
  readonly archived: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteExpenseAction.bind(null, expenseId),
    emptyExpenseFormState,
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreExpenseAction.bind(null, expenseId),
    emptyExpenseFormState,
  );

  if (archived) return null;

  return (
    <div className="state-control-box" dir="rtl">
      {deleteState.error && (
        <p className="form-error" role="alert">
          {deleteState.error}
        </p>
      )}
      {restoreState.error && (
        <p className="form-error" role="alert">
          {restoreState.error}
        </p>
      )}

      {isDeleted ? (
        <form action={restoreAction}>
          <button
            className="button button-primary"
            disabled={restorePending}
            type="submit"
          >
            {restorePending ? 'جارٍ الاستعادة…' : 'استعادة المصروف'}
          </button>
        </form>
      ) : confirmingDelete ? (
        <div className="confirm-box">
          <p>هل أنت تأكد من نقل هذا المصروف إلى سلة المهملات؟</p>
          <div className="confirm-actions">
            <form action={deleteAction}>
              <button
                className="button button-danger"
                disabled={deletePending}
                type="submit"
              >
                {deletePending ? 'جارٍ الحذف…' : 'تأكيد الحذف'}
              </button>
            </form>
            <button
              className="button button-secondary"
              onClick={() => setConfirmingDelete(false)}
              type="button"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button
          className="button button-secondary"
          onClick={() => setConfirmingDelete(true)}
          type="button"
        >
          حذف المصروف
        </button>
      )}
    </div>
  );
}

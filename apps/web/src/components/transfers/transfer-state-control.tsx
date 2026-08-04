'use client';

import { useActionState, useState } from 'react';
import {
  deleteTransferAction,
  restoreTransferAction,
} from '@/app/transfers/actions';

export function TransferStateControl({
  transferId,
  isDeleted,
  archived,
}: {
  readonly transferId: string;
  readonly isDeleted: boolean;
  readonly archived: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTransferAction.bind(null, transferId),
    {},
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreTransferAction.bind(null, transferId),
    {},
  );

  if (archived) return null;

  return (
    <div className="state-control-box" dir="rtl">
      {deleteState.error && <p className="form-error">{deleteState.error}</p>}
      {restoreState.error && <p className="form-error">{restoreState.error}</p>}

      {isDeleted ? (
        <form action={restoreAction}>
          <button
            className="button button-primary"
            disabled={restorePending}
            type="submit"
          >
            {restorePending ? 'جارٍ الاستعادة…' : 'استعادة التحويل'}
          </button>
        </form>
      ) : confirmingDelete ? (
        <div className="confirm-box">
          <p>هل أنت تأكد من حذف هذا التحويل؟</p>
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
          حذف التحويل
        </button>
      )}
    </div>
  );
}

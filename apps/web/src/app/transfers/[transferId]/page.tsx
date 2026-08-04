import { getTransfer, TransfersApiError } from '@/lib/transfers-api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { updateTransferAction } from '../actions';
import { TransferForm } from '@/components/transfers/transfer-form';
import { TransferStateControl } from '@/components/transfers/transfer-state-control';
import { listProjects } from '@/lib/projects-api';
import { formatDate, formatMoney } from '@/lib/project-format';

export default async function TransferDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly transferId: string }>;
}) {
  const { transferId } = await params;
  let transfer;
  try {
    transfer = await getTransfer(transferId);
  } catch (error: unknown) {
    if (error instanceof TransfersApiError && error.status === 404) notFound();
    throw error;
  }

  const projects = await listProjects('ALL');
  const archived = transfer.project.status === 'ARCHIVED';
  const isDeleted = transfer.deletedAt !== null;

  return (
    <div className="page-stack transfer-detail" dir="rtl">
      <Link className="back-link" href="/transfers">
        العودة إلى التحويلات
      </Link>

      <section className="detail-heading">
        <div>
          <p className="eyebrow">{transfer.project.name}</p>
          <h1>تحويل وارد — {formatDate(transfer.transferDate)}</h1>
          <p>
            المصدر:{' '}
            {transfer.source === 'WEB'
              ? 'من الموقع'
              : transfer.source === 'TELEGRAM'
                ? 'من تيليجرام'
                : 'من استيراد Excel'}
          </p>
        </div>
        <strong className="expense-amount" dir="ltr">
          {formatMoney(transfer.amount)}
        </strong>
      </section>

      {archived && (
        <p className="readonly-notice">
          المشروع مؤرشف. التحويل قابل للقراءة فقط، ويلزم استعادة المشروع قبل أي
          تعديل أو حذف.
        </p>
      )}

      {isDeleted && (
        <p className="readonly-notice">
          هذا التحويل محذوف حاليًا ومستبعد من إجمالي تمويل المشروع ورصيده
          المتاح.
        </p>
      )}

      {!archived && !isDeleted && (
        <section className="edit-panel">
          <h2>تعديل بيانات التحويل</h2>
          <TransferForm
            action={updateTransferAction.bind(null, transfer.id)}
            initial={transfer}
            mode="edit"
            projects={projects}
          />
        </section>
      )}

      <TransferStateControl
        archived={archived}
        isDeleted={isDeleted}
        transferId={transfer.id}
      />
    </div>
  );
}

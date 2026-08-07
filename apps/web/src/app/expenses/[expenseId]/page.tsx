import { ExpensesApiError, getExpense } from '@/lib/expenses-api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { updateExpenseAction, uploadAttachmentAction } from '../actions';
import { AttachmentForm } from '@/components/expenses/attachment-form';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { ExpenseStateControl } from '@/components/expenses/expense-state-control';
import { listCategories } from '@/lib/categories-api';
import { listPayees } from '@/lib/payees-api';
import { formatDate, formatMoney } from '@/lib/project-format';
import { listProjects } from '@/lib/projects-api';

export default async function ExpenseDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly expenseId: string }>;
}) {
  const { expenseId } = await params;
  let expense;
  try {
    expense = await getExpense(expenseId);
  } catch (error: unknown) {
    if (error instanceof ExpensesApiError && error.status === 404) notFound();
    throw error;
  }
  const [projects, categories, payees] = await Promise.all([
    listProjects('ALL'),
    listCategories('ALL'),
    listPayees('ALL'),
  ]);
  const archived = expense.project.status === 'ARCHIVED';
  const isDeleted = expense.deletedAt !== null;
  return (
    <div className="page-stack expense-detail" dir="rtl">
      <Link className="back-link" href="/expenses">
        العودة إلى المصروفات
      </Link>
      <section className="detail-heading">
        <div>
          <p className="eyebrow">{expense.project.name}</p>
          <h1>
            {expense.description}{' '}
            {isDeleted && <span className="source-badge deleted">محذوف</span>}
          </h1>
          <p>
            {formatDate(expense.expenseDate)} —{' '}
            {expense.category?.name ?? 'غير مصنف'}
          </p>
        </div>
        <strong className="expense-amount" dir="ltr">
          {formatMoney(expense.amount)}
        </strong>
      </section>
      {isDeleted && (
        <p className="deleted-banner" role="alert">
          المصروف محذوف وموجود في سلة المهملات. استعد المصروف ليعود إلى الحسابات
          والإجماليات.
        </p>
      )}
      {archived && (
        <p className="readonly-notice">
          المشروع مؤرشف. المصروف والمرفقات قابلان للقراءة، ويلزم استعادة المشروع
          قبل أي تعديل أو إضافة مرفق.
        </p>
      )}
      <ExpenseStateControl
        archived={archived}
        expenseId={expense.id}
        isDeleted={isDeleted}
      />

      <section className="expense-detail-grid">
        <div>
          <span>المورد أو الصنايعي</span>
          <strong>{expense.payee?.name ?? 'غير محدد'}</strong>
        </div>
        <div>
          <span>رقم الفاتورة</span>
          <strong>{expense.invoiceNumber ?? 'غير محدد'}</strong>
        </div>
        <div>
          <span>طريقة الدفع</span>
          <strong>{expense.paymentMethod ?? 'غير محددة'}</strong>
        </div>
        <div>
          <span>التصنيف الفرعي</span>
          <strong>{expense.subcategory?.name ?? 'غير محدد'}</strong>
        </div>
        <div>
          <span>الكمية</span>
          <strong dir="ltr">{expense.quantity ?? 'غير محددة'}</strong>
        </div>
        <div>
          <span>الوحدة</span>
          <strong>{expense.unit ?? 'غير محددة'}</strong>
        </div>
        <div>
          <span>سعر الوحدة</span>
          <strong dir="ltr">
            {expense.unitPrice === null
              ? 'غير محدد'
              : formatMoney(expense.unitPrice)}
          </strong>
        </div>
        <div>
          <span>المصدر</span>
          <strong>
            {expense.source === 'WEB'
              ? 'من الموقع'
              : expense.source === 'TELEGRAM'
                ? 'من تيليجرام'
                : 'من استيراد Excel'}
          </strong>
        </div>
      </section>
      {(expense.notes !== null ||
        expense.importFileName !== null ||
        expense.telegramChatId !== null) && (
        <section className="expense-readonly-notes">
          {expense.notes !== null && (
            <p>
              <strong>الملاحظات:</strong> {expense.notes}
            </p>
          )}
          {expense.importFileName !== null && (
            <p>
              <strong>مرجع الاستيراد:</strong> {expense.importFileName}
              {expense.importSheet === null ? '' : ` — ${expense.importSheet}`}
              {expense.importRow === null ? '' : ` — صف ${expense.importRow}`}
            </p>
          )}
          {expense.telegramChatId !== null && (
            <p>
              <strong>مرجع تيليجرام:</strong> {expense.telegramChatId}
              {expense.telegramMsgId === null
                ? ''
                : ` — رسالة ${expense.telegramMsgId}`}
            </p>
          )}
        </section>
      )}
      {!archived && !isDeleted && (
        <section className="edit-panel">
          <h2>تعديل المصروف</h2>
          <ExpenseForm
            action={updateExpenseAction.bind(null, expense.id)}
            categories={categories}
            initial={expense}
            mode="edit"
            payees={payees}
            projects={projects}
          />
        </section>
      )}
      <section className="attachment-panel">
        <div className="section-heading">
          <div>
            <h2>المرفقات</h2>
            <p>ملفات خاصة تحفظ خارج قاعدة البيانات.</p>
          </div>
          <span>{expense.attachments.length} من 10</span>
        </div>
        {expense.attachments.length === 0 ? (
          <p className="settings-note">لا توجد مرفقات لهذا المصروف.</p>
        ) : (
          <ul className="attachment-list">
            {expense.attachments.map((attachment) => (
              <li key={attachment.id}>
                <div>
                  <strong>{attachment.originalName}</strong>
                  <span>{attachment.mimeType}</span>
                </div>
                <a
                  className="button button-quiet"
                  href={`/api/attachments/${attachment.id}/content`}
                >
                  تنزيل خاص
                </a>
              </li>
            ))}
          </ul>
        )}
        {!archived && !isDeleted && expense.attachments.length < 10 && (
          <AttachmentForm
            action={uploadAttachmentAction.bind(null, expense.id)}
          />
        )}
      </section>
    </div>
  );
}

import Link from 'next/link';
import { createExpenseAction } from '../actions';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { listCategories } from '@/lib/categories-api';
import { listPayees } from '@/lib/payees-api';
import { listProjects } from '@/lib/projects-api';

export default async function NewExpensePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly projectId?: string }>;
}) {
  const [{ projectId }, projects, categories, payees] = await Promise.all([
    searchParams,
    listProjects('ACTIVE'),
    listCategories('ALL'),
    listPayees('ALL'),
  ]);
  return (
    <div className="page-stack" dir="rtl">
      <Link className="back-link" href="/expenses">
        العودة إلى المصروفات
      </Link>
      <section className="detail-heading">
        <div>
          <p className="eyebrow">إدخال من الموقع</p>
          <h1>إضافة مصروف</h1>
          <p>المصدر يسجل تلقائيًا من الموقع ولا يمكن تغييره.</p>
        </div>
      </section>
      {projects.length === 0 ? (
        <section className="empty-state">
          <h2>لا يوجد مشروع نشط</h2>
          <p>أنشئ مشروعًا أو استعد مشروعًا مؤرشفًا قبل إضافة المصروف.</p>
          <Link className="button button-primary" href="/projects">
            فتح المشروعات
          </Link>
        </section>
      ) : (
        <section className="edit-panel">
          <ExpenseForm
            action={createExpenseAction}
            categories={categories}
            mode="create"
            payees={payees}
            projects={projects}
            {...(projectId ? { selectedProjectId: projectId } : {})}
          />
        </section>
      )}
    </div>
  );
}

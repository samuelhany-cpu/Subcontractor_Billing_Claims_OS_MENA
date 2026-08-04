import { listProjects } from '@/lib/projects-api';
import Link from 'next/link';
import { TransferForm } from '@/components/transfers/transfer-form';
import { createTransferAction } from '../actions';

export default async function NewTransferPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const projects = await listProjects('ACTIVE');

  return (
    <div className="page-stack create-panel" dir="rtl">
      <Link className="back-link" href="/transfers">
        العودة إلى التحويلات
      </Link>
      <h1>إضافة تحويل تمويلي جديد</h1>
      <p>تسجيل مبلغ تحويل وارد لصالح أحد المشروعات النشطة.</p>

      {projects.length === 0 ? (
        <section className="empty-state">
          <h2>لا توجد مشروعات نشطة</h2>
          <p>يلزم وجود مشروع نشط واحد على الأقل لتسجيل تحويل وارد.</p>
          <Link className="button button-primary" href="/projects">
            إدارة المشروعات
          </Link>
        </section>
      ) : (
        <TransferForm
          action={createTransferAction}
          mode="create"
          projects={projects}
          selectedProjectId={projectId}
        />
      )}
    </div>
  );
}

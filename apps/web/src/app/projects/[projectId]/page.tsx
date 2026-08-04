import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  updateProjectAction,
  archiveProjectAction,
  restoreProjectAction,
} from '../actions';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectSummary } from '@/components/projects/project-summary';
import { ProjectTransition } from '@/components/projects/project-transition';
import { formatDate, formatMoney } from '@/lib/project-format';
import { getProject, ProjectsApiError } from '@/lib/projects-api';

export default async function ProjectDetailPage({
  params,
}: {
  readonly params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  let project;
  try {
    project = await getProject(projectId);
  } catch (error: unknown) {
    if (error instanceof ProjectsApiError && error.status === 404) notFound();
    throw error;
  }
  const archived = project.status === 'ARCHIVED';
  return (
    <div className="page-stack">
      <Link className="back-link" href="/projects">
        العودة إلى المشروعات
      </Link>
      <Link
        className="button button-primary project-expenses-link"
        href={`/expenses?projectId=${project.id}`}
      >
        مصروفات المشروع
      </Link>
      <section className="detail-heading">
        <div>
          <span className={`status-badge ${archived ? 'archived' : ''}`}>
            {archived ? 'مؤرشف — للقراءة فقط' : 'نشط'}
          </span>
          <h1>{project.name}</h1>
          <p>
            الرصيد الافتتاحي:{' '}
            <strong dir="ltr">{formatMoney(project.openingBalance)}</strong>
          </p>
          <p>تاريخ الرصيد: {formatDate(project.openingBalanceDate)}</p>
        </div>
        <ProjectTransition
          mode={archived ? 'restore' : 'archive'}
          action={(archived ? restoreProjectAction : archiveProjectAction).bind(
            null,
            project.id,
          )}
        />
      </section>
      {archived && (
        <aside className="readonly-notice">
          هذا المشروع مؤرشف. جميع بياناته وإجمالياته محفوظة، ويمكن تعديله بعد
          الاستعادة.
        </aside>
      )}
      <ProjectSummary project={project} />
      {!archived && (
        <section className="edit-panel" aria-labelledby="edit-heading">
          <h2 id="edit-heading">تعديل بيانات المشروع</h2>
          <ProjectForm
            action={updateProjectAction.bind(null, project.id)}
            mode="edit"
            initial={{
              name: project.name,
              openingBalance: project.openingBalance,
              openingBalanceDate: project.openingBalanceDate,
            }}
          />
        </section>
      )}
    </div>
  );
}

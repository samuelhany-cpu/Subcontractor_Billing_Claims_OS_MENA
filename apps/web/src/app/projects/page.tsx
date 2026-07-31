import { ProjectFilter, ProjectFilterSchema } from '@claims-os/domain';
import { createProjectAction } from './actions';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectsList } from '@/components/projects/projects-list';
import { listProjects } from '@/lib/projects-api';

export default async function ProjectsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ status?: string }>;
}) {
  const rawStatus = (await searchParams).status;
  const filter: ProjectFilter = ProjectFilterSchema.catch('ACTIVE').parse(
    rawStatus ?? 'ACTIVE',
  );
  const projects = await listProjects(filter);
  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">المشروعات</p>
          <h1>تابع تمويل كل مشروع ومصروفاته بوضوح</h1>
          <p>
            أنشئ مشروعًا، حدّد رصيده الافتتاحي، واحتفظ بسجلات المشروعات المؤرشفة
            دون حذف.
          </p>
        </div>
      </section>
      <details
        className="create-panel"
        open={projects.length === 0 && filter !== 'ARCHIVED'}
      >
        <summary>إضافة مشروع جديد</summary>
        <ProjectForm action={createProjectAction} mode="create" />
      </details>
      <ProjectsList projects={projects} filter={filter} />
    </div>
  );
}

import { ProjectFilter, ProjectResponse } from '@claims-os/domain';
import Link from 'next/link';
import {
  archiveProjectAction,
  restoreProjectAction,
} from '@/app/projects/actions';
import { formatDate, formatMoney } from '@/lib/project-format';
import { ProjectTransition } from './project-transition';

const filters: readonly [ProjectFilter, string][] = [
  ['ACTIVE', 'النشطة'],
  ['ARCHIVED', 'المؤرشفة'],
  ['ALL', 'الكل'],
];

export function ProjectsList({
  projects,
  filter,
}: {
  readonly projects: readonly ProjectResponse[];
  readonly filter: ProjectFilter;
}) {
  return (
    <section aria-labelledby="projects-list-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">إدارة المشروعات</p>
          <h2 id="projects-list-heading">المشروعات</h2>
        </div>
        <nav className="filter-tabs" aria-label="تصفية المشروعات">
          {filters.map(([value, label]) => (
            <Link
              className={filter === value ? 'active' : ''}
              href={`/projects?status=${value}`}
              key={value}
              aria-current={filter === value ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>
            {filter === 'ARCHIVED'
              ? 'لا توجد مشروعات مؤرشفة'
              : 'ابدأ بإضافة مشروعك الأول'}
          </h3>
          <p>
            {filter === 'ARCHIVED'
              ? 'ستظهر هنا المشروعات التي تقوم بأرشفتها.'
              : 'أنشئ مشروعًا لتسجيل رصيده الافتتاحي ومتابعة إجمالياته.'}
          </p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const transition =
              project.status === 'ACTIVE'
                ? archiveProjectAction.bind(null, project.id)
                : restoreProjectAction.bind(null, project.id);
            return (
              <article
                className={`project-card ${project.status === 'ARCHIVED' ? 'archived' : ''}`}
                key={project.id}
              >
                <div className="project-card-heading">
                  <div>
                    <span
                      className={`status-badge ${project.status === 'ARCHIVED' ? 'archived' : ''}`}
                    >
                      {project.status === 'ACTIVE'
                        ? 'نشط'
                        : 'مؤرشف — للقراءة فقط'}
                    </span>
                    <h3>
                      <Link href={`/projects/${project.id}`}>
                        {project.name}
                      </Link>
                    </h3>
                  </div>
                  <ProjectTransition
                    mode={project.status === 'ACTIVE' ? 'archive' : 'restore'}
                    action={transition}
                  />
                </div>
                <dl className="project-metrics">
                  <div>
                    <dt>الرصيد الافتتاحي</dt>
                    <dd dir="ltr">{formatMoney(project.openingBalance)}</dd>
                  </div>
                  <div>
                    <dt>إجمالي التمويل</dt>
                    <dd dir="ltr">
                      {formatMoney(project.totals.totalFunding)}
                    </dd>
                  </div>
                  <div>
                    <dt>إجمالي المصروفات</dt>
                    <dd dir="ltr">
                      {formatMoney(project.totals.totalExpenses)}
                    </dd>
                  </div>
                  <div>
                    <dt>الرصيد المتبقي</dt>
                    <dd dir="ltr">
                      {formatMoney(project.totals.availableBalance)}
                    </dd>
                  </div>
                </dl>
                {project.status === 'ARCHIVED' && (
                  <p className="archive-date">
                    تاريخ الأرشفة:{' '}
                    {formatDate(project.archivedAt?.slice(0, 10) ?? null)}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

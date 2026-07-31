'use client';

import { ProjectResponse } from '@claims-os/domain';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export function ProjectSelector({
  projects,
}: {
  readonly projects: readonly ProjectResponse[];
}) {
  const router = useRouter();
  const params = useParams<{ projectId?: string }>();
  return (
    <div className="project-selector">
      <label htmlFor="project-selector">المشروع الحالي</label>
      <select
        id="project-selector"
        value={params.projectId ?? ''}
        onChange={(event) => {
          if (event.target.value !== '') {
            router.push(`/projects/${event.target.value}`);
          }
        }}
        disabled={projects.length === 0}
      >
        <option value="">
          {projects.length === 0 ? 'لا توجد مشروعات نشطة' : 'اختر مشروعًا'}
        </option>
        {projects.map((project) => (
          <option value={project.id} key={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <Link href="/projects?status=ARCHIVED">عرض المشروعات المؤرشفة</Link>
    </div>
  );
}

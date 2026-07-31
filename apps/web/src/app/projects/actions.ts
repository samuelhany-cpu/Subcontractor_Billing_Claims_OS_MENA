'use server';

import { CreateProjectSchema, UpdateProjectSchema } from '@claims-os/domain';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  emptyProjectFormState,
  ProjectFormState,
} from '@/lib/project-form-state';
import {
  archiveProject,
  createProject,
  ProjectsApiError,
  restoreProject,
  updateProject,
} from '@/lib/projects-api';

function optionalText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function validationState(
  issues: readonly { path: PropertyKey[]; message: string }[],
): ProjectFormState {
  return {
    error: 'راجع الحقول الموضحة ثم حاول مرة أخرى.',
    fieldErrors: Object.fromEntries(
      issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
    ),
  };
}

function apiMessage(error: unknown): string {
  if (error instanceof ProjectsApiError) {
    if (error.problem.code === 'PROJECT_NAME_CONFLICT') {
      return 'يوجد مشروع آخر بالاسم نفسه.';
    }
    if (error.problem.code === 'PROJECT_ARCHIVED') {
      return 'المشروع مؤرشف ولا يمكن تعديله قبل استعادته.';
    }
    if (error.problem.code === 'PROJECT_NOT_FOUND') {
      return 'تعذر العثور على المشروع.';
    }
    if (error.problem.code === 'PROJECT_STATE_CONFLICT') {
      return 'حالة المشروع تغيرت بالفعل. حدّث الصفحة وحاول مرة أخرى.';
    }
  }
  return 'تعذر الاتصال بالخدمة. تحقق من تشغيل الخادم ثم حاول مرة أخرى.';
}

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = CreateProjectSchema.safeParse({
    name: formData.get('name'),
    openingBalance: optionalText(formData, 'openingBalance'),
    openingBalanceDate: optionalText(formData, 'openingBalanceDate'),
  });
  if (!parsed.success) {
    return validationState(parsed.error.issues);
  }

  let projectId: string;
  try {
    projectId = (await createProject(parsed.data)).id;
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  revalidatePath('/projects');
  redirect(`/projects/${projectId}`);
}

export async function updateProjectAction(
  projectId: string,
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const date = optionalText(formData, 'openingBalanceDate');
  const parsed = UpdateProjectSchema.safeParse({
    name: formData.get('name'),
    openingBalance: formData.get('openingBalance'),
    openingBalanceDate: date ?? null,
  });
  if (!parsed.success) {
    return validationState(parsed.error.issues);
  }
  try {
    await updateProject(projectId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  return emptyProjectFormState;
}

export async function archiveProjectAction(projectId: string): Promise<void> {
  await archiveProject(projectId);
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
}

export async function restoreProjectAction(projectId: string): Promise<void> {
  await restoreProject(projectId);
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
}

import 'server-only';
import {
  CreateProjectRequest,
  ProjectFilter,
  ProjectResponse,
  UpdateProjectRequest,
} from '@claims-os/domain';

interface ProblemDetails {
  readonly code?: string;
  readonly detail?: string;
  readonly correlationId?: string;
}

export class ProjectsApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails,
  ) {
    super(problem.detail ?? 'Projects API request failed');
  }
}

const apiUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:4000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      ...(init?.body === undefined
        ? {}
        : { 'content-type': 'application/json' }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let problem: ProblemDetails = {};
    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      problem = {};
    }
    throw new ProjectsApiError(response.status, problem);
  }
  return (await response.json()) as T;
}

export function listProjects(
  filter: ProjectFilter,
): Promise<readonly ProjectResponse[]> {
  return request(`/projects?status=${encodeURIComponent(filter)}`);
}

export function getProject(projectId: string): Promise<ProjectResponse> {
  return request(`/projects/${encodeURIComponent(projectId)}`);
}

export function createProject(
  input: CreateProjectRequest,
): Promise<ProjectResponse> {
  return request('/projects', { method: 'POST', body: JSON.stringify(input) });
}

export function updateProject(
  projectId: string,
  input: UpdateProjectRequest,
): Promise<ProjectResponse> {
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveProject(projectId: string): Promise<ProjectResponse> {
  return request(`/projects/${encodeURIComponent(projectId)}/archive`, {
    method: 'POST',
  });
}

export function restoreProject(projectId: string): Promise<ProjectResponse> {
  return request(`/projects/${encodeURIComponent(projectId)}/restore`, {
    method: 'POST',
  });
}

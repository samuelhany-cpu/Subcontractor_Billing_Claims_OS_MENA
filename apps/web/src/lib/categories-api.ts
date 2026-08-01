import 'server-only';
import {
  CategoryResponse,
  ClassificationFilter,
  CreateCategoryRequest,
  CreateSubcategoryRequest,
  RenameCategoryRequest,
  RenameSubcategoryRequest,
  ReorderClassificationsRequest,
  SubcategoryResponse,
} from '@claims-os/domain';

interface ProblemDetails {
  readonly code?: string;
  readonly detail?: string;
  readonly correlationId?: string;
}

export class CategoriesApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails,
  ) {
    super(problem.detail ?? 'Categories API request failed');
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
    throw new CategoriesApiError(response.status, problem);
  }
  return (await response.json()) as T;
}

export function listCategories(
  filter: ClassificationFilter = 'ACTIVE',
): Promise<readonly CategoryResponse[]> {
  return request(`/categories?status=${encodeURIComponent(filter)}`);
}

export function createCategory(input: CreateCategoryRequest) {
  return request<CategoryResponse>('/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function renameCategory(
  categoryId: string,
  input: RenameCategoryRequest,
) {
  return request<CategoryResponse>(
    `/categories/${encodeURIComponent(categoryId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export function reorderCategories(input: ReorderClassificationsRequest) {
  return request<readonly CategoryResponse[]>('/categories/reorder', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function setCategoryActive(categoryId: string, active: boolean) {
  return request<CategoryResponse>(
    `/categories/${encodeURIComponent(categoryId)}/${active ? 'reactivate' : 'deactivate'}`,
    { method: 'POST' },
  );
}

export function createSubcategory(
  categoryId: string,
  input: CreateSubcategoryRequest,
) {
  return request<SubcategoryResponse>(
    `/categories/${encodeURIComponent(categoryId)}/subcategories`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function renameSubcategory(
  subcategoryId: string,
  input: RenameSubcategoryRequest,
) {
  return request<SubcategoryResponse>(
    `/subcategories/${encodeURIComponent(subcategoryId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export function reorderSubcategories(
  categoryId: string,
  input: ReorderClassificationsRequest,
) {
  return request<readonly SubcategoryResponse[]>(
    `/categories/${encodeURIComponent(categoryId)}/subcategories/reorder`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function setSubcategoryActive(subcategoryId: string, active: boolean) {
  return request<SubcategoryResponse>(
    `/subcategories/${encodeURIComponent(subcategoryId)}/${active ? 'reactivate' : 'deactivate'}`,
    { method: 'POST' },
  );
}

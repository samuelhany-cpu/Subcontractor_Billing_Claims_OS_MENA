import 'server-only';
import {
  AttachmentMetadata,
  CreateExpenseRequest,
  ExpenseListQuery,
  ExpenseListResponse,
  ExpenseResponse,
  UpdateExpenseRequest,
} from '@claims-os/domain';

interface ProblemDetails {
  readonly code?: string;
  readonly detail?: string;
  readonly correlationId?: string;
}

export class ExpensesApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails,
  ) {
    super(problem.detail ?? 'Expenses API request failed');
  }
}

const apiUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:4000/api/v1';

async function problem(response: Response): Promise<never> {
  let body: ProblemDetails = {};
  try {
    body = (await response.json()) as ProblemDetails;
  } catch {
    body = {};
  }
  throw new ExpensesApiError(response.status, body);
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (!response.ok) return problem(response);
  return (await response.json()) as T;
}

export function listExpenses(
  query: ExpenseListQuery,
): Promise<ExpenseListResponse> {
  const parameters = new URLSearchParams({
    sort: query.sort,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  for (const key of [
    'projectId',
    'from',
    'to',
    'categoryId',
    'subcategoryId',
    'payeeId',
    'paymentMethod',
    'source',
    'search',
  ] as const) {
    const value = query[key];
    if (value !== undefined) parameters.set(key, value);
  }
  return jsonRequest(`/expenses?${parameters.toString()}`);
}

export function getExpense(expenseId: string): Promise<ExpenseResponse> {
  return jsonRequest(`/expenses/${encodeURIComponent(expenseId)}`);
}

export function createExpense(input: CreateExpenseRequest) {
  return jsonRequest<ExpenseResponse>('/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateExpense(expenseId: string, input: UpdateExpenseRequest) {
  return jsonRequest<ExpenseResponse>(
    `/expenses/${encodeURIComponent(expenseId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export async function uploadExpenseAttachment(
  expenseId: string,
  file: File,
): Promise<AttachmentMetadata> {
  const data = new FormData();
  data.set('file', file);
  const response = await fetch(
    `${apiUrl}/expenses/${encodeURIComponent(expenseId)}/attachments`,
    { method: 'POST', body: data, cache: 'no-store' },
  );
  if (!response.ok) return problem(response);
  return (await response.json()) as AttachmentMetadata;
}

export function fetchAttachmentContent(
  attachmentId: string,
): Promise<Response> {
  return fetch(
    `${apiUrl}/attachments/${encodeURIComponent(attachmentId)}/content`,
    { cache: 'no-store' },
  );
}

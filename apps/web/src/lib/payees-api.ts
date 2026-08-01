import 'server-only';
import {
  AgreementRequest,
  AgreementResponse,
  CreatePayeeRequest,
  PayeeDetailResponse,
  PayeeFilter,
  PayeeResponse,
  UpdatePayeeRequest,
} from '@claims-os/domain';

interface ProblemDetails {
  readonly code?: string;
  readonly detail?: string;
  readonly correlationId?: string;
}

export class PayeesApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails,
  ) {
    super(problem.detail ?? 'Payees API request failed');
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
    throw new PayeesApiError(response.status, problem);
  }
  return (await response.json()) as T;
}

export function listPayees(
  status: PayeeFilter = 'ACTIVE',
  search?: string,
): Promise<readonly PayeeResponse[]> {
  const query = new URLSearchParams({ status });
  if (search !== undefined && search !== '') query.set('search', search);
  return request(`/payees?${query.toString()}`);
}

export function getPayee(payeeId: string): Promise<PayeeDetailResponse> {
  return request(`/payees/${encodeURIComponent(payeeId)}`);
}

export function createPayee(input: CreatePayeeRequest) {
  return request<PayeeResponse>('/payees', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePayee(payeeId: string, input: UpdatePayeeRequest) {
  return request<PayeeResponse>(`/payees/${encodeURIComponent(payeeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function setPayeeActive(payeeId: string, active: boolean) {
  return request<PayeeResponse>(
    `/payees/${encodeURIComponent(payeeId)}/${active ? 'reactivate' : 'deactivate'}`,
    { method: 'POST' },
  );
}

export function createAgreement(
  projectId: string,
  payeeId: string,
  input: AgreementRequest,
) {
  return request<AgreementResponse>(
    `/projects/${encodeURIComponent(projectId)}/payees/${encodeURIComponent(payeeId)}/agreement`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function updateAgreement(
  projectId: string,
  payeeId: string,
  input: AgreementRequest,
) {
  return request<AgreementResponse>(
    `/projects/${encodeURIComponent(projectId)}/payees/${encodeURIComponent(payeeId)}/agreement`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

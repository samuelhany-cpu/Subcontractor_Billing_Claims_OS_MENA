import {
  CreateTransferRequest,
  TransferListQuery,
  TransferListResponse,
  TransferResponse,
  UpdateTransferRequest,
} from '@claims-os/domain';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api/v1';

export class TransfersApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'TransfersApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let payload: { code?: string; message?: string } = {};
    try {
      payload = (await response.json()) as { code?: string; message?: string };
    } catch {
      // Ignore JSON parse errors
    }
    throw new TransfersApiError(
      response.status,
      payload.code ?? 'TRANSFER_API_ERROR',
      payload.message ?? 'حدث خطأ أثناء التواصل مع خادم التحويلات',
    );
  }

  return response.json() as Promise<T>;
}

export async function listTransfers(
  query: Partial<TransferListQuery> = {},
): Promise<TransferListResponse> {
  const params = new URLSearchParams();
  if (query.projectId) params.set('projectId', query.projectId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.status) params.set('status', query.status);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const queryStr = params.toString();
  return request<TransferListResponse>(
    `/transfers${queryStr ? `?${queryStr}` : ''}`,
  );
}

export async function createTransfer(
  data: CreateTransferRequest,
): Promise<TransferResponse> {
  return request<TransferResponse>('/transfers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTransfer(id: string): Promise<TransferResponse> {
  return request<TransferResponse>(`/transfers/${id}`);
}

export async function updateTransfer(
  id: string,
  data: UpdateTransferRequest,
): Promise<TransferResponse> {
  return request<TransferResponse>(`/transfers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTransfer(id: string): Promise<TransferResponse> {
  return request<TransferResponse>(`/transfers/${id}/delete`, {
    method: 'POST',
  });
}

export async function restoreTransfer(id: string): Promise<TransferResponse> {
  return request<TransferResponse>(`/transfers/${id}/restore`, {
    method: 'POST',
  });
}

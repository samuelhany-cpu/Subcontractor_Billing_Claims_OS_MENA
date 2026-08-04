'use server';

import {
  createTransfer,
  deleteTransfer,
  restoreTransfer,
  updateTransfer,
} from '@/lib/transfers-api';
import { CreateTransferSchema, UpdateTransferSchema } from '@claims-os/domain';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface TransferActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function createTransferAction(
  _prevState: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  const rawData = {
    projectId: formData.get('projectId') as string,
    transferDate: formData.get('transferDate') as string,
    amount: formData.get('amount') as string,
  };

  const validation = CreateTransferSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  let created;
  try {
    created = await createTransfer(validation.data);
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'تعذر إضافة التحويل',
    };
  }

  revalidatePath('/transfers');
  revalidatePath('/projects');
  revalidatePath(`/projects/${created.projectId}`);
  redirect('/transfers');
}

export async function updateTransferAction(
  transferId: string,
  _prevState: TransferActionState,
  formData: FormData,
): Promise<TransferActionState> {
  const rawData: Record<string, string> = {};
  const transferDate = formData.get('transferDate') as string;
  const amount = formData.get('amount') as string;

  if (transferDate) rawData.transferDate = transferDate;
  if (amount) rawData.amount = amount;

  const validation = UpdateTransferSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  let updated;
  try {
    updated = await updateTransfer(transferId, validation.data);
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'تعذر تعديل التحويل',
    };
  }

  revalidatePath('/transfers');
  revalidatePath(`/transfers/${transferId}`);
  revalidatePath('/projects');
  revalidatePath(`/projects/${updated.projectId}`);
  return { success: true };
}

export async function deleteTransferAction(
  transferId: string,
  _prevState: TransferActionState,
): Promise<TransferActionState> {
  let deleted;
  try {
    deleted = await deleteTransfer(transferId);
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'تعذر حذف التحويل',
    };
  }

  revalidatePath('/transfers');
  revalidatePath(`/transfers/${transferId}`);
  revalidatePath('/projects');
  revalidatePath(`/projects/${deleted.projectId}`);
  return { success: true };
}

export async function restoreTransferAction(
  transferId: string,
  _prevState: TransferActionState,
): Promise<TransferActionState> {
  let restored;
  try {
    restored = await restoreTransfer(transferId);
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'تعذر استعادة التحويل',
    };
  }

  revalidatePath('/transfers');
  revalidatePath(`/transfers/${transferId}`);
  revalidatePath('/projects');
  revalidatePath(`/projects/${restored.projectId}`);
  return { success: true };
}

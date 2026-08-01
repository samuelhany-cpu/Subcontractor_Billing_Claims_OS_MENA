'use server';

import {
  AgreementInputSchema,
  CreatePayeeSchema,
  UpdatePayeeSchema,
} from '@claims-os/domain';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { emptyPayeeFormState, PayeeFormState } from '@/lib/payee-form-state';
import {
  createAgreement,
  createPayee,
  PayeesApiError,
  setPayeeActive,
  updateAgreement,
  updatePayee,
} from '@/lib/payees-api';

function validationState(
  issues: readonly { path: PropertyKey[]; message: string }[],
): PayeeFormState {
  return {
    error: 'راجع الحقول الموضحة ثم حاول مرة أخرى.',
    fieldErrors: Object.fromEntries(
      issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
    ),
  };
}

function apiMessage(error: unknown): string {
  if (error instanceof PayeesApiError) {
    if (error.problem.code === 'PAYEE_NOT_FOUND')
      return 'تعذر العثور على المستفيد.';
    if (error.problem.code === 'AGREEMENT_NOT_FOUND')
      return 'لا توجد اتفاقية لتعديلها.';
    if (error.problem.code === 'AGREEMENT_CONFLICT')
      return 'توجد اتفاقية بالفعل بين هذا المستفيد والمشروع.';
    if (error.problem.code === 'PAYEE_STATE_CONFLICT')
      return 'حالة المستفيد تغيرت بالفعل. حدّث الصفحة وحاول مرة أخرى.';
    if (error.problem.code === 'PAYEE_INACTIVE')
      return 'المستفيد غير نشط. فعّله قبل تعديل الاتفاقية.';
    if (error.problem.code === 'PROJECT_ARCHIVED')
      return 'المشروع مؤرشف وللقراءة فقط حتى تتم استعادته.';
    if (error.problem.code === 'PROJECT_NOT_FOUND')
      return 'تعذر العثور على المشروع.';
  }
  return 'تعذر الاتصال بالخدمة. تحقق من تشغيل الخادم ثم حاول مرة أخرى.';
}

function payeePayload(formData: FormData) {
  return {
    name: formData.get('name'),
    type: formData.get('type'),
    specialty: formData.get('specialty'),
    phone: formData.get('phone'),
    companyName: formData.get('companyName'),
    notes: formData.get('notes'),
  };
}

export async function createPayeeAction(
  _state: PayeeFormState,
  formData: FormData,
): Promise<PayeeFormState> {
  const parsed = CreatePayeeSchema.safeParse(payeePayload(formData));
  if (!parsed.success) return validationState(parsed.error.issues);
  let id: string;
  try {
    id = (await createPayee(parsed.data)).id;
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  revalidatePath('/payees');
  redirect(`/payees/${id}`);
}

export async function updatePayeeAction(
  payeeId: string,
  _state: PayeeFormState,
  formData: FormData,
): Promise<PayeeFormState> {
  const parsed = UpdatePayeeSchema.safeParse(payeePayload(formData));
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    await updatePayee(payeeId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  revalidatePath('/payees');
  revalidatePath(`/payees/${payeeId}`);
  return { ...emptyPayeeFormState, success: 'تم حفظ بيانات المستفيد.' };
}

export async function setPayeeActivityAction(
  payeeId: string,
  active: boolean,
): Promise<{ readonly error: string | null }> {
  try {
    await setPayeeActive(payeeId, active);
  } catch (error: unknown) {
    return { error: apiMessage(error) };
  }
  revalidatePath('/payees');
  revalidatePath(`/payees/${payeeId}`);
  return { error: null };
}

async function agreementAction(
  mode: 'create' | 'update',
  payeeId: string,
  projectId: string,
  formData: FormData,
): Promise<PayeeFormState> {
  const parsed = AgreementInputSchema.safeParse({
    totalAmount: formData.get('totalAmount'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    if (mode === 'create')
      await createAgreement(projectId, payeeId, parsed.data);
    else await updateAgreement(projectId, payeeId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  revalidatePath(`/payees/${payeeId}`);
  return {
    ...emptyPayeeFormState,
    success: mode === 'create' ? 'تم إنشاء الاتفاقية.' : 'تم تحديث الاتفاقية.',
  };
}

export async function createAgreementAction(
  payeeId: string,
  _state: PayeeFormState,
  formData: FormData,
): Promise<PayeeFormState> {
  const projectId = formData.get('projectId');
  if (typeof projectId !== 'string' || projectId === '')
    return {
      error: 'اختر المشروع.',
      fieldErrors: { projectId: 'المشروع مطلوب' },
    };
  return agreementAction('create', payeeId, projectId, formData);
}

export async function updateAgreementAction(
  payeeId: string,
  projectId: string,
  _state: PayeeFormState,
  formData: FormData,
): Promise<PayeeFormState> {
  return agreementAction('update', payeeId, projectId, formData);
}

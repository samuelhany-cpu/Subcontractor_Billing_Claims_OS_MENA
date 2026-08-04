'use server';

import { CreateExpenseSchema, UpdateExpenseSchema } from '@claims-os/domain';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  emptyExpenseFormState,
  ExpenseFormState,
} from '@/lib/expense-form-state';
import {
  createExpense,
  ExpensesApiError,
  updateExpense,
  uploadExpenseAttachment,
} from '@/lib/expenses-api';

function validationState(
  issues: readonly { path: PropertyKey[]; message: string }[],
): ExpenseFormState {
  return {
    error: 'راجع الحقول الموضحة ثم حاول مرة أخرى.',
    fieldErrors: Object.fromEntries(
      issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
    ),
    success: null,
  };
}

function apiMessage(error: unknown): string {
  if (error instanceof ExpensesApiError) {
    const messages: Readonly<Record<string, string>> = {
      EXPENSE_NOT_FOUND: 'تعذر العثور على المصروف.',
      PROJECT_NOT_FOUND: 'تعذر العثور على المشروع.',
      PROJECT_ARCHIVED: 'المشروع مؤرشف وللقراءة فقط حتى تتم استعادته.',
      EXPENSE_AMOUNT_INVALID: 'راجع القيمة أو الكمية وسعر الوحدة.',
      EXPENSE_CATEGORY_NOT_FOUND: 'الفئة المحددة غير موجودة.',
      EXPENSE_CATEGORY_INACTIVE: 'الفئة المحددة غير نشطة.',
      EXPENSE_SUBCATEGORY_NOT_FOUND: 'التصنيف الفرعي غير موجود.',
      EXPENSE_SUBCATEGORY_MISMATCH: 'التصنيف الفرعي لا يتبع الفئة المحددة.',
      EXPENSE_SUBCATEGORY_INACTIVE: 'التصنيف الفرعي غير متاح للإسناد الجديد.',
      EXPENSE_PAYEE_NOT_FOUND: 'المورد أو الصنايعي المحدد غير موجود.',
      EXPENSE_PAYEE_INACTIVE: 'المورد أو الصنايعي المحدد غير نشط.',
      ATTACHMENT_REQUIRED: 'اختر ملفًا غير فارغ.',
      ATTACHMENT_MIME_UNSUPPORTED: 'نوع الملف غير مدعوم أو لا يطابق محتواه.',
      ATTACHMENT_TOO_LARGE: 'حجم الملف أكبر من 10 ميجابايت.',
      ATTACHMENT_LIMIT_REACHED: 'وصل المصروف إلى الحد الأقصى للمرفقات.',
      ATTACHMENT_STORAGE_UNAVAILABLE: 'خدمة المرفقات غير متاحة الآن.',
    };
    const message = error.problem.code
      ? messages[error.problem.code]
      : undefined;
    if (message !== undefined) return message;
  }
  return 'تعذر الاتصال بالخدمة. تحقق من تشغيل الخادم ثم حاول مرة أخرى.';
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function optionalDecimal(formData: FormData, name: string): string | undefined {
  const value = text(formData, name).trim();
  return value === '' ? undefined : value;
}

function optionalId(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  return value === '' ? null : value;
}

function payload(formData: FormData, includeProject: boolean) {
  const quantityValue = optionalDecimal(formData, 'quantity');
  const unitPriceValue = optionalDecimal(formData, 'unitPrice');
  const quantity = quantityValue ?? (includeProject ? undefined : null);
  const unitPrice = unitPriceValue ?? (includeProject ? undefined : null);
  const calculated =
    quantityValue !== undefined && unitPriceValue !== undefined;
  const categoryId = text(formData, 'categoryId');
  return {
    ...(includeProject ? { projectId: text(formData, 'projectId') } : {}),
    expenseDate: text(formData, 'expenseDate'),
    description: text(formData, 'description'),
    ...(includeProject || categoryId !== '' ? { categoryId } : {}),
    subcategoryId: optionalId(formData, 'subcategoryId'),
    payeeId: optionalId(formData, 'payeeId'),
    invoiceNumber: text(formData, 'invoiceNumber'),
    quantity,
    unit: text(formData, 'unit'),
    unitPrice,
    amount: calculated
      ? includeProject
        ? undefined
        : null
      : optionalDecimal(formData, 'amount'),
    paymentMethod: text(formData, 'paymentMethod'),
    notes: text(formData, 'notes'),
  };
}

export async function createExpenseAction(
  _state: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsed = CreateExpenseSchema.safeParse(payload(formData, true));
  if (!parsed.success) return validationState(parsed.error.issues);
  let expenseId: string;
  try {
    expenseId = (await createExpense(parsed.data)).id;
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {}, success: null };
  }
  revalidatePath('/expenses');
  revalidatePath('/projects');
  revalidatePath('/payees');
  redirect(`/expenses/${expenseId}`);
}

export async function updateExpenseAction(
  expenseId: string,
  _state: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsed = UpdateExpenseSchema.safeParse(payload(formData, false));
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    await updateExpense(expenseId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {}, success: null };
  }
  revalidatePath('/expenses');
  revalidatePath(`/expenses/${expenseId}`);
  revalidatePath('/projects');
  revalidatePath('/payees');
  return {
    ...emptyExpenseFormState,
    success: 'تم حفظ تعديلات المصروف وتحديث الإجماليات.',
  };
}

export async function uploadAttachmentAction(
  expenseId: string,
  _state: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return {
      error: 'اختر ملفًا غير فارغ.',
      fieldErrors: { file: 'المرفق مطلوب' },
      success: null,
    };
  }
  try {
    await uploadExpenseAttachment(expenseId, file);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {}, success: null };
  }
  revalidatePath(`/expenses/${expenseId}`);
  return {
    ...emptyExpenseFormState,
    success: 'تمت إضافة المرفق بصورة خاصة وآمنة.',
  };
}

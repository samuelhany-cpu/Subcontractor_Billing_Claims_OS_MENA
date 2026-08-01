'use server';

import {
  CreateCategorySchema,
  CreateSubcategorySchema,
  RenameCategorySchema,
  RenameSubcategorySchema,
  ReorderClassificationsSchema,
} from '@claims-os/domain';
import { revalidatePath } from 'next/cache';
import {
  ClassificationFormState,
  ClassificationMutationResult,
} from '@/lib/category-form-state';
import {
  CategoriesApiError,
  createCategory,
  createSubcategory,
  renameCategory,
  renameSubcategory,
  reorderCategories,
  reorderSubcategories,
  setCategoryActive,
  setSubcategoryActive,
} from '@/lib/categories-api';

function validationState(
  issues: readonly { path: PropertyKey[]; message: string }[],
): ClassificationFormState {
  return {
    error: 'راجع الحقول الموضحة ثم حاول مرة أخرى.',
    fieldErrors: Object.fromEntries(
      issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
    ),
  };
}

function apiMessage(error: unknown): string {
  if (error instanceof CategoriesApiError) {
    if (error.problem.code === 'CATEGORY_NAME_CONFLICT') {
      return 'توجد فئة أخرى بالاسم نفسه.';
    }
    if (error.problem.code === 'SUBCATEGORY_NAME_CONFLICT') {
      return 'يوجد تصنيف فرعي آخر بالاسم نفسه داخل هذه الفئة.';
    }
    if (
      error.problem.code === 'CATEGORY_NOT_FOUND' ||
      error.problem.code === 'SUBCATEGORY_NOT_FOUND'
    ) {
      return 'تعذر العثور على التصنيف. حدّث الصفحة وحاول مرة أخرى.';
    }
    if (error.problem.code === 'CLASSIFICATION_STATE_CONFLICT') {
      return 'حالة التصنيف تغيرت بالفعل. حدّث الصفحة وحاول مرة أخرى.';
    }
    if (error.problem.code === 'INVALID_REORDER') {
      return 'تغيرت القائمة على الخادم. أُعيد تحميل ترتيبها الحالي.';
    }
  }
  return 'تعذر الاتصال بالخدمة. تحقق من تشغيل الخادم ثم حاول مرة أخرى.';
}

function refreshCategories(): void {
  revalidatePath('/settings/categories');
}

export async function createCategoryAction(
  _state: ClassificationFormState,
  formData: FormData,
): Promise<ClassificationFormState> {
  const parsed = CreateCategorySchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    await createCategory(parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  refreshCategories();
  return { error: null, fieldErrors: {}, success: 'تمت إضافة الفئة.' };
}

export async function renameCategoryAction(
  categoryId: string,
  _state: ClassificationFormState,
  formData: FormData,
): Promise<ClassificationFormState> {
  const parsed = RenameCategorySchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    await renameCategory(categoryId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  refreshCategories();
  return { error: null, fieldErrors: {}, success: 'تم تعديل الاسم.' };
}

export async function createSubcategoryAction(
  categoryId: string,
  _state: ClassificationFormState,
  formData: FormData,
): Promise<ClassificationFormState> {
  const parsed = CreateSubcategorySchema.safeParse({
    name: formData.get('name'),
  });
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    await createSubcategory(categoryId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  refreshCategories();
  return { error: null, fieldErrors: {}, success: 'تمت إضافة التصنيف الفرعي.' };
}

export async function renameSubcategoryAction(
  subcategoryId: string,
  _state: ClassificationFormState,
  formData: FormData,
): Promise<ClassificationFormState> {
  const parsed = RenameSubcategorySchema.safeParse({
    name: formData.get('name'),
  });
  if (!parsed.success) return validationState(parsed.error.issues);
  try {
    await renameSubcategory(subcategoryId, parsed.data);
  } catch (error: unknown) {
    return { error: apiMessage(error), fieldErrors: {} };
  }
  refreshCategories();
  return { error: null, fieldErrors: {}, success: 'تم تعديل الاسم.' };
}

export async function reorderCategoriesAction(
  orderedIds: readonly string[],
): Promise<ClassificationMutationResult> {
  const parsed = ReorderClassificationsSchema.safeParse({ orderedIds });
  if (!parsed.success) return { error: 'ترتيب الفئات غير صحيح.' };
  try {
    await reorderCategories(parsed.data);
    refreshCategories();
    return { error: null };
  } catch (error: unknown) {
    return { error: apiMessage(error) };
  }
}

export async function reorderSubcategoriesAction(
  categoryId: string,
  orderedIds: readonly string[],
): Promise<ClassificationMutationResult> {
  const parsed = ReorderClassificationsSchema.safeParse({ orderedIds });
  if (!parsed.success) return { error: 'ترتيب التصنيفات الفرعية غير صحيح.' };
  try {
    await reorderSubcategories(categoryId, parsed.data);
    refreshCategories();
    return { error: null };
  } catch (error: unknown) {
    return { error: apiMessage(error) };
  }
}

export async function setCategoryActivityAction(
  categoryId: string,
  active: boolean,
): Promise<ClassificationMutationResult> {
  try {
    await setCategoryActive(categoryId, active);
    refreshCategories();
    return { error: null };
  } catch (error: unknown) {
    return { error: apiMessage(error) };
  }
}

export async function setSubcategoryActivityAction(
  subcategoryId: string,
  active: boolean,
): Promise<ClassificationMutationResult> {
  try {
    await setSubcategoryActive(subcategoryId, active);
    refreshCategories();
    return { error: null };
  } catch (error: unknown) {
    return { error: apiMessage(error) };
  }
}

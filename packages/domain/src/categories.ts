import { z } from 'zod';

export const classificationFilters = ['ACTIVE', 'INACTIVE', 'ALL'] as const;
export const ClassificationFilterSchema = z.enum(classificationFilters);
export type ClassificationFilter = z.infer<typeof ClassificationFilterSchema>;

export const CategoryIdSchema = z.uuid('معرّف الفئة غير صحيح');
export const SubcategoryIdSchema = z.uuid('معرّف التصنيف الفرعي غير صحيح');

const classificationName = z
  .string()
  .trim()
  .min(1, 'الاسم مطلوب')
  .max(120, 'الاسم يجب ألا يتجاوز 120 حرفًا');

export const CreateCategorySchema = z
  .object({ name: classificationName })
  .strict();
export const RenameCategorySchema = z
  .object({ name: classificationName })
  .strict();
export const CreateSubcategorySchema = z
  .object({ name: classificationName })
  .strict();
export const RenameSubcategorySchema = z
  .object({ name: classificationName })
  .strict();

export const ReorderClassificationsSchema = z
  .object({ orderedIds: z.array(z.uuid('معرّف الترتيب غير صحيح')).min(1) })
  .strict()
  .refine(({ orderedIds }) => new Set(orderedIds).size === orderedIds.length, {
    message: 'لا يجوز تكرار أي معرّف في ترتيب واحد',
    path: ['orderedIds'],
  });

export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>;
export type RenameCategoryRequest = z.infer<typeof RenameCategorySchema>;
export type CreateSubcategoryRequest = z.infer<typeof CreateSubcategorySchema>;
export type RenameSubcategoryRequest = z.infer<typeof RenameSubcategorySchema>;
export type ReorderClassificationsRequest = z.infer<
  typeof ReorderClassificationsSchema
>;

export interface SubcategoryResponse {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CategoryResponse {
  readonly id: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly subcategories: readonly SubcategoryResponse[];
}

export interface ClassificationOption {
  readonly id: string;
  readonly name: string;
  readonly subcategories: readonly Pick<
    SubcategoryResponse,
    'id' | 'categoryId' | 'name'
  >[];
}

export const UNCLASSIFIED_LABEL = 'غير مصنف' as const;

export function classificationDisplayName(name: string | null): string {
  return name ?? UNCLASSIFIED_LABEL;
}

export function toClassificationOptions(
  categories: readonly CategoryResponse[],
): readonly ClassificationOption[] {
  return categories
    .filter((category) => category.isActive)
    .map((category) => ({
      id: category.id,
      name: category.name,
      subcategories: category.subcategories
        .filter((subcategory) => subcategory.isActive)
        .map(({ id, categoryId, name }) => ({ id, categoryId, name })),
    }));
}

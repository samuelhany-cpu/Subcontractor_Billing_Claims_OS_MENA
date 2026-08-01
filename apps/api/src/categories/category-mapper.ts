import { CategoryResponse, SubcategoryResponse } from '@claims-os/domain';
import { Category, Prisma, Subcategory } from '@prisma/client';

export type CategoryTree = Prisma.CategoryGetPayload<{
  include: { subcategories: true };
}>;

export function mapSubcategory(subcategory: Subcategory): SubcategoryResponse {
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: subcategory.name,
    sortOrder: subcategory.sortOrder,
    isActive: subcategory.isActive,
    createdAt: subcategory.createdAt.toISOString(),
    updatedAt: subcategory.updatedAt.toISOString(),
  };
}

export function mapCategory(category: CategoryTree): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    subcategories: category.subcategories.map(mapSubcategory),
  };
}

export function categorySnapshot(
  operation: string,
  category: Category,
): Readonly<Record<string, unknown>> {
  return {
    operation,
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

export function subcategorySnapshot(
  operation: string,
  subcategory: Subcategory,
): Readonly<Record<string, unknown>> {
  return {
    operation,
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: subcategory.name,
    sortOrder: subcategory.sortOrder,
    isActive: subcategory.isActive,
  };
}

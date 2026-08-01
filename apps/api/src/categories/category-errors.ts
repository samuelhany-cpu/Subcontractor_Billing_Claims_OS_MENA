import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ZodType } from 'zod';

export function parseCategoryRequest<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed.',
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`,
    ),
  });
}

export const categoryNotFound = () =>
  new NotFoundException({
    code: 'CATEGORY_NOT_FOUND',
    message: 'Category was not found.',
  });
export const subcategoryNotFound = () =>
  new NotFoundException({
    code: 'SUBCATEGORY_NOT_FOUND',
    message: 'Subcategory was not found.',
  });
export const categoryNameConflict = () =>
  new ConflictException({
    code: 'CATEGORY_NAME_CONFLICT',
    message: 'A category with this name already exists.',
  });
export const subcategoryNameConflict = () =>
  new ConflictException({
    code: 'SUBCATEGORY_NAME_CONFLICT',
    message: 'A subcategory with this name already exists in the category.',
  });
export const classificationStateConflict = () =>
  new ConflictException({
    code: 'CLASSIFICATION_STATE_CONFLICT',
    message: 'The classification is already in the requested state.',
  });
export const invalidReorder = (message: string) =>
  new BadRequestException({ code: 'INVALID_REORDER', message });

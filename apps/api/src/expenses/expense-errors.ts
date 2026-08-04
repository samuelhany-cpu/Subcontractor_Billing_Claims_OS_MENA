import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ZodType } from 'zod';
import { parseRequest } from '../projects/project-errors';

export function parseExpenseRequest<T>(schema: ZodType<T>, value: unknown): T {
  return parseRequest(schema, value);
}

export function expenseNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'EXPENSE_NOT_FOUND',
    message: 'Expense was not found.',
  });
}

export function invalidExpenseAmount(message: string): BadRequestException {
  return new BadRequestException({
    code: 'EXPENSE_AMOUNT_INVALID',
    message,
  });
}

export function categoryNotFound(): BadRequestException {
  return new BadRequestException({
    code: 'EXPENSE_CATEGORY_NOT_FOUND',
    message: 'The selected category was not found.',
  });
}

export function categoryInactive(): ConflictException {
  return new ConflictException({
    code: 'EXPENSE_CATEGORY_INACTIVE',
    message: 'The selected category is inactive.',
  });
}

export function subcategoryNotFound(): BadRequestException {
  return new BadRequestException({
    code: 'EXPENSE_SUBCATEGORY_NOT_FOUND',
    message: 'The selected subcategory was not found.',
  });
}

export function subcategoryMismatch(): BadRequestException {
  return new BadRequestException({
    code: 'EXPENSE_SUBCATEGORY_MISMATCH',
    message: 'The selected subcategory does not belong to the category.',
  });
}

export function subcategoryInactive(): ConflictException {
  return new ConflictException({
    code: 'EXPENSE_SUBCATEGORY_INACTIVE',
    message: 'The selected subcategory is unavailable for new assignments.',
  });
}

export function payeeNotFound(): BadRequestException {
  return new BadRequestException({
    code: 'EXPENSE_PAYEE_NOT_FOUND',
    message: 'The selected payee was not found.',
  });
}

export function payeeInactive(): ConflictException {
  return new ConflictException({
    code: 'EXPENSE_PAYEE_INACTIVE',
    message: 'The selected payee is inactive.',
  });
}

export function attachmentNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'ATTACHMENT_NOT_FOUND',
    message: 'Attachment was not found.',
  });
}

export function attachmentRequired(): BadRequestException {
  return new BadRequestException({
    code: 'ATTACHMENT_REQUIRED',
    message: 'A non-empty file is required.',
  });
}

export function attachmentInvalid(message: string): BadRequestException {
  return new BadRequestException({
    code: 'ATTACHMENT_INVALID',
    message,
  });
}

export function attachmentMimeUnsupported(): UnsupportedMediaTypeException {
  return new UnsupportedMediaTypeException({
    code: 'ATTACHMENT_MIME_UNSUPPORTED',
    message: 'The attachment content type is not supported.',
  });
}

export function attachmentTooLarge(): PayloadTooLargeException {
  return new PayloadTooLargeException({
    code: 'ATTACHMENT_TOO_LARGE',
    message: 'The attachment exceeds the configured size limit.',
  });
}

export function attachmentLimitReached(): ConflictException {
  return new ConflictException({
    code: 'ATTACHMENT_LIMIT_REACHED',
    message: 'The Expense already has the maximum number of attachments.',
  });
}

export function attachmentStorageUnavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'ATTACHMENT_STORAGE_UNAVAILABLE',
    message: 'Private attachment storage is unavailable.',
  });
}

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ZodType } from 'zod';

export function parsePayeeRequest<T>(schema: ZodType<T>, value: unknown): T {
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

export const payeeNotFound = () =>
  new NotFoundException({
    code: 'PAYEE_NOT_FOUND',
    message: 'Payee was not found.',
  });
export const agreementNotFound = () =>
  new NotFoundException({
    code: 'AGREEMENT_NOT_FOUND',
    message: 'Agreement was not found.',
  });
export const agreementConflict = () =>
  new ConflictException({
    code: 'AGREEMENT_CONFLICT',
    message: 'An Agreement already exists for this Project and Payee.',
  });
export const payeeStateConflict = () =>
  new ConflictException({
    code: 'PAYEE_STATE_CONFLICT',
    message: 'The Payee is already in the requested state.',
  });
export const payeeInactive = () =>
  new ConflictException({
    code: 'PAYEE_INACTIVE',
    message: 'Inactive Payees cannot receive new Agreement changes.',
  });

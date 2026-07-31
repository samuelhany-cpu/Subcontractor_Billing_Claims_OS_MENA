import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ZodType } from 'zod';

export function parseRequest<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed.',
    errors: result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`,
    ),
  });
}

export function projectNotFound(): NotFoundException {
  return new NotFoundException({
    code: 'PROJECT_NOT_FOUND',
    message: 'Project was not found.',
  });
}

export function projectNameConflict(): ConflictException {
  return new ConflictException({
    code: 'PROJECT_NAME_CONFLICT',
    message: 'A project with this name already exists.',
  });
}

export function projectArchived(): ConflictException {
  return new ConflictException({
    code: 'PROJECT_ARCHIVED',
    message: 'Archived projects are read-only until restored.',
  });
}

export function invalidProjectTransition(message: string): ConflictException {
  return new ConflictException({
    code: 'PROJECT_STATE_CONFLICT',
    message,
  });
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CorrelationContext } from '../observability/correlation-context';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { ProblemDetails, ProblemFieldError } from './problem-details';

interface HttpExceptionBody {
  readonly code?: unknown;
  readonly error?: unknown;
  readonly errors?: unknown;
  readonly message?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: StructuredLoggerService,
    private readonly correlationContext: CorrelationContext,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const correlationId = this.correlationContext.getCorrelationId();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response
        .status(status)
        .type('application/problem+json')
        .send(this.expectedProblem(exception, status, correlationId));
      return;
    }

    this.logger.event('error', 'http.exception.unexpected', {
      errorName: exception instanceof Error ? exception.name : 'UnknownError',
    });

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      detail: 'An unexpected error occurred.',
      ...(correlationId === undefined ? {} : { correlationId }),
    };

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .type('application/problem+json')
      .send(problem);
  }

  private expectedProblem(
    exception: HttpException,
    status: number,
    correlationId: string | undefined,
  ): ProblemDetails {
    const raw = exception.getResponse();
    const body: HttpExceptionBody =
      typeof raw === 'object' && raw !== null ? raw : { message: raw };
    const statusTitle = HttpStatus[status];
    const title =
      typeof body.error === 'string'
        ? body.error
        : typeof statusTitle === 'string'
          ? statusTitle
              .toLowerCase()
              .replaceAll('_', ' ')
              .replace(/\b\w/g, (character) => character.toUpperCase())
          : 'HTTP Error';
    const detail = this.detailFrom(body.message, exception.message);
    const code =
      typeof body.code === 'string' ? body.code : `HTTP_${String(status)}`;
    const errors = this.fieldErrors(body.errors ?? body.message);

    return {
      type: 'about:blank',
      title,
      status,
      code,
      detail,
      ...(correlationId === undefined ? {} : { correlationId }),
      ...(errors === undefined ? {} : { errors }),
    };
  }

  private detailFrom(value: unknown, fallback: string): string {
    if (typeof value === 'string') {
      return value;
    }
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      return 'Request validation failed.';
    }
    return fallback;
  }

  private fieldErrors(
    value: unknown,
  ): readonly ProblemFieldError[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const messages = value.filter(
      (item): item is string => typeof item === 'string',
    );
    return messages.length === 0
      ? undefined
      : messages.map((message) => ({ message }));
  }
}

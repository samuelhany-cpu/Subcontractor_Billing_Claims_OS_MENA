import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CorrelationContext } from '../observability/correlation-context';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { HttpExceptionFilter } from './http-exception.filter';

function createFixture() {
  const send = jest.fn<void, [unknown]>();
  const response = {
    status: jest.fn(),
    type: jest.fn(),
    send,
  };
  response.status.mockReturnValue(response);
  response.type.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
    }),
  } as unknown as ArgumentsHost;
  const context = new CorrelationContext();
  const event = jest.fn();
  const logger = { event } as unknown as StructuredLoggerService;
  const filter = new HttpExceptionFilter(logger, context);
  return { context, event, filter, host, response, send };
}

describe('HttpExceptionFilter', () => {
  it('preserves expected HTTP status and emits RFC 7807 details', () => {
    const fixture = createFixture();

    fixture.context.run('request-http-400', () => {
      fixture.filter.catch(
        new HttpException(
          {
            code: 'REQUEST_REJECTED',
            error: 'Bad Request',
            message: 'The request was rejected.',
          },
          HttpStatus.BAD_REQUEST,
        ),
        fixture.host,
      );
    });

    expect(fixture.response.status).toHaveBeenCalledWith(400);
    expect(fixture.response.type).toHaveBeenCalledWith(
      'application/problem+json',
    );
    expect(fixture.response.send).toHaveBeenCalledWith({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'REQUEST_REJECTED',
      detail: 'The request was rejected.',
      correlationId: 'request-http-400',
    });
    expect(fixture.event).not.toHaveBeenCalled();
  });

  it('preserves validation messages as field-error entries', () => {
    const fixture = createFixture();

    fixture.filter.catch(
      new BadRequestException({
        error: 'Bad Request',
        message: ['name must not be empty', 'port must be an integer'],
      }),
      fixture.host,
    );

    expect(fixture.response.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'HTTP_400',
        detail: 'Request validation failed.',
        errors: [
          { message: 'name must not be empty' },
          { message: 'port must be an integer' },
        ],
      }),
    );
  });

  it('sanitizes unexpected errors, omits stacks, and logs once', () => {
    const fixture = createFixture();
    const exception = new Error('redis://:do-not-expose@internal-redis:6379/0');

    fixture.context.run('request-http-500', () => {
      fixture.filter.catch(exception, fixture.host);
    });

    expect(fixture.response.status).toHaveBeenCalledWith(500);
    const problem = fixture.send.mock.calls[0]?.[0];
    const serialized = JSON.stringify(problem);
    expect(problem).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      detail: 'An unexpected error occurred.',
      correlationId: 'request-http-500',
    });
    expect(serialized).not.toContain('do-not-expose');
    expect(serialized).not.toContain('stack');
    expect(fixture.event).toHaveBeenCalledTimes(1);
    expect(fixture.event).toHaveBeenCalledWith(
      'error',
      'http.exception.unexpected',
      { errorName: 'Error' },
    );
  });
});

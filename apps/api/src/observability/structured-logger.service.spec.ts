import { REDACTED_VALUE } from '../config/api-config';
import type { Logger } from 'pino';
import { CorrelationContext } from './correlation-context';
import {
  sanitizeLogValue,
  StructuredLoggerService,
} from './structured-logger.service';

describe('sanitizeLogValue', () => {
  it('redacts credential, authentication, cookie, and password-like fields', () => {
    expect(
      sanitizeLogValue({
        headers: {
          authorization: 'Bearer access-token',
          cookie: 'session=secret',
        },
        body: {
          password: 'password-value',
          profile: { refreshToken: 'refresh-value' },
        },
        databaseUrl: 'postgresql://user:secret@host/database',
        redis_url: 'redis://:secret@host',
        s3AccessKey: 'access',
        s3SecretKey: 'secret',
      }),
    ).toEqual({
      headers: {
        authorization: REDACTED_VALUE,
        cookie: REDACTED_VALUE,
      },
      body: {
        password: REDACTED_VALUE,
        profile: { refreshToken: REDACTED_VALUE },
      },
      databaseUrl: REDACTED_VALUE,
      redis_url: REDACTED_VALUE,
      s3AccessKey: REDACTED_VALUE,
      s3SecretKey: REDACTED_VALUE,
    });
  });

  it('redacts signed URLs and avoids serializing raw error messages', () => {
    const value = sanitizeLogValue({
      download:
        'https://storage.example.test/file?X-Amz-Signature=sensitive-value',
      error: new Error('credential appears here'),
    });

    expect(value).toEqual({
      download: REDACTED_VALUE,
      error: { errorName: 'Error' },
    });
  });

  it('handles circular structures without throwing', () => {
    const value: { self?: unknown } = {};
    value.self = value;

    expect(sanitizeLogValue(value)).toEqual({ self: '[Circular]' });
  });
});

describe('StructuredLoggerService', () => {
  it('writes the active correlation identifier into a sanitized structured log', () => {
    const context = new CorrelationContext();
    const error = jest.fn();
    const writer = { error } as unknown as Logger;
    const logger = new StructuredLoggerService(writer, context);

    context.run('request-log-123', () => {
      logger.event('error', 'test.correlated', { password: 'do-not-log' });
    });

    expect(error).toHaveBeenCalledWith(
      {
        password: REDACTED_VALUE,
        correlationId: 'request-log-123',
        event: 'test.correlated',
      },
      'test.correlated',
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain('do-not-log');
  });
});

import { EventEmitter } from 'node:events';
import { NextFunction, Request, Response } from 'express';
import { parseApiEnvironment } from '../config/api-config';
import type {
  ApplicationLogLevel,
  LogFields,
} from './structured-logger.service';
import { StructuredLoggerService } from './structured-logger.service';
import { RequestLoggingMiddleware } from './request-logging.middleware';

function createConfig(requestLogging = 'true') {
  return parseApiEnvironment({
    NODE_ENV: 'test',
    API_PUBLIC_URL: 'http://localhost:4001',
    WEB_URL: 'http://localhost:3000',
    CORS_ORIGINS: 'http://localhost:3000',
    REQUEST_LOGGING: requestLogging,
    DATABASE_URL: 'postgresql://user:password@localhost:55432/test',
    REDIS_URL: 'redis://:password@localhost:6379/0',
    OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
    OBJECT_STORAGE_BUCKET: 'claims-test-private',
    OBJECT_STORAGE_ACCESS_KEY: 'test_access',
    OBJECT_STORAGE_SECRET_KEY: 'test_secret',
  });
}

function createFixture(
  route: string,
  statusCode = 200,
  requestLogging = 'true',
) {
  const event = jest.fn<void, [ApplicationLogLevel, string, LogFields?]>();
  const logger = { event } as unknown as StructuredLoggerService;
  const middleware = new RequestLoggingMiddleware(
    createConfig(requestLogging),
    logger,
  );
  const request = {
    method: 'GET',
    path: route,
    baseUrl: '/api/v1',
    route: { path: route },
  } as unknown as Request;
  const emitter = new EventEmitter();
  const response = Object.assign(emitter, {
    statusCode,
    writableEnded: true,
  }) as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { emitter, event, middleware, next, request, response };
}

describe('RequestLoggingMiddleware', () => {
  it('emits exactly one completion record with normalized fields', () => {
    const fixture = createFixture('/projects/:projectId');

    fixture.middleware.use(fixture.request, fixture.response, fixture.next);
    fixture.emitter.emit('finish');
    fixture.emitter.emit('close');

    expect(fixture.next).toHaveBeenCalledTimes(1);
    expect(fixture.event).toHaveBeenCalledTimes(1);
    expect(fixture.event).toHaveBeenCalledWith(
      'info',
      'http.request.completed',
      expect.objectContaining({
        method: 'GET',
        route: '/api/v1/projects/:projectId',
        statusCode: 200,
      }),
    );
    const fields = fixture.event.mock.calls[0]?.[2];
    expect(fields?.durationMs).toEqual(expect.any(Number));
    expect(fields?.durationMs as number).toBeGreaterThanOrEqual(0);
  });

  it('logs liveness at debug and readiness failure at warn', () => {
    const live = createFixture('/health/live');
    live.middleware.use(live.request, live.response, live.next);
    live.emitter.emit('finish');

    const ready = createFixture('/health/ready', 503);
    ready.middleware.use(ready.request, ready.response, ready.next);
    ready.emitter.emit('finish');

    expect(live.event).toHaveBeenCalledWith(
      'debug',
      'http.request.completed',
      expect.any(Object),
    );
    expect(ready.event).toHaveBeenCalledWith(
      'warn',
      'http.request.completed',
      expect.any(Object),
    );
  });

  it('records aborted requests without duplicate completion', () => {
    const fixture = createFixture('/exports');
    Object.defineProperty(fixture.response, 'writableEnded', { value: false });

    fixture.middleware.use(fixture.request, fixture.response, fixture.next);
    fixture.emitter.emit('close');
    fixture.emitter.emit('finish');

    expect(fixture.event).toHaveBeenCalledTimes(1);
    expect(fixture.event).toHaveBeenCalledWith(
      'warn',
      'http.request.aborted',
      expect.any(Object),
    );
  });

  it('can disable request logging without changing request flow', () => {
    const fixture = createFixture('/projects', 200, 'false');

    fixture.middleware.use(fixture.request, fixture.response, fixture.next);
    fixture.emitter.emit('finish');

    expect(fixture.next).toHaveBeenCalledTimes(1);
    expect(fixture.event).not.toHaveBeenCalled();
  });
});

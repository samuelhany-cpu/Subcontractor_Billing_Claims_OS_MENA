import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import type { ReadinessCheck } from '../src/health/readiness-check';
import { READINESS_CHECKS } from '../src/health/readiness-check';
import { CORRELATION_HEADER } from '../src/observability/correlation-context';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';

@Controller('_test')
class TestErrorController {
  @Get('expected-error')
  expectedError(): never {
    throw new BadRequestException('Invalid test request.');
  }

  @Get('unexpected-error')
  unexpectedError(): never {
    throw new Error(
      'postgresql://secret-user:secret-password@internal-host/database',
    );
  }
}

function createLoggerMock() {
  return {
    debug: jest.fn(),
    error: jest.fn(),
    event: jest.fn(),
    fatal: jest.fn(),
    log: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
  };
}

describe('API diagnostics (e2e)', () => {
  let app: INestApplication<App>;
  const logger = createLoggerMock();
  const readinessImplementations = {
    postgresql: jest.fn<Promise<void>, []>().mockResolvedValue(),
    redis: jest.fn<Promise<void>, []>().mockResolvedValue(),
    objectStorage: jest.fn<Promise<void>, []>().mockResolvedValue(),
  };
  const readinessChecks: readonly ReadinessCheck[] = [
    {
      name: 'postgresql',
      check: readinessImplementations.postgresql,
    },
    { name: 'redis', check: readinessImplementations.redis },
    {
      name: 'objectStorage',
      check: readinessImplementations.objectStorage,
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestErrorController],
    })
      .overrideProvider(READINESS_CHECKS)
      .useValue(readinessChecks)
      .overrideProvider(StructuredLoggerService)
      .useValue(logger)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    readinessImplementations.postgresql.mockResolvedValue();
    readinessImplementations.redis.mockResolvedValue();
    readinessImplementations.objectStorage.mockResolvedValue();
  });

  it('serves dependency-free liveness under the versioned API prefix', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'claims-os-api',
    });
    const body: unknown = response.body;
    if (
      typeof body !== 'object' ||
      body === null ||
      !('timestamp' in body) ||
      typeof body.timestamp !== 'string'
    ) {
      throw new Error('Liveness response timestamp is missing');
    }
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    expect(readinessImplementations.postgresql).not.toHaveBeenCalled();
    expect(readinessImplementations.redis).not.toHaveBeenCalled();
    expect(readinessImplementations.objectStorage).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toMatch(
      /password|credential|databaseUrl|redisUrl|accessKey|secretKey/i,
    );
  });

  it('returns 200 and stable dependency states when all checks pass', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          status: 'ready',
          service: 'claims-os-api',
          checks: {
            postgresql: { status: 'up' },
            redis: { status: 'up' },
            objectStorage: { status: 'up' },
          },
        });
      });
  });

  it('returns sanitized 503 readiness when a controlled check fails', async () => {
    readinessImplementations.redis.mockRejectedValueOnce(
      new Error('redis://:secret-password@internal-host:6379'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(503);

    expect(response.body).toMatchObject({
      status: 'not_ready',
      checks: {
        postgresql: { status: 'up' },
        redis: { status: 'down' },
        objectStorage: { status: 'up' },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('secret-password');
    expect(JSON.stringify(logger.event.mock.calls)).not.toContain(
      'secret-password',
    );
  });

  it('preserves a valid inbound correlation ID in the response', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set(CORRELATION_HEADER, 'caller-request-123')
      .expect(CORRELATION_HEADER, 'caller-request-123')
      .expect(200);
  });

  it('generates a safe response correlation ID when input is missing or invalid', async () => {
    const missing = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200);
    const excessive = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set(CORRELATION_HEADER, 'x'.repeat(129))
      .expect(200);

    expect(missing.headers[CORRELATION_HEADER]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(excessive.headers[CORRELATION_HEADER]).not.toBe('x'.repeat(129));
  });

  it('does not leak correlation context across parallel requests', async () => {
    const ids = Array.from({ length: 12 }, (_, index) => `parallel-${index}`);
    const responses = await Promise.all(
      ids.map((id) =>
        request(app.getHttpServer())
          .get('/api/v1/health/live')
          .set(CORRELATION_HEADER, id),
      ),
    );

    expect(
      responses.map((response) => response.headers[CORRELATION_HEADER]),
    ).toEqual(ids);
  });

  it('returns correlated RFC 7807 responses for expected errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/_test/expected-error')
      .set(CORRELATION_HEADER, 'expected-error-123')
      .expect(400);

    expect(response.type).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({
      type: 'about:blank',
      status: 400,
      code: 'HTTP_400',
      detail: 'Invalid test request.',
      correlationId: 'expected-error-123',
    });
  });

  it('sanitizes unexpected errors and logs them once with one completion record', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/_test/unexpected-error')
      .set(CORRELATION_HEADER, 'unexpected-error-123')
      .expect(500);

    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      detail: 'An unexpected error occurred.',
      correlationId: 'unexpected-error-123',
    });
    expect(JSON.stringify(response.body)).not.toContain('secret-password');
    expect(
      logger.event.mock.calls.filter(
        ([, event]) => event === 'http.exception.unexpected',
      ),
    ).toHaveLength(1);
    expect(
      logger.event.mock.calls.filter(
        ([, event]) => event === 'http.request.completed',
      ),
    ).toHaveLength(1);
  });

  afterAll(async () => {
    await app.close();
  });
});

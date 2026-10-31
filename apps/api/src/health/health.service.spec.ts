import { parseApiEnvironment } from '../config/api-config';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { HealthService } from './health.service';
import type { ReadinessCheck } from './readiness-check';

const fixedTime = new Date('2026-07-29T13:00:00.000Z');

function createConfig(timeoutMs = '100') {
  return parseApiEnvironment({
    NODE_ENV: 'test',
    SERVICE_NAME: 'claims-os-api',
    API_PUBLIC_URL: 'http://localhost:4001',
    WEB_URL: 'http://localhost:3000',
    CORS_ORIGINS: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://user:password@localhost:55432/test',
    REDIS_URL: 'redis://:password@localhost:6379/0',
    OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
    OBJECT_STORAGE_BUCKET: 'claims-test-private',
    OBJECT_STORAGE_ACCESS_KEY: 'test_access',
    OBJECT_STORAGE_SECRET_KEY: 'test_secret',
    ATTACHMENT_ALLOWED_MIME_TYPES:
      'image/jpeg,image/png,image/webp,application/pdf',
    ATTACHMENT_MAX_BYTES: '10485760',
    ATTACHMENT_MAX_PER_EXPENSE: '10',
    AUTOMATION_INTERNAL_API_SECRET: 'test-automation-secret',
    TELEGRAM_ALLOWED_CHAT_ID: 'test-chat',
    HEALTH_CHECK_TIMEOUT_MS: timeoutMs,
  });
}

function createCheck(
  name: ReadinessCheck['name'],
  implementation: () => Promise<void> = () => Promise.resolve(),
): ReadinessCheck {
  return { name, check: jest.fn(implementation) };
}

function createFixture(checks: readonly ReadinessCheck[], timeoutMs = '100') {
  const event = jest.fn();
  const logger = {
    event,
  } as unknown as StructuredLoggerService;
  const service = new HealthService(
    createConfig(timeoutMs),
    checks,
    () => fixedTime,
    logger,
  );
  return { event, service };
}

const dependencyNames: readonly ReadinessCheck['name'][] = [
  'postgresql',
  'redis',
  'objectStorage',
];

describe('HealthService', () => {
  it('reports liveness without invoking a dependency', () => {
    const checks = dependencyNames.map((name) => createCheck(name));
    const { service } = createFixture(checks);

    expect(service.liveness()).toEqual({
      status: 'ok',
      service: 'claims-os-api',
      timestamp: fixedTime.toISOString(),
    });
    for (const check of checks) {
      const checkMock = jest.mocked(check.check);
      expect(checkMock).not.toHaveBeenCalled();
    }
  });

  it('reports ready when every dependency is up', async () => {
    const checks = dependencyNames.map((name) => createCheck(name));
    const { event, service } = createFixture(checks);

    await expect(service.readiness()).resolves.toEqual({
      status: 'ready',
      service: 'claims-os-api',
      timestamp: fixedTime.toISOString(),
      checks: {
        postgresql: { status: 'up' },
        redis: { status: 'up' },
        objectStorage: { status: 'up' },
      },
    });
    expect(event).not.toHaveBeenCalled();
  });

  it.each(dependencyNames)(
    'reports not ready when %s fails without exposing its error',
    async (failedName) => {
      const checks = dependencyNames.map((name) =>
        createCheck(
          name,
          name === failedName
            ? () =>
                Promise.reject(
                  new Error(
                    'postgresql://secret-user:secret-pass@internal-host',
                  ),
                )
            : undefined,
        ),
      );
      const { event, service } = createFixture(checks);

      const response = await service.readiness();
      const serialized = JSON.stringify(response);

      expect(response.status).toBe('not_ready');
      expect(response.checks[failedName].status).toBe('down');
      expect(serialized).not.toContain('secret');
      expect(serialized).not.toContain('internal-host');
      expect(event).toHaveBeenCalledWith('warn', 'health.readiness.failed', {
        checks: response.checks,
      });
    },
  );

  it('reports multiple dependency failures deterministically', async () => {
    const checks = dependencyNames.map((name) =>
      createCheck(
        name,
        name === 'objectStorage'
          ? undefined
          : () => Promise.reject(new Error('provider detail')),
      ),
    );
    const { service } = createFixture(checks);

    await expect(service.readiness()).resolves.toMatchObject({
      status: 'not_ready',
      checks: {
        postgresql: { status: 'down' },
        redis: { status: 'down' },
        objectStorage: { status: 'up' },
      },
    });
  });

  it('bounds a dependency that never settles', async () => {
    const checks = dependencyNames.map((name) =>
      createCheck(
        name,
        name === 'redis' ? () => new Promise<void>(() => undefined) : undefined,
      ),
    );
    const { service } = createFixture(checks, '50');
    const startedAt = performance.now();

    const response = await service.readiness();

    expect(response.status).toBe('not_ready');
    expect(response.checks.redis.status).toBe('down');
    expect(performance.now() - startedAt).toBeLessThan(250);
  });

  it('starts independent dependency checks concurrently', async () => {
    const started: string[] = [];
    let release: (() => void) | undefined;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const checks = dependencyNames.map((name) =>
      createCheck(name, async () => {
        started.push(name);
        await barrier;
      }),
    );
    const { service } = createFixture(checks);

    const readiness = service.readiness();
    await Promise.resolve();

    expect(started).toEqual(dependencyNames);
    release?.();
    await expect(readiness).resolves.toMatchObject({ status: 'ready' });
  });
});

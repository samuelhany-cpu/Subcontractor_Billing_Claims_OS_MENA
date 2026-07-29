import {
  REDACTED_VALUE,
  RuntimeConfigurationError,
  parseApiEnvironment,
  redactApiRuntimeConfig,
  toPublicWebRuntimeConfig,
} from './api-config';

const validEnvironment = {
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: '4001',
  API_PUBLIC_URL: 'http://localhost:4001',
  WEB_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000,https://review.example.test',
  LOG_LEVEL: 'error',
  DATABASE_URL:
    'postgresql://claims_local:claims_local_password@localhost:55432/claims_os',
  REDIS_URL: 'redis://:claims_local_redis_password@localhost:6379/0',
  OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
  OBJECT_STORAGE_REGION: 'us-east-1',
  OBJECT_STORAGE_BUCKET: 'claims-documents-local',
  OBJECT_STORAGE_ACCESS_KEY: 'claims_local_minio',
  OBJECT_STORAGE_SECRET_KEY: 'claims_local_minio_secret',
  OBJECT_STORAGE_SECURE: 'false',
  OBJECT_STORAGE_FORCE_PATH_STYLE: 'true',
} as const;

function expectInvalid(
  override: Record<string, string | undefined>,
  field: string,
) {
  const environment = { ...validEnvironment, ...override };

  expect(() => parseApiEnvironment(environment)).toThrow(
    RuntimeConfigurationError,
  );
  expect(() => parseApiEnvironment(environment)).toThrow(field);
}

describe('parseApiEnvironment', () => {
  it('parses and freezes a valid API environment', () => {
    const config = parseApiEnvironment(validEnvironment);

    expect(config.server.port).toBe(4001);
    expect(config.objectStorage.secure).toBe(false);
    expect(config.objectStorage.forcePathStyle).toBe(true);
    expect(config.http.corsOrigins).toEqual([
      'http://localhost:3000',
      'https://review.example.test',
    ]);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('applies documented non-secret defaults', () => {
    const config = parseApiEnvironment({
      ...validEnvironment,
      API_HOST: undefined,
      API_PORT: undefined,
      LOG_LEVEL: undefined,
      OBJECT_STORAGE_REGION: undefined,
      OBJECT_STORAGE_FORCE_PATH_STYLE: undefined,
      OBJECT_STORAGE_SECURE: undefined,
    });

    expect(config.server).toMatchObject({
      host: '127.0.0.1',
      port: 4000,
    });
    expect(config.runtime.logLevel).toBe('info');
    expect(config.objectStorage).toMatchObject({
      region: 'us-east-1',
      secure: false,
      forcePathStyle: true,
    });
  });

  it.each([
    [{ DATABASE_URL: undefined }, 'DATABASE_URL'],
    [{ REDIS_URL: 'https://localhost:6379' }, 'REDIS_URL'],
    [{ OBJECT_STORAGE_ENDPOINT: 'not-a-url' }, 'OBJECT_STORAGE_ENDPOINT'],
    [{ OBJECT_STORAGE_ACCESS_KEY: ' ' }, 'OBJECT_STORAGE_ACCESS_KEY'],
    [{ OBJECT_STORAGE_SECRET_KEY: '' }, 'OBJECT_STORAGE_SECRET_KEY'],
    [{ API_PORT: '70000' }, 'API_PORT'],
    [{ OBJECT_STORAGE_SECURE: 'yes' }, 'OBJECT_STORAGE_SECURE'],
    [
      {
        OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
        OBJECT_STORAGE_SECURE: 'true',
      },
      'OBJECT_STORAGE_SECURE',
    ],
  ])('rejects invalid configuration %o', (override, field) => {
    expectInvalid(override, field);
  });

  it('rejects local development defaults in production', () => {
    expectInvalid({ NODE_ENV: 'production' }, 'DATABASE_URL');
  });

  it('rejects a local Redis default in an otherwise remote production configuration', () => {
    expectInvalid(
      {
        NODE_ENV: 'production',
        DATABASE_URL:
          'postgresql://production_user@database.example.test/claims',
        OBJECT_STORAGE_ENDPOINT: 'https://storage.example.test',
        OBJECT_STORAGE_ACCESS_KEY: 'production_access',
        OBJECT_STORAGE_SECRET_KEY: 'production_secret',
        OBJECT_STORAGE_SECURE: 'true',
      },
      'REDIS_URL',
    );
  });
});

describe('configuration exposure controls', () => {
  it('redacts all connection and credential secrets', () => {
    const config = parseApiEnvironment(validEnvironment);
    const redacted = redactApiRuntimeConfig(config);
    const serialized = JSON.stringify(redacted);

    expect(redacted.database.url).toBe(REDACTED_VALUE);
    expect(redacted.redis.url).toBe(REDACTED_VALUE);
    expect(redacted.objectStorage.accessKey).toBe(REDACTED_VALUE);
    expect(redacted.objectStorage.secretKey).toBe(REDACTED_VALUE);
    expect(serialized).not.toContain('claims_local_password');
    expect(serialized).not.toContain('claims_local_minio_secret');
  });

  it('publishes only browser-safe URLs', () => {
    const config = parseApiEnvironment(validEnvironment);
    const publicConfig = toPublicWebRuntimeConfig(config);
    const serialized = JSON.stringify(publicConfig);

    expect(publicConfig).toEqual({
      apiUrl: 'http://localhost:4001/api/v1',
      appUrl: 'http://localhost:3000',
    });
    expect(Object.keys(publicConfig)).toEqual(['apiUrl', 'appUrl']);
    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('claims_local');
  });
});

import {
  REDACTED_VALUE,
  RuntimeConfigurationError,
  parseApiEnvironment,
  redactApiRuntimeConfig,
  toPublicWebRuntimeConfig,
} from './api-config';

const validEnvironment = {
  NODE_ENV: 'test',
  SERVICE_NAME: 'claims-os-api',
  API_HOST: '127.0.0.1',
  API_PORT: '4001',
  API_PUBLIC_URL: 'http://localhost:4001',
  WEB_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:3000,https://review.example.test',
  LOG_LEVEL: 'error',
  LOG_FORMAT: 'json',
  REQUEST_LOGGING: 'true',
  HEALTH_CHECK_TIMEOUT_MS: '1000',
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
  ATTACHMENT_ALLOWED_MIME_TYPES:
    'image/jpeg,image/png,image/webp,application/pdf',
  ATTACHMENT_MAX_BYTES: '10485760',
  ATTACHMENT_MAX_PER_EXPENSE: '10',
  AUTOMATION_INTERNAL_API_SECRET: 'test-automation-secret',
  TELEGRAM_ALLOWED_CHAT_ID: 'test-chat',
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
    expect(config.runtime).toMatchObject({
      serviceName: 'claims-os-api',
      logFormat: 'json',
      requestLogging: true,
    });
    expect(config.diagnostics.healthCheckTimeoutMs).toBe(1000);
    expect(config.objectStorage.secure).toBe(false);
    expect(config.objectStorage.forcePathStyle).toBe(true);
    expect(config.attachments).toEqual({
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ],
      maxBytes: 10485760,
      maxPerExpense: 10,
    });
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
      LOG_FORMAT: undefined,
      REQUEST_LOGGING: undefined,
      HEALTH_CHECK_TIMEOUT_MS: undefined,
      OBJECT_STORAGE_REGION: undefined,
      OBJECT_STORAGE_FORCE_PATH_STYLE: undefined,
      OBJECT_STORAGE_SECURE: undefined,
    });

    expect(config.server).toMatchObject({
      host: '127.0.0.1',
      port: 4000,
    });
    expect(config.runtime.logLevel).toBe('info');
    expect(config.runtime.logFormat).toBe('json');
    expect(config.runtime.requestLogging).toBe(true);
    expect(config.diagnostics.healthCheckTimeoutMs).toBe(1000);
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
    [
      { ATTACHMENT_ALLOWED_MIME_TYPES: 'image/jpeg,image/jpeg' },
      'ATTACHMENT_ALLOWED_MIME_TYPES',
    ],
    [{ ATTACHMENT_MAX_BYTES: '0' }, 'ATTACHMENT_MAX_BYTES'],
    [{ ATTACHMENT_MAX_PER_EXPENSE: '1.5' }, 'ATTACHMENT_MAX_PER_EXPENSE'],
    [{ API_PORT: '70000' }, 'API_PORT'],
    [{ OBJECT_STORAGE_SECURE: 'yes' }, 'OBJECT_STORAGE_SECURE'],
    [{ REQUEST_LOGGING: 'yes' }, 'REQUEST_LOGGING'],
    [{ HEALTH_CHECK_TIMEOUT_MS: '49' }, 'HEALTH_CHECK_TIMEOUT_MS'],
    [{ HEALTH_CHECK_TIMEOUT_MS: '10001' }, 'HEALTH_CHECK_TIMEOUT_MS'],
    [{ SERVICE_NAME: 'Claims OS API' }, 'SERVICE_NAME'],
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

  it('rejects deployment-template credential placeholders in production', () => {
    expectInvalid(
      {
        NODE_ENV: 'production',
        DATABASE_URL:
          'postgresql://claims_runtime:CHANGE_ME_DATABASE_PASSWORD@postgres:5432/claims_os',
        REDIS_URL: 'redis://:CHANGE_ME_REDIS_PASSWORD@redis:6379/0',
        OBJECT_STORAGE_ENDPOINT: 'http://minio:9000',
        OBJECT_STORAGE_ACCESS_KEY: 'CHANGE_ME_MINIO_USER',
        OBJECT_STORAGE_SECRET_KEY: 'CHANGE_ME_MINIO_PASSWORD',
      },
      'DATABASE_URL',
    );
  });

  it('rejects pretty logs in production before runtime startup', () => {
    expectInvalid(
      {
        NODE_ENV: 'production',
        LOG_FORMAT: 'pretty',
        DATABASE_URL:
          'postgresql://production_user@database.example.test/claims',
        REDIS_URL: 'rediss://production_user@redis.example.test/0',
        OBJECT_STORAGE_ENDPOINT: 'https://storage.example.test',
        OBJECT_STORAGE_ACCESS_KEY: 'production_access',
        OBJECT_STORAGE_SECRET_KEY: 'production_secret',
        OBJECT_STORAGE_SECURE: 'true',
      },
      'LOG_FORMAT',
    );
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

  it('accepts private Docker service DNS names with non-default credentials', () => {
    const config = parseApiEnvironment({
      ...validEnvironment,
      NODE_ENV: 'production',
      API_HOST: '0.0.0.0',
      API_PUBLIC_URL: 'http://api:4000',
      WEB_URL: 'http://localhost:3000',
      CORS_ORIGINS: 'http://localhost:3000',
      DATABASE_URL:
        'postgresql://claims_runtime:strong_database_secret@postgres:5432/claims_os',
      REDIS_URL: 'redis://:strong_redis_secret@redis:6379/0',
      OBJECT_STORAGE_ENDPOINT: 'http://minio:9000',
      OBJECT_STORAGE_ACCESS_KEY: 'claims_runtime_minio',
      OBJECT_STORAGE_SECRET_KEY: 'strong_storage_secret',
    });

    expect(config.database.url).toContain('@postgres:5432');
    expect(config.redis.url).toContain('@redis:6379');
    expect(config.objectStorage.endpoint).toBe('http://minio:9000');
  });

  it.each([
    [
      'DATABASE_URL',
      { DATABASE_URL: 'postgresql://runtime:secret@127.0.0.1:5432/claims' },
    ],
    ['REDIS_URL', { REDIS_URL: 'redis://:secret@localhost:6379/0' }],
    [
      'OBJECT_STORAGE_ENDPOINT',
      { OBJECT_STORAGE_ENDPOINT: 'http://[::1]:9000' },
    ],
  ])('rejects loopback production endpoint %s', (field, override) => {
    expectInvalid(
      {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://runtime:secret@postgres:5432/claims',
        REDIS_URL: 'redis://:secret@redis:6379/0',
        OBJECT_STORAGE_ENDPOINT: 'http://minio:9000',
        OBJECT_STORAGE_ACCESS_KEY: 'runtime_access',
        OBJECT_STORAGE_SECRET_KEY: 'runtime_secret',
        ...override,
      },
      field,
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

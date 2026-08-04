import { INestApplication } from '@nestjs/common';
import { configureApplication } from './app.setup';
import {
  API_RUNTIME_CONFIG,
  ApiRuntimeConfig,
  parseApiEnvironment,
} from './config/api-config';
import { StructuredLoggerService } from './observability/structured-logger.service';

describe('configureApplication', () => {
  it('sets the versioned prefix, configured CORS, custom logger, and shutdown hooks', () => {
    const config = parseApiEnvironment({
      NODE_ENV: 'test',
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
    });
    const logger = {} as StructuredLoggerService;
    const enableCors = jest.fn();
    const enableShutdownHooks = jest.fn();
    const setGlobalPrefix = jest.fn();
    const useLogger = jest.fn();
    const app = {
      enableCors,
      enableShutdownHooks,
      get: jest.fn(
        (token: unknown): ApiRuntimeConfig | StructuredLoggerService =>
          token === API_RUNTIME_CONFIG ? config : logger,
      ),
      setGlobalPrefix,
      useLogger,
    } as unknown as INestApplication;

    configureApplication(app);

    expect(useLogger).toHaveBeenCalledWith(logger);
    expect(setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:3000'],
    });
    expect(enableShutdownHooks).toHaveBeenCalledTimes(1);
  });
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import {
  API_RUNTIME_CONFIG,
  parseApiEnvironment,
} from '../src/config/api-config';
import { CORRELATION_HEADER } from '../src/observability/correlation-context';

describe('API diagnostics with local infrastructure', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it('reports live PostgreSQL, Redis, and private object storage as ready', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .set(CORRELATION_HEADER, 'infra-readiness-check')
      .expect(CORRELATION_HEADER, 'infra-readiness-check')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ready',
      checks: {
        postgresql: { status: 'up' },
        redis: { status: 'up' },
        objectStorage: { status: 'up' },
      },
    });
  });

  it('returns 503 through a controlled unreachable Redis endpoint without stopping the project service', async () => {
    const unavailableRedisConfig = parseApiEnvironment({
      ...process.env,
      REDIS_URL: 'redis://:unused-test-value@127.0.0.1:1/0',
      HEALTH_CHECK_TIMEOUT_MS: '100',
    });
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(API_RUNTIME_CONFIG)
      .useValue(unavailableRedisConfig)
      .compile();
    const unavailableApp: INestApplication<App> =
      moduleFixture.createNestApplication();
    configureApplication(unavailableApp);
    await unavailableApp.init();

    try {
      const response = await request(unavailableApp.getHttpServer())
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
      expect(JSON.stringify(response.body)).not.toContain('unused-test-value');
    } finally {
      await unavailableApp.close();
    }
  });

  afterAll(async () => {
    await app.close();
  });
});

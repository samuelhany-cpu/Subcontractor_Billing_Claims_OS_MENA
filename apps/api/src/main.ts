import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';
import { API_RUNTIME_CONFIG, ApiRuntimeConfig } from './config/api-config';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApplication(app);
  const config = app.get<ApiRuntimeConfig>(API_RUNTIME_CONFIG);

  await app.listen(config.server.port, config.server.host);
}

void bootstrap().catch(() => {
  process.stderr.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      service: 'claims-os-api',
      event: 'application.startup.failed',
      message:
        'API startup failed. Review validated configuration and dependency availability.',
    })}\n`,
  );
  process.exitCode = 1;
});

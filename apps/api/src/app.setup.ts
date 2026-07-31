import { INestApplication } from '@nestjs/common';
import { API_RUNTIME_CONFIG, ApiRuntimeConfig } from './config/api-config';
import { StructuredLoggerService } from './observability/structured-logger.service';

export function configureApplication(app: INestApplication): void {
  const config = app.get<ApiRuntimeConfig>(API_RUNTIME_CONFIG);
  const logger = app.get(StructuredLoggerService);

  app.useLogger(logger);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: config.http.corsOrigins,
  });
  app.enableShutdownHooks();
}

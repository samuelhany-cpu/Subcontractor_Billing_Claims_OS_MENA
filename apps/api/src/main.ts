import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API_RUNTIME_CONFIG, ApiRuntimeConfig } from './config/api-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ApiRuntimeConfig>(API_RUNTIME_CONFIG);

  app.enableCors({
    origin: config.http.corsOrigins,
  });

  await app.listen(config.server.port, config.server.host);
}
void bootstrap();

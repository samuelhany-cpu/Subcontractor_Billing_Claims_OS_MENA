import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  API_RUNTIME_CONFIG,
  ApiRuntimeConfig,
  parseApiEnvironment,
} from './api-config';

function readValidatedConfig(config: ConfigService): ApiRuntimeConfig {
  return {
    runtime: config.getOrThrow<ApiRuntimeConfig['runtime']>('runtime'),
    server: config.getOrThrow<ApiRuntimeConfig['server']>('server'),
    http: config.getOrThrow<ApiRuntimeConfig['http']>('http'),
    database: config.getOrThrow<ApiRuntimeConfig['database']>('database'),
    redis: config.getOrThrow<ApiRuntimeConfig['redis']>('redis'),
    objectStorage:
      config.getOrThrow<ApiRuntimeConfig['objectStorage']>('objectStorage'),
  };
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: parseApiEnvironment,
    }),
  ],
  providers: [
    {
      provide: API_RUNTIME_CONFIG,
      inject: [ConfigService],
      useFactory: readValidatedConfig,
    },
  ],
  exports: [API_RUNTIME_CONFIG],
})
export class ApiConfigModule {}

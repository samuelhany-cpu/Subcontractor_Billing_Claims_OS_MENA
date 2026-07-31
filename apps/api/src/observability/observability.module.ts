import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { API_RUNTIME_CONFIG, ApiRuntimeConfig } from '../config/api-config';
import { HttpExceptionFilter } from '../http/http-exception.filter';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { CorrelationContext } from './correlation-context';
import { CorrelationMiddleware } from './correlation.middleware';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import {
  createStructuredLogWriter,
  STRUCTURED_LOG_WRITER,
  StructuredLoggerService,
} from './structured-logger.service';

@Global()
@Module({
  providers: [
    CorrelationContext,
    {
      provide: STRUCTURED_LOG_WRITER,
      inject: [API_RUNTIME_CONFIG],
      useFactory: (config: ApiRuntimeConfig) =>
        createStructuredLogWriter(config),
    },
    StructuredLoggerService,
    CorrelationMiddleware,
    RequestLoggingMiddleware,
    ApplicationLifecycleService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [CorrelationContext, StructuredLoggerService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}

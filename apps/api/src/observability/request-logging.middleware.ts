import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { NextFunction, Request, Response } from 'express';
import { API_RUNTIME_CONFIG } from '../config/api-config';
import type { ApiRuntimeConfig } from '../config/api-config';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(API_RUNTIME_CONFIG) private readonly config: ApiRuntimeConfig,
    private readonly logger: StructuredLoggerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    if (!this.config.runtime.requestLogging) {
      next();
      return;
    }

    const startedAt = performance.now();
    let completed = false;

    const emitCompletion = (aborted: boolean): void => {
      if (completed) {
        return;
      }
      completed = true;

      const route = this.normalizedRoute(request);
      const statusCode = response.statusCode;
      const level = this.levelFor(route, statusCode, aborted);

      this.logger.event(
        level,
        aborted ? 'http.request.aborted' : 'http.request.completed',
        {
          method: request.method,
          route,
          statusCode,
          durationMs: Math.max(0, performance.now() - startedAt),
        },
      );
    };

    response.once('finish', () => emitCompletion(false));
    response.once('close', () => emitCompletion(!response.writableEnded));
    next();
  }

  private normalizedRoute(request: Request): string {
    const route: unknown = request.route;
    if (
      typeof route === 'object' &&
      route !== null &&
      'path' in route &&
      typeof route.path === 'string'
    ) {
      return `${request.baseUrl}${route.path}`;
    }
    return request.path;
  }

  private levelFor(
    route: string,
    statusCode: number,
    aborted: boolean,
  ): 'debug' | 'error' | 'info' | 'warn' {
    if (aborted) {
      return 'warn';
    }
    if (route.endsWith('/health/live')) {
      return 'debug';
    }
    if (route.endsWith('/health/ready')) {
      return statusCode >= 500 ? 'warn' : 'debug';
    }
    if (statusCode >= 500) {
      return 'error';
    }
    if (statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  }
}

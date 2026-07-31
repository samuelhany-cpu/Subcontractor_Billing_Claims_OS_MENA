import { Inject, Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';
import type { Logger } from 'pino';
import { REDACTED_VALUE } from '../config/api-config';
import type { ApiRuntimeConfig } from '../config/api-config';
import { CorrelationContext } from './correlation-context';

export const STRUCTURED_LOG_WRITER = Symbol('STRUCTURED_LOG_WRITER');

export type ApplicationLogLevel =
  'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn';

export type LogFields = Readonly<Record<string, unknown>>;

const sensitiveKeyPattern =
  /authorization|cookie|password|passphrase|token|api[_-]?key|access[_-]?key|secret|credential|database[_-]?url|redis[_-]?url|signed[_-]?url/i;
const signedUrlPattern = /[?&](?:X-Amz-Signature|signature)=/i;

export function sanitizeLogValue(
  value: unknown,
  key = '',
  seen = new WeakSet<object>(),
): unknown {
  if (sensitiveKeyPattern.test(key)) {
    return REDACTED_VALUE;
  }

  if (typeof value === 'string') {
    return signedUrlPattern.test(value) ? REDACTED_VALUE : value;
  }

  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined'
  ) {
    return value;
  }

  if (value instanceof Error) {
    return { errorName: value.name };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, key, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);
    const sanitized: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      sanitized[nestedKey] = sanitizeLogValue(nestedValue, nestedKey, seen);
    }
    seen.delete(value);
    return sanitized;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'symbol') {
    return value.description ?? '[Symbol]';
  }
  return '[Unsupported value]';
}

export function createStructuredLogWriter(config: ApiRuntimeConfig): Logger {
  return pino({
    base: {
      service: config.runtime.serviceName,
      environment: config.runtime.environment,
    },
    level: config.runtime.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(config.runtime.logFormat === 'pretty'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          },
        }
      : {}),
  });
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  constructor(
    @Inject(STRUCTURED_LOG_WRITER) private readonly logger: Logger,
    private readonly correlationContext: CorrelationContext,
  ) {}

  event(
    level: ApplicationLogLevel,
    event: string,
    fields: LogFields = {},
  ): void {
    const correlationId = this.correlationContext.getCorrelationId();
    const sanitized = sanitizeLogValue(fields);
    const context =
      typeof sanitized === 'object' && sanitized !== null
        ? sanitized
        : { value: sanitized };

    this.logger[level](
      {
        ...context,
        ...(correlationId === undefined ? {} : { correlationId }),
        event,
      },
      event,
    );
  }

  log(message: unknown, context?: string): void {
    this.event('info', 'application.log', {
      context,
      message: this.normalizeMessage(message),
    });
  }

  error(message: unknown, stackOrContext?: string, context?: string): void {
    this.event('error', 'application.error', {
      context: context ?? stackOrContext,
      message: this.normalizeMessage(message),
    });
  }

  warn(message: unknown, context?: string): void {
    this.event('warn', 'application.warning', {
      context,
      message: this.normalizeMessage(message),
    });
  }

  debug(message: unknown, context?: string): void {
    this.event('debug', 'application.debug', {
      context,
      message: this.normalizeMessage(message),
    });
  }

  verbose(message: unknown, context?: string): void {
    this.event('trace', 'application.verbose', {
      context,
      message: this.normalizeMessage(message),
    });
  }

  fatal(message: unknown, context?: string): void {
    this.event('fatal', 'application.fatal', {
      context,
      message: this.normalizeMessage(message),
    });
  }

  private normalizeMessage(message: unknown): unknown {
    return message instanceof Error ? { errorName: message.name } : message;
  }
}

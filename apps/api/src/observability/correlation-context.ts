import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export const CORRELATION_HEADER = 'x-correlation-id' as const;
export const MAX_CORRELATION_ID_LENGTH = 128;

interface RequestContext {
  readonly correlationId: string;
}

const correlationIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function isValidCorrelationId(value: string): boolean {
  return (
    value.length <= MAX_CORRELATION_ID_LENGTH &&
    correlationIdPattern.test(value)
  );
}

@Injectable()
export class CorrelationContext {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }

  run<T>(correlationId: string, callback: () => T): T {
    return this.storage.run({ correlationId }, callback);
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import {
  CORRELATION_HEADER,
  CorrelationContext,
  isValidCorrelationId,
} from './correlation-context';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly context: CorrelationContext) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const inbound = request.header(CORRELATION_HEADER);
    const correlationId =
      inbound !== undefined && isValidCorrelationId(inbound)
        ? inbound
        : randomUUID();

    response.setHeader(CORRELATION_HEADER, correlationId);
    this.context.run(correlationId, next);
  }
}

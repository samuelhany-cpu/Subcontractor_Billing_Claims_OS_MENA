import { Inject, Injectable } from '@nestjs/common';
import { AuditAction, AuditEvent, Prisma, RecordSource } from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { AuditSnapshot, serializeAuditSnapshot } from './audit-json';

export type AuditWriteClient = Pick<Prisma.TransactionClient, 'auditEvent'>;

export interface AppendAuditEvent {
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId?: string;
  readonly source: RecordSource;
  readonly before?: AuditSnapshot;
  readonly after?: AuditSnapshot;
  readonly correlationId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: AuditWriteClient,
  ) {}

  append(
    input: AppendAuditEvent,
    transaction: AuditWriteClient = this.database,
  ): Promise<AuditEvent> {
    return transaction.auditEvent.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        source: input.source,
        ...(input.entityId === undefined ? {} : { entityId: input.entityId }),
        ...(input.before === undefined
          ? {}
          : { beforeData: serializeAuditSnapshot(input.before) }),
        ...(input.after === undefined
          ? {}
          : { afterData: serializeAuditSnapshot(input.after) }),
        ...(input.correlationId === undefined
          ? {}
          : { correlationId: input.correlationId }),
      },
    });
  }
}

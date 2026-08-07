import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, PrismaClient, RecordSource } from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { ProjectStateService } from '../projects/project-state.service';
import { AuditService } from '../audit/audit.service';
import { CorrelationContext } from '../observability/correlation-context';
import { TransferRecord, TransfersRepository } from './transfers.repository';
import {
  CreateTransferRequest,
  TransferListQuery,
  TransferListResponse,
  TransferResponse,
  UpdateTransferRequest,
} from '@claims-os/domain';
import { parseMoney, serializeMoney } from '../shared/decimal/decimal';
import { AuditSnapshot } from '../audit/audit-json';

export function mapTransferResponse(record: TransferRecord): TransferResponse {
  return {
    id: record.id,
    projectId: record.projectId,
    project: {
      id: record.project.id,
      name: record.project.name,
      status: record.project.status,
    },

    transferDate: record.transferDate.toISOString().slice(0, 10),
    amount: serializeMoney(record.amount),
    source: record.source as 'WEB' | 'TELEGRAM' | 'EXCEL_IMPORT',
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class TransfersService {
  constructor(
    private readonly repository: TransfersRepository,
    private readonly projectState: ProjectStateService,
    private readonly audit: AuditService,
    private readonly correlation: CorrelationContext,
    @Inject(DATABASE_CLIENT)
    private readonly db: PrismaClient,
  ) {}

  async create(dto: CreateTransferRequest): Promise<TransferResponse> {
    await this.projectState.assertAcceptsWrites(dto.projectId);

    const amountDecimal = parseMoney(dto.amount);
    const dateObj = new Date(`${dto.transferDate}T00:00:00.000Z`);
    const correlationId = this.correlation.getCorrelationId();

    const result = await this.db.$transaction(async (tx) => {
      const created = await this.repository.create(
        {
          project: { connect: { id: dto.projectId } },
          transferDate: dateObj,
          amount: amountDecimal,
          source: RecordSource.WEB,
        },
        tx,
      );

      const snapshot = mapTransferResponse(created) as unknown as AuditSnapshot;
      await this.audit.append(
        {
          action: AuditAction.CREATE,
          entityType: 'Transfer',
          entityId: created.id,
          source: RecordSource.WEB,
          after: snapshot,
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        tx,
      );

      return created;
    });

    return mapTransferResponse(result);
  }

  async get(id: string): Promise<TransferResponse> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException({
        code: 'TRANSFER_NOT_FOUND',
        message: 'التحويل غير موجود',
      });
    }
    return mapTransferResponse(record);
  }

  async list(query: TransferListQuery): Promise<TransferListResponse> {
    const [items, totalItems] = await this.repository.findManyAndCount(query);
    const totalPages = Math.ceil(totalItems / query.pageSize) || 0;

    return {
      items: items.map(mapTransferResponse),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateTransferRequest,
  ): Promise<TransferResponse> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: 'TRANSFER_NOT_FOUND',
        message: 'التحويل غير موجود',
      });
    }

    await this.projectState.assertAcceptsWrites(existing.projectId);

    if (existing.deletedAt !== null) {
      throw new ConflictException({
        code: 'TRANSFER_DELETED',
        message: 'لا يمكن تعديل تحويل محذوف',
      });
    }

    const nextDate = dto.transferDate
      ? new Date(`${dto.transferDate}T00:00:00.000Z`)
      : existing.transferDate;
    const nextAmount = dto.amount ? parseMoney(dto.amount) : existing.amount;

    const isSameDate = nextDate.getTime() === existing.transferDate.getTime();
    const isSameAmount = nextAmount.equals(existing.amount);

    if (isSameDate && isSameAmount) {
      return mapTransferResponse(existing);
    }

    const beforeSnapshot = mapTransferResponse(
      existing,
    ) as unknown as AuditSnapshot;
    const correlationId = this.correlation.getCorrelationId();

    const result = await this.db.$transaction(async (tx) => {
      const updated = await this.repository.update(
        id,
        {
          transferDate: nextDate,
          amount: nextAmount,
        },
        tx,
      );

      const afterSnapshot = mapTransferResponse(
        updated,
      ) as unknown as AuditSnapshot;
      await this.audit.append(
        {
          action: AuditAction.UPDATE,
          entityType: 'Transfer',
          entityId: id,
          source: existing.source,
          before: beforeSnapshot,
          after: afterSnapshot,
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        tx,
      );

      return updated;
    });

    return mapTransferResponse(result);
  }

  async delete(id: string): Promise<TransferResponse> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: 'TRANSFER_NOT_FOUND',
        message: 'التحويل غير موجود',
      });
    }

    await this.projectState.assertAcceptsWrites(existing.projectId);

    if (existing.deletedAt !== null) {
      throw new ConflictException({
        code: 'TRANSFER_ALREADY_DELETED',
        message: 'التحويل محذوف بالفعل',
      });
    }

    const beforeSnapshot = mapTransferResponse(
      existing,
    ) as unknown as AuditSnapshot;
    const now = new Date();
    const correlationId = this.correlation.getCorrelationId();

    const result = await this.db.$transaction(async (tx) => {
      const deleted = await this.repository.update(id, { deletedAt: now }, tx);

      const afterSnapshot = mapTransferResponse(
        deleted,
      ) as unknown as AuditSnapshot;
      await this.audit.append(
        {
          action: AuditAction.DELETE,
          entityType: 'Transfer',
          entityId: id,
          source: existing.source,
          before: beforeSnapshot,
          after: afterSnapshot,
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        tx,
      );

      return deleted;
    });

    return mapTransferResponse(result);
  }

  async restore(id: string): Promise<TransferResponse> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: 'TRANSFER_NOT_FOUND',
        message: 'التحويل غير موجود',
      });
    }

    await this.projectState.assertAcceptsWrites(existing.projectId);

    if (existing.deletedAt === null) {
      throw new ConflictException({
        code: 'TRANSFER_ALREADY_ACTIVE',
        message: 'التحويل نشط بالفعل',
      });
    }

    const beforeSnapshot = mapTransferResponse(
      existing,
    ) as unknown as AuditSnapshot;
    const correlationId = this.correlation.getCorrelationId();

    const result = await this.db.$transaction(async (tx) => {
      const restored = await this.repository.update(
        id,
        { deletedAt: null },
        tx,
      );

      const afterSnapshot = mapTransferResponse(
        restored,
      ) as unknown as AuditSnapshot;
      await this.audit.append(
        {
          action: AuditAction.RESTORE,
          entityType: 'Transfer',
          entityId: id,
          source: existing.source,
          before: beforeSnapshot,
          after: afterSnapshot,
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        tx,
      );

      return restored;
    });

    return mapTransferResponse(result);
  }
}

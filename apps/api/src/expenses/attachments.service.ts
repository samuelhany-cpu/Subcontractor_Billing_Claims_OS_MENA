import { AttachmentMetadata } from '@claims-os/domain';
import { Inject, Injectable } from '@nestjs/common';
import { AuditAction, RecordSource } from '@prisma/client';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { AuditService } from '../audit/audit.service';
import { API_RUNTIME_CONFIG } from '../config/api-config';
import type { ApiRuntimeConfig } from '../config/api-config';
import { InfrastructureDependencyError } from '../infrastructure/infrastructure-error';
import { ObjectStorageService } from '../infrastructure/object-storage/object-storage.service';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { ProjectStateService } from '../projects/project-state.service';
import {
  attachmentInvalid,
  attachmentLimitReached,
  attachmentMimeUnsupported,
  attachmentNotFound,
  attachmentRequired,
  attachmentStorageUnavailable,
  attachmentTooLarge,
  expenseNotFound,
} from './expense-errors';
import { mapAttachment } from './expense-mapper';
import { ExpensesRepository } from './expenses.repository';

export interface UploadedAttachmentFile {
  readonly buffer: Buffer;
  readonly mimetype: string;
  readonly originalname: string;
  readonly size: number;
}

export interface AttachmentContent {
  readonly body: Readable;
  readonly contentDisposition: string;
  readonly metadata: AttachmentMetadata;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly expenses: ExpensesRepository,
    private readonly projects: ProjectStateService,
    private readonly storage: ObjectStorageService,
    private readonly audit: AuditService,
    private readonly logger: StructuredLoggerService,
    @Inject(API_RUNTIME_CONFIG) private readonly config: ApiRuntimeConfig,
  ) {}

  async list(expenseId: string): Promise<readonly AttachmentMetadata[]> {
    const expense = await this.expenses.findExpanded(expenseId);
    if (expense === null) throw expenseNotFound();
    return expense.attachments.map(mapAttachment);
  }

  async upload(
    expenseId: string,
    file: UploadedAttachmentFile | undefined,
    correlationId?: string,
  ): Promise<AttachmentMetadata> {
    const validated = this.validateFile(file);
    const expense = await this.expenses.findExpanded(expenseId);
    if (expense === null) throw expenseNotFound();
    await this.projects.assertAcceptsWrites(expense.projectId);
    if (
      (await this.expenses.attachmentCount(expenseId)) >=
      this.config.attachments.maxPerExpense
    ) {
      throw attachmentLimitReached();
    }

    let objectKey: string;
    try {
      objectKey = await this.storage.putPrivateObject({
        namespace: `expenses/${expenseId}`,
        body: validated.buffer,
        contentType: validated.mimeType,
      });
    } catch (error: unknown) {
      if (error instanceof InfrastructureDependencyError) {
        throw attachmentStorageUnavailable();
      }
      throw error;
    }

    try {
      return await this.expenses.transaction(async (transaction) => {
        const current = await this.expenses.findExpanded(
          expenseId,
          transaction,
        );
        if (current === null) throw expenseNotFound();
        await this.projects.assertAcceptsWrites(current.projectId, transaction);
        if (
          (await this.expenses.attachmentCount(expenseId, transaction)) >=
          this.config.attachments.maxPerExpense
        ) {
          throw attachmentLimitReached();
        }
        const attachment = await this.expenses.createAttachment(
          {
            expenseId,
            objectKey,
            originalName: validated.originalName,
            mimeType: validated.mimeType,
            sizeBytes: BigInt(validated.size),
            sha256: validated.sha256,
          },
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.CREATE,
            entityType: 'Attachment',
            entityId: attachment.id,
            source: RecordSource.WEB,
            after: {
              operation: 'add',
              expenseId,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
              sha256: attachment.sha256,
            },
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
        return mapAttachment(attachment);
      });
    } catch (error: unknown) {
      try {
        await this.storage.deletePrivateObject(objectKey);
      } catch {
        this.logger.event('error', 'attachment.compensation.failed', {
          objectKey,
        });
      }
      throw error;
    }
  }

  async content(attachmentId: string): Promise<AttachmentContent> {
    const attachment = await this.expenses.findAttachment(attachmentId);
    if (attachment === null || attachment.expense.deletedAt !== null) {
      throw attachmentNotFound();
    }
    let body: unknown;
    try {
      body = await this.storage.getPrivateObject(attachment.objectKey);
    } catch (error: unknown) {
      if (error instanceof InfrastructureDependencyError) {
        throw attachmentStorageUnavailable();
      }
      throw error;
    }
    if (!(body instanceof Readable)) {
      throw attachmentStorageUnavailable();
    }
    return {
      body,
      contentDisposition: this.contentDisposition(attachment.originalName),
      metadata: mapAttachment(attachment),
    };
  }

  private validateFile(file: UploadedAttachmentFile | undefined): {
    readonly buffer: Buffer;
    readonly mimeType: string;
    readonly originalName: string;
    readonly sha256: string;
    readonly size: number;
  } {
    if (file === undefined || file.size === 0 || file.buffer.length === 0) {
      throw attachmentRequired();
    }
    if (file.size > this.config.attachments.maxBytes) {
      throw attachmentTooLarge();
    }
    const originalName = file.originalname.trim();
    if (
      originalName.length === 0 ||
      originalName.length > 260 ||
      /[\r\n]/.test(originalName)
    ) {
      throw attachmentInvalid('The original filename is invalid.');
    }
    const detectedMime = this.detectMime(file.buffer);
    if (
      detectedMime === null ||
      detectedMime !== file.mimetype ||
      !this.config.attachments.allowedMimeTypes.includes(detectedMime)
    ) {
      throw attachmentMimeUnsupported();
    }
    return {
      buffer: file.buffer,
      mimeType: detectedMime,
      originalName,
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
      size: file.size,
    };
  }

  private detectMime(buffer: Buffer): string | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return 'image/jpeg';
    }
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return 'image/png';
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }
    if (
      buffer.length >= 5 &&
      buffer.subarray(0, 5).toString('ascii') === '%PDF-'
    ) {
      return 'application/pdf';
    }
    return null;
  }

  private contentDisposition(originalName: string): string {
    const safeName = originalName
      .replace(/[\r\n/\\]/g, '_')
      .trim()
      .slice(0, 260);
    const encoded = encodeURIComponent(safeName || 'attachment').replace(
      /'/g,
      '%27',
    );
    return `attachment; filename="attachment"; filename*=UTF-8''${encoded}`;
  }
}

import { HttpException } from '@nestjs/common';
import { Attachment, Prisma } from '@prisma/client';
import { Readable } from 'node:stream';
import { AuditService } from '../audit/audit.service';
import { ApiRuntimeConfig } from '../config/api-config';
import { InfrastructureDependencyError } from '../infrastructure/infrastructure-error';
import { ObjectStorageService } from '../infrastructure/object-storage/object-storage.service';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { ProjectStateService } from '../projects/project-state.service';
import {
  AttachmentsService,
  UploadedAttachmentFile,
} from './attachments.service';
import { ExpensesRepository } from './expenses.repository';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);
const acceptedFiles: readonly [string, Buffer][] = [
  ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x00])],
  ['image/png', png],
  ['image/webp', Buffer.from('RIFF0000WEBPdata', 'ascii')],
  ['application/pdf', Buffer.from('%PDF-1.7', 'ascii')],
];

function file(
  overrides: Partial<UploadedAttachmentFile> = {},
): UploadedAttachmentFile {
  return {
    buffer: png,
    mimetype: 'image/png',
    originalname: 'invoice.png',
    size: png.length,
    ...overrides,
  };
}

function attachment(): Attachment {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    expenseId: '33333333-3333-4333-8333-333333333333',
    objectKey: 'expenses/expense/object',
    originalName: 'invoice.png',
    mimeType: 'image/png',
    sizeBytes: BigInt(png.length),
    sha256: 'a'.repeat(64),
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}

function fixture() {
  const record = attachment();
  const createAttachment = jest
    .fn<
      Promise<Attachment>,
      [Prisma.AttachmentUncheckedCreateInput, Prisma.TransactionClient]
    >()
    .mockResolvedValue(record);
  const putPrivateObject = jest
    .fn<Promise<string>, [object]>()
    .mockResolvedValue('expenses/expense/generated');
  const deletePrivateObject = jest
    .fn<Promise<void>, [string]>()
    .mockResolvedValue(undefined);
  const getPrivateObject = jest.fn();
  const appendAudit = jest.fn().mockResolvedValue({});
  const repository = {
    attachmentCount: jest.fn().mockResolvedValue(0),
    createAttachment,
    findAttachment: jest.fn(),
    findExpanded: jest.fn().mockResolvedValue({
      id: record.expenseId,
      projectId: '11111111-1111-4111-8111-111111111111',
      deletedAt: null,
      attachments: [],
    }),
    transaction: jest
      .fn()
      .mockImplementation(
        (operation: (transaction: object) => Promise<unknown>) => operation({}),
      ),
  } as unknown as ExpensesRepository;
  const projects = {
    assertAcceptsWrites: jest.fn().mockResolvedValue({ status: 'ACTIVE' }),
  } as unknown as ProjectStateService;
  const storage = {
    deletePrivateObject,
    getPrivateObject,
    putPrivateObject,
  } as unknown as ObjectStorageService;
  const audit = {
    append: appendAudit,
  } as unknown as AuditService;
  const logger = {
    event: jest.fn(),
  } as unknown as StructuredLoggerService;
  const config = {
    attachments: {
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ],
      maxBytes: 10 * 1024 * 1024,
      maxPerExpense: 10,
    },
  } as unknown as ApiRuntimeConfig;
  return {
    audit,
    mocks: {
      appendAudit,
      createAttachment,
      deletePrivateObject,
      getPrivateObject,
      putPrivateObject,
    },
    logger,
    projects,
    repository,
    service: new AttachmentsService(
      repository,
      projects,
      storage,
      audit,
      logger,
      config,
    ),
    storage,
  };
}

describe('AttachmentsService', () => {
  it.each(acceptedFiles)(
    'accepts approved content signature %s',
    async (mimeType, buffer) => {
      const { mocks, service } = fixture();
      await service.upload(
        attachment().expenseId,
        file({ buffer, mimetype: mimeType, size: buffer.length }),
      );
      expect(mocks.putPrivateObject).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: mimeType }),
      );
    },
  );

  it('uploads validated content with a generated key and atomic audit metadata', async () => {
    const { mocks, service } = fixture();
    const result = await service.upload(
      attachment().expenseId,
      file(),
      'corr-attachment',
    );
    expect(result).toMatchObject({
      originalName: 'invoice.png',
      mimeType: 'image/png',
      sizeBytes: String(png.length),
    });
    expect(mocks.putPrivateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: `expenses/${attachment().expenseId}`,
        contentType: 'image/png',
      }),
    );
    const [createInput] = mocks.createAttachment.mock.calls[0]!;
    expect(createInput.objectKey).toBe('expenses/expense/generated');
    expect(createInput.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.createAttachment).toHaveBeenCalledTimes(1);
    expect(mocks.appendAudit).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'Attachment' }),
      expect.anything(),
    );
  });

  it.each([
    [undefined, 400],
    [file({ buffer: Buffer.alloc(0), size: 0 }), 400],
    [file({ mimetype: 'application/pdf' }), 415],
    [file({ size: 10 * 1024 * 1024 + 1 }), 413],
  ])('rejects invalid upload policy case %#', async (candidate, status) => {
    const { service } = fixture();
    await expect(
      service.upload(attachment().expenseId, candidate),
    ).rejects.toMatchObject({ status });
  });

  it('removes the orphan object when database persistence fails', async () => {
    const { mocks, repository, service } = fixture();
    jest
      .spyOn(repository, 'transaction')
      .mockRejectedValueOnce(new Error('database failed'));
    await expect(
      service.upload(attachment().expenseId, file()),
    ).rejects.toThrow('database failed');
    expect(mocks.deletePrivateObject).toHaveBeenCalledWith(
      'expenses/expense/generated',
    );
  });

  it('does not create metadata when private storage fails', async () => {
    const { mocks, service } = fixture();
    mocks.putPrivateObject.mockRejectedValueOnce(
      new InfrastructureDependencyError('object-storage'),
    );
    await expect(
      service.upload(attachment().expenseId, file()),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.createAttachment).not.toHaveBeenCalled();
    expect(mocks.appendAudit).not.toHaveBeenCalled();
  });

  it('streams private content without returning an object URL', async () => {
    const { mocks, repository, service } = fixture();
    jest.spyOn(repository, 'findAttachment').mockResolvedValueOnce({
      ...attachment(),
      expense: {
        id: attachment().expenseId,
        deletedAt: null,
        project: { status: 'ARCHIVED' },
      },
    } as never);
    const body = Readable.from(png);
    mocks.getPrivateObject.mockResolvedValueOnce(body);
    const result = await service.content(attachment().id);
    expect(result.body).toBe(body);
    expect(result.contentDisposition).toContain("filename*=UTF-8''invoice.png");
    expect(JSON.stringify(result.metadata)).not.toContain('objectKey');
  });

  it('does not expose deleted Expense attachments', async () => {
    const { repository, service } = fixture();
    jest.spyOn(repository, 'findAttachment').mockResolvedValueOnce({
      ...attachment(),
      expense: {
        id: attachment().expenseId,
        deletedAt: new Date(),
        project: { status: 'ACTIVE' },
      },
    } as never);
    await expect(service.content(attachment().id)).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});

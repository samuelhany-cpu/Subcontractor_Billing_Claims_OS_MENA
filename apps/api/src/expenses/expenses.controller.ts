import {
  AttachmentIdSchema,
  AttachmentMetadata,
  CreateExpenseRequest,
  CreateExpenseSchema,
  ExpenseIdSchema,
  ExpenseListQuery,
  ExpenseListQuerySchema,
  ExpenseListResponse,
  ExpenseResponse,
  UpdateExpenseRequest,
  UpdateExpenseSchema,
} from '@claims-os/domain';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CorrelationContext } from '../observability/correlation-context';
import { AttachmentsService } from './attachments.service';
import type { UploadedAttachmentFile } from './attachments.service';
import { parseExpenseRequest } from './expense-errors';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly attachments: AttachmentsService,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get()
  list(@Query() query: Record<string, unknown>): Promise<ExpenseListResponse> {
    return this.expenses.list(
      parseExpenseRequest<ExpenseListQuery>(ExpenseListQuerySchema, query),
    );
  }

  @Post()
  create(@Body() body: unknown): Promise<ExpenseResponse> {
    return this.expenses.create(
      parseExpenseRequest<CreateExpenseRequest>(CreateExpenseSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Get(':expenseId')
  get(@Param('expenseId') expenseId: string): Promise<ExpenseResponse> {
    return this.expenses.get(parseExpenseRequest(ExpenseIdSchema, expenseId));
  }

  @Patch(':expenseId')
  update(
    @Param('expenseId') expenseId: string,
    @Body() body: unknown,
  ): Promise<ExpenseResponse> {
    return this.expenses.update(
      parseExpenseRequest(ExpenseIdSchema, expenseId),
      parseExpenseRequest<UpdateExpenseRequest>(UpdateExpenseSchema, body),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':expenseId/delete')
  delete(@Param('expenseId') expenseId: string): Promise<ExpenseResponse> {
    return this.expenses.delete(
      parseExpenseRequest(ExpenseIdSchema, expenseId),
      this.correlation.getCorrelationId(),
    );
  }

  @Post(':expenseId/restore')
  restore(@Param('expenseId') expenseId: string): Promise<ExpenseResponse> {
    return this.expenses.restore(
      parseExpenseRequest(ExpenseIdSchema, expenseId),
      this.correlation.getCorrelationId(),
    );
  }

  @Get(':expenseId/attachments')
  listAttachments(
    @Param('expenseId') expenseId: string,
  ): Promise<readonly AttachmentMetadata[]> {
    return this.attachments.list(
      parseExpenseRequest(ExpenseIdSchema, expenseId),
    );
  }

  @Post(':expenseId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('expenseId') expenseId: string,
    @UploadedFile() file?: UploadedAttachmentFile,
  ): Promise<AttachmentMetadata> {
    return this.attachments.upload(
      parseExpenseRequest(ExpenseIdSchema, expenseId),
      file,
      this.correlation.getCorrelationId(),
    );
  }
}

@Controller('attachments')
export class AttachmentContentController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get(':attachmentId/content')
  async content(
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.attachments.content(
      parseExpenseRequest(AttachmentIdSchema, attachmentId),
    );
    response.setHeader('Content-Type', content.metadata.mimeType);
    response.setHeader('Content-Length', content.metadata.sizeBytes);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Disposition', content.contentDisposition);
    return new StreamableFile(content.body);
  }
}

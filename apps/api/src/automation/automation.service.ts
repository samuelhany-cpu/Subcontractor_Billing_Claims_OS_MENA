import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AutomationDraftInputSchema,
  AutomationExpensePayloadSchema,
  AutomationTransferPayloadSchema,
} from '@claims-os/domain';
import { PrismaClient, RecordSource } from '@prisma/client';
import { API_RUNTIME_CONFIG } from '../config/api-config';
import type { ApiRuntimeConfig } from '../config/api-config';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { ExpensesService } from '../expenses/expenses.service';
import { TransfersService } from '../transfers/transfers.service';

@Injectable()
export class AutomationService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: PrismaClient,
    @Inject(API_RUNTIME_CONFIG) private readonly config: ApiRuntimeConfig,
    private readonly expenses: ExpensesService,
    private readonly transfers: TransfersService,
  ) {}
  async create(input: unknown) {
    const draftInput = AutomationDraftInputSchema.safeParse(input);
    if (!draftInput.success)
      throw new BadRequestException('Invalid automation draft');
    const value = draftInput.data;
    if (value.telegramChatId !== this.config.automation.allowedChatId)
      throw new BadRequestException('Unauthorized Telegram chat');
    const payloadResult =
      value.intent === 'ADD_EXPENSE'
        ? AutomationExpensePayloadSchema.safeParse(value.payload)
        : AutomationTransferPayloadSchema.safeParse(value.payload);
    if (!payloadResult.success)
      throw new BadRequestException('Invalid automation draft payload');
    const payload = payloadResult.data;
    const existing = await this.db.automationDraft.findUnique({
      where: { idempotencyKey: value.idempotencyKey },
    });
    if (existing) {
      if (existing.telegramChatId !== this.config.automation.allowedChatId)
        throw new NotFoundException();
      return existing;
    }
    return this.db.automationDraft.create({
      data: {
        telegramChatId: value.telegramChatId,
        ...(value.telegramMsgId === undefined
          ? {}
          : { telegramMsgId: value.telegramMsgId }),
        intent: value.intent,
        idempotencyKey: value.idempotencyKey,
        payload,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });
  }
  async get(id: string) {
    const draft = await this.db.automationDraft.findFirst({
      where: { id, telegramChatId: this.config.automation.allowedChatId },
    });
    if (!draft) throw new NotFoundException();
    return draft;
  }
  async cancel(id: string) {
    return this.db.$transaction(async (tx) => {
      const draft = await tx.automationDraft.findFirst({
        where: { id, telegramChatId: this.config.automation.allowedChatId },
      });
      if (!draft) throw new NotFoundException();
      if (draft.status === 'CONFIRMED')
        throw new ConflictException('Draft already confirmed');
      if (draft.status !== 'PENDING') return draft;
      const cancellation = await tx.automationDraft.updateMany({
        where: {
          id,
          telegramChatId: this.config.automation.allowedChatId,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
      if (cancellation.count !== 1)
        throw new ConflictException('Draft cancellation conflict');
      return tx.automationDraft.findFirstOrThrow({
        where: { id, telegramChatId: this.config.automation.allowedChatId },
      });
    });
  }
  async confirm(id: string) {
    return this.db.$transaction(async (tx) => {
      const draft = await tx.automationDraft.findFirst({
        where: { id, telegramChatId: this.config.automation.allowedChatId },
      });
      if (!draft) throw new NotFoundException();
      if (draft.status === 'CONFIRMED') return draft;
      if (draft.status !== 'PENDING')
        throw new ConflictException('Draft is not pending');
      if (draft.expiresAt <= new Date()) {
        return tx.automationDraft.update({
          where: { id },
          data: { status: 'EXPIRED' },
        });
      }
      if (draft.telegramChatId !== this.config.automation.allowedChatId)
        throw new BadRequestException('Unauthorized Telegram chat');
      const claim = await tx.automationDraft.updateMany({
        where: {
          id,
          telegramChatId: this.config.automation.allowedChatId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
      if (claim.count !== 1)
        throw new ConflictException('Draft confirmation conflict');
      if (draft.intent === 'ADD_EXPENSE') {
        const p = AutomationExpensePayloadSchema.parse(draft.payload);
        const expense = await this.expenses.createTrusted(
          p,
          tx,
          RecordSource.TELEGRAM,
          { chatId: draft.telegramChatId, messageId: draft.telegramMsgId },
        );
        return tx.automationDraft.update({
          where: { id },
          data: { resultEntityType: 'Expense', resultEntityId: expense.id },
        });
      }
      const p = AutomationTransferPayloadSchema.parse(draft.payload);
      const transfer = await this.transfers.createTrusted(
        p,
        tx,
        RecordSource.TELEGRAM,
      );
      return tx.automationDraft.update({
        where: { id },
        data: { resultEntityType: 'Transfer', resultEntityId: transfer.id },
      });
    });
  }
}

import { z } from 'zod';
import { CreateExpenseSchema } from './expenses.js';
import { CreateTransferSchema } from './transfers.js';

export const AutomationIntentSchema = z.enum(['ADD_EXPENSE', 'ADD_TRANSFER']);
export const AutomationDraftInputSchema = z
  .object({
    telegramChatId: z.string().trim().min(1).max(64),
    telegramMsgId: z.string().trim().min(1).max(64).nullable().optional(),
    intent: AutomationIntentSchema,
    payload: z.unknown(),
    idempotencyKey: z.string().trim().min(1).max(160),
  })
  .strict();
export type AutomationDraftInput = z.infer<typeof AutomationDraftInputSchema>;
export const AutomationExpensePayloadSchema = CreateExpenseSchema;
export const AutomationTransferPayloadSchema = CreateTransferSchema;

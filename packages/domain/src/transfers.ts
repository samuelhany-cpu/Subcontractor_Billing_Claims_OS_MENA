import { z } from 'zod';
import { DateOnlySchema } from './projects';
import { PositiveMoneySchema } from './payees';

export const transferStatuses = ['ACTIVE', 'DELETED', 'ALL'] as const;
export type TransferStatus = (typeof transferStatuses)[number];

export const transferSorts = ['NEWEST', 'OLDEST'] as const;
export type TransferSort = (typeof transferSorts)[number];

export const TransferStatusSchema = z.enum(transferStatuses);
export const TransferSortSchema = z.enum(transferSorts);

export const TransferIdSchema = z.string().uuid({
  message: 'معرف التحويل غير صالح',
});

export const CreateTransferSchema = z.object({
  projectId: z.string().uuid({
    message: 'المشروع مطلوب وخاطئ',
  }),
  transferDate: DateOnlySchema,
  amount: PositiveMoneySchema,
});

export type CreateTransferRequest = z.infer<typeof CreateTransferSchema>;

export const UpdateTransferSchema = z
  .object({
    transferDate: DateOnlySchema.optional(),
    amount: PositiveMoneySchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.transferDate !== undefined || data.amount !== undefined,
    {
      message: 'يجب تقديم تاريخ التحويل أو المبلغ على الأقل للتحديث',
    },
  );

export type UpdateTransferRequest = z.infer<typeof UpdateTransferSchema>;

export const TransferListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  from: DateOnlySchema.optional(),
  to: DateOnlySchema.optional(),
  status: TransferStatusSchema.default('ACTIVE'),
  sort: TransferSortSchema.default('NEWEST'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type TransferListQuery = z.infer<typeof TransferListQuerySchema>;

export interface TransferProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly status: 'ACTIVE' | 'ARCHIVED';
}

export interface TransferResponse {
  readonly id: string;
  readonly projectId: string;
  readonly project: TransferProjectSummary;
  readonly transferDate: string;
  readonly amount: string;
  readonly source: 'WEB' | 'TELEGRAM' | 'EXCEL_IMPORT';
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TransferListResponse {
  readonly items: readonly TransferResponse[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}

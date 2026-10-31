import { z } from 'zod';
import { CategoryIdSchema, SubcategoryIdSchema } from './categories.js';
import { PayeeIdSchema, type PayeeType } from './payees.js';
import {
  DateOnlySchema,
  ProjectIdSchema,
  type ProjectStatus,
} from './projects.js';

export const expenseSources = ['WEB', 'TELEGRAM', 'EXCEL_IMPORT'] as const;
export const expenseSorts = ['NEWEST', 'OLDEST'] as const;
export const expenseStatuses = ['ACTIVE', 'DELETED', 'ALL'] as const;
export const ExpenseSourceSchema = z.enum(expenseSources);
export const ExpenseSortSchema = z.enum(expenseSorts);
export const ExpenseStatusSchema = z.enum(expenseStatuses);
export const ExpenseIdSchema = z.uuid('معرّف المصروف غير صحيح');
export const AttachmentIdSchema = z.uuid('معرّف المرفق غير صحيح');

const positiveMoneyPattern = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;
const positivePrecisePattern = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/;

export const ExpenseMoneySchema = z
  .string()
  .regex(positiveMoneyPattern, 'أدخل قيمة موجبة بحد أقصى منزلتين عشريتين')
  .refine((value) => /[1-9]/.test(value), 'القيمة يجب أن تكون أكبر من صفر');

export const ExpensePreciseDecimalSchema = z
  .string()
  .regex(positivePrecisePattern, 'أدخل قيمة موجبة بحد أقصى أربع منازل عشرية')
  .refine((value) => /[1-9]/.test(value), 'القيمة يجب أن تكون أكبر من صفر');

function optionalText(maximum: number, message: string) {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length === 0 ? null : value,
    z.string().trim().max(maximum, message).nullable().optional(),
  );
}

const description = z
  .string()
  .trim()
  .min(1, 'البيان مطلوب')
  .max(10_000, 'البيان طويل جدًا');

const expenseFields = {
  expenseDate: DateOnlySchema,
  description,
  categoryId: CategoryIdSchema,
  subcategoryId: SubcategoryIdSchema.nullable().optional(),
  payeeId: PayeeIdSchema.nullable().optional(),
  invoiceNumber: optionalText(160, 'رقم الفاتورة يجب ألا يتجاوز 160 حرفًا'),
  quantity: ExpensePreciseDecimalSchema.optional(),
  unit: optionalText(80, 'الوحدة يجب ألا تتجاوز 80 حرفًا'),
  unitPrice: ExpensePreciseDecimalSchema.optional(),
  amount: ExpenseMoneySchema.optional(),
  paymentMethod: optionalText(120, 'طريقة الدفع يجب ألا تتجاوز 120 حرفًا'),
  notes: optionalText(10_000, 'الملاحظات طويلة جدًا'),
};

interface AmountFields {
  readonly amount?: string | undefined;
  readonly quantity?: string | undefined;
  readonly unitPrice?: string | undefined;
}

function validateCreateAmount(value: AmountFields, context: z.RefinementCtx) {
  const calculated =
    value.quantity !== undefined && value.unitPrice !== undefined;
  if (calculated && value.amount !== undefined) {
    context.addIssue({
      code: 'custom',
      path: ['amount'],
      message: 'لا ترسل القيمة عند وجود الكمية وسعر الوحدة معًا',
    });
  } else if (!calculated && value.amount === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['amount'],
      message: 'القيمة مطلوبة عند عدم اكتمال الكمية وسعر الوحدة',
    });
  }
}

export const CreateExpenseSchema = z
  .object({ projectId: ProjectIdSchema, ...expenseFields })
  .strict()
  .superRefine(validateCreateAmount);

export const UpdateExpenseSchema = z
  .object({
    expenseDate: expenseFields.expenseDate.optional(),
    description: expenseFields.description.optional(),
    categoryId: CategoryIdSchema.optional(),
    subcategoryId: expenseFields.subcategoryId,
    payeeId: expenseFields.payeeId,
    invoiceNumber: expenseFields.invoiceNumber,
    quantity: ExpensePreciseDecimalSchema.nullable().optional(),
    unit: expenseFields.unit,
    unitPrice: ExpensePreciseDecimalSchema.nullable().optional(),
    amount: ExpenseMoneySchema.nullable().optional(),
    paymentMethod: expenseFields.paymentMethod,
    notes: expenseFields.notes,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'أرسل حقلًا واحدًا على الأقل',
  })
  .superRefine((value, context) => {
    if (
      value.quantity !== undefined &&
      value.quantity !== null &&
      value.unitPrice !== undefined &&
      value.unitPrice !== null &&
      value.amount !== undefined &&
      value.amount !== null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'لا ترسل قيمة يدوية مع الكمية وسعر الوحدة',
      });
    }
  });

const positiveInteger = (defaultValue: number, maximum?: number) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? defaultValue : value),
    z.coerce
      .number()
      .int()
      .min(1)
      .max(maximum ?? Number.MAX_SAFE_INTEGER),
  );

export const ExpenseListQuerySchema = z
  .object({
    projectId: ProjectIdSchema.optional(),
    from: DateOnlySchema.optional(),
    to: DateOnlySchema.optional(),
    categoryId: CategoryIdSchema.optional(),
    subcategoryId: SubcategoryIdSchema.optional(),
    payeeId: PayeeIdSchema.optional(),
    paymentMethod: z.string().trim().max(120).optional(),
    source: ExpenseSourceSchema.optional(),
    status: ExpenseStatusSchema.default('ACTIVE'),
    search: z.string().trim().max(200).optional(),
    sort: ExpenseSortSchema.default('NEWEST'),
    page: positiveInteger(1),
    pageSize: positiveInteger(25, 100),
  })
  .strict()
  .refine(
    ({ from, to }) => from === undefined || to === undefined || from <= to,
    { path: ['to'], message: 'تاريخ النهاية يجب ألا يسبق تاريخ البداية' },
  )
  .transform((value) => ({
    ...value,
    paymentMethod: value.paymentMethod === '' ? undefined : value.paymentMethod,
    search: value.search === '' ? undefined : value.search,
  }));

export type ExpenseSource = z.infer<typeof ExpenseSourceSchema>;
export type ExpenseSort = z.infer<typeof ExpenseSortSchema>;
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>;
export type CreateExpenseRequest = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseRequest = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseListQuery = z.infer<typeof ExpenseListQuerySchema>;

export interface ExpenseProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
}

export interface ExpenseClassificationSummary {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
}

export interface ExpensePayeeSummary {
  readonly id: string;
  readonly name: string;
  readonly type: PayeeType;
  readonly companyName: string | null;
  readonly isActive: boolean;
}

export interface AttachmentMetadata {
  readonly id: string;
  readonly expenseId: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: string;
  readonly sha256: string;
  readonly createdAt: string;
}

export interface ExpenseResponse {
  readonly id: string;
  readonly project: ExpenseProjectSummary;
  readonly expenseDate: string | null;
  readonly description: string;
  readonly category: ExpenseClassificationSummary | null;
  readonly subcategory: ExpenseClassificationSummary | null;
  readonly payee: ExpensePayeeSummary | null;
  readonly invoiceNumber: string | null;
  readonly quantity: string | null;
  readonly unit: string | null;
  readonly unitPrice: string | null;
  readonly amount: string;
  readonly paymentMethod: string | null;
  readonly notes: string | null;
  readonly source: ExpenseSource;
  readonly importFileName: string | null;
  readonly importSheet: string | null;
  readonly importRow: number | null;
  readonly telegramChatId: string | null;
  readonly telegramMsgId: string | null;
  readonly attachments: readonly AttachmentMetadata[];
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginationMetadata {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ExpenseListResponse {
  readonly items: readonly ExpenseResponse[];
  readonly pagination: PaginationMetadata;
}

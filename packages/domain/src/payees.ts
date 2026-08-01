import { z } from 'zod';
import type { ProjectStatus } from './projects.js';

export const payeeTypes = [
  'SUPPLIER',
  'CRAFTSMAN',
  'WORKER',
  'COMPANY',
  'OTHER',
] as const;
export const payeeFilters = ['ACTIVE', 'INACTIVE', 'ALL'] as const;
export const PayeeTypeSchema = z.enum(payeeTypes);
export const PayeeFilterSchema = z.enum(payeeFilters);
export const PayeeIdSchema = z.uuid('معرّف المستفيد غير صحيح');

const payeeName = z
  .string()
  .trim()
  .min(1, 'الاسم مطلوب')
  .max(200, 'الاسم يجب ألا يتجاوز 200 حرف');
function optionalText(maximum: number, message: string) {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length === 0 ? null : value,
    z.string().trim().max(maximum, message).nullable().optional(),
  );
}
const payeeFields = {
  name: payeeName,
  type: PayeeTypeSchema,
  specialty: optionalText(160, 'التخصص يجب ألا يتجاوز 160 حرفًا'),
  phone: optionalText(80, 'رقم الهاتف يجب ألا يتجاوز 80 حرفًا'),
  companyName: optionalText(200, 'اسم الشركة يجب ألا يتجاوز 200 حرف'),
  notes: optionalText(10_000, 'الملاحظات طويلة جدًا'),
};
export const CreatePayeeSchema = z.object(payeeFields).strict();
export const UpdatePayeeSchema = z
  .object({
    name: payeeFields.name.optional(),
    type: payeeFields.type.optional(),
    specialty: payeeFields.specialty,
    phone: payeeFields.phone,
    companyName: payeeFields.companyName,
    notes: payeeFields.notes,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'أرسل حقلًا واحدًا على الأقل',
  });
export const PayeeListQuerySchema = z
  .object({
    status: PayeeFilterSchema.default('ACTIVE'),
    search: z.string().trim().max(200).optional(),
  })
  .strict()
  .transform((value) => ({
    status: value.status,
    search: value.search === '' ? undefined : value.search,
  }));
const positiveMoneyPattern = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;
export const PositiveMoneySchema = z
  .string()
  .regex(positiveMoneyPattern, 'أدخل مبلغًا موجبًا بحد أقصى منزلتين عشريتين')
  .refine(
    (value) => /[1-9]/.test(value),
    'إجمالي الاتفاق يجب أن يكون أكبر من صفر',
  );
export const AgreementInputSchema = z
  .object({
    totalAmount: PositiveMoneySchema,
    notes: optionalText(10_000, 'الملاحظات طويلة جدًا'),
  })
  .strict();
export type PayeeType = z.infer<typeof PayeeTypeSchema>;
export type PayeeFilter = z.infer<typeof PayeeFilterSchema>;
export type PayeeListQuery = z.infer<typeof PayeeListQuerySchema>;
export type CreatePayeeRequest = z.infer<typeof CreatePayeeSchema>;
export type UpdatePayeeRequest = z.infer<typeof UpdatePayeeSchema>;
export type AgreementRequest = z.infer<typeof AgreementInputSchema>;
export interface PayeeResponse {
  readonly id: string;
  readonly name: string;
  readonly type: PayeeType;
  readonly specialty: string | null;
  readonly phone: string | null;
  readonly companyName: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
  readonly totalPaid: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface AgreementFinancialSummary {
  readonly id: string;
  readonly totalAmount: string;
  readonly paidAmount: string;
  readonly remainingAmount: string;
  readonly overpaidAmount: string;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface PayeeProjectSummary {
  readonly projectId: string;
  readonly projectName: string;
  readonly projectStatus: ProjectStatus;
  readonly paidAmount: string;
  readonly agreement: AgreementFinancialSummary | null;
}
export interface PayeeDetailResponse extends PayeeResponse {
  readonly projects: readonly PayeeProjectSummary[];
}
export interface AgreementResponse extends AgreementFinancialSummary {
  readonly projectId: string;
  readonly projectName: string;
  readonly projectStatus: ProjectStatus;
  readonly payeeId: string;
  readonly payeeName: string;
}

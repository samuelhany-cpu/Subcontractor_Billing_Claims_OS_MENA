import { z } from 'zod';

export const projectStatuses = ['ACTIVE', 'ARCHIVED'] as const;
export const projectFilters = ['ACTIVE', 'ARCHIVED', 'ALL'] as const;

export const ProjectStatusSchema = z.enum(projectStatuses);
export const ProjectFilterSchema = z.enum(projectFilters);

const signedMoneyPattern = /^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const SignedMoneySchema = z
  .string()
  .regex(signedMoneyPattern, 'أدخل مبلغًا صحيحًا بحد أقصى منزلتين عشريتين');

export const DateOnlySchema = z
  .string()
  .regex(dateOnlyPattern, 'أدخل التاريخ بصيغة YYYY-MM-DD')
  .refine((value) => {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'أدخل تاريخًا صحيحًا');

export const ProjectIdSchema = z.uuid('معرّف المشروع غير صحيح');

const projectName = z
  .string()
  .trim()
  .min(1, 'اسم المشروع مطلوب')
  .max(200, 'اسم المشروع يجب ألا يتجاوز 200 حرف');

export const CreateProjectSchema = z
  .object({
    name: projectName,
    openingBalance: SignedMoneySchema.optional(),
    openingBalanceDate: DateOnlySchema.nullable().optional(),
  })
  .strict();

export const UpdateProjectSchema = z
  .object({
    name: projectName.optional(),
    openingBalance: SignedMoneySchema.optional(),
    openingBalanceDate: DateOnlySchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'أرسل حقلًا واحدًا على الأقل',
  );

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectSchema>;

export interface ProjectTotals {
  readonly totalIncomingTransfers: string;
  readonly totalExpenses: string;
  readonly totalFunding: string;
  readonly availableBalance: string;
  readonly expenseCount: number;
}

export interface ProjectResponse {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly openingBalance: string;
  readonly openingBalanceDate: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly totals: ProjectTotals;
}

export interface ProjectDashboardResponse extends ProjectTotals {
  readonly projectId: string;
  readonly status: ProjectStatus;
  readonly openingBalance: string;
  readonly categoryTotals: readonly DashboardCategoryTotal[];
  readonly weeklyExpenses: readonly DashboardTrendPoint[];
  readonly topPayees: readonly DashboardPayeeTotal[];
  readonly recentExpenses: readonly DashboardExpense[];
  readonly recentTransfers: readonly DashboardTransfer[];
}

export interface DashboardCategoryTotal {
  readonly categoryId: string | null;
  readonly categoryName: string;
  readonly amount: string;
  readonly expenseCount: number;
}

export interface DashboardTrendPoint {
  readonly periodStart: string;
  readonly amount: string;
}

export interface DashboardPayeeTotal {
  readonly payeeId: string;
  readonly payeeName: string;
  readonly amount: string;
}

export interface DashboardExpense {
  readonly id: string;
  readonly expenseDate: string;
  readonly description: string;
  readonly amount: string;
  readonly categoryName: string;
  readonly payeeName: string | null;
}

export interface DashboardTransfer {
  readonly id: string;
  readonly transferDate: string;
  readonly amount: string;
}

export interface GlobalDashboardResponse extends ProjectTotals {
  readonly activeProjectCount: number;
  readonly archivedProjectCount: number;
  readonly projects: readonly ProjectResponse[];
  readonly categoryTotals: readonly DashboardCategoryTotal[];
  readonly weeklyExpenses: readonly DashboardTrendPoint[];
  readonly topPayees: readonly DashboardPayeeTotal[];
  readonly recentExpenses: readonly DashboardExpense[];
  readonly recentTransfers: readonly DashboardTransfer[];
}

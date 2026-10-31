import {
  AttachmentMetadata,
  ExpenseResponse,
  ExpenseSource,
} from '@claims-os/domain';
import { Attachment, Expense } from '@prisma/client';
import { serializeDateOnly } from '../projects/project-mapper';
import { serializeMoney, serializeQuantity } from '../shared/decimal/decimal';
import { ExpandedExpense } from './expenses.repository';

export function mapAttachment(attachment: Attachment): AttachmentMetadata {
  return {
    id: attachment.id,
    expenseId: attachment.expenseId,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes.toString(),
    sha256: attachment.sha256,
    createdAt: attachment.createdAt.toISOString(),
  };
}

function mapSource(source: Expense['source']): ExpenseSource {
  if (source === 'SYSTEM') {
    throw new Error('SYSTEM is not a public Expense source');
  }
  return source;
}

export function mapExpense(expense: ExpandedExpense): ExpenseResponse {
  return {
    id: expense.id,
    project: {
      id: expense.project.id,
      name: expense.project.name,
      status: expense.project.status,
    },
    expenseDate: serializeDateOnly(expense.expenseDate),
    description: expense.description,
    category:
      expense.category === null
        ? null
        : {
            id: expense.category.id,
            name: expense.category.name,
            isActive: expense.category.isActive,
          },
    subcategory:
      expense.subcategory === null
        ? null
        : {
            id: expense.subcategory.id,
            name: expense.subcategory.name,
            isActive: expense.subcategory.isActive,
          },
    payee:
      expense.payee === null
        ? null
        : {
            id: expense.payee.id,
            name: expense.payee.name,
            type: expense.payee.type,
            companyName: expense.payee.companyName,
            isActive: expense.payee.isActive,
          },
    invoiceNumber: expense.invoiceNumber,
    quantity:
      expense.quantity === null ? null : serializeQuantity(expense.quantity),
    unit: expense.unit,
    unitPrice:
      expense.unitPrice === null ? null : serializeQuantity(expense.unitPrice),
    amount: serializeMoney(expense.amount),
    paymentMethod: expense.paymentMethod,
    notes: expense.notes,
    source: mapSource(expense.source),
    importFileName: expense.importFileName,
    importSheet: expense.importSheet,
    importRow: expense.importRow,
    telegramChatId: expense.telegramChatId,
    telegramMsgId: expense.telegramMsgId,
    attachments: expense.attachments.map(mapAttachment),
    deletedAt: expense.deletedAt ? expense.deletedAt.toISOString() : null,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export function expenseSnapshot(
  operation: 'create' | 'update' | 'delete' | 'restore',
  expense: Expense,
): Readonly<Record<string, unknown>> {
  return {
    operation,
    id: expense.id,
    projectId: expense.projectId,
    expenseDate: serializeDateOnly(expense.expenseDate),
    description: expense.description,
    categoryId: expense.categoryId,
    subcategoryId: expense.subcategoryId,
    payeeId: expense.payeeId,
    invoiceNumber: expense.invoiceNumber,
    quantity: expense.quantity,
    unit: expense.unit,
    unitPrice: expense.unitPrice,
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    notes: expense.notes,
    source: expense.source,
    deletedAt: expense.deletedAt ? expense.deletedAt.toISOString() : null,
  };
}

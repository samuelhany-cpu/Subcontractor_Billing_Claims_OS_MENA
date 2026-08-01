import {
  AgreementFinancialSummary,
  AgreementResponse,
  PayeeResponse,
} from '@claims-os/domain';
import { Agreement, Payee, Prisma, Project } from '@prisma/client';
import { serializeMoney } from '../shared/decimal/decimal';

export function mapPayee(
  payee: Payee,
  totalPaid: Prisma.Decimal,
): PayeeResponse {
  return {
    id: payee.id,
    name: payee.name,
    type: payee.type,
    specialty: payee.specialty,
    phone: payee.phone,
    companyName: payee.companyName,
    notes: payee.notes,
    isActive: payee.isActive,
    totalPaid: serializeMoney(totalPaid),
    createdAt: payee.createdAt.toISOString(),
    updatedAt: payee.updatedAt.toISOString(),
  };
}

export function mapAgreementSummary(
  agreement: Agreement,
  paidAmount: Prisma.Decimal,
): AgreementFinancialSummary {
  const remainingAmount = agreement.totalAmount.minus(paidAmount);
  const overpaidAmount = paidAmount.greaterThan(agreement.totalAmount)
    ? paidAmount.minus(agreement.totalAmount)
    : new Prisma.Decimal(0);
  return {
    id: agreement.id,
    totalAmount: serializeMoney(agreement.totalAmount),
    paidAmount: serializeMoney(paidAmount),
    remainingAmount: serializeMoney(remainingAmount),
    overpaidAmount: serializeMoney(overpaidAmount),
    notes: agreement.notes,
    createdAt: agreement.createdAt.toISOString(),
    updatedAt: agreement.updatedAt.toISOString(),
  };
}

export function mapAgreement(
  agreement: Agreement,
  project: Project,
  payee: Payee,
  paidAmount: Prisma.Decimal,
): AgreementResponse {
  return {
    ...mapAgreementSummary(agreement, paidAmount),
    projectId: project.id,
    projectName: project.name,
    projectStatus: project.status,
    payeeId: payee.id,
    payeeName: payee.name,
  };
}

export function payeeSnapshot(
  operation: string,
  payee: Payee,
): Readonly<Record<string, unknown>> {
  return {
    operation,
    id: payee.id,
    name: payee.name,
    type: payee.type,
    specialty: payee.specialty,
    phone: payee.phone,
    companyName: payee.companyName,
    notes: payee.notes,
    isActive: payee.isActive,
  };
}

export function agreementSnapshot(
  operation: string,
  agreement: Agreement,
): Readonly<Record<string, unknown>> {
  return {
    operation,
    id: agreement.id,
    projectId: agreement.projectId,
    payeeId: agreement.payeeId,
    totalAmount: agreement.totalAmount,
    notes: agreement.notes,
  };
}

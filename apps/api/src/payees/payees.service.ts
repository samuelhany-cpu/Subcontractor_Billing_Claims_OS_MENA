import {
  AgreementRequest,
  AgreementResponse,
  CreatePayeeRequest,
  PayeeDetailResponse,
  PayeeListQuery,
  PayeeProjectSummary,
  PayeeResponse,
  UpdatePayeeRequest,
} from '@claims-os/domain';
import { Injectable } from '@nestjs/common';
import { AuditAction, Payee, Prisma, RecordSource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { projectNotFound } from '../projects/project-errors';
import { ProjectStateService } from '../projects/project-state.service';
import { parseMoney } from '../shared/decimal/decimal';
import {
  agreementConflict,
  agreementNotFound,
  payeeInactive,
  payeeNotFound,
  payeeStateConflict,
} from './payee-errors';
import {
  agreementSnapshot,
  mapAgreement,
  mapAgreementSummary,
  mapPayee,
  payeeSnapshot,
} from './payee-mapper';
import { PayeeDataClient, PayeesRepository } from './payees.repository';

@Injectable()
export class PayeesService {
  constructor(
    private readonly payees: PayeesRepository,
    private readonly projects: ProjectStateService,
    private readonly audit: AuditService,
  ) {}

  async list(query: PayeeListQuery): Promise<readonly PayeeResponse[]> {
    const rows = await this.payees.list(query);
    const totals = await this.payees.paidByPayee(rows.map(({ id }) => id));
    return rows.map((payee) =>
      mapPayee(payee, totals.get(payee.id) ?? new Prisma.Decimal(0)),
    );
  }

  async create(
    input: CreatePayeeRequest,
    correlationId?: string,
  ): Promise<PayeeResponse> {
    const payee = await this.payees.transaction(async (transaction) => {
      const created = await this.payees.createPayee(
        {
          name: input.name,
          type: input.type,
          ...(input.specialty === undefined
            ? {}
            : { specialty: input.specialty }),
          ...(input.phone === undefined ? {} : { phone: input.phone }),
          ...(input.companyName === undefined
            ? {}
            : { companyName: input.companyName }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
        },
        transaction,
      );
      await this.audit.append(
        {
          action: AuditAction.CREATE,
          entityType: 'Payee',
          entityId: created.id,
          source: RecordSource.WEB,
          after: payeeSnapshot('create', created),
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        transaction,
      );
      return created;
    });
    return mapPayee(payee, new Prisma.Decimal(0));
  }

  async get(payeeId: string): Promise<PayeeDetailResponse> {
    const payee = await this.requirePayee(payeeId);
    const [projects, totals] = await Promise.all([
      this.payees.qualifyingProjects(payeeId),
      this.payees.paidByProject(payeeId),
    ]);
    const projectSummaries: readonly PayeeProjectSummary[] = projects.map(
      (project) => {
        const paid = totals.get(project.id) ?? new Prisma.Decimal(0);
        const agreement = project.agreements[0];
        return {
          projectId: project.id,
          projectName: project.name,
          projectStatus: project.status,
          paidAmount: paid.toFixed(2),
          agreement:
            agreement === undefined
              ? null
              : mapAgreementSummary(agreement, paid),
        };
      },
    );
    const totalPaid = [...totals.values()].reduce(
      (total, amount) => total.plus(amount),
      new Prisma.Decimal(0),
    );
    return { ...mapPayee(payee, totalPaid), projects: projectSummaries };
  }

  async update(
    payeeId: string,
    input: UpdatePayeeRequest,
    correlationId?: string,
  ): Promise<PayeeResponse> {
    const payee = await this.payees.transaction(async (transaction) => {
      const current = await this.requirePayee(payeeId, transaction);
      const data = this.changedPayeeFields(current, input);
      if (Object.keys(data).length === 0) return current;
      const updated = await this.payees.updatePayee(payeeId, data, transaction);
      await this.appendPayeeAudit(
        'update',
        current,
        updated,
        correlationId,
        transaction,
      );
      return updated;
    });
    return mapPayee(
      payee,
      (await this.payees.paidByPayee([payee.id])).get(payee.id) ??
        new Prisma.Decimal(0),
    );
  }

  deactivate(payeeId: string, correlationId?: string): Promise<PayeeResponse> {
    return this.setActivity(payeeId, false, correlationId);
  }

  reactivate(payeeId: string, correlationId?: string): Promise<PayeeResponse> {
    return this.setActivity(payeeId, true, correlationId);
  }

  async getAgreement(
    projectId: string,
    payeeId: string,
  ): Promise<AgreementResponse> {
    const [project, payee, agreement, paid] = await Promise.all([
      this.payees.findProject(projectId),
      this.requirePayee(payeeId),
      this.payees.findAgreement(projectId, payeeId),
      this.payees.paidForPair(projectId, payeeId),
    ]);
    if (project === null) throw projectNotFound();
    if (agreement === null) throw agreementNotFound();
    return mapAgreement(agreement, project, payee, paid);
  }

  createAgreement(
    projectId: string,
    payeeId: string,
    input: AgreementRequest,
    correlationId?: string,
  ): Promise<AgreementResponse> {
    return this.withAgreementConflict(() =>
      this.payees.transaction(async (transaction) => {
        const project = await this.projects.assertAcceptsWrites(
          projectId,
          transaction,
        );
        const payee = await this.requireActivePayee(payeeId, transaction);
        if (
          (await this.payees.findAgreement(projectId, payeeId, transaction)) !==
          null
        ) {
          throw agreementConflict();
        }
        const agreement = await this.payees.createAgreement(
          {
            projectId,
            payeeId,
            totalAmount: parseMoney(input.totalAmount),
            ...(input.notes === undefined ? {} : { notes: input.notes }),
          },
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.CREATE,
            entityType: 'Agreement',
            entityId: agreement.id,
            source: RecordSource.WEB,
            after: agreementSnapshot('create', agreement),
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
        const paid = await this.payees.paidForPair(
          projectId,
          payeeId,
          transaction,
        );
        return mapAgreement(agreement, project, payee, paid);
      }),
    );
  }

  updateAgreement(
    projectId: string,
    payeeId: string,
    input: AgreementRequest,
    correlationId?: string,
  ): Promise<AgreementResponse> {
    return this.payees.transaction(async (transaction) => {
      const project = await this.projects.assertAcceptsWrites(
        projectId,
        transaction,
      );
      const payee = await this.requireActivePayee(payeeId, transaction);
      const current = await this.payees.findAgreement(
        projectId,
        payeeId,
        transaction,
      );
      if (current === null) throw agreementNotFound();
      const totalAmount = parseMoney(input.totalAmount);
      const notes = input.notes ?? null;
      const changed =
        !current.totalAmount.equals(totalAmount) || current.notes !== notes;
      const agreement = changed
        ? await this.payees.updateAgreement(
            current.id,
            { totalAmount, notes },
            transaction,
          )
        : current;
      if (changed) {
        await this.audit.append(
          {
            action: AuditAction.UPDATE,
            entityType: 'Agreement',
            entityId: agreement.id,
            source: RecordSource.WEB,
            before: agreementSnapshot('update', current),
            after: agreementSnapshot('update', agreement),
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
      }
      const paid = await this.payees.paidForPair(
        projectId,
        payeeId,
        transaction,
      );
      return mapAgreement(agreement, project, payee, paid);
    });
  }

  private async setActivity(
    payeeId: string,
    isActive: boolean,
    correlationId?: string,
  ): Promise<PayeeResponse> {
    const payee = await this.payees.transaction(async (transaction) => {
      const current = await this.requirePayee(payeeId, transaction);
      if (current.isActive === isActive) throw payeeStateConflict();
      const updated = await this.payees.updatePayee(
        payeeId,
        { isActive },
        transaction,
      );
      await this.appendPayeeAudit(
        isActive ? 'reactivate' : 'deactivate',
        current,
        updated,
        correlationId,
        transaction,
      );
      return updated;
    });
    return mapPayee(
      payee,
      (await this.payees.paidByPayee([payee.id])).get(payee.id) ??
        new Prisma.Decimal(0),
    );
  }

  private changedPayeeFields(
    current: Payee,
    input: UpdatePayeeRequest,
  ): Prisma.PayeeUpdateInput {
    const data: Prisma.PayeeUpdateInput = {};
    if (input.name !== undefined && input.name !== current.name)
      data.name = input.name;
    if (input.type !== undefined && input.type !== current.type)
      data.type = input.type;
    if (input.specialty !== undefined && input.specialty !== current.specialty)
      data.specialty = input.specialty;
    if (input.phone !== undefined && input.phone !== current.phone)
      data.phone = input.phone;
    if (
      input.companyName !== undefined &&
      input.companyName !== current.companyName
    )
      data.companyName = input.companyName;
    if (input.notes !== undefined && input.notes !== current.notes)
      data.notes = input.notes;
    return data;
  }

  private async requirePayee(
    payeeId: string,
    client?: PayeeDataClient,
  ): Promise<Payee> {
    const payee = await this.payees.findPayee(payeeId, client);
    if (payee === null) throw payeeNotFound();
    return payee;
  }

  private async requireActivePayee(
    payeeId: string,
    client: PayeeDataClient,
  ): Promise<Payee> {
    const payee = await this.requirePayee(payeeId, client);
    if (!payee.isActive) throw payeeInactive();
    return payee;
  }

  private appendPayeeAudit(
    operation: string,
    before: Payee,
    after: Payee,
    correlationId: string | undefined,
    transaction: Prisma.TransactionClient,
  ) {
    return this.audit.append(
      {
        action: AuditAction.UPDATE,
        entityType: 'Payee',
        entityId: after.id,
        source: RecordSource.WEB,
        before: payeeSnapshot(operation, before),
        after: payeeSnapshot(operation, after),
        ...(correlationId === undefined ? {} : { correlationId }),
      },
      transaction,
    );
  }

  private async withAgreementConflict<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw agreementConflict();
      }
      throw error;
    }
  }
}

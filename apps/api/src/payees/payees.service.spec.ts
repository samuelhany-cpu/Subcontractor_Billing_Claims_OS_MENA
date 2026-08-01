import { Payee, PayeeType, Prisma, ProjectStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ProjectStateService } from '../projects/project-state.service';
import { PayeesRepository } from './payees.repository';
import { PayeesService } from './payees.service';

const payee: Payee = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'مورد',
  type: PayeeType.SUPPLIER,
  specialty: null,
  phone: null,
  companyName: null,
  notes: null,
  isActive: true,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
};
const project = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'مشروع',
  status: ProjectStatus.ACTIVE,
  openingBalance: new Prisma.Decimal(0),
  openingBalanceDate: null,
  archivedAt: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
};
const agreement = {
  id: '33333333-3333-4333-8333-333333333333',
  projectId: project.id,
  payeeId: payee.id,
  totalAmount: new Prisma.Decimal('100.00'),
  notes: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
};

function service(repository: Partial<PayeesRepository>, audit = jest.fn()) {
  return new PayeesService(
    repository as PayeesRepository,
    {
      assertAcceptsWrites: jest.fn().mockResolvedValue(project),
    } as unknown as ProjectStateService,
    { append: audit } as unknown as AuditService,
  );
}

describe('PayeesService', () => {
  it('creates every Payee in the same transaction as its audit event', async () => {
    const transaction = {};
    const append = jest.fn().mockResolvedValue({});
    const createPayee = jest.fn().mockResolvedValue(payee);
    const instance = service(
      {
        transaction: jest.fn((operation) => operation(transaction as never)),
        createPayee,
      },
      append,
    );
    await instance.create({ name: 'مورد', type: 'SUPPLIER' }, 'corr-payee');
    expect(createPayee).toHaveBeenCalledWith(
      { name: 'مورد', type: 'SUPPLIER' },
      transaction,
    );
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Payee',
        entityId: payee.id,
        correlationId: 'corr-payee',
      }),
      transaction,
    );
  });

  it('propagates audit failure so the transaction can roll back', async () => {
    const instance = service(
      {
        transaction: jest.fn((operation) => operation({} as never)),
        createPayee: jest.fn().mockResolvedValue(payee),
      },
      jest.fn().mockRejectedValue(new Error('audit failed')),
    );
    await expect(
      instance.create({ name: 'مورد', type: 'SUPPLIER' }),
    ).rejects.toThrow('audit failed');
  });

  it('returns grouped totals as fixed strings without per-Payee queries', async () => {
    const second = { ...payee, id: '44444444-4444-4444-8444-444444444444' };
    const paidByPayee = jest.fn().mockResolvedValue(
      new Map([
        [payee.id, new Prisma.Decimal('0.30')],
        [second.id, new Prisma.Decimal('521310.00')],
      ]),
    );
    const instance = service({
      list: jest.fn().mockResolvedValue([payee, second]),
      paidByPayee,
    });
    const result = await instance.list({
      status: 'ACTIVE',
      search: undefined,
    });
    expect(result.map(({ totalPaid }) => totalPaid)).toEqual([
      '0.30',
      '521310.00',
    ]);
    expect(paidByPayee).toHaveBeenCalledTimes(1);
  });

  it('does not update or audit a no-op Payee patch', async () => {
    const append = jest.fn();
    const updatePayee = jest.fn();
    const instance = service(
      {
        transaction: jest.fn((operation) => operation({} as never)),
        findPayee: jest.fn().mockResolvedValue(payee),
        updatePayee,
        paidByPayee: jest.fn().mockResolvedValue(new Map()),
      },
      append,
    );
    await instance.update(payee.id, { name: payee.name });
    expect(updatePayee).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
  });

  it('maps qualifying projects and exact Agreement overpayment', async () => {
    const archived = {
      ...project,
      status: ProjectStatus.ARCHIVED,
      archivedAt: new Date(),
      agreements: [agreement],
    };
    const instance = service({
      findPayee: jest.fn().mockResolvedValue(payee),
      qualifyingProjects: jest.fn().mockResolvedValue([archived]),
      paidByProject: jest
        .fn()
        .mockResolvedValue(
          new Map([[project.id, new Prisma.Decimal('120.25')]]),
        ),
    });
    const result = await instance.get(payee.id);
    expect(result.totalPaid).toBe('120.25');
    expect(result.projects[0]).toMatchObject({
      projectStatus: 'ARCHIVED',
      paidAmount: '120.25',
      agreement: {
        remainingAmount: '-20.25',
        overpaidAmount: '20.25',
      },
    });
  });

  it('creates Agreement and audit atomically with exact derived values', async () => {
    const transaction = {};
    const append = jest.fn().mockResolvedValue({});
    const instance = service(
      {
        transaction: jest.fn((operation) => operation(transaction as never)),
        findPayee: jest.fn().mockResolvedValue(payee),
        findAgreement: jest.fn().mockResolvedValue(null),
        createAgreement: jest.fn().mockResolvedValue(agreement),
        paidForPair: jest.fn().mockResolvedValue(new Prisma.Decimal('0.30')),
      },
      append,
    );
    const result = await instance.createAgreement(
      project.id,
      payee.id,
      { totalAmount: '100.00' },
      'corr-agreement',
    );
    expect(result).toMatchObject({
      paidAmount: '0.30',
      remainingAmount: '99.70',
      overpaidAmount: '0.00',
    });
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Agreement',
        correlationId: 'corr-agreement',
      }),
      transaction,
    );
  });

  it('rejects duplicate Agreement creation', async () => {
    const instance = service({
      transaction: jest.fn((operation) => operation({} as never)),
      findPayee: jest.fn().mockResolvedValue(payee),
      findAgreement: jest.fn().mockResolvedValue(agreement),
    });
    await expect(
      instance.createAgreement(project.id, payee.id, {
        totalAmount: '100.00',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('updates Agreement to an overpaid state and audits Decimal snapshots', async () => {
    const updated = {
      ...agreement,
      totalAmount: new Prisma.Decimal('80.00'),
    };
    const append = jest.fn().mockResolvedValue({});
    const instance = service(
      {
        transaction: jest.fn((operation) => operation({} as never)),
        findPayee: jest.fn().mockResolvedValue(payee),
        findAgreement: jest.fn().mockResolvedValue(agreement),
        updateAgreement: jest.fn().mockResolvedValue(updated),
        paidForPair: jest.fn().mockResolvedValue(new Prisma.Decimal('100.00')),
      },
      append,
    );
    const result = await instance.updateAgreement(project.id, payee.id, {
      totalAmount: '80.00',
    });
    expect(result).toMatchObject({
      remainingAmount: '-20.00',
      overpaidAmount: '20.00',
    });
    expect(append).toHaveBeenCalledTimes(1);
  });
});

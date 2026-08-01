import { Prisma, PrismaClient } from '@prisma/client';
import { PayeesRepository } from './payees.repository';

describe('PayeesRepository query design', () => {
  it('searches only approved fields with deterministic ordering and active default input', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new PayeesRepository({
      payee: { findMany },
    } as unknown as PrismaClient);

    await repository.list({ status: 'ACTIVE', search: 'نور' });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [
          { name: { contains: 'نور' } },
          { companyName: { contains: 'نور' } },
          { phone: { contains: 'نور' } },
          { specialty: { contains: 'نور' } },
        ],
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  });

  it('uses one grouped non-deleted Expense aggregate for a Payee list', async () => {
    const groupBy = jest.fn().mockResolvedValue([
      {
        payeeId: '11111111-1111-4111-8111-111111111111',
        _sum: { amount: new Prisma.Decimal('0.30') },
      },
    ]);
    const repository = new PayeesRepository({
      expense: { groupBy },
    } as unknown as PrismaClient);

    const totals = await repository.paidByPayee([
      '11111111-1111-4111-8111-111111111111',
    ]);

    expect(totals.get('11111111-1111-4111-8111-111111111111')?.toFixed(2)).toBe(
      '0.30',
    );
    expect(groupBy).toHaveBeenCalledWith({
      by: ['payeeId'],
      where: {
        payeeId: { in: ['11111111-1111-4111-8111-111111111111'] },
        deletedAt: null,
      },
      _sum: { amount: true },
    });
    expect(groupBy).toHaveBeenCalledTimes(1);
  });
});

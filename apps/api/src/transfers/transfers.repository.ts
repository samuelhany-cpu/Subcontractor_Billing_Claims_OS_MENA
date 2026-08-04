import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { TransferListQuery } from '@claims-os/domain';

export const transferInclude = Prisma.validator<Prisma.TransferInclude>()({
  project: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
});

export type TransferRecord = Prisma.TransferGetPayload<{
  include: typeof transferInclude;
}>;

export type TransferDataClient = Pick<Prisma.TransactionClient, 'transfer'>;

@Injectable()
export class TransfersRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: PrismaClient,
  ) {}

  async create(
    data: Prisma.TransferCreateInput,
    client: TransferDataClient = this.db,
  ): Promise<TransferRecord> {
    return client.transfer.create({
      data,
      include: transferInclude,
    });
  }

  async findById(
    id: string,
    client: TransferDataClient = this.db,
  ): Promise<TransferRecord | null> {
    return client.transfer.findUnique({
      where: { id },
      include: transferInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.TransferUpdateInput,
    client: TransferDataClient = this.db,
  ): Promise<TransferRecord> {
    return client.transfer.update({
      where: { id },
      data,
      include: transferInclude,
    });
  }

  async findManyAndCount(
    query: TransferListQuery,
  ): Promise<[TransferRecord[], number]> {
    const where: Prisma.TransferWhereInput = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.from || query.to) {
      where.transferDate = {};
      if (query.from) {
        where.transferDate.gte = new Date(`${query.from}T00:00:00.000Z`);
      }
      if (query.to) {
        where.transferDate.lte = new Date(`${query.to}T00:00:00.000Z`);
      }
    }

    if (query.status === 'ACTIVE') {
      where.deletedAt = null;
    } else if (query.status === 'DELETED') {
      where.deletedAt = { not: null };
    }

    const orderBy: Prisma.TransferOrderByWithRelationInput[] =
      query.sort === 'NEWEST'
        ? [{ transferDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }]
        : [{ transferDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }];

    const skip = (query.page - 1) * query.pageSize;
    const take = query.pageSize;

    const [items, totalItems] = await Promise.all([
      this.db.transfer.findMany({
        where,
        orderBy,
        skip,
        take,
        include: transferInclude,
      }),
      this.db.transfer.count({ where }),
    ]);

    return [items, totalItems];
  }
}

import { ClassificationFilter } from '@claims-os/domain';
import { Inject, Injectable } from '@nestjs/common';
import { Category, Prisma, PrismaClient, Subcategory } from '@prisma/client';
import { DATABASE_CLIENT } from '../infrastructure/database/database.service';
import { CategoryTree } from './category-mapper';

export type CategoryDataClient = Pick<
  Prisma.TransactionClient,
  'category' | 'subcategory'
>;

@Injectable()
export class CategoriesRepository {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: PrismaClient,
  ) {}

  async transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.database.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error: unknown) {
        if (
          attempt === 2 ||
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2034'
        ) {
          throw error;
        }
      }
    }
    throw new Error('Serializable category transaction retry exhausted');
  }

  list(filter: ClassificationFilter): Promise<readonly CategoryTree[]> {
    return this.database.category.findMany({
      where: filter === 'ALL' ? {} : { isActive: filter === 'ACTIVE' },
      include: {
        subcategories: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findCategory(
    id: string,
    client: CategoryDataClient = this.database,
  ): Promise<Category | null> {
    return client.category.findUnique({ where: { id } });
  }

  findCategoryTree(
    id: string,
    client: CategoryDataClient = this.database,
  ): Promise<CategoryTree | null> {
    return client.category.findUnique({
      where: { id },
      include: {
        subcategories: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      },
    });
  }

  findSubcategory(
    id: string,
    client: CategoryDataClient = this.database,
  ): Promise<Subcategory | null> {
    return client.subcategory.findUnique({ where: { id } });
  }

  createCategory(
    data: Prisma.CategoryCreateInput,
    client: CategoryDataClient,
  ): Promise<Category> {
    return client.category.create({ data });
  }

  updateCategory(
    id: string,
    data: Prisma.CategoryUpdateInput,
    client: CategoryDataClient,
  ): Promise<Category> {
    return client.category.update({ where: { id }, data });
  }

  createSubcategory(
    data: Prisma.SubcategoryUncheckedCreateInput,
    client: CategoryDataClient,
  ): Promise<Subcategory> {
    return client.subcategory.create({ data });
  }

  updateSubcategory(
    id: string,
    data: Prisma.SubcategoryUpdateInput,
    client: CategoryDataClient,
  ): Promise<Subcategory> {
    return client.subcategory.update({ where: { id }, data });
  }

  async nextCategoryOrder(client: CategoryDataClient): Promise<number> {
    const result = await client.category.aggregate({
      _max: { sortOrder: true },
    });
    return (result._max.sortOrder ?? -1) + 1;
  }

  async nextSubcategoryOrder(
    categoryId: string,
    client: CategoryDataClient,
  ): Promise<number> {
    const result = await client.subcategory.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });
    return (result._max.sortOrder ?? -1) + 1;
  }

  async categoryOrder(client: CategoryDataClient): Promise<readonly string[]> {
    const rows = await client.category.findMany({
      select: { id: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(({ id }) => id);
  }

  async subcategoryOrder(
    categoryId: string,
    client: CategoryDataClient,
  ): Promise<readonly string[]> {
    const rows = await client.subcategory.findMany({
      where: { categoryId },
      select: { id: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(({ id }) => id);
  }

  async setCategoryOrder(
    orderedIds: readonly string[],
    client: CategoryDataClient,
  ): Promise<void> {
    for (const [sortOrder, id] of orderedIds.entries()) {
      await client.category.update({ where: { id }, data: { sortOrder } });
    }
  }

  async setSubcategoryOrder(
    orderedIds: readonly string[],
    client: CategoryDataClient,
  ): Promise<void> {
    for (const [sortOrder, id] of orderedIds.entries()) {
      await client.subcategory.update({ where: { id }, data: { sortOrder } });
    }
  }
}

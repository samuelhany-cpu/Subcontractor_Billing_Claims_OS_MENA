import {
  CategoryResponse,
  ClassificationFilter,
  CreateCategoryRequest,
  CreateSubcategoryRequest,
  RenameCategoryRequest,
  RenameSubcategoryRequest,
  ReorderClassificationsRequest,
  SubcategoryResponse,
} from '@claims-os/domain';
import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  Category,
  Prisma,
  RecordSource,
  Subcategory,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  categoryNameConflict,
  categoryNotFound,
  classificationStateConflict,
  invalidReorder,
  subcategoryNameConflict,
  subcategoryNotFound,
} from './category-errors';
import {
  categorySnapshot,
  mapCategory,
  mapSubcategory,
  subcategorySnapshot,
} from './category-mapper';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoriesRepository,
    private readonly audit: AuditService,
  ) {}

  async list(
    filter: ClassificationFilter,
  ): Promise<readonly CategoryResponse[]> {
    return (await this.categories.list(filter)).map(mapCategory);
  }

  async createCategory(
    input: CreateCategoryRequest,
    correlationId?: string,
  ): Promise<CategoryResponse> {
    const created = await this.categoryConflict(() =>
      this.categories.transaction(async (transaction) => {
        const category = await this.categories.createCategory(
          {
            name: input.name,
            sortOrder: await this.categories.nextCategoryOrder(transaction),
          },
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.CREATE,
            entityType: 'Category',
            entityId: category.id,
            source: RecordSource.WEB,
            after: categorySnapshot('create', category),
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
        return category;
      }),
    );
    return mapCategory({ ...created, subcategories: [] });
  }

  async renameCategory(
    categoryId: string,
    input: RenameCategoryRequest,
    correlationId?: string,
  ): Promise<CategoryResponse> {
    return this.categoryConflict(() =>
      this.categories
        .transaction(async (transaction) => {
          const current = await this.categories.findCategory(
            categoryId,
            transaction,
          );
          if (current === null) throw categoryNotFound();
          if (current.name === input.name) {
            return this.requireCategoryTree(categoryId, transaction);
          }
          const updated = await this.categories.updateCategory(
            categoryId,
            { name: input.name },
            transaction,
          );
          await this.appendCategoryAudit(
            'rename',
            current,
            updated,
            correlationId,
            transaction,
          );
          return this.requireCategoryTree(categoryId, transaction);
        })
        .then(mapCategory),
    );
  }

  async reorderCategories(
    input: ReorderClassificationsRequest,
    correlationId?: string,
  ): Promise<readonly CategoryResponse[]> {
    await this.categories.transaction(async (transaction) => {
      const before = await this.categories.categoryOrder(transaction);
      this.assertCompleteOrder(before, input.orderedIds, 'category');
      if (this.sameOrder(before, input.orderedIds)) return;
      await this.categories.setCategoryOrder(input.orderedIds, transaction);
      await this.audit.append(
        {
          action: AuditAction.UPDATE,
          entityType: 'CategoryOrder',
          entityId: 'global',
          source: RecordSource.WEB,
          before: { operation: 'reorder', orderedIds: before },
          after: { operation: 'reorder', orderedIds: input.orderedIds },
          ...(correlationId === undefined ? {} : { correlationId }),
        },
        transaction,
      );
    });
    return this.list('ALL');
  }

  async deactivateCategory(
    categoryId: string,
    correlationId?: string,
  ): Promise<CategoryResponse> {
    return this.setCategoryActivity(categoryId, false, correlationId);
  }

  async reactivateCategory(
    categoryId: string,
    correlationId?: string,
  ): Promise<CategoryResponse> {
    return this.setCategoryActivity(categoryId, true, correlationId);
  }

  async createSubcategory(
    categoryId: string,
    input: CreateSubcategoryRequest,
    correlationId?: string,
  ): Promise<SubcategoryResponse> {
    const created = await this.subcategoryConflict(() =>
      this.categories.transaction(async (transaction) => {
        if (
          (await this.categories.findCategory(categoryId, transaction)) === null
        ) {
          throw categoryNotFound();
        }
        const subcategory = await this.categories.createSubcategory(
          {
            categoryId,
            name: input.name,
            sortOrder: await this.categories.nextSubcategoryOrder(
              categoryId,
              transaction,
            ),
          },
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.CREATE,
            entityType: 'Subcategory',
            entityId: subcategory.id,
            source: RecordSource.WEB,
            after: subcategorySnapshot('create', subcategory),
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
        return subcategory;
      }),
    );
    return mapSubcategory(created);
  }

  async renameSubcategory(
    subcategoryId: string,
    input: RenameSubcategoryRequest,
    correlationId?: string,
  ): Promise<SubcategoryResponse> {
    const result = await this.subcategoryConflict(() =>
      this.categories.transaction(async (transaction) => {
        const current = await this.categories.findSubcategory(
          subcategoryId,
          transaction,
        );
        if (current === null) throw subcategoryNotFound();
        if (current.name === input.name) return current;
        const updated = await this.categories.updateSubcategory(
          subcategoryId,
          { name: input.name },
          transaction,
        );
        await this.appendSubcategoryAudit(
          'rename',
          current,
          updated,
          correlationId,
          transaction,
        );
        return updated;
      }),
    );
    return mapSubcategory(result);
  }

  async reorderSubcategories(
    categoryId: string,
    input: ReorderClassificationsRequest,
    correlationId?: string,
  ): Promise<readonly SubcategoryResponse[]> {
    const rows = await this.categories.transaction(async (transaction) => {
      if (
        (await this.categories.findCategory(categoryId, transaction)) === null
      ) {
        throw categoryNotFound();
      }
      const before = await this.categories.subcategoryOrder(
        categoryId,
        transaction,
      );
      this.assertCompleteOrder(before, input.orderedIds, 'subcategory');
      if (!this.sameOrder(before, input.orderedIds)) {
        await this.categories.setSubcategoryOrder(
          input.orderedIds,
          transaction,
        );
        await this.audit.append(
          {
            action: AuditAction.UPDATE,
            entityType: 'SubcategoryOrder',
            entityId: categoryId,
            source: RecordSource.WEB,
            before: { operation: 'reorder', orderedIds: before },
            after: { operation: 'reorder', orderedIds: input.orderedIds },
            ...(correlationId === undefined ? {} : { correlationId }),
          },
          transaction,
        );
      }
      const tree = await this.requireCategoryTree(categoryId, transaction);
      return tree.subcategories;
    });
    return rows.map(mapSubcategory);
  }

  async deactivateSubcategory(
    subcategoryId: string,
    correlationId?: string,
  ): Promise<SubcategoryResponse> {
    return this.setSubcategoryActivity(subcategoryId, false, correlationId);
  }

  async reactivateSubcategory(
    subcategoryId: string,
    correlationId?: string,
  ): Promise<SubcategoryResponse> {
    return this.setSubcategoryActivity(subcategoryId, true, correlationId);
  }

  private async setCategoryActivity(
    categoryId: string,
    isActive: boolean,
    correlationId?: string,
  ): Promise<CategoryResponse> {
    return this.categories.transaction(async (transaction) => {
      const current = await this.categories.findCategory(
        categoryId,
        transaction,
      );
      if (current === null) throw categoryNotFound();
      if (current.isActive === isActive) throw classificationStateConflict();
      const updated = await this.categories.updateCategory(
        categoryId,
        { isActive },
        transaction,
      );
      await this.appendCategoryAudit(
        isActive ? 'reactivate' : 'deactivate',
        current,
        updated,
        correlationId,
        transaction,
      );
      return mapCategory(
        await this.requireCategoryTree(categoryId, transaction),
      );
    });
  }

  private async setSubcategoryActivity(
    subcategoryId: string,
    isActive: boolean,
    correlationId?: string,
  ): Promise<SubcategoryResponse> {
    const result = await this.categories.transaction(async (transaction) => {
      const current = await this.categories.findSubcategory(
        subcategoryId,
        transaction,
      );
      if (current === null) throw subcategoryNotFound();
      if (current.isActive === isActive) throw classificationStateConflict();
      const updated = await this.categories.updateSubcategory(
        subcategoryId,
        { isActive },
        transaction,
      );
      await this.appendSubcategoryAudit(
        isActive ? 'reactivate' : 'deactivate',
        current,
        updated,
        correlationId,
        transaction,
      );
      return updated;
    });
    return mapSubcategory(result);
  }

  private appendCategoryAudit(
    operation: string,
    before: Category,
    after: Category,
    correlationId: string | undefined,
    transaction: Prisma.TransactionClient,
  ) {
    return this.audit.append(
      {
        action: AuditAction.UPDATE,
        entityType: 'Category',
        entityId: after.id,
        source: RecordSource.WEB,
        before: categorySnapshot(operation, before),
        after: categorySnapshot(operation, after),
        ...(correlationId === undefined ? {} : { correlationId }),
      },
      transaction,
    );
  }

  private appendSubcategoryAudit(
    operation: string,
    before: Subcategory,
    after: Subcategory,
    correlationId: string | undefined,
    transaction: Prisma.TransactionClient,
  ) {
    return this.audit.append(
      {
        action: AuditAction.UPDATE,
        entityType: 'Subcategory',
        entityId: after.id,
        source: RecordSource.WEB,
        before: subcategorySnapshot(operation, before),
        after: subcategorySnapshot(operation, after),
        ...(correlationId === undefined ? {} : { correlationId }),
      },
      transaction,
    );
  }

  private async requireCategoryTree(
    categoryId: string,
    transaction: Prisma.TransactionClient,
  ) {
    const category = await this.categories.findCategoryTree(
      categoryId,
      transaction,
    );
    if (category === null) throw categoryNotFound();
    return category;
  }

  private assertCompleteOrder(
    current: readonly string[],
    incoming: readonly string[],
    kind: 'category' | 'subcategory',
  ): void {
    if (
      current.length !== incoming.length ||
      incoming.some((id) => !current.includes(id))
    ) {
      throw invalidReorder(
        kind === 'category'
          ? 'Category reorder must contain every category exactly once.'
          : 'Subcategory reorder must contain every child of the category exactly once.',
      );
    }
  }

  private sameOrder(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((id, index) => id === b[index]);
  }

  private async categoryConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw categoryNameConflict();
      }
      throw error;
    }
  }

  private async subcategoryConflict<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw subcategoryNameConflict();
      }
      throw error;
    }
  }
}

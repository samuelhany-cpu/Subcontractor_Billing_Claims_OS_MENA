import { Category } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

const category: Category = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'فئة',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
};

const tree = { ...category, subcategories: [] };

describe('CategoriesService audit and ordering', () => {
  it('creates with deterministic next order and audits in the same transaction', async () => {
    const transaction = { marker: 'transaction' };
    const createCategory = jest.fn().mockResolvedValue(category);
    const append = jest.fn().mockResolvedValue({});
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation(transaction),
      ),
      nextCategoryOrder: jest.fn().mockResolvedValue(4),
      createCategory,
    } as unknown as CategoriesRepository;
    const service = new CategoriesService(repository, {
      append,
    } as unknown as AuditService);

    await service.createCategory({ name: 'فئة' }, 'corr-category');

    expect(createCategory).toHaveBeenCalledWith(
      { name: 'فئة', sortOrder: 4 },
      transaction,
    );
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Category',
        entityId: category.id,
        correlationId: 'corr-category',
      }),
      transaction,
    );
  });

  it('propagates audit failure so the enclosing transaction can roll back', async () => {
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation(client),
      ),
      nextCategoryOrder: jest.fn().mockResolvedValue(0),
      createCategory: jest.fn().mockResolvedValue(category),
    } as unknown as CategoriesRepository;
    const client = { marker: 'transaction' };
    const service = new CategoriesService(repository, {
      append: jest.fn().mockRejectedValue(new Error('audit failed')),
    } as unknown as AuditService);

    await expect(service.createCategory({ name: 'فئة' })).rejects.toThrow(
      'audit failed',
    );
  });

  it('does not write or audit a no-op category rename', async () => {
    const updateCategory = jest.fn();
    const append = jest.fn();
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation({}),
      ),
      findCategory: jest.fn().mockResolvedValue(category),
      findCategoryTree: jest.fn().mockResolvedValue(tree),
      updateCategory,
    } as unknown as CategoriesRepository;
    const service = new CategoriesService(repository, {
      append,
    } as unknown as AuditService);

    await service.renameCategory(category.id, { name: category.name });

    expect(updateCategory).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
  });

  it('rejects an incomplete category reorder before updates', async () => {
    const setCategoryOrder = jest.fn();
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation({}),
      ),
      categoryOrder: jest
        .fn()
        .mockResolvedValue([
          category.id,
          '22222222-2222-4222-8222-222222222222',
        ]),
      setCategoryOrder,
    } as unknown as CategoriesRepository;
    const service = new CategoriesService(repository, {
      append: jest.fn(),
    } as unknown as AuditService);

    await expect(
      service.reorderCategories({ orderedIds: [category.id] }),
    ).rejects.toMatchObject({ status: 400 });
    expect(setCategoryOrder).not.toHaveBeenCalled();
  });

  it('marks reorder operation explicitly in compact audit payloads', async () => {
    const transaction = {};
    let capturedInput: unknown;
    let capturedTransaction: unknown;
    const append = jest.fn((input: unknown, client: unknown) => {
      capturedInput = input;
      capturedTransaction = client;
      return Promise.resolve({});
    });
    const secondId = '22222222-2222-4222-8222-222222222222';
    const repository = {
      transaction: jest.fn((operation: (client: unknown) => Promise<unknown>) =>
        operation(transaction),
      ),
      categoryOrder: jest.fn().mockResolvedValue([category.id, secondId]),
      setCategoryOrder: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([]),
    } as unknown as CategoriesRepository;
    const service = new CategoriesService(repository, {
      append,
    } as unknown as AuditService);

    await service.reorderCategories({ orderedIds: [secondId, category.id] });

    expect(append).toHaveBeenCalledTimes(1);
    const auditInput = capturedInput as {
      readonly entityType: string;
      readonly entityId: string;
      readonly before: Readonly<Record<string, unknown>>;
      readonly after: Readonly<Record<string, unknown>>;
    };
    expect(auditInput.entityType).toBe('CategoryOrder');
    expect(auditInput.entityId).toBe('global');
    expect(auditInput.before.operation).toBe('reorder');
    expect(auditInput.after.operation).toBe('reorder');
    expect(capturedTransaction).toBe(transaction);
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classificationDisplayName,
  ClassificationFilterSchema,
  CreateCategorySchema,
  ReorderClassificationsSchema,
  toClassificationOptions,
} from '../src/categories.js';

test('category contracts trim names and default-compatible filters validate', () => {
  assert.deepEqual(CreateCategorySchema.parse({ name: '  خامات خاصة  ' }), {
    name: 'خامات خاصة',
  });
  assert.equal(CreateCategorySchema.safeParse({ name: '   ' }).success, false);
  assert.equal(ClassificationFilterSchema.parse('ACTIVE'), 'ACTIVE');
});

test('complete reorder contracts reject duplicate identifiers', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.equal(
    ReorderClassificationsSchema.safeParse({ orderedIds: [id, id] }).success,
    false,
  );
});

test('unclassified is display-only and selectable options enforce effective activity', () => {
  assert.equal(classificationDisplayName(null), 'غير مصنف');
  const timestamp = '2026-08-01T00:00:00.000Z';
  const options = toClassificationOptions([
    {
      id: '1',
      name: 'نشطة',
      sortOrder: 0,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      subcategories: [
        {
          id: '1-1',
          categoryId: '1',
          name: 'متاحة',
          sortOrder: 0,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: '1-2',
          categoryId: '1',
          name: 'معطلة',
          sortOrder: 1,
          isActive: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
    {
      id: '2',
      name: 'فئة معطلة',
      sortOrder: 1,
      isActive: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      subcategories: [],
    },
  ]);
  assert.deepEqual(options, [
    {
      id: '1',
      name: 'نشطة',
      subcategories: [{ id: '1-1', categoryId: '1', name: 'متاحة' }],
    },
  ]);
});

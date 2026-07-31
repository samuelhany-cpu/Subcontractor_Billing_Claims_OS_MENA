import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CreateProjectSchema,
  DateOnlySchema,
  ProjectFilterSchema,
  SignedMoneySchema,
  UpdateProjectSchema,
} from '../src/projects.js';

test('project contracts trim names and preserve signed decimal strings', () => {
  assert.deepEqual(
    CreateProjectSchema.parse({
      name: '  مشروع النيل  ',
      openingBalance: '-100.25',
      openingBalanceDate: '2026-08-01',
    }),
    {
      name: 'مشروع النيل',
      openingBalance: '-100.25',
      openingBalanceDate: '2026-08-01',
    },
  );
});

test('project contracts reject blank names and unsafe money syntax', () => {
  assert.equal(CreateProjectSchema.safeParse({ name: '  ' }).success, false);
  assert.equal(SignedMoneySchema.safeParse('0.001').success, false);
  assert.equal(SignedMoneySchema.safeParse('1e2').success, false);
});

test('date-only and filter contracts validate documented values', () => {
  assert.equal(DateOnlySchema.safeParse('2026-02-29').success, false);
  assert.equal(DateOnlySchema.parse('2028-02-29'), '2028-02-29');
  assert.equal(ProjectFilterSchema.parse('ALL'), 'ALL');
});

test('updates require a field and allow clearing the opening balance date', () => {
  assert.equal(UpdateProjectSchema.safeParse({}).success, false);
  assert.deepEqual(UpdateProjectSchema.parse({ openingBalanceDate: null }), {
    openingBalanceDate: null,
  });
});

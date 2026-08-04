import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CreateTransferSchema,
  TransferListQuerySchema,
  UpdateTransferSchema,
} from '../src/transfers.js';

describe('Transfers Domain Contracts', () => {
  it('validates a valid CreateTransfer request', () => {
    const parsed = CreateTransferSchema.parse({
      projectId: 'a0000000-0000-0000-0000-000000000001',
      transferDate: '2026-08-04',
      amount: '15000.50',
    });
    assert.equal(parsed.projectId, 'a0000000-0000-0000-0000-000000000001');
    assert.equal(parsed.transferDate, '2026-08-04');
    assert.equal(parsed.amount, '15000.50');
  });

  it('rejects invalid or non-positive amounts on Transfer creation', () => {
    assert.throws(() => {
      CreateTransferSchema.parse({
        projectId: 'a0000000-0000-0000-0000-000000000001',
        transferDate: '2026-08-04',
        amount: '0.00',
      });
    });
    assert.throws(() => {
      CreateTransferSchema.parse({
        projectId: 'a0000000-0000-0000-0000-000000000001',
        transferDate: '2026-08-04',
        amount: '-500.00',
      });
    });
  });

  it('validates UpdateTransfer request with at least one field', () => {
    const updateDate = UpdateTransferSchema.parse({
      transferDate: '2026-08-05',
    });
    assert.equal(updateDate.transferDate, '2026-08-05');

    const updateAmount = UpdateTransferSchema.parse({
      amount: '20000.00',
    });
    assert.equal(updateAmount.amount, '20000.00');

    assert.throws(() => {
      UpdateTransferSchema.parse({});
    });
  });

  it('applies defaults to TransferListQuery', () => {
    const query = TransferListQuerySchema.parse({});
    assert.equal(query.status, 'ACTIVE');
    assert.equal(query.sort, 'NEWEST');
    assert.equal(query.page, 1);
    assert.equal(query.pageSize, 25);
  });
});

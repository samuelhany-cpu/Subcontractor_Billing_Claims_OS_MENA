import assert from 'node:assert/strict';
import test from 'node:test';
import {
  acceptBalanceUpdate,
  beginBalanceConversation,
} from './balance-conversation.js';

void test('creates persistent balance state and rejects duplicate updates', () => {
  const now = new Date('2026-11-01T10:00:00.000Z');
  const state = beginBalanceConversation('test-chat', 100, now);
  assert.equal(state.step, 'SELECT_PROJECT');
  assert.equal(acceptBalanceUpdate(state, 100, now), false);
  assert.equal(acceptBalanceUpdate(state, 101, now), true);
});

void test('rejects expired balance conversations', () => {
  const now = new Date('2026-11-01T10:00:00.000Z');
  const state = beginBalanceConversation('test-chat', 100, now);
  assert.equal(
    acceptBalanceUpdate(state, 101, new Date('2026-11-01T10:16:00.000Z')),
    false,
  );
});

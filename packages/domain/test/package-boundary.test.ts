import assert from 'node:assert/strict';
import test from 'node:test';

import { DOMAIN_PACKAGE_NAME } from '../src/index.js';

test('exposes the explicit shared domain package boundary', () => {
  assert.equal(DOMAIN_PACKAGE_NAME, '@claims-os/domain');
});

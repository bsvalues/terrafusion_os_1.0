import test from 'node:test';
import assert from 'node:assert/strict';

import { createPreflight } from '../pilot/ToolRunner.preflight.js';

test('PF1 - default preflight allows', () => {
  const pf = createPreflight();
  const d = pf.decide({ toolId: 't1', correlationId: 'c1' });
  assert.deepEqual(d, { allow: true });
});

test('PF2 - deny is normalized', () => {
  const pf = createPreflight(() => ({ allow: false, reason: '' }));
  const d = pf.decide({ toolId: 't1', correlationId: 'c1' });
  assert.deepEqual(d, {
    allow: false,
    reason: 'Policy denied',
    visibility: 'restricted',
  });
});

test('PF3 - policy exceptions become deny, never throw', () => {
  const pf = createPreflight(() => {
    throw new Error('Policy engine offline');
  });
  const d = pf.decide({ toolId: 't1', correlationId: 'c1' });
  assert.deepEqual(d, {
    allow: false,
    reason: 'Policy engine offline',
    visibility: 'restricted',
  });
});

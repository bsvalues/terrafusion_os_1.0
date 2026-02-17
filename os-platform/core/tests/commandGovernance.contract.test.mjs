import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isCommandGovernanceMeta,
  normalizeDecision,
} from '../types/commandGovernance.js';

test('CGM1 - accepts valid governance meta', () => {
  const ok = { intent: 'inspect', mutation: 'none', visibility: 'public' };
  assert.equal(isCommandGovernanceMeta(ok), true);
});

test('CGM2 - rejects missing/extra keys', () => {
  const bad1 = { intent: 'inspect', mutation: 'none' };
  const bad2 = { intent: 'inspect', mutation: 'none', visibility: 'public', extra: 1 };
  assert.equal(isCommandGovernanceMeta(bad1), false);
  assert.equal(isCommandGovernanceMeta(bad2), false);
});

test('CGM3 - rejects invalid enum values', () => {
  const bad = { intent: 'build', mutation: 'durable', visibility: 'public' };
  assert.equal(isCommandGovernanceMeta(bad), false);
});

test('CGM4 - normalizeDecision applies deny defaults', () => {
  const d = normalizeDecision({ allow: false, reason: '   ' });
  assert.deepEqual(d, {
    allow: false,
    reason: 'Policy denied',
    visibility: 'restricted',
  });
});

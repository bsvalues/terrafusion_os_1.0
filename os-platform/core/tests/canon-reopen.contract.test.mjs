/**
 * TerraCanon – Persisted Reopen Contract: Regression Tripwire Tests
 *
 * These tests pin the canonical shape of the persisted-reopen contract
 * so that any future change to the storage key or workspace validator
 * triggers a loud, obvious failure. They run in the core governance lane
 * (Node.js `node:test`) — no browser APIs, no React.
 *
 * Run with: node --test os-platform/core/tests/canon-reopen.contract.test.mjs
 *
 * @see Phase 39: TerraCanon Persisted Reopen Contract
 * @see Phase 40: Regression tripwire tests
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STORAGE_KEY_LAST_CLOSED_V1, isValidWorkspace } from '../canon/reopenPersistence.mjs';

// ============================================================================
// Tripwire 1: Storage Key Stability
// ============================================================================

describe('TerraCanon Persisted Reopen Tripwire – Key Stability', () => {
  it('STORAGE_KEY_LAST_CLOSED_V1 is exactly tf.canon.lastClosed.v1', () => {
    assert.equal(STORAGE_KEY_LAST_CLOSED_V1, 'tf.canon.lastClosed.v1');
  });

  it('key is a non-empty string', () => {
    assert.equal(typeof STORAGE_KEY_LAST_CLOSED_V1, 'string');
    assert.ok(STORAGE_KEY_LAST_CLOSED_V1.length > 0);
  });
});

// ============================================================================
// Tripwire 2: Strict Workspace Shape Validation
// ============================================================================

describe('TerraCanon Persisted Reopen Tripwire – Strict Shape', () => {
  // --- Positive cases ---

  it('accepts { id: "1", name: "A" }', () => {
    assert.equal(isValidWorkspace({ id: '1', name: 'A' }), true);
  });

  it('accepts a realistic workspace object', () => {
    assert.equal(isValidWorkspace({ id: 'canon-workspace-42', name: 'My Project' }), true);
  });

  // --- Negative: extra keys MUST fail (strict shape) ---

  it('rejects extra keys: { id: "1", name: "A", extra: true }', () => {
    assert.equal(isValidWorkspace({ id: '1', name: 'A', extra: true }), false);
  });

  // --- Negative: missing or empty fields ---

  it('rejects empty id', () => {
    assert.equal(isValidWorkspace({ id: '', name: 'A' }), false);
  });

  it('rejects empty name', () => {
    assert.equal(isValidWorkspace({ id: '1', name: '' }), false);
  });

  it('rejects missing id', () => {
    assert.equal(isValidWorkspace({ name: 'A' }), false);
  });

  it('rejects missing name', () => {
    assert.equal(isValidWorkspace({ id: '1' }), false);
  });

  // --- Negative: wrong types ---

  it('rejects null', () => {
    assert.equal(isValidWorkspace(null), false);
  });

  it('rejects undefined', () => {
    assert.equal(isValidWorkspace(undefined), false);
  });

  it('rejects a number', () => {
    assert.equal(isValidWorkspace(42), false);
  });

  it('rejects a string', () => {
    assert.equal(isValidWorkspace('workspace'), false);
  });

  it('rejects an array', () => {
    assert.equal(isValidWorkspace([{ id: '1', name: 'A' }]), false);
  });

  it('rejects an empty object', () => {
    assert.equal(isValidWorkspace({}), false);
  });

  it('rejects numeric id', () => {
    assert.equal(isValidWorkspace({ id: 1, name: 'A' }), false);
  });

  it('rejects numeric name', () => {
    assert.equal(isValidWorkspace({ id: '1', name: 1 }), false);
  });
});

// ============================================================================
// Self-test runner annotation
// ============================================================================

console.log('Canon Reopen Contract Tripwire Suite');
console.log('=====================================');
console.log('Run with: node --test os-platform/core/tests/canon-reopen.contract.test.mjs');

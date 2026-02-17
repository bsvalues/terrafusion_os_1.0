/**
 * Phase 48: Command Gate Contract Tests
 *
 * Validates the governed command gate:
 * - Mutating commands require policy allow
 * - Deny returns a reason string
 * - Never throws; exceptions become deny(reason)
 * - run() executes thunk only on allow
 * - Invalid policy decisions → deny with explanation
 *
 * Run with: node --test os-platform/core/tests/commandGate.contract.test.mjs
 *
 * @see Phase 48: TerraCanon Core Contracts
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCommandGate } from '../canon/commandGate.mjs';

describe('Command Gate – Policy Decisions (CG1-CG2)', () => {
  it('CG1 — mutating command denied with reason', () => {
    const gate = createCommandGate((req) => {
      if (req.mutates) return { allow: false, reason: 'No mutations in readonly mode' };
      return { allow: true };
    });

    const d = gate.decide({ id: 'canon.workspace.close', mutates: true });
    assert.deepEqual(d, { allow: false, reason: 'No mutations in readonly mode' });
  });

  it('CG2 — non-mutating command allowed', () => {
    const gate = createCommandGate(() => ({ allow: true }));
    const d = gate.decide({ id: 'canon.workspace.inspect', mutates: false });
    assert.deepEqual(d, { allow: true });
  });
});

describe('Command Gate – Exception Safety (CG3)', () => {
  it('CG3a — policy exceptions become deny (never throws)', () => {
    const gate = createCommandGate(() => {
      throw new Error('Policy engine offline');
    });
    const d = gate.decide({ id: 'canon.any', mutates: true });
    assert.deepEqual(d, { allow: false, reason: 'Policy engine offline' });
  });

  it('CG3b — non-Error throw becomes generic deny', () => {
    const gate = createCommandGate(() => {
      throw 'string error'; // eslint-disable-line no-throw-literal
    });
    const d = gate.decide({ id: 'canon.any', mutates: true });
    assert.deepEqual(d, { allow: false, reason: 'Policy exception' });
  });

  it('CG3c — Error with empty message becomes generic deny', () => {
    const gate = createCommandGate(() => {
      throw new Error('');
    });
    const d = gate.decide({ id: 'canon.any', mutates: true });
    assert.deepEqual(d, { allow: false, reason: 'Policy exception' });
  });
});

describe('Command Gate – Invalid Policy Decisions (CG4)', () => {
  it('CG4a — null decision becomes deny', () => {
    const gate = createCommandGate(() => /** @type {any} */ (null));
    const d = gate.decide({ id: 'canon.any', mutates: false });
    assert.deepEqual(d, { allow: false, reason: 'Policy returned invalid decision' });
  });

  it('CG4b — undefined decision becomes deny', () => {
    const gate = createCommandGate(() => /** @type {any} */ (undefined));
    const d = gate.decide({ id: 'canon.any', mutates: false });
    assert.deepEqual(d, { allow: false, reason: 'Policy returned invalid decision' });
  });

  it('CG4c — deny with empty reason becomes "Policy denied"', () => {
    const gate = createCommandGate(() => ({ allow: false, reason: '' }));
    const d = gate.decide({ id: 'canon.any', mutates: true });
    assert.deepEqual(d, { allow: false, reason: 'Policy denied' });
  });

  it('CG4d — deny with non-string reason becomes "Policy denied"', () => {
    const gate = createCommandGate(() => /** @type {any} */ ({ allow: false, reason: 42 }));
    const d = gate.decide({ id: 'canon.any', mutates: true });
    assert.deepEqual(d, { allow: false, reason: 'Policy denied' });
  });
});

describe('Command Gate – run() (CG5-CG6)', () => {
  it('CG5 — run() does not execute thunk on deny', () => {
    let ran = false;
    const gate = createCommandGate(() => ({ allow: false, reason: 'Denied' }));
    const out = gate.run({ id: 'canon.mutate', mutates: true }, () => {
      ran = true;
      return 123;
    });
    assert.equal(ran, false);
    assert.deepEqual(out.decision, { allow: false, reason: 'Denied' });
    assert.equal(out.value, undefined);
  });

  it('CG6 — run() executes thunk on allow and returns value', () => {
    const gate = createCommandGate(() => ({ allow: true }));
    const out = gate.run({ id: 'canon.read', mutates: false }, () => 42);
    assert.deepEqual(out.decision, { allow: true });
    assert.equal(out.value, 42);
  });
});

describe('Command Gate – Meta Passthrough (CG7)', () => {
  it('CG7 — policy receives meta from request', () => {
    let receivedMeta = null;
    const gate = createCommandGate((req) => {
      receivedMeta = req.meta;
      return { allow: true };
    });

    gate.decide({
      id: 'canon.workspace.rename',
      mutates: true,
      meta: { target: 'workspace-1', dryRun: false },
    });

    assert.deepEqual(receivedMeta, { target: 'workspace-1', dryRun: false });
  });
});

describe('Command Gate – Immutability (CG8)', () => {
  it('CG8 — gate object is frozen', () => {
    const gate = createCommandGate(() => ({ allow: true }));
    assert.ok(Object.isFrozen(gate));
  });
});

console.log('Command Gate Contract Suite');
console.log('==========================');
console.log(
  'Run with: node --test os-platform/core/tests/commandGate.contract.test.mjs'
);

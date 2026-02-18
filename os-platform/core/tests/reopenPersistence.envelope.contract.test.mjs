/**
 * TerraCanon – LastClosed Envelope v2 Contract Tests
 *
 * Pins the canonical shape of the v2 versioned envelope for
 * persisted last-closed workspace state. Fail-closed on any
 * schema mismatch, malformed JSON, or version drift.
 *
 * Run with: node --test os-platform/core/tests/reopenPersistence.envelope.contract.test.mjs
 *
 * @see Phase 47: TerraCanon Operational Hardening
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ENVELOPE_VERSION,
  isValidEnvelopeV2,
  parseLastClosedV2,
  serializeLastClosedV2,
} from '../canon/lastClosedEnvelope.mjs';

// ============================================================================
// EV0: Version constant stability
// ============================================================================

describe('Envelope v2 – Version Constant', () => {
  it('ENVELOPE_VERSION is exactly 2', () => {
    assert.equal(ENVELOPE_VERSION, 2);
  });
});

// ============================================================================
// EV1: Parse valid envelope v2
// ============================================================================

describe('Envelope v2 – Valid Parsing', () => {
  it('EV1 — parses a valid v2 envelope', () => {
    const raw = JSON.stringify({ v: 2, workspace: { id: 'ws-1', name: 'Project' }, ts: 1700000000000 });
    const result = parseLastClosedV2(raw);
    assert.notEqual(result, null);
    assert.deepEqual(result.workspace, { id: 'ws-1', name: 'Project' });
    assert.equal(result.ts, 1700000000000);
  });

  it('EV1b — validates a well-formed envelope object', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: 1 }),
      true
    );
  });
});

// ============================================================================
// EV2: Reject wrong version
// ============================================================================

describe('Envelope v2 – Version Rejection', () => {
  it('EV2a — rejects v:1', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 1, workspace: { id: 'a', name: 'b' }, ts: 1 }),
      false
    );
  });

  it('EV2b — rejects v:3', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 3, workspace: { id: 'a', name: 'b' }, ts: 1 }),
      false
    );
  });

  it('EV2c — rejects v:"2" (string)', () => {
    assert.equal(
      isValidEnvelopeV2({ v: '2', workspace: { id: 'a', name: 'b' }, ts: 1 }),
      false
    );
  });

  it('EV2d — rejects missing v', () => {
    assert.equal(
      isValidEnvelopeV2({ workspace: { id: 'a', name: 'b' }, ts: 1 }),
      false
    );
  });

  it('EV2e — parse returns null for wrong version', () => {
    const raw = JSON.stringify({ v: 1, workspace: { id: 'a', name: 'b' }, ts: 1 });
    assert.equal(parseLastClosedV2(raw), null);
  });
});

// ============================================================================
// EV3: Reject missing ts
// ============================================================================

describe('Envelope v2 – Timestamp Validation', () => {
  it('EV3a — rejects missing ts', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' } }),
      false
    );
  });

  it('EV3b — rejects ts:0', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: 0 }),
      false
    );
  });

  it('EV3c — rejects ts:-1', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: -1 }),
      false
    );
  });

  it('EV3d — rejects ts:NaN', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: NaN }),
      false
    );
  });

  it('EV3e — rejects ts:Infinity', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: Infinity }),
      false
    );
  });

  it('EV3f — rejects ts as string', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: '1700000000000' }),
      false
    );
  });
});

// ============================================================================
// EV4: Reject extra keys at envelope level (strict)
// ============================================================================

describe('Envelope v2 – Strict Envelope Shape', () => {
  it('EV4a — rejects extra key at envelope level', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' }, ts: 1, extra: true }),
      false
    );
  });

  it('EV4b — rejects envelope with only 2 keys', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b' } }),
      false
    );
  });
});

// ============================================================================
// EV5: Reject workspace extra keys (delegated to isValidWorkspace)
// ============================================================================

describe('Envelope v2 – Strict Workspace Shape (within envelope)', () => {
  it('EV5a — rejects workspace with extra keys', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 'b', extra: 1 }, ts: 1 }),
      false
    );
  });

  it('EV5b — rejects empty workspace object', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: {}, ts: 1 }),
      false
    );
  });
});

// ============================================================================
// EV6: Reject non-string id/name in workspace
// ============================================================================

describe('Envelope v2 – Workspace Field Types', () => {
  it('EV6a — rejects numeric id in workspace', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 1, name: 'b' }, ts: 1 }),
      false
    );
  });

  it('EV6b — rejects numeric name in workspace', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: 1 }, ts: 1 }),
      false
    );
  });

  it('EV6c — rejects empty id in workspace', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: '', name: 'b' }, ts: 1 }),
      false
    );
  });

  it('EV6d — rejects empty name in workspace', () => {
    assert.equal(
      isValidEnvelopeV2({ v: 2, workspace: { id: 'a', name: '' }, ts: 1 }),
      false
    );
  });
});

// ============================================================================
// EV7: Malformed JSON
// ============================================================================

describe('Envelope v2 – Malformed JSON', () => {
  it('EV7a — parse returns null for malformed JSON', () => {
    assert.equal(parseLastClosedV2('{bad json'), null);
  });

  it('EV7b — parse returns null for empty string', () => {
    assert.equal(parseLastClosedV2(''), null);
  });

  it('EV7c — parse returns null for bare string', () => {
    assert.equal(parseLastClosedV2('"hello"'), null);
  });

  it('EV7d — parse returns null for bare number', () => {
    assert.equal(parseLastClosedV2('42'), null);
  });

  it('EV7e — parse returns null for null literal', () => {
    assert.equal(parseLastClosedV2('null'), null);
  });
});

// ============================================================================
// EV8: Serialization contract
// ============================================================================

describe('Envelope v2 – Serialization', () => {
  it('EV8a — serialize produces valid v2 envelope JSON', () => {
    const json = serializeLastClosedV2({ id: 'ws-1', name: 'Test' });
    const parsed = JSON.parse(json);
    assert.equal(parsed.v, 2);
    assert.deepEqual(parsed.workspace, { id: 'ws-1', name: 'Test' });
    assert.equal(typeof parsed.ts, 'number');
    assert.ok(parsed.ts > 0);
    assert.equal(Object.keys(parsed).length, 3);
  });

  it('EV8b — serialized envelope round-trips through parse', () => {
    const json = serializeLastClosedV2({ id: 'ws-2', name: 'Round Trip' });
    const result = parseLastClosedV2(json);
    assert.notEqual(result, null);
    assert.deepEqual(result.workspace, { id: 'ws-2', name: 'Round Trip' });
  });

  it('EV8c — serialize throws on invalid workspace', () => {
    assert.throws(() => serializeLastClosedV2({ id: '', name: '' }));
  });

  it('EV8d — serialize throws on workspace with extra keys', () => {
    assert.throws(() => serializeLastClosedV2({ id: 'a', name: 'b', extra: 1 }));
  });
});

// ============================================================================
// EV9: Backward compatibility — raw v1 payloads fail-closed
// ============================================================================

describe('Envelope v2 – Backward Compat (v1 fail-closed)', () => {
  it('EV9a — bare workspace JSON (v1 format) returns null from parse', () => {
    // v1 stored raw workspace: { id: "x", name: "y" }
    const v1Raw = JSON.stringify({ id: 'ws-old', name: 'Old Project' });
    assert.equal(parseLastClosedV2(v1Raw), null);
  });

  it('EV9b — bare workspace object fails envelope validation', () => {
    assert.equal(isValidEnvelopeV2({ id: 'ws-old', name: 'Old Project' }), false);
  });
});

// ============================================================================
// Self-test runner annotation
// ============================================================================

console.log('LastClosed Envelope v2 Contract Suite');
console.log('=====================================');
console.log(
  'Run with: node --test os-platform/core/tests/reopenPersistence.envelope.contract.test.mjs'
);

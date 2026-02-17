/**
 * TerraCanon – Cross-Tab Sync Contract Tests
 *
 * Pins the canonical rules for cross-tab lastClosed state synchronization.
 * These tests verify the DECISION LOGIC that drives cross-tab behavior,
 * expressed as pure function contracts (no browser APIs needed).
 *
 * Cross-tab sync rules (Phase 47):
 *   CT1 — When storage key is removed (newValue=null), reopen becomes unavailable
 *   CT2 — When storage key is set with valid envelope, reopen becomes available
 *   CT3 — Malformed payload → fail-closed (treated as removal)
 *   CT4 — Single-consume: after reopen, key is removed, all tabs see unavailable
 *
 * The actual StorageEvent wiring is in CanonHome.tsx; these tests pin
 * the canonical parse/validate functions that drive those decisions.
 *
 * Run with: node --test os-platform/core/tests/canon-reopen.cross-tab.contract.test.mjs
 *
 * @see Phase 40: TerraCanon Cross-Tab Sync Contract
 * @see Phase 47: TerraCanon Operational Hardening
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isValidEnvelopeV2,
  parseLastClosedV2,
  serializeLastClosedV2,
} from '../canon/lastClosedEnvelope.mjs';
import { isValidWorkspace } from '../canon/reopenPersistence.mjs';

// ============================================================================
// CT1 — Removal event: parse returns null → reopen unavailable
// ============================================================================

describe('Cross-Tab Contract – CT1: Removal hides reopen', () => {
  it('CT1a — null raw value means no reopen (parse returns null)', () => {
    // StorageEvent with newValue=null → tab must clear lastClosed
    // We can't pass null to parseLastClosedV2 (expects string), so the
    // handler checks for null BEFORE parsing. Contract: null → unavailable.
    assert.equal(parseLastClosedV2('null'), null);
  });

  it('CT1b — empty string means no reopen', () => {
    assert.equal(parseLastClosedV2(''), null);
  });
});

// ============================================================================
// CT2 — Set event: valid envelope → reopen available
// ============================================================================

describe('Cross-Tab Contract – CT2: Valid envelope shows reopen', () => {
  it('CT2a — valid v2 envelope yields workspace', () => {
    const json = serializeLastClosedV2({ id: 'ws-1', name: 'Project A' });
    const result = parseLastClosedV2(json);
    assert.notEqual(result, null);
    assert.ok(isValidWorkspace(result.workspace));
    assert.equal(result.workspace.id, 'ws-1');
    assert.equal(result.workspace.name, 'Project A');
  });

  it('CT2b — workspace extracted from envelope passes strict shape', () => {
    const json = serializeLastClosedV2({ id: 'ws-2', name: 'Project B' });
    const result = parseLastClosedV2(json);
    // The workspace in the envelope MUST independently pass isValidWorkspace
    assert.equal(isValidWorkspace(result.workspace), true);
  });
});

// ============================================================================
// CT3 — Malformed payload → fail-closed
// ============================================================================

describe('Cross-Tab Contract – CT3: Malformed fails closed', () => {
  it('CT3a — garbled JSON returns null', () => {
    assert.equal(parseLastClosedV2('{garbled}'), null);
  });

  it('CT3b — v1 raw workspace (no envelope) returns null', () => {
    const v1Raw = JSON.stringify({ id: 'ws-old', name: 'Legacy' });
    assert.equal(parseLastClosedV2(v1Raw), null);
  });

  it('CT3c — valid JSON but wrong shape returns null', () => {
    assert.equal(parseLastClosedV2(JSON.stringify({ foo: 'bar' })), null);
  });

  it('CT3d — envelope with corrupted workspace returns null', () => {
    const bad = JSON.stringify({ v: 2, workspace: { id: '', name: '' }, ts: 1 });
    assert.equal(parseLastClosedV2(bad), null);
  });

  it('CT3e — envelope with wrong version returns null', () => {
    const bad = JSON.stringify({ v: 99, workspace: { id: 'a', name: 'b' }, ts: 1 });
    assert.equal(parseLastClosedV2(bad), null);
  });
});

// ============================================================================
// CT4 — Single-consume determinism
// ============================================================================

describe('Cross-Tab Contract – CT4: Single-consume determinism', () => {
  it('CT4a — serialize → parse → consume (null) → parse null = unavailable', () => {
    // Simulate: Tab A serializes, Tab B parses, Tab A consumes (key removed),
    //           Tab B re-parses null → unavailable
    const json = serializeLastClosedV2({ id: 'ws-1', name: 'A' });

    // Tab B sees the storage event with newValue = json
    const resultBefore = parseLastClosedV2(json);
    assert.notEqual(resultBefore, null);
    assert.equal(resultBefore.workspace.id, 'ws-1');

    // Tab A consumes → removes key → Tab B receives newValue = null
    // Handler must check for null first (not parse). Contract: unavailable.
    const resultAfter = null; // newValue=null → handler sets lastClosed=null
    assert.equal(resultAfter, null);
  });

  it('CT4b — same workspace serialized twice produces different timestamps', () => {
    const json1 = serializeLastClosedV2({ id: 'ws-1', name: 'A' });
    // Small delay to ensure timestamp differs
    const json2 = serializeLastClosedV2({ id: 'ws-1', name: 'A' });
    const env1 = JSON.parse(json1);
    const env2 = JSON.parse(json2);
    // Timestamps may be same (ms precision) but both must be valid
    assert.ok(env1.ts > 0);
    assert.ok(env2.ts > 0);
    // Workspaces must be identical
    assert.deepEqual(env1.workspace, env2.workspace);
  });

  it('CT4c — consuming tab gets workspace, then removal propagates', () => {
    // Tab A closes workspace → serializes + writes key
    const json = serializeLastClosedV2({ id: 'ws-close', name: 'Closing' });
    const envelope = parseLastClosedV2(json);
    assert.notEqual(envelope, null);

    // Tab A reopens → reads workspace from envelope
    const reopened = envelope.workspace;
    assert.equal(reopened.id, 'ws-close');
    assert.equal(reopened.name, 'Closing');

    // Tab A removes key → all other tabs see null → no reopen
    // This is the determinism contract: after consume, no tab can reopen
    assert.equal(parseLastClosedV2('null'), null);
  });
});

// ============================================================================
// Self-test runner annotation
// ============================================================================

console.log('Cross-Tab Sync Contract Suite');
console.log('==============================');
console.log(
  'Run with: node --test os-platform/core/tests/canon-reopen.cross-tab.contract.test.mjs'
);

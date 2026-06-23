/**
 * Scoped strict enforcement — self-test.
 *
 * Canon gates run in STRICT (blocking) mode for canon-owned/runtime-governance
 * paths only; everything else stays advisory (non-blocking). This proves the
 * scoping so global enforcement is NOT turned on.
 * Run: node --test os-platform/core/tests/canon-strict-gates.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync } from 'node:fs';

import {
  runCanonGates,
  isCanonOwnedPath,
  partitionByCanonOwnership,
  CANON_OWNED_PATTERNS,
} from '../gates/canon-gates.mjs';

test('SC.1 canon runtime + gate paths are canon-owned; others are not', () => {
  assert.ok(Array.isArray(CANON_OWNED_PATTERNS) && CANON_OWNED_PATTERNS.length > 0);
  assert.equal(isCanonOwnedPath('os-platform/core/canon/canon-query.mjs'), true);
  assert.equal(isCanonOwnedPath('os-platform/core/canon/tf-canon.mjs'), true);
  assert.equal(isCanonOwnedPath('os-platform/core/gates/canon-gates.mjs'), true);
  assert.equal(isCanonOwnedPath('frontend/apps/os-shell/src/canon/CanonEditor.tsx'), false);
  assert.equal(isCanonOwnedPath('ARCHIVE/old.ts'), false);
});

test('SC.2 partitionByCanonOwnership splits owned vs rest', () => {
  const { owned, rest } = partitionByCanonOwnership([
    'os-platform/core/canon/canon-risk.mjs',
    'frontend/apps/os-shell/src/x.tsx',
    'ARCHIVE/y.ts',
  ]);
  assert.deepEqual(owned, ['os-platform/core/canon/canon-risk.mjs']);
  assert.equal(rest.length, 2);
});

test('SC.3 strict + canonOwnedOnly does NOT block a non-canon violation (scoping holds)', () => {
  // ARCHIVE is a hard violation, but it is NOT canon-owned -> filtered out -> no block.
  const r = runCanonGates(['ARCHIVE/old.ts'], { strict: true, canonOwnedOnly: true });
  assert.equal(r.exitCode, 0);
  assert.equal(r.blocking.length, 0);
});

test('SC.4 strict + canonOwnedOnly BLOCKS a violation on a canon-owned path', () => {
  // A hardcoded port introduced into the canon runtime must block.
  const p = 'os-platform/core/canon/_tmp_strict_port.mjs';
  writeFileSync(p, "export const u = 'http://localhost:3000/x';\n", 'utf8');
  try {
    const r = runCanonGates([p], { strict: true, canonOwnedOnly: true });
    assert.equal(r.blocking.length >= 1, true);
    assert.equal(r.exitCode, 1);
  } finally {
    unlinkSync(p);
  }
});

test('SC.5 global advisory behavior is unchanged (non-canon still reported, exit 0)', () => {
  const r = runCanonGates(['ARCHIVE/old.ts'], { strict: false });
  assert.ok(r.blocking.some((f) => /protected/i.test(f.detail)));
  assert.equal(r.exitCode, 0);
});

test('SC.6 canonOwnedOnly defaults off (scans all paths)', () => {
  const r = runCanonGates(['ARCHIVE/old.ts'], { strict: true });
  assert.equal(r.exitCode, 1); // not filtered -> blocks
});

test('SC.7 a clean canon-owned gate file does NOT self-block under strict', () => {
  // gates/** must have a write-lane owner, else it reads as "unowned" (blocking)
  // and strict enforcement would block its own gate scripts.
  const r = runCanonGates(['os-platform/core/gates/gate-runtime.mjs'], { strict: true, canonOwnedOnly: true });
  assert.equal(r.blocking.length, 0);
  assert.equal(r.exitCode, 0);
});

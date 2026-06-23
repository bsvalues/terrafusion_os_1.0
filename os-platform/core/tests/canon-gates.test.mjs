/**
 * Canon gates aggregator — self-test.
 *
 * Runs all advisory gates over a changed-file set and classifies findings into
 * BLOCKING (protected paths, hardcoded ports, unowned paths) vs ADVISORY
 * (high-risk owned areas). Advisory by default; --strict makes BLOCKING fail.
 * Run: node --test os-platform/core/tests/canon-gates.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runCanonGates } from '../gates/canon-gates.mjs';

test('CG.1 a clean low-risk owned path yields no blocking and no advisory', () => {
  const r = runCanonGates(['docs/TerraCanon/CANON_IDE_REPO_ADAPTATION_PLAN.md']);
  assert.equal(r.blocking.length, 0);
  assert.equal(r.advisory.length, 0);
  assert.equal(r.ok, true);
});

test('CG.2 a protected path is BLOCKING', () => {
  const r = runCanonGates(['ARCHIVE/old.ts']);
  assert.ok(r.blocking.some((f) => /protected/i.test(f.detail)));
  assert.equal(r.ok, false);
});

test('CG.3 an unowned path is BLOCKING', () => {
  const r = runCanonGates(['some/unmapped/area/file.ts']);
  assert.ok(r.blocking.some((f) => /unowned|no write-lane/i.test(f.detail)));
});

test('CG.4 a high-risk OWNED path is ADVISORY, not blocking', () => {
  const r = runCanonGates(['frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx']);
  assert.equal(r.blocking.length, 0);
  assert.ok(r.advisory.some((f) => /high|risk/i.test(f.detail)));
});

test('CG.5 a hardcoded port is BLOCKING', () => {
  const p = join(tmpdir(), `canon-gates-hp-${process.pid}.ts`);
  writeFileSync(p, "const u = 'http://localhost:3000/api';\n", 'utf8');
  try {
    const r = runCanonGates([p]);
    assert.ok(r.blocking.some((f) => /port/i.test(f.detail)));
  } finally {
    unlinkSync(p);
  }
});

test('CG.6 strict mode exits non-zero on blocking; advisory exits 0', () => {
  const strict = runCanonGates(['ARCHIVE/old.ts'], { strict: true });
  assert.equal(strict.exitCode, 1);
  const advisory = runCanonGates(['ARCHIVE/old.ts'], { strict: false });
  assert.equal(advisory.exitCode, 0);
});

test('CG.7 strict mode with only advisory findings still exits 0', () => {
  const r = runCanonGates(['frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx'], { strict: true });
  assert.equal(r.exitCode, 0);
});

test('CG.8 never throws on odd input', () => {
  assert.doesNotThrow(() => runCanonGates(undefined));
  assert.doesNotThrow(() => runCanonGates([]));
});

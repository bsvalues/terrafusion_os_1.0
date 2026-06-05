/**
 * Advisory gate: canon-write-lane-check — self-test.
 *
 * Resolves owner / required gates / risk for changed paths via the read-only
 * Canon query layer and surfaces advisories. Advisory by default.
 * Run: node --test os-platform/core/tests/canon-write-lane-check.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { checkWriteLanes } from '../gates/canon-write-lane-check.mjs';

test('WL.1 os-shell path resolves owner, high risk, and gates', () => {
  const { results } = checkWriteLanes(['frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx']);
  assert.equal(results.length, 1);
  assert.equal(results[0].owner, 'os-shell');
  assert.equal(results[0].risk, 'high');
  assert.ok(results[0].requiredGates.includes('typecheck'));
});

test('WL.2 unowned path raises an advisory', () => {
  const { results, advisories } = checkWriteLanes(['some/unmapped/area/file.ts']);
  assert.equal(results[0].confidence, 'fallback');
  assert.ok(advisories.some((a) => a.path === 'some/unmapped/area/file.ts' && /unowned|no write-lane/i.test(a.detail)));
});

test('WL.3 canon-runtime path resolves to canon-runtime owner', () => {
  const { results } = checkWriteLanes(['os-platform/core/canon/canon-loader.mjs']);
  assert.equal(results[0].owner, 'canon-runtime');
});

test('WL.4 returns a result per path and never throws', () => {
  assert.doesNotThrow(() => {
    const { results } = checkWriteLanes(['a/b.ts', 'docs/TerraCanon/x.md']);
    assert.equal(results.length, 2);
  });
  assert.doesNotThrow(() => checkWriteLanes(undefined));
});

test('WL.5 low-risk docs path produces no high-risk advisory', () => {
  const { advisories } = checkWriteLanes(['docs/TerraCanon/CANON_IDE_REPO_ADAPTATION_PLAN.md']);
  assert.equal(
    advisories.filter((a) => a.path === 'docs/TerraCanon/CANON_IDE_REPO_ADAPTATION_PLAN.md').length,
    0,
  );
});

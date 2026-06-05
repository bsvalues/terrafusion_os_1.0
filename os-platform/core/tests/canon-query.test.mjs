/**
 * Canon Runtime Query MVP — self-test.
 *
 * Proves the read-only Canon layer can answer path / task / owner / gate / risk
 * questions from static law. Dep-free: node --test on plain .mjs.
 *
 * Run: node --test os-platform/core/tests/canon-query.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRulesForPath,
  getRulesForTask,
  getOwnerForPath,
  getRequiredGatesForPath,
  scorePathRisk,
} from '../canon/index.mjs';

test('1. moduleActivation path resolves to os-shell owner', () => {
  const res = getOwnerForPath('frontend/apps/os-shell/src/orchestration/moduleActivation.ts');
  assert.equal(res.owner, 'os-shell');
  assert.equal(res.confidence, 'pattern');
});

test('2. DesktopIconGrid path resolves to os-shell owner', () => {
  const res = getOwnerForPath('frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx');
  assert.equal(res.owner, 'os-shell');
});

test('3. existing src/canon/** resolves to os-canon owner', () => {
  const res = getOwnerForPath('frontend/apps/os-shell/src/canon/CanonEditor.tsx');
  assert.equal(res.owner, 'os-canon');
});

test('4. reserved modules/os-canon/** also resolves to os-canon owner', () => {
  const res = getOwnerForPath('frontend/apps/os-shell/src/modules/os-canon/CanonWorkbench.tsx');
  assert.equal(res.owner, 'os-canon');
});

test('5. os-platform/core/canon/** resolves to canon-runtime owner', () => {
  const res = getOwnerForPath('os-platform/core/canon/canon-query.mjs');
  assert.equal(res.owner, 'canon-runtime');
});

test('6. launch-surface-contract test path has the shell contract gate', () => {
  const gates = getRequiredGatesForPath('os-platform/core/tests/launch-surface-contract.test.mjs');
  assert.ok(
    gates.includes('launch-surface-contract'),
    `expected launch-surface-contract gate, got: ${gates.join(', ')}`,
  );
});

test('7. shell routing paths score high risk', () => {
  const risk = scorePathRisk('frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx');
  assert.equal(risk.level, 'high');
  assert.ok(Array.isArray(risk.reasons) && risk.reasons.length > 0);
});

test('8. docs/TerraCanon/** scores low risk / reference-only', () => {
  const risk = scorePathRisk('docs/TerraCanon/CANON_IDE_REPO_ADAPTATION_PLAN.md');
  assert.equal(risk.level, 'low');
  assert.equal(risk.manualReviewRequired, false);
});

test('9. unknown path falls back safely (no throw)', () => {
  assert.doesNotThrow(() => {
    const owner = getOwnerForPath('some/totally/unknown/area/file.txt');
    assert.equal(owner.confidence, 'fallback');
    assert.equal(owner.owner, 'unassigned');
    const risk = scorePathRisk('some/totally/unknown/area/file.txt');
    assert.ok(['low', 'medium', 'high', 'critical'].includes(risk.level));
  });
});

test('10. task intent "fix os-canon shell launch drift" returns shell surface rules', () => {
  const rules = getRulesForTask('fix os-canon shell launch drift');
  assert.ok(rules.length > 0, 'expected at least one rule for the os-canon shell intent');
  assert.ok(
    rules.some((r) => r.appliesTo.surfaces.includes('os-canon')),
    'expected at least one os-canon surface rule',
  );
});

test('bonus: getRulesForPath returns the in-shell rule for os-shell paths', () => {
  const rules = getRulesForPath('frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx');
  assert.ok(rules.some((r) => r.ruleId === 'surface.os-canon.in-shell'));
});

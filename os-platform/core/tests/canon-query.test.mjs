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
import { loadCanon, validateCanonConfig } from '../canon/canon-loader.mjs';

/**
 * A minimal VALID raw config (the shape read from the three JSON files).
 * Tests deep-clone this and mutate copies to assert fail-loud behavior.
 */
function validRawConfig() {
  return {
    index: {
      version: '0.1.0',
      rules: [
        {
          ruleId: 'test.rule.one',
          version: '1.0.0',
          status: 'active',
          authority: 'os-platform',
          title: 'Test rule',
          description: 'A valid test rule.',
          source: 'unit test',
          appliesTo: {
            paths: ['frontend/apps/os-shell/src/**'],
            taskIntents: ['shell-launch'],
            surfaces: ['os-canon'],
          },
          enforcement: {
            level: 'block',
            requiredGates: ['typecheck'],
            requiresManualReview: true,
          },
        },
      ],
    },
    lanes: {
      version: '0.1.0',
      lanes: [
        {
          owner: 'os-shell',
          paths: ['frontend/apps/os-shell/src/**'],
          risk: 'high',
          requiredGates: ['typecheck'],
          manualReviewRequired: true,
        },
      ],
    },
    gates: {
      version: '0.1.0',
      gates: [{ gateId: 'typecheck', label: 'Type Check', command: 'pnpm run type-check' }],
    },
  };
}

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

// ---------------------------------------------------------------------------
// Fail-loud loader hardening: invalid Canon config must throw, never silently
// soften governance. validateCanonConfig({index, lanes, gates}) is the pure
// validator that loadCanon() runs after reading the JSON files.
// ---------------------------------------------------------------------------

test('FL.0 real on-disk config loads without throwing', () => {
  assert.doesNotThrow(() => {
    const canon = loadCanon({ reload: true });
    assert.ok(canon.rules.length > 0);
    assert.ok(canon.lanes.length > 0);
    assert.ok(canon.gates.length > 0);
  });
});

test('FL.1 valid config validates and returns a frozen canon', () => {
  const raw = validRawConfig();
  const canon = validateCanonConfig(raw);
  assert.equal(canon.rules.length, 1);
  assert.equal(canon.lanes.length, 1);
  assert.equal(canon.gates.length, 1);
  assert.ok(Object.isFrozen(canon));
  assert.ok(Object.isFrozen(canon.rules));
});

test('FL.2 rule missing appliesTo.paths array fails loudly', () => {
  const raw = validRawConfig();
  delete raw.index.rules[0].appliesTo.paths;
  assert.throws(() => validateCanonConfig(raw), /paths/i);
});

test('FL.3 rule with non-boolean requiresManualReview fails loudly (no silent coerce)', () => {
  const raw = validRawConfig();
  raw.index.rules[0].enforcement.requiresManualReview = 'yes';
  assert.throws(() => validateCanonConfig(raw), /requiresManualReview/i);
});

test('FL.4 rule that applies to nothing (all appliesTo arrays empty) fails loudly', () => {
  const raw = validRawConfig();
  raw.index.rules[0].appliesTo.paths = [];
  raw.index.rules[0].appliesTo.taskIntents = [];
  raw.index.rules[0].appliesTo.surfaces = [];
  assert.throws(() => validateCanonConfig(raw), /appliesTo|matches nothing/i);
});

test('FL.5 enforcement missing requiredGates array fails loudly', () => {
  const raw = validRawConfig();
  delete raw.index.rules[0].enforcement.requiredGates;
  assert.throws(() => validateCanonConfig(raw), /requiredGates/i);
});

test('FL.6 lane with unknown risk level fails loudly', () => {
  const raw = validRawConfig();
  raw.lanes.lanes[0].risk = 'spicy';
  assert.throws(() => validateCanonConfig(raw), /risk/i);
});

test('FL.7 lane missing owner fails loudly', () => {
  const raw = validRawConfig();
  delete raw.lanes.lanes[0].owner;
  assert.throws(() => validateCanonConfig(raw), /owner/i);
});

test('FL.8 lane with non-boolean manualReviewRequired fails loudly', () => {
  const raw = validRawConfig();
  raw.lanes.lanes[0].manualReviewRequired = 1;
  assert.throws(() => validateCanonConfig(raw), /manualReviewRequired/i);
});

test('FL.9 requiredGates referencing an unknown gate id fails loudly', () => {
  const raw = validRawConfig();
  raw.lanes.lanes[0].requiredGates = ['no-such-gate'];
  assert.throws(() => validateCanonConfig(raw), /no-such-gate|unknown gate/i);
});

test('FL.10 duplicate ruleId fails loudly', () => {
  const raw = validRawConfig();
  raw.index.rules.push(structuredClone(raw.index.rules[0]));
  assert.throws(() => validateCanonConfig(raw), /duplicate|ruleId/i);
});

test('FL.11 duplicate lane owner fails loudly', () => {
  const raw = validRawConfig();
  raw.lanes.lanes.push(structuredClone(raw.lanes.lanes[0]));
  assert.throws(() => validateCanonConfig(raw), /duplicate|owner/i);
});

test('FL.12 rule referencing unknown gate id fails loudly', () => {
  const raw = validRawConfig();
  raw.index.rules[0].enforcement.requiredGates = ['ghost-gate'];
  assert.throws(() => validateCanonConfig(raw), /ghost-gate|unknown gate/i);
});

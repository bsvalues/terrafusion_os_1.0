import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './canon.mjs';
import {
  derivePolicy,
  renderWorkOrder,
  parsePolicy,
  reviewAgainstPolicy,
  slugify,
  globToRe,
} from './workorder.mjs';

const c = classify('fix dais appeal persistence');
c.riskLevel = 'R3';
const policy = derivePolicy('WO-0042', 'fix dais appeal persistence', c);

test('derivePolicy: suite-scoped allowed + forbids other suites + base protected paths', () => {
  assert.ok(
    policy.allowed_files.some(p => /Dais/.test(p)),
    'allows Dais-scoped paths'
  );
  assert.ok(
    policy.forbidden_patterns.some(p => /Forge/.test(p)),
    'forbids other suite (Forge)'
  );
  assert.ok(policy.forbidden_patterns.includes('frontend/src/**'), 'forbids legacy frontend');
  assert.ok(
    policy.forbidden_patterns.includes('docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md'),
    'forbids TF-052'
  );
});

test('render → parse round-trips the machine policy', () => {
  const md = renderWorkOrder(policy, c);
  const parsed = parsePolicy(md);
  assert.equal(parsed.id, 'WO-0042');
  assert.deepEqual(parsed.forbidden_patterns, policy.forbidden_patterns);
});

test('reviewAgainstPolicy: forbidden file → BLOCK', () => {
  const r = reviewAgainstPolicy(['backend/src/TerraFusion.Core/Entities/ForgeModel.cs'], policy);
  assert.equal(r.verdict, 'BLOCK');
  assert.equal(r.forbidden.length, 1);
});

test('reviewAgainstPolicy: in-scope file → PROCEED', () => {
  const r = reviewAgainstPolicy(['docs/brain/memory/drift-ledger.md'], policy);
  assert.equal(r.verdict, 'PROCEED');
});

test('reviewAgainstPolicy: unrelated allowed-but-unlisted → PROCEED WITH WARNINGS', () => {
  const r = reviewAgainstPolicy(['backend/src/TerraFusion.API/Program.cs'], policy);
  assert.equal(r.verdict, 'PROCEED WITH WARNINGS');
  assert.equal(r.outOfScope.length, 1);
});

test('slugify + globToRe basics', () => {
  assert.equal(slugify('Wire X into Y!'), 'wire-x-into-y');
  assert.ok(globToRe('frontend/src/**').test('frontend/src/legacy/A.tsx'));
  assert.ok(!globToRe('frontend/src/**').test('frontend/apps/os-shell/A.tsx'));
});

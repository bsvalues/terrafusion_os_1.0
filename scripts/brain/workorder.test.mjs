import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './canon.mjs';
import {
  derivePolicy,
  renderWorkOrder,
  parsePolicy,
  reviewAgainstPolicy,
  slugify,
  globToRe,
  loadWorkOrderPolicy,
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

test('loadWorkOrderPolicy: matches exact WO id and not longer numeric prefixes', () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const dir = path.join(repoRoot, 'docs', 'brain', 'workorders', 'active');
  const exact = path.join(dir, 'WO-8811-scope.md');
  const longer = path.join(dir, 'WO-88110-prefix-collision.md');
  try {
    writeFileSync(
      exact,
      '# WO-8811\n\n```json\n{"id":"WO-8811","allowed_files":["exact"],"forbidden_patterns":[]}\n```\n',
      'utf8'
    );
    writeFileSync(
      longer,
      '# WO-88110\n\n```json\n{"id":"WO-88110","allowed_files":["longer"],"forbidden_patterns":[]}\n```\n',
      'utf8'
    );
    const found = loadWorkOrderPolicy(repoRoot, 'WO-8811');
    assert.deepEqual(found?.allowed_files, ['exact']);
  } finally {
    rmSync(exact, { force: true });
    rmSync(longer, { force: true });
  }
});

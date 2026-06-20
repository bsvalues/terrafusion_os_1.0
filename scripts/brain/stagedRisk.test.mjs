import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './canon.mjs';
import { derivePolicy, evaluateStagedRisk } from './workorder.mjs';

/**
 * WO-0011 commit-race hardening: staged-but-uncommitted files in a shared worktree are silently
 * absorbed by whichever agent commits next (observed twice: 1e75e628c, a3fcb143b).
 */
const c = classify('fix dais appeal persistence');
c.riskLevel = 'R3';
const policy = derivePolicy('WO-0042', 'fix dais appeal persistence', c);

test('no staged files → none (normal)', () => {
  const r = evaluateStagedRisk([], policy);
  assert.equal(r.level, 'none');
  assert.equal(r.count, 0);
});

test('staged allowed files → warn (flagged: commit immediately or unstage)', () => {
  const r = evaluateStagedRisk(['docs/brain/memory/drift-ledger.md'], policy);
  assert.equal(r.level, 'warn');
  assert.equal(r.forbidden.length, 0);
});

test('staged forbidden files → block', () => {
  const r = evaluateStagedRisk(['backend/src/TerraFusion.Core/Entities/ForgeModel.cs'], policy);
  assert.equal(r.level, 'block');
  assert.equal(r.forbidden.length, 1);
});

test('staged unlisted files → warn with outOfScope', () => {
  const r = evaluateStagedRisk(['backend/src/TerraFusion.API/Program.cs'], policy);
  assert.equal(r.level, 'warn');
  assert.equal(r.outOfScope.length, 1);
});

test('staged files with NO active policy → warn (unattended staged state is the hazard)', () => {
  const r = evaluateStagedRisk(['anything.txt'], null);
  assert.equal(r.level, 'warn');
  assert.equal(r.count, 1);
});

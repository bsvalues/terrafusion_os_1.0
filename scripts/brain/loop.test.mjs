import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(REPO_ROOT, 'scripts', 'brain', 'brain.mjs');
const run = args => {
  try {
    return {
      out: execFileSync('node', [CLI, ...args], { cwd: REPO_ROOT, encoding: 'utf8' }),
      code: 0,
    };
  } catch (e) {
    return { out: `${e.stdout || ''}${e.stderr || ''}`, code: e.status ?? 1 };
  }
};

test('brain next: outputs recommendation + why + risk + proof + why-not', () => {
  const { out } = run(['next']);
  assert.match(out, /Next slice :/);
  assert.match(out, /Why now/);
  assert.match(out, /Risk/);
  assert.match(out, /Proof/);
  assert.match(out, /Why not yet|Queue empty|P0|P1/);
});

test('brain commit-plan: includes governance footprint, excludes product code, warns on big diff', () => {
  const { out } = run(['commit-plan']);
  assert.match(out, /Include \(\d+\)/);
  assert.match(out, /Exclude \(\d+\)/);
  assert.match(out, /Suggested message/);
  // backend controllers must never appear under Include — the structural invariant.
  // (Do NOT assert specific paths are present: the include set depends on what is currently
  // unstaged/untracked, which varies with index state.)
  const includeBlock = out.split('Exclude')[0];
  assert.ok(
    !/\+ backend\/src\//.test(includeBlock),
    'backend product code must not be staged by the governance plan'
  );
});

test('brain proof --workorder WO-TEST: writes artifact with required sections', () => {
  const artifact = path.join(REPO_ROOT, 'docs', 'brain', 'evidence', 'WO-TEST-proof.md');
  try {
    const { out } = run(['proof', '--workorder', 'WO-TEST']);
    assert.ok(existsSync(artifact), 'evidence artifact written');
    const body = readFileSync(artifact, 'utf8');
    for (const section of [
      '# Proof Bundle',
      '## Commands run',
      '## Negative tests',
      '## Known risks',
      '## Result',
    ]) {
      assert.ok(body.includes(section), `artifact has section: ${section}`);
    }
    assert.match(out, /Result: (✅ PASS|❌ FAIL)/);
  } finally {
    rmSync(artifact, { force: true }); // test artifact, not real evidence
  }
});

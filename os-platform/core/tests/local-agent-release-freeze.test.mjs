import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function runCliOk(repoRoot, ...args) {
  const result = runCli(repoRoot, ...args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function seedReleaseEvidence(repoRoot) {
  runCliOk(repoRoot, 'command-registry');
  runCliOk(repoRoot, 'control-center-state');
  runCliOk(repoRoot, 'release-notes');
  runCliOk(repoRoot, 'product-manifest');
  runCliOk(repoRoot, 'release-check');
  runCliOk(repoRoot, 'docs-index');
}

describe('Local agent release freeze card', () => {
  it('writes freeze artifacts after passing release evidence', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-freeze-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      seedReleaseEvidence(root);
      const result = runCli(root, 'release-freeze');
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.match(result.stdout, /TerraFusion Release Freeze Card/);
      assert.match(result.stdout, /release-freeze-card\.json/);

      const payload = JSON.parse(readFileSync(resolve(root, '.terrafusion/release-freeze-card.json'), 'utf8'));
      assert.equal(payload.freezeStatus, 'launch-ready-root-dependency-remediation-pending');
      assert.equal(payload.launchVerdict, 'launch-ready');
      assert.equal(payload.canonicalCloseout, 'Local Agent: release-truth complete, source-code security clean, root dependency remediation pending.');
      assert.ok(payload.guardedArtifacts.some(item => item.path === '.terrafusion/release-check-report.json' && item.ok === true));
      assert.ok(payload.guardedArtifacts.some(item => item.path === '.terrafusion/product-manifest.json' && /^[a-f0-9]{64}$/.test(item.sha256)));
      assert.ok(payload.proofGates.some(item => /local-agent-launch-smoke/.test(item.command)));
      assert.ok(payload.proofGates.some(item => /pnpm run test:local-agent/.test(item.command)));
      assert.ok(payload.disclosures.some(item => /root dependency remediation remains pending/i.test(item)));

      const markdown = readFileSync(resolve(root, '.terrafusion/release-freeze-card.md'), 'utf8');
      assert.match(markdown, /Canonical Closeout/);
      assert.match(markdown, /Authority Boundary/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails fast when release evidence has not been written', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-freeze-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const result = runCli(root, 'release-freeze');
      assert.equal(result.status, 2);
      assert.match(result.stderr, /Release freeze requires passing release evidence first/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
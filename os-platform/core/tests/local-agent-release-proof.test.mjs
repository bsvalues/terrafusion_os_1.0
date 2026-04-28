import assert from 'node:assert';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

function createReleaseProofHarness() {
  const harnessRoot = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-proof-harness-'));
  const pilotRoot = resolve(harnessRoot, 'os-platform/core/pilot');
  mkdirSync(pilotRoot, { recursive: true });
  cpSync(resolve(process.cwd(), 'os-platform/core/pilot/local-agent'), resolve(pilotRoot, 'local-agent'), {
    recursive: true,
  });
  cpSync(
    resolve(process.cwd(), 'os-platform/core/pilot/local-agent-release-proof.mjs'),
    resolve(pilotRoot, 'local-agent-release-proof.mjs'),
  );
  cpSync(
    resolve(process.cwd(), 'os-platform/core/pilot/local-agent-release-proof-wrapper.mjs'),
    resolve(pilotRoot, 'local-agent-release-proof-wrapper.mjs'),
  );
  cpSync(
    resolve(process.cwd(), 'os-platform/core/pilot/run-local-agent-release-proof.ps1'),
    resolve(pilotRoot, 'run-local-agent-release-proof.ps1'),
  );
  cpSync(
    resolve(process.cwd(), 'os-platform/core/pilot/run-local-agent-release-proof.cmd'),
    resolve(pilotRoot, 'run-local-agent-release-proof.cmd'),
  );
  writeFileSync(resolve(harnessRoot, 'package.json'), '{}\n', 'utf8');
  return harnessRoot;
}

function runHarnessScript(harnessRoot, scriptName) {
  return spawnSync('node', [resolve(harnessRoot, 'os-platform/core/pilot', scriptName)], {
    cwd: harnessRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function readReleaseProofReport(harnessRoot) {
  return JSON.parse(
    readFileSync(resolve(harnessRoot, 'os-platform/core/pilot/evidence/local-agent-release-proof.latest.json'), 'utf8'),
  );
}

describe('Local agent release proof', () => {
  it('declares a combined local-agent release proof gate script', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    assert.equal(
      packageJson.scripts['proof:local-agent:gate'],
      'pnpm run test:local-agent && pnpm run proof:local-agent:release',
    );
  });

  it('writes governed release-proof evidence from a temp harness repo', () => {
    const harnessRoot = createReleaseProofHarness();

    try {
      const result = runHarnessScript(harnessRoot, 'local-agent-release-proof.mjs');
      assert.equal(result.status, 0, result.stderr);

      const reportPath = resolve(harnessRoot, 'os-platform/core/pilot/evidence/local-agent-release-proof.latest.json');
      const summaryPath = resolve(harnessRoot, 'os-platform/core/pilot/evidence/local-agent-release-proof.latest.md');
      assert.ok(existsSync(reportPath));
      assert.ok(existsSync(summaryPath));
      assert.match(result.stdout, /Evidence written to/);
      assert.match(result.stdout, /Summary written to/);

      const report = JSON.parse(readFileSync(reportPath, 'utf8'));
      assert.equal(report.summary.ok, true);
      assert.equal(report.summary.failureCommand, null);
      assert.equal(report.cleanedUp, true);
      assert.ok(Array.isArray(report.commands));
      assert.deepEqual(
        report.commands.map(command => command.label),
        [
          'command-registry',
          'control-center-state',
          'release-notes',
          'product-manifest',
          'release-check',
          'docs-index',
          'release-freeze',
          'ship-mvp',
          'tag-gate',
          'release-approve',
          'tag-command',
          'release-runbook',
        ],
      );
      assert.ok(report.commands.every(command => command.ok === true));
      assert.equal(report.artifactSummary.releaseCheck.ok, true);
      assert.equal(report.artifactSummary.releaseFreeze.freezeStatus, 'launch-ready-root-dependency-remediation-pending');
      assert.equal(report.artifactSummary.releaseFreeze.launchVerdict, 'launch-ready');
      assert.equal(report.artifactSummary.shipReport.ok, true);
      assert.equal(report.artifactSummary.tagGate.ok, true);
      assert.equal(report.artifactSummary.releaseApproval.approverName, 'Founder');
      assert.equal(report.artifactSummary.releaseRunbook.version, '0.1.0');
      assert.ok(report.artifacts.some(artifact => artifact.path === '.terrafusion/release-freeze-card.json'));
      assert.equal(report.artifactSummary.shipReport.outputDir, 'release');
      assert.ok(report.artifacts.some(artifact => artifact.path === 'release/release-manifest.json'));
      assert.ok(report.artifacts.some(artifact => artifact.path === 'release/checksums.sha256'));
      assert.ok(report.artifacts.some(artifact => artifact.path === 'CHANGELOG.md'));
    } finally {
      rmSync(harnessRoot, { recursive: true, force: true });
    }
  });

  it('clears stale wrapper error state after a successful rerun', () => {
    const harnessRoot = createReleaseProofHarness();
    const evidenceDir = resolve(harnessRoot, 'os-platform/core/pilot/evidence');
    const errorPath = resolve(evidenceDir, 'local-agent-release-proof.error.json');
    const markerPath = resolve(evidenceDir, 'local-agent-release-proof.wrapper.json');

    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(errorPath, '{"stale":true}\n', 'utf8');

    try {
      const result = runHarnessScript(harnessRoot, 'local-agent-release-proof-wrapper.mjs');
      assert.equal(result.status, 0, result.stderr);
      assert.equal(existsSync(errorPath), false);
      assert.ok(existsSync(markerPath));

      const marker = JSON.parse(readFileSync(markerPath, 'utf8'));
      assert.equal(marker.stage, 'wrapper-success');
      assert.equal(marker.cwd, harnessRoot);

      const report = readReleaseProofReport(harnessRoot);
      assert.equal(report.summary.ok, true);
      assert.equal(report.cleanedUp, true);
    } finally {
      rmSync(harnessRoot, { recursive: true, force: true });
    }
  });

  it('runs the PowerShell wrapper from outside the repo root on Windows', { skip: process.platform !== 'win32' }, () => {
    const harnessRoot = createReleaseProofHarness();
    const outsideCwd = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-proof-ps1-cwd-'));

    try {
      const result = spawnSync('pwsh', ['-File', resolve(harnessRoot, 'os-platform/core/pilot/run-local-agent-release-proof.ps1')], {
        cwd: outsideCwd,
        encoding: 'utf8',
        windowsHide: true,
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Evidence written to/);

      const marker = JSON.parse(
        readFileSync(resolve(harnessRoot, 'os-platform/core/pilot/evidence/local-agent-release-proof.wrapper.json'), 'utf8'),
      );
      assert.equal(marker.stage, 'wrapper-success');
      assert.equal(marker.cwd, harnessRoot);

      const report = readReleaseProofReport(harnessRoot);
      assert.equal(report.summary.ok, true);
      assert.equal(report.cleanedUp, true);
    } finally {
      rmSync(harnessRoot, { recursive: true, force: true });
      rmSync(outsideCwd, { recursive: true, force: true });
    }
  });

  it('runs the cmd wrapper from outside the repo root on Windows', { skip: process.platform !== 'win32' }, () => {
    const harnessRoot = createReleaseProofHarness();
    const outsideCwd = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-proof-cmd-cwd-'));

    try {
      const result = spawnSync('cmd.exe', ['/c', resolve(harnessRoot, 'os-platform/core/pilot/run-local-agent-release-proof.cmd')], {
        cwd: outsideCwd,
        encoding: 'utf8',
        windowsHide: true,
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.match(result.stdout, /Evidence written to/);

      const marker = JSON.parse(
        readFileSync(resolve(harnessRoot, 'os-platform/core/pilot/evidence/local-agent-release-proof.wrapper.json'), 'utf8'),
      );
      assert.equal(marker.stage, 'wrapper-success');
      assert.equal(marker.cwd, harnessRoot);

      const report = readReleaseProofReport(harnessRoot);
      assert.equal(report.summary.ok, true);
      assert.equal(report.cleanedUp, true);
    } finally {
      rmSync(harnessRoot, { recursive: true, force: true });
      rmSync(outsideCwd, { recursive: true, force: true });
    }
  });
});
import assert from 'node:assert';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

const TEST_LOCAL_MODEL_PORT = process.env.TF_LOCAL_MODEL_PORT?.trim() || '11434';
const TEST_LOCAL_MODEL_ENDPOINT = `http://127.0.0.1:${TEST_LOCAL_MODEL_PORT}/v1`;

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, '--repo-root', repoRoot, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
  });
}

function runCliOk(repoRoot, ...args) {
  const result = runCli(repoRoot, ...args);
  assert.equal(result.status, 0, `expected ${args.join(' ')} to succeed, stderr: ${result.stderr}`);
  return result;
}

function createTempRepo() {
  const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-check-'));
  writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
  return root;
}

function writeArtifact(root, path, payload) {
  const fullPath = resolve(root, path);
  writeFileSync(fullPath, typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2), 'utf8');
}

function seedRequiredReleaseArtifacts(root) {
  runCliOk(root, 'command-registry');
  runCliOk(root, 'control-center-state');
  runCliOk(root, 'release-notes');
  runCliOk(root, 'product-manifest');
}

function readReport(root) {
  return JSON.parse(readFileSync(resolve(root, '.terrafusion/release-check-report.json'), 'utf8'));
}

describe('Local agent release check', () => {
  it('blocks when required release artifacts are missing and writes release-check artifacts', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'release-check');
      assert.equal(result.status, 1);
      assert.match(result.stdout, /TerraFusion Release Check/);
      assert.ok(existsSync(resolve(root, '.terrafusion/release-check-report.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/release-check-report.md')));

      const report = readReport(root);
      assert.equal(report.ok, false);
      assert.equal(report.releaseStatus, 'blocked');
      assert.ok(report.criticalFailures >= 1);
      assert.ok(report.items.some(item => item.name === 'Command Registry' && item.severity === 'critical' && item.ok === false));
      assert.ok(report.items.some(item => item.name === 'Doctor Report' && item.severity === 'warning' && item.ok === false));
      assert.ok(report.items.some(item => item.name === 'Model Runtime Status' && item.severity === 'warning' && item.ok === false));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports doctor and model runtime diagnostics as optional warnings when missing', () => {
    const root = createTempRepo();
    seedRequiredReleaseArtifacts(root);

    try {
      const result = runCli(root, 'release-check');
      assert.equal(result.status, 0);

      const report = readReport(root);
      assert.equal(report.ok, true);
      assert.equal(report.warnings, 2);
      assert.deepEqual(
        report.items
          .filter(item => item.severity === 'warning')
          .map(item => item.name)
          .sort(),
        ['Doctor Report', 'Model Runtime Status'],
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('passes optional diagnostic checks when doctor artifacts are present', () => {
    const root = createTempRepo();
    seedRequiredReleaseArtifacts(root);
    writeArtifact(root, '.terrafusion/doctor-report.json', { overallStatus: 'warn', criticalFailures: 0, warnings: 1 });
    writeArtifact(root, '.terrafusion/model-runtime-status.json', {
      healthy: false,
      endpoint: TEST_LOCAL_MODEL_ENDPOINT,
      model: 'local-coder',
      startupMode: 'manual',
      warnings: ['offline'],
      status: 'offline',
      modelCount: 1,
    });

    try {
      const result = runCli(root, 'release-check');
      assert.equal(result.status, 0);

      const report = readReport(root);
      const diagnostics = Object.fromEntries(report.items.map(item => [item.name, item]));
      assert.equal(diagnostics['Doctor Report'].ok, true);
      assert.equal(diagnostics['Doctor Report'].severity, 'info');
      assert.equal(diagnostics['Model Runtime Status'].ok, true);
      assert.equal(diagnostics['Model Runtime Status'].severity, 'info');
      assert.equal(report.warnings, 0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('preserves required evidence blockers even when optional diagnostics are present', () => {
    const root = createTempRepo();
    runCliOk(root, 'command-registry');
    runCliOk(root, 'release-notes');
    writeArtifact(root, '.terrafusion/doctor-report.json', { overallStatus: 'pass', criticalFailures: 0, warnings: 0 });
    writeArtifact(root, '.terrafusion/model-runtime-status.json', {
      healthy: true,
      endpoint: TEST_LOCAL_MODEL_ENDPOINT,
      model: 'local-coder',
      startupMode: 'manual',
      warnings: [],
      status: 'ok',
      modelCount: 1,
    });

    try {
      const result = runCli(root, 'release-check');
      assert.equal(result.status, 1);

      const report = readReport(root);
      assert.equal(report.ok, false);
      assert.ok(report.items.some(item => item.name === 'Control Center State' && item.severity === 'critical' && item.ok === false));
      assert.ok(report.items.some(item => item.name === 'Product Manifest' && item.severity === 'critical' && item.ok === false));
      assert.ok(report.items.some(item => item.name === 'Doctor Report' && item.ok === true));
      assert.ok(report.items.some(item => item.name === 'Model Runtime Status' && item.ok === true));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not mention stale non-existent commands in output artifacts', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'release-check');
      assert.equal(result.status, 1);

      const reportJson = readFileSync(resolve(root, '.terrafusion/release-check-report.json'), 'utf8');
      const reportMarkdown = readFileSync(resolve(root, '.terrafusion/release-check-report.md'), 'utf8');
      assert.doesNotMatch(reportJson, /model-supervisor|support-report/);
      assert.doesNotMatch(reportMarkdown, /model-supervisor|support-report/);
      assert.match(result.stdout, /release-check-report\.json/);
      assert.match(result.stdout, /release-check-report\.md/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/post-db-refresh-rerun.mjs');

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function readReport(root) {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'generated', 'truth', 'post-db-refresh-rerun.json'), 'utf8')
  );
}

function readConsoleSummary(stdout) {
  const marker = 'post-db-refresh-rerun.md';
  const markerAt = stdout.lastIndexOf(marker);
  assert.notEqual(markerAt, -1, stdout);
  return JSON.parse(stdout.slice(markerAt + marker.length).trim());
}

test('fails fast when runtime API preflight is unavailable', () => {
  const root = makeTempRepo('tf-post-db-refresh-unavailable-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_RUNTIME_BASE_URL: 'http://127.0.0.1:1',
      TF_POST_DB_REFRESH_PREFLIGHT_TIMEOUT_MS: '1000',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Should not run',
          command: process.execPath,
          args: ['-e', 'process.exit(0)'],
        },
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.nextAction.code, 'start_or_fix_runtime_api');
  assert.equal(report.nextAction.command, 'pnpm run truth:post-db-refresh-rerun');
  assert.equal(report.configuration.commandSource, 'env_override');
  assert.equal(report.configuration.skipPreflight, false);
  assert.equal(report.configuration.preflightTimeoutMs, 1000);
  assert.equal(report.summary.commandsPlanned, 1);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.deepEqual(
    report.plannedCommands.map(item => item.command),
    [`${process.execPath} -e process.exit(0)`]
  );
  assert.equal(report.results.length, 0);
  assert.ok(report.blockers.some(item => item.includes('Runtime API preflight failed')));
  const markdown = fs.readFileSync(
    path.join(root, 'generated', 'truth', 'post-db-refresh-rerun.md'),
    'utf8'
  );
  assert.match(markdown, /## Next Action/);
  assert.match(markdown, /## Configuration/);
  assert.match(markdown, /## Planned Command Sequence/);
});

test('dry run records plan without probing or executing commands', () => {
  const root = makeTempRepo('tf-post-db-refresh-dry-run-');
  const result = spawnSync('node', [scriptPath, root, '--dry-run'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_RUNTIME_BASE_URL: 'http://127.0.0.1:1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Should not run',
          command: process.execPath,
          args: ['-e', 'process.exit(0)'],
        },
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'DRY_RUN');
  assert.equal(report.nextAction.code, 'run_live_fast_gate');
  assert.equal(report.nextAction.command, 'pnpm run truth:post-db-refresh-rerun');
  assert.equal(readConsoleSummary(result.stdout).nextAction.code, 'run_live_fast_gate');
  assert.equal(report.configuration.dryRun, true);
  assert.equal(report.preflight.skipped, true);
  assert.equal(report.summary.commandsPlanned, 1);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.equal(report.results.length, 0);
  assert.deepEqual(
    report.plannedCommands.map(item => item.command),
    [`${process.execPath} -e process.exit(0)`]
  );
});

test('runs configured commands when preflight is skipped for tests', () => {
  const root = makeTempRepo('tf-post-db-refresh-pass-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Passing command',
          command: process.execPath,
          args: ['-e', 'console.log("ok")'],
        },
      ]),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = readReport(root);
  assert.equal(report.status, 'PASS');
  assert.equal(report.nextAction.code, 'run_full_readiness_gate');
  assert.equal(report.nextAction.command, 'pnpm run readiness:june10');
  assert.equal(readConsoleSummary(result.stdout).nextAction.code, 'run_full_readiness_gate');
  assert.equal(report.configuration.commandSource, 'env_override');
  assert.equal(report.configuration.skipPreflight, true);
  assert.equal(report.configuration.dryRun, false);
  assert.equal(report.configuration.continueOnFailure, false);
  assert.equal(report.summary.commandsPassed, 1);
  assert.equal(report.summary.commandsFailed, 0);
  assert.equal(report.results[0].stdoutTail, 'ok');
});

test('records command failures without running the full readiness gate', () => {
  const root = makeTempRepo('tf-post-db-refresh-command-fail-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Failing command',
          command: process.execPath,
          args: ['-e', 'process.exit(7)'],
        },
        {
          name: 'Dependent command',
          command: process.execPath,
          args: ['-e', 'console.log("should-not-run")'],
        },
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.nextAction.code, 'fix_failed_proof');
  assert.equal(report.nextAction.command, `${process.execPath} -e process.exit(7)`);
  assert.equal(report.summary.commandsFailed, 1);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.equal(report.results.length, 1);
  assert.equal(report.results[0].exitCode, 7);
  assert.ok(report.blockers.some(item => item.includes('Failing command failed')));
  assert.ok(report.blockers.some(item => item.includes('Skipped 1 remaining command')));
  const markdown = fs.readFileSync(
    path.join(root, 'generated', 'truth', 'post-db-refresh-rerun.md'),
    'utf8'
  );
  assert.match(markdown, /## Failed Command Output/);
  assert.match(markdown, /Failing command/);
});

test('can continue after command failures when explicitly requested', () => {
  const root = makeTempRepo('tf-post-db-refresh-command-continue-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_CONTINUE_ON_FAILURE: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Failing command',
          command: process.execPath,
          args: ['-e', 'process.exit(7)'],
        },
        {
          name: 'Follow-up command',
          command: process.execPath,
          args: ['-e', 'console.log("ran")'],
        },
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.nextAction.code, 'fix_failed_proof');
  assert.equal(report.continueOnFailure, true);
  assert.equal(report.configuration.continueOnFailure, true);
  assert.equal(report.summary.commandsFailed, 1);
  assert.equal(report.summary.commandsSkipped, 0);
  assert.equal(report.results.length, 2);
  assert.equal(report.results[1].stdoutTail, 'ran');
});

test('records refreshed expected artifacts for successful proof commands', () => {
  const root = makeTempRepo('tf-post-db-refresh-artifact-pass-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Writer command',
          command: process.execPath,
          args: [
            '-e',
            [
              "const fs = require('fs');",
              "fs.mkdirSync('generated/truth', { recursive: true });",
              "fs.writeFileSync('generated/truth/example.json', '{}\\n');",
            ].join(' '),
          ],
          expectedArtifacts: ['generated/truth/example.json'],
        },
      ]),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = readReport(root);
  assert.equal(report.status, 'PASS');
  assert.equal(report.summary.expectedArtifacts, 1);
  assert.equal(report.summary.refreshedArtifacts, 1);
  assert.equal(report.summary.staleOrMissingArtifacts, 0);
  assert.equal(report.results[0].artifactOutputs[0].refreshed, true);
});

test('preserves PASS_WITH_WARNINGS from refreshed proof artifacts', () => {
  const root = makeTempRepo('tf-post-db-refresh-artifact-warning-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Warning writer command',
          command: process.execPath,
          args: [
            '-e',
            [
              "const fs = require('fs');",
              "fs.mkdirSync('generated/truth', { recursive: true });",
              "fs.writeFileSync('generated/truth/example.json', JSON.stringify({ status: 'PASS_WITH_WARNINGS', warnings: ['review before shipping'] }) + '\\n');",
            ].join(' '),
          ],
          expectedArtifacts: ['generated/truth/example.json'],
        },
      ]),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = readReport(root);
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.equal(report.nextAction.code, 'review_warnings_then_run_full_readiness_gate');
  assert.equal(report.nextAction.command, 'pnpm run readiness:june10');
  assert.equal(report.summary.artifactWarnings, 1);
  assert.equal(report.summary.artifactsPassWithWarnings, 1);
  assert.equal(report.results[0].artifactOutputs[0].artifactStatus, 'PASS_WITH_WARNINGS');
  assert.equal(report.results[0].artifactOutputs[0].warningCount, 1);
  const markdown = fs.readFileSync(
    path.join(root, 'generated', 'truth', 'post-db-refresh-rerun.md'),
    'utf8'
  );
  assert.match(markdown, /Artifact warnings: 1/);
  assert.match(markdown, /PASS_WITH_WARNINGS/);
});

test('fails when a proof command writes a malformed expected JSON artifact', () => {
  const root = makeTempRepo('tf-post-db-refresh-artifact-malformed-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Malformed writer command',
          command: process.execPath,
          args: [
            '-e',
            [
              "const fs = require('fs');",
              "fs.mkdirSync('generated/truth', { recursive: true });",
              "fs.writeFileSync('generated/truth/malformed.json', '{not-json}\\n');",
            ].join(' '),
          ],
          expectedArtifacts: ['generated/truth/malformed.json'],
        },
        {
          name: 'Dependent command',
          command: process.execPath,
          args: ['-e', 'console.log("should-not-run")'],
        },
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.nextAction.code, 'fix_malformed_artifact');
  assert.match(report.nextAction.reason, /malformed JSON proof artifact/);
  assert.equal(report.summary.artifactParseErrors, 1);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.equal(report.results.length, 1);
  assert.ok(report.results[0].artifactOutputs[0].parseError);
  assert.ok(report.blockers.some(item => item.includes('wrote malformed JSON artifact')));
  assert.ok(
    report.blockers.some(item =>
      item.includes('after missing, stale, or malformed artifact output')
    )
  );
});

test('fails when a proof command passes but leaves an expected artifact stale', () => {
  const root = makeTempRepo('tf-post-db-refresh-artifact-stale-');
  fs.writeFileSync(path.join(root, 'generated', 'truth', 'stale.json'), '{}\n');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'No-op command',
          command: process.execPath,
          args: ['-e', 'process.exit(0)'],
          expectedArtifacts: ['generated/truth/stale.json'],
        },
        {
          name: 'Dependent command',
          command: process.execPath,
          args: ['-e', 'console.log("should-not-run")'],
        },
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.nextAction.code, 'fix_stale_or_missing_artifact');
  assert.equal(report.nextAction.command, `${process.execPath} -e process.exit(0)`);
  assert.equal(report.summary.expectedArtifacts, 1);
  assert.equal(report.summary.refreshedArtifacts, 0);
  assert.equal(report.summary.staleOrMissingArtifacts, 1);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.equal(report.results.length, 1);
  assert.ok(report.blockers.some(item => item.includes('left expected artifact stale')));
  assert.ok(
    report.blockers.some(item =>
      item.includes('after missing, stale, or malformed artifact output')
    )
  );
});

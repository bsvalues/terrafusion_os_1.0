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

test('preserves PASS_WITH_WARNINGS from refreshed proof artifact status', () => {
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
              "fs.writeFileSync('generated/truth/status-only.json', JSON.stringify({ status: 'PASS_WITH_WARNINGS' }) + '\\n');",
              "fs.writeFileSync('generated/truth/nested-counts.json', JSON.stringify({ rows: [{ county: 'Benton', warningCount: 2, summary: { warningCount: 1 } }], proofs: [{ county: 'Benton', warningCount: 3 }] }) + '\\n');",
              "fs.writeFileSync('generated/truth/scalar-warnings.json', JSON.stringify({ warning: 'top warning', warnings: 'top warnings string', summary: { warning: 'summary warning', warnings: { one: 'summary warning', two: 'summary warning' } }, rows: [{ county: 'Benton', warning: 'row warning', warnings: 'row warnings string' }], proofs: [{ county: 'Benton', warning: 'proof warning', warnings: { one: 'proof warning' } }] }) + '\\n');",
            ].join(' '),
          ],
          expectedArtifacts: [
            'generated/truth/example.json',
            'generated/truth/status-only.json',
            'generated/truth/nested-counts.json',
            'generated/truth/scalar-warnings.json',
          ],
        },
      ]),
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = readReport(root);
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.equal(report.nextAction.code, 'review_warnings_then_run_full_readiness_gate');
  assert.equal(report.nextAction.command, 'pnpm run readiness:june10');
  assert.equal(report.summary.artifactWarnings, 16);
  assert.equal(report.summary.artifactsPassWithWarnings, 2);
  assert.equal(report.results[0].artifactOutputs[0].artifactStatus, 'PASS_WITH_WARNINGS');
  assert.equal(report.results[0].artifactOutputs[0].warningCount, 1);
  assert.equal(report.results[0].artifactOutputs[1].artifactStatus, 'PASS_WITH_WARNINGS');
  assert.equal(report.results[0].artifactOutputs[1].warningCount, 0);
  assert.equal(report.results[0].artifactOutputs[2].warningCount, 6);
  assert.equal(report.results[0].artifactOutputs[3].warningCount, 9);
  const markdown = fs.readFileSync(
    path.join(root, 'generated', 'truth', 'post-db-refresh-rerun.md'),
    'utf8'
  );
  assert.match(markdown, /Artifact warnings: 16/);
  assert.match(markdown, /Artifacts PASS_WITH_WARNINGS: 2/);
  assert.match(markdown, /PASS_WITH_WARNINGS/);
});

test('fails when a proof command writes a failing expected JSON artifact', () => {
  const root = makeTempRepo('tf-post-db-refresh-artifact-fail-');
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_POST_DB_REFRESH_SKIP_PREFLIGHT: '1',
      TF_POST_DB_REFRESH_COMMANDS_JSON: JSON.stringify([
        {
          name: 'Failing artifact writer command',
          command: process.execPath,
          args: [
            '-e',
            [
              "const fs = require('fs');",
              "fs.mkdirSync('generated/truth', { recursive: true });",
              "fs.writeFileSync('generated/truth/status-fail.json', JSON.stringify({ status: 'FAIL', blockers: ['red'] }) + '\\n');",
              "fs.writeFileSync('generated/truth/passed-false.json', JSON.stringify({ passed: false, blockers: ['red'] }) + '\\n');",
              "fs.writeFileSync('generated/truth/status-dry-run.json', JSON.stringify({ status: 'DRY_RUN' }) + '\\n');",
              "fs.writeFileSync('generated/truth/nested-fail.json', JSON.stringify({ rows: [{ county: 'Benton', passed: false }], proofs: [{ county: 'Benton', status: 'FAIL' }] }) + '\\n');",
              "fs.writeFileSync('generated/truth/summary-fail.json', JSON.stringify({ summary: { passed: false, status: 'FAIL' }, rows: [{ county: 'Benton', summary: { passed: false } }], proofs: [{ county: 'Benton', summary: { status: 'FAIL' } }] }) + '\\n');",
              "fs.writeFileSync('generated/truth/collection-fail.json', JSON.stringify({ passed: true, blockers: ['explicit blocker'], errors: ['explicit error'], failures: ['explicit failure'], errorCount: 2, failureCount: 3, blockerCount: 4, failed: 5, summary: { errors: ['summary error'], failures: ['summary failure'], failed: 6, shipBlockers: 7 }, rows: [{ county: 'Benton', blockers: ['row blocker'], errors: ['row error'], failures: ['row failure'], failed: 8 }], proofs: [{ county: 'Benton', blockers: ['proof blocker'], errors: ['proof error'], failures: ['proof failure'], errorCount: 9 }] }) + '\\n');",
              "fs.writeFileSync('generated/truth/object-collection-fail.json', JSON.stringify({ blockers: { one: 'blocker' }, errors: { one: 'error', two: 'error' }, failures: { one: 'failure' }, summary: { errors: { one: 'summary error' } }, rows: [{ county: 'Benton', blockers: { one: 'row blocker' }, errors: { one: 'row error' } }], proofs: [{ county: 'Benton', failures: { one: 'proof failure' } }] }) + '\\n');",
              "fs.writeFileSync('generated/truth/scalar-collection-fail.json', JSON.stringify({ blocker: 'single blocker', blockers: 'plural blocker string', error: 'single error', errors: 'plural error string', failure: 'single failure', failures: 'plural failure string', receiptEvidence: { blocker: 'receipt blocker', error: 'receipt error', failures: { one: 'receipt failure' }, passed: false, status: 'FAIL' }, summary: { error: 'summary error', failure: 'summary failure' }, rows: [{ county: 'Benton', error: 'row error', failure: 'row failure' }], proofs: [{ county: 'Benton', errors: 'proof errors string', failures: 'proof failures string' }] }) + '\\n');",
            ].join(' '),
          ],
          expectedArtifacts: [
            'generated/truth/status-fail.json',
            'generated/truth/passed-false.json',
            'generated/truth/status-dry-run.json',
            'generated/truth/nested-fail.json',
            'generated/truth/summary-fail.json',
            'generated/truth/collection-fail.json',
            'generated/truth/object-collection-fail.json',
            'generated/truth/scalar-collection-fail.json',
          ],
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
  assert.equal(report.nextAction.code, 'fix_failed_artifact');
  assert.match(report.nextAction.reason, /failing JSON proof artifact/);
  assert.equal(report.summary.artifactFailures, 8);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.equal(report.results.length, 1);
  assert.equal(report.results[0].artifactOutputs[0].artifactStatus, 'FAIL');
  assert.equal(report.results[0].artifactOutputs[1].artifactPassed, false);
  assert.equal(report.results[0].artifactOutputs[2].artifactStatus, 'DRY_RUN');
  assert.deepEqual(report.results[0].artifactOutputs[3].artifactFailureReasons, [
    'Benton row passed is false',
    'Benton proof status is FAIL',
  ]);
  assert.deepEqual(report.results[0].artifactOutputs[4].artifactFailureReasons, [
    'summary.passed is false',
    'summary.status is FAIL',
    'Benton row summary.passed is false',
    'Benton proof summary.status is FAIL',
  ]);
  assert.deepEqual(report.results[0].artifactOutputs[5].artifactFailureReasons, [
    'artifact.blockers has 1 item(s)',
    'artifact.errors has 1 item(s)',
    'artifact.failures has 1 item(s)',
    'artifact.failed is 5',
    'artifact.failureCount is 3',
    'artifact.errorCount is 2',
    'artifact.blockerCount is 4',
    'summary.errors has 1 item(s)',
    'summary.failures has 1 item(s)',
    'summary.failed is 6',
    'summary.shipBlockers is 7',
    'Benton row.blockers has 1 item(s)',
    'Benton row.errors has 1 item(s)',
    'Benton row.failures has 1 item(s)',
    'Benton row.failed is 8',
    'Benton proof.blockers has 1 item(s)',
    'Benton proof.errors has 1 item(s)',
    'Benton proof.failures has 1 item(s)',
    'Benton proof.errorCount is 9',
  ]);
  assert.deepEqual(report.results[0].artifactOutputs[6].artifactFailureReasons, [
    'artifact.blockers has 1 object key(s)',
    'artifact.errors has 2 object key(s)',
    'artifact.failures has 1 object key(s)',
    'summary.errors has 1 object key(s)',
    'Benton row.blockers has 1 object key(s)',
    'Benton row.errors has 1 object key(s)',
    'Benton proof.failures has 1 object key(s)',
  ]);
  assert.deepEqual(report.results[0].artifactOutputs[7].artifactFailureReasons, [
    'artifact.blocker is set',
    'artifact.blockers is set',
    'artifact.error is set',
    'artifact.errors is set',
    'artifact.failure is set',
    'artifact.failures is set',
    'summary.error is set',
    'summary.failure is set',
    'receiptEvidence.blocker is set',
    'receiptEvidence.error is set',
    'receiptEvidence.failures has 1 object key(s)',
    'receiptEvidence.passed is false',
    'receiptEvidence.status is FAIL',
    'Benton row.error is set',
    'Benton row.failure is set',
    'Benton proof.errors is set',
    'Benton proof.failures is set',
  ]);
  assert.ok(report.blockers.some(item => item.includes('top-level status is FAIL')));
  assert.ok(report.blockers.some(item => item.includes('top-level passed is false')));
  assert.ok(report.blockers.some(item => item.includes('top-level status is DRY_RUN')));
  assert.ok(report.blockers.some(item => item.includes('Benton row passed is false')));
  assert.ok(report.blockers.some(item => item.includes('Benton proof status is FAIL')));
  assert.ok(report.blockers.some(item => item.includes('summary.passed is false')));
  assert.ok(report.blockers.some(item => item.includes('summary.status is FAIL')));
  assert.ok(report.blockers.some(item => item.includes('Benton row summary.passed is false')));
  assert.ok(report.blockers.some(item => item.includes('Benton proof summary.status is FAIL')));
  assert.ok(report.blockers.some(item => item.includes('artifact.blockers has 1 item')));
  assert.ok(report.blockers.some(item => item.includes('artifact.errors has 1 item')));
  assert.ok(report.blockers.some(item => item.includes('artifact.failed is 5')));
  assert.ok(report.blockers.some(item => item.includes('summary.shipBlockers is 7')));
  assert.ok(report.blockers.some(item => item.includes('Benton row.errors has 1 item')));
  assert.ok(report.blockers.some(item => item.includes('Benton row.failed is 8')));
  assert.ok(report.blockers.some(item => item.includes('Benton proof.failures has 1 item')));
  assert.ok(report.blockers.some(item => item.includes('Benton proof.errorCount is 9')));
  assert.ok(report.blockers.some(item => item.includes('artifact.errors has 2 object key')));
  assert.ok(report.blockers.some(item => item.includes('Benton row.errors has 1 object key')));
  assert.ok(report.blockers.some(item => item.includes('Benton proof.failures has 1 object key')));
  assert.ok(report.blockers.some(item => item.includes('artifact.blocker is set')));
  assert.ok(report.blockers.some(item => item.includes('artifact.error is set')));
  assert.ok(report.blockers.some(item => item.includes('receiptEvidence.error is set')));
  assert.ok(report.blockers.some(item => item.includes('receiptEvidence.status is FAIL')));
  assert.ok(report.blockers.some(item => item.includes('summary.failure is set')));
  assert.ok(report.blockers.some(item => item.includes('Benton row.error is set')));
  assert.ok(report.blockers.some(item => item.includes('Benton proof.failures is set')));
  assert.ok(
    report.blockers.some(item =>
      item.includes('after missing, stale, malformed, or failing artifact output')
    )
  );
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
      item.includes('after missing, stale, malformed, or failing artifact output')
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
      item.includes('after missing, stale, malformed, or failing artifact output')
    )
  );
});

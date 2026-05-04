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
  assert.equal(report.summary.commandsPlanned, 1);
  assert.equal(report.summary.commandsSkipped, 1);
  assert.equal(report.results.length, 0);
  assert.ok(report.blockers.some(item => item.includes('Runtime API preflight failed')));
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
      ]),
    },
  });

  assert.notEqual(result.status, 0);
  const report = readReport(root);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.commandsFailed, 1);
  assert.equal(report.results[0].exitCode, 7);
  assert.ok(report.blockers.some(item => item.includes('Failing command failed')));
});

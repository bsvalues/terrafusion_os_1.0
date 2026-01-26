#!/usr/bin/env node
/**
 * Contract tests for auto_approve_policy.mjs
 *
 * Validates that the auto-approve policy script:
 * - Produces deterministic JSON output
 * - Correctly classifies low-risk vs high-risk PRs
 * - Sets appropriate exit codes
 * - Contains no secret leaks in logs
 *
 * @version 1.1.0 - Security hardened (blocked paths, actor validation)
 * Run: node --test scripts/ci/auto_approve_policy.contract.test.mjs
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, 'auto_approve_policy.mjs');
const TEST_DIR = join(__dirname, '../../.test-artifacts');

// Setup/teardown
function setup() {
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }
}

function cleanup() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Helper to run the script with args
function runPolicy(args = [], options = {}) {
  const result = spawnSync('node', [SCRIPT_PATH, ...args], {
    encoding: 'utf8',
    cwd: TEST_DIR,
    timeout: 10000,
    ...options,
  });
  return result;
}

// ============================================================================
// Contract Tests
// ============================================================================

test('auto_approve_policy.mjs exits with code 0 for docs_only classification', () => {
  setup();
  try {
    const result = runPolicy(['--classification=docs_only', '--checks-passed', '--json']);
    assert.strictEqual(result.status, 0, `Expected exit code 0, got ${result.status}`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, true);
    assert.strictEqual(output.scope, 'docs_only');
  } finally {
    cleanup();
  }
});

// v1.1.0: ci_only now requires human review due to code execution risk
test('auto_approve_policy.mjs exits with code 1 for ci_only classification (v1.1.0 security)', () => {
  setup();
  try {
    const result = runPolicy(['--classification=ci_only', '--checks-passed', '--json']);
    assert.strictEqual(result.status, 1, `Expected exit code 1, got ${result.status}`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, false);
    assert.strictEqual(output.scope, 'human-review');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs exits with code 1 for high-risk classification', () => {
  setup();
  try {
    const result = runPolicy(['--classification=backend_only', '--checks-passed', '--json']);
    assert.strictEqual(result.status, 1, `Expected exit code 1, got ${result.status}`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, false);
    assert.strictEqual(output.scope, 'human-review');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs exits with code 1 when checks not passed', () => {
  setup();
  try {
    // Note: no --checks-passed flag
    const result = runPolicy(['--classification=docs_only', '--json']);
    assert.strictEqual(result.status, 1, `Expected exit code 1, got ${result.status}`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, false);
    assert.strictEqual(output.scope, 'checks');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs handles break-glass label', () => {
  setup();
  try {
    // v1.1.0: break-glass requires actor in allowlist
    const result = runPolicy([
      '--classification=mixed',
      '--labels=auto-approve',
      '--checks-passed',
      '--actor=testuser',
      '--json',
    ], {
      env: {
        ...process.env,
        TF_BREAK_GLASS_ACTORS: 'testuser,admin',
      },
    });
    assert.strictEqual(result.status, 0, `Expected exit code 0, got ${result.status}`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, true);
    assert.strictEqual(output.scope, 'break-glass');
    assert.strictEqual(output.auditTrail.breakGlassTriggered, true);
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs output contains audit trail', () => {
  setup();
  try {
    const result = runPolicy(['--classification=docs_only', '--checks-passed', '--json']);
    assert.strictEqual(result.status, 0);

    const output = JSON.parse(result.stdout);
    assert.ok(output.auditTrail, 'Output should include auditTrail');
    assert.strictEqual(output.auditTrail.classification, 'docs_only');
    assert.strictEqual(output.auditTrail.policyVersion, '1.1.0');
    assert.ok(output.auditTrail.evaluatedAt, 'auditTrail should include timestamp');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs reads classification from telemetry file', () => {
  setup();
  try {
    // Create a mock telemetry file
    const telemetryPath = join(TEST_DIR, 'ci_telemetry.json');
    writeFileSync(
      telemetryPath,
      JSON.stringify({
        classification: 'docs_only',
        summary: { passed: 3, failed: 0 },
      })
    );

    const result = runPolicy(['--telemetry=ci_telemetry.json', '--json']);
    assert.strictEqual(result.status, 0, `Expected exit code 0, got ${result.status}`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, true);
    assert.strictEqual(output.scope, 'docs_only');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs handles missing telemetry file gracefully', () => {
  setup();
  try {
    // No telemetry file, no explicit classification -> defaults to mixed
    const result = runPolicy(['--telemetry=nonexistent.json', '--checks-passed', '--json']);
    assert.strictEqual(result.status, 1, `Expected exit code 1 (mixed = high-risk)`);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, false);
    assert.strictEqual(output.scope, 'human-review');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs produces non-JSON output without --json flag', () => {
  setup();
  try {
    const result = runPolicy(['--classification=docs_only', '--checks-passed']);
    assert.strictEqual(result.status, 0);

    // Should be human-readable, not JSON
    assert.ok(result.stdout.includes('Approve:'), 'Should include Approve: label');
    assert.ok(result.stdout.includes('Reason:'), 'Should include Reason: label');
    assert.ok(result.stdout.includes('Scope:'), 'Should include Scope: label');
  } finally {
    cleanup();
  }
});

test('no secrets leak in policy output from environment', () => {
  setup();
  try {
    // Run with secret in environment variable (not in args)
    const result = runPolicy(['--classification=docs_only', '--checks-passed', '--json'], {
      env: {
        ...process.env,
        SECRET_TOKEN: 'ghp_abc123xyz789',
        MY_PASSWORD: 'supersecret',
      },
    });

    // Policy output should not expose env vars
    const fullOutput = result.stdout + result.stderr;

    // Should not print env variable values
    assert.ok(!fullOutput.includes('ghp_abc123xyz789'), 'Should not leak secrets from env');
    assert.ok(!fullOutput.includes('supersecret'), 'Should not leak passwords from env');
  } finally {
    cleanup();
  }
});

test('auto_approve_policy.mjs handles multiple labels', () => {
  setup();
  try {
    // v1.1.0: break-glass requires actor in allowlist
    const result = runPolicy([
      '--classification=mixed',
      '--labels=bug,enhancement,auto-approve',
      '--checks-passed',
      '--actor=admin',
      '--json',
    ], {
      env: {
        ...process.env,
        TF_BREAK_GLASS_ACTORS: 'admin',
      },
    });
    assert.strictEqual(result.status, 0);

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.approve, true);
    assert.strictEqual(output.scope, 'break-glass');
  } finally {
    cleanup();
  }
});

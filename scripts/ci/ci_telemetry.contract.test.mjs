/**
 * Contract tests for ci_telemetry.mjs
 * Validates CI telemetry baseline collection for PR throughput metrics
 *
 * Run: node --test scripts/ci/ci_telemetry.contract.test.mjs
 *
 * @fileoverview TDD contract test - written BEFORE implementation
 */

import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'ci_telemetry.mjs');
const outputPath = join(__dirname, '../../ci_telemetry.json');

/**
 * Helper to run the telemetry script and capture output
 */
function runTelemetryScript(env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      shell: false,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => (stdout += d.toString()));
    child.stderr.on('data', d => (stderr += d.toString()));

    child.on('error', reject);
    child.on('close', code => {
      resolve({ code, stdout, stderr });
    });
  });
}

// Cleanup any existing output before tests
test.beforeEach(() => {
  if (existsSync(outputPath)) {
    unlinkSync(outputPath);
  }
});

test('ci_telemetry.mjs exits with code 0 and produces valid JSON output file', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true', // Test mode - uses mock data
  });

  assert.strictEqual(
    result.code,
    0,
    `Expected exit code 0, got ${result.code}. stderr: ${result.stderr}`
  );
  assert.ok(existsSync(outputPath), 'Expected ci_telemetry.json to be created');

  const content = readFileSync(outputPath, 'utf8');
  let telemetry;
  try {
    telemetry = JSON.parse(content);
  } catch (e) {
    assert.fail(`Expected valid JSON, parse error: ${e.message}`);
  }

  // Required fields for baseline
  assert.ok('timestamp' in telemetry, 'Missing required field: timestamp');
  assert.ok('runId' in telemetry, 'Missing required field: runId');
  assert.ok('repository' in telemetry, 'Missing required field: repository');
  assert.ok('event' in telemetry, 'Missing required field: event');
  assert.ok('jobs' in telemetry, 'Missing required field: jobs');

  // Jobs should be an array (may be empty in test mode)
  assert.ok(Array.isArray(telemetry.jobs), 'jobs should be an array');
});

test('telemetry includes duration metrics when jobs are present', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  // In test mode, we expect mock jobs with durations
  if (telemetry.jobs.length > 0) {
    const job = telemetry.jobs[0];
    assert.ok('name' in job, 'Job missing name');
    assert.ok('conclusion' in job, 'Job missing conclusion');
    assert.ok('durationMs' in job, 'Job missing durationMs');
    assert.ok(typeof job.durationMs === 'number', 'durationMs should be a number');
  }
});

test('telemetry summary includes total duration', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.ok('summary' in telemetry, 'Missing required field: summary');
  assert.ok('totalDurationMs' in telemetry.summary, 'summary missing totalDurationMs');
  assert.ok(
    typeof telemetry.summary.totalDurationMs === 'number',
    'totalDurationMs should be a number'
  );
});

test('no secrets leak in telemetry output', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    GITHUB_TOKEN: 'ghp_supersecret123', // Simulate token presence
  });

  assert.strictEqual(result.code, 0);
  const content = readFileSync(outputPath, 'utf8');

  // Ensure no tokens leak
  assert.ok(!content.includes('ghp_'), 'GitHub token leaked in output');
  assert.ok(!content.includes('supersecret'), 'Secret value leaked in output');
});

// ============================================================================
// Classification + skip flags tests (2D-3)
// ============================================================================

test('telemetry includes classification field from environment', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    TF_CLASSIFICATION: 'frontend_only',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.ok('classification' in telemetry, 'Missing required field: classification');
  assert.strictEqual(telemetry.classification, 'frontend_only', 'classification should match env');
});

test('telemetry includes skip flags for frontend_only', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    TF_CLASSIFICATION: 'frontend_only',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.ok('skippedBackend' in telemetry, 'Missing field: skippedBackend');
  assert.ok('skippedFrontend' in telemetry, 'Missing field: skippedFrontend');
  assert.strictEqual(telemetry.skippedBackend, true, 'frontend_only should skip backend');
  assert.strictEqual(telemetry.skippedFrontend, false, 'frontend_only should NOT skip frontend');
});

test('telemetry includes skip flags for backend_only', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    TF_CLASSIFICATION: 'backend_only',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.strictEqual(telemetry.skippedBackend, false, 'backend_only should NOT skip backend');
  assert.strictEqual(telemetry.skippedFrontend, true, 'backend_only should skip frontend');
});

test('telemetry includes skip flags for docs_only', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    TF_CLASSIFICATION: 'docs_only',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.strictEqual(telemetry.skippedBackend, true, 'docs_only should skip backend');
  assert.strictEqual(telemetry.skippedFrontend, true, 'docs_only should skip frontend');
});

test('telemetry includes skip flags for ci_only', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    TF_CLASSIFICATION: 'ci_only',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.strictEqual(telemetry.skippedBackend, true, 'ci_only should skip backend');
  assert.strictEqual(telemetry.skippedFrontend, true, 'ci_only should skip frontend');
});

test('telemetry includes skip flags for mixed (no skips)', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    TF_CLASSIFICATION: 'mixed',
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.strictEqual(telemetry.skippedBackend, false, 'mixed should NOT skip backend');
  assert.strictEqual(telemetry.skippedFrontend, false, 'mixed should NOT skip frontend');
});

test('telemetry defaults to mixed when TF_CLASSIFICATION not set', async () => {
  const result = await runTelemetryScript({
    CI_TELEMETRY_TEST: 'true',
    // TF_CLASSIFICATION not set
  });

  assert.strictEqual(result.code, 0);
  const telemetry = JSON.parse(readFileSync(outputPath, 'utf8'));

  assert.strictEqual(telemetry.classification, 'mixed', 'should default to mixed');
  assert.strictEqual(telemetry.skippedBackend, false, 'default mixed should NOT skip backend');
  assert.strictEqual(telemetry.skippedFrontend, false, 'default mixed should NOT skip frontend');
});

// Cleanup
test.after(() => {
  if (existsSync(outputPath)) {
    unlinkSync(outputPath);
  }
});

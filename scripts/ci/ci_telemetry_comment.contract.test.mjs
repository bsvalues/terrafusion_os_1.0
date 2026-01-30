/**
 * Contract tests for ci_telemetry_comment.mjs
 * Validates PR comment generation from telemetry JSON
 *
 * Run: node --test scripts/ci/ci_telemetry_comment.contract.test.mjs
 *
 * @fileoverview Contract test for comment generator script
 */

import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'ci_telemetry_comment.mjs');
const testDir = join(__dirname, '../../.test-artifacts');
const inputPath = join(testDir, 'test_telemetry.json');
const outputPath = join(testDir, 'test_comment.md');

// Sample telemetry data
const sampleTelemetry = {
  timestamp: '2026-01-25T10:05:00Z',
  runId: 'run-456',
  repository: 'bsvalues/terrafusion_os_1.0',
  event: 'pull_request',
  ref: 'refs/heads/feature/test',
  sha: 'abc123def456',
  classification: 'frontend_only',
  skippedBackend: true,
  skippedFrontend: false,
  jobs: [
    {
      name: 'quality-gate',
      conclusion: 'success',
      startedAt: '2026-01-25T10:00:00Z',
      completedAt: '2026-01-25T10:02:30Z',
      durationMs: 150000,
      runner: 'ubuntu-latest',
    },
    {
      name: '🔒 TerraFusion Seal Gate',
      conclusion: 'success',
      startedAt: '2026-01-25T10:02:30Z',
      completedAt: '2026-01-25T10:05:00Z',
      durationMs: 150000,
      runner: 'ubuntu-latest',
    },
  ],
  summary: {
    totalDurationMs: 300000,
    totalJobs: 2,
    successCount: 2,
    failureCount: 0,
  },
};

/**
 * Helper to run the comment generator script
 */
function runCommentScript(args = [], env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
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

// Setup test directory
test.before(() => {
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
});

// Cleanup before each test
test.beforeEach(() => {
  if (existsSync(inputPath)) unlinkSync(inputPath);
  if (existsSync(outputPath)) unlinkSync(outputPath);
});

test('ci_telemetry_comment.mjs exits with code 0 and produces markdown file', async () => {
  // Write test input
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');

  const result = await runCommentScript([inputPath, outputPath]);

  assert.strictEqual(
    result.code,
    0,
    `Expected exit code 0, got ${result.code}. stderr: ${result.stderr}`
  );
  assert.ok(existsSync(outputPath), 'Expected markdown file to be created');
});

test('generated markdown contains sentinel comment for sticky updates', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('<!-- TF_CI_TELEMETRY -->'), 'Markdown must contain sentinel comment');
  assert.ok(
    content.startsWith('<!-- TF_CI_TELEMETRY -->'),
    'Sentinel must be at the start of the file'
  );
});

test('generated markdown contains required headings', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('## 📊 CI Telemetry Summary'), 'Missing summary heading');
  assert.ok(content.includes('| Metric | Value |'), 'Missing metrics table');
});

test('generated markdown contains classification', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('`frontend_only`'), 'Missing classification value');
  assert.ok(content.includes('🎨'), 'Missing classification emoji');
});

test('generated markdown contains duration', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('5m 0s'), 'Missing formatted duration (5m 0s for 300000ms)');
  assert.ok(content.includes('⏱️ Total Duration'), 'Missing duration label');
});

test('generated markdown contains skip flags', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('Backend'), 'Missing skipped backend indicator');
  assert.ok(content.includes('⏭️ Skipped'), 'Missing skipped label');
});

test('generated markdown contains job details', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('📋 Job Details'), 'Missing job details section');
  assert.ok(content.includes('quality-gate'), 'Missing job name');
  assert.ok(content.includes('2/2 passed'), 'Missing job count');
});

test('generated markdown contains run ID reference', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('run-456'), 'Missing run ID');
});

test('no secrets leak in generated markdown - GitHub tokens', async () => {
  const telemetryWithSecret = {
    ...sampleTelemetry,
    runId: 'ghp_supersecrettoken123456',
    repository: 'secret: ghp_anothersecret',
  };
  writeFileSync(inputPath, JSON.stringify(telemetryWithSecret, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(!content.includes('ghp_'), 'GitHub token leaked in output');
  assert.ok(!content.includes('supersecret'), 'Secret value leaked in output');
  assert.ok(content.includes('***REDACTED***'), 'Missing redaction marker');
});

test('no secrets leak in generated markdown - password patterns', async () => {
  const telemetryWithSecret = {
    ...sampleTelemetry,
    ref: 'password=mysecretpassword',
  };
  writeFileSync(inputPath, JSON.stringify(telemetryWithSecret, null, 2), 'utf8');
  await runCommentScript([inputPath, outputPath]);

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(!content.includes('mysecretpassword'), 'Password leaked in output');
});

test('handles minimal telemetry with missing fields', async () => {
  const minimalTelemetry = {
    classification: 'docs_only',
  };
  writeFileSync(inputPath, JSON.stringify(minimalTelemetry, null, 2), 'utf8');

  const result = await runCommentScript([inputPath, outputPath]);

  assert.strictEqual(result.code, 0, 'Should handle minimal telemetry');
  assert.ok(existsSync(outputPath), 'Should produce output');

  const content = readFileSync(outputPath, 'utf8');
  assert.ok(content.includes('<!-- TF_CI_TELEMETRY -->'), 'Should contain sentinel');
  assert.ok(content.includes('`docs_only`'), 'Should contain classification');
});

test('handles empty jobs array', async () => {
  const emptyJobsTelemetry = {
    ...sampleTelemetry,
    jobs: [],
    summary: {
      totalDurationMs: 0,
      totalJobs: 0,
      successCount: 0,
      failureCount: 0,
    },
  };
  writeFileSync(inputPath, JSON.stringify(emptyJobsTelemetry, null, 2), 'utf8');

  const result = await runCommentScript([inputPath, outputPath]);

  assert.strictEqual(result.code, 0, 'Should handle empty jobs');
  const content = readFileSync(outputPath, 'utf8');
  assert.ok(!content.includes('<details>'), 'Should not include job details for empty list');
});

test('exits with code 1 when input file not found', async () => {
  const result = await runCommentScript(['/nonexistent/path.json', outputPath]);
  assert.strictEqual(result.code, 1, 'Should exit with code 1 for missing input');
});

test('includes artifact link when GITHUB env vars set', async () => {
  writeFileSync(inputPath, JSON.stringify(sampleTelemetry, null, 2), 'utf8');

  const result = await runCommentScript([inputPath, outputPath], {
    GITHUB_RUN_ID: '12345',
    GITHUB_REPOSITORY: 'owner/repo',
    GITHUB_SERVER_URL: 'https://github.com',
  });

  assert.strictEqual(result.code, 0);
  const content = readFileSync(outputPath, 'utf8');
  assert.ok(
    content.includes('[View Artifact](https://github.com/owner/repo/actions/runs/12345#artifacts)'),
    'Should include artifact link with correct URL'
  );
});

// Cleanup
test.after(() => {
  if (existsSync(inputPath)) unlinkSync(inputPath);
  if (existsSync(outputPath)) unlinkSync(outputPath);
});

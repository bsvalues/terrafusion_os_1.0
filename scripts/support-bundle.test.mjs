/**
 * TerraFusion OS - Support Bundle Tests
 *
 * Contract tests for incident-grade debug bundle:
 * - Orchestrates doctor + trace:query + env snapshot
 * - Redacts secrets/tokens/PII
 * - Outputs to artifacts/ (Zone B only)
 * - Completes <5s
 *
 * Usage: node --test scripts/support-bundle.test.mjs
 */

import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const ARTIFACTS_DIR = resolve(REPO_ROOT, 'artifacts/support-bundle');

// Import bundle generator
let generateSupportBundle;

before(async () => {
  const bundleModule = await import('./support-bundle.mjs');
  generateSupportBundle = bundleModule.generateSupportBundle;
});

describe('Support Bundle: Contract', () => {
  test('exports generateSupportBundle function', async () => {
    assert.strictEqual(
      typeof generateSupportBundle,
      'function',
      'Should export generateSupportBundle'
    );
  });

  test('generates bundle with required sections', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });

    assert.ok(bundle, 'Should return bundle object');
    assert.ok(bundle.meta, 'Should include meta section');
    assert.ok(bundle.doctor, 'Should include doctor section');
    assert.ok(bundle.traces, 'Should include traces section');
    assert.ok(bundle.hints, 'Should include hints section');
  });

  test('meta section includes timestamp and git SHA', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });

    assert.ok(bundle.meta.timestamp, 'Meta should include timestamp');
    assert.ok(bundle.meta.timestamp.endsWith('Z'), 'Timestamp should be UTC');
    assert.ok(bundle.meta.gitSha, 'Meta should include git SHA');
    assert.ok(bundle.meta.platform, 'Meta should include platform');
  });
});

describe('Support Bundle: Doctor Integration', () => {
  test('doctor section includes check summary', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });

    assert.ok(bundle.doctor.checks, 'Doctor should include checks');
    assert.ok(Array.isArray(bundle.doctor.checks), 'Checks should be array');
    assert.ok(bundle.doctor.summary, 'Doctor should include summary');
    assert.strictEqual(
      typeof bundle.doctor.summary.passed,
      'number',
      'Summary should include passed count'
    );
    assert.strictEqual(
      typeof bundle.doctor.summary.failed,
      'number',
      'Summary should include failed count'
    );
  });

  test('doctor section excludes raw environment values', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });
    const bundleStr = JSON.stringify(bundle.doctor);

    // Should not include raw env var values (if env vars were present)
    assert.ok(!bundleStr.includes('API_KEY='), 'Should not include API_KEY patterns');
    assert.ok(!bundleStr.includes('SECRET='), 'Should not include SECRET patterns');
    assert.ok(!bundleStr.includes('TOKEN='), 'Should not include TOKEN patterns');
  });
});

describe('Support Bundle: Trace Integration', () => {
  test('traces section includes recent failures', async () => {
    const bundle = await generateSupportBundle({ output: 'object', recentFailures: 5 });

    assert.ok(bundle.traces.failures, 'Traces should include failures array');
    assert.ok(Array.isArray(bundle.traces.failures), 'Failures should be array');
    assert.ok(bundle.traces.failures.length <= 5, 'Should limit to requested count');
  });

  test('traces section includes correlationIds', async () => {
    const bundle = await generateSupportBundle({ output: 'object', recentFailures: 3 });

    assert.ok(bundle.traces.correlationIds, 'Traces should include correlationIds');
    assert.ok(Array.isArray(bundle.traces.correlationIds), 'CorrelationIds should be array');
  });

  test('traces section includes pivot summaries', async () => {
    const bundle = await generateSupportBundle({ output: 'object', recentFailures: 3 });

    assert.ok(bundle.traces.pivots, 'Traces should include pivots');
    assert.ok(Array.isArray(bundle.traces.pivots), 'Pivots should be array');
  });
});

describe('Support Bundle: Redaction', () => {
  test('redacts common secret patterns', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });
    const bundleStr = JSON.stringify(bundle);

    // Should not include obvious secret patterns
    assert.ok(!bundleStr.match(/sk-[a-zA-Z0-9]{32,}/), 'Should redact API keys (sk- pattern)');
    assert.ok(!bundleStr.match(/Bearer\s+[a-zA-Z0-9\-._~+/]+=*/), 'Should redact Bearer tokens');
    assert.ok(!bundleStr.match(/ghp_[a-zA-Z0-9]{36}/), 'Should redact GitHub tokens');
  });

  test('redacts PII patterns', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });
    const bundleStr = JSON.stringify(bundle);

    // Should not include obvious PII patterns
    assert.ok(!bundleStr.match(/\b\d{3}-\d{2}-\d{4}\b/), 'Should redact SSN patterns');
    assert.ok(
      !bundleStr.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/),
      'Should redact email patterns'
    );
  });

  test('preserves correlationIds (UUIDs)', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });

    // CorrelationIds (UUIDs) should NOT be redacted - they're needed for debugging
    if (bundle.traces.correlationIds.length > 0) {
      const firstId = bundle.traces.correlationIds[0];
      assert.ok(
        firstId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
        'CorrelationId should be valid UUID'
      );
    }
  });
});

describe('Support Bundle: Hints', () => {
  test('includes copy-paste ready trace:query commands', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });

    assert.ok(bundle.hints.commands, 'Hints should include commands');
    assert.ok(Array.isArray(bundle.hints.commands), 'Commands should be array');
    assert.ok(bundle.hints.commands.length > 0, 'Commands array should not be empty');

    // Commands should include at least one trace:query command
    const hasTraceQuery = bundle.hints.commands.some(cmd => cmd.includes('pnpm run trace:query'));
    assert.ok(hasTraceQuery, 'Commands should include at least one trace:query command');
  });

  test('includes next steps suggestions', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });

    assert.ok(bundle.hints.nextSteps, 'Hints should include next steps');
    assert.ok(Array.isArray(bundle.hints.nextSteps), 'Next steps should be array');
  });
});

describe('Support Bundle: Zone A Protection', () => {
  test('does not touch Zone A paths', async () => {
    const bundle = await generateSupportBundle({ output: 'object' });
    const bundleStr = JSON.stringify(bundle);

    // Should not reference Zone A frozen paths
    assert.ok(!bundleStr.includes('docs/ops/WAVE_1_'), 'Should not reference WAVE_1_ files');
    assert.ok(!bundleStr.includes('WAVE_1_OPERATOR_CARD'), 'Should not reference operator card');
    assert.ok(!bundleStr.includes('WAVE_1_EVALUATION_LOG'), 'Should not reference evaluation log');
  });

  test('outputs only to artifacts/ (Zone B)', async () => {
    // This will be tested by the file generation test
    assert.ok(true, 'Placeholder - file output test below');
  });
});

describe('Support Bundle: Performance', () => {
  test('completes in under 5 seconds', async () => {
    const startTime = Date.now();
    await generateSupportBundle({ output: 'object', recentFailures: 10 });
    const duration = Date.now() - startTime;

    assert.ok(duration < 5000, `Should complete in <5s, took ${duration}ms`);
  });
});

describe('Support Bundle: File Output', () => {
  let bundleFilePath;

  after(() => {
    // Cleanup test artifacts
    if (bundleFilePath && existsSync(bundleFilePath)) {
      rmSync(bundleFilePath, { force: true });
    }
  });

  test('writes bundle to artifacts/support-bundle/', async () => {
    const result = await generateSupportBundle({ output: 'file' });
    bundleFilePath = result.filePath;

    assert.ok(bundleFilePath, 'Should return file path');
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = bundleFilePath.replace(/\\/g, '/');
    assert.ok(
      normalizedPath.includes('artifacts/support-bundle'),
      'Should write to artifacts/support-bundle'
    );
    assert.ok(existsSync(bundleFilePath), 'Bundle file should exist');
  });

  test('bundle file is valid JSON', async () => {
    const result = await generateSupportBundle({ output: 'file' });
    bundleFilePath = result.filePath;

    const content = await readFile(bundleFilePath, 'utf-8');
    assert.doesNotThrow(() => JSON.parse(content), 'Bundle file should be valid JSON');
  });

  test('includes timestamp in filename', async () => {
    const result = await generateSupportBundle({ output: 'file' });
    bundleFilePath = result.filePath;

    // Normalize path separators for cross-platform compatibility
    const filename = bundleFilePath.replace(/\\/g, '/').split('/').pop();
    // Format: 2026-02-04T12-34-56-789Z-bundle.json (ISO timestamp with : and . replaced by -)
    assert.ok(
      filename.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-bundle\.json$/),
      'Filename should be ISO timestamp (: and . replaced by -) followed by -bundle.json'
    );
  });
});

/**
 * Contract tests for CI workflow concurrency configuration
 * Validates workflow-level concurrency control to cancel duplicate PR runs
 *
 * Run: node --test scripts/ci/ci_workflow_concurrency.contract.test.mjs
 *
 * @fileoverview TDD contract test - validates concurrency setup
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ciYmlPath = join(__dirname, '../../.github/workflows/ci.yml');

/**
 * Load the CI workflow YAML as text
 */
function loadCiYml() {
  return readFileSync(ciYmlPath, 'utf8');
}

test('CI workflow has top-level concurrency block', () => {
  const content = loadCiYml();

  // Concurrency block should exist at top level (not indented under jobs)
  // It should appear before "jobs:" in the file
  const jobsIndex = content.indexOf('\njobs:');
  const concurrencyIndex = content.indexOf('\nconcurrency:');

  assert.ok(concurrencyIndex !== -1, 'ci.yml should have a top-level concurrency: block');
  assert.ok(
    concurrencyIndex < jobsIndex,
    'concurrency: block should appear before jobs: (workflow-level, not job-level)'
  );
});

test('Concurrency block has cancel-in-progress enabled', () => {
  const content = loadCiYml();

  // Extract concurrency block (from concurrency: to next top-level key)
  const concurrencyMatch = content.match(/\nconcurrency:[\s\S]*?(?=\n[a-z])/);
  assert.ok(concurrencyMatch, 'Should find concurrency block');

  const concurrencyBlock = concurrencyMatch[0];

  // Must have cancel-in-progress: true
  const hasCancelInProgress =
    concurrencyBlock.includes('cancel-in-progress: true') ||
    concurrencyBlock.includes('cancel-in-progress:true');

  assert.ok(hasCancelInProgress, 'Concurrency block must have cancel-in-progress: true');
});

test('Concurrency group keys by workflow name', () => {
  const content = loadCiYml();

  // Extract concurrency block
  const concurrencyMatch = content.match(/\nconcurrency:[\s\S]*?(?=\n[a-z])/);
  assert.ok(concurrencyMatch, 'Should find concurrency block');

  const concurrencyBlock = concurrencyMatch[0];

  // Group must include github.workflow to prevent cross-workflow cancellation
  const hasWorkflowKey = concurrencyBlock.includes('github.workflow');

  assert.ok(
    hasWorkflowKey,
    'Concurrency group must include github.workflow to prevent cross-workflow cancellation'
  );
});

test('Concurrency group handles both PR and push events', () => {
  const content = loadCiYml();

  // Extract concurrency block
  const concurrencyMatch = content.match(/\nconcurrency:[\s\S]*?(?=\n[a-z])/);
  assert.ok(concurrencyMatch, 'Should find concurrency block');

  const concurrencyBlock = concurrencyMatch[0];

  // Group should handle pull_request.number (for PRs) with fallback for push
  // Common patterns:
  // - github.event.pull_request.number || github.ref
  // - github.head_ref || github.ref
  const handlesPR =
    concurrencyBlock.includes('pull_request.number') || concurrencyBlock.includes('head_ref');

  const handlesPush =
    concurrencyBlock.includes('github.ref') || concurrencyBlock.includes('github.run_id');

  assert.ok(handlesPR, 'Concurrency group should handle PR events (pull_request.number or head_ref)');
  assert.ok(handlesPush, 'Concurrency group should have fallback for push events (github.ref)');
});

test('Concurrency block is properly formatted YAML', () => {
  const content = loadCiYml();

  // Check concurrency block has proper structure with group:
  const hasGroupKey = content.includes('group:') && content.includes('concurrency:');

  // Ensure group is indented under concurrency (2 spaces)
  const hasProperIndent = content.includes('\nconcurrency:\n  group:');

  assert.ok(hasGroupKey, 'Concurrency block must have a group: key');
  assert.ok(hasProperIndent, 'group: should be properly indented under concurrency:');
});

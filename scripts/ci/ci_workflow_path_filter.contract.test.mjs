/**
 * Contract tests for CI workflow path filtering
 * Validates classify_changes job and Seal Gate conditional steps
 *
 * Run: node --test scripts/ci/ci_workflow_path_filter.contract.test.mjs
 *
 * @fileoverview TDD contract test - validates workflow path filtering setup
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

/**
 * Extract a job section by name
 */
function extractJob(content, jobName) {
  const jobPattern = new RegExp(`\\n  ${jobName}:\\n`);
  const match = content.match(jobPattern);
  if (!match) return null;

  const startIndex = match.index + 1; // Skip leading newline
  const afterStart = content.substring(startIndex);

  // Find next job at same indent level or EOF
  const nextJobMatch = afterStart.match(/\n  [a-z][\w-]*:\n/);
  if (nextJobMatch) {
    return afterStart.substring(0, nextJobMatch.index);
  }
  return afterStart;
}

test('CI workflow has classify_changes job', () => {
  const content = loadCiYml();

  // Must have a job that classifies changes for path filtering
  const hasClassifyJob =
    content.includes('classify_changes:') || content.includes('classify-changes:');

  assert.ok(hasClassifyJob, 'ci.yml should have a classify_changes (or classify-changes) job');
});

test('classify_changes job runs changed_files_classifier.mjs', () => {
  const content = loadCiYml();

  // The classifier job should invoke our classifier script
  const hasClassifierInvocation = content.includes('changed_files_classifier.mjs');

  assert.ok(
    hasClassifierInvocation,
    'classify_changes job should run changed_files_classifier.mjs'
  );
});

test('classify_changes job outputs docs_only', () => {
  const content = loadCiYml();

  // Job should have outputs that include docs_only
  const hasDocsOnlyOutput = content.includes('docs_only') || content.includes('docs-only');

  assert.ok(hasDocsOnlyOutput, 'classify_changes job should output docs_only value');
});

test('Seal Gate depends on classify_changes', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Seal Gate needs should include classify_changes
  const dependsOnClassify =
    sealGate.includes('classify_changes') || sealGate.includes('classify-changes');

  assert.ok(dependsOnClassify, 'seal-gate should depend on classify_changes job');
});

test('Seal Gate has conditional steps for heavy work', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Heavy steps should have if conditions checking docs_only
  // Look for patterns like: if: needs.classify_changes.outputs.docs_only != 'true'
  const hasDocsOnlyCondition =
    sealGate.includes("docs_only != 'true'") ||
    sealGate.includes('docs_only == false') ||
    sealGate.includes("docs-only != 'true'");

  assert.ok(hasDocsOnlyCondition, 'seal-gate should have conditional steps based on docs_only');
});

test('Governance jobs are NOT gated by docs_only', () => {
  const content = loadCiYml();

  // Extract drift_guard and proof jobs (or equivalent governance jobs)
  const driftGuard = extractJob(content, 'drift_guard');
  const hintDriftGuard = extractJob(content, 'hint_drift_guard');

  // These governance jobs should NOT have docs_only conditions
  if (driftGuard) {
    const gateDriftGuard =
      driftGuard.includes('docs_only') || driftGuard.includes('classify_changes');
    assert.ok(
      !gateDriftGuard,
      'drift_guard should NOT be gated by docs_only (governance always runs)'
    );
  }

  if (hintDriftGuard) {
    const gateHintGuard =
      hintDriftGuard.includes('docs_only') || hintDriftGuard.includes('classify_changes');
    assert.ok(
      !gateHintGuard,
      'hint_drift_guard should NOT be gated by docs_only (governance always runs)'
    );
  }
});

test('Seal Gate job itself is NOT skipped (only steps inside are conditional)', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // The job-level if should NOT skip based on docs_only
  // Look for "if:" line that contains docs_only gating (not in needs array)
  const lines = sealGate.split('\n');
  const ifLineIndex = lines.findIndex(l => l.trim().startsWith('if:'));

  if (ifLineIndex !== -1) {
    const ifLine = lines[ifLineIndex];
    const hasDocsOnlyInJobIf =
      ifLine.includes('docs_only') ||
      (ifLine.includes('classify_changes') && ifLine.includes('outputs'));

    // It's OK to have "if: always()" but NOT "if: needs.classify_changes.outputs.docs_only == 'false'"
    assert.ok(
      !hasDocsOnlyInJobIf,
      'seal-gate job-level if should NOT gate on docs_only (only internal steps are conditional)'
    );
  }

  // Having classify_changes in needs array is OK - we just reference its outputs
  // The key is that the job still runs (via if: always())
  const hasAlwaysRun = sealGate.includes('if: always()');
  assert.ok(hasAlwaysRun, 'seal-gate should have if: always() to ensure it always runs');
});

test('Seal Gate has fast-path indicator step', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Should have a step that indicates fast-path mode
  const hasFastPathIndicator =
    sealGate.includes('FAST PATH') ||
    sealGate.includes('fast-path') ||
    sealGate.includes('docs-only') ||
    sealGate.includes('Docs-only');

  assert.ok(hasFastPathIndicator, 'seal-gate should have a fast-path indicator step for docs-only');
});

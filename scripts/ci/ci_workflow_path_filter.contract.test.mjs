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

// ============================================================================
// classify_changes job tests
// ============================================================================

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

test('classify_changes job outputs classification', () => {
  const content = loadCiYml();
  const classifyJob = extractJob(content, 'classify_changes');

  assert.ok(classifyJob, 'classify_changes job should exist');

  // Job should output classification enum
  const hasClassificationOutput = classifyJob.includes('classification');

  assert.ok(hasClassificationOutput, 'classify_changes job should output classification value');
});

// ============================================================================
// Seal Gate job-level tests
// ============================================================================

test('Seal Gate depends on classify_changes', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Seal Gate needs should include classify_changes
  const dependsOnClassify =
    sealGate.includes('classify_changes') || sealGate.includes('classify-changes');

  assert.ok(dependsOnClassify, 'seal-gate should depend on classify_changes job');
});

test('Seal Gate has CLASSIFICATION env var', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Seal Gate should have CLASSIFICATION environment variable
  const hasClassificationEnv = sealGate.includes('CLASSIFICATION:');

  assert.ok(hasClassificationEnv, 'seal-gate should have CLASSIFICATION env var');
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

// ============================================================================
// Seal Gate conditional step tests (docs-only)
// ============================================================================

test('Seal Gate has conditional steps for heavy work', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Heavy steps should have if conditions checking docs_only OR classification
  // Look for patterns like:
  // - if: needs.classify_changes.outputs.docs_only != 'true'
  // - if: env.CLASSIFICATION == 'backend_only' || env.CLASSIFICATION == 'mixed'
  const hasDocsOnlyCondition =
    sealGate.includes("docs_only != 'true'") ||
    sealGate.includes('docs_only == false') ||
    sealGate.includes("docs-only != 'true'");

  const hasClassificationCondition =
    sealGate.includes("CLASSIFICATION == 'backend_only'") ||
    sealGate.includes("CLASSIFICATION == 'frontend_only'") ||
    sealGate.includes("CLASSIFICATION == 'mixed'");

  assert.ok(
    hasDocsOnlyCondition || hasClassificationCondition,
    'seal-gate should have conditional steps based on docs_only or classification'
  );
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

// ============================================================================
// Seal Gate classification-based gating tests (2D-2)
// ============================================================================

test('Backend steps are gated for frontend_only/ci_only/docs_only', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Backend steps (setup-dotnet, NuGet cache, dotnet restore) should be gated
  // Look for: CLASSIFICATION == 'backend_only' || CLASSIFICATION == 'mixed'
  // Or: CLASSIFICATION != 'frontend_only' && CLASSIFICATION != 'ci_only' && CLASSIFICATION != 'docs_only'
  const hasBackendGating =
    sealGate.includes("CLASSIFICATION == 'backend_only'") ||
    sealGate.includes("CLASSIFICATION == 'mixed'") ||
    (sealGate.includes("CLASSIFICATION != 'frontend_only'") &&
      sealGate.includes("CLASSIFICATION != 'ci_only'"));

  assert.ok(
    hasBackendGating,
    'seal-gate should gate backend steps to run only for backend_only/mixed'
  );
});

test('Frontend build steps are gated for backend_only/ci_only/docs_only', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Frontend steps should be gated similarly
  const hasFrontendGating =
    sealGate.includes("CLASSIFICATION == 'frontend_only'") ||
    (sealGate.includes("CLASSIFICATION != 'backend_only'") &&
      sealGate.includes("CLASSIFICATION != 'ci_only'"));

  assert.ok(
    hasFrontendGating,
    'seal-gate should gate frontend steps to run only for frontend_only/mixed'
  );
});

test('CI validation steps run for ci_only and mixed', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // Contract tests / vitest should run for ci_only (and mixed by extension)
  // Since we have pnpm install running always, contract tests should work
  // Look for any indication that CI validation is scoped
  const hasContractTests =
    sealGate.includes('contract') ||
    sealGate.includes('ci_telemetry') ||
    sealGate.includes('vitest');

  assert.ok(hasContractTests, 'seal-gate should have CI validation steps (contract tests, etc.)');
});

test('mixed classification runs all steps', () => {
  const content = loadCiYml();
  const sealGate = extractJob(content, 'seal-gate');

  assert.ok(sealGate, 'seal-gate job should exist');

  // For mixed, both backend and frontend conditionals should evaluate to true
  // This is implicitly tested by having both backend_only and frontend_only gating
  // with "|| CLASSIFICATION == 'mixed'" in the condition
  const hasMixedInBackendGate = sealGate.includes("CLASSIFICATION == 'mixed'");
  const hasMixedInConditions = sealGate.match(/CLASSIFICATION == 'mixed'/g);

  assert.ok(hasMixedInBackendGate, 'seal-gate should include mixed in step conditions');
  assert.ok(
    hasMixedInConditions && hasMixedInConditions.length >= 2,
    'seal-gate should have multiple steps checking for mixed classification'
  );
});

// ============================================================================
// Governance jobs tests (should NOT be gated)
// ============================================================================

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

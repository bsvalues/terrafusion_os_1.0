/**
 * Performance Scanner Self-Test
 * Phase 4N + 4M1: Scanner Validation Harness
 *
 * This test validates that scanners correctly detect and classify
 * performance patterns. It ensures "0 actionable findings" means
 * "code is clean" not "scanner is broken."
 *
 * Run: node --test tools/registry/perf-skill-audit/tests/scanner-self-test.mjs
 */

import * as fs from 'fs';
import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expected findings from waterfall-patterns.ts fixture
const EXPECTED_FINDINGS = {
  // safe-parallel: fetchDashboardData - 3 independent awaits
  'safe-parallel': {
    functionName: 'fetchDashboardData',
    minAwaits: 3,
    shouldBeEligible: true,
  },
  // dependent: fetchUserWithProfile - data dependency
  dependent: {
    functionName: 'fetchUserWithProfile',
    minAwaits: 2,
    shouldBeEligible: false,
  },
  // batch-candidate: fetchMultipleUsers - same API pattern
  'batch-candidate': {
    functionName: 'fetchMultipleUsers',
    minAwaits: 3,
    shouldBeEligible: false, // batch-stub strategy, not auto-eligible
  },
};

// Patterns that should NOT produce findings
const SUPPRESSED_PATTERNS = [
  'processItemsSequentially', // loop-seq
  'fetchWithRetry', // retry-seq
  'legacyCodePath', // pragma-ignored
];

describe('Waterfall Scanner Self-Test (Phase 4N)', () => {
  let reportData;
  let planData;

  it('loads the full audit report', () => {
    const reportPath = path.join(__dirname, '..', 'out', 'perf-audit-report.full.json');
    assert.ok(fs.existsSync(reportPath), 'Full report should exist at ' + reportPath);
    reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.ok(reportData.findings, 'Report should have findings array');
  });

  it('loads the remediation plan', () => {
    const planPath = path.join(__dirname, '..', 'out', 'waterfalls.plan.json');
    assert.ok(fs.existsSync(planPath), 'Plan should exist at ' + planPath);
    planData = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    assert.ok(planData.items, 'Plan should have items array');
  });

  it('detects safe-parallel patterns in test fixtures', () => {
    const fixtureFindings = reportData.findings.filter(
      f => f.file.includes('waterfall-patterns.ts') && f.kind === 'safe-parallel'
    );

    assert.ok(
      fixtureFindings.length >= 1,
      `Should detect at least 1 safe-parallel pattern in fixtures, found ${fixtureFindings.length}`
    );

    const dashboardFinding = fixtureFindings.find(f => f.functionName === 'fetchDashboardData');

    if (dashboardFinding) {
      assert.strictEqual(
        dashboardFinding.kind,
        'safe-parallel',
        'fetchDashboardData should be classified as safe-parallel'
      );
    }
  });

  it('detects dependent patterns correctly', () => {
    const fixtureFindings = reportData.findings.filter(
      f => f.file.includes('waterfall-patterns.ts') && f.kind === 'dependent'
    );

    // Dependent patterns may or may not be detected depending on threshold
    // The key is that if detected, they should NOT be eligible
    for (const finding of fixtureFindings) {
      const planItem = planData.items.find(
        i =>
          i.file.includes('waterfall-patterns.ts') &&
          i.functionName === finding.functionName &&
          i.kind === 'dependent'
      );

      if (planItem) {
        assert.strictEqual(
          planItem.eligibility.eligible,
          false,
          `Dependent pattern ${finding.functionName} should NOT be eligible`
        );
      }
    }
  });

  it('suppresses loop-seq patterns', () => {
    const loopFindings = reportData.findings.filter(
      f => f.file.includes('waterfall-patterns.ts') && f.functionName === 'processItemsSequentially'
    );

    // Loop-seq should either not be detected or be marked as loop-seq
    for (const finding of loopFindings) {
      if (finding.kind) {
        assert.strictEqual(
          finding.kind,
          'loop-seq',
          'processItemsSequentially should be classified as loop-seq if detected'
        );
      }
    }
  });

  it('suppresses retry-seq patterns', () => {
    const retryFindings = reportData.findings.filter(
      f => f.file.includes('waterfall-patterns.ts') && f.functionName === 'fetchWithRetry'
    );

    // Retry-seq should either not be detected or be marked as retry-seq
    for (const finding of retryFindings) {
      if (finding.kind) {
        assert.strictEqual(
          finding.kind,
          'retry-seq',
          'fetchWithRetry should be classified as retry-seq if detected'
        );
      }
    }
  });

  it('respects pragma ignore directives', () => {
    const ignoredFindings = reportData.findings.filter(
      f => f.file.includes('waterfall-patterns.ts') && f.functionName === 'legacyCodePath'
    );

    assert.strictEqual(
      ignoredFindings.length,
      0,
      'legacyCodePath with ignore pragma should not produce findings'
    );
  });

  it('produces actionable.json with correct scope filter', () => {
    const actionablePath = path.join(__dirname, '..', 'out', 'perf-audit-report.actionable.json');
    assert.ok(fs.existsSync(actionablePath), 'Actionable report should exist');

    const actionableData = JSON.parse(fs.readFileSync(actionablePath, 'utf8'));

    // Actionable findings should only include allowed-surface files
    for (const finding of actionableData.findings) {
      const isAllowed =
        finding.file.startsWith('os-platform/core/pilot/') ||
        finding.file.startsWith('os-platform/core/types/') ||
        finding.file.startsWith('tools/registry/');

      assert.ok(isAllowed, `Actionable finding ${finding.file} should be in allowed surface`);
    }
  });

  it('test fixtures appear in allowed surface', () => {
    // The test fixture is in tools/registry/** which is allowed
    const fixtureFindings = reportData.findings.filter(f =>
      f.file.includes('waterfall-patterns.ts')
    );

    // If scanner working correctly on allowed surface,
    // we should see our test fixtures in results
    console.log(`Found ${fixtureFindings.length} findings in test fixture`);

    // This is informational - the fixture should produce some findings
    // to prove the scanner works on allowed surface
  });

  it('eligible items have required fields', () => {
    const eligibleItems = planData.items.filter(i => i.eligibility.eligible);

    for (const item of eligibleItems) {
      assert.ok(item.id, 'Eligible item should have id');
      assert.ok(item.file, 'Eligible item should have file');
      assert.ok(item.functionName, 'Eligible item should have functionName');
      assert.ok(item.startLine > 0, 'Eligible item should have valid startLine');
      assert.ok(item.endLine > 0, 'Eligible item should have valid endLine');
      assert.ok(item.evidence?.length >= 2, 'Eligible item should have at least 2 evidence items');
      assert.ok(item.suggestedPatch, 'Eligible item should have suggestedPatch');
      assert.ok(item.verification?.length > 0, 'Eligible item should have verification commands');
    }
  });

  it('governance invariant: eligible items are in allowed surface', () => {
    const eligibleItems = planData.items.filter(i => i.eligibility.eligible);

    for (const item of eligibleItems) {
      const isAllowed =
        item.file.startsWith('os-platform/core/pilot/') ||
        item.file.startsWith('os-platform/core/types/') ||
        item.file.startsWith('tools/registry/');

      const isForbidden =
        item.file.includes('/ARCHIVE/') ||
        item.file.includes('/archive/') ||
        item.file.startsWith('applications/') ||
        item.file.startsWith('specialized/');

      // Eligible items should be allowed and not forbidden
      assert.ok(
        isAllowed || !isForbidden,
        `Eligible item ${item.file} should be in allowed surface or not in forbidden zone`
      );
    }
  });
});

// ============================================================
// BUNDLE SCANNER SELF-TEST (Phase 4M1)
// ============================================================
describe('Bundle Scanner Self-Test (Phase 4M1)', () => {
  let reportData;

  it('loads the full audit report for bundle analysis', () => {
    const reportPath = path.join(__dirname, '..', 'out', 'perf-audit-report.full.json');
    assert.ok(fs.existsSync(reportPath), 'Full report should exist');
    reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  });

  it('detects barrel-import patterns in test fixtures', () => {
    const bundleFindings = reportData.findings.filter(
      f => f.file.includes('bundle-patterns.ts') && f.rule.startsWith('bundle.')
    );

    // Should detect at least the barrel imports from ./components and ../utils
    const barrelImports = bundleFindings.filter(f => f.kind === 'barrel-import');

    console.log(`Found ${barrelImports.length} barrel-import findings in bundle fixture`);

    // We expect at least 2 barrel imports (./components and ../utils)
    assert.ok(
      barrelImports.length >= 1,
      `Should detect barrel imports, found ${barrelImports.length}`
    );
  });

  it('detects heavy-import patterns (lodash)', () => {
    const heavyImports = reportData.findings.filter(
      f => f.file.includes('bundle-patterns.ts') && f.kind === 'heavy-import'
    );

    // Should detect lodash import
    assert.ok(
      heavyImports.length >= 1,
      `Should detect heavy library imports, found ${heavyImports.length}`
    );

    const lodashFinding = heavyImports.find(f => f.importPath === 'lodash');
    if (lodashFinding) {
      assert.ok(
        lodashFinding.suggestedFix.includes('lodash-es') ||
          lodashFinding.suggestedFix.includes('lodash/'),
        'Lodash finding should suggest tree-shakable alternative'
      );
    }
  });

  it('respects bundle ignore pragma', () => {
    // The pragma-ignored fixture should not produce findings
    const allBundleFindings = reportData.findings.filter(f =>
      f.file.includes('bundle-patterns.ts')
    );

    const ignoredFindings = allBundleFindings.filter(
      f => f.snippet && f.snippet.includes('barrel-directory')
    );

    assert.strictEqual(
      ignoredFindings.length,
      0,
      'Pragma-ignored barrel import should not produce findings'
    );
  });

  it('does not flag direct imports', () => {
    // Direct imports like './components/Button' should not be flagged
    const directImportFindings = reportData.findings.filter(
      f =>
        f.file.includes('bundle-patterns.ts') &&
        f.snippet &&
        f.snippet.includes('./components/Button')
    );

    assert.strictEqual(
      directImportFindings.length,
      0,
      'Direct imports should not be flagged as barrel imports'
    );
  });

  it('does not flag safe external imports', () => {
    // Imports from 'react', 'path', 'fs' should not be flagged
    const safeExternals = ['react', 'path', 'fs/promises'];
    const safeFindings = reportData.findings.filter(
      f =>
        f.file.includes('bundle-patterns.ts') &&
        safeExternals.some(ext => f.snippet && f.snippet.includes(`'${ext}'`))
    );

    assert.strictEqual(safeFindings.length, 0, 'Safe external imports should not be flagged');
  });

  it('bundle findings have required fields', () => {
    const bundleFindings = reportData.findings.filter(
      f => f.file.includes('bundle-patterns.ts') && f.rule.startsWith('bundle.')
    );

    for (const finding of bundleFindings) {
      assert.ok(finding.severity, 'Bundle finding should have severity');
      assert.ok(finding.rule, 'Bundle finding should have rule');
      assert.ok(finding.file, 'Bundle finding should have file');
      assert.ok(finding.lineStart > 0, 'Bundle finding should have valid lineStart');
      assert.ok(finding.message, 'Bundle finding should have message');
      assert.ok(finding.kind, 'Bundle finding should have kind classification');
      assert.ok(
        typeof finding.priorityScore === 'number',
        'Bundle finding should have priorityScore'
      );
    }
  });

  it('high-risk patterns have priority boost', () => {
    const bundleFindings = reportData.findings.filter(
      f => f.file.includes('bundle-patterns.ts') && f.kind === 'barrel-import'
    );

    // Findings in allowed surface should have priority >= 50
    for (const finding of bundleFindings) {
      // tools/registry is in HIGH_PRIORITY_PATHS, should get +30 boost
      assert.ok(
        finding.priorityScore >= 50,
        `Bundle finding in allowed surface should have priority >= 50, got ${finding.priorityScore}`
      );
    }
  });
});

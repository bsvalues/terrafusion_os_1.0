/**
 * Governance PR Contract Tests
 * ==============================
 *
 * Phase IIIl: Validates PR payload generation for SLO/alert modifications.
 *
 * Contract:
 * - pr_includes_before_after_diff: All changes show current vs proposed
 * - pr_metadata_complete: Required metadata present (rationale, evidence, approver)
 * - pr_passes_calibration_contracts: Proposed changes must pass all calibration tests
 * - pr_is_safe_by_default: No auto-merge, requires human approval
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Types for Governance PRs
// ============================================================================

/**
 * SLO change proposal.
 */
interface SloChange {
  readonly sloId: string;
  readonly field: 'target' | 'window' | 'dimensions';
  readonly currentValue: unknown;
  readonly proposedValue: unknown;
  readonly rationale: string;
}

/**
 * Alert change proposal.
 */
interface AlertChange {
  readonly alertId: string;
  readonly field: 'threshold' | 'burnRate' | 'suppression' | 'severity';
  readonly currentValue: unknown;
  readonly proposedValue: unknown;
  readonly rationale: string;
}

/**
 * Change evidence.
 */
interface ChangeEvidence {
  readonly baselineWindow: { start: string; end: string };
  readonly sampleCount: number;
  readonly driftObserved: number;
  readonly trendDirection: 'improving' | 'degrading' | 'stable';
  readonly confidence: 'low' | 'medium' | 'high';
}

/**
 * PR metadata.
 */
interface PrMetadata {
  readonly title: string;
  readonly description: string;
  readonly author: string;
  readonly createdAt: string;
  readonly labels: readonly string[];
  readonly requiredApprovers: readonly string[];
  readonly autoMerge: boolean;
}

/**
 * Calibration check result.
 */
interface CalibrationCheck {
  readonly passed: boolean;
  readonly checksRun: readonly string[];
  readonly failures: readonly string[];
}

/**
 * Complete PR payload.
 */
interface GovernancePrPayload {
  readonly metadata: PrMetadata;
  readonly sloChanges: readonly SloChange[];
  readonly alertChanges: readonly AlertChange[];
  readonly evidence: ChangeEvidence;
  readonly calibrationCheck: CalibrationCheck;
  readonly diffSummary: string;
}

/**
 * PR generation options.
 */
interface PrOptions {
  readonly requireApproval?: boolean;
  readonly minApprovers?: number;
  readonly runCalibrationChecks?: boolean;
}

const DEFAULT_PR_OPTIONS: Required<PrOptions> = {
  requireApproval: true,
  minApprovers: 1,
  runCalibrationChecks: true,
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Generate diff summary from changes.
 */
function generateDiffSummary(
  sloChanges: readonly SloChange[],
  alertChanges: readonly AlertChange[]
): string {
  const lines: string[] = [];

  if (sloChanges.length > 0) {
    lines.push('## SLO Changes\n');
    for (const change of sloChanges) {
      lines.push(`### ${change.sloId}`);
      lines.push(`- **Field:** ${change.field}`);
      lines.push(`- **Current:** \`${JSON.stringify(change.currentValue)}\``);
      lines.push(`- **Proposed:** \`${JSON.stringify(change.proposedValue)}\``);
      lines.push(`- **Rationale:** ${change.rationale}`);
      lines.push('');
    }
  }

  if (alertChanges.length > 0) {
    lines.push('## Alert Changes\n');
    for (const change of alertChanges) {
      lines.push(`### ${change.alertId}`);
      lines.push(`- **Field:** ${change.field}`);
      lines.push(`- **Current:** \`${JSON.stringify(change.currentValue)}\``);
      lines.push(`- **Proposed:** \`${JSON.stringify(change.proposedValue)}\``);
      lines.push(`- **Rationale:** ${change.rationale}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Run calibration checks on proposed changes.
 */
function runCalibrationChecks(
  sloChanges: readonly SloChange[],
  alertChanges: readonly AlertChange[]
): CalibrationCheck {
  const checksRun: string[] = [];
  const failures: string[] = [];

  // Check SLO target bounds
  checksRun.push('slo.target_bounds');
  for (const change of sloChanges) {
    if (change.field === 'target') {
      const value = change.proposedValue as number;
      if (value <= 0 || value > 1) {
        failures.push(`${change.sloId}: target must be between 0 and 1`);
      }
    }
  }

  // Check alert threshold bounds
  checksRun.push('alert.threshold_bounds');
  for (const change of alertChanges) {
    if (change.field === 'threshold') {
      const value = change.proposedValue as number;
      if (value <= 0) {
        failures.push(`${change.alertId}: threshold must be positive`);
      }
    }
  }

  // Check burn rate bounds
  checksRun.push('alert.burn_rate_bounds');
  for (const change of alertChanges) {
    if (change.field === 'burnRate') {
      const value = change.proposedValue as number;
      if (value < 1 || value > 100) {
        failures.push(`${change.alertId}: burnRate must be between 1 and 100`);
      }
    }
  }

  // Check suppression bounds
  checksRun.push('alert.suppression_bounds');
  for (const change of alertChanges) {
    if (change.field === 'suppression') {
      const value = change.proposedValue as number;
      if (value < 30 || value > 600) {
        failures.push(`${change.alertId}: suppression must be between 30 and 600 seconds`);
      }
    }
  }

  return {
    passed: failures.length === 0,
    checksRun,
    failures,
  };
}

/**
 * Validate PR metadata completeness.
 */
function validatePrMetadata(metadata: PrMetadata): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata.title || metadata.title.length < 10) {
    errors.push('Title must be at least 10 characters');
  }
  if (!metadata.description || metadata.description.length < 20) {
    errors.push('Description must be at least 20 characters');
  }
  if (!metadata.author) {
    errors.push('Author is required');
  }
  if (!metadata.createdAt || isNaN(Date.parse(metadata.createdAt))) {
    errors.push('Valid createdAt timestamp is required');
  }
  if (metadata.autoMerge === true) {
    errors.push('Auto-merge is not allowed for governance PRs');
  }
  if (metadata.requiredApprovers.length === 0) {
    errors.push('At least one approver is required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate change evidence.
 */
function validateEvidence(evidence: ChangeEvidence): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!evidence.baselineWindow.start || !evidence.baselineWindow.end) {
    errors.push('Baseline window is required');
  }
  if (evidence.sampleCount < 100) {
    errors.push('Insufficient sample count for evidence (minimum 100)');
  }
  if (evidence.confidence === 'low') {
    errors.push('Low confidence evidence is not sufficient for governance changes');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate governance PR payload.
 */
function generateGovernancePr(
  sloChanges: readonly SloChange[],
  alertChanges: readonly AlertChange[],
  evidence: ChangeEvidence,
  options: PrOptions = {}
): GovernancePrPayload {
  const opts = { ...DEFAULT_PR_OPTIONS, ...options };

  const metadata: PrMetadata = {
    title: `[Governance] SLO/Alert Calibration Update`,
    description: `Automated calibration update based on baseline drift detection.\n\nChanges: ${sloChanges.length} SLO(s), ${alertChanges.length} Alert(s)`,
    author: 'calibration-bot',
    createdAt: new Date().toISOString(),
    labels: ['governance', 'calibration', 'auto-generated'],
    requiredApprovers: ['security-team'],
    autoMerge: false, // Never auto-merge governance PRs
  };

  const calibrationCheck = opts.runCalibrationChecks
    ? runCalibrationChecks(sloChanges, alertChanges)
    : { passed: true, checksRun: [], failures: [] };

  const diffSummary = generateDiffSummary(sloChanges, alertChanges);

  return {
    metadata,
    sloChanges,
    alertChanges,
    evidence,
    calibrationCheck,
    diffSummary,
  };
}

// ============================================================================
// Contract: pr_includes_before_after_diff
// ============================================================================

describe('Governance PR Contract', () => {
  describe('pr_includes_before_after_diff', () => {
    it('should include current and proposed values for SLO changes', () => {
      const sloChange: SloChange = {
        sloId: 'security.denial_rate',
        field: 'target',
        currentValue: 0.05,
        proposedValue: 0.03,
        rationale: 'Baseline shows lower denial rate is sustainable',
      };

      const diff = generateDiffSummary([sloChange], []);
      assert.ok(diff.includes('Current'), 'Should include current label');
      assert.ok(diff.includes('Proposed'), 'Should include proposed label');
      assert.ok(diff.includes('0.05'), 'Should include current value');
      assert.ok(diff.includes('0.03'), 'Should include proposed value');
    });

    it('should include current and proposed values for alert changes', () => {
      const alertChange: AlertChange = {
        alertId: 'security.denial_rate.burn_rate.fast',
        field: 'threshold',
        currentValue: 0.072,
        proposedValue: 0.05,
        rationale: 'Align with updated SLO target',
      };

      const diff = generateDiffSummary([], [alertChange]);
      assert.ok(diff.includes('Current'));
      assert.ok(diff.includes('Proposed'));
      assert.ok(diff.includes('0.072'));
      assert.ok(diff.includes('0.05'));
    });

    it('should include rationale for each change', () => {
      const sloChange: SloChange = {
        sloId: 'security.denial_rate',
        field: 'target',
        currentValue: 0.05,
        proposedValue: 0.03,
        rationale: 'Baseline shows lower denial rate is sustainable',
      };

      const diff = generateDiffSummary([sloChange], []);
      assert.ok(diff.includes('Rationale'));
      assert.ok(diff.includes('sustainable'));
    });

    it('should separate SLO and alert changes in diff', () => {
      const sloChange: SloChange = {
        sloId: 'security.denial_rate',
        field: 'target',
        currentValue: 0.05,
        proposedValue: 0.03,
        rationale: 'Test',
      };
      const alertChange: AlertChange = {
        alertId: 'security.denial_rate.burn_rate.fast',
        field: 'threshold',
        currentValue: 0.072,
        proposedValue: 0.05,
        rationale: 'Test',
      };

      const diff = generateDiffSummary([sloChange], [alertChange]);
      assert.ok(diff.includes('## SLO Changes'));
      assert.ok(diff.includes('## Alert Changes'));
    });
  });

  // ============================================================================
  // Contract: pr_metadata_complete
  // ============================================================================

  describe('pr_metadata_complete', () => {
    it('should require title with minimum length', () => {
      const metadata: PrMetadata = {
        title: 'Short',
        description: 'A sufficiently long description for the PR',
        author: 'test-user',
        createdAt: new Date().toISOString(),
        labels: ['governance'],
        requiredApprovers: ['security-team'],
        autoMerge: false,
      };

      const result = validatePrMetadata(metadata);
      assert.ok(!result.valid, 'Should reject short title');
      assert.ok(result.errors.some(e => e.includes('Title')));
    });

    it('should require description with minimum length', () => {
      const metadata: PrMetadata = {
        title: 'A sufficiently long title',
        description: 'Too short',
        author: 'test-user',
        createdAt: new Date().toISOString(),
        labels: ['governance'],
        requiredApprovers: ['security-team'],
        autoMerge: false,
      };

      const result = validatePrMetadata(metadata);
      assert.ok(!result.valid, 'Should reject short description');
      assert.ok(result.errors.some(e => e.includes('Description')));
    });

    it('should require at least one approver', () => {
      const metadata: PrMetadata = {
        title: 'A sufficiently long title',
        description: 'A sufficiently long description for the PR',
        author: 'test-user',
        createdAt: new Date().toISOString(),
        labels: ['governance'],
        requiredApprovers: [],
        autoMerge: false,
      };

      const result = validatePrMetadata(metadata);
      assert.ok(!result.valid, 'Should reject no approvers');
      assert.ok(result.errors.some(e => e.includes('approver')));
    });

    it('should validate complete metadata', () => {
      const metadata: PrMetadata = {
        title: 'A sufficiently long title',
        description: 'A sufficiently long description for the PR',
        author: 'test-user',
        createdAt: new Date().toISOString(),
        labels: ['governance'],
        requiredApprovers: ['security-team'],
        autoMerge: false,
      };

      const result = validatePrMetadata(metadata);
      assert.ok(result.valid, `Should be valid: ${result.errors.join(', ')}`);
    });
  });

  // ============================================================================
  // Contract: pr_passes_calibration_contracts
  // ============================================================================

  describe('pr_passes_calibration_contracts', () => {
    it('should run calibration checks on SLO changes', () => {
      const sloChange: SloChange = {
        sloId: 'security.denial_rate',
        field: 'target',
        currentValue: 0.05,
        proposedValue: 0.03,
        rationale: 'Test',
      };

      const check = runCalibrationChecks([sloChange], []);
      assert.ok(check.checksRun.includes('slo.target_bounds'));
    });

    it('should fail SLO target outside bounds', () => {
      const sloChange: SloChange = {
        sloId: 'security.denial_rate',
        field: 'target',
        currentValue: 0.05,
        proposedValue: 1.5, // Invalid: > 1
        rationale: 'Test',
      };

      const check = runCalibrationChecks([sloChange], []);
      assert.ok(!check.passed, 'Should fail for invalid target');
      assert.ok(check.failures.some(f => f.includes('target')));
    });

    it('should run calibration checks on alert changes', () => {
      const alertChange: AlertChange = {
        alertId: 'security.denial_rate.burn_rate.fast',
        field: 'burnRate',
        currentValue: 14.4,
        proposedValue: 12,
        rationale: 'Test',
      };

      const check = runCalibrationChecks([], [alertChange]);
      assert.ok(check.checksRun.includes('alert.burn_rate_bounds'));
    });

    it('should fail burn rate outside bounds', () => {
      const alertChange: AlertChange = {
        alertId: 'security.denial_rate.burn_rate.fast',
        field: 'burnRate',
        currentValue: 14.4,
        proposedValue: 200, // Invalid: > 100
        rationale: 'Test',
      };

      const check = runCalibrationChecks([], [alertChange]);
      assert.ok(!check.passed, 'Should fail for invalid burn rate');
      assert.ok(check.failures.some(f => f.includes('burnRate')));
    });

    it('should fail suppression outside bounds', () => {
      const alertChange: AlertChange = {
        alertId: 'security.denial_rate.burn_rate.fast',
        field: 'suppression',
        currentValue: 300,
        proposedValue: 10, // Invalid: < 30
        rationale: 'Test',
      };

      const check = runCalibrationChecks([], [alertChange]);
      assert.ok(!check.passed, 'Should fail for invalid suppression');
      assert.ok(check.failures.some(f => f.includes('suppression')));
    });
  });

  // ============================================================================
  // Contract: pr_is_safe_by_default
  // ============================================================================

  describe('pr_is_safe_by_default', () => {
    it('should never set autoMerge to true', () => {
      const evidence: ChangeEvidence = {
        baselineWindow: { start: '2026-01-01T00:00:00Z', end: '2026-01-07T00:00:00Z' },
        sampleCount: 1000,
        driftObserved: 30,
        trendDirection: 'stable',
        confidence: 'high',
      };

      const pr = generateGovernancePr([], [], evidence);
      assert.strictEqual(pr.metadata.autoMerge, false, 'autoMerge must be false');
    });

    it('should reject autoMerge in metadata validation', () => {
      const metadata: PrMetadata = {
        title: 'A sufficiently long title',
        description: 'A sufficiently long description for the PR',
        author: 'test-user',
        createdAt: new Date().toISOString(),
        labels: ['governance'],
        requiredApprovers: ['security-team'],
        autoMerge: true, // Not allowed
      };

      const result = validatePrMetadata(metadata);
      assert.ok(!result.valid, 'Should reject autoMerge=true');
      assert.ok(result.errors.some(e => e.includes('Auto-merge')));
    });

    it('should require sufficient evidence for changes', () => {
      const lowEvidence: ChangeEvidence = {
        baselineWindow: { start: '2026-01-01T00:00:00Z', end: '2026-01-07T00:00:00Z' },
        sampleCount: 50, // Too few
        driftObserved: 30,
        trendDirection: 'stable',
        confidence: 'low', // Too low
      };

      const result = validateEvidence(lowEvidence);
      assert.ok(!result.valid, 'Should reject low confidence');
      assert.ok(result.errors.some(e => e.includes('sample count')));
      assert.ok(result.errors.some(e => e.includes('confidence')));
    });

    it('should include required approvers', () => {
      const evidence: ChangeEvidence = {
        baselineWindow: { start: '2026-01-01T00:00:00Z', end: '2026-01-07T00:00:00Z' },
        sampleCount: 1000,
        driftObserved: 30,
        trendDirection: 'stable',
        confidence: 'high',
      };

      const pr = generateGovernancePr([], [], evidence);
      assert.ok(pr.metadata.requiredApprovers.length > 0, 'Must have approvers');
    });

    it('should include governance label', () => {
      const evidence: ChangeEvidence = {
        baselineWindow: { start: '2026-01-01T00:00:00Z', end: '2026-01-07T00:00:00Z' },
        sampleCount: 1000,
        driftObserved: 30,
        trendDirection: 'stable',
        confidence: 'high',
      };

      const pr = generateGovernancePr([], [], evidence);
      assert.ok(pr.metadata.labels.includes('governance'), 'Must have governance label');
    });
  });
});

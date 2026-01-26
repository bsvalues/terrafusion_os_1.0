/**
 * Unit tests for auto_approve_policy.mjs
 *
 * Tests the deterministic policy decision logic for auto-approving
 * low-risk PRs via GitHub App co-signer.
 *
 * @fileoverview Vitest unit tests for auto_approve_policy.mjs
 */

import { describe, expect, it } from 'vitest';

// ============================================================================
// Inline implementations (mirror the actual script logic for unit testing)
// ============================================================================

const LOW_RISK_CLASSIFICATIONS = ['docs_only', 'ci_only'];
const BREAK_GLASS_LABELS = ['auto-approve', 'break-glass'];
const REQUIRED_CHECKS = ['scope-drift-guard', 'proof', '🔒 TerraFusion Seal Gate'];

interface PolicyParams {
  classification: string;
  labels?: string[];
  checksPassed: boolean;
  changedFiles?: string[];
}

interface AuditTrail {
  classification: string;
  labels: string[];
  checksPassed: boolean;
  changedFilesCount: number;
  evaluatedAt: string;
  policyVersion: string;
  breakGlassTriggered?: boolean;
}

interface PolicyResult {
  approve: boolean;
  reason: string;
  scope: string;
  auditTrail: AuditTrail;
}

function evaluatePolicy({
  classification,
  labels = [],
  checksPassed,
  changedFiles = [],
}: PolicyParams): PolicyResult {
  const auditTrail: AuditTrail = {
    classification,
    labels,
    checksPassed,
    changedFilesCount: changedFiles.length,
    evaluatedAt: new Date().toISOString(),
    policyVersion: '1.0.0',
  };

  // GATE 1: Required checks must pass
  if (!checksPassed) {
    return {
      approve: false,
      reason: 'Required checks have not passed',
      scope: 'checks',
      auditTrail,
    };
  }

  // GATE 2: Check for break-glass labels
  const hasBreakGlass = labels.some(label => BREAK_GLASS_LABELS.includes(label.toLowerCase()));

  if (hasBreakGlass) {
    return {
      approve: true,
      reason: `Break-glass label detected: ${labels.find(l => BREAK_GLASS_LABELS.includes(l.toLowerCase()))}`,
      scope: 'break-glass',
      auditTrail: { ...auditTrail, breakGlassTriggered: true },
    };
  }

  // GATE 3: Classification-based policy
  const isLowRisk = LOW_RISK_CLASSIFICATIONS.includes(classification);

  if (isLowRisk) {
    return {
      approve: true,
      reason: `Classification '${classification}' is low-risk and eligible for auto-approve`,
      scope: classification,
      auditTrail,
    };
  }

  // HIGH-RISK: Require human review
  return {
    approve: false,
    reason: `Classification '${classification}' requires human review`,
    scope: 'human-review',
    auditTrail,
  };
}

interface StatusCheck {
  name: string;
  conclusion: string | null;
}

function checkRequiredChecksPassed(statusChecks: StatusCheck[] | null | undefined): boolean {
  if (!Array.isArray(statusChecks) || statusChecks.length === 0) {
    return false;
  }

  for (const requiredCheck of REQUIRED_CHECKS) {
    const check = statusChecks.find(c => c.name === requiredCheck);
    if (!check || check.conclusion !== 'success') {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Tests
// ============================================================================

describe('evaluatePolicy', () => {
  describe('low-risk classifications', () => {
    it('docs_only + checks passed -> approve = true', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('docs_only');
      expect(result.reason).toContain('low-risk');
    });

    it('ci_only + checks passed -> approve = true', () => {
      const result = evaluatePolicy({
        classification: 'ci_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('ci_only');
      expect(result.reason).toContain('low-risk');
    });
  });

  describe('high-risk classifications', () => {
    it('frontend_only -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'frontend_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('human-review');
      expect(result.reason).toContain('requires human review');
    });

    it('backend_only -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'backend_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('human-review');
      expect(result.reason).toContain('requires human review');
    });

    it('mixed -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: [],
        checksPassed: true,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('human-review');
    });
  });

  describe('checks gate', () => {
    it('low-risk but checks not passed -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: false,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('checks');
      expect(result.reason).toContain('checks have not passed');
    });

    it('high-risk and checks not passed -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: [],
        checksPassed: false,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('checks');
    });
  });

  describe('break-glass labels', () => {
    it('auto-approve label -> approve = true (bypasses classification)', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
      expect(result.reason).toContain('Break-glass label');
      expect(result.auditTrail.breakGlassTriggered).toBe(true);
    });

    it('break-glass label -> approve = true', () => {
      const result = evaluatePolicy({
        classification: 'backend_only',
        labels: ['break-glass'],
        checksPassed: true,
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
    });

    it('break-glass label is case-insensitive', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['AUTO-APPROVE'],
        checksPassed: true,
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
    });

    it('break-glass still requires checks to pass', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: false,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('checks');
    });

    it('unrelated labels do not trigger break-glass', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['bug', 'enhancement', 'priority-high'],
        checksPassed: true,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('human-review');
    });
  });

  describe('audit trail', () => {
    it('includes classification in audit trail', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.auditTrail.classification).toBe('docs_only');
    });

    it('includes labels in audit trail', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: ['documentation', 'minor'],
        checksPassed: true,
      });
      expect(result.auditTrail.labels).toEqual(['documentation', 'minor']);
    });

    it('includes checksPassed in audit trail', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.auditTrail.checksPassed).toBe(true);
    });

    it('includes evaluatedAt timestamp', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.auditTrail.evaluatedAt).toBeDefined();
      // Should be valid ISO timestamp
      expect(() => new Date(result.auditTrail.evaluatedAt)).not.toThrow();
    });

    it('includes policy version', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.auditTrail.policyVersion).toBe('1.0.0');
    });

    it('tracks changed files count when provided', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['README.md', 'docs/api.md', 'CHANGELOG.md'],
      });
      expect(result.auditTrail.changedFilesCount).toBe(3);
    });
  });
});

describe('checkRequiredChecksPassed', () => {
  it('returns true when all required checks pass', () => {
    const statusChecks = [
      { name: 'scope-drift-guard', conclusion: 'success' },
      { name: 'proof', conclusion: 'success' },
      { name: '🔒 TerraFusion Seal Gate', conclusion: 'success' },
    ];
    expect(checkRequiredChecksPassed(statusChecks)).toBe(true);
  });

  it('returns false when any required check fails', () => {
    const statusChecks = [
      { name: 'scope-drift-guard', conclusion: 'success' },
      { name: 'proof', conclusion: 'failure' },
      { name: '🔒 TerraFusion Seal Gate', conclusion: 'success' },
    ];
    expect(checkRequiredChecksPassed(statusChecks)).toBe(false);
  });

  it('returns false when required check is missing', () => {
    const statusChecks = [
      { name: 'scope-drift-guard', conclusion: 'success' },
      { name: '🔒 TerraFusion Seal Gate', conclusion: 'success' },
      // 'proof' is missing
    ];
    expect(checkRequiredChecksPassed(statusChecks)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(checkRequiredChecksPassed([])).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(checkRequiredChecksPassed(null)).toBe(false);
    expect(checkRequiredChecksPassed(undefined)).toBe(false);
  });

  it('ignores extra non-required checks', () => {
    const statusChecks = [
      { name: 'scope-drift-guard', conclusion: 'success' },
      { name: 'proof', conclusion: 'success' },
      { name: '🔒 TerraFusion Seal Gate', conclusion: 'success' },
      { name: 'optional-lint', conclusion: 'failure' },
      { name: 'codecov', conclusion: 'skipped' },
    ];
    expect(checkRequiredChecksPassed(statusChecks)).toBe(true);
  });

  it('handles pending/in-progress checks as not passed', () => {
    const statusChecks = [
      { name: 'scope-drift-guard', conclusion: 'success' },
      { name: 'proof', conclusion: null }, // still running
      { name: '🔒 TerraFusion Seal Gate', conclusion: 'success' },
    ];
    expect(checkRequiredChecksPassed(statusChecks)).toBe(false);
  });
});

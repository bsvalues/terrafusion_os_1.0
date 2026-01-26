/**
 * Unit tests for auto_approve_policy.mjs
 *
 * Tests the deterministic policy decision logic for auto-approving
 * low-risk PRs via GitHub App co-signer.
 *
 * @fileoverview Vitest unit tests for auto_approve_policy.mjs
 * @version 1.2.0 - Permission check added for break-glass (belt + suspenders)
 */

import { describe, expect, it } from 'vitest';

// ============================================================================
// Inline implementations (mirror the actual script logic for unit testing)
// v1.2.0 Security hardening:
// - Removed 'ci_only' from low-risk (workflow files = code execution risk)
// - Added blocked path patterns for code execution files
// - Added actor allowlist for break-glass labels
// - Added write permission check for break-glass (belt + suspenders)
// ============================================================================

// Only docs_only is auto-approvable. ci_only removed due to code execution risk.
const LOW_RISK_CLASSIFICATIONS = ['docs_only'];

const BREAK_GLASS_LABELS = ['auto-approve', 'break-glass'];
const REQUIRED_CHECKS = ['scope-drift-guard', 'proof', '🔒 TerraFusion Seal Gate'];

// Block patterns that could enable code execution
const BLOCKED_PATH_PATTERNS = [
  /^\.github\/workflows\//,
  /^scripts\//,
  /^\.github\/actions\//,
  /package\.json$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
];

// Actors allowed to use break-glass (default to empty = no one)
const DEFAULT_BREAK_GLASS_ACTORS: string[] = [];

interface PolicyParams {
  classification: string;
  labels?: string[];
  checksPassed: boolean;
  changedFiles?: string[];
  actor?: string;
  breakGlassActors?: string[];
  hasWritePermission?: boolean; // v1.2.0: permission check
}

interface AuditTrail {
  classification: string;
  labels: string[];
  checksPassed: boolean;
  changedFilesCount: number;
  evaluatedAt: string;
  policyVersion: string;
  breakGlassTriggered?: boolean;
  blockedPathsDetected?: string[];
  actor?: string;
}

interface PolicyResult {
  approve: boolean;
  reason: string;
  scope: string;
  auditTrail: AuditTrail;
}

function checkBlockedPaths(changedFiles: string[]): string[] {
  const blocked: string[] = [];
  for (const file of changedFiles) {
    for (const pattern of BLOCKED_PATH_PATTERNS) {
      if (pattern.test(file)) {
        blocked.push(file);
        break;
      }
    }
  }
  return blocked;
}

function evaluatePolicy({
  classification,
  labels = [],
  checksPassed,
  changedFiles = [],
  actor = '',
  breakGlassActors = DEFAULT_BREAK_GLASS_ACTORS,
  hasWritePermission = true, // v1.2.0: default true for backward compat in tests
}: PolicyParams): PolicyResult {
  const auditTrail: AuditTrail = {
    classification,
    labels,
    checksPassed,
    changedFilesCount: changedFiles.length,
    evaluatedAt: new Date().toISOString(),
    policyVersion: '1.2.0',
    actor,
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

  // GATE 2: Check for blocked paths (code execution risk)
  const blockedPaths = checkBlockedPaths(changedFiles);
  if (blockedPaths.length > 0) {
    return {
      approve: false,
      reason: `Blocked paths detected (code execution risk): ${blockedPaths.join(', ')}`,
      scope: 'blocked-paths',
      auditTrail: { ...auditTrail, blockedPathsDetected: blockedPaths },
    };
  }

  // GATE 3: Check for break-glass labels (with permission + actor restriction)
  const hasBreakGlass = labels.some(label => BREAK_GLASS_LABELS.includes(label.toLowerCase()));

  if (hasBreakGlass) {
    // Belt: Actor must have write permission
    if (!hasWritePermission) {
      return {
        approve: false,
        reason: `Break-glass label present but actor '${actor}' lacks write permission`,
        scope: 'break-glass-denied',
        auditTrail: { ...auditTrail, breakGlassTriggered: false },
      };
    }
    // Suspenders: Actor must be in allowlist
    if (!breakGlassActors.includes(actor)) {
      return {
        approve: false,
        reason: `Break-glass label present but actor '${actor}' not in allowlist`,
        scope: 'break-glass-denied',
        auditTrail: { ...auditTrail, breakGlassTriggered: false },
      };
    }
    return {
      approve: true,
      reason: `Break-glass label detected: ${labels.find(l => BREAK_GLASS_LABELS.includes(l.toLowerCase()))}`,
      scope: 'break-glass',
      auditTrail: { ...auditTrail, breakGlassTriggered: true },
    };
  }

  // GATE 4: Classification-based policy
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

    // v1.1.0: ci_only now requires human review due to code execution risk
    it('ci_only + checks passed -> approve = false (v1.1.0 security hardening)', () => {
      const result = evaluatePolicy({
        classification: 'ci_only',
        labels: [],
        checksPassed: true,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('human-review');
      expect(result.reason).toContain('requires human review');
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

  // v1.1.0: Blocked paths gate
  describe('blocked paths gate', () => {
    it('workflow files -> approve = false (code execution risk)', () => {
      const result = evaluatePolicy({
        classification: 'ci_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['.github/workflows/ci.yml'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
      expect(result.reason).toContain('Blocked paths detected');
      expect(result.auditTrail.blockedPathsDetected).toContain('.github/workflows/ci.yml');
    });

    it('scripts directory -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['scripts/deploy.sh'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
    });

    it('package.json -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['package.json'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
    });

    it('github actions directory -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['.github/actions/custom-action/action.yml'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
    });

    it('lock files -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['pnpm-lock.yaml'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
    });

    it('docs files only -> approve = true (no blocked paths)', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['README.md', 'docs/api.md'],
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('docs_only');
    });

    it('mixed safe and blocked -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'docs_only',
        labels: [],
        checksPassed: true,
        changedFiles: ['README.md', '.github/workflows/test.yml'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
    });
  });

  describe('break-glass labels', () => {
    it('auto-approve label + allowed actor -> approve = true', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        actor: 'bsvalley',
        breakGlassActors: ['bsvalley', 'admin'],
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
      expect(result.reason).toContain('Break-glass label');
      expect(result.auditTrail.breakGlassTriggered).toBe(true);
    });

    it('break-glass label + allowed actor -> approve = true', () => {
      const result = evaluatePolicy({
        classification: 'backend_only',
        labels: ['break-glass'],
        checksPassed: true,
        actor: 'admin',
        breakGlassActors: ['bsvalley', 'admin'],
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
    });

    it('break-glass label is case-insensitive', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['AUTO-APPROVE'],
        checksPassed: true,
        actor: 'bsvalley',
        breakGlassActors: ['bsvalley'],
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
    });

    it('break-glass still requires checks to pass', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: false,
        actor: 'bsvalley',
        breakGlassActors: ['bsvalley'],
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

    // v1.1.0: Actor restriction tests
    it('break-glass label + unauthorized actor -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        actor: 'attacker',
        breakGlassActors: ['bsvalley', 'admin'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('break-glass-denied');
      expect(result.reason).toContain('not in allowlist');
      expect(result.auditTrail.breakGlassTriggered).toBe(false);
    });

    it('break-glass label + empty allowlist -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        actor: 'bsvalley',
        breakGlassActors: [],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('break-glass-denied');
    });

    it('break-glass label + no actor provided -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        // actor defaults to ''
        breakGlassActors: ['bsvalley'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('break-glass-denied');
    });

    it('break-glass blocked by paths even with allowed actor', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        actor: 'bsvalley',
        breakGlassActors: ['bsvalley'],
        changedFiles: ['.github/workflows/deploy.yml'],
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('blocked-paths');
    });

    // v1.2.0: Permission check (belt + suspenders)
    it('break-glass label + no write permission -> approve = false', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        actor: 'bsvalley',
        breakGlassActors: ['bsvalley'],
        hasWritePermission: false,
      });
      expect(result.approve).toBe(false);
      expect(result.scope).toBe('break-glass-denied');
      expect(result.reason).toContain('lacks write permission');
    });

    it('break-glass label + write permission + allowed actor -> approve = true', () => {
      const result = evaluatePolicy({
        classification: 'mixed',
        labels: ['auto-approve'],
        checksPassed: true,
        actor: 'bsvalley',
        breakGlassActors: ['bsvalley'],
        hasWritePermission: true,
      });
      expect(result.approve).toBe(true);
      expect(result.scope).toBe('break-glass');
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
      expect(result.auditTrail.policyVersion).toBe('1.2.0');
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

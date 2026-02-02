/**
 * Runbooks Ops-Plane Structure Contract Tests
 * =============================================
 *
 * Phase IVa: Validates ops-plane runbook structure and completeness.
 *
 * Contract:
 * - required_sections_present: all mandatory sections exist
 * - links_are_present_and_well_formed: dashboards/alerts/runbooks linked
 * - runbook_refs_match_policy_ids: no drift between policy and docs
 * - severity_specific_playbooks: each severity has guidance
 * - actionable_steps_defined: clear operator instructions
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Runbook Structure
// ============================================================================

/**
 * Required runbook sections.
 */
type RunbookSection =
  | 'overview'
  | 'symptoms'
  | 'diagnosis'
  | 'remediation'
  | 'escalation'
  | 'prevention'
  | 'related_alerts'
  | 'dashboards'
  | 'contacts';

/**
 * Link types in runbooks.
 */
type LinkType = 'dashboard' | 'alert' | 'runbook' | 'documentation' | 'external';

/**
 * Runbook link.
 */
interface RunbookLink {
  readonly type: LinkType;
  readonly id: string;
  readonly url: string;
  readonly description: string;
}

/**
 * Runbook step.
 */
interface RunbookStep {
  readonly order: number;
  readonly action: string;
  readonly expectedOutcome: string;
  readonly rollbackAction?: string;
  readonly automatable: boolean;
}

/**
 * Runbook definition.
 */
interface Runbook {
  readonly id: string;
  readonly title: string;
  readonly version: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly sections: Partial<Record<RunbookSection, string>>;
  readonly links: readonly RunbookLink[];
  readonly steps: readonly RunbookStep[];
  readonly policyRefs: readonly string[];
  readonly lastUpdated: string;
}

/**
 * Runbook validation result.
 */
interface RunbookValidationResult {
  readonly runbookId: string;
  readonly valid: boolean;
  readonly missingSections: readonly RunbookSection[];
  readonly invalidLinks: readonly string[];
  readonly policyMismatches: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Policy reference for cross-checking.
 */
interface PolicyReference {
  readonly id: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly requiredRunbookId: string;
}

// ============================================================================
// Constants
// ============================================================================

const REQUIRED_SECTIONS: readonly RunbookSection[] = [
  'overview',
  'symptoms',
  'diagnosis',
  'remediation',
  'escalation',
];

const RECOMMENDED_SECTIONS: readonly RunbookSection[] = [
  'prevention',
  'related_alerts',
  'dashboards',
  'contacts',
];

const SAMPLE_RUNBOOKS: readonly Runbook[] = [
  {
    id: 'RB-OPS-001',
    title: 'Ops Plane Notification Failure',
    version: '1.0.0',
    severity: 'critical',
    sections: {
      overview: 'Notification delivery failing across one or more channels.',
      symptoms: 'Alert delivery rate drops below 99%. Dashboard shows red notification SLO.',
      diagnosis:
        '1. Check channel health in dashboard\n2. Verify credentials\n3. Check circuit breaker status',
      remediation:
        '1. Reset circuit breaker if tripped\n2. Rotate credentials if expired\n3. Failover to backup channel',
      escalation: 'If not resolved in 15 minutes, page oncall-manager.',
      prevention: 'Regular credential rotation. Monitor channel health proactively.',
      related_alerts: 'ALERT-OPS-NOTIFY-001, ALERT-OPS-NOTIFY-002',
      dashboards: 'OPS-NOTIFY-HEALTH, OPS-SLO-OVERVIEW',
      contacts: 'oncall-primary, ops-lead',
    },
    links: [
      {
        type: 'dashboard',
        id: 'OPS-NOTIFY-HEALTH',
        url: '/dashboards/ops-notify',
        description: 'Notification health dashboard',
      },
      {
        type: 'alert',
        id: 'ALERT-OPS-NOTIFY-001',
        url: '/alerts/ops-notify-001',
        description: 'Notification SLO breach alert',
      },
      {
        type: 'runbook',
        id: 'RB-OPS-002',
        url: '/runbooks/RB-OPS-002',
        description: 'Channel failover procedure',
      },
    ],
    steps: [
      {
        order: 1,
        action: 'Check notification dashboard for channel status',
        expectedOutcome: 'Identify failing channel',
        automatable: true,
      },
      {
        order: 2,
        action: 'Review circuit breaker state',
        expectedOutcome: 'Determine if breaker is open',
        automatable: true,
      },
      {
        order: 3,
        action: 'Reset circuit breaker if appropriate',
        expectedOutcome: 'Breaker closes, retries begin',
        rollbackAction: 'Re-open breaker if issue persists',
        automatable: false,
      },
      {
        order: 4,
        action: 'Verify notification delivery resumes',
        expectedOutcome: 'SLO returns to green',
        automatable: true,
      },
    ],
    policyRefs: ['POLICY-OPS-NOTIFY'],
    lastUpdated: '2026-02-01T00:00:00Z',
  },
  {
    id: 'RB-OPS-002',
    title: 'Audit Integrity Verification Failure',
    version: '1.0.0',
    severity: 'high',
    sections: {
      overview: 'Audit log integrity check has detected anomalies.',
      symptoms: 'Audit integrity job reports failures. Checksum chain broken.',
      diagnosis:
        '1. Review integrity report\n2. Identify first broken sequence\n3. Check for tampering indicators',
      remediation:
        '1. Quarantine affected records\n2. Restore from backup if available\n3. Investigate root cause',
      escalation: 'Immediately notify security team. This is a potential security incident.',
      prevention: 'Regular integrity checks. Immutable audit storage.',
    },
    links: [
      {
        type: 'dashboard',
        id: 'OPS-AUDIT-INTEGRITY',
        url: '/dashboards/audit-integrity',
        description: 'Audit integrity dashboard',
      },
      {
        type: 'alert',
        id: 'ALERT-OPS-AUDIT-001',
        url: '/alerts/audit-001',
        description: 'Audit integrity breach alert',
      },
    ],
    steps: [
      {
        order: 1,
        action: 'Review integrity report details',
        expectedOutcome: 'Identify scope of issue',
        automatable: true,
      },
      {
        order: 2,
        action: 'Freeze affected audit segment',
        expectedOutcome: 'Prevent further writes',
        automatable: false,
      },
      {
        order: 3,
        action: 'Notify security team',
        expectedOutcome: 'Security incident opened',
        automatable: true,
      },
      {
        order: 4,
        action: 'Begin forensic analysis',
        expectedOutcome: 'Root cause identified',
        automatable: false,
      },
    ],
    policyRefs: ['POLICY-OPS-AUDIT', 'POLICY-SECURITY-INCIDENT'],
    lastUpdated: '2026-02-01T00:00:00Z',
  },
  {
    id: 'RB-OPS-003',
    title: 'SLO Budget Exhaustion Warning',
    version: '1.0.0',
    severity: 'medium',
    sections: {
      overview: 'An ops-plane SLO is approaching or has exhausted its error budget.',
      symptoms: 'SLO burn rate elevated. Error budget below 20%.',
      diagnosis:
        '1. Identify which SLO is affected\n2. Review recent changes\n3. Check for correlated issues',
      remediation:
        '1. Address root cause of elevated errors\n2. Consider temporary traffic reduction\n3. Plan capacity increase if needed',
      escalation: 'If budget exhausted, notify ops-lead for priority escalation.',
    },
    links: [
      {
        type: 'dashboard',
        id: 'OPS-SLO-OVERVIEW',
        url: '/dashboards/slo',
        description: 'SLO overview dashboard',
      },
    ],
    steps: [
      {
        order: 1,
        action: 'Review SLO dashboard',
        expectedOutcome: 'Identify affected SLO',
        automatable: true,
      },
      {
        order: 2,
        action: 'Correlate with recent deployments',
        expectedOutcome: 'Find potential cause',
        automatable: true,
      },
      {
        order: 3,
        action: 'Implement remediation',
        expectedOutcome: 'Error rate decreases',
        automatable: false,
      },
    ],
    policyRefs: ['POLICY-OPS-SLO'],
    lastUpdated: '2026-02-01T00:00:00Z',
  },
  {
    id: 'RB-OPS-004',
    title: 'Rollout Canary Degradation',
    version: '1.0.0',
    severity: 'low',
    sections: {
      overview: 'Canary deployment showing elevated error rates.',
      symptoms: 'Canary metrics diverge from baseline. Error rate > rollback threshold.',
      diagnosis:
        '1. Compare canary vs baseline metrics\n2. Check for feature flag issues\n3. Review recent changes',
      remediation:
        '1. Halt canary progression\n2. Rollback if threshold exceeded\n3. Investigate and fix',
      escalation: 'If automated rollback fails, page oncall.',
    },
    links: [
      {
        type: 'dashboard',
        id: 'OPS-CANARY',
        url: '/dashboards/canary',
        description: 'Canary metrics dashboard',
      },
    ],
    steps: [
      {
        order: 1,
        action: 'Review canary metrics',
        expectedOutcome: 'Identify degradation',
        automatable: true,
      },
      {
        order: 2,
        action: 'Halt canary if needed',
        expectedOutcome: 'Progression stopped',
        automatable: true,
      },
      {
        order: 3,
        action: 'Rollback if threshold exceeded',
        expectedOutcome: 'Canary removed',
        automatable: true,
      },
    ],
    policyRefs: ['POLICY-OPS-ROLLOUT'],
    lastUpdated: '2026-02-01T00:00:00Z',
  },
];

const POLICY_REFERENCES: readonly PolicyReference[] = [
  { id: 'POLICY-OPS-NOTIFY', severity: 'critical', requiredRunbookId: 'RB-OPS-001' },
  { id: 'POLICY-OPS-AUDIT', severity: 'high', requiredRunbookId: 'RB-OPS-002' },
  { id: 'POLICY-OPS-SLO', severity: 'medium', requiredRunbookId: 'RB-OPS-003' },
  { id: 'POLICY-OPS-ROLLOUT', severity: 'low', requiredRunbookId: 'RB-OPS-004' },
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Validate required sections are present.
 */
function validateRequiredSections(runbook: Runbook): readonly RunbookSection[] {
  const missing: RunbookSection[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!runbook.sections[section] || runbook.sections[section]!.trim() === '') {
      missing.push(section);
    }
  }

  return missing;
}

/**
 * Validate links are well-formed.
 */
function validateLinks(runbook: Runbook): readonly string[] {
  const invalid: string[] = [];

  for (const link of runbook.links) {
    if (!link.id || link.id.trim() === '') {
      invalid.push(`Link missing ID: ${link.description}`);
    }
    if (!link.url || !link.url.startsWith('/')) {
      invalid.push(`Invalid URL for ${link.id}: ${link.url}`);
    }
    if (!link.description || link.description.trim() === '') {
      invalid.push(`Link ${link.id} missing description`);
    }
  }

  // Check for required link types based on sections
  if (runbook.sections.dashboards && !runbook.links.some(l => l.type === 'dashboard')) {
    invalid.push('Dashboards section exists but no dashboard links provided');
  }
  if (runbook.sections.related_alerts && !runbook.links.some(l => l.type === 'alert')) {
    invalid.push('Related alerts section exists but no alert links provided');
  }

  return invalid;
}

/**
 * Validate policy references match.
 */
function validatePolicyRefs(
  runbook: Runbook,
  policies: readonly PolicyReference[]
): readonly string[] {
  const mismatches: string[] = [];

  // Check runbook references policies correctly
  for (const ref of runbook.policyRefs) {
    const policy = policies.find(p => p.id === ref);
    if (policy && policy.requiredRunbookId !== runbook.id) {
      mismatches.push(
        `Policy ${ref} requires runbook ${policy.requiredRunbookId}, not ${runbook.id}`
      );
    }
  }

  // Check policies that should reference this runbook
  const shouldReference = policies.filter(p => p.requiredRunbookId === runbook.id);
  for (const policy of shouldReference) {
    if (!runbook.policyRefs.includes(policy.id)) {
      mismatches.push(`Runbook ${runbook.id} should reference policy ${policy.id}`);
    }
  }

  return mismatches;
}

/**
 * Validate runbook steps.
 */
function validateSteps(runbook: Runbook): readonly string[] {
  const warnings: string[] = [];

  if (runbook.steps.length === 0) {
    warnings.push('No remediation steps defined');
    return warnings;
  }

  // Check step ordering
  const orders = runbook.steps.map(s => s.order);
  for (let i = 1; i < orders.length; i++) {
    if (orders[i] <= orders[i - 1]) {
      warnings.push(`Steps not in sequential order: ${orders[i - 1]} -> ${orders[i]}`);
    }
  }

  // Check for expected outcomes
  for (const step of runbook.steps) {
    if (!step.expectedOutcome || step.expectedOutcome.trim() === '') {
      warnings.push(`Step ${step.order} missing expected outcome`);
    }
  }

  // Check critical runbooks have rollback actions
  if (runbook.severity === 'critical') {
    const hasRollback = runbook.steps.some(s => s.rollbackAction);
    if (!hasRollback) {
      warnings.push('Critical runbook should have at least one rollback action');
    }
  }

  return warnings;
}

/**
 * Full runbook validation.
 */
function validateRunbook(
  runbook: Runbook,
  policies: readonly PolicyReference[]
): RunbookValidationResult {
  const missingSections = validateRequiredSections(runbook);
  const invalidLinks = validateLinks(runbook);
  const policyMismatches = validatePolicyRefs(runbook, policies);
  const stepWarnings = validateSteps(runbook);

  const warnings: string[] = [...stepWarnings];

  // Check for recommended sections
  for (const section of RECOMMENDED_SECTIONS) {
    if (!runbook.sections[section]) {
      warnings.push(`Recommended section '${section}' is missing`);
    }
  }

  return {
    runbookId: runbook.id,
    valid:
      missingSections.length === 0 && invalidLinks.length === 0 && policyMismatches.length === 0,
    missingSections,
    invalidLinks,
    policyMismatches,
    warnings,
  };
}

/**
 * Get runbook by severity.
 */
function getRunbooksBySeverity(
  runbooks: readonly Runbook[],
  severity: 'critical' | 'high' | 'medium' | 'low'
): readonly Runbook[] {
  return runbooks.filter(r => r.severity === severity);
}

/**
 * Check all severities have runbooks.
 */
function checkSeverityCoverage(runbooks: readonly Runbook[]): Record<string, boolean> {
  const severities = ['critical', 'high', 'medium', 'low'] as const;
  const coverage: Record<string, boolean> = {};

  for (const sev of severities) {
    coverage[sev] = runbooks.some(r => r.severity === sev);
  }

  return coverage;
}

// ============================================================================
// Contract: required_sections_present
// ============================================================================

describe('Runbooks Ops-Plane Structure Contract', () => {
  describe('required_sections_present', () => {
    it('should have all required sections in each runbook', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        const missing = validateRequiredSections(runbook);
        assert.strictEqual(
          missing.length,
          0,
          `Runbook ${runbook.id} missing sections: ${missing.join(', ')}`
        );
      }
    });

    it('should define required sections list', () => {
      assert.ok(REQUIRED_SECTIONS.includes('overview'));
      assert.ok(REQUIRED_SECTIONS.includes('symptoms'));
      assert.ok(REQUIRED_SECTIONS.includes('diagnosis'));
      assert.ok(REQUIRED_SECTIONS.includes('remediation'));
      assert.ok(REQUIRED_SECTIONS.includes('escalation'));
    });

    it('should fail validation for incomplete runbook', () => {
      const incomplete: Runbook = {
        id: 'RB-INCOMPLETE',
        title: 'Incomplete',
        version: '1.0.0',
        severity: 'low',
        sections: { overview: 'Test' },
        links: [],
        steps: [],
        policyRefs: [],
        lastUpdated: '2026-01-01T00:00:00Z',
      };

      const missing = validateRequiredSections(incomplete);
      assert.ok(missing.length > 0);
      assert.ok(missing.includes('symptoms'));
    });

    it('should not require empty strings as valid content', () => {
      const emptyContent: Runbook = {
        id: 'RB-EMPTY',
        title: 'Empty',
        version: '1.0.0',
        severity: 'low',
        sections: {
          overview: '',
          symptoms: '  ',
          diagnosis: '\n',
          remediation: 'valid',
          escalation: 'valid',
        },
        links: [],
        steps: [],
        policyRefs: [],
        lastUpdated: '2026-01-01T00:00:00Z',
      };

      const missing = validateRequiredSections(emptyContent);
      assert.ok(missing.includes('overview'));
      assert.ok(missing.includes('symptoms'));
      assert.ok(missing.includes('diagnosis'));
    });
  });

  // ============================================================================
  // Contract: links_are_present_and_well_formed
  // ============================================================================

  describe('links_are_present_and_well_formed', () => {
    it('should have valid links in all runbooks', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        const invalid = validateLinks(runbook);
        assert.strictEqual(
          invalid.length,
          0,
          `Runbook ${runbook.id} has invalid links: ${invalid.join(', ')}`
        );
      }
    });

    it('should require dashboard links when dashboard section exists', () => {
      const noDashboardLinks: Runbook = {
        ...SAMPLE_RUNBOOKS[0],
        id: 'RB-NO-DASH',
        links: [],
      };

      const invalid = validateLinks(noDashboardLinks);
      assert.ok(invalid.some(i => i.includes('dashboard')));
    });

    it('should validate link URL format', () => {
      const badUrl: Runbook = {
        ...SAMPLE_RUNBOOKS[0],
        id: 'RB-BAD-URL',
        links: [{ type: 'dashboard', id: 'TEST', url: 'not-a-path', description: 'Test' }],
      };

      const invalid = validateLinks(badUrl);
      assert.ok(invalid.some(i => i.includes('Invalid URL')));
    });

    it('should require link descriptions', () => {
      const noDesc: Runbook = {
        ...SAMPLE_RUNBOOKS[0],
        id: 'RB-NO-DESC',
        links: [{ type: 'dashboard', id: 'TEST', url: '/test', description: '' }],
      };

      const invalid = validateLinks(noDesc);
      assert.ok(invalid.some(i => i.includes('missing description')));
    });
  });

  // ============================================================================
  // Contract: runbook_refs_match_policy_ids
  // ============================================================================

  describe('runbook_refs_match_policy_ids', () => {
    it('should have matching policy references', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        const mismatches = validatePolicyRefs(runbook, POLICY_REFERENCES);
        assert.strictEqual(
          mismatches.length,
          0,
          `Runbook ${runbook.id} has policy mismatches: ${mismatches.join(', ')}`
        );
      }
    });

    it('should detect missing policy reference', () => {
      const missingRef: Runbook = {
        ...SAMPLE_RUNBOOKS[0],
        id: 'RB-OPS-001',
        policyRefs: [], // Should reference POLICY-OPS-NOTIFY
      };

      const mismatches = validatePolicyRefs(missingRef, POLICY_REFERENCES);
      assert.ok(mismatches.length > 0);
    });

    it('should detect incorrect policy-runbook mapping', () => {
      const wrongMapping: Runbook = {
        ...SAMPLE_RUNBOOKS[0],
        id: 'RB-WRONG',
        policyRefs: ['POLICY-OPS-NOTIFY'], // But POLICY-OPS-NOTIFY requires RB-OPS-001
      };

      const mismatches = validatePolicyRefs(wrongMapping, POLICY_REFERENCES);
      assert.ok(mismatches.some(m => m.includes('requires runbook')));
    });
  });

  // ============================================================================
  // Contract: severity_specific_playbooks
  // ============================================================================

  describe('severity_specific_playbooks', () => {
    it('should have runbook for each severity level', () => {
      const coverage = checkSeverityCoverage(SAMPLE_RUNBOOKS);

      assert.ok(coverage.critical, 'Missing critical runbook');
      assert.ok(coverage.high, 'Missing high runbook');
      assert.ok(coverage.medium, 'Missing medium runbook');
      assert.ok(coverage.low, 'Missing low runbook');
    });

    it('should have at least one critical runbook', () => {
      const critical = getRunbooksBySeverity(SAMPLE_RUNBOOKS, 'critical');
      assert.ok(critical.length >= 1);
    });

    it('should have more detailed steps for higher severity', () => {
      const critical = getRunbooksBySeverity(SAMPLE_RUNBOOKS, 'critical')[0];
      const low = getRunbooksBySeverity(SAMPLE_RUNBOOKS, 'low')[0];

      // Critical should have at least as many steps as low
      assert.ok(critical.steps.length >= low.steps.length);
    });

    it('should require rollback actions for critical runbooks', () => {
      const critical = getRunbooksBySeverity(SAMPLE_RUNBOOKS, 'critical');

      for (const runbook of critical) {
        const warnings = validateSteps(runbook);
        // Should either have rollback or get a warning
        const hasRollback = runbook.steps.some(s => s.rollbackAction);
        if (!hasRollback) {
          assert.ok(warnings.some(w => w.includes('rollback')));
        }
      }
    });
  });

  // ============================================================================
  // Contract: actionable_steps_defined
  // ============================================================================

  describe('actionable_steps_defined', () => {
    it('should have steps in all runbooks', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        assert.ok(runbook.steps.length > 0, `Runbook ${runbook.id} has no steps`);
      }
    });

    it('should have sequential step ordering', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        const warnings = validateSteps(runbook);
        assert.ok(
          !warnings.some(w => w.includes('sequential order')),
          `Runbook ${runbook.id} has out-of-order steps`
        );
      }
    });

    it('should have expected outcomes for all steps', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        for (const step of runbook.steps) {
          assert.ok(
            step.expectedOutcome,
            `Step ${step.order} in ${runbook.id} missing expected outcome`
          );
        }
      }
    });

    it('should mark automatable steps correctly', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        for (const step of runbook.steps) {
          assert.ok(typeof step.automatable === 'boolean');
        }
      }
    });

    it('should pass full validation for all sample runbooks', () => {
      for (const runbook of SAMPLE_RUNBOOKS) {
        const result = validateRunbook(runbook, POLICY_REFERENCES);
        assert.ok(
          result.valid,
          `Runbook ${runbook.id} failed validation: missing=${result.missingSections.join(',')}, invalid=${result.invalidLinks.join(',')}, mismatches=${result.policyMismatches.join(',')}`
        );
      }
    });
  });
});

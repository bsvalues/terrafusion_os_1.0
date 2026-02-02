/**
 * Operator Sign-off Contract Tests
 * ==================================
 *
 * Phase IVb: Validates operator sign-off report generation and approval.
 *
 * Contract:
 * - report_is_pii_clean_and_bounded: no raw identifiers, size limits
 * - includes_evidence_summary_targets_vs_observed: clear metrics comparison
 * - includes_recommendation_and_risk_notes: actionable guidance
 * - includes_actionable_links_and_policy_refs: complete context
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Operator Sign-off
// ============================================================================

/**
 * Sign-off report.
 */
interface SignoffReport {
  readonly id: string;
  readonly generatedAt: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly currentStage: string;
  readonly proposedStage: string;
  readonly evidenceSummary: EvidenceSummary;
  readonly riskAssessment: RiskAssessment;
  readonly recommendation: Recommendation;
  readonly links: readonly ActionableLink[];
  readonly policyRefs: readonly PolicyReference[];
  readonly metadata: ReportMetadata;
}

/**
 * Evidence summary.
 */
interface EvidenceSummary {
  readonly observationWindow: {
    readonly startDate: string;
    readonly endDate: string;
    readonly effectiveDays: number;
    readonly sampleCount: number;
  };
  readonly sloMetrics: readonly SLOMetricSummary[];
  readonly integrityStatus: {
    readonly lastCheckAt: string;
    readonly passed: boolean;
    readonly consecutiveSuccesses: number;
  };
  readonly incidentHistory: {
    readonly count: number;
    readonly lastIncidentAt?: string;
    readonly meanTimeToResolve?: number;
  };
}

/**
 * SLO metric summary.
 */
interface SLOMetricSummary {
  readonly name: string;
  readonly target: number;
  readonly observed: number;
  readonly met: boolean;
  readonly trend: 'improving' | 'stable' | 'degrading';
  readonly confidenceInterval: { low: number; high: number };
}

/**
 * Risk assessment.
 */
interface RiskAssessment {
  readonly overallRisk: 'low' | 'medium' | 'high' | 'critical';
  readonly riskFactors: readonly RiskFactor[];
  readonly mitigations: readonly string[];
}

/**
 * Risk factor.
 */
interface RiskFactor {
  readonly category: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly likelihood: 'unlikely' | 'possible' | 'likely';
}

/**
 * Recommendation.
 */
interface Recommendation {
  readonly action: 'approve' | 'defer' | 'reject';
  readonly confidence: number;
  readonly rationale: string;
  readonly conditions?: readonly string[];
  readonly deferUntil?: string;
}

/**
 * Actionable link.
 */
interface ActionableLink {
  readonly type: 'dashboard' | 'runbook' | 'alert' | 'documentation';
  readonly label: string;
  readonly url: string;
  readonly description: string;
}

/**
 * Policy reference.
 */
interface PolicyReference {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly lastUpdated: string;
}

/**
 * Report metadata.
 */
interface ReportMetadata {
  readonly version: string;
  readonly generator: string;
  readonly sizeBytes: number;
  readonly checksumSha256: string;
}

/**
 * Operator approval.
 */
interface OperatorApproval {
  readonly reportId: string;
  readonly operatorId: string; // PII-clean: sha256 hash only
  readonly decision: 'approved' | 'rejected' | 'deferred';
  readonly timestamp: string;
  readonly notes?: string;
  readonly conditions?: readonly string[];
}

/**
 * PII check result.
 */
interface PIICheckResult {
  readonly clean: boolean;
  readonly violations: readonly PIIViolation[];
}

/**
 * PII violation.
 */
interface PIIViolation {
  readonly field: string;
  readonly pattern: string;
  readonly description: string;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_REPORT_SIZE_BYTES = 1024 * 1024; // 1MB
const PII_PATTERNS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, description: 'SSN pattern' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, description: 'Email address' },
  { pattern: /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/, description: 'Phone number' },
  { pattern: /\b(?:user|operator|admin)_\d+\b/i, description: 'Raw user ID' },
];

const REQUIRED_LINKS = ['dashboard', 'runbook'] as const;
const REQUIRED_POLICY_REFS = ['POLICY-OPS-ROLLOUT', 'POLICY-OPS-SLO'] as const;

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Check for PII in string content.
 */
function checkPII(content: string): PIICheckResult {
  const violations: PIIViolation[] = [];

  for (const { pattern, description } of PII_PATTERNS) {
    if (pattern.test(content)) {
      violations.push({
        field: 'content',
        pattern: pattern.toString(),
        description,
      });
    }
  }

  return { clean: violations.length === 0, violations };
}

/**
 * Check report for PII.
 */
function checkReportPII(report: SignoffReport): PIICheckResult {
  const allViolations: PIIViolation[] = [];
  const contentToCheck = JSON.stringify(report);

  const result = checkPII(contentToCheck);
  allViolations.push(...result.violations);

  return { clean: allViolations.length === 0, violations: allViolations };
}

/**
 * Validate report size.
 */
function validateReportSize(report: SignoffReport): { valid: boolean; actualBytes: number } {
  const sizeBytes = JSON.stringify(report).length;
  return { valid: sizeBytes <= MAX_REPORT_SIZE_BYTES, actualBytes: sizeBytes };
}

/**
 * Check evidence summary completeness.
 */
function checkEvidenceSummary(summary: EvidenceSummary): { complete: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!summary.observationWindow.startDate) missing.push('observationWindow.startDate');
  if (!summary.observationWindow.endDate) missing.push('observationWindow.endDate');
  if (summary.observationWindow.effectiveDays <= 0) missing.push('observationWindow.effectiveDays');
  if (summary.sloMetrics.length === 0) missing.push('sloMetrics');
  if (!summary.integrityStatus.lastCheckAt) missing.push('integrityStatus.lastCheckAt');

  return { complete: missing.length === 0, missing };
}

/**
 * Validate SLO metric summary.
 */
function validateSLOMetrics(metrics: readonly SLOMetricSummary[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (const metric of metrics) {
    if (metric.target <= 0 || metric.target > 1) {
      issues.push(`${metric.name}: invalid target ${metric.target}`);
    }
    if (metric.observed < 0 || metric.observed > 1) {
      issues.push(`${metric.name}: invalid observed ${metric.observed}`);
    }
    if (metric.confidenceInterval.low > metric.confidenceInterval.high) {
      issues.push(`${metric.name}: invalid confidence interval`);
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Check required links present.
 */
function checkRequiredLinks(links: readonly ActionableLink[]): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  const presentTypes = new Set(links.map(l => l.type));

  for (const required of REQUIRED_LINKS) {
    if (!presentTypes.has(required)) {
      missing.push(required);
    }
  }

  // Validate URLs
  for (const link of links) {
    if (!link.url || !link.url.startsWith('/')) {
      missing.push(`${link.type}: invalid URL`);
    }
  }

  return { complete: missing.length === 0, missing };
}

/**
 * Check required policy refs.
 */
function checkRequiredPolicyRefs(refs: readonly PolicyReference[]): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  const presentIds = new Set(refs.map(r => r.id));

  for (const required of REQUIRED_POLICY_REFS) {
    if (!presentIds.has(required)) {
      missing.push(required);
    }
  }

  return { complete: missing.length === 0, missing };
}

/**
 * Validate recommendation.
 */
function validateRecommendation(rec: Recommendation): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!['approve', 'defer', 'reject'].includes(rec.action)) {
    issues.push('Invalid action');
  }
  if (rec.confidence < 0 || rec.confidence > 1) {
    issues.push('Invalid confidence');
  }
  if (!rec.rationale || rec.rationale.trim().length < 10) {
    issues.push('Rationale too short or missing');
  }
  if (rec.action === 'defer' && !rec.deferUntil) {
    issues.push('Defer action requires deferUntil date');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Generate sample report.
 */
function generateSampleReport(
  options: Partial<{
    piiClean: boolean;
    includeLinks: boolean;
    includePolicyRefs: boolean;
    sizeMultiplier: number;
  }>
): SignoffReport {
  const {
    piiClean = true,
    includeLinks = true,
    includePolicyRefs = true,
    sizeMultiplier = 1,
  } = options;

  const baseReport: SignoffReport = {
    id: `signoff-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    environment: 'staging',
    currentStage: 'ticket_on_high',
    proposedStage: 'page_on_critical',
    evidenceSummary: {
      observationWindow: {
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        effectiveDays: 10,
        sampleCount: 500,
      },
      sloMetrics: [
        {
          name: 'notification_success',
          target: 0.99,
          observed: 0.995,
          met: true,
          trend: 'stable',
          confidenceInterval: { low: 0.99, high: 0.998 },
        },
        {
          name: 'audit_drain_p95',
          target: 0.95, // Expressed as fraction of 5s target
          observed: 0.4, // 2s / 5s
          met: true,
          trend: 'improving',
          confidenceInterval: { low: 0.35, high: 0.45 },
        },
      ],
      integrityStatus: {
        lastCheckAt: new Date().toISOString(),
        passed: true,
        consecutiveSuccesses: 50,
      },
      incidentHistory: {
        count: 0,
        lastIncidentAt: undefined,
        meanTimeToResolve: undefined,
      },
    },
    riskAssessment: {
      overallRisk: 'low',
      riskFactors: [
        {
          category: 'operational',
          description: 'First production paging enablement',
          severity: 'medium',
          likelihood: 'possible',
        },
      ],
      mitigations: [
        'Rollback procedure tested and documented',
        'Oncall rotation verified',
        'Quiet hours configured',
      ],
    },
    recommendation: {
      action: 'approve',
      confidence: 0.95,
      rationale:
        'All SLO targets met with high confidence. Observation window sufficient. No recent incidents.',
      conditions: ['Monitor closely for first 24 hours'],
    },
    links: includeLinks
      ? [
          {
            type: 'dashboard',
            label: 'SLO Dashboard',
            url: '/dashboards/slo',
            description: 'Live SLO metrics',
          },
          {
            type: 'runbook',
            label: 'Rollout Runbook',
            url: '/runbooks/rollout',
            description: 'Rollout procedures',
          },
        ]
      : [],
    policyRefs: includePolicyRefs
      ? [
          {
            id: 'POLICY-OPS-ROLLOUT',
            name: 'Rollout Policy',
            version: '1.0.0',
            lastUpdated: '2026-01-01',
          },
          { id: 'POLICY-OPS-SLO', name: 'SLO Policy', version: '1.0.0', lastUpdated: '2026-01-01' },
        ]
      : [],
    metadata: {
      version: '1.0.0',
      generator: 'terrafusion-signoff-generator',
      sizeBytes: 0,
      checksumSha256: 'sha256:placeholder',
    },
  };

  // Add PII if not clean (for testing)
  if (!piiClean) {
    // @ts-expect-error - Intentionally adding PII for test
    baseReport.evidenceSummary._testPII = 'test@example.com';
  }

  // Inflate size if needed (for testing)
  if (sizeMultiplier > 1) {
    // @ts-expect-error - Intentionally adding padding for size test
    baseReport._padding = 'x'.repeat(MAX_REPORT_SIZE_BYTES * sizeMultiplier);
  }

  return baseReport;
}

/**
 * Validate operator ID is PII-clean (sha256 hash).
 */
function validateOperatorId(operatorId: string): boolean {
  return operatorId.startsWith('sha256:') && operatorId.length === 71; // sha256: + 64 hex chars
}

// ============================================================================
// Contract: report_is_pii_clean_and_bounded
// ============================================================================

describe('Operator Sign-off Contract', () => {
  describe('report_is_pii_clean_and_bounded', () => {
    it('should generate PII-clean report', () => {
      const report = generateSampleReport({ piiClean: true });
      const result = checkReportPII(report);

      assert.ok(
        result.clean,
        `PII violations: ${result.violations.map(v => v.description).join(', ')}`
      );
    });

    it('should detect PII in report', () => {
      const report = generateSampleReport({ piiClean: false });
      const result = checkReportPII(report);

      assert.ok(!result.clean);
      assert.ok(result.violations.length > 0);
    });

    it('should enforce report size limit', () => {
      const report = generateSampleReport({ sizeMultiplier: 2 });
      const result = validateReportSize(report);

      assert.ok(!result.valid);
      assert.ok(result.actualBytes > MAX_REPORT_SIZE_BYTES);
    });

    it('should accept report within size limit', () => {
      const report = generateSampleReport({});
      const result = validateReportSize(report);

      assert.ok(result.valid);
    });

    it('should require sha256 prefix for operator IDs', () => {
      assert.ok(
        validateOperatorId(
          'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
        )
      );
      assert.ok(!validateOperatorId('user_12345'));
      assert.ok(!validateOperatorId('john.doe@example.com'));
    });
  });

  // ============================================================================
  // Contract: includes_evidence_summary_targets_vs_observed
  // ============================================================================

  describe('includes_evidence_summary_targets_vs_observed', () => {
    it('should include observation window details', () => {
      const report = generateSampleReport({});
      const result = checkEvidenceSummary(report.evidenceSummary);

      assert.ok(result.complete, `Missing: ${result.missing.join(', ')}`);
    });

    it('should include SLO metrics with target vs observed', () => {
      const report = generateSampleReport({});

      for (const metric of report.evidenceSummary.sloMetrics) {
        assert.ok(typeof metric.target === 'number');
        assert.ok(typeof metric.observed === 'number');
        assert.ok(typeof metric.met === 'boolean');
      }
    });

    it('should validate SLO metrics', () => {
      const report = generateSampleReport({});
      const result = validateSLOMetrics(report.evidenceSummary.sloMetrics);

      assert.ok(result.valid, `Issues: ${result.issues.join(', ')}`);
    });

    it('should include confidence intervals', () => {
      const report = generateSampleReport({});

      for (const metric of report.evidenceSummary.sloMetrics) {
        assert.ok(metric.confidenceInterval);
        assert.ok(metric.confidenceInterval.low <= metric.confidenceInterval.high);
      }
    });

    it('should include trend information', () => {
      const report = generateSampleReport({});

      for (const metric of report.evidenceSummary.sloMetrics) {
        assert.ok(['improving', 'stable', 'degrading'].includes(metric.trend));
      }
    });
  });

  // ============================================================================
  // Contract: includes_recommendation_and_risk_notes
  // ============================================================================

  describe('includes_recommendation_and_risk_notes', () => {
    it('should include recommendation with action', () => {
      const report = generateSampleReport({});

      assert.ok(['approve', 'defer', 'reject'].includes(report.recommendation.action));
    });

    it('should validate recommendation', () => {
      const report = generateSampleReport({});
      const result = validateRecommendation(report.recommendation);

      assert.ok(result.valid, `Issues: ${result.issues.join(', ')}`);
    });

    it('should include risk assessment', () => {
      const report = generateSampleReport({});

      assert.ok(['low', 'medium', 'high', 'critical'].includes(report.riskAssessment.overallRisk));
      assert.ok(report.riskAssessment.riskFactors.length >= 0);
    });

    it('should include mitigations for identified risks', () => {
      const report = generateSampleReport({});

      if (report.riskAssessment.riskFactors.length > 0) {
        assert.ok(report.riskAssessment.mitigations.length > 0);
      }
    });

    it('should require deferUntil for defer action', () => {
      const deferRec: Recommendation = {
        action: 'defer',
        confidence: 0.8,
        rationale: 'Need more observation time before proceeding',
        // Missing deferUntil
      };

      const result = validateRecommendation(deferRec);
      assert.ok(!result.valid);
      assert.ok(result.issues.some(i => i.includes('deferUntil')));
    });
  });

  // ============================================================================
  // Contract: includes_actionable_links_and_policy_refs
  // ============================================================================

  describe('includes_actionable_links_and_policy_refs', () => {
    it('should include required link types', () => {
      const report = generateSampleReport({ includeLinks: true });
      const result = checkRequiredLinks(report.links);

      assert.ok(result.complete, `Missing: ${result.missing.join(', ')}`);
    });

    it('should fail when required links missing', () => {
      const report = generateSampleReport({ includeLinks: false });
      const result = checkRequiredLinks(report.links);

      assert.ok(!result.complete);
    });

    it('should include required policy refs', () => {
      const report = generateSampleReport({ includePolicyRefs: true });
      const result = checkRequiredPolicyRefs(report.policyRefs);

      assert.ok(result.complete, `Missing: ${result.missing.join(', ')}`);
    });

    it('should fail when required policy refs missing', () => {
      const report = generateSampleReport({ includePolicyRefs: false });
      const result = checkRequiredPolicyRefs(report.policyRefs);

      assert.ok(!result.complete);
    });

    it('should have valid URLs for all links', () => {
      const report = generateSampleReport({ includeLinks: true });

      for (const link of report.links) {
        assert.ok(link.url.startsWith('/'), `Invalid URL: ${link.url}`);
        assert.ok(link.label.length > 0);
        assert.ok(link.description.length > 0);
      }
    });
  });
});

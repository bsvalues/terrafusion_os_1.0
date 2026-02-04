/**
 * Data Access Recommendations Contract Tests
 * ============================================
 *
 * Phase VIII: Validates suggestions-only remediation for data access.
 *
 * Contract:
 * - recommendations_are_suggestions_only: no auto-block, no auto-revoke
 * - recommendations_require_evidence: threshold-based, supporting data
 * - recommendations_link_to_runbooks: explicit references
 * - recommendations_are_prioritized: severity-ordered, impact-aware
 * - recommendations_are_pii_clean: opaque IDs
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Data Access Recommendations
// ============================================================================

/**
 * Dataset risk tier.
 */
type DatasetRiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Recommendation action type.
 */
type RecommendationAction =
  | 'tighten_export_policy'
  | 'narrow_dataset_binding'
  | 'add_approval_gate'
  | 'reduce_access_scope'
  | 'enable_audit_logging'
  | 'investigate_anomaly';

/**
 * Recommendation severity.
 */
type RecommendationSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Confidence level.
 */
type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Evidence item.
 */
interface EvidenceItem {
  readonly evidenceId: string; // opaque sha256:
  readonly category: string;
  readonly value: number | string;
  readonly weight: number; // 0-1
}

/**
 * Recommendation.
 */
interface DataAccessRecommendation {
  readonly recommendationId: string; // opaque sha256:
  readonly action: RecommendationAction;
  readonly targetId: string; // opaque sha256: (dataset, policy, etc.)
  readonly targetType: 'dataset' | 'policy' | 'principal' | 'export_path';
  readonly datasetRiskTier: DatasetRiskTier;
  readonly severity: RecommendationSeverity;
  readonly confidence: ConfidenceLevel;
  readonly autoApplicable: false; // INVARIANT
  readonly autoBlock: false; // INVARIANT
  readonly autoRevoke: false; // INVARIANT
  readonly requiresApproval: true; // INVARIANT
  readonly evidence: readonly EvidenceItem[];
  readonly runbookRef: string;
  readonly description: string;
  readonly impact: string;
  readonly createdAt: string;
}

/**
 * Recommendation engine.
 */
interface RecommendationEngine {
  generateRecommendation: (
    action: RecommendationAction,
    targetId: string,
    evidence: readonly EvidenceItem[],
    datasetRiskTier: DatasetRiskTier
  ) => DataAccessRecommendation;
  calculateConfidence: (evidence: readonly EvidenceItem[]) => ConfidenceLevel;
  prioritize: (
    recommendations: readonly DataAccessRecommendation[]
  ) => readonly DataAccessRecommendation[];
  validateRecommendation: (rec: DataAccessRecommendation) => { valid: boolean; errors: string[] };
}

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute opaque ID.
 */
function computeOpaqueId(input: string): string {
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

/**
 * Calculate confidence from evidence.
 */
function calculateConfidence(evidence: readonly EvidenceItem[]): ConfidenceLevel {
  if (evidence.length === 0) return 'low';

  const totalWeight = evidence.reduce((sum, e) => sum + e.weight, 0);
  const avgWeight = totalWeight / evidence.length;

  if (avgWeight >= 0.8 && evidence.length >= 3) return 'high';
  if (avgWeight >= 0.5 && evidence.length >= 2) return 'medium';
  return 'low';
}

/**
 * Determine severity from risk tier.
 */
function determineSeverity(datasetRiskTier: DatasetRiskTier): RecommendationSeverity {
  switch (datasetRiskTier) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
  }
}

/**
 * Get runbook ref for action.
 */
function getRunbookRef(action: RecommendationAction): string {
  const runbooks: Record<RecommendationAction, string> = {
    tighten_export_policy: 'runbooks/data/TIGHTEN_EXPORT_POLICY.md',
    narrow_dataset_binding: 'runbooks/data/NARROW_DATASET_BINDING.md',
    add_approval_gate: 'runbooks/data/ADD_APPROVAL_GATE.md',
    reduce_access_scope: 'runbooks/data/REDUCE_ACCESS_SCOPE.md',
    enable_audit_logging: 'runbooks/data/ENABLE_AUDIT_LOGGING.md',
    investigate_anomaly: 'runbooks/data/INVESTIGATE_ANOMALY.md',
  };
  return runbooks[action];
}

/**
 * Create recommendation engine.
 */
function createRecommendationEngine(): RecommendationEngine {
  return {
    generateRecommendation(action, targetId, evidence, datasetRiskTier) {
      return {
        recommendationId: computeOpaqueId(`rec-${action}-${targetId}-${Date.now()}`),
        action,
        targetId,
        targetType: 'dataset',
        datasetRiskTier,
        severity: determineSeverity(datasetRiskTier),
        confidence: calculateConfidence(evidence),
        autoApplicable: false,
        autoBlock: false,
        autoRevoke: false,
        requiresApproval: true,
        evidence,
        runbookRef: getRunbookRef(action),
        description: `${action.replace(/_/g, ' ')} for ${datasetRiskTier}-risk target`,
        impact: `Reduces exposure for ${datasetRiskTier} risk dataset`,
        createdAt: new Date().toISOString(),
      };
    },

    calculateConfidence,

    prioritize(recommendations) {
      const severityOrder: Record<RecommendationSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      return [...recommendations].sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );
    },

    validateRecommendation(rec) {
      const errors: string[] = [];

      // INVARIANT checks
      if (rec.autoApplicable !== false) {
        errors.push('autoApplicable must be false');
      }
      if (rec.autoBlock !== false) {
        errors.push('autoBlock must be false');
      }
      if (rec.autoRevoke !== false) {
        errors.push('autoRevoke must be false');
      }
      if (rec.requiresApproval !== true) {
        errors.push('requiresApproval must be true');
      }

      // Evidence requirement
      if (rec.evidence.length === 0) {
        errors.push('At least one evidence item required');
      }

      // Runbook requirement
      if (!rec.runbookRef || rec.runbookRef.length === 0) {
        errors.push('Runbook reference required');
      }

      return { valid: errors.length === 0, errors };
    },
  };
}

/**
 * Create sample evidence item.
 */
function createSampleEvidence(options: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    evidenceId: options.evidenceId ?? computeOpaqueId(`evidence-${Date.now()}`),
    category: options.category ?? 'anomaly_detection',
    value: options.value ?? 'volume_spike',
    weight: options.weight ?? 0.8,
  };
}

// ============================================================================
// Contract: recommendations_are_suggestions_only
// ============================================================================

describe('Data Access Recommendations Contract', () => {
  describe('recommendations_are_suggestions_only', () => {
    it('should have autoApplicable=false', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.strictEqual(rec.autoApplicable, false);
    });

    it('should have autoBlock=false', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'critical'
      );

      assert.strictEqual(rec.autoBlock, false);
    });

    it('should have autoRevoke=false', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'narrow_dataset_binding',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.strictEqual(rec.autoRevoke, false);
    });

    it('should require approval', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'add_approval_gate',
        computeOpaqueId('ds1'),
        evidence,
        'medium'
      );

      assert.strictEqual(rec.requiresApproval, true);
    });

    it('should fail validation if invariants violated', () => {
      const engine = createRecommendationEngine();
      const badRec = {
        recommendationId: computeOpaqueId('bad-rec'),
        action: 'tighten_export_policy' as RecommendationAction,
        targetId: computeOpaqueId('ds1'),
        targetType: 'dataset' as const,
        datasetRiskTier: 'high' as DatasetRiskTier,
        severity: 'high' as RecommendationSeverity,
        confidence: 'high' as ConfidenceLevel,
        autoApplicable: true as unknown as false, // VIOLATES invariant
        autoBlock: false as const,
        autoRevoke: false as const,
        requiresApproval: true as const,
        evidence: [createSampleEvidence()],
        runbookRef: 'runbook.md',
        description: 'test',
        impact: 'test',
        createdAt: new Date().toISOString(),
      };

      const result = engine.validateRecommendation(badRec);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('autoApplicable')));
    });
  });

  // ============================================================================
  // Contract: recommendations_require_evidence
  // ============================================================================

  describe('recommendations_require_evidence', () => {
    it('should include evidence items', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence(), createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'investigate_anomaly',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.strictEqual(rec.evidence.length, 2);
    });

    it('should calculate confidence from evidence', () => {
      const engine = createRecommendationEngine();

      const lowEvidence = [createSampleEvidence({ weight: 0.3 })];
      const highEvidence = [
        createSampleEvidence({ weight: 0.9 }),
        createSampleEvidence({ weight: 0.85 }),
        createSampleEvidence({ weight: 0.8 }),
      ];

      assert.strictEqual(engine.calculateConfidence(lowEvidence), 'low');
      assert.strictEqual(engine.calculateConfidence(highEvidence), 'high');
    });

    it('should fail validation without evidence', () => {
      const engine = createRecommendationEngine();
      const rec = engine.generateRecommendation(
        'reduce_access_scope',
        computeOpaqueId('ds1'),
        [],
        'medium'
      );

      const result = engine.validateRecommendation(rec);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('evidence')));
    });

    it('should include evidence weight', () => {
      const evidence = createSampleEvidence({ weight: 0.75 });

      assert.strictEqual(evidence.weight, 0.75);
    });
  });

  // ============================================================================
  // Contract: recommendations_link_to_runbooks
  // ============================================================================

  describe('recommendations_link_to_runbooks', () => {
    it('should include runbook reference', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.ok(rec.runbookRef);
      assert.ok(rec.runbookRef.includes('runbooks/'));
    });

    it('should fail validation without runbook', () => {
      const engine = createRecommendationEngine();
      const badRec = {
        recommendationId: computeOpaqueId('bad-rec'),
        action: 'tighten_export_policy' as RecommendationAction,
        targetId: computeOpaqueId('ds1'),
        targetType: 'dataset' as const,
        datasetRiskTier: 'high' as DatasetRiskTier,
        severity: 'high' as RecommendationSeverity,
        confidence: 'high' as ConfidenceLevel,
        autoApplicable: false as const,
        autoBlock: false as const,
        autoRevoke: false as const,
        requiresApproval: true as const,
        evidence: [createSampleEvidence()],
        runbookRef: '', // Empty runbook
        description: 'test',
        impact: 'test',
        createdAt: new Date().toISOString(),
      };

      const result = engine.validateRecommendation(badRec);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Runbook')));
    });

    it('should have action-specific runbooks', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];

      const rec1 = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );
      const rec2 = engine.generateRecommendation(
        'investigate_anomaly',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.notStrictEqual(rec1.runbookRef, rec2.runbookRef);
    });
  });

  // ============================================================================
  // Contract: recommendations_are_prioritized
  // ============================================================================

  describe('recommendations_are_prioritized', () => {
    it('should sort by severity', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];

      const recs = [
        engine.generateRecommendation(
          'tighten_export_policy',
          computeOpaqueId('ds1'),
          evidence,
          'low'
        ),
        engine.generateRecommendation(
          'tighten_export_policy',
          computeOpaqueId('ds2'),
          evidence,
          'critical'
        ),
        engine.generateRecommendation(
          'tighten_export_policy',
          computeOpaqueId('ds3'),
          evidence,
          'high'
        ),
      ];

      const prioritized = engine.prioritize(recs);

      assert.strictEqual(prioritized[0].severity, 'critical');
      assert.strictEqual(prioritized[1].severity, 'high');
      assert.strictEqual(prioritized[2].severity, 'low');
    });

    it('should set severity based on dataset risk tier', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];

      const critical = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'critical'
      );
      const low = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds2'),
        evidence,
        'low'
      );

      assert.strictEqual(critical.severity, 'critical');
      assert.strictEqual(low.severity, 'low');
    });

    it('should include impact assessment', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'reduce_access_scope',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.ok(rec.impact);
      assert.ok(rec.impact.length > 0);
    });
  });

  // ============================================================================
  // Contract: recommendations_are_pii_clean
  // ============================================================================

  describe('recommendations_are_pii_clean', () => {
    it('should use opaque recommendation ID', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.ok(rec.recommendationId.startsWith('sha256:'));
    });

    it('should use opaque target ID', () => {
      const engine = createRecommendationEngine();
      const targetId = computeOpaqueId('dataset-target');
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'narrow_dataset_binding',
        targetId,
        evidence,
        'high'
      );

      assert.ok(rec.targetId.startsWith('sha256:'));
    });

    it('should use opaque evidence IDs', () => {
      const evidence = createSampleEvidence();

      assert.ok(evidence.evidenceId.startsWith('sha256:'));
    });

    it('should not expose dataset names in description', () => {
      const engine = createRecommendationEngine();
      const evidence = [createSampleEvidence()];
      const rec = engine.generateRecommendation(
        'tighten_export_policy',
        computeOpaqueId('ds1'),
        evidence,
        'high'
      );

      assert.ok(!rec.description.includes('customer'));
      assert.ok(!rec.description.includes('users'));
    });
  });
});

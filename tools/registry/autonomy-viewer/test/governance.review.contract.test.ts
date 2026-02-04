/**
 * Control Effectiveness: Governance Review Contract Tests
 *
 * Phase XII - Quarterly governance review pack auto-generated
 * (maps controls → evidence → outcomes).
 *
 * CONTRACT SURFACE:
 * - Review Pack Generation: Automated quarterly review packs
 * - Control Evidence Mapping: Controls linked to evidence
 * - Outcome Tracking: Control effectiveness outcomes
 * - Executive Summary: High-level governance health
 *
 * INVARIANTS:
 * - Review packs are PII-clean (aggregate metrics only)
 * - All IDs are opaque sha256:
 * - Evidence is linked, not embedded
 * - Packs are time-bounded and reproducible
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ReviewPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type ControlCategory =
  | 'access'
  | 'change'
  | 'incident'
  | 'continuity'
  | 'compliance'
  | 'monitoring';
type OutcomeStatus = 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';
type EvidenceStatus = 'complete' | 'partial' | 'missing';

/**
 * Governance review pack
 */
interface GovernanceReviewPack {
  readonly pack_id: string;
  readonly period: ReviewPeriod;
  readonly year: number;
  readonly generated_at: string;
  readonly executive_summary: ExecutiveSummary;
  readonly control_sections: readonly ControlSection[];
  readonly evidence_summary: EvidenceSummary;
  readonly recommendations: readonly Recommendation[];
  readonly is_final: boolean;
}

/**
 * Executive summary
 */
interface ExecutiveSummary {
  readonly summary_id: string;
  readonly overall_health_score: number;
  readonly controls_tested: number;
  readonly controls_effective: number;
  readonly controls_with_findings: number;
  readonly critical_findings: number;
  readonly key_achievements: readonly string[];
  readonly key_risks: readonly string[];
}

/**
 * Control section
 */
interface ControlSection {
  readonly section_id: string;
  readonly category: ControlCategory;
  readonly controls: readonly ControlOutcome[];
  readonly section_score: number;
  readonly evidence_status: EvidenceStatus;
}

/**
 * Control outcome
 */
interface ControlOutcome {
  readonly control_id: string;
  readonly control_name: string;
  readonly status: OutcomeStatus;
  readonly evidence_refs: readonly string[];
  readonly test_count: number;
  readonly pass_count: number;
  readonly findings: readonly string[];
}

/**
 * Evidence summary
 */
interface EvidenceSummary {
  readonly summary_id: string;
  readonly total_evidence_items: number;
  readonly complete_items: number;
  readonly partial_items: number;
  readonly missing_items: number;
  readonly evidence_by_category: Record<string, number>;
  readonly retention_compliant: boolean;
}

/**
 * Recommendation
 */
interface Recommendation {
  readonly recommendation_id: string;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly category: ControlCategory;
  readonly title: string;
  readonly description: string;
  readonly remediation_target_days: number;
}

/**
 * Pack generation options
 */
interface PackGenerationOptions {
  readonly period: ReviewPeriod;
  readonly year: number;
  readonly include_evidence_refs: boolean;
  readonly include_recommendations: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockControlOutcome(overrides: Partial<ControlOutcome> = {}): ControlOutcome {
  const controlId = `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    control_id: `sha256:${Buffer.from(controlId).toString('hex').slice(0, 64)}`,
    control_name: 'access-control-review',
    status: 'effective',
    evidence_refs: [`sha256:${Buffer.from('ev-1').toString('hex').slice(0, 64)}`],
    test_count: 10,
    pass_count: 10,
    findings: [],
    ...overrides,
  };
}

function createMockControlSection(overrides: Partial<ControlSection> = {}): ControlSection {
  const sectionId = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    section_id: `sha256:${Buffer.from(sectionId).toString('hex').slice(0, 64)}`,
    category: 'access',
    controls: [createMockControlOutcome()],
    section_score: 95,
    evidence_status: 'complete',
    ...overrides,
  };
}

function createMockExecutiveSummary(overrides: Partial<ExecutiveSummary> = {}): ExecutiveSummary {
  const summaryId = `sum-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
    overall_health_score: 92,
    controls_tested: 45,
    controls_effective: 42,
    controls_with_findings: 3,
    critical_findings: 0,
    key_achievements: ['100% drill completion rate', 'MTTR improved 25%'],
    key_risks: ['Legacy system coverage gaps'],
    ...overrides,
  };
}

function createMockEvidenceSummary(overrides: Partial<EvidenceSummary> = {}): EvidenceSummary {
  const summaryId = `evsum-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
    total_evidence_items: 150,
    complete_items: 145,
    partial_items: 3,
    missing_items: 2,
    evidence_by_category: {
      access: 30,
      change: 45,
      incident: 25,
      continuity: 20,
      compliance: 20,
      monitoring: 10,
    },
    retention_compliant: true,
    ...overrides,
  };
}

function createMockRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  const recId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    recommendation_id: `sha256:${Buffer.from(recId).toString('hex').slice(0, 64)}`,
    priority: 'medium',
    category: 'change',
    title: 'improve change approval cycle time',
    description: 'reduce average CAB cycle time from 4.5h to 3h',
    remediation_target_days: 90,
    ...overrides,
  };
}

function createMockReviewPack(overrides: Partial<GovernanceReviewPack> = {}): GovernanceReviewPack {
  const packId = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    pack_id: `sha256:${Buffer.from(packId).toString('hex').slice(0, 64)}`,
    period: 'Q4',
    year: 2025,
    generated_at: new Date().toISOString(),
    executive_summary: createMockExecutiveSummary(),
    control_sections: [
      createMockControlSection({ category: 'access' }),
      createMockControlSection({ category: 'change' }),
      createMockControlSection({ category: 'incident' }),
    ],
    evidence_summary: createMockEvidenceSummary(),
    recommendations: [createMockRecommendation()],
    is_final: false,
    ...overrides,
  };
}

// ============================================================================
// MOCK GOVERNANCE REVIEW SERVICE
// ============================================================================

interface GovernanceReviewService {
  // Pack Generation
  generatePack(options: PackGenerationOptions): Promise<GovernanceReviewPack>;
  getPack(packId: string): Promise<GovernanceReviewPack | null>;
  listPacks(year: number): Promise<readonly GovernanceReviewPack[]>;
  finalizePack(packId: string): Promise<GovernanceReviewPack>;

  // Executive Summary
  getExecutiveSummary(packId: string): Promise<ExecutiveSummary | null>;
  getHealthScore(packId: string): Promise<number>;

  // Control Mapping
  getControlSections(packId: string): Promise<readonly ControlSection[]>;
  getControlOutcomes(packId: string, category: ControlCategory): Promise<readonly ControlOutcome[]>;
  getControlById(packId: string, controlId: string): Promise<ControlOutcome | null>;

  // Evidence
  getEvidenceSummary(packId: string): Promise<EvidenceSummary | null>;
  getEvidenceRefs(packId: string, controlId: string): Promise<readonly string[]>;
  isEvidenceComplete(packId: string): Promise<boolean>;

  // Recommendations
  getRecommendations(packId: string): Promise<readonly Recommendation[]>;
  getCriticalRecommendations(packId: string): Promise<readonly Recommendation[]>;

  // PII Safety
  isPIIClean(pack: GovernanceReviewPack): Promise<boolean>;
  containsUserData(pack: GovernanceReviewPack): Promise<boolean>;

  // Reproducibility
  isReproducible(packId: string): Promise<boolean>;
  getGenerationTimestamp(packId: string): Promise<string>;
}

function createMockGovernanceReviewService(): GovernanceReviewService {
  const packs: Map<string, GovernanceReviewPack> = new Map();

  return {
    async generatePack(options) {
      const pack = createMockReviewPack({
        period: options.period,
        year: options.year,
      });
      packs.set(pack.pack_id, pack);
      return pack;
    },

    async getPack(packId) {
      return packs.get(packId) ?? null;
    },

    async listPacks(year) {
      return Array.from(packs.values()).filter(p => p.year === year);
    },

    async finalizePack(packId) {
      const pack = packs.get(packId);
      if (!pack) throw new Error(`Pack not found: ${packId}`);

      const finalized: GovernanceReviewPack = { ...pack, is_final: true };
      packs.set(packId, finalized);
      return finalized;
    },

    async getExecutiveSummary(packId) {
      const pack = packs.get(packId);
      return pack?.executive_summary ?? null;
    },

    async getHealthScore(packId) {
      const pack = packs.get(packId);
      return pack?.executive_summary.overall_health_score ?? 0;
    },

    async getControlSections(packId) {
      const pack = packs.get(packId);
      return pack?.control_sections ?? [];
    },

    async getControlOutcomes(packId, category) {
      const pack = packs.get(packId);
      if (!pack) return [];

      const section = pack.control_sections.find(s => s.category === category);
      return section?.controls ?? [];
    },

    async getControlById(packId, controlId) {
      const pack = packs.get(packId);
      if (!pack) return null;

      for (const section of pack.control_sections) {
        const control = section.controls.find(c => c.control_id === controlId);
        if (control) return control;
      }
      return null;
    },

    async getEvidenceSummary(packId) {
      const pack = packs.get(packId);
      return pack?.evidence_summary ?? null;
    },

    async getEvidenceRefs(packId, controlId) {
      const control = await this.getControlById(packId, controlId);
      return control?.evidence_refs ?? [];
    },

    async isEvidenceComplete(packId) {
      const summary = await this.getEvidenceSummary(packId);
      return summary?.missing_items === 0;
    },

    async getRecommendations(packId) {
      const pack = packs.get(packId);
      return pack?.recommendations ?? [];
    },

    async getCriticalRecommendations(packId) {
      const recommendations = await this.getRecommendations(packId);
      return recommendations.filter(r => r.priority === 'critical');
    },

    async isPIIClean(pack) {
      // Pack contains only aggregate metrics, no PII
      return (
        typeof pack.executive_summary.overall_health_score === 'number' &&
        typeof pack.executive_summary.controls_tested === 'number' &&
        !pack.executive_summary.key_achievements.some(a => /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(a))
      );
    },

    async containsUserData(_pack) {
      // Pack does not contain user-identifiable data
      return false;
    },

    async isReproducible(packId) {
      const pack = packs.get(packId);
      // Pack is reproducible if it has a generation timestamp and period
      return !!(pack?.generated_at && pack?.period && pack?.year);
    },

    async getGenerationTimestamp(packId) {
      const pack = packs.get(packId);
      return pack?.generated_at ?? '';
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Control Effectiveness: Governance Review Contracts', () => {
  let service: GovernanceReviewService;

  beforeEach(() => {
    service = createMockGovernanceReviewService();
  });

  // ==========================================================================
  // CONTRACT: pack_generation
  // ==========================================================================
  describe('CONTRACT: pack_generation', () => {
    it('generates review pack', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });

      assert.ok(pack.pack_id.startsWith('sha256:'));
      assert.strictEqual(pack.period, 'Q4');
      assert.strictEqual(pack.year, 2025);
    });

    it('pack has generation timestamp', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });

      assert.ok(pack.generated_at);
      assert.ok(new Date(pack.generated_at).getTime() > 0);
    });

    it('retrieves pack by ID', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const retrieved = await service.getPack(pack.pack_id);

      assert.ok(retrieved);
      assert.strictEqual(retrieved.pack_id, pack.pack_id);
    });

    it('lists packs by year', async () => {
      await service.generatePack({
        period: 'Q1',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      await service.generatePack({
        period: 'Q2',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });

      const packs = await service.listPacks(2025);
      assert.ok(packs.length >= 2);
    });

    it('finalizes pack', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const finalized = await service.finalizePack(pack.pack_id);

      assert.strictEqual(finalized.is_final, true);
    });
  });

  // ==========================================================================
  // CONTRACT: executive_summary
  // ==========================================================================
  describe('CONTRACT: executive_summary', () => {
    it('pack has executive summary', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });

      assert.ok(pack.executive_summary);
      assert.ok(pack.executive_summary.summary_id.startsWith('sha256:'));
    });

    it('summary has health score', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const score = await service.getHealthScore(pack.pack_id);

      assert.ok(score >= 0);
      assert.ok(score <= 100);
    });

    it('summary has control counts', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const summary = await service.getExecutiveSummary(pack.pack_id);

      assert.ok(summary);
      assert.ok(summary.controls_tested >= 0);
      assert.ok(summary.controls_effective >= 0);
      assert.ok(summary.controls_effective <= summary.controls_tested);
    });

    it('summary has key achievements and risks', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const summary = await service.getExecutiveSummary(pack.pack_id);

      assert.ok(summary);
      assert.ok(Array.isArray(summary.key_achievements));
      assert.ok(Array.isArray(summary.key_risks));
    });
  });

  // ==========================================================================
  // CONTRACT: control_mapping
  // ==========================================================================
  describe('CONTRACT: control_mapping', () => {
    it('pack has control sections', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const sections = await service.getControlSections(pack.pack_id);

      assert.ok(sections.length > 0);
    });

    it('sections have categories', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const sections = await service.getControlSections(pack.pack_id);

      for (const section of sections) {
        assert.ok(
          ['access', 'change', 'incident', 'continuity', 'compliance', 'monitoring'].includes(
            section.category
          )
        );
      }
    });

    it('gets control outcomes by category', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const outcomes = await service.getControlOutcomes(pack.pack_id, 'access');

      assert.ok(outcomes.length > 0);
    });

    it('control outcomes have status', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const outcomes = await service.getControlOutcomes(pack.pack_id, 'access');

      for (const outcome of outcomes) {
        assert.ok(
          ['effective', 'partially_effective', 'ineffective', 'not_tested'].includes(outcome.status)
        );
      }
    });

    it('control IDs are opaque', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const outcomes = await service.getControlOutcomes(pack.pack_id, 'access');

      for (const outcome of outcomes) {
        assert.ok(outcome.control_id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: evidence_mapping
  // ==========================================================================
  describe('CONTRACT: evidence_mapping', () => {
    it('pack has evidence summary', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const summary = await service.getEvidenceSummary(pack.pack_id);

      assert.ok(summary);
      assert.ok(summary.summary_id.startsWith('sha256:'));
    });

    it('evidence summary has counts', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const summary = await service.getEvidenceSummary(pack.pack_id);

      assert.ok(summary);
      assert.strictEqual(
        summary.complete_items + summary.partial_items + summary.missing_items,
        summary.total_evidence_items
      );
    });

    it('controls link to evidence refs', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const outcomes = await service.getControlOutcomes(pack.pack_id, 'access');

      for (const outcome of outcomes) {
        assert.ok(Array.isArray(outcome.evidence_refs));
      }
    });

    it('evidence refs are opaque', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const outcomes = await service.getControlOutcomes(pack.pack_id, 'access');

      for (const outcome of outcomes) {
        for (const ref of outcome.evidence_refs) {
          assert.ok(ref.startsWith('sha256:'));
        }
      }
    });

    it('checks evidence completeness', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const isComplete = await service.isEvidenceComplete(pack.pack_id);

      assert.strictEqual(typeof isComplete, 'boolean');
    });
  });

  // ==========================================================================
  // CONTRACT: recommendations
  // ==========================================================================
  describe('CONTRACT: recommendations', () => {
    it('pack has recommendations', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const recommendations = await service.getRecommendations(pack.pack_id);

      assert.ok(recommendations.length > 0);
    });

    it('recommendations have priority', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const recommendations = await service.getRecommendations(pack.pack_id);

      for (const rec of recommendations) {
        assert.ok(['critical', 'high', 'medium', 'low'].includes(rec.priority));
      }
    });

    it('recommendations have remediation target', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const recommendations = await service.getRecommendations(pack.pack_id);

      for (const rec of recommendations) {
        assert.ok(rec.remediation_target_days > 0);
      }
    });

    it('recommendation IDs are opaque', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const recommendations = await service.getRecommendations(pack.pack_id);

      for (const rec of recommendations) {
        assert.ok(rec.recommendation_id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: pii_safety
  // ==========================================================================
  describe('CONTRACT: pii_safety', () => {
    it('pack is PII-clean', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const isPIIClean = await service.isPIIClean(pack);

      assert.strictEqual(isPIIClean, true);
    });

    it('pack contains no user data', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const hasUserData = await service.containsUserData(pack);

      assert.strictEqual(hasUserData, false);
    });
  });

  // ==========================================================================
  // CONTRACT: reproducibility
  // ==========================================================================
  describe('CONTRACT: reproducibility', () => {
    it('pack is reproducible', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const isReproducible = await service.isReproducible(pack.pack_id);

      assert.strictEqual(isReproducible, true);
    });

    it('pack has generation timestamp', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });
      const timestamp = await service.getGenerationTimestamp(pack.pack_id);

      assert.ok(timestamp.length > 0);
      assert.ok(new Date(timestamp).getTime() > 0);
    });

    it('pack is time-bounded', async () => {
      const pack = await service.generatePack({
        period: 'Q4',
        year: 2025,
        include_evidence_refs: true,
        include_recommendations: true,
      });

      assert.ok(pack.period);
      assert.ok(pack.year);
    });
  });
});

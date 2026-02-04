/**
 * Federation Adoption: Interop Maturity Model Contract Tests
 *
 * Phase XVI - Readiness score tiers, promotion governance,
 * sustained compliance windows, and tier assessments.
 *
 * CONTRACT SURFACE:
 * - Maturity Tiers: Define and retrieve tier definitions
 * - Tier Assessment: Evaluate agency readiness
 * - Compliance Windows: Sustained compliance tracking
 * - Tier Promotion: Governance for tier advancement
 *
 * INVARIANTS:
 * - Promotion requires sustained compliance window
 * - Tiers are sequential (no skipping)
 * - All IDs opaque sha256
 * - Assessment is evidence-backed
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TierLevel = 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
type AssessmentStatus = 'in_progress' | 'completed' | 'expired';
type PromotionStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * Maturity tier definition
 */
interface MaturityTier {
  readonly tier_id: string;
  readonly level: TierLevel;
  readonly order: number;
  readonly name: string;
  readonly description: string;
  readonly required_score: number;
  readonly required_compliance_days: number;
  readonly requirements: readonly string[];
}

/**
 * Agency maturity assessment
 */
interface MaturityAssessment {
  readonly assessment_id: string;
  readonly agency_id: string;
  readonly current_tier: TierLevel;
  readonly score: number;
  readonly status: AssessmentStatus;
  readonly assessed_at: string;
  readonly evidence_refs: readonly string[];
  readonly dimension_scores: DimensionScores;
}

/**
 * Dimension scores for maturity assessment
 */
interface DimensionScores {
  readonly governance: number;
  readonly technical: number;
  readonly security: number;
  readonly operational: number;
  readonly integration: number;
}

/**
 * Compliance window tracking
 */
interface ComplianceWindow {
  readonly window_id: string;
  readonly agency_id: string;
  readonly target_tier: TierLevel;
  readonly start_date: string;
  readonly end_date: string | null;
  readonly consecutive_days: number;
  readonly required_days: number;
  readonly is_sustained: boolean;
}

/**
 * Tier promotion request
 */
interface TierPromotion {
  readonly promotion_id: string;
  readonly agency_id: string;
  readonly from_tier: TierLevel;
  readonly to_tier: TierLevel;
  readonly status: PromotionStatus;
  readonly requested_at: string;
  readonly assessment_ref: string;
  readonly compliance_window_ref: string;
  readonly approved_by: string | null;
  readonly evidence_refs: readonly string[];
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockTier(level: TierLevel, order: number): MaturityTier {
  const tierId = `tier-${level}-${Date.now()}`;
  const tierConfigs: Record<TierLevel, { name: string; score: number; days: number }> = {
    initial: { name: 'Initial', score: 0, days: 0 },
    developing: { name: 'Developing', score: 40, days: 30 },
    defined: { name: 'Defined', score: 60, days: 60 },
    managed: { name: 'Managed', score: 80, days: 90 },
    optimizing: { name: 'Optimizing', score: 95, days: 180 },
  };

  const config = tierConfigs[level];
  return {
    tier_id: `sha256:${Buffer.from(tierId).toString('hex').slice(0, 64)}`,
    level,
    order,
    name: config.name,
    description: `${config.name} maturity tier`,
    required_score: config.score,
    required_compliance_days: config.days,
    requirements: [`Minimum score: ${config.score}`, `Sustained compliance: ${config.days} days`],
  };
}

function createMockAssessment(overrides: Partial<MaturityAssessment> = {}): MaturityAssessment {
  const assessId = `assess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    assessment_id: `sha256:${Buffer.from(assessId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    current_tier: 'developing',
    score: 65,
    status: 'completed',
    assessed_at: new Date().toISOString(),
    evidence_refs: [],
    dimension_scores: {
      governance: 70,
      technical: 65,
      security: 60,
      operational: 68,
      integration: 62,
    },
    ...overrides,
  };
}

function createMockComplianceWindow(overrides: Partial<ComplianceWindow> = {}): ComplianceWindow {
  const windowId = `window-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    window_id: `sha256:${Buffer.from(windowId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    target_tier: 'defined',
    start_date: new Date(Date.now() - 86400000 * 60).toISOString(),
    end_date: null,
    consecutive_days: 60,
    required_days: 60,
    is_sustained: true,
    ...overrides,
  };
}

function createMockPromotion(overrides: Partial<TierPromotion> = {}): TierPromotion {
  const promoId = `promo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    promotion_id: `sha256:${Buffer.from(promoId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    from_tier: 'developing',
    to_tier: 'defined',
    status: 'pending',
    requested_at: new Date().toISOString(),
    assessment_ref: `sha256:${'ass1'.repeat(16).slice(0, 64)}`,
    compliance_window_ref: `sha256:${'win1'.repeat(16).slice(0, 64)}`,
    approved_by: null,
    evidence_refs: [],
    ...overrides,
  };
}

// ============================================================================
// MOCK MATURITY MODEL SERVICE
// ============================================================================

interface MaturityModelService {
  // Tier Definitions
  getTierDefinition(level: TierLevel): Promise<MaturityTier>;
  listTiers(): Promise<readonly MaturityTier[]>;

  // Assessments
  assessAgency(agencyId: string): Promise<MaturityAssessment>;
  getAssessment(assessmentId: string): Promise<MaturityAssessment | null>;
  listAgencyAssessments(agencyId: string): Promise<readonly MaturityAssessment[]>;

  // Compliance Windows
  startComplianceWindow(agencyId: string, targetTier: TierLevel): Promise<ComplianceWindow>;
  getComplianceWindow(agencyId: string, targetTier: TierLevel): Promise<ComplianceWindow | null>;
  updateComplianceWindow(
    agencyId: string,
    targetTier: TierLevel,
    consecutiveDays: number
  ): Promise<ComplianceWindow>;
  checkSustainedCompliance(agencyId: string, targetTier: TierLevel): Promise<boolean>;

  // Tier Promotions
  requestPromotion(
    agencyId: string,
    fromTier: TierLevel,
    toTier: TierLevel
  ): Promise<TierPromotion>;
  approvePromotion(promotionId: string, approverId: string): Promise<TierPromotion>;
  rejectPromotion(promotionId: string, reason: string): Promise<TierPromotion>;
  getPromotion(promotionId: string): Promise<TierPromotion | null>;

  // Evidence
  addEvidenceRef(assessmentId: string, evidenceRef: string): Promise<MaturityAssessment>;
}

function createMockMaturityModelService(): MaturityModelService {
  const tiers: Map<TierLevel, MaturityTier> = new Map([
    ['initial', createMockTier('initial', 0)],
    ['developing', createMockTier('developing', 1)],
    ['defined', createMockTier('defined', 2)],
    ['managed', createMockTier('managed', 3)],
    ['optimizing', createMockTier('optimizing', 4)],
  ]);

  const assessments: Map<string, MaturityAssessment> = new Map();
  const complianceWindows: Map<string, ComplianceWindow> = new Map();
  const promotions: Map<string, TierPromotion> = new Map();

  const windowKey = (agencyId: string, tier: TierLevel): string => `${agencyId}:${tier}`;

  return {
    async getTierDefinition(level) {
      const tier = tiers.get(level);
      if (!tier) throw new Error('tier not found');
      return tier;
    },

    async listTiers() {
      return Array.from(tiers.values()).sort((a, b) => a.order - b.order);
    },

    async assessAgency(agencyId) {
      const assessment = createMockAssessment({ agency_id: agencyId });
      assessments.set(assessment.assessment_id, assessment);
      return assessment;
    },

    async getAssessment(assessmentId) {
      return assessments.get(assessmentId) ?? null;
    },

    async listAgencyAssessments(agencyId) {
      return Array.from(assessments.values()).filter(a => a.agency_id === agencyId);
    },

    async startComplianceWindow(agencyId, targetTier) {
      const tier = tiers.get(targetTier);
      if (!tier) throw new Error('tier not found');

      const window = createMockComplianceWindow({
        agency_id: agencyId,
        target_tier: targetTier,
        required_days: tier.required_compliance_days,
        consecutive_days: 0,
        is_sustained: false,
      });
      complianceWindows.set(windowKey(agencyId, targetTier), window);
      return window;
    },

    async getComplianceWindow(agencyId, targetTier) {
      return complianceWindows.get(windowKey(agencyId, targetTier)) ?? null;
    },

    async updateComplianceWindow(agencyId, targetTier, consecutiveDays) {
      const existing = complianceWindows.get(windowKey(agencyId, targetTier));
      if (!existing) throw new Error('window not found');

      const updated = createMockComplianceWindow({
        ...existing,
        consecutive_days: consecutiveDays,
        is_sustained: consecutiveDays >= existing.required_days,
      });
      complianceWindows.set(windowKey(agencyId, targetTier), updated);
      return updated;
    },

    async checkSustainedCompliance(agencyId, targetTier) {
      const window = complianceWindows.get(windowKey(agencyId, targetTier));
      return window?.is_sustained ?? false;
    },

    async requestPromotion(agencyId, fromTier, toTier) {
      // Validate sequential promotion
      const fromDef = tiers.get(fromTier);
      const toDef = tiers.get(toTier);
      if (!fromDef || !toDef) throw new Error('tier not found');
      if (toDef.order !== fromDef.order + 1) {
        throw new Error('promotion must be sequential');
      }

      // Check sustained compliance
      const isSustained = await this.checkSustainedCompliance(agencyId, toTier);
      if (!isSustained) {
        throw new Error('sustained compliance required for promotion');
      }

      const promotion = createMockPromotion({
        agency_id: agencyId,
        from_tier: fromTier,
        to_tier: toTier,
      });
      promotions.set(promotion.promotion_id, promotion);
      return promotion;
    },

    async approvePromotion(promotionId, approverId) {
      const promotion = promotions.get(promotionId);
      if (!promotion) throw new Error('promotion not found');

      const approved = createMockPromotion({
        ...promotion,
        status: 'approved',
        approved_by: approverId,
      });
      promotions.set(promotionId, approved);
      return approved;
    },

    async rejectPromotion(promotionId, _reason) {
      const promotion = promotions.get(promotionId);
      if (!promotion) throw new Error('promotion not found');

      const rejected = createMockPromotion({ ...promotion, status: 'rejected' });
      promotions.set(promotionId, rejected);
      return rejected;
    },

    async getPromotion(promotionId) {
      return promotions.get(promotionId) ?? null;
    },

    async addEvidenceRef(assessmentId, evidenceRef) {
      const assessment = assessments.get(assessmentId);
      if (!assessment) throw new Error('assessment not found');

      const updated = createMockAssessment({
        ...assessment,
        evidence_refs: [...assessment.evidence_refs, evidenceRef],
      });
      assessments.set(assessmentId, updated);
      return updated;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federation Adoption: Interop Maturity Model Contracts', () => {
  let service: MaturityModelService;

  beforeEach(() => {
    service = createMockMaturityModelService();
  });

  // ==========================================================================
  // CONTRACT: maturity_tiers
  // ==========================================================================
  describe('CONTRACT: maturity_tiers', () => {
    it('retrieves tier definition', async () => {
      const tier = await service.getTierDefinition('defined');

      assert.ok(tier.tier_id.startsWith('sha256:'));
      assert.strictEqual(tier.level, 'defined');
    });

    it('lists all tiers in order', async () => {
      const tierList = await service.listTiers();

      assert.strictEqual(tierList.length, 5);
      assert.strictEqual(tierList[0].level, 'initial');
      assert.strictEqual(tierList[4].level, 'optimizing');
    });

    it('tier has required score', async () => {
      const tier = await service.getTierDefinition('managed');
      assert.ok(tier.required_score >= 0);
    });

    it('tier has required compliance days', async () => {
      const tier = await service.getTierDefinition('optimizing');
      assert.ok(tier.required_compliance_days > 0);
    });

    it('tiers are sequential', async () => {
      const tierList = await service.listTiers();
      for (let i = 0; i < tierList.length; i++) {
        assert.strictEqual(tierList[i].order, i);
      }
    });
  });

  // ==========================================================================
  // CONTRACT: tier_assessment
  // ==========================================================================
  describe('CONTRACT: tier_assessment', () => {
    it('assesses agency maturity', async () => {
      const assessment = await service.assessAgency(`sha256:${'a'.repeat(64)}`);

      assert.ok(assessment.assessment_id.startsWith('sha256:'));
      assert.ok(typeof assessment.score === 'number');
    });

    it('retrieves assessment by ID', async () => {
      const created = await service.assessAgency(`sha256:${'a'.repeat(64)}`);
      const retrieved = await service.getAssessment(created.assessment_id);

      assert.ok(retrieved);
      assert.strictEqual(retrieved.assessment_id, created.assessment_id);
    });

    it('lists agency assessments', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.assessAgency(agencyId);

      const agencyAssessments = await service.listAgencyAssessments(agencyId);
      assert.ok(agencyAssessments.length >= 1);
    });

    it('assessment includes dimension scores', async () => {
      const assessment = createMockAssessment();
      assert.ok(typeof assessment.dimension_scores.governance === 'number');
      assert.ok(typeof assessment.dimension_scores.technical === 'number');
      assert.ok(typeof assessment.dimension_scores.security === 'number');
    });

    it('assessment is evidence-backed', async () => {
      const assessment = await service.assessAgency(`sha256:${'a'.repeat(64)}`);
      const updated = await service.addEvidenceRef(
        assessment.assessment_id,
        `sha256:${'e'.repeat(64)}`
      );

      assert.ok(updated.evidence_refs.length >= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: compliance_windows
  // ==========================================================================
  describe('CONTRACT: compliance_windows', () => {
    it('starts compliance window', async () => {
      const window = await service.startComplianceWindow(`sha256:${'a'.repeat(64)}`, 'defined');

      assert.ok(window.window_id.startsWith('sha256:'));
      assert.strictEqual(window.target_tier, 'defined');
    });

    it('retrieves compliance window', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');

      const window = await service.getComplianceWindow(agencyId, 'defined');
      assert.ok(window);
    });

    it('updates consecutive days', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');

      const updated = await service.updateComplianceWindow(agencyId, 'defined', 30);
      assert.strictEqual(updated.consecutive_days, 30);
    });

    it('checks sustained compliance', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 60);

      const isSustained = await service.checkSustainedCompliance(agencyId, 'defined');
      assert.strictEqual(isSustained, true);
    });

    it('not sustained when days insufficient', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 30);

      const isSustained = await service.checkSustainedCompliance(agencyId, 'defined');
      assert.strictEqual(isSustained, false);
    });
  });

  // ==========================================================================
  // CONTRACT: tier_promotion
  // ==========================================================================
  describe('CONTRACT: tier_promotion', () => {
    it('requests tier promotion', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 60);

      const promotion = await service.requestPromotion(agencyId, 'developing', 'defined');
      assert.ok(promotion.promotion_id.startsWith('sha256:'));
      assert.strictEqual(promotion.status, 'pending');
    });

    it('approves promotion', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 60);
      const promotion = await service.requestPromotion(agencyId, 'developing', 'defined');

      const approved = await service.approvePromotion(
        promotion.promotion_id,
        `sha256:${'o'.repeat(64)}`
      );
      assert.strictEqual(approved.status, 'approved');
      assert.ok(approved.approved_by);
    });

    it('rejects promotion', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 60);
      const promotion = await service.requestPromotion(agencyId, 'developing', 'defined');

      const rejected = await service.rejectPromotion(
        promotion.promotion_id,
        'insufficient evidence'
      );
      assert.strictEqual(rejected.status, 'rejected');
    });

    it('retrieves promotion by ID', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 60);
      const created = await service.requestPromotion(agencyId, 'developing', 'defined');

      const retrieved = await service.getPromotion(created.promotion_id);
      assert.ok(retrieved);
    });

    it('promotion requires sustained compliance', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'defined');
      await service.updateComplianceWindow(agencyId, 'defined', 30); // Not enough

      await assert.rejects(
        async () => service.requestPromotion(agencyId, 'developing', 'defined'),
        /sustained compliance required/
      );
    });

    it('promotion must be sequential', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.startComplianceWindow(agencyId, 'managed');
      await service.updateComplianceWindow(agencyId, 'managed', 90);

      // Trying to skip from developing to managed (skipping defined)
      await assert.rejects(
        async () => service.requestPromotion(agencyId, 'developing', 'managed'),
        /sequential/
      );
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const tier = createMockTier('defined', 2);
      const assessment = createMockAssessment();
      const window = createMockComplianceWindow();
      const promotion = createMockPromotion();

      assert.ok(tier.tier_id.startsWith('sha256:'));
      assert.ok(assessment.assessment_id.startsWith('sha256:'));
      assert.ok(window.window_id.startsWith('sha256:'));
      assert.ok(promotion.promotion_id.startsWith('sha256:'));
    });

    it('promotion references assessment', async () => {
      const promotion = createMockPromotion();
      assert.ok(promotion.assessment_ref.startsWith('sha256:'));
    });

    it('promotion references compliance window', async () => {
      const promotion = createMockPromotion();
      assert.ok(promotion.compliance_window_ref.startsWith('sha256:'));
    });

    it('tiers have increasing score requirements', async () => {
      const tierList = await service.listTiers();
      for (let i = 1; i < tierList.length; i++) {
        assert.ok(tierList[i].required_score >= tierList[i - 1].required_score);
      }
    });

    it('assessment has all dimension scores', async () => {
      const assessment = createMockAssessment();
      assert.ok('governance' in assessment.dimension_scores);
      assert.ok('technical' in assessment.dimension_scores);
      assert.ok('security' in assessment.dimension_scores);
      assert.ok('operational' in assessment.dimension_scores);
      assert.ok('integration' in assessment.dimension_scores);
    });
  });
});

/**
 * Live Acceptance Contract Tests
 * ================================
 *
 * Phase IVb: Validates promotion gates and rollback triggers.
 *
 * Contract:
 * - promotion_gate_requires_sustained_slo_attainment: N hours green before promotion
 * - rollback_triggers_on_slo_breach_or_integrity_alert: automatic safe-state revert
 * - no_promotion_when_observation_window_insufficient: 7d minimum enforced
 * - gates_respect_env_config_and_flag_sequencing: env-aware promotion
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Live Acceptance
// ============================================================================

/**
 * Environment types.
 */
type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Promotion stage.
 */
type PromotionStage =
  | 'disabled'
  | 'dry_run'
  | 'dashboard_only'
  | 'ticket_on_high'
  | 'page_on_critical'
  | 'fully_enabled';

/**
 * SLO status.
 */
interface SLOStatus {
  readonly notificationSuccess: number;
  readonly auditDrainP95Ms: number;
  readonly dedupeEffectiveness: number;
  readonly suppressionSuccess: number;
  readonly allGreen: boolean;
}

/**
 * Integrity status.
 */
interface IntegrityStatus {
  readonly lastCheckPassed: boolean;
  readonly lastCheckAt: string;
  readonly consecutiveFailures: number;
}

/**
 * Observation window status.
 */
interface ObservationWindowStatus {
  readonly startedAt: string;
  readonly daysElapsed: number;
  readonly sampleCount: number;
  readonly minimumDaysRequired: number;
  readonly minimumSamplesRequired: number;
  readonly sufficient: boolean;
}

/**
 * Acceptance gate result.
 */
interface AcceptanceGateResult {
  readonly passed: boolean;
  readonly currentStage: PromotionStage;
  readonly targetStage: PromotionStage;
  readonly blockers: readonly AcceptanceBlocker[];
  readonly sustainedGreenHours: number;
  readonly requiredGreenHours: number;
}

/**
 * Acceptance blocker.
 */
interface AcceptanceBlocker {
  readonly type:
    | 'slo_breach'
    | 'integrity_failure'
    | 'observation_insufficient'
    | 'flag_sequence'
    | 'env_restriction';
  readonly description: string;
  readonly severity: 'blocking' | 'warning';
}

/**
 * Live acceptance policy.
 */
interface LiveAcceptancePolicy {
  readonly environment: Environment;
  readonly requiredGreenHoursForPromotion: number;
  readonly observationWindowDays: number;
  readonly minimumSamples: number;
  readonly sloTargets: {
    readonly notificationSuccess: number;
    readonly auditDrainP95Ms: number;
    readonly dedupeEffectiveness: number;
    readonly suppressionSuccess: number;
  };
  readonly rollbackOnIntegrityFailure: boolean;
  readonly rollbackOnSustainedSLOBreach: number; // consecutive hours
}

/**
 * Rollback trigger.
 */
interface RollbackTrigger {
  readonly triggered: boolean;
  readonly reason?: string;
  readonly targetStage: PromotionStage;
  readonly preserveAudit: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_POLICY: LiveAcceptancePolicy = {
  environment: 'staging',
  requiredGreenHoursForPromotion: 24,
  observationWindowDays: 7,
  minimumSamples: 100,
  sloTargets: {
    notificationSuccess: 0.99,
    auditDrainP95Ms: 5000,
    dedupeEffectiveness: 0.8,
    suppressionSuccess: 0.995,
  },
  rollbackOnIntegrityFailure: true,
  rollbackOnSustainedSLOBreach: 2,
};

const PRODUCTION_POLICY: LiveAcceptancePolicy = {
  ...DEFAULT_POLICY,
  environment: 'production',
  requiredGreenHoursForPromotion: 72,
  observationWindowDays: 14,
  minimumSamples: 1000,
};

const STAGE_ORDER: readonly PromotionStage[] = [
  'disabled',
  'dry_run',
  'dashboard_only',
  'ticket_on_high',
  'page_on_critical',
  'fully_enabled',
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Check if SLOs are met.
 */
function checkSLOsMet(status: SLOStatus, policy: LiveAcceptancePolicy): boolean {
  return (
    status.notificationSuccess >= policy.sloTargets.notificationSuccess &&
    status.auditDrainP95Ms <= policy.sloTargets.auditDrainP95Ms &&
    status.dedupeEffectiveness >= policy.sloTargets.dedupeEffectiveness &&
    status.suppressionSuccess >= policy.sloTargets.suppressionSuccess
  );
}

/**
 * Check observation window sufficiency.
 */
function checkObservationWindow(
  window: ObservationWindowStatus,
  policy: LiveAcceptancePolicy
): { sufficient: boolean; blockers: AcceptanceBlocker[] } {
  const blockers: AcceptanceBlocker[] = [];

  if (window.daysElapsed < policy.observationWindowDays) {
    blockers.push({
      type: 'observation_insufficient',
      description: `Observation window: ${window.daysElapsed}d < required ${policy.observationWindowDays}d`,
      severity: 'blocking',
    });
  }

  if (window.sampleCount < policy.minimumSamples) {
    blockers.push({
      type: 'observation_insufficient',
      description: `Sample count: ${window.sampleCount} < required ${policy.minimumSamples}`,
      severity: 'blocking',
    });
  }

  return { sufficient: blockers.length === 0, blockers };
}

/**
 * Get stage index for ordering.
 */
function getStageIndex(stage: PromotionStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Validate stage transition.
 */
function isValidStageTransition(current: PromotionStage, target: PromotionStage): boolean {
  const currentIdx = getStageIndex(current);
  const targetIdx = getStageIndex(target);

  // Can only promote one step at a time, or rollback to any earlier stage
  return targetIdx === currentIdx + 1 || targetIdx < currentIdx;
}

/**
 * Evaluate acceptance gate.
 */
function evaluateAcceptanceGate(
  policy: LiveAcceptancePolicy,
  currentStage: PromotionStage,
  targetStage: PromotionStage,
  sloStatus: SLOStatus,
  integrityStatus: IntegrityStatus,
  observationWindow: ObservationWindowStatus,
  sustainedGreenHours: number
): AcceptanceGateResult {
  const blockers: AcceptanceBlocker[] = [];

  // Check stage transition validity
  if (!isValidStageTransition(currentStage, targetStage)) {
    blockers.push({
      type: 'flag_sequence',
      description: `Invalid transition from ${currentStage} to ${targetStage}; must promote one step at a time`,
      severity: 'blocking',
    });
  }

  // Check SLOs
  if (!checkSLOsMet(sloStatus, policy)) {
    blockers.push({
      type: 'slo_breach',
      description: 'One or more SLO targets not met',
      severity: 'blocking',
    });
  }

  // Check integrity
  if (!integrityStatus.lastCheckPassed) {
    blockers.push({
      type: 'integrity_failure',
      description: `Integrity check failed at ${integrityStatus.lastCheckAt}`,
      severity: 'blocking',
    });
  }

  // Check green hours for promotion (not rollback)
  const isPromotion = getStageIndex(targetStage) > getStageIndex(currentStage);
  if (isPromotion && sustainedGreenHours < policy.requiredGreenHoursForPromotion) {
    blockers.push({
      type: 'slo_breach',
      description: `Sustained green hours: ${sustainedGreenHours}h < required ${policy.requiredGreenHoursForPromotion}h`,
      severity: 'blocking',
    });
  }

  // Check observation window for critical paging stages
  if (targetStage === 'page_on_critical' || targetStage === 'fully_enabled') {
    const windowCheck = checkObservationWindow(observationWindow, policy);
    blockers.push(...windowCheck.blockers);
  }

  // Environment-specific restrictions
  if (policy.environment === 'production' && targetStage === 'fully_enabled') {
    if (sustainedGreenHours < 72) {
      blockers.push({
        type: 'env_restriction',
        description: 'Production requires 72h sustained green before full enablement',
        severity: 'blocking',
      });
    }
  }

  return {
    passed: blockers.length === 0,
    currentStage,
    targetStage,
    blockers,
    sustainedGreenHours,
    requiredGreenHours: policy.requiredGreenHoursForPromotion,
  };
}

/**
 * Evaluate rollback trigger.
 */
function evaluateRollbackTrigger(
  policy: LiveAcceptancePolicy,
  currentStage: PromotionStage,
  sloStatus: SLOStatus,
  integrityStatus: IntegrityStatus,
  consecutiveSLOBreachHours: number
): RollbackTrigger {
  // Integrity failure always triggers rollback
  if (policy.rollbackOnIntegrityFailure && !integrityStatus.lastCheckPassed) {
    return {
      triggered: true,
      reason: 'Audit integrity check failure',
      targetStage: 'dry_run',
      preserveAudit: true,
    };
  }

  // Sustained SLO breach triggers rollback
  if (
    consecutiveSLOBreachHours >= policy.rollbackOnSustainedSLOBreach &&
    !checkSLOsMet(sloStatus, policy)
  ) {
    return {
      triggered: true,
      reason: `SLO breach sustained for ${consecutiveSLOBreachHours}h`,
      targetStage: 'dashboard_only',
      preserveAudit: true,
    };
  }

  return {
    triggered: false,
    targetStage: currentStage,
    preserveAudit: true,
  };
}

/**
 * Create healthy SLO status.
 */
function createHealthySLOStatus(): SLOStatus {
  return {
    notificationSuccess: 0.995,
    auditDrainP95Ms: 2000,
    dedupeEffectiveness: 0.85,
    suppressionSuccess: 0.998,
    allGreen: true,
  };
}

/**
 * Create degraded SLO status.
 */
function createDegradedSLOStatus(): SLOStatus {
  return {
    notificationSuccess: 0.95,
    auditDrainP95Ms: 8000,
    dedupeEffectiveness: 0.7,
    suppressionSuccess: 0.98,
    allGreen: false,
  };
}

/**
 * Create healthy integrity status.
 */
function createHealthyIntegrityStatus(): IntegrityStatus {
  return {
    lastCheckPassed: true,
    lastCheckAt: new Date().toISOString(),
    consecutiveFailures: 0,
  };
}

/**
 * Create sufficient observation window.
 */
function createSufficientObservationWindow(): ObservationWindowStatus {
  return {
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    daysElapsed: 10,
    sampleCount: 500,
    minimumDaysRequired: 7,
    minimumSamplesRequired: 100,
    sufficient: true,
  };
}

// ============================================================================
// Contract: promotion_gate_requires_sustained_slo_attainment
// ============================================================================

describe('Live Acceptance Contract', () => {
  describe('promotion_gate_requires_sustained_slo_attainment', () => {
    it('should block promotion when green hours insufficient', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'dry_run',
        'dashboard_only',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        12 // Only 12 hours, need 24
      );

      assert.ok(!result.passed);
      assert.ok(result.blockers.some(b => b.description.includes('Sustained green hours')));
    });

    it('should allow promotion when green hours sufficient', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'dry_run',
        'dashboard_only',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        48 // 48 hours, need 24
      );

      assert.ok(result.passed);
      assert.strictEqual(result.blockers.length, 0);
    });

    it('should require more green hours in production', () => {
      const result = evaluateAcceptanceGate(
        PRODUCTION_POLICY,
        'dashboard_only',
        'ticket_on_high',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        48 // 48 hours, but production needs 72
      );

      assert.ok(!result.passed);
      assert.strictEqual(result.requiredGreenHours, 72);
    });

    it('should block promotion when SLOs not met', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'dry_run',
        'dashboard_only',
        createDegradedSLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        48
      );

      assert.ok(!result.passed);
      assert.ok(result.blockers.some(b => b.type === 'slo_breach'));
    });

    it('should not require green hours for rollback', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'ticket_on_high',
        'dashboard_only', // Rollback
        createDegradedSLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        0 // No green hours, but it's a rollback
      );

      // Rollback should only be blocked by invalid transition, not green hours
      const greenHoursBlocker = result.blockers.find(b =>
        b.description.includes('Sustained green hours')
      );
      assert.ok(!greenHoursBlocker);
    });
  });

  // ============================================================================
  // Contract: rollback_triggers_on_slo_breach_or_integrity_alert
  // ============================================================================

  describe('rollback_triggers_on_slo_breach_or_integrity_alert', () => {
    it('should trigger rollback on integrity failure', () => {
      const trigger = evaluateRollbackTrigger(
        DEFAULT_POLICY,
        'page_on_critical',
        createHealthySLOStatus(),
        { lastCheckPassed: false, lastCheckAt: new Date().toISOString(), consecutiveFailures: 1 },
        0
      );

      assert.ok(trigger.triggered);
      assert.ok(trigger.reason?.includes('integrity'));
      assert.strictEqual(trigger.targetStage, 'dry_run');
    });

    it('should trigger rollback on sustained SLO breach', () => {
      const trigger = evaluateRollbackTrigger(
        DEFAULT_POLICY,
        'ticket_on_high',
        createDegradedSLOStatus(),
        createHealthyIntegrityStatus(),
        3 // 3 consecutive hours of breach
      );

      assert.ok(trigger.triggered);
      assert.ok(trigger.reason?.includes('SLO breach'));
    });

    it('should not trigger rollback for transient SLO breach', () => {
      const trigger = evaluateRollbackTrigger(
        DEFAULT_POLICY,
        'ticket_on_high',
        createDegradedSLOStatus(),
        createHealthyIntegrityStatus(),
        1 // Only 1 hour, threshold is 2
      );

      assert.ok(!trigger.triggered);
    });

    it('should always preserve audit records on rollback', () => {
      const trigger = evaluateRollbackTrigger(
        DEFAULT_POLICY,
        'page_on_critical',
        createDegradedSLOStatus(),
        { lastCheckPassed: false, lastCheckAt: new Date().toISOString(), consecutiveFailures: 1 },
        5
      );

      assert.ok(trigger.preserveAudit);
    });

    it('should not trigger when all healthy', () => {
      const trigger = evaluateRollbackTrigger(
        DEFAULT_POLICY,
        'page_on_critical',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        0
      );

      assert.ok(!trigger.triggered);
    });
  });

  // ============================================================================
  // Contract: no_promotion_when_observation_window_insufficient
  // ============================================================================

  describe('no_promotion_when_observation_window_insufficient', () => {
    it('should block page_on_critical when observation window insufficient', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'ticket_on_high',
        'page_on_critical',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        {
          startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          daysElapsed: 3,
          sampleCount: 500,
          minimumDaysRequired: 7,
          minimumSamplesRequired: 100,
          sufficient: false,
        },
        48
      );

      assert.ok(!result.passed);
      assert.ok(result.blockers.some(b => b.type === 'observation_insufficient'));
    });

    it('should block when sample count insufficient', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'ticket_on_high',
        'page_on_critical',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        {
          startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysElapsed: 10,
          sampleCount: 50, // Insufficient
          minimumDaysRequired: 7,
          minimumSamplesRequired: 100,
          sufficient: false,
        },
        48
      );

      assert.ok(!result.passed);
      assert.ok(result.blockers.some(b => b.description.includes('Sample count')));
    });

    it('should allow page_on_critical with sufficient observation', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'ticket_on_high',
        'page_on_critical',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        48
      );

      assert.ok(result.passed);
    });

    it('should not require observation window for lower stages', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'dry_run',
        'dashboard_only',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        {
          startedAt: new Date().toISOString(),
          daysElapsed: 0,
          sampleCount: 0,
          minimumDaysRequired: 7,
          minimumSamplesRequired: 100,
          sufficient: false,
        },
        48
      );

      // Should not be blocked by observation window
      assert.ok(!result.blockers.some(b => b.type === 'observation_insufficient'));
    });
  });

  // ============================================================================
  // Contract: gates_respect_env_config_and_flag_sequencing
  // ============================================================================

  describe('gates_respect_env_config_and_flag_sequencing', () => {
    it('should block skipping stages', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'dry_run',
        'ticket_on_high', // Skipping dashboard_only
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        48
      );

      assert.ok(!result.passed);
      assert.ok(result.blockers.some(b => b.type === 'flag_sequence'));
    });

    it('should allow one-step promotion', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'dashboard_only',
        'ticket_on_high',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        48
      );

      assert.ok(result.passed);
    });

    it('should allow rollback to any earlier stage', () => {
      const result = evaluateAcceptanceGate(
        DEFAULT_POLICY,
        'page_on_critical',
        'dry_run', // Rollback multiple stages
        createDegradedSLOStatus(),
        createHealthyIntegrityStatus(),
        createSufficientObservationWindow(),
        0
      );

      // Should not be blocked by flag sequence
      assert.ok(!result.blockers.some(b => b.type === 'flag_sequence'));
    });

    it('should enforce production-specific restrictions', () => {
      const result = evaluateAcceptanceGate(
        PRODUCTION_POLICY,
        'page_on_critical',
        'fully_enabled',
        createHealthySLOStatus(),
        createHealthyIntegrityStatus(),
        {
          ...createSufficientObservationWindow(),
          daysElapsed: 14,
          sampleCount: 1000,
        },
        48 // Production needs 72h
      );

      assert.ok(!result.passed);
      assert.ok(result.blockers.some(b => b.type === 'env_restriction'));
    });

    it('should have stricter requirements in production', () => {
      assert.ok(
        PRODUCTION_POLICY.requiredGreenHoursForPromotion >
          DEFAULT_POLICY.requiredGreenHoursForPromotion
      );
      assert.ok(PRODUCTION_POLICY.observationWindowDays > DEFAULT_POLICY.observationWindowDays);
      assert.ok(PRODUCTION_POLICY.minimumSamples > DEFAULT_POLICY.minimumSamples);
    });
  });
});

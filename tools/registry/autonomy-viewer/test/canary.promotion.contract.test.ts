/**
 * Canary Promotion Contract Tests
 * =================================
 *
 * Phase IVb: Validates canary promotion rules and safety.
 *
 * Contract:
 * - requires_N_hours_green_before_promotion: sustained SLO attainment
 * - promotion_is_monotonic_and_idempotent: no regressions, safe retries
 * - promotion_refuses_if_dedupe_or_audit_drain_degrade: degradation detection
 * - promotion_never_enables_critical_paging_pre_window: observation gate
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Canary Promotion
// ============================================================================

/**
 * Canary stage.
 */
type CanaryStage = 0 | 5 | 10 | 25 | 50 | 100;

/**
 * Promotion step.
 */
interface PromotionStep {
  readonly fromStage: CanaryStage;
  readonly toStage: CanaryStage;
  readonly requiredGreenHours: number;
  readonly allowsRollback: boolean;
}

/**
 * SLO metrics snapshot.
 */
interface SLOMetricsSnapshot {
  readonly timestamp: string;
  readonly notificationSuccessRate: number;
  readonly auditDrainP95Ms: number;
  readonly dedupeEffectiveness: number;
  readonly suppressionSuccessRate: number;
}

/**
 * Canary health status.
 */
interface CanaryHealthStatus {
  readonly stage: CanaryStage;
  readonly greenHours: number;
  readonly metrics: SLOMetricsSnapshot;
  readonly baselineMetrics: SLOMetricsSnapshot;
  readonly degraded: boolean;
  readonly degradationReason?: string;
}

/**
 * Promotion decision.
 */
interface PromotionDecision {
  readonly canPromote: boolean;
  readonly currentStage: CanaryStage;
  readonly targetStage: CanaryStage;
  readonly reason: string;
  readonly waitHours?: number;
  readonly blockedByObservationWindow: boolean;
}

/**
 * Canary promotion config.
 */
interface CanaryPromotionConfig {
  readonly environment: 'development' | 'staging' | 'production';
  readonly stages: readonly CanaryStage[];
  readonly requiredGreenHoursPerStage: Record<CanaryStage, number>;
  readonly maxDegradationThreshold: {
    readonly notificationSuccessDrop: number;
    readonly auditDrainIncrease: number;
    readonly dedupeEffectivenessDrop: number;
  };
  readonly observationWindowDays: number;
  readonly criticalPagingMinObservationDays: number;
}

/**
 * Promotion history entry.
 */
interface PromotionHistoryEntry {
  readonly id: string;
  readonly fromStage: CanaryStage;
  readonly toStage: CanaryStage;
  readonly timestamp: string;
  readonly reason: string;
  readonly metrics: SLOMetricsSnapshot;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: CanaryPromotionConfig = {
  environment: 'staging',
  stages: [0, 5, 10, 25, 50, 100],
  requiredGreenHoursPerStage: {
    0: 0,
    5: 1,
    10: 4,
    25: 8,
    50: 24,
    100: 48,
  },
  maxDegradationThreshold: {
    notificationSuccessDrop: 0.02, // 2% drop
    auditDrainIncrease: 2000, // 2s increase
    dedupeEffectivenessDrop: 0.1, // 10% drop
  },
  observationWindowDays: 7,
  criticalPagingMinObservationDays: 7,
};

const PRODUCTION_CONFIG: CanaryPromotionConfig = {
  ...DEFAULT_CONFIG,
  environment: 'production',
  requiredGreenHoursPerStage: {
    0: 0,
    5: 4,
    10: 12,
    25: 24,
    50: 48,
    100: 72,
  },
  observationWindowDays: 14,
  criticalPagingMinObservationDays: 14,
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Get next canary stage.
 */
function getNextStage(config: CanaryPromotionConfig, current: CanaryStage): CanaryStage | null {
  const idx = config.stages.indexOf(current);
  if (idx === -1 || idx === config.stages.length - 1) return null;
  return config.stages[idx + 1];
}

/**
 * Get previous canary stage.
 */
function getPreviousStage(config: CanaryPromotionConfig, current: CanaryStage): CanaryStage | null {
  const idx = config.stages.indexOf(current);
  if (idx <= 0) return null;
  return config.stages[idx - 1];
}

/**
 * Check for metric degradation.
 */
function checkDegradation(
  config: CanaryPromotionConfig,
  current: SLOMetricsSnapshot,
  baseline: SLOMetricsSnapshot
): { degraded: boolean; reason?: string } {
  const notificationDrop = baseline.notificationSuccessRate - current.notificationSuccessRate;
  if (notificationDrop > config.maxDegradationThreshold.notificationSuccessDrop) {
    return {
      degraded: true,
      reason: `Notification success dropped by ${(notificationDrop * 100).toFixed(1)}%`,
    };
  }

  const auditIncrease = current.auditDrainP95Ms - baseline.auditDrainP95Ms;
  if (auditIncrease > config.maxDegradationThreshold.auditDrainIncrease) {
    return {
      degraded: true,
      reason: `Audit drain p95 increased by ${auditIncrease}ms`,
    };
  }

  const dedupeDrop = baseline.dedupeEffectiveness - current.dedupeEffectiveness;
  if (dedupeDrop > config.maxDegradationThreshold.dedupeEffectivenessDrop) {
    return {
      degraded: true,
      reason: `Dedupe effectiveness dropped by ${(dedupeDrop * 100).toFixed(1)}%`,
    };
  }

  return { degraded: false };
}

/**
 * Evaluate promotion decision.
 */
function evaluatePromotion(
  config: CanaryPromotionConfig,
  status: CanaryHealthStatus,
  observationDays: number,
  criticalPagingEnabled: boolean
): PromotionDecision {
  const nextStage = getNextStage(config, status.stage);

  if (nextStage === null) {
    return {
      canPromote: false,
      currentStage: status.stage,
      targetStage: status.stage,
      reason: 'Already at maximum stage',
      blockedByObservationWindow: false,
    };
  }

  // Check degradation
  if (status.degraded) {
    return {
      canPromote: false,
      currentStage: status.stage,
      targetStage: nextStage,
      reason: status.degradationReason ?? 'Metrics degraded',
      blockedByObservationWindow: false,
    };
  }

  // Check green hours requirement
  const requiredHours = config.requiredGreenHoursPerStage[nextStage];
  if (status.greenHours < requiredHours) {
    return {
      canPromote: false,
      currentStage: status.stage,
      targetStage: nextStage,
      reason: `Insufficient green hours: ${status.greenHours}h < ${requiredHours}h`,
      waitHours: requiredHours - status.greenHours,
      blockedByObservationWindow: false,
    };
  }

  // Check observation window for high stages
  if (nextStage >= 50 && observationDays < config.observationWindowDays) {
    return {
      canPromote: false,
      currentStage: status.stage,
      targetStage: nextStage,
      reason: `Observation window insufficient: ${observationDays}d < ${config.observationWindowDays}d`,
      blockedByObservationWindow: true,
    };
  }

  // Check critical paging gate
  if (criticalPagingEnabled && observationDays < config.criticalPagingMinObservationDays) {
    return {
      canPromote: false,
      currentStage: status.stage,
      targetStage: nextStage,
      reason: `Critical paging requires ${config.criticalPagingMinObservationDays}d observation`,
      blockedByObservationWindow: true,
    };
  }

  return {
    canPromote: true,
    currentStage: status.stage,
    targetStage: nextStage,
    reason: 'All promotion criteria met',
    blockedByObservationWindow: false,
  };
}

/**
 * Check if promotion is monotonic (no stage regression).
 * Rollback to 0 resets the progression entirely.
 */
function isPromotionMonotonic(history: readonly PromotionHistoryEntry[]): boolean {
  let maxStage = 0;
  for (const entry of history) {
    if (entry.toStage === 0) {
      // Rollback to 0 resets the progression - can start fresh
      maxStage = 0;
      continue;
    }
    if (entry.toStage < maxStage) {
      // Cannot regress to non-zero lower stage
      return false;
    }
    if (entry.toStage > maxStage) {
      maxStage = entry.toStage;
    }
  }
  return true;
}

/**
 * Check if promotion is idempotent.
 */
function isPromotionIdempotent(
  config: CanaryPromotionConfig,
  status: CanaryHealthStatus,
  observationDays: number
): boolean {
  // Same inputs should always produce same output
  const decision1 = evaluatePromotion(config, status, observationDays, false);
  const decision2 = evaluatePromotion(config, status, observationDays, false);

  return (
    decision1.canPromote === decision2.canPromote &&
    decision1.currentStage === decision2.currentStage &&
    decision1.targetStage === decision2.targetStage
  );
}

/**
 * Create healthy metrics.
 */
function createHealthyMetrics(): SLOMetricsSnapshot {
  return {
    timestamp: new Date().toISOString(),
    notificationSuccessRate: 0.995,
    auditDrainP95Ms: 2000,
    dedupeEffectiveness: 0.85,
    suppressionSuccessRate: 0.998,
  };
}

/**
 * Create degraded metrics.
 */
function createDegradedMetrics(): SLOMetricsSnapshot {
  return {
    timestamp: new Date().toISOString(),
    notificationSuccessRate: 0.96,
    auditDrainP95Ms: 6000,
    dedupeEffectiveness: 0.7,
    suppressionSuccessRate: 0.99,
  };
}

/**
 * Create healthy canary status.
 */
function createHealthyStatus(stage: CanaryStage, greenHours: number): CanaryHealthStatus {
  const metrics = createHealthyMetrics();
  return {
    stage,
    greenHours,
    metrics,
    baselineMetrics: metrics,
    degraded: false,
  };
}

// ============================================================================
// Contract: requires_N_hours_green_before_promotion
// ============================================================================

describe('Canary Promotion Contract', () => {
  describe('requires_N_hours_green_before_promotion', () => {
    it('should block promotion when green hours insufficient', () => {
      const status = createHealthyStatus(10, 4);
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);

      assert.ok(!decision.canPromote);
      assert.ok(decision.reason.includes('Insufficient green hours'));
      assert.strictEqual(decision.waitHours, 4); // Need 8, have 4
    });

    it('should allow promotion when green hours sufficient', () => {
      const status = createHealthyStatus(10, 12);
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);

      assert.ok(decision.canPromote);
      assert.strictEqual(decision.targetStage, 25);
    });

    it('should require more hours for higher stages', () => {
      assert.ok(
        DEFAULT_CONFIG.requiredGreenHoursPerStage[50] >
          DEFAULT_CONFIG.requiredGreenHoursPerStage[25]
      );
      assert.ok(
        DEFAULT_CONFIG.requiredGreenHoursPerStage[100] >
          DEFAULT_CONFIG.requiredGreenHoursPerStage[50]
      );
    });

    it('should calculate correct wait time', () => {
      const status = createHealthyStatus(25, 10);
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);

      // Need 24 for stage 50, have 10
      assert.strictEqual(decision.waitHours, 14);
    });

    it('should have stricter requirements in production', () => {
      const status = createHealthyStatus(10, 12);

      const stagingDecision = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);
      const prodDecision = evaluatePromotion(PRODUCTION_CONFIG, status, 10, false);

      // Same status but different configs
      assert.ok(stagingDecision.canPromote);
      assert.ok(!prodDecision.canPromote); // Production needs 24h for stage 25
    });
  });

  // ============================================================================
  // Contract: promotion_is_monotonic_and_idempotent
  // ============================================================================

  describe('promotion_is_monotonic_and_idempotent', () => {
    it('should be monotonic in normal progression', () => {
      const history: PromotionHistoryEntry[] = [
        {
          id: '1',
          fromStage: 0,
          toStage: 5,
          timestamp: '2026-01-01',
          reason: 'test',
          metrics: createHealthyMetrics(),
        },
        {
          id: '2',
          fromStage: 5,
          toStage: 10,
          timestamp: '2026-01-02',
          reason: 'test',
          metrics: createHealthyMetrics(),
        },
        {
          id: '3',
          fromStage: 10,
          toStage: 25,
          timestamp: '2026-01-03',
          reason: 'test',
          metrics: createHealthyMetrics(),
        },
      ];

      assert.ok(isPromotionMonotonic(history));
    });

    it('should detect non-monotonic progression (except rollback to 0)', () => {
      const history: PromotionHistoryEntry[] = [
        {
          id: '1',
          fromStage: 0,
          toStage: 25,
          timestamp: '2026-01-01',
          reason: 'test',
          metrics: createHealthyMetrics(),
        },
        {
          id: '2',
          fromStage: 25,
          toStage: 10,
          timestamp: '2026-01-02',
          reason: 'rollback',
          metrics: createDegradedMetrics(),
        },
      ];

      assert.ok(!isPromotionMonotonic(history));
    });

    it('should allow rollback to 0 in monotonic check', () => {
      const history: PromotionHistoryEntry[] = [
        {
          id: '1',
          fromStage: 0,
          toStage: 25,
          timestamp: '2026-01-01',
          reason: 'test',
          metrics: createHealthyMetrics(),
        },
        {
          id: '2',
          fromStage: 25,
          toStage: 0,
          timestamp: '2026-01-02',
          reason: 'emergency rollback',
          metrics: createDegradedMetrics(),
        },
        {
          id: '3',
          fromStage: 0,
          toStage: 5,
          timestamp: '2026-01-03',
          reason: 're-promote',
          metrics: createHealthyMetrics(),
        },
      ];

      assert.ok(isPromotionMonotonic(history));
    });

    it('should be idempotent with same inputs', () => {
      const status = createHealthyStatus(10, 12);
      assert.ok(isPromotionIdempotent(DEFAULT_CONFIG, status, 10));
    });

    it('should produce same decision on retry', () => {
      const status = createHealthyStatus(25, 30);

      const decision1 = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);
      const decision2 = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);
      const decision3 = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);

      assert.strictEqual(decision1.canPromote, decision2.canPromote);
      assert.strictEqual(decision2.canPromote, decision3.canPromote);
      assert.strictEqual(decision1.targetStage, decision2.targetStage);
    });
  });

  // ============================================================================
  // Contract: promotion_refuses_if_dedupe_or_audit_drain_degrade
  // ============================================================================

  describe('promotion_refuses_if_dedupe_or_audit_drain_degrade', () => {
    it('should detect audit drain degradation', () => {
      const baseline = createHealthyMetrics();
      const current = { ...baseline, auditDrainP95Ms: 6000 }; // 4s increase

      const result = checkDegradation(DEFAULT_CONFIG, current, baseline);

      assert.ok(result.degraded);
      assert.ok(result.reason?.includes('Audit drain'));
    });

    it('should detect dedupe effectiveness degradation', () => {
      const baseline = createHealthyMetrics();
      const current = { ...baseline, dedupeEffectiveness: 0.7 }; // 15% drop

      const result = checkDegradation(DEFAULT_CONFIG, current, baseline);

      assert.ok(result.degraded);
      assert.ok(result.reason?.includes('Dedupe'));
    });

    it('should detect notification success degradation', () => {
      const baseline = createHealthyMetrics();
      const current = { ...baseline, notificationSuccessRate: 0.96 }; // 3.5% drop

      const result = checkDegradation(DEFAULT_CONFIG, current, baseline);

      assert.ok(result.degraded);
      assert.ok(result.reason?.includes('Notification'));
    });

    it('should not flag minor variations as degradation', () => {
      const baseline = createHealthyMetrics();
      const current = {
        ...baseline,
        auditDrainP95Ms: baseline.auditDrainP95Ms + 500, // Only 500ms increase
        dedupeEffectiveness: baseline.dedupeEffectiveness - 0.02, // Only 2% drop
      };

      const result = checkDegradation(DEFAULT_CONFIG, current, baseline);

      assert.ok(!result.degraded);
    });

    it('should block promotion when degraded', () => {
      const status: CanaryHealthStatus = {
        stage: 10,
        greenHours: 24,
        metrics: createDegradedMetrics(),
        baselineMetrics: createHealthyMetrics(),
        degraded: true,
        degradationReason: 'Audit drain increased',
      };

      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 10, false);

      assert.ok(!decision.canPromote);
      assert.ok(decision.reason.includes('Audit drain') || decision.reason.includes('degraded'));
    });
  });

  // ============================================================================
  // Contract: promotion_never_enables_critical_paging_pre_window
  // ============================================================================

  describe('promotion_never_enables_critical_paging_pre_window', () => {
    it('should block high-stage promotion before observation window', () => {
      const status = createHealthyStatus(25, 72);
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 5, false); // Only 5 days

      assert.ok(!decision.canPromote);
      assert.ok(decision.blockedByObservationWindow);
    });

    it('should allow high-stage promotion after observation window', () => {
      const status = createHealthyStatus(25, 72);
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 10, false); // 10 days

      assert.ok(decision.canPromote);
      assert.ok(!decision.blockedByObservationWindow);
    });

    it('should block critical paging until observation window met', () => {
      // When critical paging is already enabled but observation window is insufficient
      // The promotion should still be blocked for next stage  
      const status = createHealthyStatus(25, 100); // Stage 25 -> 50 requires observation
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 5, true); // Critical paging enabled

      assert.ok(!decision.canPromote);
      assert.ok(decision.reason.toLowerCase().includes('observation') || decision.reason.toLowerCase().includes('window'));
    });

    it('should require stricter observation in production', () => {
      assert.ok(
        PRODUCTION_CONFIG.criticalPagingMinObservationDays >
          DEFAULT_CONFIG.criticalPagingMinObservationDays
      );
    });

    it('should not block low stages for observation', () => {
      const status = createHealthyStatus(5, 10);
      const decision = evaluatePromotion(DEFAULT_CONFIG, status, 1, false);

      // Low stage should not be blocked by observation window
      assert.ok(!decision.blockedByObservationWindow);
    });
  });
});

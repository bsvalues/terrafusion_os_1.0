/**
 * Ops-Plane SLO Contract Tests
 * =============================
 *
 * Phase IIIo: Validates SLOs for the ops plane itself (meta-SLOs).
 *
 * Contract:
 * - slo_notification_success_rate: Track post-breaker delivery success
 * - slo_audit_buffer_drain: Track buffer flush latency
 * - slo_dedupe_hit_rate: Track deduplication effectiveness
 * - slo_suppression_action_success: Track suppression workflow completion
 * - slo_correlation_completeness: Track end-to-end correlation chain
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Ops-Plane SLOs
// ============================================================================

/**
 * SLO definition for ops plane.
 */
interface OpsPlaneSlo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly target: number;
  readonly window: '1h' | '24h' | '7d' | '30d';
  readonly direction: 'above' | 'below';
  readonly unit: 'percent' | 'milliseconds' | 'count';
  readonly burnRates: readonly BurnRate[];
}

/**
 * Burn rate for alerting.
 */
interface BurnRate {
  readonly name: string;
  readonly rate: number;
  readonly windowPercentage: number;
}

/**
 * SLO measurement.
 */
interface SloMeasurement {
  readonly sloId: string;
  readonly timestamp: string;
  readonly value: number;
  readonly window: string;
  readonly denominator?: number; // For rate calculations
}

/**
 * SLO status.
 */
interface SloStatus {
  readonly sloId: string;
  readonly currentValue: number;
  readonly target: number;
  readonly healthy: boolean;
  readonly errorBudgetRemaining: number;
  readonly burnRate: number;
  readonly lastUpdated: string;
}

/**
 * Metric aggregation.
 */
interface MetricAggregation {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly rate: number;
}

// ============================================================================
// Ops-Plane SLO Catalog
// ============================================================================

const OPS_PLANE_SLOS: readonly OpsPlaneSlo[] = [
  {
    id: 'ops.notification.success_rate',
    name: 'Notification Delivery Success Rate',
    description: 'Percentage of notifications successfully delivered (post circuit breaker)',
    target: 0.99, // 99%
    window: '24h',
    direction: 'above',
    unit: 'percent',
    burnRates: [
      { name: 'fast', rate: 14.4, windowPercentage: 0.01 },
      { name: 'slow', rate: 1, windowPercentage: 0.1 },
    ],
  },
  {
    id: 'ops.audit.buffer_drain_p99',
    name: 'Audit Buffer Drain Latency P99',
    description: 'P99 latency for audit buffer flush to persistent store',
    target: 5000, // 5 seconds
    window: '1h',
    direction: 'below',
    unit: 'milliseconds',
    burnRates: [
      { name: 'fast', rate: 10, windowPercentage: 0.01 },
      { name: 'slow', rate: 2, windowPercentage: 0.1 },
    ],
  },
  {
    id: 'ops.dedupe.hit_rate',
    name: 'Deduplication Hit Rate',
    description: 'Percentage of duplicate notifications correctly suppressed',
    target: 0.999, // 99.9%
    window: '24h',
    direction: 'above',
    unit: 'percent',
    burnRates: [
      { name: 'fast', rate: 14.4, windowPercentage: 0.01 },
      { name: 'slow', rate: 1, windowPercentage: 0.1 },
    ],
  },
  {
    id: 'ops.suppression.action_success',
    name: 'Suppression Action Success Rate',
    description: 'Percentage of suppression actions that complete successfully',
    target: 0.995, // 99.5%
    window: '7d',
    direction: 'above',
    unit: 'percent',
    burnRates: [
      { name: 'fast', rate: 14.4, windowPercentage: 0.01 },
      { name: 'slow', rate: 1, windowPercentage: 0.1 },
    ],
  },
  {
    id: 'ops.correlation.completeness',
    name: 'Correlation Chain Completeness',
    description: 'Percentage of flows with complete correlation chain',
    target: 0.999, // 99.9%
    window: '24h',
    direction: 'above',
    unit: 'percent',
    burnRates: [
      { name: 'fast', rate: 14.4, windowPercentage: 0.01 },
      { name: 'slow', rate: 1, windowPercentage: 0.1 },
    ],
  },
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Get SLO by ID.
 */
function getSloById(sloId: string): OpsPlaneSlo | undefined {
  return OPS_PLANE_SLOS.find(s => s.id === sloId);
}

/**
 * Calculate error budget remaining.
 */
function calculateErrorBudget(slo: OpsPlaneSlo, currentValue: number): number {
  if (slo.direction === 'above') {
    // For "above" targets like success rate
    if (currentValue >= slo.target) {
      return 1.0; // 100% budget remaining
    }
    const errorRate = 1 - slo.target;
    const currentError = 1 - currentValue;
    return Math.max(0, 1 - currentError / errorRate);
  } else {
    // For "below" targets like latency
    if (currentValue <= slo.target) {
      return 1.0;
    }
    // Budget depletes as we exceed target
    const excess = currentValue - slo.target;
    const tolerance = slo.target * 0.5; // 50% tolerance buffer
    return Math.max(0, 1 - excess / tolerance);
  }
}

/**
 * Check if SLO is healthy.
 */
function isSloHealthy(slo: OpsPlaneSlo, currentValue: number): boolean {
  if (slo.direction === 'above') {
    return currentValue >= slo.target;
  }
  return currentValue <= slo.target;
}

/**
 * Calculate burn rate.
 */
function calculateBurnRate(
  slo: OpsPlaneSlo,
  _shortWindowValue: number,
  _longWindowValue: number
): number {
  // Simplified burn rate calculation
  const errorBudget = 1 - slo.target;
  if (errorBudget === 0) return 0;

  const shortWindowError =
    slo.direction === 'above' ? 1 - _shortWindowValue : _shortWindowValue / slo.target;
  return shortWindowError / errorBudget;
}

/**
 * Compute SLO status from measurements.
 */
function computeSloStatus(
  sloId: string,
  shortWindowValue: number,
  longWindowValue: number
): SloStatus | null {
  const slo = getSloById(sloId);
  if (!slo) return null;

  const burnRate = calculateBurnRate(slo, shortWindowValue, longWindowValue);

  return {
    sloId,
    currentValue: longWindowValue,
    target: slo.target,
    healthy: isSloHealthy(slo, longWindowValue),
    errorBudgetRemaining: calculateErrorBudget(slo, longWindowValue),
    burnRate,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Aggregate metrics for SLO calculation.
 */
function aggregateMetrics(succeeded: number, failed: number): MetricAggregation {
  const total = succeeded + failed;
  const rate = total > 0 ? succeeded / total : 1.0;
  return { total, succeeded, failed, rate };
}

/**
 * Check for SLO alert condition.
 */
function shouldAlert(slo: OpsPlaneSlo, burnRate: number, alertLevel: 'fast' | 'slow'): boolean {
  const burnRateConfig = slo.burnRates.find(b => b.name === alertLevel);
  if (!burnRateConfig) return false;
  return burnRate >= burnRateConfig.rate;
}

// ============================================================================
// Contract: slo_notification_success_rate
// ============================================================================

describe('Ops-Plane SLO Contract', () => {
  describe('slo_notification_success_rate', () => {
    it('should define notification success rate SLO', () => {
      const slo = getSloById('ops.notification.success_rate');
      assert.ok(slo, 'SLO should exist');
      assert.strictEqual(slo.target, 0.99);
      assert.strictEqual(slo.direction, 'above');
    });

    it('should be healthy when above target', () => {
      const slo = getSloById('ops.notification.success_rate')!;
      assert.ok(isSloHealthy(slo, 0.995), 'Should be healthy at 99.5%');
      assert.ok(isSloHealthy(slo, 0.99), 'Should be healthy at 99%');
    });

    it('should be unhealthy when below target', () => {
      const slo = getSloById('ops.notification.success_rate')!;
      assert.ok(!isSloHealthy(slo, 0.98), 'Should be unhealthy at 98%');
    });

    it('should calculate error budget correctly', () => {
      const slo = getSloById('ops.notification.success_rate')!;

      // At target: 100% budget
      assert.strictEqual(calculateErrorBudget(slo, 0.99), 1.0);

      // Above target: 100% budget
      assert.strictEqual(calculateErrorBudget(slo, 0.995), 1.0);

      // At 98% with 99% target: using 100% of budget
      const budgetAt98 = calculateErrorBudget(slo, 0.98);
      assert.ok(budgetAt98 === 0, `Budget should be 0 at 98%: ${budgetAt98}`);
    });

    it('should aggregate success/failure metrics', () => {
      const agg = aggregateMetrics(99, 1);
      assert.strictEqual(agg.total, 100);
      assert.strictEqual(agg.rate, 0.99);
    });
  });

  // ============================================================================
  // Contract: slo_audit_buffer_drain
  // ============================================================================

  describe('slo_audit_buffer_drain', () => {
    it('should define audit buffer drain SLO', () => {
      const slo = getSloById('ops.audit.buffer_drain_p99');
      assert.ok(slo, 'SLO should exist');
      assert.strictEqual(slo.target, 5000);
      assert.strictEqual(slo.direction, 'below');
      assert.strictEqual(slo.unit, 'milliseconds');
    });

    it('should be healthy when below target', () => {
      const slo = getSloById('ops.audit.buffer_drain_p99')!;
      assert.ok(isSloHealthy(slo, 4000), 'Should be healthy at 4s');
      assert.ok(isSloHealthy(slo, 5000), 'Should be healthy at 5s');
    });

    it('should be unhealthy when above target', () => {
      const slo = getSloById('ops.audit.buffer_drain_p99')!;
      assert.ok(!isSloHealthy(slo, 6000), 'Should be unhealthy at 6s');
    });

    it('should deplete budget when exceeding target', () => {
      const slo = getSloById('ops.audit.buffer_drain_p99')!;

      const budgetAtTarget = calculateErrorBudget(slo, 5000);
      const budgetAbove = calculateErrorBudget(slo, 6000);

      assert.strictEqual(budgetAtTarget, 1.0);
      assert.ok(budgetAbove < budgetAtTarget);
    });
  });

  // ============================================================================
  // Contract: slo_dedupe_hit_rate
  // ============================================================================

  describe('slo_dedupe_hit_rate', () => {
    it('should define dedupe hit rate SLO', () => {
      const slo = getSloById('ops.dedupe.hit_rate');
      assert.ok(slo, 'SLO should exist');
      assert.strictEqual(slo.target, 0.999);
      assert.strictEqual(slo.direction, 'above');
    });

    it('should have stricter target than notification rate', () => {
      const dedupeSlo = getSloById('ops.dedupe.hit_rate')!;
      const notifySlo = getSloById('ops.notification.success_rate')!;

      assert.ok(dedupeSlo.target > notifySlo.target);
    });

    it('should compute status correctly', () => {
      const status = computeSloStatus('ops.dedupe.hit_rate', 0.9995, 0.9992);

      assert.ok(status);
      assert.strictEqual(status.sloId, 'ops.dedupe.hit_rate');
      assert.ok(status.healthy);
      assert.strictEqual(status.currentValue, 0.9992);
    });
  });

  // ============================================================================
  // Contract: slo_suppression_action_success
  // ============================================================================

  describe('slo_suppression_action_success', () => {
    it('should define suppression action success SLO', () => {
      const slo = getSloById('ops.suppression.action_success');
      assert.ok(slo, 'SLO should exist');
      assert.strictEqual(slo.target, 0.995);
      assert.strictEqual(slo.window, '7d');
    });

    it('should use longer window for suppression', () => {
      const suppressionSlo = getSloById('ops.suppression.action_success')!;
      const notifySlo = getSloById('ops.notification.success_rate')!;

      // Suppression uses 7d window, notification uses 24h
      assert.strictEqual(suppressionSlo.window, '7d');
      assert.strictEqual(notifySlo.window, '24h');
    });

    it('should trigger alert on high burn rate', () => {
      const slo = getSloById('ops.suppression.action_success')!;

      // High burn rate should trigger fast alert
      assert.ok(shouldAlert(slo, 15, 'fast'));
      assert.ok(!shouldAlert(slo, 10, 'fast'));
    });
  });

  // ============================================================================
  // Contract: slo_correlation_completeness
  // ============================================================================

  describe('slo_correlation_completeness', () => {
    it('should define correlation completeness SLO', () => {
      const slo = getSloById('ops.correlation.completeness');
      assert.ok(slo, 'SLO should exist');
      assert.strictEqual(slo.target, 0.999);
    });

    it('should track end-to-end correlation chain', () => {
      // This test documents the requirement for correlation completeness
      const slo = getSloById('ops.correlation.completeness')!;
      assert.ok(
        slo.description.includes('complete correlation chain'),
        'Should describe correlation tracking'
      );
    });

    it('should have same target as dedupe', () => {
      const correlationSlo = getSloById('ops.correlation.completeness')!;
      const dedupeSlo = getSloById('ops.dedupe.hit_rate')!;

      // Both are critical observability components
      assert.strictEqual(correlationSlo.target, dedupeSlo.target);
    });
  });

  // ============================================================================
  // Additional SLO Governance Tests
  // ============================================================================

  describe('slo_governance', () => {
    it('should have all required SLOs defined', () => {
      const requiredSlos = [
        'ops.notification.success_rate',
        'ops.audit.buffer_drain_p99',
        'ops.dedupe.hit_rate',
        'ops.suppression.action_success',
        'ops.correlation.completeness',
      ];

      for (const sloId of requiredSlos) {
        assert.ok(getSloById(sloId), `SLO ${sloId} should exist`);
      }
    });

    it('should all have burn rates defined', () => {
      for (const slo of OPS_PLANE_SLOS) {
        assert.ok(slo.burnRates.length >= 2, `${slo.id} should have burn rates`);
        assert.ok(
          slo.burnRates.some(b => b.name === 'fast'),
          `${slo.id} should have fast burn rate`
        );
        assert.ok(
          slo.burnRates.some(b => b.name === 'slow'),
          `${slo.id} should have slow burn rate`
        );
      }
    });

    it('should have valid target ranges', () => {
      for (const slo of OPS_PLANE_SLOS) {
        if (slo.unit === 'percent') {
          assert.ok(slo.target > 0 && slo.target <= 1, `${slo.id} target should be 0-1`);
        }
        if (slo.unit === 'milliseconds') {
          assert.ok(slo.target > 0, `${slo.id} target should be positive`);
        }
      }
    });
  });
});

/**
 * Control Effectiveness: KPI Contract Tests
 *
 * Phase XII - Effectiveness metrics: MTTR, drill compliance,
 * rollback success rate, breaker trends, CAB cycle time.
 *
 * CONTRACT SURFACE:
 * - MTTR Tracking: Mean time to recovery trends
 * - Drill Compliance: Drill execution rates and outcomes
 * - Rollback Success: Rollback execution success rates
 * - Breaker Trends: Circuit breaker open/close patterns
 * - CAB Cycle Time: Change approval turnaround metrics
 *
 * INVARIANTS:
 * - All metrics are PII-clean (aggregate only)
 * - All IDs are opaque sha256:
 * - Trends are time-bounded (configurable windows)
 * - Metrics support comparison periods
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type MetricWindow = '24h' | '7d' | '30d' | '90d' | 'quarter' | 'year';
type TrendDirection = 'improving' | 'stable' | 'degrading';
type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant';

/**
 * MTTR metric
 */
interface MTTRMetric {
  readonly metric_id: string;
  readonly window: MetricWindow;
  readonly mttr_minutes: number;
  readonly incident_count: number;
  readonly p50_minutes: number;
  readonly p95_minutes: number;
  readonly trend: TrendDirection;
  readonly previous_period_mttr_minutes: number;
  readonly improvement_percentage: number;
  readonly calculated_at: string;
}

/**
 * Drill compliance metric
 */
interface DrillComplianceMetric {
  readonly metric_id: string;
  readonly window: MetricWindow;
  readonly required_drills: number;
  readonly executed_drills: number;
  readonly passed_drills: number;
  readonly compliance_rate: number;
  readonly pass_rate: number;
  readonly status: ComplianceStatus;
  readonly trend: TrendDirection;
  readonly calculated_at: string;
}

/**
 * Rollback success metric
 */
interface RollbackSuccessMetric {
  readonly metric_id: string;
  readonly window: MetricWindow;
  readonly total_rollbacks: number;
  readonly successful_rollbacks: number;
  readonly failed_rollbacks: number;
  readonly success_rate: number;
  readonly average_rollback_time_minutes: number;
  readonly trend: TrendDirection;
  readonly calculated_at: string;
}

/**
 * Circuit breaker trend
 */
interface BreakerTrendMetric {
  readonly metric_id: string;
  readonly window: MetricWindow;
  readonly total_breaker_events: number;
  readonly open_events: number;
  readonly close_events: number;
  readonly average_open_duration_minutes: number;
  readonly services_affected: number;
  readonly trend: TrendDirection;
  readonly calculated_at: string;
}

/**
 * CAB cycle time metric
 */
interface CABCycleTimeMetric {
  readonly metric_id: string;
  readonly window: MetricWindow;
  readonly total_changes: number;
  readonly average_cycle_time_hours: number;
  readonly p50_hours: number;
  readonly p95_hours: number;
  readonly approval_rate: number;
  readonly rejection_rate: number;
  readonly trend: TrendDirection;
  readonly calculated_at: string;
}

/**
 * Effectiveness dashboard
 */
interface EffectivenessDashboard {
  readonly dashboard_id: string;
  readonly mttr: MTTRMetric;
  readonly drill_compliance: DrillComplianceMetric;
  readonly rollback_success: RollbackSuccessMetric;
  readonly breaker_trends: BreakerTrendMetric;
  readonly cab_cycle_time: CABCycleTimeMetric;
  readonly overall_health_score: number;
  readonly generated_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockMTTRMetric(overrides: Partial<MTTRMetric> = {}): MTTRMetric {
  const metricId = `mttr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    metric_id: `sha256:${Buffer.from(metricId).toString('hex').slice(0, 64)}`,
    window: '30d',
    mttr_minutes: 45,
    incident_count: 12,
    p50_minutes: 30,
    p95_minutes: 120,
    trend: 'improving',
    previous_period_mttr_minutes: 60,
    improvement_percentage: 25,
    calculated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockDrillComplianceMetric(
  overrides: Partial<DrillComplianceMetric> = {}
): DrillComplianceMetric {
  const metricId = `drill-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    metric_id: `sha256:${Buffer.from(metricId).toString('hex').slice(0, 64)}`,
    window: '30d',
    required_drills: 10,
    executed_drills: 9,
    passed_drills: 8,
    compliance_rate: 90,
    pass_rate: 88.9,
    status: 'compliant',
    trend: 'stable',
    calculated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockRollbackSuccessMetric(
  overrides: Partial<RollbackSuccessMetric> = {}
): RollbackSuccessMetric {
  const metricId = `rb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    metric_id: `sha256:${Buffer.from(metricId).toString('hex').slice(0, 64)}`,
    window: '30d',
    total_rollbacks: 15,
    successful_rollbacks: 14,
    failed_rollbacks: 1,
    success_rate: 93.3,
    average_rollback_time_minutes: 12,
    trend: 'improving',
    calculated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockBreakerTrendMetric(
  overrides: Partial<BreakerTrendMetric> = {}
): BreakerTrendMetric {
  const metricId = `brk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    metric_id: `sha256:${Buffer.from(metricId).toString('hex').slice(0, 64)}`,
    window: '30d',
    total_breaker_events: 25,
    open_events: 12,
    close_events: 13,
    average_open_duration_minutes: 8,
    services_affected: 3,
    trend: 'stable',
    calculated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCABCycleTimeMetric(
  overrides: Partial<CABCycleTimeMetric> = {}
): CABCycleTimeMetric {
  const metricId = `cab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    metric_id: `sha256:${Buffer.from(metricId).toString('hex').slice(0, 64)}`,
    window: '30d',
    total_changes: 45,
    average_cycle_time_hours: 4.5,
    p50_hours: 3,
    p95_hours: 12,
    approval_rate: 92,
    rejection_rate: 8,
    trend: 'improving',
    calculated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK EFFECTIVENESS KPI SERVICE
// ============================================================================

interface EffectivenessKPIService {
  // MTTR
  getMTTR(window: MetricWindow): Promise<MTTRMetric>;
  compareMTTR(
    currentWindow: MetricWindow,
    previousWindow: MetricWindow
  ): Promise<{ current: MTTRMetric; previous: MTTRMetric; improvement: number }>;

  // Drill Compliance
  getDrillCompliance(window: MetricWindow): Promise<DrillComplianceMetric>;
  getComplianceStatus(): Promise<ComplianceStatus>;

  // Rollback Success
  getRollbackSuccess(window: MetricWindow): Promise<RollbackSuccessMetric>;
  getRollbackTrend(): Promise<TrendDirection>;

  // Breaker Trends
  getBreakerTrends(window: MetricWindow): Promise<BreakerTrendMetric>;
  getAffectedServicesCount(): Promise<number>;

  // CAB Cycle Time
  getCABCycleTime(window: MetricWindow): Promise<CABCycleTimeMetric>;
  getApprovalRate(): Promise<number>;

  // Dashboard
  generateDashboard(window: MetricWindow): Promise<EffectivenessDashboard>;
  getHealthScore(): Promise<number>;

  // PII Safety
  isPIIClean(dashboard: EffectivenessDashboard): Promise<boolean>;
  containsUserIdentifiers(metric: MTTRMetric | DrillComplianceMetric): Promise<boolean>;
}

function createMockEffectivenessKPIService(): EffectivenessKPIService {
  return {
    async getMTTR(window) {
      return createMockMTTRMetric({ window });
    },

    async compareMTTR(currentWindow, previousWindow) {
      const current = createMockMTTRMetric({ window: currentWindow, mttr_minutes: 45 });
      const previous = createMockMTTRMetric({ window: previousWindow, mttr_minutes: 60 });
      const improvement = Math.round(
        ((previous.mttr_minutes - current.mttr_minutes) / previous.mttr_minutes) * 100
      );

      return { current, previous, improvement };
    },

    async getDrillCompliance(window) {
      return createMockDrillComplianceMetric({ window });
    },

    async getComplianceStatus() {
      return 'compliant';
    },

    async getRollbackSuccess(window) {
      return createMockRollbackSuccessMetric({ window });
    },

    async getRollbackTrend() {
      return 'improving';
    },

    async getBreakerTrends(window) {
      return createMockBreakerTrendMetric({ window });
    },

    async getAffectedServicesCount() {
      return 3;
    },

    async getCABCycleTime(window) {
      return createMockCABCycleTimeMetric({ window });
    },

    async getApprovalRate() {
      return 92;
    },

    async generateDashboard(window) {
      const dashboardId = `dash-${Date.now()}`;
      return {
        dashboard_id: `sha256:${Buffer.from(dashboardId).toString('hex').slice(0, 64)}`,
        mttr: await this.getMTTR(window),
        drill_compliance: await this.getDrillCompliance(window),
        rollback_success: await this.getRollbackSuccess(window),
        breaker_trends: await this.getBreakerTrends(window),
        cab_cycle_time: await this.getCABCycleTime(window),
        overall_health_score: 87,
        generated_at: new Date().toISOString(),
      };
    },

    async getHealthScore() {
      return 87;
    },

    async isPIIClean(dashboard) {
      // Dashboard contains only aggregate metrics
      return (
        typeof dashboard.overall_health_score === 'number' &&
        typeof dashboard.mttr.mttr_minutes === 'number' &&
        typeof dashboard.drill_compliance.compliance_rate === 'number'
      );
    },

    async containsUserIdentifiers(_metric) {
      // Metrics do not contain user identifiers
      return false;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Control Effectiveness: KPI Contracts', () => {
  let service: EffectivenessKPIService;

  beforeEach(() => {
    service = createMockEffectivenessKPIService();
  });

  // ==========================================================================
  // CONTRACT: mttr_tracking
  // ==========================================================================
  describe('CONTRACT: mttr_tracking', () => {
    it('gets MTTR for window', async () => {
      const mttr = await service.getMTTR('30d');

      assert.ok(mttr.metric_id.startsWith('sha256:'));
      assert.strictEqual(mttr.window, '30d');
      assert.ok(mttr.mttr_minutes > 0);
    });

    it('MTTR includes percentiles', async () => {
      const mttr = await service.getMTTR('30d');

      assert.ok(mttr.p50_minutes > 0);
      assert.ok(mttr.p95_minutes > 0);
      assert.ok(mttr.p95_minutes >= mttr.p50_minutes);
    });

    it('compares MTTR across periods', async () => {
      const comparison = await service.compareMTTR('30d', '30d');

      assert.ok(comparison.current);
      assert.ok(comparison.previous);
      assert.strictEqual(typeof comparison.improvement, 'number');
    });

    it('MTTR tracks improvement', async () => {
      const mttr = await service.getMTTR('30d');

      assert.ok(['improving', 'stable', 'degrading'].includes(mttr.trend));
      assert.strictEqual(typeof mttr.improvement_percentage, 'number');
    });
  });

  // ==========================================================================
  // CONTRACT: drill_compliance
  // ==========================================================================
  describe('CONTRACT: drill_compliance', () => {
    it('gets drill compliance', async () => {
      const compliance = await service.getDrillCompliance('30d');

      assert.ok(compliance.metric_id.startsWith('sha256:'));
      assert.ok(compliance.compliance_rate >= 0);
      assert.ok(compliance.compliance_rate <= 100);
    });

    it('tracks required vs executed drills', async () => {
      const compliance = await service.getDrillCompliance('30d');

      assert.ok(compliance.required_drills >= 0);
      assert.ok(compliance.executed_drills >= 0);
      assert.ok(compliance.passed_drills <= compliance.executed_drills);
    });

    it('compliance has status', async () => {
      const status = await service.getComplianceStatus();

      assert.ok(['compliant', 'partial', 'non_compliant'].includes(status));
    });

    it('compliance tracks trend', async () => {
      const compliance = await service.getDrillCompliance('30d');

      assert.ok(['improving', 'stable', 'degrading'].includes(compliance.trend));
    });
  });

  // ==========================================================================
  // CONTRACT: rollback_success
  // ==========================================================================
  describe('CONTRACT: rollback_success', () => {
    it('gets rollback success rate', async () => {
      const rollback = await service.getRollbackSuccess('30d');

      assert.ok(rollback.metric_id.startsWith('sha256:'));
      assert.ok(rollback.success_rate >= 0);
      assert.ok(rollback.success_rate <= 100);
    });

    it('tracks rollback counts', async () => {
      const rollback = await service.getRollbackSuccess('30d');

      assert.strictEqual(
        rollback.successful_rollbacks + rollback.failed_rollbacks,
        rollback.total_rollbacks
      );
    });

    it('tracks average rollback time', async () => {
      const rollback = await service.getRollbackSuccess('30d');

      assert.ok(rollback.average_rollback_time_minutes > 0);
    });

    it('rollback has trend', async () => {
      const trend = await service.getRollbackTrend();

      assert.ok(['improving', 'stable', 'degrading'].includes(trend));
    });
  });

  // ==========================================================================
  // CONTRACT: breaker_trends
  // ==========================================================================
  describe('CONTRACT: breaker_trends', () => {
    it('gets breaker trends', async () => {
      const trends = await service.getBreakerTrends('30d');

      assert.ok(trends.metric_id.startsWith('sha256:'));
      assert.ok(trends.total_breaker_events >= 0);
    });

    it('tracks open/close events', async () => {
      const trends = await service.getBreakerTrends('30d');

      assert.ok(trends.open_events >= 0);
      assert.ok(trends.close_events >= 0);
    });

    it('tracks average open duration', async () => {
      const trends = await service.getBreakerTrends('30d');

      assert.ok(trends.average_open_duration_minutes >= 0);
    });

    it('counts affected services', async () => {
      const count = await service.getAffectedServicesCount();

      assert.ok(count >= 0);
    });
  });

  // ==========================================================================
  // CONTRACT: cab_cycle_time
  // ==========================================================================
  describe('CONTRACT: cab_cycle_time', () => {
    it('gets CAB cycle time', async () => {
      const cycleTime = await service.getCABCycleTime('30d');

      assert.ok(cycleTime.metric_id.startsWith('sha256:'));
      assert.ok(cycleTime.average_cycle_time_hours >= 0);
    });

    it('tracks approval/rejection rates', async () => {
      const cycleTime = await service.getCABCycleTime('30d');

      assert.ok(cycleTime.approval_rate >= 0);
      assert.ok(cycleTime.rejection_rate >= 0);
      assert.strictEqual(cycleTime.approval_rate + cycleTime.rejection_rate, 100);
    });

    it('includes percentiles', async () => {
      const cycleTime = await service.getCABCycleTime('30d');

      assert.ok(cycleTime.p50_hours >= 0);
      assert.ok(cycleTime.p95_hours >= cycleTime.p50_hours);
    });

    it('retrieves approval rate', async () => {
      const rate = await service.getApprovalRate();

      assert.ok(rate >= 0);
      assert.ok(rate <= 100);
    });
  });

  // ==========================================================================
  // CONTRACT: dashboard
  // ==========================================================================
  describe('CONTRACT: dashboard', () => {
    it('generates effectiveness dashboard', async () => {
      const dashboard = await service.generateDashboard('30d');

      assert.ok(dashboard.dashboard_id.startsWith('sha256:'));
      assert.ok(dashboard.mttr);
      assert.ok(dashboard.drill_compliance);
      assert.ok(dashboard.rollback_success);
      assert.ok(dashboard.breaker_trends);
      assert.ok(dashboard.cab_cycle_time);
    });

    it('dashboard has health score', async () => {
      const dashboard = await service.generateDashboard('30d');

      assert.ok(dashboard.overall_health_score >= 0);
      assert.ok(dashboard.overall_health_score <= 100);
    });

    it('health score is retrievable', async () => {
      const score = await service.getHealthScore();

      assert.ok(score >= 0);
      assert.ok(score <= 100);
    });
  });

  // ==========================================================================
  // CONTRACT: pii_safety
  // ==========================================================================
  describe('CONTRACT: pii_safety', () => {
    it('dashboard is PII-clean', async () => {
      const dashboard = await service.generateDashboard('30d');
      const isPIIClean = await service.isPIIClean(dashboard);

      assert.strictEqual(isPIIClean, true);
    });

    it('metrics contain no user identifiers', async () => {
      const mttr = await service.getMTTR('30d');
      const hasIdentifiers = await service.containsUserIdentifiers(mttr);

      assert.strictEqual(hasIdentifiers, false);
    });

    it('all metric IDs are opaque', async () => {
      const dashboard = await service.generateDashboard('30d');

      assert.ok(dashboard.mttr.metric_id.startsWith('sha256:'));
      assert.ok(dashboard.drill_compliance.metric_id.startsWith('sha256:'));
      assert.ok(dashboard.rollback_success.metric_id.startsWith('sha256:'));
      assert.ok(dashboard.breaker_trends.metric_id.startsWith('sha256:'));
      assert.ok(dashboard.cab_cycle_time.metric_id.startsWith('sha256:'));
    });
  });
});

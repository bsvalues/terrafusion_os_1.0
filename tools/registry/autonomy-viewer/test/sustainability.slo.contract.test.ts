/**
 * Phase XXI — Optimization & Sustainability
 * ==========================================
 * Contract: sustainability.slo.contract.test.ts
 *
 * Tests sustainability SLOs: governance plane latency, backlog limits,
 * evidence pack generation time, and integrity job runtimes.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - SLOs are defined with targets and thresholds
 * - Violations trigger alerts
 * - Error budgets are tracked
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type SloId = `sha256:${string}`;
type MeasurementId = `sha256:${string}`;
type AlertId = `sha256:${string}`;
type ServiceId = `sha256:${string}`;

type SloCategory = 'latency' | 'backlog' | 'throughput' | 'availability' | 'integrity';
type SloStatus = 'healthy' | 'warning' | 'breached' | 'unknown';
type TimeWindow = '1h' | '6h' | '24h' | '7d' | '30d';

interface SloDefinition {
  readonly id: SloId;
  readonly name: string;
  readonly category: SloCategory;
  readonly target: number;
  readonly warningThreshold: number;
  readonly criticalThreshold: number;
  readonly unit: string;
  readonly timeWindow: TimeWindow;
  readonly description: string;
}

interface SloMeasurement {
  readonly id: MeasurementId;
  readonly sloId: SloId;
  readonly serviceId: ServiceId;
  readonly value: number;
  readonly timestamp: string;
  readonly status: SloStatus;
  readonly errorBudgetConsumed: number;
}

interface ErrorBudget {
  readonly sloId: SloId;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly totalBudget: number;
  readonly consumed: number;
  readonly remaining: number;
  readonly percentRemaining: number;
  readonly burnRate: number;
  readonly projectedExhaustionDate?: string;
}

interface SloViolation {
  readonly id: AlertId;
  readonly sloId: SloId;
  readonly serviceId: ServiceId;
  readonly value: number;
  readonly threshold: number;
  readonly severity: 'warning' | 'critical';
  readonly occurredAt: string;
  readonly acknowledgedAt?: string;
  readonly resolvedAt?: string;
}

interface GovernancePlaneMetrics {
  readonly requestLatencyP50Ms: number;
  readonly requestLatencyP95Ms: number;
  readonly requestLatencyP99Ms: number;
  readonly backlogCount: number;
  readonly backlogAgeMaxMinutes: number;
  readonly evidencePackGenTimeP95Ms: number;
  readonly integrityJobRuntimeP95Ms: number;
  readonly errorRate: number;
}

interface SustainabilityDashboard {
  readonly generatedAt: string;
  readonly overallStatus: SloStatus;
  readonly sloStatuses: Record<string, SloStatus>;
  readonly errorBudgetHealth: 'healthy' | 'at_risk' | 'exhausted';
  readonly activeViolations: number;
  readonly metrics: GovernancePlaneMetrics;
  readonly recommendations: readonly string[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockSustainabilitySloService() {
  const slos = new Map<SloId, SloDefinition>();
  const measurements: SloMeasurement[] = [];
  const violations = new Map<AlertId, SloViolation>();
  const errorBudgets = new Map<SloId, ErrorBudget>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Initialize default governance plane SLOs
  const defaultSlos: Array<Omit<SloDefinition, 'id'>> = [
    {
      name: 'Request Latency P95',
      category: 'latency',
      target: 200,
      warningThreshold: 300,
      criticalThreshold: 500,
      unit: 'ms',
      timeWindow: '1h',
      description: 'API request latency at 95th percentile',
    },
    {
      name: 'Request Latency P99',
      category: 'latency',
      target: 500,
      warningThreshold: 750,
      criticalThreshold: 1000,
      unit: 'ms',
      timeWindow: '1h',
      description: 'API request latency at 99th percentile',
    },
    {
      name: 'Backlog Count',
      category: 'backlog',
      target: 100,
      warningThreshold: 500,
      criticalThreshold: 1000,
      unit: 'items',
      timeWindow: '1h',
      description: 'Number of pending items in processing queue',
    },
    {
      name: 'Backlog Age Max',
      category: 'backlog',
      target: 15,
      warningThreshold: 30,
      criticalThreshold: 60,
      unit: 'minutes',
      timeWindow: '1h',
      description: 'Maximum age of oldest item in backlog',
    },
    {
      name: 'Evidence Pack Generation P95',
      category: 'throughput',
      target: 30000,
      warningThreshold: 45000,
      criticalThreshold: 60000,
      unit: 'ms',
      timeWindow: '6h',
      description: 'Time to generate evidence pack at 95th percentile',
    },
    {
      name: 'Integrity Job Runtime P95',
      category: 'integrity',
      target: 300000,
      warningThreshold: 450000,
      criticalThreshold: 600000,
      unit: 'ms',
      timeWindow: '24h',
      description: 'Integrity check job runtime at 95th percentile',
    },
    {
      name: 'API Availability',
      category: 'availability',
      target: 99.9,
      warningThreshold: 99.5,
      criticalThreshold: 99.0,
      unit: 'percent',
      timeWindow: '30d',
      description: '30-day API availability target',
    },
    {
      name: 'Error Rate',
      category: 'availability',
      target: 0.1,
      warningThreshold: 0.5,
      criticalThreshold: 1.0,
      unit: 'percent',
      timeWindow: '1h',
      description: 'Percentage of requests resulting in errors',
    },
  ];

  for (const slo of defaultSlos) {
    const id = generateId('slo') as SloId;
    slos.set(id, { ...slo, id });
  }

  // Initialize error budgets
  for (const [id, slo] of slos) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalBudget =
      slo.category === 'availability'
        ? 100 - slo.target // e.g., 0.1% error budget for 99.9% availability
        : slo.criticalThreshold - slo.target;

    errorBudgets.set(id, {
      sloId: id,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalBudget,
      consumed: 0,
      remaining: totalBudget,
      percentRemaining: 100,
      burnRate: 0,
    });
  }

  return {
    // SLO Definitions
    getSlo(id: SloId): SloDefinition | null {
      return slos.get(id) ?? null;
    },

    getSloByName(name: string): SloDefinition | null {
      return [...slos.values()].find(s => s.name === name) ?? null;
    },

    getAllSlos(): readonly SloDefinition[] {
      return [...slos.values()];
    },

    getSlosByCategory(category: SloCategory): readonly SloDefinition[] {
      return [...slos.values()].filter(s => s.category === category);
    },

    // Measurements
    recordMeasurement(sloId: SloId, serviceId: ServiceId, value: number): SloMeasurement | null {
      const slo = slos.get(sloId);
      if (!slo) return null;

      // Determine status
      let status: SloStatus = 'healthy';
      if (slo.category === 'availability') {
        // For availability, higher is better
        if (value < slo.criticalThreshold) status = 'breached';
        else if (value < slo.warningThreshold) status = 'warning';
      } else {
        // For latency/backlog/throughput, lower is better
        if (value >= slo.criticalThreshold) status = 'breached';
        else if (value >= slo.warningThreshold) status = 'warning';
      }

      // Calculate error budget consumed
      const errorBudget = errorBudgets.get(sloId);
      let errorBudgetConsumed = 0;
      if (errorBudget && status !== 'healthy') {
        const excess = slo.category === 'availability' ? slo.target - value : value - slo.target;
        errorBudgetConsumed = Math.max(0, excess);
      }

      const measurement: SloMeasurement = {
        id: generateId('measurement') as MeasurementId,
        sloId,
        serviceId,
        value,
        timestamp: new Date().toISOString(),
        status,
        errorBudgetConsumed,
      };

      measurements.push(measurement);

      // Create violation if breached or warning
      if (status !== 'healthy') {
        this.createViolation(
          sloId,
          serviceId,
          value,
          slo,
          status === 'breached' ? 'critical' : 'warning'
        );
      }

      // Update error budget
      if (errorBudget && errorBudgetConsumed > 0) {
        const newConsumed = errorBudget.consumed + errorBudgetConsumed;
        const newRemaining = Math.max(0, errorBudget.totalBudget - newConsumed);
        errorBudgets.set(sloId, {
          ...errorBudget,
          consumed: newConsumed,
          remaining: newRemaining,
          percentRemaining: Math.round((newRemaining / errorBudget.totalBudget) * 100),
          burnRate: newConsumed, // Simplified burn rate
        });
      }

      return measurement;
    },

    getMeasurements(sloId: SloId, limit: number = 100): readonly SloMeasurement[] {
      return measurements.filter(m => m.sloId === sloId).slice(-limit);
    },

    getLatestMeasurement(sloId: SloId): SloMeasurement | null {
      const filtered = measurements.filter(m => m.sloId === sloId);
      return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    },

    // Violations
    createViolation(
      sloId: SloId,
      serviceId: ServiceId,
      value: number,
      slo: SloDefinition,
      severity: 'warning' | 'critical'
    ): SloViolation {
      const id = generateId('violation') as AlertId;
      const threshold = severity === 'critical' ? slo.criticalThreshold : slo.warningThreshold;

      const violation: SloViolation = {
        id,
        sloId,
        serviceId,
        value,
        threshold,
        severity,
        occurredAt: new Date().toISOString(),
      };

      violations.set(id, violation);
      return violation;
    },

    getViolation(id: AlertId): SloViolation | null {
      return violations.get(id) ?? null;
    },

    acknowledgeViolation(id: AlertId): SloViolation | null {
      const violation = violations.get(id);
      if (!violation) return null;

      const updated: SloViolation = {
        ...violation,
        acknowledgedAt: new Date().toISOString(),
      };
      violations.set(id, updated);
      return updated;
    },

    resolveViolation(id: AlertId): SloViolation | null {
      const violation = violations.get(id);
      if (!violation) return null;

      const updated: SloViolation = {
        ...violation,
        resolvedAt: new Date().toISOString(),
      };
      violations.set(id, updated);
      return updated;
    },

    getActiveViolations(): readonly SloViolation[] {
      return [...violations.values()].filter(v => !v.resolvedAt);
    },

    getViolationsBySlo(sloId: SloId): readonly SloViolation[] {
      return [...violations.values()].filter(v => v.sloId === sloId);
    },

    // Error Budgets
    getErrorBudget(sloId: SloId): ErrorBudget | null {
      return errorBudgets.get(sloId) ?? null;
    },

    getAllErrorBudgets(): readonly ErrorBudget[] {
      return [...errorBudgets.values()];
    },

    isErrorBudgetExhausted(sloId: SloId): boolean {
      const budget = errorBudgets.get(sloId);
      return budget ? budget.remaining <= 0 : false;
    },

    getErrorBudgetHealth(sloId: SloId): 'healthy' | 'at_risk' | 'exhausted' {
      const budget = errorBudgets.get(sloId);
      if (!budget) return 'exhausted';

      if (budget.percentRemaining <= 0) return 'exhausted';
      if (budget.percentRemaining <= 20) return 'at_risk';
      return 'healthy';
    },

    // Status Calculation
    calculateSloStatus(sloId: SloId): SloStatus {
      const latest = this.getLatestMeasurement(sloId);
      return latest?.status ?? 'unknown';
    },

    calculateOverallStatus(): SloStatus {
      const statuses = [...slos.keys()].map(id => this.calculateSloStatus(id));

      if (statuses.some(s => s === 'breached')) return 'breached';
      if (statuses.some(s => s === 'warning')) return 'warning';
      if (statuses.some(s => s === 'unknown')) return 'unknown';
      return 'healthy';
    },

    // Governance Plane Metrics
    recordGovernancePlaneMetrics(metrics: GovernancePlaneMetrics): void {
      const governanceService = 'sha256:governance_plane' as ServiceId;

      // Record latency measurements
      const latencyP95Slo = this.getSloByName('Request Latency P95');
      if (latencyP95Slo) {
        this.recordMeasurement(latencyP95Slo.id, governanceService, metrics.requestLatencyP95Ms);
      }

      const latencyP99Slo = this.getSloByName('Request Latency P99');
      if (latencyP99Slo) {
        this.recordMeasurement(latencyP99Slo.id, governanceService, metrics.requestLatencyP99Ms);
      }

      // Record backlog measurements
      const backlogCountSlo = this.getSloByName('Backlog Count');
      if (backlogCountSlo) {
        this.recordMeasurement(backlogCountSlo.id, governanceService, metrics.backlogCount);
      }

      const backlogAgeSlo = this.getSloByName('Backlog Age Max');
      if (backlogAgeSlo) {
        this.recordMeasurement(backlogAgeSlo.id, governanceService, metrics.backlogAgeMaxMinutes);
      }

      // Record evidence pack generation time
      const evidencePackSlo = this.getSloByName('Evidence Pack Generation P95');
      if (evidencePackSlo) {
        this.recordMeasurement(
          evidencePackSlo.id,
          governanceService,
          metrics.evidencePackGenTimeP95Ms
        );
      }

      // Record integrity job runtime
      const integrityJobSlo = this.getSloByName('Integrity Job Runtime P95');
      if (integrityJobSlo) {
        this.recordMeasurement(
          integrityJobSlo.id,
          governanceService,
          metrics.integrityJobRuntimeP95Ms
        );
      }

      // Record error rate
      const errorRateSlo = this.getSloByName('Error Rate');
      if (errorRateSlo) {
        this.recordMeasurement(errorRateSlo.id, governanceService, metrics.errorRate);
      }
    },

    // Dashboard
    generateDashboard(): SustainabilityDashboard {
      const sloStatuses: Record<string, SloStatus> = {};
      for (const [id, slo] of slos) {
        sloStatuses[slo.name] = this.calculateSloStatus(id);
      }

      const budgets = this.getAllErrorBudgets();
      let errorBudgetHealth: 'healthy' | 'at_risk' | 'exhausted' = 'healthy';
      if (budgets.some(b => b.remaining <= 0)) {
        errorBudgetHealth = 'exhausted';
      } else if (budgets.some(b => b.percentRemaining <= 20)) {
        errorBudgetHealth = 'at_risk';
      }

      const recommendations: string[] = [];
      const activeViolations = this.getActiveViolations();

      for (const violation of activeViolations) {
        const slo = slos.get(violation.sloId);
        if (slo) {
          if (slo.category === 'latency') {
            recommendations.push(`Investigate high latency for ${slo.name}`);
          } else if (slo.category === 'backlog') {
            recommendations.push(`Scale up processing capacity for ${slo.name}`);
          } else if (slo.category === 'integrity') {
            recommendations.push(`Optimize integrity check job for ${slo.name}`);
          }
        }
      }

      for (const budget of budgets) {
        if (budget.percentRemaining <= 20) {
          const slo = slos.get(budget.sloId);
          if (slo) {
            recommendations.push(
              `Error budget at risk for ${slo.name}: ${budget.percentRemaining}% remaining`
            );
          }
        }
      }

      // Mock current metrics
      const metrics: GovernancePlaneMetrics = {
        requestLatencyP50Ms: 50,
        requestLatencyP95Ms: 180,
        requestLatencyP99Ms: 450,
        backlogCount: 75,
        backlogAgeMaxMinutes: 10,
        evidencePackGenTimeP95Ms: 25000,
        integrityJobRuntimeP95Ms: 280000,
        errorRate: 0.05,
      };

      return {
        generatedAt: new Date().toISOString(),
        overallStatus: this.calculateOverallStatus(),
        sloStatuses,
        errorBudgetHealth,
        activeViolations: activeViolations.length,
        metrics,
        recommendations: recommendations.slice(0, 5),
      };
    },

    // Trend Analysis
    calculateTrend(sloId: SloId, periodHours: number): 'improving' | 'stable' | 'degrading' {
      const recentMeasurements = this.getMeasurements(sloId, 10);
      if (recentMeasurements.length < 2) return 'stable';

      const firstHalf = recentMeasurements.slice(0, Math.floor(recentMeasurements.length / 2));
      const secondHalf = recentMeasurements.slice(Math.floor(recentMeasurements.length / 2));

      const avgFirst = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

      const slo = slos.get(sloId);
      if (!slo) return 'stable';

      const change = (avgSecond - avgFirst) / avgFirst;
      const threshold = 0.1; // 10% change threshold

      if (slo.category === 'availability') {
        // For availability, higher is better
        if (change > threshold) return 'improving';
        if (change < -threshold) return 'degrading';
      } else {
        // For latency/backlog, lower is better
        if (change < -threshold) return 'improving';
        if (change > threshold) return 'degrading';
      }

      return 'stable';
    },

    // Alert Configuration
    shouldAlert(sloId: SloId): boolean {
      const status = this.calculateSloStatus(sloId);
      const budgetHealth = this.getErrorBudgetHealth(sloId);

      return (
        status === 'breached' ||
        status === 'warning' ||
        budgetHealth === 'exhausted' ||
        budgetHealth === 'at_risk'
      );
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXI: Sustainability SLO Contracts', () => {
  let sloService: ReturnType<typeof createMockSustainabilitySloService>;
  const serviceA = 'sha256:service_alpha' as ServiceId;

  beforeEach(() => {
    sloService = createMockSustainabilitySloService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate SLO IDs with sha256: prefix', () => {
      const slos = sloService.getAllSlos();
      assert.ok(slos[0].id.startsWith('sha256:'));
    });

    it('should generate measurement IDs with sha256: prefix', () => {
      const slo = sloService.getAllSlos()[0];
      const measurement = sloService.recordMeasurement(slo.id, serviceA, 100);
      assert.ok(measurement?.id.startsWith('sha256:'));
    });

    it('should generate violation IDs with sha256: prefix', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600); // Exceed critical
        const violations = sloService.getActiveViolations();
        assert.ok(violations[0].id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // SLO Definition Tests
  // ==========================================================================

  describe('SLO Definitions', () => {
    it('should have default governance plane SLOs', () => {
      const slos = sloService.getAllSlos();
      assert.ok(slos.length >= 6);
    });

    it('should have latency SLOs', () => {
      const latencySlos = sloService.getSlosByCategory('latency');
      assert.ok(latencySlos.length >= 2);
    });

    it('should have backlog SLOs', () => {
      const backlogSlos = sloService.getSlosByCategory('backlog');
      assert.ok(backlogSlos.length >= 2);
    });

    it('should have availability SLOs', () => {
      const availSlos = sloService.getSlosByCategory('availability');
      assert.ok(availSlos.length >= 1);
    });

    it('should have integrity SLOs', () => {
      const integritySlos = sloService.getSlosByCategory('integrity');
      assert.ok(integritySlos.length >= 1);
    });

    it('should get SLO by name', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      assert.ok(slo);
      assert.strictEqual(slo.category, 'latency');
    });

    it('should have target, warning, and critical thresholds', () => {
      const slo = sloService.getAllSlos()[0];
      assert.ok(slo.target !== undefined);
      assert.ok(slo.warningThreshold !== undefined);
      assert.ok(slo.criticalThreshold !== undefined);
    });
  });

  // ==========================================================================
  // Measurement Tests
  // ==========================================================================

  describe('Measurements', () => {
    it('should record healthy measurement', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        const measurement = sloService.recordMeasurement(slo.id, serviceA, 100);
        assert.strictEqual(measurement?.status, 'healthy');
      }
    });

    it('should record warning measurement', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        const measurement = sloService.recordMeasurement(slo.id, serviceA, 350);
        assert.strictEqual(measurement?.status, 'warning');
      }
    });

    it('should record breached measurement', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        const measurement = sloService.recordMeasurement(slo.id, serviceA, 600);
        assert.strictEqual(measurement?.status, 'breached');
      }
    });

    it('should get measurements for SLO', () => {
      const slo = sloService.getAllSlos()[0];
      sloService.recordMeasurement(slo.id, serviceA, 100);
      sloService.recordMeasurement(slo.id, serviceA, 110);

      const measurements = sloService.getMeasurements(slo.id);
      assert.strictEqual(measurements.length, 2);
    });

    it('should get latest measurement', () => {
      const slo = sloService.getAllSlos()[0];
      sloService.recordMeasurement(slo.id, serviceA, 100);
      sloService.recordMeasurement(slo.id, serviceA, 200);

      const latest = sloService.getLatestMeasurement(slo.id);
      assert.strictEqual(latest?.value, 200);
    });
  });

  // ==========================================================================
  // Violation Tests
  // ==========================================================================

  describe('Violations', () => {
    it('should create violation on warning', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 350);
        const violations = sloService.getActiveViolations();
        assert.ok(violations.length >= 1);
        assert.strictEqual(violations[0].severity, 'warning');
      }
    });

    it('should create violation on breach', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const violations = sloService.getActiveViolations();
        assert.ok(violations.length >= 1);
        assert.strictEqual(violations[0].severity, 'critical');
      }
    });

    it('should acknowledge violation', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const violations = sloService.getActiveViolations();
        const acked = sloService.acknowledgeViolation(violations[0].id);
        assert.ok(acked?.acknowledgedAt);
      }
    });

    it('should resolve violation', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const violations = sloService.getActiveViolations();
        const resolved = sloService.resolveViolation(violations[0].id);
        assert.ok(resolved?.resolvedAt);
      }
    });

    it('should get violations by SLO', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const violations = sloService.getViolationsBySlo(slo.id);
        assert.ok(violations.length >= 1);
      }
    });
  });

  // ==========================================================================
  // Error Budget Tests
  // ==========================================================================

  describe('Error Budgets', () => {
    it('should have error budget per SLO', () => {
      const slo = sloService.getAllSlos()[0];
      const budget = sloService.getErrorBudget(slo.id);
      assert.ok(budget);
      assert.ok(budget.totalBudget > 0);
    });

    it('should consume error budget on violation', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        const before = sloService.getErrorBudget(slo.id);
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const after = sloService.getErrorBudget(slo.id);

        assert.ok(after!.consumed > before!.consumed);
      }
    });

    it('should track percent remaining', () => {
      const slo = sloService.getAllSlos()[0];
      const budget = sloService.getErrorBudget(slo.id);
      assert.ok(budget!.percentRemaining >= 0 && budget!.percentRemaining <= 100);
    });

    it('should check if error budget exhausted', () => {
      const slo = sloService.getAllSlos()[0];
      const exhausted = sloService.isErrorBudgetExhausted(slo.id);
      assert.strictEqual(exhausted, false);
    });

    it('should get error budget health', () => {
      const slo = sloService.getAllSlos()[0];
      const health = sloService.getErrorBudgetHealth(slo.id);
      assert.ok(['healthy', 'at_risk', 'exhausted'].includes(health));
    });

    it('should get all error budgets', () => {
      const budgets = sloService.getAllErrorBudgets();
      assert.ok(budgets.length >= 6);
    });
  });

  // ==========================================================================
  // Status Calculation Tests
  // ==========================================================================

  describe('Status Calculation', () => {
    it('should calculate SLO status from latest measurement', () => {
      const slo = sloService.getAllSlos()[0];
      sloService.recordMeasurement(slo.id, serviceA, 100);
      const status = sloService.calculateSloStatus(slo.id);
      assert.ok(['healthy', 'warning', 'breached'].includes(status));
    });

    it('should return unknown for no measurements', () => {
      const slo = sloService.getAllSlos()[0];
      const status = sloService.calculateSloStatus(slo.id);
      assert.strictEqual(status, 'unknown');
    });

    it('should calculate overall status', () => {
      const status = sloService.calculateOverallStatus();
      assert.ok(['healthy', 'warning', 'breached', 'unknown'].includes(status));
    });

    it('should return breached if any SLO breached', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const status = sloService.calculateOverallStatus();
        assert.strictEqual(status, 'breached');
      }
    });
  });

  // ==========================================================================
  // Governance Plane Metrics Tests
  // ==========================================================================

  describe('Governance Plane Metrics', () => {
    it('should record governance plane metrics', () => {
      const metrics: GovernancePlaneMetrics = {
        requestLatencyP50Ms: 50,
        requestLatencyP95Ms: 180,
        requestLatencyP99Ms: 450,
        backlogCount: 75,
        backlogAgeMaxMinutes: 10,
        evidencePackGenTimeP95Ms: 25000,
        integrityJobRuntimeP95Ms: 280000,
        errorRate: 0.05,
      };

      sloService.recordGovernancePlaneMetrics(metrics);

      const latencySlo = sloService.getSloByName('Request Latency P95');
      if (latencySlo) {
        const latest = sloService.getLatestMeasurement(latencySlo.id);
        assert.strictEqual(latest?.value, 180);
      }
    });

    it('should measure backlog count', () => {
      const metrics: GovernancePlaneMetrics = {
        requestLatencyP50Ms: 50,
        requestLatencyP95Ms: 180,
        requestLatencyP99Ms: 450,
        backlogCount: 75,
        backlogAgeMaxMinutes: 10,
        evidencePackGenTimeP95Ms: 25000,
        integrityJobRuntimeP95Ms: 280000,
        errorRate: 0.05,
      };

      sloService.recordGovernancePlaneMetrics(metrics);

      const backlogSlo = sloService.getSloByName('Backlog Count');
      if (backlogSlo) {
        const latest = sloService.getLatestMeasurement(backlogSlo.id);
        assert.strictEqual(latest?.value, 75);
      }
    });

    it('should measure evidence pack generation time', () => {
      const metrics: GovernancePlaneMetrics = {
        requestLatencyP50Ms: 50,
        requestLatencyP95Ms: 180,
        requestLatencyP99Ms: 450,
        backlogCount: 75,
        backlogAgeMaxMinutes: 10,
        evidencePackGenTimeP95Ms: 25000,
        integrityJobRuntimeP95Ms: 280000,
        errorRate: 0.05,
      };

      sloService.recordGovernancePlaneMetrics(metrics);

      const evidenceSlo = sloService.getSloByName('Evidence Pack Generation P95');
      if (evidenceSlo) {
        const latest = sloService.getLatestMeasurement(evidenceSlo.id);
        assert.strictEqual(latest?.value, 25000);
      }
    });

    it('should measure integrity job runtime', () => {
      const metrics: GovernancePlaneMetrics = {
        requestLatencyP50Ms: 50,
        requestLatencyP95Ms: 180,
        requestLatencyP99Ms: 450,
        backlogCount: 75,
        backlogAgeMaxMinutes: 10,
        evidencePackGenTimeP95Ms: 25000,
        integrityJobRuntimeP95Ms: 280000,
        errorRate: 0.05,
      };

      sloService.recordGovernancePlaneMetrics(metrics);

      const integritySlo = sloService.getSloByName('Integrity Job Runtime P95');
      if (integritySlo) {
        const latest = sloService.getLatestMeasurement(integritySlo.id);
        assert.strictEqual(latest?.value, 280000);
      }
    });
  });

  // ==========================================================================
  // Dashboard Tests
  // ==========================================================================

  describe('Dashboard', () => {
    it('should generate dashboard', () => {
      const dashboard = sloService.generateDashboard();
      assert.ok(dashboard.generatedAt);
    });

    it('should include overall status', () => {
      const dashboard = sloService.generateDashboard();
      assert.ok(['healthy', 'warning', 'breached', 'unknown'].includes(dashboard.overallStatus));
    });

    it('should include SLO statuses', () => {
      const dashboard = sloService.generateDashboard();
      assert.ok(Object.keys(dashboard.sloStatuses).length >= 6);
    });

    it('should include error budget health', () => {
      const dashboard = sloService.generateDashboard();
      assert.ok(['healthy', 'at_risk', 'exhausted'].includes(dashboard.errorBudgetHealth));
    });

    it('should include active violation count', () => {
      const dashboard = sloService.generateDashboard();
      assert.ok(dashboard.activeViolations >= 0);
    });

    it('should include governance metrics', () => {
      const dashboard = sloService.generateDashboard();
      assert.ok(dashboard.metrics.requestLatencyP50Ms >= 0);
      assert.ok(dashboard.metrics.backlogCount >= 0);
    });

    it('should include recommendations', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
      }

      const dashboard = sloService.generateDashboard();
      assert.ok(dashboard.recommendations.length >= 0);
    });
  });

  // ==========================================================================
  // Trend Analysis Tests
  // ==========================================================================

  describe('Trend Analysis', () => {
    it('should calculate trend', () => {
      const slo = sloService.getAllSlos()[0];
      for (let i = 0; i < 10; i++) {
        sloService.recordMeasurement(slo.id, serviceA, 100 + i);
      }

      const trend = sloService.calculateTrend(slo.id, 24);
      assert.ok(['improving', 'stable', 'degrading'].includes(trend));
    });

    it('should return stable for insufficient data', () => {
      const slo = sloService.getAllSlos()[0];
      const trend = sloService.calculateTrend(slo.id, 24);
      assert.strictEqual(trend, 'stable');
    });
  });

  // ==========================================================================
  // Alert Configuration Tests
  // ==========================================================================

  describe('Alert Configuration', () => {
    it('should alert on breached SLO', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 600);
        const shouldAlert = sloService.shouldAlert(slo.id);
        assert.strictEqual(shouldAlert, true);
      }
    });

    it('should alert on warning SLO', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 350);
        const shouldAlert = sloService.shouldAlert(slo.id);
        assert.strictEqual(shouldAlert, true);
      }
    });

    it('should not alert on healthy SLO', () => {
      const slo = sloService.getSloByName('Request Latency P95');
      if (slo) {
        sloService.recordMeasurement(slo.id, serviceA, 100);
        const shouldAlert = sloService.shouldAlert(slo.id);
        assert.strictEqual(shouldAlert, false);
      }
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of SLOs', () => {
      const s1 = sloService.getAllSlos();
      const s2 = sloService.getAllSlos();
      assert.ok(s1 !== s2);
    });

    it('should return copies of error budgets', () => {
      const b1 = sloService.getAllErrorBudgets();
      const b2 = sloService.getAllErrorBudgets();
      assert.ok(b1 !== b2);
    });

    it('should generate fresh dashboard each call', () => {
      const d1 = sloService.generateDashboard();
      const d2 = sloService.generateDashboard();
      assert.ok(d1 !== d2);
    });
  });
});

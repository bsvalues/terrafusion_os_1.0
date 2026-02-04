/**
 * Phase XX — Live Adoption Rollout
 * =================================
 * Contract: kpi.targets.contract.test.ts
 *
 * Tests KPI definitions, thresholds, time windows, and reproducibility.
 * Covers MTTR, drill compliance, rollback success, exception rate,
 * and attestation freshness metrics.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - KPI definitions are versioned and auditable
 * - Time windows are reproducible
 * - Thresholds are policy-driven
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type KpiId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type SnapshotId = `sha256:${string}`;

type KpiCategory = 'reliability' | 'compliance' | 'operations' | 'security';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type TimeWindow = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type TrendDirection = 'improving' | 'stable' | 'degrading';

interface KpiDefinition {
  readonly id: KpiId;
  readonly name: string;
  readonly category: KpiCategory;
  readonly unit: string;
  readonly targetValue: number;
  readonly warningThreshold: number;
  readonly criticalThreshold: number;
  readonly higherIsBetter: boolean;
  readonly timeWindow: TimeWindow;
  readonly version: string;
}

interface KpiMeasurement {
  readonly kpiId: KpiId;
  readonly agencyId: AgencyId;
  readonly value: number;
  readonly measuredAt: string;
  readonly timeWindow: TimeWindow;
  readonly periodStart: string;
  readonly periodEnd: string;
}

interface KpiSnapshot {
  readonly id: SnapshotId;
  readonly agencyId: AgencyId;
  readonly generatedAt: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly measurements: readonly KpiMeasurement[];
  readonly overallScore: number;
  readonly trend: TrendDirection;
}

interface MttrMetrics {
  readonly bySeverity: Record<Severity, number>;
  readonly overall: number;
  readonly targetMet: boolean;
}

interface DrillComplianceMetrics {
  readonly drillsRequired: number;
  readonly drillsCompleted: number;
  readonly complianceRate: number;
  readonly participationRate: number;
}

interface RollbackMetrics {
  readonly totalRollbacks: number;
  readonly successfulRollbacks: number;
  readonly successRate: number;
}

interface ExceptionMetrics {
  readonly activeExceptions: number;
  readonly expiredExceptions: number;
  readonly exceptionRate: number;
  readonly avgDaysToExpiry: number;
}

interface AttestationMetrics {
  readonly totalAttestations: number;
  readonly validAttestations: number;
  readonly expiringSoon: number;
  readonly freshnessScore: number;
}

interface KpiDashboard {
  readonly generatedAt: string;
  readonly agencyId: AgencyId;
  readonly period: string;
  readonly mttr: MttrMetrics;
  readonly drillCompliance: DrillComplianceMetrics;
  readonly rollback: RollbackMetrics;
  readonly exceptions: ExceptionMetrics;
  readonly attestations: AttestationMetrics;
  readonly overallHealthScore: number;
  readonly targetsMet: number;
  readonly totalTargets: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockKpiTargetsService() {
  const definitions = new Map<KpiId, KpiDefinition>();
  const measurements: KpiMeasurement[] = [];
  const snapshots = new Map<SnapshotId, KpiSnapshot>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Initialize default KPI definitions
  const defaultKpis: Array<Omit<KpiDefinition, 'id'>> = [
    {
      name: 'MTTR Critical',
      category: 'reliability',
      unit: 'minutes',
      targetValue: 15,
      warningThreshold: 20,
      criticalThreshold: 30,
      higherIsBetter: false,
      timeWindow: 'weekly',
      version: '1.0.0',
    },
    {
      name: 'MTTR High',
      category: 'reliability',
      unit: 'minutes',
      targetValue: 60,
      warningThreshold: 90,
      criticalThreshold: 120,
      higherIsBetter: false,
      timeWindow: 'weekly',
      version: '1.0.0',
    },
    {
      name: 'Drill Compliance Rate',
      category: 'compliance',
      unit: 'percent',
      targetValue: 95,
      warningThreshold: 85,
      criticalThreshold: 70,
      higherIsBetter: true,
      timeWindow: 'quarterly',
      version: '1.0.0',
    },
    {
      name: 'Rollback Success Rate',
      category: 'operations',
      unit: 'percent',
      targetValue: 99,
      warningThreshold: 95,
      criticalThreshold: 90,
      higherIsBetter: true,
      timeWindow: 'monthly',
      version: '1.0.0',
    },
    {
      name: 'Exception Rate',
      category: 'compliance',
      unit: 'percent',
      targetValue: 5,
      warningThreshold: 10,
      criticalThreshold: 15,
      higherIsBetter: false,
      timeWindow: 'monthly',
      version: '1.0.0',
    },
    {
      name: 'Attestation Freshness',
      category: 'security',
      unit: 'percent',
      targetValue: 100,
      warningThreshold: 90,
      criticalThreshold: 80,
      higherIsBetter: true,
      timeWindow: 'monthly',
      version: '1.0.0',
    },
  ];

  for (const kpi of defaultKpis) {
    const id = generateId('kpi') as KpiId;
    definitions.set(id, { id, ...kpi });
  }

  return {
    // KPI Definition Management
    getKpiDefinition(id: KpiId): KpiDefinition | null {
      const def = definitions.get(id);
      return def ? { ...def } : null;
    },

    getAllKpiDefinitions(): readonly KpiDefinition[] {
      return [...definitions.values()].map(d => ({ ...d }));
    },

    getKpisByCategory(category: KpiCategory): readonly KpiDefinition[] {
      return [...definitions.values()].filter(d => d.category === category);
    },

    createKpiDefinition(
      name: string,
      category: KpiCategory,
      unit: string,
      targetValue: number,
      warningThreshold: number,
      criticalThreshold: number,
      higherIsBetter: boolean,
      timeWindow: TimeWindow
    ): KpiDefinition {
      const id = generateId('kpi') as KpiId;
      const definition: KpiDefinition = {
        id,
        name,
        category,
        unit,
        targetValue,
        warningThreshold,
        criticalThreshold,
        higherIsBetter,
        timeWindow,
        version: '1.0.0',
      };
      definitions.set(id, definition);
      return definition;
    },

    updateKpiThresholds(
      id: KpiId,
      targetValue: number,
      warningThreshold: number,
      criticalThreshold: number
    ): KpiDefinition | null {
      const def = definitions.get(id);
      if (!def) return null;

      const [major, minor, patch] = def.version.split('.').map(Number);
      const updated: KpiDefinition = {
        ...def,
        targetValue,
        warningThreshold,
        criticalThreshold,
        version: `${major}.${minor}.${patch + 1}`,
      };
      definitions.set(id, updated);
      return updated;
    },

    // Measurement Recording
    recordMeasurement(
      kpiId: KpiId,
      agencyId: AgencyId,
      value: number,
      periodStart: string,
      periodEnd: string
    ): KpiMeasurement | null {
      const def = definitions.get(kpiId);
      if (!def) return null;

      const measurement: KpiMeasurement = {
        kpiId,
        agencyId,
        value,
        measuredAt: new Date().toISOString(),
        timeWindow: def.timeWindow,
        periodStart,
        periodEnd,
      };
      measurements.push(measurement);
      return measurement;
    },

    getMeasurements(kpiId: KpiId, agencyId: AgencyId): readonly KpiMeasurement[] {
      return measurements.filter(m => m.kpiId === kpiId && m.agencyId === agencyId);
    },

    getMeasurementsInPeriod(
      agencyId: AgencyId,
      periodStart: string,
      periodEnd: string
    ): readonly KpiMeasurement[] {
      return measurements.filter(
        m => m.agencyId === agencyId && m.periodStart >= periodStart && m.periodEnd <= periodEnd
      );
    },

    // Threshold Evaluation
    evaluateMeasurement(
      kpiId: KpiId,
      value: number
    ): 'target' | 'warning' | 'critical' | 'unknown' {
      const def = definitions.get(kpiId);
      if (!def) return 'unknown';

      if (def.higherIsBetter) {
        if (value >= def.targetValue) return 'target';
        if (value >= def.warningThreshold) return 'warning';
        return 'critical';
      } else {
        if (value <= def.targetValue) return 'target';
        if (value <= def.warningThreshold) return 'warning';
        return 'critical';
      }
    },

    isTargetMet(kpiId: KpiId, value: number): boolean {
      return this.evaluateMeasurement(kpiId, value) === 'target';
    },

    // MTTR Calculation
    calculateMttr(
      incidents: readonly { severity: Severity; resolutionMinutes: number }[]
    ): MttrMetrics {
      const bySeverity: Record<Severity, { total: number; count: number }> = {
        critical: { total: 0, count: 0 },
        high: { total: 0, count: 0 },
        medium: { total: 0, count: 0 },
        low: { total: 0, count: 0 },
      };

      for (const incident of incidents) {
        bySeverity[incident.severity].total += incident.resolutionMinutes;
        bySeverity[incident.severity].count++;
      }

      const mttrBySeverity: Record<Severity, number> = {
        critical:
          bySeverity.critical.count > 0
            ? Math.round(bySeverity.critical.total / bySeverity.critical.count)
            : 0,
        high:
          bySeverity.high.count > 0 ? Math.round(bySeverity.high.total / bySeverity.high.count) : 0,
        medium:
          bySeverity.medium.count > 0
            ? Math.round(bySeverity.medium.total / bySeverity.medium.count)
            : 0,
        low: bySeverity.low.count > 0 ? Math.round(bySeverity.low.total / bySeverity.low.count) : 0,
      };

      const totalIncidents = incidents.length;
      const overall =
        totalIncidents > 0
          ? Math.round(incidents.reduce((sum, i) => sum + i.resolutionMinutes, 0) / totalIncidents)
          : 0;

      // Check against target (using default 15 min for critical, 60 for overall)
      const targetMet = mttrBySeverity.critical <= 15 && overall <= 60;

      return { bySeverity: mttrBySeverity, overall, targetMet };
    },

    // Drill Compliance Calculation
    calculateDrillCompliance(
      required: number,
      completed: number,
      totalParticipants: number,
      expectedParticipants: number
    ): DrillComplianceMetrics {
      return {
        drillsRequired: required,
        drillsCompleted: completed,
        complianceRate: required > 0 ? Math.round((completed / required) * 100) : 100,
        participationRate:
          expectedParticipants > 0
            ? Math.round((totalParticipants / expectedParticipants) * 100)
            : 100,
      };
    },

    // Rollback Metrics Calculation
    calculateRollbackMetrics(total: number, successful: number): RollbackMetrics {
      return {
        totalRollbacks: total,
        successfulRollbacks: successful,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 100,
      };
    },

    // Exception Metrics Calculation
    calculateExceptionMetrics(
      active: number,
      expired: number,
      total: number,
      avgDaysToExpiry: number
    ): ExceptionMetrics {
      return {
        activeExceptions: active,
        expiredExceptions: expired,
        exceptionRate: total > 0 ? Math.round(((active + expired) / total) * 100) : 0,
        avgDaysToExpiry,
      };
    },

    // Attestation Metrics Calculation
    calculateAttestationMetrics(
      total: number,
      valid: number,
      expiringSoon: number
    ): AttestationMetrics {
      return {
        totalAttestations: total,
        validAttestations: valid,
        expiringSoon,
        freshnessScore: total > 0 ? Math.round((valid / total) * 100) : 100,
      };
    },

    // Trend Analysis
    calculateTrend(
      currentValue: number,
      previousValue: number,
      higherIsBetter: boolean
    ): TrendDirection {
      const threshold = 0.05; // 5% change threshold
      const change = previousValue !== 0 ? (currentValue - previousValue) / previousValue : 0;

      if (Math.abs(change) < threshold) return 'stable';

      if (higherIsBetter) {
        return change > 0 ? 'improving' : 'degrading';
      } else {
        return change < 0 ? 'improving' : 'degrading';
      }
    },

    // Snapshot Generation
    generateSnapshot(agencyId: AgencyId, periodStart: string, periodEnd: string): KpiSnapshot {
      const periodMeasurements = this.getMeasurementsInPeriod(agencyId, periodStart, periodEnd);

      let targetsMet = 0;
      let totalEvaluated = 0;

      for (const m of periodMeasurements) {
        if (this.isTargetMet(m.kpiId, m.value)) {
          targetsMet++;
        }
        totalEvaluated++;
      }

      const overallScore =
        totalEvaluated > 0 ? Math.round((targetsMet / totalEvaluated) * 100) : 100;

      const id = generateId('snapshot') as SnapshotId;
      const snapshot: KpiSnapshot = {
        id,
        agencyId,
        generatedAt: new Date().toISOString(),
        periodStart,
        periodEnd,
        measurements: periodMeasurements,
        overallScore,
        trend: 'stable', // Would compare to previous period in real impl
      };
      snapshots.set(id, snapshot);
      return snapshot;
    },

    getSnapshot(id: SnapshotId): KpiSnapshot | null {
      return snapshots.get(id) ?? null;
    },

    getSnapshotsByAgency(agencyId: AgencyId): readonly KpiSnapshot[] {
      return [...snapshots.values()].filter(s => s.agencyId === agencyId);
    },

    // Dashboard Generation
    generateDashboard(
      agencyId: AgencyId,
      period: string,
      mttrData: readonly { severity: Severity; resolutionMinutes: number }[],
      drillData: { required: number; completed: number; participants: number; expected: number },
      rollbackData: { total: number; successful: number },
      exceptionData: { active: number; expired: number; total: number; avgDays: number },
      attestationData: { total: number; valid: number; expiring: number }
    ): KpiDashboard {
      const mttr = this.calculateMttr(mttrData);
      const drillCompliance = this.calculateDrillCompliance(
        drillData.required,
        drillData.completed,
        drillData.participants,
        drillData.expected
      );
      const rollback = this.calculateRollbackMetrics(rollbackData.total, rollbackData.successful);
      const exceptions = this.calculateExceptionMetrics(
        exceptionData.active,
        exceptionData.expired,
        exceptionData.total,
        exceptionData.avgDays
      );
      const attestations = this.calculateAttestationMetrics(
        attestationData.total,
        attestationData.valid,
        attestationData.expiring
      );

      // Count targets met
      let targetsMet = 0;
      const totalTargets = 5;

      if (mttr.targetMet) targetsMet++;
      if (drillCompliance.complianceRate >= 95) targetsMet++;
      if (rollback.successRate >= 99) targetsMet++;
      if (exceptions.exceptionRate <= 5) targetsMet++;
      if (attestations.freshnessScore >= 100) targetsMet++;

      const overallHealthScore = Math.round((targetsMet / totalTargets) * 100);

      return {
        generatedAt: new Date().toISOString(),
        agencyId,
        period,
        mttr,
        drillCompliance,
        rollback,
        exceptions,
        attestations,
        overallHealthScore,
        targetsMet,
        totalTargets,
      };
    },

    // Time Window Utilities
    getTimeWindowBounds(
      window: TimeWindow,
      referenceDate: Date = new Date()
    ): {
      start: string;
      end: string;
    } {
      const end = new Date(referenceDate);
      let start: Date;

      switch (window) {
        case 'daily':
          start = new Date(end);
          start.setDate(start.getDate() - 1);
          break;
        case 'weekly':
          start = new Date(end);
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start = new Date(end);
          start.setMonth(start.getMonth() - 1);
          break;
        case 'quarterly':
          start = new Date(end);
          start.setMonth(start.getMonth() - 3);
          break;
      }

      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    },

    // Reproducibility: Re-run calculation with same inputs
    reproduceMeasurement(
      kpiId: KpiId,
      agencyId: AgencyId,
      periodStart: string,
      periodEnd: string
    ): { original: KpiMeasurement | null; reproduced: boolean } {
      const original = measurements.find(
        m =>
          m.kpiId === kpiId &&
          m.agencyId === agencyId &&
          m.periodStart === periodStart &&
          m.periodEnd === periodEnd
      );

      // In real impl, would re-fetch source data and recalculate
      // For mock, just verify measurement exists and is reproducible
      return {
        original: original ?? null,
        reproduced: original !== undefined,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XX: KPI Targets Contracts', () => {
  let kpis: ReturnType<typeof createMockKpiTargetsService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;

  beforeEach(() => {
    kpis = createMockKpiTargetsService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate KPI IDs with sha256: prefix', () => {
      const kpi = kpis.createKpiDefinition(
        'Test KPI',
        'reliability',
        'count',
        10,
        15,
        20,
        false,
        'weekly'
      );
      assert.ok(kpi.id.startsWith('sha256:'));
    });

    it('should generate snapshot IDs with sha256: prefix', () => {
      const snapshot = kpis.generateSnapshot(agencyA, '2026-01-01', '2026-01-31');
      assert.ok(snapshot.id.startsWith('sha256:'));
    });

    it('should use opaque agency IDs', () => {
      const snapshot = kpis.generateSnapshot(agencyA, '2026-01-01', '2026-01-31');
      assert.ok(snapshot.agencyId.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // KPI Definition Tests
  // ==========================================================================

  describe('KPI Definitions', () => {
    it('should have default KPI definitions', () => {
      const defs = kpis.getAllKpiDefinitions();
      assert.ok(defs.length >= 6);
    });

    it('should get KPIs by category', () => {
      const reliability = kpis.getKpisByCategory('reliability');
      assert.ok(reliability.length >= 2);
      assert.ok(reliability.every(k => k.category === 'reliability'));
    });

    it('should create custom KPI definition', () => {
      const kpi = kpis.createKpiDefinition(
        'Custom Metric',
        'operations',
        'count',
        100,
        80,
        50,
        true,
        'monthly'
      );
      assert.strictEqual(kpi.name, 'Custom Metric');
      assert.strictEqual(kpi.version, '1.0.0');
    });

    it('should update thresholds and increment version', () => {
      const kpi = kpis.createKpiDefinition(
        'Test',
        'reliability',
        'ms',
        100,
        150,
        200,
        false,
        'weekly'
      );
      const updated = kpis.updateKpiThresholds(kpi.id, 90, 140, 190);
      assert.strictEqual(updated?.version, '1.0.1');
      assert.strictEqual(updated?.targetValue, 90);
    });
  });

  // ==========================================================================
  // Measurement Tests
  // ==========================================================================

  describe('Measurements', () => {
    it('should record measurement', () => {
      const defs = kpis.getAllKpiDefinitions();
      const kpiId = defs[0].id;
      const measurement = kpis.recordMeasurement(kpiId, agencyA, 50, '2026-01-01', '2026-01-07');
      assert.ok(measurement);
      assert.strictEqual(measurement.value, 50);
    });

    it('should get measurements by KPI and agency', () => {
      const defs = kpis.getAllKpiDefinitions();
      const kpiId = defs[0].id;
      kpis.recordMeasurement(kpiId, agencyA, 50, '2026-01-01', '2026-01-07');
      kpis.recordMeasurement(kpiId, agencyA, 45, '2026-01-08', '2026-01-14');

      const measurements = kpis.getMeasurements(kpiId, agencyA);
      assert.strictEqual(measurements.length, 2);
    });

    it('should get measurements in period', () => {
      const defs = kpis.getAllKpiDefinitions();
      kpis.recordMeasurement(defs[0].id, agencyA, 50, '2026-01-01', '2026-01-07');
      kpis.recordMeasurement(defs[1].id, agencyA, 60, '2026-01-01', '2026-01-07');

      const measurements = kpis.getMeasurementsInPeriod(agencyA, '2026-01-01', '2026-01-07');
      assert.strictEqual(measurements.length, 2);
    });
  });

  // ==========================================================================
  // Threshold Evaluation Tests
  // ==========================================================================

  describe('Threshold Evaluation', () => {
    it('should evaluate target met (lower is better)', () => {
      const kpi = kpis.createKpiDefinition(
        'MTTR Test',
        'reliability',
        'minutes',
        15,
        20,
        30,
        false,
        'weekly'
      );
      const result = kpis.evaluateMeasurement(kpi.id, 10);
      assert.strictEqual(result, 'target');
    });

    it('should evaluate warning (lower is better)', () => {
      const kpi = kpis.createKpiDefinition(
        'MTTR Test',
        'reliability',
        'minutes',
        15,
        20,
        30,
        false,
        'weekly'
      );
      const result = kpis.evaluateMeasurement(kpi.id, 18);
      assert.strictEqual(result, 'warning');
    });

    it('should evaluate critical (lower is better)', () => {
      const kpi = kpis.createKpiDefinition(
        'MTTR Test',
        'reliability',
        'minutes',
        15,
        20,
        30,
        false,
        'weekly'
      );
      const result = kpis.evaluateMeasurement(kpi.id, 25);
      assert.strictEqual(result, 'critical');
    });

    it('should evaluate target met (higher is better)', () => {
      const kpi = kpis.createKpiDefinition(
        'Success Rate',
        'operations',
        'percent',
        99,
        95,
        90,
        true,
        'weekly'
      );
      const result = kpis.evaluateMeasurement(kpi.id, 100);
      assert.strictEqual(result, 'target');
    });

    it('should check if target is met', () => {
      const kpi = kpis.createKpiDefinition(
        'Test',
        'reliability',
        'ms',
        100,
        150,
        200,
        false,
        'weekly'
      );
      assert.strictEqual(kpis.isTargetMet(kpi.id, 90), true);
      assert.strictEqual(kpis.isTargetMet(kpi.id, 120), false);
    });
  });

  // ==========================================================================
  // MTTR Calculation Tests
  // ==========================================================================

  describe('MTTR Calculation', () => {
    it('should calculate MTTR by severity', () => {
      const incidents = [
        { severity: 'critical' as Severity, resolutionMinutes: 10 },
        { severity: 'critical' as Severity, resolutionMinutes: 20 },
        { severity: 'high' as Severity, resolutionMinutes: 45 },
      ];
      const mttr = kpis.calculateMttr(incidents);
      assert.strictEqual(mttr.bySeverity.critical, 15);
      assert.strictEqual(mttr.bySeverity.high, 45);
    });

    it('should calculate overall MTTR', () => {
      const incidents = [
        { severity: 'critical' as Severity, resolutionMinutes: 10 },
        { severity: 'high' as Severity, resolutionMinutes: 50 },
      ];
      const mttr = kpis.calculateMttr(incidents);
      assert.strictEqual(mttr.overall, 30);
    });

    it('should check if MTTR target is met', () => {
      const goodIncidents = [{ severity: 'critical' as Severity, resolutionMinutes: 10 }];
      const mttr = kpis.calculateMttr(goodIncidents);
      assert.strictEqual(mttr.targetMet, true);
    });

    it('should handle empty incidents', () => {
      const mttr = kpis.calculateMttr([]);
      assert.strictEqual(mttr.overall, 0);
    });
  });

  // ==========================================================================
  // Drill Compliance Tests
  // ==========================================================================

  describe('Drill Compliance Calculation', () => {
    it('should calculate compliance rate', () => {
      const metrics = kpis.calculateDrillCompliance(4, 4, 100, 100);
      assert.strictEqual(metrics.complianceRate, 100);
    });

    it('should calculate participation rate', () => {
      const metrics = kpis.calculateDrillCompliance(4, 4, 80, 100);
      assert.strictEqual(metrics.participationRate, 80);
    });

    it('should handle partial completion', () => {
      const metrics = kpis.calculateDrillCompliance(4, 2, 50, 100);
      assert.strictEqual(metrics.complianceRate, 50);
    });
  });

  // ==========================================================================
  // Rollback Metrics Tests
  // ==========================================================================

  describe('Rollback Metrics', () => {
    it('should calculate success rate', () => {
      const metrics = kpis.calculateRollbackMetrics(10, 9);
      assert.strictEqual(metrics.successRate, 90);
    });

    it('should handle zero rollbacks', () => {
      const metrics = kpis.calculateRollbackMetrics(0, 0);
      assert.strictEqual(metrics.successRate, 100);
    });

    it('should handle all successful', () => {
      const metrics = kpis.calculateRollbackMetrics(5, 5);
      assert.strictEqual(metrics.successRate, 100);
    });
  });

  // ==========================================================================
  // Exception Metrics Tests
  // ==========================================================================

  describe('Exception Metrics', () => {
    it('should calculate exception rate', () => {
      const metrics = kpis.calculateExceptionMetrics(5, 2, 100, 30);
      assert.strictEqual(metrics.exceptionRate, 7);
    });

    it('should track average days to expiry', () => {
      const metrics = kpis.calculateExceptionMetrics(5, 0, 100, 45);
      assert.strictEqual(metrics.avgDaysToExpiry, 45);
    });
  });

  // ==========================================================================
  // Attestation Metrics Tests
  // ==========================================================================

  describe('Attestation Metrics', () => {
    it('should calculate freshness score', () => {
      const metrics = kpis.calculateAttestationMetrics(10, 9, 1);
      assert.strictEqual(metrics.freshnessScore, 90);
    });

    it('should track expiring soon', () => {
      const metrics = kpis.calculateAttestationMetrics(10, 10, 3);
      assert.strictEqual(metrics.expiringSoon, 3);
    });

    it('should handle all valid', () => {
      const metrics = kpis.calculateAttestationMetrics(10, 10, 0);
      assert.strictEqual(metrics.freshnessScore, 100);
    });
  });

  // ==========================================================================
  // Trend Analysis Tests
  // ==========================================================================

  describe('Trend Analysis', () => {
    it('should detect improving trend (higher is better)', () => {
      const trend = kpis.calculateTrend(100, 90, true);
      assert.strictEqual(trend, 'improving');
    });

    it('should detect degrading trend (higher is better)', () => {
      const trend = kpis.calculateTrend(80, 90, true);
      assert.strictEqual(trend, 'degrading');
    });

    it('should detect improving trend (lower is better)', () => {
      const trend = kpis.calculateTrend(10, 15, false);
      assert.strictEqual(trend, 'improving');
    });

    it('should detect stable trend', () => {
      const trend = kpis.calculateTrend(100, 99, true);
      assert.strictEqual(trend, 'stable');
    });
  });

  // ==========================================================================
  // Snapshot Tests
  // ==========================================================================

  describe('Snapshot Generation', () => {
    it('should generate snapshot', () => {
      const snapshot = kpis.generateSnapshot(agencyA, '2026-01-01', '2026-01-31');
      assert.ok(snapshot.generatedAt);
      assert.strictEqual(snapshot.agencyId, agencyA);
    });

    it('should include measurements in snapshot', () => {
      const defs = kpis.getAllKpiDefinitions();
      kpis.recordMeasurement(defs[0].id, agencyA, 50, '2026-01-01', '2026-01-31');

      const snapshot = kpis.generateSnapshot(agencyA, '2026-01-01', '2026-01-31');
      assert.strictEqual(snapshot.measurements.length, 1);
    });

    it('should calculate overall score', () => {
      const defs = kpis.getAllKpiDefinitions();
      // Record a passing measurement
      kpis.recordMeasurement(defs[0].id, agencyA, 10, '2026-01-01', '2026-01-31');

      const snapshot = kpis.generateSnapshot(agencyA, '2026-01-01', '2026-01-31');
      assert.ok(snapshot.overallScore >= 0);
    });
  });

  // ==========================================================================
  // Dashboard Tests
  // ==========================================================================

  describe('Dashboard Generation', () => {
    it('should generate dashboard', () => {
      const dashboard = kpis.generateDashboard(
        agencyA,
        'Q1 2026',
        [{ severity: 'critical', resolutionMinutes: 10 }],
        { required: 4, completed: 4, participants: 100, expected: 100 },
        { total: 10, successful: 10 },
        { active: 2, expired: 0, total: 100, avgDays: 30 },
        { total: 10, valid: 10, expiring: 0 }
      );
      assert.ok(dashboard.generatedAt);
      assert.strictEqual(dashboard.agencyId, agencyA);
    });

    it('should count targets met', () => {
      const dashboard = kpis.generateDashboard(
        agencyA,
        'Q1 2026',
        [{ severity: 'critical', resolutionMinutes: 10 }], // MTTR met
        { required: 4, completed: 4, participants: 100, expected: 100 }, // Drill met
        { total: 10, successful: 10 }, // Rollback met (100%)
        { active: 2, expired: 0, total: 100, avgDays: 30 }, // Exception met (2%)
        { total: 10, valid: 10, expiring: 0 } // Attestation met
      );
      assert.strictEqual(dashboard.targetsMet, 5);
      assert.strictEqual(dashboard.totalTargets, 5);
    });

    it('should calculate overall health score', () => {
      const dashboard = kpis.generateDashboard(
        agencyA,
        'Q1 2026',
        [{ severity: 'critical', resolutionMinutes: 10 }],
        { required: 4, completed: 4, participants: 100, expected: 100 },
        { total: 10, successful: 10 },
        { active: 2, expired: 0, total: 100, avgDays: 30 },
        { total: 10, valid: 10, expiring: 0 }
      );
      assert.strictEqual(dashboard.overallHealthScore, 100);
    });
  });

  // ==========================================================================
  // Time Window Tests
  // ==========================================================================

  describe('Time Window Utilities', () => {
    it('should calculate daily bounds', () => {
      const bounds = kpis.getTimeWindowBounds('daily');
      assert.ok(bounds.start);
      assert.ok(bounds.end);
    });

    it('should calculate weekly bounds', () => {
      const ref = new Date('2026-01-15');
      const bounds = kpis.getTimeWindowBounds('weekly', ref);
      assert.ok(new Date(bounds.start) < new Date(bounds.end));
    });

    it('should calculate monthly bounds', () => {
      const bounds = kpis.getTimeWindowBounds('monthly');
      assert.ok(bounds.start);
    });

    it('should calculate quarterly bounds', () => {
      const bounds = kpis.getTimeWindowBounds('quarterly');
      assert.ok(bounds.start);
    });
  });

  // ==========================================================================
  // Reproducibility Tests
  // ==========================================================================

  describe('Reproducibility', () => {
    it('should verify measurement reproducibility', () => {
      const defs = kpis.getAllKpiDefinitions();
      kpis.recordMeasurement(defs[0].id, agencyA, 50, '2026-01-01', '2026-01-07');

      const result = kpis.reproduceMeasurement(defs[0].id, agencyA, '2026-01-01', '2026-01-07');
      assert.strictEqual(result.reproduced, true);
      assert.ok(result.original);
    });

    it('should indicate non-reproducible for missing measurement', () => {
      // Fresh service with no recorded measurements
      const freshKpis = createMockKpiTargetsService();
      const defs = freshKpis.getAllKpiDefinitions();
      const result = freshKpis.reproduceMeasurement(
        defs[0].id,
        agencyA,
        '2026-01-01',
        '2026-01-07'
      );
      assert.strictEqual(result.reproduced, false);
      assert.strictEqual(result.original, null);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of definitions', () => {
      const d1 = kpis.getAllKpiDefinitions();
      const d2 = kpis.getAllKpiDefinitions();
      assert.ok(d1 !== d2);
    });

    it('should return copy of single definition', () => {
      const defs = kpis.getAllKpiDefinitions();
      const d1 = kpis.getKpiDefinition(defs[0].id);
      const d2 = kpis.getKpiDefinition(defs[0].id);
      assert.ok(d1 !== d2);
    });
  });
});

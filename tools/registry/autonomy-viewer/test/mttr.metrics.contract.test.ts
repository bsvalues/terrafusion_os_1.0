/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: mttr.metrics.contract.test.ts
 *
 * Tests Mean Time To Recovery (MTTR) metrics collection,
 * SLA threshold validation, and reproducibility requirements.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Metrics must be deterministically reproducible
 * - SLA thresholds are contract-defined
 * - All metric events are timestamped and auditable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type MetricId = `sha256:${string}`;
type IncidentId = `sha256:${string}`;
type GameDayId = `sha256:${string}`;

type MetricPhase =
  | 'detection'
  | 'acknowledgment'
  | 'diagnosis'
  | 'mitigation'
  | 'resolution'
  | 'verification';
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
type SLAStatus = 'within_sla' | 'at_risk' | 'breached';

interface TimeMarker {
  readonly phase: MetricPhase;
  readonly timestamp: string;
  readonly actor?: string;
  readonly notes?: string;
}

interface MTTRMetric {
  readonly id: MetricId;
  readonly incidentId: IncidentId;
  readonly gameDayId?: GameDayId;
  readonly severity: SeverityLevel;
  readonly startTime: string;
  readonly endTime?: string;
  readonly timeMarkers: readonly TimeMarker[];
  readonly totalDurationMs?: number;
  readonly phases: {
    readonly detectionMs?: number;
    readonly acknowledgmentMs?: number;
    readonly diagnosisMs?: number;
    readonly mitigationMs?: number;
    readonly resolutionMs?: number;
    readonly verificationMs?: number;
  };
  readonly slaStatus: SLAStatus;
  readonly slaThresholdMs: number;
}

interface SLAThresholds {
  readonly critical: number; // milliseconds
  readonly high: number;
  readonly medium: number;
  readonly low: number;
}

interface MetricAggregate {
  readonly period: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly incidentCount: number;
  readonly averageMttrMs: number;
  readonly p50MttrMs: number;
  readonly p95MttrMs: number;
  readonly p99MttrMs: number;
  readonly withinSlaCount: number;
  readonly atRiskCount: number;
  readonly breachedCount: number;
  readonly slaComplianceRate: number;
  readonly bySeverity: Record<
    SeverityLevel,
    {
      count: number;
      averageMttrMs: number;
      slaComplianceRate: number;
    }
  >;
}

interface TrendAnalysis {
  readonly periods: readonly string[];
  readonly mttrTrend: 'improving' | 'stable' | 'degrading';
  readonly slaComplianceTrend: 'improving' | 'stable' | 'degrading';
  readonly averageMttrByPeriod: readonly number[];
  readonly complianceByPeriod: readonly number[];
  readonly projectedMttrMs?: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockMTTRService() {
  const metrics = new Map<MetricId, MTTRMetric>();

  const defaultSLAThresholds: SLAThresholds = {
    critical: 15 * 60 * 1000, // 15 minutes
    high: 60 * 60 * 1000, // 1 hour
    medium: 4 * 60 * 60 * 1000, // 4 hours
    low: 24 * 60 * 60 * 1000, // 24 hours
  };

  function generateId(prefix: string): MetricId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as MetricId;
  }

  function getSLAThreshold(severity: SeverityLevel): number {
    return defaultSLAThresholds[severity];
  }

  function calculateSLAStatus(durationMs: number, severity: SeverityLevel): SLAStatus {
    const threshold = getSLAThreshold(severity);
    if (durationMs <= threshold * 0.8) return 'within_sla';
    if (durationMs <= threshold) return 'at_risk';
    return 'breached';
  }

  function calculatePhaseDuration(
    markers: readonly TimeMarker[],
    startPhase: MetricPhase,
    endPhase: MetricPhase
  ): number | undefined {
    const startMarker = markers.find(m => m.phase === startPhase);
    const endMarker = markers.find(m => m.phase === endPhase);
    if (!startMarker || !endMarker) return undefined;
    return new Date(endMarker.timestamp).getTime() - new Date(startMarker.timestamp).getTime();
  }

  return {
    // SLA Configuration
    getSLAThresholds(): SLAThresholds {
      return { ...defaultSLAThresholds };
    },

    getSLAThreshold(severity: SeverityLevel): number {
      return getSLAThreshold(severity);
    },

    // Metric Lifecycle
    startTracking(
      incidentId: IncidentId,
      severity: SeverityLevel,
      gameDayId?: GameDayId
    ): MTTRMetric {
      const id = generateId('mttr');
      const startTime = new Date().toISOString();
      const metric: MTTRMetric = {
        id,
        incidentId,
        gameDayId,
        severity,
        startTime,
        timeMarkers: [{ phase: 'detection', timestamp: startTime }],
        phases: {},
        slaStatus: 'within_sla',
        slaThresholdMs: getSLAThreshold(severity),
      };
      metrics.set(id, metric);
      return metric;
    },

    recordMarker(
      metricId: MetricId,
      phase: MetricPhase,
      actor?: string,
      notes?: string
    ): MTTRMetric | null {
      const metric = metrics.get(metricId);
      if (!metric) return null;

      // Prevent duplicate phases
      if (metric.timeMarkers.some(m => m.phase === phase)) {
        return null;
      }

      const marker: TimeMarker = {
        phase,
        timestamp: new Date().toISOString(),
        actor,
        notes,
      };

      const updated: MTTRMetric = {
        ...metric,
        timeMarkers: [...metric.timeMarkers, marker],
      };
      metrics.set(metricId, updated);
      return updated;
    },

    completeTracking(metricId: MetricId): MTTRMetric | null {
      const metric = metrics.get(metricId);
      if (!metric || metric.endTime) return null;

      const endTime = new Date().toISOString();
      const totalDurationMs = new Date(endTime).getTime() - new Date(metric.startTime).getTime();
      const slaStatus = calculateSLAStatus(totalDurationMs, metric.severity);

      // Ensure verification marker exists
      let markers = [...metric.timeMarkers];
      if (!markers.some(m => m.phase === 'verification')) {
        markers.push({ phase: 'verification', timestamp: endTime });
      }

      // Calculate phase durations
      const phases = {
        detectionMs: calculatePhaseDuration(markers, 'detection', 'acknowledgment'),
        acknowledgmentMs: calculatePhaseDuration(markers, 'acknowledgment', 'diagnosis'),
        diagnosisMs: calculatePhaseDuration(markers, 'diagnosis', 'mitigation'),
        mitigationMs: calculatePhaseDuration(markers, 'mitigation', 'resolution'),
        resolutionMs: calculatePhaseDuration(markers, 'resolution', 'verification'),
      };

      const updated: MTTRMetric = {
        ...metric,
        endTime,
        timeMarkers: markers,
        totalDurationMs,
        phases,
        slaStatus,
      };
      metrics.set(metricId, updated);
      return updated;
    },

    // Queries
    getMetric(id: MetricId): MTTRMetric | null {
      return metrics.get(id) ?? null;
    },

    getMetricsByIncident(incidentId: IncidentId): readonly MTTRMetric[] {
      return [...metrics.values()].filter(m => m.incidentId === incidentId);
    },

    getMetricsByGameDay(gameDayId: GameDayId): readonly MTTRMetric[] {
      return [...metrics.values()].filter(m => m.gameDayId === gameDayId);
    },

    getMetricsBySeverity(severity: SeverityLevel): readonly MTTRMetric[] {
      return [...metrics.values()].filter(m => m.severity === severity);
    },

    getCompletedMetrics(): readonly MTTRMetric[] {
      return [...metrics.values()].filter(m => m.endTime !== undefined);
    },

    // Aggregation
    calculateAggregate(period: string, startDate: string, endDate: string): MetricAggregate {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      const periodMetrics = [...metrics.values()].filter(m => {
        if (!m.endTime) return false;
        const metricTime = new Date(m.startTime).getTime();
        return metricTime >= start && metricTime <= end;
      });

      if (periodMetrics.length === 0) {
        return {
          period,
          startDate,
          endDate,
          incidentCount: 0,
          averageMttrMs: 0,
          p50MttrMs: 0,
          p95MttrMs: 0,
          p99MttrMs: 0,
          withinSlaCount: 0,
          atRiskCount: 0,
          breachedCount: 0,
          slaComplianceRate: 1,
          bySeverity: {
            critical: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
            high: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
            medium: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
            low: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
          },
        };
      }

      const durations = periodMetrics.map(m => m.totalDurationMs!).sort((a, b) => a - b);

      const sum = durations.reduce((a, b) => a + b, 0);
      const averageMttrMs = sum / durations.length;

      const p50Index = Math.floor(durations.length * 0.5);
      const p95Index = Math.floor(durations.length * 0.95);
      const p99Index = Math.floor(durations.length * 0.99);

      const withinSlaCount = periodMetrics.filter(m => m.slaStatus === 'within_sla').length;
      const atRiskCount = periodMetrics.filter(m => m.slaStatus === 'at_risk').length;
      const breachedCount = periodMetrics.filter(m => m.slaStatus === 'breached').length;

      // Calculate by severity
      const bySeverity: MetricAggregate['bySeverity'] = {
        critical: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
        high: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
        medium: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
        low: { count: 0, averageMttrMs: 0, slaComplianceRate: 1 },
      };

      (['critical', 'high', 'medium', 'low'] as SeverityLevel[]).forEach(sev => {
        const sevMetrics = periodMetrics.filter(m => m.severity === sev);
        if (sevMetrics.length > 0) {
          const sevDurations = sevMetrics.map(m => m.totalDurationMs!);
          const sevSum = sevDurations.reduce((a, b) => a + b, 0);
          const sevWithinSla = sevMetrics.filter(m => m.slaStatus !== 'breached').length;
          bySeverity[sev] = {
            count: sevMetrics.length,
            averageMttrMs: sevSum / sevMetrics.length,
            slaComplianceRate: sevWithinSla / sevMetrics.length,
          };
        }
      });

      return {
        period,
        startDate,
        endDate,
        incidentCount: periodMetrics.length,
        averageMttrMs,
        p50MttrMs: durations[p50Index] ?? 0,
        p95MttrMs: durations[p95Index] ?? durations[durations.length - 1],
        p99MttrMs: durations[p99Index] ?? durations[durations.length - 1],
        withinSlaCount,
        atRiskCount,
        breachedCount,
        slaComplianceRate: (withinSlaCount + atRiskCount) / periodMetrics.length,
        bySeverity,
      };
    },

    // Trend Analysis
    analyzeTrend(aggregates: readonly MetricAggregate[]): TrendAnalysis {
      if (aggregates.length < 2) {
        return {
          periods: aggregates.map(a => a.period),
          mttrTrend: 'stable',
          slaComplianceTrend: 'stable',
          averageMttrByPeriod: aggregates.map(a => a.averageMttrMs),
          complianceByPeriod: aggregates.map(a => a.slaComplianceRate),
        };
      }

      const mttrValues = aggregates.map(a => a.averageMttrMs);
      const complianceValues = aggregates.map(a => a.slaComplianceRate);

      // Simple linear regression for trend
      const mttrSlope = this.calculateSlope(mttrValues);
      const complianceSlope = this.calculateSlope(complianceValues);

      let mttrTrend: TrendAnalysis['mttrTrend'] = 'stable';
      if (mttrSlope < -0.05) mttrTrend = 'improving';
      if (mttrSlope > 0.05) mttrTrend = 'degrading';

      let slaComplianceTrend: TrendAnalysis['slaComplianceTrend'] = 'stable';
      if (complianceSlope > 0.01) slaComplianceTrend = 'improving';
      if (complianceSlope < -0.01) slaComplianceTrend = 'degrading';

      // Project next MTTR
      const projectedMttrMs =
        mttrValues[mttrValues.length - 1] + mttrSlope * mttrValues[mttrValues.length - 1];

      return {
        periods: aggregates.map(a => a.period),
        mttrTrend,
        slaComplianceTrend,
        averageMttrByPeriod: mttrValues,
        complianceByPeriod: complianceValues,
        projectedMttrMs: Math.max(0, projectedMttrMs),
      };
    },

    calculateSlope(values: readonly number[]): number {
      if (values.length < 2) return 0;
      const n = values.length;
      const xMean = (n - 1) / 2;
      const yMean = values.reduce((a, b) => a + b, 0) / n;

      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - yMean);
        denominator += (i - xMean) ** 2;
      }

      return denominator === 0 ? 0 : numerator / denominator / yMean;
    },

    // Determinism helpers
    recalculateMetric(metricId: MetricId): MTTRMetric | null {
      const metric = metrics.get(metricId);
      if (!metric || !metric.endTime) return null;

      // Recalculate from timestamps - should produce identical results
      const totalDurationMs =
        new Date(metric.endTime).getTime() - new Date(metric.startTime).getTime();
      const slaStatus = calculateSLAStatus(totalDurationMs, metric.severity);

      const phases = {
        detectionMs: calculatePhaseDuration(metric.timeMarkers, 'detection', 'acknowledgment'),
        acknowledgmentMs: calculatePhaseDuration(metric.timeMarkers, 'acknowledgment', 'diagnosis'),
        diagnosisMs: calculatePhaseDuration(metric.timeMarkers, 'diagnosis', 'mitigation'),
        mitigationMs: calculatePhaseDuration(metric.timeMarkers, 'mitigation', 'resolution'),
        resolutionMs: calculatePhaseDuration(metric.timeMarkers, 'resolution', 'verification'),
      };

      return {
        ...metric,
        totalDurationMs,
        phases,
        slaStatus,
      };
    },

    // Validation
    validateMetricIntegrity(metricId: MetricId): { valid: boolean; errors: string[] } {
      const metric = metrics.get(metricId);
      if (!metric) return { valid: false, errors: ['Metric not found'] };

      const errors: string[] = [];

      // Check phase ordering
      const phaseOrder: MetricPhase[] = [
        'detection',
        'acknowledgment',
        'diagnosis',
        'mitigation',
        'resolution',
        'verification',
      ];
      let lastPhaseIndex = -1;
      for (const marker of metric.timeMarkers) {
        const currentIndex = phaseOrder.indexOf(marker.phase);
        if (currentIndex < lastPhaseIndex) {
          errors.push(`Phase ${marker.phase} is out of order`);
        }
        lastPhaseIndex = currentIndex;
      }

      // Check timestamp ordering
      let lastTimestamp = '';
      for (const marker of metric.timeMarkers) {
        if (lastTimestamp && marker.timestamp < lastTimestamp) {
          errors.push(`Timestamp for ${marker.phase} is before previous phase`);
        }
        lastTimestamp = marker.timestamp;
      }

      // Check duration calculation
      if (metric.endTime && metric.totalDurationMs !== undefined) {
        const expectedDuration =
          new Date(metric.endTime).getTime() - new Date(metric.startTime).getTime();
        if (Math.abs(expectedDuration - metric.totalDurationMs) > 1) {
          errors.push('Total duration does not match start/end times');
        }
      }

      return { valid: errors.length === 0, errors };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: MTTR Metrics Contracts', () => {
  let service: ReturnType<typeof createMockMTTRService>;
  const incidentId = 'sha256:incident_abc123' as IncidentId;
  const gameDayId = 'sha256:gameday_def456' as GameDayId;

  beforeEach(() => {
    service = createMockMTTRService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate metric IDs with sha256: prefix', () => {
      const metric = service.startTracking(incidentId, 'high');
      assert.ok(metric.id.startsWith('sha256:'), 'Metric ID must be opaque sha256:');
    });

    it('should preserve incident ID format', () => {
      const metric = service.startTracking(incidentId, 'critical');
      assert.ok(metric.incidentId.startsWith('sha256:'));
    });

    it('should preserve game day ID format when provided', () => {
      const metric = service.startTracking(incidentId, 'medium', gameDayId);
      assert.ok(metric.gameDayId?.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // SLA Threshold Tests
  // ==========================================================================

  describe('SLA Threshold Configuration', () => {
    it('should define critical threshold as 15 minutes', () => {
      const threshold = service.getSLAThreshold('critical');
      assert.strictEqual(threshold, 15 * 60 * 1000);
    });

    it('should define high threshold as 1 hour', () => {
      const threshold = service.getSLAThreshold('high');
      assert.strictEqual(threshold, 60 * 60 * 1000);
    });

    it('should define medium threshold as 4 hours', () => {
      const threshold = service.getSLAThreshold('medium');
      assert.strictEqual(threshold, 4 * 60 * 60 * 1000);
    });

    it('should define low threshold as 24 hours', () => {
      const threshold = service.getSLAThreshold('low');
      assert.strictEqual(threshold, 24 * 60 * 60 * 1000);
    });

    it('should return all thresholds', () => {
      const thresholds = service.getSLAThresholds();
      assert.ok(thresholds.critical > 0);
      assert.ok(thresholds.high > thresholds.critical);
      assert.ok(thresholds.medium > thresholds.high);
      assert.ok(thresholds.low > thresholds.medium);
    });
  });

  // ==========================================================================
  // Metric Tracking Tests
  // ==========================================================================

  describe('Metric Tracking Lifecycle', () => {
    it('should start tracking with detection marker', () => {
      const metric = service.startTracking(incidentId, 'high');
      assert.strictEqual(metric.timeMarkers.length, 1);
      assert.strictEqual(metric.timeMarkers[0].phase, 'detection');
    });

    it('should record start time on tracking start', () => {
      const before = new Date().toISOString();
      const metric = service.startTracking(incidentId, 'high');
      const after = new Date().toISOString();
      assert.ok(metric.startTime >= before && metric.startTime <= after);
    });

    it('should set initial SLA status to within_sla', () => {
      const metric = service.startTracking(incidentId, 'high');
      assert.strictEqual(metric.slaStatus, 'within_sla');
    });

    it('should set SLA threshold based on severity', () => {
      const critical = service.startTracking('sha256:inc1' as IncidentId, 'critical');
      const low = service.startTracking('sha256:inc2' as IncidentId, 'low');
      assert.strictEqual(critical.slaThresholdMs, 15 * 60 * 1000);
      assert.strictEqual(low.slaThresholdMs, 24 * 60 * 60 * 1000);
    });
  });

  // ==========================================================================
  // Time Marker Tests
  // ==========================================================================

  describe('Time Marker Recording', () => {
    it('should record acknowledgment marker', () => {
      const metric = service.startTracking(incidentId, 'high');
      const updated = service.recordMarker(metric.id, 'acknowledgment', 'operator-1');
      assert.ok(updated);
      assert.strictEqual(updated!.timeMarkers.length, 2);
      assert.strictEqual(updated!.timeMarkers[1].phase, 'acknowledgment');
    });

    it('should record actor in marker', () => {
      const metric = service.startTracking(incidentId, 'high');
      const updated = service.recordMarker(metric.id, 'acknowledgment', 'operator-1');
      assert.strictEqual(updated!.timeMarkers[1].actor, 'operator-1');
    });

    it('should record notes in marker', () => {
      const metric = service.startTracking(incidentId, 'high');
      const updated = service.recordMarker(
        metric.id,
        'diagnosis',
        undefined,
        'Root cause identified'
      );
      assert.strictEqual(updated!.timeMarkers[1].notes, 'Root cause identified');
    });

    it('should prevent duplicate phases', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      const duplicate = service.recordMarker(metric.id, 'acknowledgment');
      assert.strictEqual(duplicate, null);
    });

    it('should record all phases in order', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.recordMarker(metric.id, 'mitigation');
      service.recordMarker(metric.id, 'resolution');
      const updated = service.recordMarker(metric.id, 'verification');
      assert.strictEqual(updated!.timeMarkers.length, 6);
    });
  });

  // ==========================================================================
  // Completion Tests
  // ==========================================================================

  describe('Metric Completion', () => {
    it('should complete tracking with end time', () => {
      const metric = service.startTracking(incidentId, 'high');
      const completed = service.completeTracking(metric.id);
      assert.ok(completed);
      assert.ok(completed!.endTime);
    });

    it('should calculate total duration on completion', () => {
      const metric = service.startTracking(incidentId, 'high');
      const completed = service.completeTracking(metric.id);
      assert.ok(completed!.totalDurationMs !== undefined);
      assert.ok(completed!.totalDurationMs! >= 0);
    });

    it('should add verification marker if missing', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      const completed = service.completeTracking(metric.id);
      assert.ok(completed!.timeMarkers.some(m => m.phase === 'verification'));
    });

    it('should calculate phase durations', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.recordMarker(metric.id, 'mitigation');
      service.recordMarker(metric.id, 'resolution');
      const completed = service.completeTracking(metric.id);
      // At least some phases should have durations
      const phases = completed!.phases;
      assert.ok(
        phases.detectionMs !== undefined ||
          phases.acknowledgmentMs !== undefined ||
          phases.diagnosisMs !== undefined ||
          phases.mitigationMs !== undefined ||
          phases.resolutionMs !== undefined
      );
    });

    it('should not complete already completed metric', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.completeTracking(metric.id);
      const reComplete = service.completeTracking(metric.id);
      assert.strictEqual(reComplete, null);
    });
  });

  // ==========================================================================
  // SLA Status Tests
  // ==========================================================================

  describe('SLA Status Calculation', () => {
    it('should be within_sla when under 80% threshold', () => {
      // This is tested through the completion logic
      const metric = service.startTracking(incidentId, 'low'); // 24 hour threshold
      const completed = service.completeTracking(metric.id);
      // Immediate completion should be well within SLA
      assert.strictEqual(completed!.slaStatus, 'within_sla');
    });

    it('should set SLA status on completion', () => {
      const metric = service.startTracking(incidentId, 'critical');
      const completed = service.completeTracking(metric.id);
      assert.ok(['within_sla', 'at_risk', 'breached'].includes(completed!.slaStatus));
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Metric Queries', () => {
    it('should get metric by ID', () => {
      const metric = service.startTracking(incidentId, 'high');
      const retrieved = service.getMetric(metric.id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved!.id, metric.id);
    });

    it('should get metrics by incident', () => {
      service.startTracking(incidentId, 'high');
      service.startTracking(incidentId, 'medium');
      service.startTracking('sha256:other' as IncidentId, 'low');
      const byIncident = service.getMetricsByIncident(incidentId);
      assert.strictEqual(byIncident.length, 2);
    });

    it('should get metrics by game day', () => {
      service.startTracking(incidentId, 'high', gameDayId);
      service.startTracking('sha256:inc2' as IncidentId, 'medium', gameDayId);
      service.startTracking('sha256:inc3' as IncidentId, 'low');
      const byGameDay = service.getMetricsByGameDay(gameDayId);
      assert.strictEqual(byGameDay.length, 2);
    });

    it('should get metrics by severity', () => {
      service.startTracking('sha256:inc1' as IncidentId, 'critical');
      service.startTracking('sha256:inc2' as IncidentId, 'critical');
      service.startTracking('sha256:inc3' as IncidentId, 'high');
      const critical = service.getMetricsBySeverity('critical');
      assert.strictEqual(critical.length, 2);
    });

    it('should get only completed metrics', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'high');
      service.startTracking('sha256:inc2' as IncidentId, 'medium');
      service.completeTracking(m1.id);
      const completed = service.getCompletedMetrics();
      assert.strictEqual(completed.length, 1);
    });
  });

  // ==========================================================================
  // Aggregation Tests
  // ==========================================================================

  describe('Metric Aggregation', () => {
    it('should calculate aggregate for empty period', () => {
      const aggregate = service.calculateAggregate(
        'Q1-2026',
        '2026-01-01T00:00:00Z',
        '2026-03-31T23:59:59Z'
      );
      assert.strictEqual(aggregate.incidentCount, 0);
      assert.strictEqual(aggregate.slaComplianceRate, 1);
    });

    it('should calculate average MTTR', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'high');
      const m2 = service.startTracking('sha256:inc2' as IncidentId, 'high');
      service.completeTracking(m1.id);
      service.completeTracking(m2.id);

      const now = new Date();
      const aggregate = service.calculateAggregate(
        'Today',
        new Date(now.getTime() - 86400000).toISOString(),
        new Date(now.getTime() + 86400000).toISOString()
      );
      assert.strictEqual(aggregate.incidentCount, 2);
      assert.ok(aggregate.averageMttrMs >= 0);
    });

    it('should calculate percentiles', () => {
      for (let i = 0; i < 10; i++) {
        const m = service.startTracking(`sha256:inc${i}` as IncidentId, 'medium');
        service.completeTracking(m.id);
      }

      const now = new Date();
      const aggregate = service.calculateAggregate(
        'Today',
        new Date(now.getTime() - 86400000).toISOString(),
        new Date(now.getTime() + 86400000).toISOString()
      );
      assert.ok(aggregate.p50MttrMs >= 0);
      assert.ok(aggregate.p95MttrMs >= aggregate.p50MttrMs);
      assert.ok(aggregate.p99MttrMs >= aggregate.p95MttrMs);
    });

    it('should calculate SLA compliance counts', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'low');
      const m2 = service.startTracking('sha256:inc2' as IncidentId, 'low');
      service.completeTracking(m1.id);
      service.completeTracking(m2.id);

      const now = new Date();
      const aggregate = service.calculateAggregate(
        'Today',
        new Date(now.getTime() - 86400000).toISOString(),
        new Date(now.getTime() + 86400000).toISOString()
      );
      assert.ok(
        aggregate.withinSlaCount + aggregate.atRiskCount + aggregate.breachedCount ===
          aggregate.incidentCount
      );
    });

    it('should break down by severity', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'critical');
      const m2 = service.startTracking('sha256:inc2' as IncidentId, 'high');
      const m3 = service.startTracking('sha256:inc3' as IncidentId, 'high');
      service.completeTracking(m1.id);
      service.completeTracking(m2.id);
      service.completeTracking(m3.id);

      const now = new Date();
      const aggregate = service.calculateAggregate(
        'Today',
        new Date(now.getTime() - 86400000).toISOString(),
        new Date(now.getTime() + 86400000).toISOString()
      );
      assert.strictEqual(aggregate.bySeverity.critical.count, 1);
      assert.strictEqual(aggregate.bySeverity.high.count, 2);
    });
  });

  // ==========================================================================
  // Trend Analysis Tests
  // ==========================================================================

  describe('Trend Analysis', () => {
    it('should detect stable trend with single period', () => {
      const aggregate = service.calculateAggregate('Q1', '2026-01-01', '2026-03-31');
      const trend = service.analyzeTrend([aggregate]);
      assert.strictEqual(trend.mttrTrend, 'stable');
      assert.strictEqual(trend.slaComplianceTrend, 'stable');
    });

    it('should include all periods in analysis', () => {
      const agg1 = service.calculateAggregate('Q1', '2026-01-01', '2026-03-31');
      const agg2 = service.calculateAggregate('Q2', '2026-04-01', '2026-06-30');
      const trend = service.analyzeTrend([agg1, agg2]);
      assert.strictEqual(trend.periods.length, 2);
    });

    it('should calculate MTTR by period', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'high');
      service.completeTracking(m1.id);

      const now = new Date();
      const agg = service.calculateAggregate(
        'Today',
        new Date(now.getTime() - 86400000).toISOString(),
        new Date(now.getTime() + 86400000).toISOString()
      );
      const trend = service.analyzeTrend([agg]);
      assert.strictEqual(trend.averageMttrByPeriod.length, 1);
    });

    it('should calculate compliance by period', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'low');
      service.completeTracking(m1.id);

      const now = new Date();
      const agg = service.calculateAggregate(
        'Today',
        new Date(now.getTime() - 86400000).toISOString(),
        new Date(now.getTime() + 86400000).toISOString()
      );
      const trend = service.analyzeTrend([agg]);
      assert.strictEqual(trend.complianceByPeriod.length, 1);
    });
  });

  // ==========================================================================
  // Determinism Tests
  // ==========================================================================

  describe('Determinism Requirements', () => {
    it('should produce identical recalculation for same data', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.recordMarker(metric.id, 'mitigation');
      service.completeTracking(metric.id);

      const recalculated = service.recalculateMetric(metric.id);
      const original = service.getMetric(metric.id);

      assert.ok(recalculated);
      assert.strictEqual(recalculated!.totalDurationMs, original!.totalDurationMs);
      assert.strictEqual(recalculated!.slaStatus, original!.slaStatus);
    });

    it('should preserve phase durations on recalculation', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.completeTracking(metric.id);

      const recalculated = service.recalculateMetric(metric.id);
      const original = service.getMetric(metric.id);

      assert.deepStrictEqual(recalculated!.phases, original!.phases);
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Metric Integrity Validation', () => {
    it('should validate correct metric', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.completeTracking(metric.id);

      const validation = service.validateMetricIntegrity(metric.id);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should return error for non-existent metric', () => {
      const validation = service.validateMetricIntegrity('sha256:nonexistent' as MetricId);
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.includes('Metric not found'));
    });

    it('should verify phase ordering', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.completeTracking(metric.id);

      const validation = service.validateMetricIntegrity(metric.id);
      assert.ok(!validation.errors.some(e => e.includes('out of order')));
    });

    it('should verify timestamp ordering', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.recordMarker(metric.id, 'acknowledgment');
      service.recordMarker(metric.id, 'diagnosis');
      service.completeTracking(metric.id);

      const validation = service.validateMetricIntegrity(metric.id);
      assert.ok(!validation.errors.some(e => e.includes('before previous phase')));
    });

    it('should verify duration calculation', () => {
      const metric = service.startTracking(incidentId, 'high');
      service.completeTracking(metric.id);

      const validation = service.validateMetricIntegrity(metric.id);
      assert.ok(!validation.errors.some(e => e.includes('does not match')));
    });
  });

  // ==========================================================================
  // Game Day Integration Tests
  // ==========================================================================

  describe('Game Day Integration', () => {
    it('should associate metrics with game day', () => {
      const m1 = service.startTracking('sha256:inc1' as IncidentId, 'high', gameDayId);
      const m2 = service.startTracking('sha256:inc2' as IncidentId, 'high', gameDayId);
      assert.strictEqual(m1.gameDayId, gameDayId);
      assert.strictEqual(m2.gameDayId, gameDayId);
    });

    it('should filter game day metrics', () => {
      service.startTracking('sha256:inc1' as IncidentId, 'high', gameDayId);
      service.startTracking('sha256:inc2' as IncidentId, 'high');
      service.startTracking('sha256:inc3' as IncidentId, 'high', gameDayId);

      const gameDayMetrics = service.getMetricsByGameDay(gameDayId);
      assert.strictEqual(gameDayMetrics.length, 2);
    });

    it('should track metrics for game day scenarios', () => {
      const metric = service.startTracking(incidentId, 'critical', gameDayId);
      service.recordMarker(metric.id, 'acknowledgment', 'game-day-operator');
      service.recordMarker(metric.id, 'diagnosis', 'game-day-operator', 'Simulated root cause');
      service.recordMarker(metric.id, 'mitigation', 'game-day-operator');
      service.recordMarker(metric.id, 'resolution', 'game-day-operator');
      service.completeTracking(metric.id);

      const completed = service.getMetric(metric.id);
      assert.ok(completed!.endTime);
      assert.ok(completed!.totalDurationMs !== undefined);
    });
  });
});

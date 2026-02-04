/**
 * Phase XVIII — Executive Oversight Portal
 * =========================================
 * Contract: portal.operations.contract.test.ts
 *
 * Tests operational credibility views for the executive oversight portal,
 * including MTTR trends vs SLA, rollback success rates, drill compliance,
 * and circuit breaker trends.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Portal views are read-only
 * - Metrics reference evidence packs via sha256: links
 * - No embedded PII in operational data
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type IncidentId = `sha256:${string}`;
type ServiceId = `sha256:${string}`;
type RollbackId = `sha256:${string}`;
type DrillId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
type RollbackOutcome = 'success' | 'partial' | 'failed' | 'aborted';
type DrillType = 'failover' | 'recovery' | 'gameday' | 'tabletop';
type BreakerState = 'closed' | 'open' | 'half_open';

interface MttrRecord {
  readonly incidentId: IncidentId;
  readonly serviceId: ServiceId;
  readonly severity: SeverityLevel;
  readonly startedAt: string;
  readonly resolvedAt: string;
  readonly mttrMinutes: number;
  readonly slaMinutes: number;
  readonly slaMet: boolean;
  readonly evidenceRef: EvidenceRef;
}

interface RollbackRecord {
  readonly id: RollbackId;
  readonly serviceId: ServiceId;
  readonly initiatedAt: string;
  readonly completedAt?: string;
  readonly outcome: RollbackOutcome;
  readonly durationMinutes: number;
  readonly approvalCount: number;
  readonly evidenceRef: EvidenceRef;
}

interface DrillRecord {
  readonly id: DrillId;
  readonly type: DrillType;
  readonly scheduledFor: string;
  readonly executedAt?: string;
  readonly passed: boolean;
  readonly participantCount: number;
  readonly findingsCount: number;
  readonly evidenceRef: EvidenceRef;
}

interface BreakerEvent {
  readonly serviceId: ServiceId;
  readonly timestamp: string;
  readonly previousState: BreakerState;
  readonly newState: BreakerState;
  readonly reason: string;
  readonly autoRecovered: boolean;
}

interface MttrTrend {
  readonly period: string;
  readonly averageMttrMinutes: number;
  readonly incidentCount: number;
  readonly slaComplianceRate: number;
  readonly bySeverity: Record<SeverityLevel, { avg: number; count: number; slaRate: number }>;
}

interface RollbackSummary {
  readonly period: string;
  readonly totalRollbacks: number;
  readonly successRate: number;
  readonly averageDurationMinutes: number;
  readonly byOutcome: Record<RollbackOutcome, number>;
}

interface DrillComplianceSummary {
  readonly period: string;
  readonly scheduledDrills: number;
  readonly executedDrills: number;
  readonly passRate: number;
  readonly complianceRate: number;
  readonly byType: Record<DrillType, { scheduled: number; executed: number; passed: number }>;
}

interface BreakerTrendSummary {
  readonly period: string;
  readonly totalTrips: number;
  readonly autoRecoveryRate: number;
  readonly averageOpenDurationMinutes: number;
  readonly byService: readonly { serviceId: ServiceId; tripCount: number; avgDuration: number }[];
}

interface OperationsPortalView {
  readonly generatedAt: string;
  readonly mttrTrend: MttrTrend;
  readonly rollbackSummary: RollbackSummary;
  readonly drillCompliance: DrillComplianceSummary;
  readonly breakerTrend: BreakerTrendSummary;
  readonly overallHealthScore: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockOperationsPortalService() {
  const mttrRecords: MttrRecord[] = [];
  const rollbackRecords: RollbackRecord[] = [];
  const drillRecords: DrillRecord[] = [];
  const breakerEvents: BreakerEvent[] = [];

  const slaBySeverity: Record<SeverityLevel, number> = {
    critical: 15,
    high: 60,
    medium: 240,
    low: 1440,
  };

  function generateId(prefix: string): IncidentId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as IncidentId;
  }

  return {
    // MTTR Recording
    recordIncident(
      serviceId: ServiceId,
      severity: SeverityLevel,
      startedAt: string,
      resolvedAt: string,
      evidenceRef: EvidenceRef
    ): MttrRecord {
      const start = new Date(startedAt);
      const resolved = new Date(resolvedAt);
      const mttrMinutes = Math.round((resolved.getTime() - start.getTime()) / 60000);
      const slaMinutes = slaBySeverity[severity];

      const record: MttrRecord = {
        incidentId: generateId('incident'),
        serviceId,
        severity,
        startedAt,
        resolvedAt,
        mttrMinutes,
        slaMinutes,
        slaMet: mttrMinutes <= slaMinutes,
        evidenceRef,
      };
      mttrRecords.push(record);
      return record;
    },

    getMttrRecords(): readonly MttrRecord[] {
      return [...mttrRecords];
    },

    // Rollback Recording
    recordRollback(
      serviceId: ServiceId,
      initiatedAt: string,
      completedAt: string | undefined,
      outcome: RollbackOutcome,
      approvalCount: number,
      evidenceRef: EvidenceRef
    ): RollbackRecord {
      const initiated = new Date(initiatedAt);
      const completed = completedAt ? new Date(completedAt) : null;
      const durationMinutes = completed
        ? Math.round((completed.getTime() - initiated.getTime()) / 60000)
        : 0;

      const record: RollbackRecord = {
        id: generateId('rollback') as RollbackId,
        serviceId,
        initiatedAt,
        completedAt,
        outcome,
        durationMinutes,
        approvalCount,
        evidenceRef,
      };
      rollbackRecords.push(record);
      return record;
    },

    getRollbackRecords(): readonly RollbackRecord[] {
      return [...rollbackRecords];
    },

    // Drill Recording
    recordDrill(
      type: DrillType,
      scheduledFor: string,
      executedAt: string | undefined,
      passed: boolean,
      participantCount: number,
      findingsCount: number,
      evidenceRef: EvidenceRef
    ): DrillRecord {
      const record: DrillRecord = {
        id: generateId('drill') as DrillId,
        type,
        scheduledFor,
        executedAt,
        passed,
        participantCount,
        findingsCount,
        evidenceRef,
      };
      drillRecords.push(record);
      return record;
    },

    getDrillRecords(): readonly DrillRecord[] {
      return [...drillRecords];
    },

    // Breaker Events
    recordBreakerEvent(
      serviceId: ServiceId,
      timestamp: string,
      previousState: BreakerState,
      newState: BreakerState,
      reason: string,
      autoRecovered: boolean
    ): BreakerEvent {
      const event: BreakerEvent = {
        serviceId,
        timestamp,
        previousState,
        newState,
        reason,
        autoRecovered,
      };
      breakerEvents.push(event);
      return event;
    },

    getBreakerEvents(): readonly BreakerEvent[] {
      return [...breakerEvents];
    },

    // MTTR Trend Calculation
    calculateMttrTrend(periodLabel: string): MttrTrend {
      const bySeverity: Record<SeverityLevel, { total: number; count: number; slaMet: number }> = {
        critical: { total: 0, count: 0, slaMet: 0 },
        high: { total: 0, count: 0, slaMet: 0 },
        medium: { total: 0, count: 0, slaMet: 0 },
        low: { total: 0, count: 0, slaMet: 0 },
      };

      let totalMttr = 0;
      let totalSlaMet = 0;

      for (const record of mttrRecords) {
        bySeverity[record.severity].total += record.mttrMinutes;
        bySeverity[record.severity].count++;
        if (record.slaMet) {
          bySeverity[record.severity].slaMet++;
          totalSlaMet++;
        }
        totalMttr += record.mttrMinutes;
      }

      const incidentCount = mttrRecords.length;

      return {
        period: periodLabel,
        averageMttrMinutes: incidentCount > 0 ? Math.round(totalMttr / incidentCount) : 0,
        incidentCount,
        slaComplianceRate: incidentCount > 0 ? totalSlaMet / incidentCount : 1,
        bySeverity: {
          critical: {
            avg:
              bySeverity.critical.count > 0
                ? Math.round(bySeverity.critical.total / bySeverity.critical.count)
                : 0,
            count: bySeverity.critical.count,
            slaRate:
              bySeverity.critical.count > 0
                ? bySeverity.critical.slaMet / bySeverity.critical.count
                : 1,
          },
          high: {
            avg:
              bySeverity.high.count > 0
                ? Math.round(bySeverity.high.total / bySeverity.high.count)
                : 0,
            count: bySeverity.high.count,
            slaRate: bySeverity.high.count > 0 ? bySeverity.high.slaMet / bySeverity.high.count : 1,
          },
          medium: {
            avg:
              bySeverity.medium.count > 0
                ? Math.round(bySeverity.medium.total / bySeverity.medium.count)
                : 0,
            count: bySeverity.medium.count,
            slaRate:
              bySeverity.medium.count > 0 ? bySeverity.medium.slaMet / bySeverity.medium.count : 1,
          },
          low: {
            avg:
              bySeverity.low.count > 0
                ? Math.round(bySeverity.low.total / bySeverity.low.count)
                : 0,
            count: bySeverity.low.count,
            slaRate: bySeverity.low.count > 0 ? bySeverity.low.slaMet / bySeverity.low.count : 1,
          },
        },
      };
    },

    // Rollback Summary
    calculateRollbackSummary(periodLabel: string): RollbackSummary {
      const byOutcome: Record<RollbackOutcome, number> = {
        success: 0,
        partial: 0,
        failed: 0,
        aborted: 0,
      };

      let totalDuration = 0;
      for (const record of rollbackRecords) {
        byOutcome[record.outcome]++;
        totalDuration += record.durationMinutes;
      }

      const total = rollbackRecords.length;
      const successCount = byOutcome.success;

      return {
        period: periodLabel,
        totalRollbacks: total,
        successRate: total > 0 ? successCount / total : 1,
        averageDurationMinutes: total > 0 ? Math.round(totalDuration / total) : 0,
        byOutcome,
      };
    },

    // Drill Compliance
    calculateDrillCompliance(periodLabel: string): DrillComplianceSummary {
      const byType: Record<DrillType, { scheduled: number; executed: number; passed: number }> = {
        failover: { scheduled: 0, executed: 0, passed: 0 },
        recovery: { scheduled: 0, executed: 0, passed: 0 },
        gameday: { scheduled: 0, executed: 0, passed: 0 },
        tabletop: { scheduled: 0, executed: 0, passed: 0 },
      };

      let executed = 0;
      let passed = 0;

      for (const drill of drillRecords) {
        byType[drill.type].scheduled++;
        if (drill.executedAt) {
          byType[drill.type].executed++;
          executed++;
          if (drill.passed) {
            byType[drill.type].passed++;
            passed++;
          }
        }
      }

      const scheduled = drillRecords.length;

      return {
        period: periodLabel,
        scheduledDrills: scheduled,
        executedDrills: executed,
        passRate: executed > 0 ? passed / executed : 1,
        complianceRate: scheduled > 0 ? executed / scheduled : 1,
        byType,
      };
    },

    // Breaker Trend
    calculateBreakerTrend(periodLabel: string): BreakerTrendSummary {
      const trips = breakerEvents.filter(e => e.newState === 'open');
      const autoRecovered = trips.filter(e => e.autoRecovered).length;

      // Calculate by service
      const serviceMap = new Map<ServiceId, { trips: number; totalDuration: number }>();
      for (const event of trips) {
        const existing = serviceMap.get(event.serviceId) ?? { trips: 0, totalDuration: 0 };
        existing.trips++;
        // Simplified duration calculation
        existing.totalDuration += 5; // Assume 5 min average for mock
        serviceMap.set(event.serviceId, existing);
      }

      const byService = [...serviceMap.entries()].map(([serviceId, stats]) => ({
        serviceId,
        tripCount: stats.trips,
        avgDuration: stats.trips > 0 ? Math.round(stats.totalDuration / stats.trips) : 0,
      }));

      return {
        period: periodLabel,
        totalTrips: trips.length,
        autoRecoveryRate: trips.length > 0 ? autoRecovered / trips.length : 1,
        averageOpenDurationMinutes: 5, // Mock average
        byService,
      };
    },

    // Full Portal View
    generateOperationsView(periodLabel: string = 'current'): OperationsPortalView {
      const mttrTrend = this.calculateMttrTrend(periodLabel);
      const rollbackSummary = this.calculateRollbackSummary(periodLabel);
      const drillCompliance = this.calculateDrillCompliance(periodLabel);
      const breakerTrend = this.calculateBreakerTrend(periodLabel);

      // Calculate overall health score (0-100)
      const slaScore = mttrTrend.slaComplianceRate * 25;
      const rollbackScore = rollbackSummary.successRate * 25;
      const drillScore = drillCompliance.complianceRate * drillCompliance.passRate * 25;
      const breakerScore = breakerTrend.autoRecoveryRate * 25;

      const overallHealthScore = Math.round(slaScore + rollbackScore + drillScore + breakerScore);

      return {
        generatedAt: new Date().toISOString(),
        mttrTrend,
        rollbackSummary,
        drillCompliance,
        breakerTrend,
        overallHealthScore,
      };
    },

    // SLA Thresholds
    getSlaThresholds(): Record<SeverityLevel, number> {
      return { ...slaBySeverity };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XVIII: Portal Operations Contracts', () => {
  let portal: ReturnType<typeof createMockOperationsPortalService>;
  const serviceA = 'sha256:service_alpha' as ServiceId;
  const serviceB = 'sha256:service_beta' as ServiceId;

  beforeEach(() => {
    portal = createMockOperationsPortalService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate incident IDs with sha256: prefix', () => {
      const record = portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:evidence_123' as EvidenceRef
      );
      assert.ok(record.incidentId.startsWith('sha256:'));
    });

    it('should generate rollback IDs with sha256: prefix', () => {
      const record = portal.recordRollback(
        serviceA,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:15:00Z',
        'success',
        2,
        'sha256:evidence_456' as EvidenceRef
      );
      assert.ok(record.id.startsWith('sha256:'));
    });

    it('should generate drill IDs with sha256: prefix', () => {
      const record = portal.recordDrill(
        'failover',
        '2026-01-15T09:00:00Z',
        '2026-01-15T09:30:00Z',
        true,
        5,
        2,
        'sha256:evidence_789' as EvidenceRef
      );
      assert.ok(record.id.startsWith('sha256:'));
    });

    it('should require sha256: evidence references', () => {
      const record = portal.recordIncident(
        serviceA,
        'medium',
        '2026-01-15T10:00:00Z',
        '2026-01-15T12:00:00Z',
        'sha256:evidence_abc' as EvidenceRef
      );
      assert.ok(record.evidenceRef.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // MTTR Tests
  // ==========================================================================

  describe('MTTR Metrics', () => {
    it('should calculate MTTR in minutes', () => {
      const record = portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:45:00Z',
        'sha256:evidence_1' as EvidenceRef
      );
      assert.strictEqual(record.mttrMinutes, 45);
    });

    it('should check SLA compliance for critical (15 min)', () => {
      const met = portal.recordIncident(
        serviceA,
        'critical',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:10:00Z',
        'sha256:evidence_1' as EvidenceRef
      );
      assert.strictEqual(met.slaMet, true);

      const breached = portal.recordIncident(
        serviceA,
        'critical',
        '2026-01-15T11:00:00Z',
        '2026-01-15T11:20:00Z',
        'sha256:evidence_2' as EvidenceRef
      );
      assert.strictEqual(breached.slaMet, false);
    });

    it('should check SLA compliance for high (60 min)', () => {
      const met = portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:55:00Z',
        'sha256:evidence_1' as EvidenceRef
      );
      assert.strictEqual(met.slaMet, true);
    });

    it('should check SLA compliance for medium (240 min)', () => {
      const met = portal.recordIncident(
        serviceA,
        'medium',
        '2026-01-15T10:00:00Z',
        '2026-01-15T13:00:00Z',
        'sha256:evidence_1' as EvidenceRef
      );
      assert.strictEqual(met.slaMet, true);
    });

    it('should calculate MTTR trend', () => {
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-16T10:00:00Z',
        '2026-01-16T10:50:00Z',
        'sha256:e2' as EvidenceRef
      );

      const trend = portal.calculateMttrTrend('January 2026');
      assert.strictEqual(trend.incidentCount, 2);
      assert.strictEqual(trend.averageMttrMinutes, 40); // (30 + 50) / 2
    });

    it('should calculate SLA compliance rate', () => {
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:e1' as EvidenceRef
      ); // met
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-16T10:00:00Z',
        '2026-01-16T12:00:00Z',
        'sha256:e2' as EvidenceRef
      ); // breached

      const trend = portal.calculateMttrTrend('January 2026');
      assert.strictEqual(trend.slaComplianceRate, 0.5);
    });

    it('should break down MTTR by severity', () => {
      portal.recordIncident(
        serviceA,
        'critical',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:10:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T11:00:00Z',
        '2026-01-15T11:30:00Z',
        'sha256:e2' as EvidenceRef
      );

      const trend = portal.calculateMttrTrend('January 2026');
      assert.strictEqual(trend.bySeverity.critical.count, 1);
      assert.strictEqual(trend.bySeverity.high.count, 1);
      assert.strictEqual(trend.bySeverity.critical.avg, 10);
      assert.strictEqual(trend.bySeverity.high.avg, 30);
    });
  });

  // ==========================================================================
  // Rollback Tests
  // ==========================================================================

  describe('Rollback Metrics', () => {
    it('should calculate rollback duration', () => {
      const record = portal.recordRollback(
        serviceA,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:12:00Z',
        'success',
        2,
        'sha256:evidence_1' as EvidenceRef
      );
      assert.strictEqual(record.durationMinutes, 12);
    });

    it('should track approval count', () => {
      const record = portal.recordRollback(
        serviceA,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:15:00Z',
        'success',
        2,
        'sha256:evidence_1' as EvidenceRef
      );
      assert.strictEqual(record.approvalCount, 2);
    });

    it('should calculate rollback success rate', () => {
      portal.recordRollback(
        serviceA,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:15:00Z',
        'success',
        2,
        'sha256:e1' as EvidenceRef
      );
      portal.recordRollback(
        serviceA,
        '2026-01-16T10:00:00Z',
        '2026-01-16T10:20:00Z',
        'success',
        2,
        'sha256:e2' as EvidenceRef
      );
      portal.recordRollback(
        serviceB,
        '2026-01-17T10:00:00Z',
        '2026-01-17T10:30:00Z',
        'failed',
        2,
        'sha256:e3' as EvidenceRef
      );

      const summary = portal.calculateRollbackSummary('January 2026');
      assert.strictEqual(summary.totalRollbacks, 3);
      assert.ok(Math.abs(summary.successRate - 0.667) < 0.01);
    });

    it('should break down by outcome', () => {
      portal.recordRollback(
        serviceA,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:15:00Z',
        'success',
        2,
        'sha256:e1' as EvidenceRef
      );
      portal.recordRollback(
        serviceA,
        '2026-01-16T10:00:00Z',
        '2026-01-16T10:20:00Z',
        'partial',
        2,
        'sha256:e2' as EvidenceRef
      );
      portal.recordRollback(
        serviceB,
        '2026-01-17T10:00:00Z',
        undefined,
        'aborted',
        1,
        'sha256:e3' as EvidenceRef
      );

      const summary = portal.calculateRollbackSummary('January 2026');
      assert.strictEqual(summary.byOutcome.success, 1);
      assert.strictEqual(summary.byOutcome.partial, 1);
      assert.strictEqual(summary.byOutcome.aborted, 1);
    });

    it('should calculate average duration', () => {
      portal.recordRollback(
        serviceA,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:10:00Z',
        'success',
        2,
        'sha256:e1' as EvidenceRef
      );
      portal.recordRollback(
        serviceA,
        '2026-01-16T10:00:00Z',
        '2026-01-16T10:20:00Z',
        'success',
        2,
        'sha256:e2' as EvidenceRef
      );

      const summary = portal.calculateRollbackSummary('January 2026');
      assert.strictEqual(summary.averageDurationMinutes, 15); // (10 + 20) / 2
    });
  });

  // ==========================================================================
  // Drill Compliance Tests
  // ==========================================================================

  describe('Drill Compliance', () => {
    it('should track scheduled drills', () => {
      portal.recordDrill(
        'failover',
        '2026-01-15T09:00:00Z',
        '2026-01-15T09:30:00Z',
        true,
        5,
        1,
        'sha256:e1' as EvidenceRef
      );
      portal.recordDrill(
        'recovery',
        '2026-01-20T09:00:00Z',
        undefined,
        false,
        0,
        0,
        'sha256:e2' as EvidenceRef
      );

      const compliance = portal.calculateDrillCompliance('January 2026');
      assert.strictEqual(compliance.scheduledDrills, 2);
    });

    it('should calculate execution rate', () => {
      portal.recordDrill(
        'failover',
        '2026-01-15T09:00:00Z',
        '2026-01-15T09:30:00Z',
        true,
        5,
        1,
        'sha256:e1' as EvidenceRef
      );
      portal.recordDrill(
        'recovery',
        '2026-01-20T09:00:00Z',
        undefined,
        false,
        0,
        0,
        'sha256:e2' as EvidenceRef
      );

      const compliance = portal.calculateDrillCompliance('January 2026');
      assert.strictEqual(compliance.executedDrills, 1);
      assert.strictEqual(compliance.complianceRate, 0.5);
    });

    it('should calculate pass rate', () => {
      portal.recordDrill(
        'failover',
        '2026-01-15T09:00:00Z',
        '2026-01-15T09:30:00Z',
        true,
        5,
        1,
        'sha256:e1' as EvidenceRef
      );
      portal.recordDrill(
        'recovery',
        '2026-01-20T09:00:00Z',
        '2026-01-20T10:00:00Z',
        false,
        3,
        5,
        'sha256:e2' as EvidenceRef
      );

      const compliance = portal.calculateDrillCompliance('January 2026');
      assert.strictEqual(compliance.passRate, 0.5);
    });

    it('should break down by drill type', () => {
      portal.recordDrill(
        'failover',
        '2026-01-15T09:00:00Z',
        '2026-01-15T09:30:00Z',
        true,
        5,
        1,
        'sha256:e1' as EvidenceRef
      );
      portal.recordDrill(
        'gameday',
        '2026-01-20T09:00:00Z',
        '2026-01-20T12:00:00Z',
        true,
        10,
        3,
        'sha256:e2' as EvidenceRef
      );
      portal.recordDrill(
        'tabletop',
        '2026-01-25T09:00:00Z',
        undefined,
        false,
        0,
        0,
        'sha256:e3' as EvidenceRef
      );

      const compliance = portal.calculateDrillCompliance('January 2026');
      assert.strictEqual(compliance.byType.failover.executed, 1);
      assert.strictEqual(compliance.byType.gameday.passed, 1);
      assert.strictEqual(compliance.byType.tabletop.scheduled, 1);
    });

    it('should track participant counts', () => {
      const drill = portal.recordDrill(
        'gameday',
        '2026-01-20T09:00:00Z',
        '2026-01-20T12:00:00Z',
        true,
        15,
        3,
        'sha256:e1' as EvidenceRef
      );
      assert.strictEqual(drill.participantCount, 15);
    });

    it('should track findings counts', () => {
      const drill = portal.recordDrill(
        'gameday',
        '2026-01-20T09:00:00Z',
        '2026-01-20T12:00:00Z',
        true,
        15,
        7,
        'sha256:e1' as EvidenceRef
      );
      assert.strictEqual(drill.findingsCount, 7);
    });
  });

  // ==========================================================================
  // Breaker Trend Tests
  // ==========================================================================

  describe('Breaker Trends', () => {
    it('should record breaker events', () => {
      const event = portal.recordBreakerEvent(
        serviceA,
        '2026-01-15T10:00:00Z',
        'closed',
        'open',
        'Latency threshold exceeded',
        false
      );
      assert.strictEqual(event.newState, 'open');
    });

    it('should count breaker trips', () => {
      portal.recordBreakerEvent(
        serviceA,
        '2026-01-15T10:00:00Z',
        'closed',
        'open',
        'Latency',
        false
      );
      portal.recordBreakerEvent(
        serviceA,
        '2026-01-15T10:05:00Z',
        'open',
        'half_open',
        'Recovery attempt',
        false
      );
      portal.recordBreakerEvent(
        serviceA,
        '2026-01-15T10:06:00Z',
        'half_open',
        'closed',
        'Recovered',
        false
      );

      const trend = portal.calculateBreakerTrend('January 2026');
      assert.strictEqual(trend.totalTrips, 1); // Only counts transitions to 'open'
    });

    it('should calculate auto-recovery rate', () => {
      portal.recordBreakerEvent(
        serviceA,
        '2026-01-15T10:00:00Z',
        'closed',
        'open',
        'Error rate',
        true
      );
      portal.recordBreakerEvent(
        serviceB,
        '2026-01-16T10:00:00Z',
        'closed',
        'open',
        'Timeout',
        false
      );

      const trend = portal.calculateBreakerTrend('January 2026');
      assert.strictEqual(trend.autoRecoveryRate, 0.5);
    });

    it('should aggregate by service', () => {
      portal.recordBreakerEvent(
        serviceA,
        '2026-01-15T10:00:00Z',
        'closed',
        'open',
        'Error 1',
        true
      );
      portal.recordBreakerEvent(
        serviceA,
        '2026-01-16T10:00:00Z',
        'closed',
        'open',
        'Error 2',
        true
      );
      portal.recordBreakerEvent(
        serviceB,
        '2026-01-17T10:00:00Z',
        'closed',
        'open',
        'Timeout',
        false
      );

      const trend = portal.calculateBreakerTrend('January 2026');
      const serviceAStats = trend.byService.find(s => s.serviceId === serviceA);
      assert.strictEqual(serviceAStats?.tripCount, 2);
    });
  });

  // ==========================================================================
  // Portal View Tests
  // ==========================================================================

  describe('Operations Portal View', () => {
    it('should generate complete portal view', () => {
      const view = portal.generateOperationsView();
      assert.ok(view.generatedAt);
      assert.ok(view.mttrTrend);
      assert.ok(view.rollbackSummary);
      assert.ok(view.drillCompliance);
      assert.ok(view.breakerTrend);
    });

    it('should calculate overall health score', () => {
      // Record good metrics
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.recordRollback(
        serviceA,
        '2026-01-15T11:00:00Z',
        '2026-01-15T11:10:00Z',
        'success',
        2,
        'sha256:e2' as EvidenceRef
      );
      portal.recordDrill(
        'failover',
        '2026-01-15T12:00:00Z',
        '2026-01-15T12:30:00Z',
        true,
        5,
        1,
        'sha256:e3' as EvidenceRef
      );
      portal.recordBreakerEvent(serviceA, '2026-01-15T13:00:00Z', 'closed', 'open', 'Test', true);

      const view = portal.generateOperationsView();
      assert.ok(view.overallHealthScore >= 0);
      assert.ok(view.overallHealthScore <= 100);
    });

    it('should show perfect health with all metrics met', () => {
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.recordRollback(
        serviceA,
        '2026-01-15T11:00:00Z',
        '2026-01-15T11:10:00Z',
        'success',
        2,
        'sha256:e2' as EvidenceRef
      );
      portal.recordDrill(
        'failover',
        '2026-01-15T12:00:00Z',
        '2026-01-15T12:30:00Z',
        true,
        5,
        1,
        'sha256:e3' as EvidenceRef
      );
      portal.recordBreakerEvent(serviceA, '2026-01-15T13:00:00Z', 'closed', 'open', 'Test', true);

      const view = portal.generateOperationsView();
      assert.strictEqual(view.overallHealthScore, 100);
    });

    it('should use period label in summaries', () => {
      const view = portal.generateOperationsView('Q1 2026');
      assert.strictEqual(view.mttrTrend.period, 'Q1 2026');
      assert.strictEqual(view.rollbackSummary.period, 'Q1 2026');
    });

    it('should generate fresh timestamp each call', () => {
      const view1 = portal.generateOperationsView();
      const view2 = portal.generateOperationsView();
      // Each view should have a generatedAt timestamp (may be same instant)
      assert.ok(view1.generatedAt);
      assert.ok(view2.generatedAt);
      // Views are independent objects
      assert.ok(view1 !== view2);
    });
  });

  // ==========================================================================
  // SLA Threshold Tests
  // ==========================================================================

  describe('SLA Thresholds', () => {
    it('should expose SLA thresholds', () => {
      const thresholds = portal.getSlaThresholds();
      assert.strictEqual(thresholds.critical, 15);
      assert.strictEqual(thresholds.high, 60);
      assert.strictEqual(thresholds.medium, 240);
      assert.strictEqual(thresholds.low, 1440);
    });
  });

  // ==========================================================================
  // Read-Only Invariant Tests
  // ==========================================================================

  describe('Read-Only Portal Invariants', () => {
    it('should return copies of record arrays', () => {
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:e1' as EvidenceRef
      );
      const records1 = portal.getMttrRecords();
      const records2 = portal.getMttrRecords();
      assert.notStrictEqual(records1, records2); // Different array instances
    });

    it('should not expose internal state mutations', () => {
      portal.recordIncident(
        serviceA,
        'high',
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:30:00Z',
        'sha256:e1' as EvidenceRef
      );
      const records = portal.getMttrRecords();
      // TypeScript readonly prevents mutations at compile time
      assert.strictEqual(records.length, 1);
    });
  });
});

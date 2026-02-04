/**
 * Phase XXII — MOUs-as-Code
 * ==========================
 * Contract: mou.sla-enforcement.contract.test.ts
 *
 * Tests SLA enforcement using KPIs: onboarding SLA, attestation
 * freshness, drill compliance, and measurement thresholds.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - SLAs have defined targets and thresholds
 * - Violations trigger appropriate alerts
 * - Error budgets are tracked
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type SlaId = `sha256:${string}`;
type MouId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type MeasurementId = `sha256:${string}`;
type ViolationId = `sha256:${string}`;

type SlaCategory =
  | 'onboarding'
  | 'attestation'
  | 'drill'
  | 'availability'
  | 'response_time'
  | 'data_freshness';
type SlaStatus = 'compliant' | 'warning' | 'violation' | 'unknown';
type ViolationSeverity = 'minor' | 'major' | 'critical';

interface SlaDef {
  readonly id: SlaId;
  readonly mouId: MouId;
  readonly category: SlaCategory;
  readonly name: string;
  readonly description: string;
  readonly targetValue: number;
  readonly warningThreshold: number;
  readonly violationThreshold: number;
  readonly unit: string;
  readonly measurementFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  readonly gracePeriodHours: number;
  readonly isHigherBetter: boolean;
}

interface SlaMeasurement {
  readonly id: MeasurementId;
  readonly slaId: SlaId;
  readonly agencyId: AgencyId;
  readonly value: number;
  readonly measuredAt: string;
  readonly status: SlaStatus;
  readonly delta: number;
}

interface SlaViolation {
  readonly id: ViolationId;
  readonly slaId: SlaId;
  readonly agencyId: AgencyId;
  readonly severity: ViolationSeverity;
  readonly value: number;
  readonly threshold: number;
  readonly occurredAt: string;
  readonly acknowledgedAt?: string;
  readonly resolvedAt?: string;
  readonly resolution?: string;
}

interface ErrorBudget {
  readonly slaId: SlaId;
  readonly agencyId: AgencyId;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly totalBudget: number;
  readonly consumed: number;
  readonly remaining: number;
  readonly burnRate: number;
  readonly projectedExhaustionDate?: string;
}

interface ComplianceReport {
  readonly mouId: MouId;
  readonly agencyId: AgencyId;
  readonly generatedAt: string;
  readonly overallStatus: SlaStatus;
  readonly slaStatuses: Record<string, SlaStatus>;
  readonly activeViolations: number;
  readonly compliancePercentage: number;
  readonly recommendations: readonly string[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockSlaEnforcementService() {
  const slas = new Map<SlaId, SlaDef>();
  const measurements: SlaMeasurement[] = [];
  const violations = new Map<ViolationId, SlaViolation>();
  const errorBudgets = new Map<string, ErrorBudget>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  return {
    // SLA Definition
    defineSla(
      mouId: MouId,
      category: SlaCategory,
      name: string,
      description: string,
      targetValue: number,
      warningThreshold: number,
      violationThreshold: number,
      unit: string,
      measurementFrequency: SlaDef['measurementFrequency'],
      gracePeriodHours: number,
      isHigherBetter: boolean
    ): SlaDef {
      const id = generateId('sla') as SlaId;

      const sla: SlaDef = {
        id,
        mouId,
        category,
        name,
        description,
        targetValue,
        warningThreshold,
        violationThreshold,
        unit,
        measurementFrequency,
        gracePeriodHours,
        isHigherBetter,
      };

      slas.set(id, sla);
      return sla;
    },

    getSla(id: SlaId): SlaDef | null {
      return slas.get(id) ?? null;
    },

    getSlasByMou(mouId: MouId): readonly SlaDef[] {
      return [...slas.values()].filter(s => s.mouId === mouId);
    },

    getSlasByCategory(category: SlaCategory): readonly SlaDef[] {
      return [...slas.values()].filter(s => s.category === category);
    },

    // Measurements
    recordMeasurement(slaId: SlaId, agencyId: AgencyId, value: number): SlaMeasurement | null {
      const sla = slas.get(slaId);
      if (!sla) return null;

      // Calculate status
      let status: SlaStatus = 'compliant';
      let delta = 0;

      if (sla.isHigherBetter) {
        delta = value - sla.targetValue;
        if (value < sla.violationThreshold) status = 'violation';
        else if (value < sla.warningThreshold) status = 'warning';
      } else {
        delta = sla.targetValue - value;
        if (value > sla.violationThreshold) status = 'violation';
        else if (value > sla.warningThreshold) status = 'warning';
      }

      const measurement: SlaMeasurement = {
        id: generateId('measurement') as MeasurementId,
        slaId,
        agencyId,
        value,
        measuredAt: new Date().toISOString(),
        status,
        delta,
      };

      measurements.push(measurement);

      // Create violation if needed
      if (status === 'violation') {
        this.createViolation(slaId, agencyId, value, sla);
      }

      // Update error budget
      if (status !== 'compliant') {
        this.consumeErrorBudget(slaId, agencyId, Math.abs(delta));
      }

      return measurement;
    },

    getMeasurements(
      slaId: SlaId,
      agencyId: AgencyId,
      limit: number = 100
    ): readonly SlaMeasurement[] {
      return measurements.filter(m => m.slaId === slaId && m.agencyId === agencyId).slice(-limit);
    },

    getLatestMeasurement(slaId: SlaId, agencyId: AgencyId): SlaMeasurement | null {
      const filtered = measurements.filter(m => m.slaId === slaId && m.agencyId === agencyId);
      return filtered.length > 0 ? filtered[filtered.length - 1] : null;
    },

    // Violations
    createViolation(slaId: SlaId, agencyId: AgencyId, value: number, sla: SlaDef): SlaViolation {
      const id = generateId('violation') as ViolationId;

      // Determine severity
      let severity: ViolationSeverity = 'minor';
      const distance = sla.isHigherBetter
        ? sla.violationThreshold - value
        : value - sla.violationThreshold;

      const range = sla.isHigherBetter
        ? sla.violationThreshold - sla.violationThreshold * 0.5
        : sla.violationThreshold * 0.5;

      if (distance > range * 2) severity = 'critical';
      else if (distance > range) severity = 'major';

      const violation: SlaViolation = {
        id,
        slaId,
        agencyId,
        severity,
        value,
        threshold: sla.violationThreshold,
        occurredAt: new Date().toISOString(),
      };

      violations.set(id, violation);
      return violation;
    },

    getViolation(id: ViolationId): SlaViolation | null {
      return violations.get(id) ?? null;
    },

    getActiveViolations(agencyId?: AgencyId): readonly SlaViolation[] {
      let result = [...violations.values()].filter(v => !v.resolvedAt);
      if (agencyId) {
        result = result.filter(v => v.agencyId === agencyId);
      }
      return result;
    },

    acknowledgeViolation(id: ViolationId): SlaViolation | null {
      const violation = violations.get(id);
      if (!violation) return null;

      const updated: SlaViolation = {
        ...violation,
        acknowledgedAt: new Date().toISOString(),
      };

      violations.set(id, updated);
      return updated;
    },

    resolveViolation(id: ViolationId, resolution: string): SlaViolation | null {
      const violation = violations.get(id);
      if (!violation) return null;

      const updated: SlaViolation = {
        ...violation,
        resolvedAt: new Date().toISOString(),
        resolution,
      };

      violations.set(id, updated);
      return updated;
    },

    getViolationsBySla(slaId: SlaId): readonly SlaViolation[] {
      return [...violations.values()].filter(v => v.slaId === slaId);
    },

    // Error Budgets
    initializeErrorBudget(
      slaId: SlaId,
      agencyId: AgencyId,
      totalBudget: number,
      periodStart: string,
      periodEnd: string
    ): ErrorBudget {
      const key = `${slaId}:${agencyId}`;

      const budget: ErrorBudget = {
        slaId,
        agencyId,
        periodStart,
        periodEnd,
        totalBudget,
        consumed: 0,
        remaining: totalBudget,
        burnRate: 0,
      };

      errorBudgets.set(key, budget);
      return budget;
    },

    getErrorBudget(slaId: SlaId, agencyId: AgencyId): ErrorBudget | null {
      const key = `${slaId}:${agencyId}`;
      return errorBudgets.get(key) ?? null;
    },

    consumeErrorBudget(slaId: SlaId, agencyId: AgencyId, amount: number): ErrorBudget | null {
      const key = `${slaId}:${agencyId}`;
      const budget = errorBudgets.get(key);
      if (!budget) return null;

      const newConsumed = budget.consumed + amount;
      const newRemaining = Math.max(0, budget.totalBudget - newConsumed);

      // Calculate burn rate (simplified)
      const periodStart = new Date(budget.periodStart).getTime();
      const now = Date.now();
      const elapsed = (now - periodStart) / (1000 * 60 * 60 * 24); // days
      const burnRate = elapsed > 0 ? newConsumed / elapsed : 0;

      // Project exhaustion
      let projectedExhaustionDate: string | undefined;
      if (burnRate > 0 && newRemaining > 0) {
        const daysRemaining = newRemaining / burnRate;
        const exhaustion = new Date(now + daysRemaining * 24 * 60 * 60 * 1000);
        projectedExhaustionDate = exhaustion.toISOString();
      }

      const updated: ErrorBudget = {
        ...budget,
        consumed: newConsumed,
        remaining: newRemaining,
        burnRate,
        projectedExhaustionDate,
      };

      errorBudgets.set(key, updated);
      return updated;
    },

    isErrorBudgetExhausted(slaId: SlaId, agencyId: AgencyId): boolean {
      const budget = this.getErrorBudget(slaId, agencyId);
      return budget ? budget.remaining <= 0 : false;
    },

    // Compliance Checking
    checkCompliance(slaId: SlaId, agencyId: AgencyId): SlaStatus {
      const latest = this.getLatestMeasurement(slaId, agencyId);
      return latest?.status ?? 'unknown';
    },

    calculateOverallCompliance(mouId: MouId, agencyId: AgencyId): number {
      const mouSlas = this.getSlasByMou(mouId);
      if (mouSlas.length === 0) return 100;

      let compliant = 0;
      for (const sla of mouSlas) {
        const status = this.checkCompliance(sla.id, agencyId);
        if (status === 'compliant') compliant++;
      }

      return Math.round((compliant / mouSlas.length) * 100);
    },

    // Compliance Report
    generateComplianceReport(mouId: MouId, agencyId: AgencyId): ComplianceReport {
      const mouSlas = this.getSlasByMou(mouId);
      const slaStatuses: Record<string, SlaStatus> = {};
      let overallStatus: SlaStatus = 'compliant';

      for (const sla of mouSlas) {
        const status = this.checkCompliance(sla.id, agencyId);
        slaStatuses[sla.name] = status;

        if (status === 'violation') overallStatus = 'violation';
        else if (status === 'warning' && overallStatus !== 'violation') overallStatus = 'warning';
        else if (status === 'unknown' && overallStatus === 'compliant') overallStatus = 'unknown';
      }

      const activeViolations = this.getActiveViolations(agencyId).length;
      const compliancePercentage = this.calculateOverallCompliance(mouId, agencyId);

      const recommendations: string[] = [];
      for (const [name, status] of Object.entries(slaStatuses)) {
        if (status === 'violation') {
          recommendations.push(`Immediate action required for ${name}`);
        } else if (status === 'warning') {
          recommendations.push(`Monitor ${name} closely`);
        }
      }

      return {
        mouId,
        agencyId,
        generatedAt: new Date().toISOString(),
        overallStatus,
        slaStatuses,
        activeViolations,
        compliancePercentage,
        recommendations,
      };
    },

    // Thresholds
    isWithinGracePeriod(slaId: SlaId, agencyId: AgencyId): boolean {
      const sla = slas.get(slaId);
      if (!sla) return false;

      const latest = this.getLatestMeasurement(slaId, agencyId);
      if (!latest || latest.status === 'compliant') return true;

      const measurementTime = new Date(latest.measuredAt).getTime();
      const graceEnd = measurementTime + sla.gracePeriodHours * 60 * 60 * 1000;

      return Date.now() < graceEnd;
    },

    // Pre-defined SLA Templates
    createOnboardingSla(mouId: MouId): SlaDef {
      return this.defineSla(
        mouId,
        'onboarding',
        'Onboarding Time',
        'Time to complete agency onboarding',
        5, // 5 days target
        7, // 7 days warning
        14, // 14 days violation
        'days',
        'daily',
        24,
        false // Lower is better
      );
    },

    createAttestationFreshnessSla(mouId: MouId): SlaDef {
      return this.defineSla(
        mouId,
        'attestation',
        'Attestation Freshness',
        'Percentage of attestations within validity period',
        100, // 100% target
        95, // 95% warning
        90, // 90% violation
        'percent',
        'daily',
        48,
        true // Higher is better
      );
    },

    createDrillComplianceSla(mouId: MouId): SlaDef {
      return this.defineSla(
        mouId,
        'drill',
        'Drill Compliance',
        'Percentage of scheduled drills completed',
        100, // 100% target
        90, // 90% warning
        80, // 80% violation
        'percent',
        'weekly',
        72,
        true // Higher is better
      );
    },

    createAvailabilitySla(mouId: MouId): SlaDef {
      return this.defineSla(
        mouId,
        'availability',
        'Service Availability',
        'Percentage uptime of shared services',
        99.9, // 99.9% target
        99.5, // 99.5% warning
        99.0, // 99% violation
        'percent',
        'hourly',
        2,
        true // Higher is better
      );
    },

    createResponseTimeSla(mouId: MouId): SlaDef {
      return this.defineSla(
        mouId,
        'response_time',
        'API Response Time',
        'P95 API response latency',
        200, // 200ms target
        350, // 350ms warning
        500, // 500ms violation
        'ms',
        'realtime',
        1,
        false // Lower is better
      );
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXII: MOU SLA Enforcement Contracts', () => {
  let slaService: ReturnType<typeof createMockSlaEnforcementService>;
  const mouA = 'sha256:mou_alpha' as MouId;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;

  beforeEach(() => {
    slaService = createMockSlaEnforcementService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate SLA IDs with sha256: prefix', () => {
      const sla = slaService.createOnboardingSla(mouA);
      assert.ok(sla.id.startsWith('sha256:'));
    });

    it('should generate measurement IDs with sha256: prefix', () => {
      const sla = slaService.createOnboardingSla(mouA);
      const measurement = slaService.recordMeasurement(sla.id, agencyA, 3);
      assert.ok(measurement?.id.startsWith('sha256:'));
    });

    it('should generate violation IDs with sha256: prefix', () => {
      const sla = slaService.createOnboardingSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 20); // Violates 14-day threshold
      const violations = slaService.getActiveViolations(agencyA);
      assert.ok(violations[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // SLA Definition Tests
  // ==========================================================================

  describe('SLA Definition', () => {
    it('should define custom SLA', () => {
      const sla = slaService.defineSla(
        mouA,
        'availability',
        'Custom SLA',
        'Description',
        99.9,
        99.5,
        99.0,
        'percent',
        'hourly',
        2,
        true
      );

      assert.ok(sla);
      assert.strictEqual(sla.category, 'availability');
    });

    it('should get SLA by ID', () => {
      const created = slaService.createOnboardingSla(mouA);
      const retrieved = slaService.getSla(created.id);

      assert.strictEqual(retrieved?.id, created.id);
    });

    it('should get SLAs by MOU', () => {
      slaService.createOnboardingSla(mouA);
      slaService.createAttestationFreshnessSla(mouA);

      const slas = slaService.getSlasByMou(mouA);
      assert.strictEqual(slas.length, 2);
    });

    it('should get SLAs by category', () => {
      slaService.createOnboardingSla(mouA);
      slaService.createDrillComplianceSla(mouA);

      const drillSlas = slaService.getSlasByCategory('drill');
      assert.strictEqual(drillSlas.length, 1);
    });
  });

  // ==========================================================================
  // Pre-defined SLA Templates Tests
  // ==========================================================================

  describe('Pre-defined SLA Templates', () => {
    it('should create onboarding SLA', () => {
      const sla = slaService.createOnboardingSla(mouA);
      assert.strictEqual(sla.category, 'onboarding');
      assert.strictEqual(sla.isHigherBetter, false);
    });

    it('should create attestation freshness SLA', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      assert.strictEqual(sla.category, 'attestation');
      assert.strictEqual(sla.targetValue, 100);
    });

    it('should create drill compliance SLA', () => {
      const sla = slaService.createDrillComplianceSla(mouA);
      assert.strictEqual(sla.category, 'drill');
      assert.strictEqual(sla.violationThreshold, 80);
    });

    it('should create availability SLA', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      assert.strictEqual(sla.category, 'availability');
      assert.strictEqual(sla.targetValue, 99.9);
    });

    it('should create response time SLA', () => {
      const sla = slaService.createResponseTimeSla(mouA);
      assert.strictEqual(sla.category, 'response_time');
      assert.strictEqual(sla.unit, 'ms');
    });
  });

  // ==========================================================================
  // Measurement Tests
  // ==========================================================================

  describe('Measurements', () => {
    it('should record compliant measurement', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      const measurement = slaService.recordMeasurement(sla.id, agencyA, 100);

      assert.strictEqual(measurement?.status, 'compliant');
    });

    it('should record warning measurement', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      const measurement = slaService.recordMeasurement(sla.id, agencyA, 93);

      assert.strictEqual(measurement?.status, 'warning');
    });

    it('should record violation measurement', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      const measurement = slaService.recordMeasurement(sla.id, agencyA, 85);

      assert.strictEqual(measurement?.status, 'violation');
    });

    it('should calculate delta from target', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      const measurement = slaService.recordMeasurement(sla.id, agencyA, 95);

      assert.strictEqual(measurement?.delta, -5);
    });

    it('should handle lower-is-better SLAs', () => {
      const sla = slaService.createOnboardingSla(mouA);
      const measurement = slaService.recordMeasurement(sla.id, agencyA, 3);

      assert.strictEqual(measurement?.status, 'compliant');
      assert.strictEqual(measurement?.delta, 2); // 5 - 3 = 2 (positive is good)
    });

    it('should get measurements for SLA and agency', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);
      slaService.recordMeasurement(sla.id, agencyA, 98);

      const measurements = slaService.getMeasurements(sla.id, agencyA);
      assert.strictEqual(measurements.length, 2);
    });

    it('should get latest measurement', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);
      slaService.recordMeasurement(sla.id, agencyA, 95);

      const latest = slaService.getLatestMeasurement(sla.id, agencyA);
      assert.strictEqual(latest?.value, 95);
    });
  });

  // ==========================================================================
  // Violation Tests
  // ==========================================================================

  describe('Violations', () => {
    it('should create violation on threshold breach', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const violations = slaService.getActiveViolations(agencyA);
      assert.strictEqual(violations.length, 1);
    });

    it('should assign severity based on distance', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const violations = slaService.getActiveViolations(agencyA);
      assert.ok(['minor', 'major', 'critical'].includes(violations[0].severity));
    });

    it('should acknowledge violation', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const violations = slaService.getActiveViolations(agencyA);
      const acked = slaService.acknowledgeViolation(violations[0].id);

      assert.ok(acked?.acknowledgedAt);
    });

    it('should resolve violation', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const violations = slaService.getActiveViolations(agencyA);
      const resolved = slaService.resolveViolation(violations[0].id, 'Issue fixed');

      assert.ok(resolved?.resolvedAt);
      assert.strictEqual(resolved?.resolution, 'Issue fixed');
    });

    it('should get violations by SLA', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);
      slaService.recordMeasurement(sla.id, agencyA, 82);

      const violations = slaService.getViolationsBySla(sla.id);
      assert.strictEqual(violations.length, 2);
    });

    it('should filter active violations', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const violations = slaService.getActiveViolations(agencyA);
      slaService.resolveViolation(violations[0].id, 'Fixed');

      const activeAfter = slaService.getActiveViolations(agencyA);
      assert.strictEqual(activeAfter.length, 0);
    });
  });

  // ==========================================================================
  // Error Budget Tests
  // ==========================================================================

  describe('Error Budgets', () => {
    it('should initialize error budget', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      const budget = slaService.initializeErrorBudget(
        sla.id,
        agencyA,
        0.1, // 0.1% error budget for 99.9% availability
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      );

      assert.strictEqual(budget.totalBudget, 0.1);
      assert.strictEqual(budget.remaining, 0.1);
    });

    it('should consume error budget on violation', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      slaService.initializeErrorBudget(
        sla.id,
        agencyA,
        0.1,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      );

      slaService.recordMeasurement(sla.id, agencyA, 98.5); // Below 99% threshold

      const budget = slaService.getErrorBudget(sla.id, agencyA);
      assert.ok(budget!.consumed > 0);
    });

    it('should track burn rate', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      slaService.initializeErrorBudget(
        sla.id,
        agencyA,
        0.1,
        start.toISOString(),
        '2024-01-31T23:59:59Z'
      );
      slaService.consumeErrorBudget(sla.id, agencyA, 0.02);

      const budget = slaService.getErrorBudget(sla.id, agencyA);
      assert.ok(budget!.burnRate > 0);
    });

    it('should check if budget exhausted', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      slaService.initializeErrorBudget(
        sla.id,
        agencyA,
        0.1,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      );

      const exhausted = slaService.isErrorBudgetExhausted(sla.id, agencyA);
      assert.strictEqual(exhausted, false);
    });

    it('should project exhaustion date', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      slaService.initializeErrorBudget(
        sla.id,
        agencyA,
        0.1,
        start.toISOString(),
        '2024-12-31T23:59:59Z'
      );
      slaService.consumeErrorBudget(sla.id, agencyA, 0.02);

      const budget = slaService.getErrorBudget(sla.id, agencyA);
      assert.ok(budget?.projectedExhaustionDate);
    });
  });

  // ==========================================================================
  // Compliance Checking Tests
  // ==========================================================================

  describe('Compliance Checking', () => {
    it('should check compliance status', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);

      const status = slaService.checkCompliance(sla.id, agencyA);
      assert.strictEqual(status, 'compliant');
    });

    it('should return unknown for no measurements', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      const status = slaService.checkCompliance(sla.id, agencyA);

      assert.strictEqual(status, 'unknown');
    });

    it('should calculate overall compliance percentage', () => {
      slaService.createAttestationFreshnessSla(mouA);
      slaService.createDrillComplianceSla(mouA);

      const percentage = slaService.calculateOverallCompliance(mouA, agencyA);
      assert.ok(percentage >= 0 && percentage <= 100);
    });
  });

  // ==========================================================================
  // Compliance Report Tests
  // ==========================================================================

  describe('Compliance Report', () => {
    it('should generate compliance report', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);

      const report = slaService.generateComplianceReport(mouA, agencyA);
      assert.ok(report.generatedAt);
    });

    it('should include SLA statuses', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);

      const report = slaService.generateComplianceReport(mouA, agencyA);
      assert.ok('Attestation Freshness' in report.slaStatuses);
    });

    it('should calculate overall status', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const report = slaService.generateComplianceReport(mouA, agencyA);
      assert.strictEqual(report.overallStatus, 'violation');
    });

    it('should count active violations', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const report = slaService.generateComplianceReport(mouA, agencyA);
      assert.strictEqual(report.activeViolations, 1);
    });

    it('should provide recommendations', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const report = slaService.generateComplianceReport(mouA, agencyA);
      assert.ok(report.recommendations.length > 0);
    });
  });

  // ==========================================================================
  // Grace Period Tests
  // ==========================================================================

  describe('Grace Period', () => {
    it('should check if within grace period', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 93); // Warning

      const withinGrace = slaService.isWithinGracePeriod(sla.id, agencyA);
      assert.strictEqual(withinGrace, true);
    });

    it('should return true if compliant', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);

      const withinGrace = slaService.isWithinGracePeriod(sla.id, agencyA);
      assert.strictEqual(withinGrace, true);
    });
  });

  // ==========================================================================
  // Multi-Agency Tests
  // ==========================================================================

  describe('Multi-Agency', () => {
    it('should isolate measurements by agency', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);
      slaService.recordMeasurement(sla.id, agencyB, 90);

      const measurementsA = slaService.getMeasurements(sla.id, agencyA);
      const measurementsB = slaService.getMeasurements(sla.id, agencyB);

      assert.strictEqual(measurementsA.length, 1);
      assert.strictEqual(measurementsB.length, 1);
      assert.strictEqual(measurementsA[0].value, 100);
      assert.strictEqual(measurementsB[0].value, 90);
    });

    it('should isolate violations by agency', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);

      const violationsA = slaService.getActiveViolations(agencyA);
      const violationsB = slaService.getActiveViolations(agencyB);

      assert.strictEqual(violationsA.length, 1);
      assert.strictEqual(violationsB.length, 0);
    });

    it('should isolate error budgets by agency', () => {
      const sla = slaService.createAvailabilitySla(mouA);
      slaService.initializeErrorBudget(sla.id, agencyA, 0.1, '2024-01-01', '2024-01-31');
      slaService.initializeErrorBudget(sla.id, agencyB, 0.2, '2024-01-01', '2024-01-31');

      const budgetA = slaService.getErrorBudget(sla.id, agencyA);
      const budgetB = slaService.getErrorBudget(sla.id, agencyB);

      assert.strictEqual(budgetA?.totalBudget, 0.1);
      assert.strictEqual(budgetB?.totalBudget, 0.2);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of SLAs by MOU', () => {
      slaService.createAttestationFreshnessSla(mouA);
      const s1 = slaService.getSlasByMou(mouA);
      const s2 = slaService.getSlasByMou(mouA);
      assert.ok(s1 !== s2);
    });

    it('should return copies of measurements', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 100);
      const m1 = slaService.getMeasurements(sla.id, agencyA);
      const m2 = slaService.getMeasurements(sla.id, agencyA);
      assert.ok(m1 !== m2);
    });

    it('should return copies of violations', () => {
      const sla = slaService.createAttestationFreshnessSla(mouA);
      slaService.recordMeasurement(sla.id, agencyA, 85);
      const v1 = slaService.getActiveViolations(agencyA);
      const v2 = slaService.getActiveViolations(agencyA);
      assert.ok(v1 !== v2);
    });
  });
});

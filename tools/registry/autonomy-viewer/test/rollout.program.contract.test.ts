/**
 * Phase XX — Live Adoption Rollout
 * =================================
 * Contract: rollout.program.contract.test.ts
 *
 * Tests rollout program topology: pilot → cohort → broad phases,
 * entrance/exit criteria, stop conditions, and rollback policy binding.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Rollout state is auditable and reproducible
 * - Stop conditions are binding and automatically enforced
 * - Entry/exit criteria are policy-driven
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type ServiceId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type CohortId = `sha256:${string}`;
type RolloutId = `sha256:${string}`;
type StopConditionId = `sha256:${string}`;

type RolloutPhase = 'pilot' | 'cohort' | 'broad';
type RolloutStatus = 'pending' | 'active' | 'paused' | 'completed' | 'rolled_back';
type StopConditionType =
  | 'mttr_regression'
  | 'rollback_failure'
  | 'audit_alert'
  | 'dr_drill_failure'
  | 'exception_abuse';

interface EntranceCriteria {
  readonly minReadinessScore: number;
  readonly attestationsCurrent: boolean;
  readonly minDrillCompliance: number;
  readonly noExpiredCriticalExceptions: boolean;
}

interface ExitCriteria {
  readonly kpiTargetsMetWeeks: number;
  readonly exceptionRateStable: boolean;
  readonly minGameDaySuccessRate: number;
}

interface StopCondition {
  readonly id: StopConditionId;
  readonly type: StopConditionType;
  readonly threshold: number;
  readonly triggeredAt?: string;
  readonly description: string;
}

interface ServiceEnrollment {
  readonly serviceId: ServiceId;
  readonly agencyId: AgencyId;
  readonly enrolledAt: string;
  readonly readinessScore: number;
  readonly phase: RolloutPhase;
  readonly status: 'pending' | 'enrolled' | 'graduated' | 'removed';
}

interface CohortDefinition {
  readonly id: CohortId;
  readonly name: string;
  readonly phase: RolloutPhase;
  readonly entranceCriteria: EntranceCriteria;
  readonly exitCriteria: ExitCriteria;
  readonly maxServices: number;
  readonly currentServices: number;
  readonly createdAt: string;
}

interface Rollout {
  readonly id: RolloutId;
  readonly name: string;
  readonly currentPhase: RolloutPhase;
  readonly status: RolloutStatus;
  readonly startedAt: string;
  readonly pausedAt?: string;
  readonly completedAt?: string;
  readonly rolledBackAt?: string;
  readonly stopConditions: readonly StopCondition[];
  readonly phaseHistory: readonly PhaseTransition[];
}

interface PhaseTransition {
  readonly fromPhase: RolloutPhase | null;
  readonly toPhase: RolloutPhase;
  readonly transitionedAt: string;
  readonly reason: string;
  readonly approvedBy: `sha256:${string}`;
}

interface RolloutSummary {
  readonly generatedAt: string;
  readonly rolloutId: RolloutId;
  readonly currentPhase: RolloutPhase;
  readonly status: RolloutStatus;
  readonly enrollmentsByPhase: Record<RolloutPhase, number>;
  readonly activeStopConditions: number;
  readonly graduatedServices: number;
  readonly removedServices: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockRolloutProgramService() {
  const rollouts = new Map<RolloutId, Rollout>();
  const cohorts = new Map<CohortId, CohortDefinition>();
  const enrollments = new Map<ServiceId, ServiceEnrollment>();
  const stopConditionLog: Array<{
    conditionId: StopConditionId;
    triggeredAt: string;
    rolloutId: RolloutId;
  }> = [];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  const defaultEntranceCriteria: Record<RolloutPhase, EntranceCriteria> = {
    pilot: {
      minReadinessScore: 90,
      attestationsCurrent: true,
      minDrillCompliance: 95,
      noExpiredCriticalExceptions: true,
    },
    cohort: {
      minReadinessScore: 80,
      attestationsCurrent: true,
      minDrillCompliance: 85,
      noExpiredCriticalExceptions: true,
    },
    broad: {
      minReadinessScore: 70,
      attestationsCurrent: true,
      minDrillCompliance: 75,
      noExpiredCriticalExceptions: true,
    },
  };

  const defaultExitCriteria: Record<RolloutPhase, ExitCriteria> = {
    pilot: {
      kpiTargetsMetWeeks: 4,
      exceptionRateStable: true,
      minGameDaySuccessRate: 95,
    },
    cohort: {
      kpiTargetsMetWeeks: 3,
      exceptionRateStable: true,
      minGameDaySuccessRate: 90,
    },
    broad: {
      kpiTargetsMetWeeks: 2,
      exceptionRateStable: true,
      minGameDaySuccessRate: 85,
    },
  };

  return {
    // Rollout Management
    createRollout(name: string): Rollout {
      const id = generateId('rollout') as RolloutId;
      const rollout: Rollout = {
        id,
        name,
        currentPhase: 'pilot',
        status: 'pending',
        startedAt: new Date().toISOString(),
        stopConditions: [
          {
            id: generateId('stop') as StopConditionId,
            type: 'mttr_regression',
            threshold: 20,
            description: 'MTTR regression > 20%',
          },
          {
            id: generateId('stop') as StopConditionId,
            type: 'rollback_failure',
            threshold: 1,
            description: 'Any rollback failure',
          },
          {
            id: generateId('stop') as StopConditionId,
            type: 'audit_alert',
            threshold: 1,
            description: 'Audit integrity alert',
          },
          {
            id: generateId('stop') as StopConditionId,
            type: 'dr_drill_failure',
            threshold: 1,
            description: 'DR drill failure',
          },
          {
            id: generateId('stop') as StopConditionId,
            type: 'exception_abuse',
            threshold: 10,
            description: 'Exception rate > 10%',
          },
        ],
        phaseHistory: [],
      };
      rollouts.set(id, rollout);
      return rollout;
    },

    getRollout(id: RolloutId): Rollout | null {
      return rollouts.get(id) ?? null;
    },

    startRollout(id: RolloutId, approvedBy: `sha256:${string}`): Rollout | null {
      const rollout = rollouts.get(id);
      if (!rollout || rollout.status !== 'pending') return null;

      const updated: Rollout = {
        ...rollout,
        status: 'active',
        phaseHistory: [
          ...rollout.phaseHistory,
          {
            fromPhase: null,
            toPhase: 'pilot',
            transitionedAt: new Date().toISOString(),
            reason: 'Rollout started',
            approvedBy,
          },
        ],
      };
      rollouts.set(id, updated);
      return updated;
    },

    pauseRollout(id: RolloutId, reason: string): Rollout | null {
      const rollout = rollouts.get(id);
      if (!rollout || rollout.status !== 'active') return null;

      const updated: Rollout = {
        ...rollout,
        status: 'paused',
        pausedAt: new Date().toISOString(),
      };
      rollouts.set(id, updated);
      return updated;
    },

    resumeRollout(id: RolloutId): Rollout | null {
      const rollout = rollouts.get(id);
      if (!rollout || rollout.status !== 'paused') return null;

      const updated: Rollout = {
        ...rollout,
        status: 'active',
        pausedAt: undefined,
      };
      rollouts.set(id, updated);
      return updated;
    },

    advancePhase(id: RolloutId, approvedBy: `sha256:${string}`): Rollout | null {
      const rollout = rollouts.get(id);
      if (!rollout || rollout.status !== 'active') return null;

      const nextPhase: RolloutPhase | null =
        rollout.currentPhase === 'pilot'
          ? 'cohort'
          : rollout.currentPhase === 'cohort'
            ? 'broad'
            : null;

      if (!nextPhase) return null;

      const updated: Rollout = {
        ...rollout,
        currentPhase: nextPhase,
        phaseHistory: [
          ...rollout.phaseHistory,
          {
            fromPhase: rollout.currentPhase,
            toPhase: nextPhase,
            transitionedAt: new Date().toISOString(),
            reason: `Advanced from ${rollout.currentPhase} to ${nextPhase}`,
            approvedBy,
          },
        ],
      };
      rollouts.set(id, updated);
      return updated;
    },

    completeRollout(id: RolloutId): Rollout | null {
      const rollout = rollouts.get(id);
      if (!rollout || rollout.status !== 'active' || rollout.currentPhase !== 'broad') return null;

      const updated: Rollout = {
        ...rollout,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      rollouts.set(id, updated);
      return updated;
    },

    rollbackRollout(id: RolloutId, reason: string): Rollout | null {
      const rollout = rollouts.get(id);
      if (!rollout || (rollout.status !== 'active' && rollout.status !== 'paused')) return null;

      const updated: Rollout = {
        ...rollout,
        status: 'rolled_back',
        rolledBackAt: new Date().toISOString(),
      };
      rollouts.set(id, updated);
      return updated;
    },

    // Stop Condition Management
    triggerStopCondition(
      rolloutId: RolloutId,
      conditionType: StopConditionType
    ): StopCondition | null {
      const rollout = rollouts.get(rolloutId);
      if (!rollout) return null;

      const condition = rollout.stopConditions.find(c => c.type === conditionType);
      if (!condition || condition.triggeredAt) return null;

      const triggered: StopCondition = {
        ...condition,
        triggeredAt: new Date().toISOString(),
      };

      // Update rollout with triggered condition
      const updatedConditions = rollout.stopConditions.map(c =>
        c.id === condition.id ? triggered : c
      );

      const updated: Rollout = {
        ...rollout,
        stopConditions: updatedConditions,
        status: 'paused', // Auto-pause on stop condition
        pausedAt: new Date().toISOString(),
      };
      rollouts.set(rolloutId, updated);

      stopConditionLog.push({
        conditionId: condition.id,
        triggeredAt: triggered.triggeredAt!,
        rolloutId,
      });

      return triggered;
    },

    getActiveStopConditions(rolloutId: RolloutId): readonly StopCondition[] {
      const rollout = rollouts.get(rolloutId);
      if (!rollout) return [];
      return rollout.stopConditions.filter(c => c.triggeredAt);
    },

    // Cohort Management
    createCohort(name: string, phase: RolloutPhase, maxServices: number): CohortDefinition {
      const id = generateId('cohort') as CohortId;
      const cohort: CohortDefinition = {
        id,
        name,
        phase,
        entranceCriteria: defaultEntranceCriteria[phase],
        exitCriteria: defaultExitCriteria[phase],
        maxServices,
        currentServices: 0,
        createdAt: new Date().toISOString(),
      };
      cohorts.set(id, cohort);
      return cohort;
    },

    getCohort(id: CohortId): CohortDefinition | null {
      return cohorts.get(id) ?? null;
    },

    getCohortsByPhase(phase: RolloutPhase): readonly CohortDefinition[] {
      return [...cohorts.values()].filter(c => c.phase === phase);
    },

    // Service Enrollment
    enrollService(
      serviceId: ServiceId,
      agencyId: AgencyId,
      phase: RolloutPhase,
      readinessScore: number
    ): ServiceEnrollment | null {
      // Check entrance criteria
      const criteria = defaultEntranceCriteria[phase];
      if (readinessScore < criteria.minReadinessScore) return null;

      const enrollment: ServiceEnrollment = {
        serviceId,
        agencyId,
        enrolledAt: new Date().toISOString(),
        readinessScore,
        phase,
        status: 'enrolled',
      };
      enrollments.set(serviceId, enrollment);
      return enrollment;
    },

    getEnrollment(serviceId: ServiceId): ServiceEnrollment | null {
      return enrollments.get(serviceId) ?? null;
    },

    graduateService(serviceId: ServiceId): ServiceEnrollment | null {
      const enrollment = enrollments.get(serviceId);
      if (!enrollment || enrollment.status !== 'enrolled') return null;

      const updated: ServiceEnrollment = {
        ...enrollment,
        status: 'graduated',
      };
      enrollments.set(serviceId, updated);
      return updated;
    },

    removeService(serviceId: ServiceId): ServiceEnrollment | null {
      const enrollment = enrollments.get(serviceId);
      if (!enrollment || enrollment.status === 'removed') return null;

      const updated: ServiceEnrollment = {
        ...enrollment,
        status: 'removed',
      };
      enrollments.set(serviceId, updated);
      return updated;
    },

    getEnrollmentsByPhase(phase: RolloutPhase): readonly ServiceEnrollment[] {
      return [...enrollments.values()].filter(e => e.phase === phase && e.status === 'enrolled');
    },

    getEnrollmentsByAgency(agencyId: AgencyId): readonly ServiceEnrollment[] {
      return [...enrollments.values()].filter(e => e.agencyId === agencyId);
    },

    // Eligibility Checks
    checkEligibility(
      readinessScore: number,
      attestationsCurrent: boolean,
      drillCompliance: number,
      hasExpiredCriticalExceptions: boolean,
      targetPhase: RolloutPhase
    ): { eligible: boolean; failures: string[] } {
      const criteria = defaultEntranceCriteria[targetPhase];
      const failures: string[] = [];

      if (readinessScore < criteria.minReadinessScore) {
        failures.push(`Readiness score ${readinessScore} < required ${criteria.minReadinessScore}`);
      }
      if (criteria.attestationsCurrent && !attestationsCurrent) {
        failures.push('Attestations not current');
      }
      if (drillCompliance < criteria.minDrillCompliance) {
        failures.push(
          `Drill compliance ${drillCompliance}% < required ${criteria.minDrillCompliance}%`
        );
      }
      if (criteria.noExpiredCriticalExceptions && hasExpiredCriticalExceptions) {
        failures.push('Has expired critical exceptions');
      }

      return { eligible: failures.length === 0, failures };
    },

    checkExitCriteria(
      kpiWeeksMet: number,
      exceptionRateStable: boolean,
      gameDaySuccessRate: number,
      currentPhase: RolloutPhase
    ): { met: boolean; failures: string[] } {
      const criteria = defaultExitCriteria[currentPhase];
      const failures: string[] = [];

      if (kpiWeeksMet < criteria.kpiTargetsMetWeeks) {
        failures.push(`KPI weeks met ${kpiWeeksMet} < required ${criteria.kpiTargetsMetWeeks}`);
      }
      if (criteria.exceptionRateStable && !exceptionRateStable) {
        failures.push('Exception rate not stable');
      }
      if (gameDaySuccessRate < criteria.minGameDaySuccessRate) {
        failures.push(
          `Game day success rate ${gameDaySuccessRate}% < required ${criteria.minGameDaySuccessRate}%`
        );
      }

      return { met: failures.length === 0, failures };
    },

    getEntranceCriteria(phase: RolloutPhase): EntranceCriteria {
      return { ...defaultEntranceCriteria[phase] };
    },

    getExitCriteria(phase: RolloutPhase): ExitCriteria {
      return { ...defaultExitCriteria[phase] };
    },

    // Summary Generation
    generateRolloutSummary(rolloutId: RolloutId): RolloutSummary | null {
      const rollout = rollouts.get(rolloutId);
      if (!rollout) return null;

      const allEnrollments = [...enrollments.values()];
      const enrollmentsByPhase: Record<RolloutPhase, number> = {
        pilot: allEnrollments.filter(e => e.phase === 'pilot' && e.status === 'enrolled').length,
        cohort: allEnrollments.filter(e => e.phase === 'cohort' && e.status === 'enrolled').length,
        broad: allEnrollments.filter(e => e.phase === 'broad' && e.status === 'enrolled').length,
      };

      return {
        generatedAt: new Date().toISOString(),
        rolloutId,
        currentPhase: rollout.currentPhase,
        status: rollout.status,
        enrollmentsByPhase,
        activeStopConditions: rollout.stopConditions.filter(c => c.triggeredAt).length,
        graduatedServices: allEnrollments.filter(e => e.status === 'graduated').length,
        removedServices: allEnrollments.filter(e => e.status === 'removed').length,
      };
    },

    getPhaseHistory(rolloutId: RolloutId): readonly PhaseTransition[] {
      const rollout = rollouts.get(rolloutId);
      return rollout?.phaseHistory ?? [];
    },

    getStopConditionLog(): readonly {
      conditionId: StopConditionId;
      triggeredAt: string;
      rolloutId: RolloutId;
    }[] {
      return [...stopConditionLog];
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XX: Rollout Program Contracts', () => {
  let program: ReturnType<typeof createMockRolloutProgramService>;
  const approver = 'sha256:approver_001' as `sha256:${string}`;
  const agencyA = 'sha256:agency_alpha' as AgencyId;

  beforeEach(() => {
    program = createMockRolloutProgramService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate rollout IDs with sha256: prefix', () => {
      const rollout = program.createRollout('Q1 2026 Rollout');
      assert.ok(rollout.id.startsWith('sha256:'));
    });

    it('should generate cohort IDs with sha256: prefix', () => {
      const cohort = program.createCohort('Pilot Cohort', 'pilot', 3);
      assert.ok(cohort.id.startsWith('sha256:'));
    });

    it('should generate stop condition IDs with sha256: prefix', () => {
      const rollout = program.createRollout('Test');
      assert.ok(rollout.stopConditions.every(c => c.id.startsWith('sha256:')));
    });
  });

  // ==========================================================================
  // Rollout Lifecycle Tests
  // ==========================================================================

  describe('Rollout Lifecycle', () => {
    it('should create rollout in pending state', () => {
      const rollout = program.createRollout('Q1 2026');
      assert.strictEqual(rollout.status, 'pending');
      assert.strictEqual(rollout.currentPhase, 'pilot');
    });

    it('should start rollout', () => {
      const rollout = program.createRollout('Q1 2026');
      const started = program.startRollout(rollout.id, approver);
      assert.strictEqual(started?.status, 'active');
      assert.strictEqual(started?.phaseHistory.length, 1);
    });

    it('should not start already started rollout', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const result = program.startRollout(rollout.id, approver);
      assert.strictEqual(result, null);
    });

    it('should pause rollout', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const paused = program.pauseRollout(rollout.id, 'Investigation needed');
      assert.strictEqual(paused?.status, 'paused');
      assert.ok(paused?.pausedAt);
    });

    it('should resume paused rollout', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.pauseRollout(rollout.id, 'Investigation');
      const resumed = program.resumeRollout(rollout.id);
      assert.strictEqual(resumed?.status, 'active');
    });

    it('should advance phase from pilot to cohort', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const advanced = program.advancePhase(rollout.id, approver);
      assert.strictEqual(advanced?.currentPhase, 'cohort');
      assert.strictEqual(advanced?.phaseHistory.length, 2);
    });

    it('should advance phase from cohort to broad', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.advancePhase(rollout.id, approver); // pilot → cohort
      const advanced = program.advancePhase(rollout.id, approver); // cohort → broad
      assert.strictEqual(advanced?.currentPhase, 'broad');
    });

    it('should not advance beyond broad', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.advancePhase(rollout.id, approver);
      program.advancePhase(rollout.id, approver);
      const result = program.advancePhase(rollout.id, approver);
      assert.strictEqual(result, null);
    });

    it('should complete rollout in broad phase', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.advancePhase(rollout.id, approver);
      program.advancePhase(rollout.id, approver);
      const completed = program.completeRollout(rollout.id);
      assert.strictEqual(completed?.status, 'completed');
      assert.ok(completed?.completedAt);
    });

    it('should not complete rollout before broad phase', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const result = program.completeRollout(rollout.id);
      assert.strictEqual(result, null);
    });

    it('should rollback active rollout', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const rolledBack = program.rollbackRollout(rollout.id, 'Critical issue discovered');
      assert.strictEqual(rolledBack?.status, 'rolled_back');
      assert.ok(rolledBack?.rolledBackAt);
    });
  });

  // ==========================================================================
  // Stop Condition Tests
  // ==========================================================================

  describe('Stop Conditions', () => {
    it('should have default stop conditions', () => {
      const rollout = program.createRollout('Q1 2026');
      assert.strictEqual(rollout.stopConditions.length, 5);
    });

    it('should trigger stop condition and auto-pause', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const triggered = program.triggerStopCondition(rollout.id, 'mttr_regression');
      assert.ok(triggered?.triggeredAt);

      const updated = program.getRollout(rollout.id);
      assert.strictEqual(updated?.status, 'paused');
    });

    it('should not trigger same condition twice', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.triggerStopCondition(rollout.id, 'mttr_regression');
      const result = program.triggerStopCondition(rollout.id, 'mttr_regression');
      assert.strictEqual(result, null);
    });

    it('should track active stop conditions', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.triggerStopCondition(rollout.id, 'mttr_regression');

      const active = program.getActiveStopConditions(rollout.id);
      assert.strictEqual(active.length, 1);
      assert.strictEqual(active[0].type, 'mttr_regression');
    });

    it('should log stop condition triggers', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.triggerStopCondition(rollout.id, 'dr_drill_failure');

      const log = program.getStopConditionLog();
      assert.strictEqual(log.length, 1);
      assert.strictEqual(log[0].rolloutId, rollout.id);
    });
  });

  // ==========================================================================
  // Cohort Management Tests
  // ==========================================================================

  describe('Cohort Management', () => {
    it('should create cohort with phase-specific criteria', () => {
      const cohort = program.createCohort('Pilot A', 'pilot', 3);
      assert.strictEqual(cohort.phase, 'pilot');
      assert.strictEqual(cohort.maxServices, 3);
      assert.strictEqual(cohort.entranceCriteria.minReadinessScore, 90);
    });

    it('should have stricter criteria for pilot than cohort', () => {
      const pilot = program.getEntranceCriteria('pilot');
      const cohort = program.getEntranceCriteria('cohort');
      assert.ok(pilot.minReadinessScore > cohort.minReadinessScore);
      assert.ok(pilot.minDrillCompliance > cohort.minDrillCompliance);
    });

    it('should have stricter criteria for cohort than broad', () => {
      const cohort = program.getEntranceCriteria('cohort');
      const broad = program.getEntranceCriteria('broad');
      assert.ok(cohort.minReadinessScore > broad.minReadinessScore);
    });

    it('should get cohorts by phase', () => {
      program.createCohort('Pilot A', 'pilot', 3);
      program.createCohort('Pilot B', 'pilot', 3);
      program.createCohort('Cohort A', 'cohort', 10);

      const pilotCohorts = program.getCohortsByPhase('pilot');
      assert.strictEqual(pilotCohorts.length, 2);
    });
  });

  // ==========================================================================
  // Service Enrollment Tests
  // ==========================================================================

  describe('Service Enrollment', () => {
    it('should enroll service meeting criteria', () => {
      const enrollment = program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      assert.ok(enrollment);
      assert.strictEqual(enrollment.status, 'enrolled');
    });

    it('should reject service below readiness threshold', () => {
      const enrollment = program.enrollService(
        'sha256:svc_001' as ServiceId,
        agencyA,
        'pilot',
        80 // Below 90 required for pilot
      );
      assert.strictEqual(enrollment, null);
    });

    it('should graduate enrolled service', () => {
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      const graduated = program.graduateService('sha256:svc_001' as ServiceId);
      assert.strictEqual(graduated?.status, 'graduated');
    });

    it('should remove service from rollout', () => {
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      const removed = program.removeService('sha256:svc_001' as ServiceId);
      assert.strictEqual(removed?.status, 'removed');
    });

    it('should get enrollments by phase', () => {
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      program.enrollService('sha256:svc_002' as ServiceId, agencyA, 'cohort', 85);

      const pilotEnrollments = program.getEnrollmentsByPhase('pilot');
      assert.strictEqual(pilotEnrollments.length, 1);
    });

    it('should get enrollments by agency', () => {
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      program.enrollService('sha256:svc_002' as ServiceId, agencyA, 'cohort', 85);

      const agencyEnrollments = program.getEnrollmentsByAgency(agencyA);
      assert.strictEqual(agencyEnrollments.length, 2);
    });
  });

  // ==========================================================================
  // Eligibility Tests
  // ==========================================================================

  describe('Eligibility Checks', () => {
    it('should pass eligibility for compliant service', () => {
      const result = program.checkEligibility(95, true, 98, false, 'pilot');
      assert.strictEqual(result.eligible, true);
      assert.strictEqual(result.failures.length, 0);
    });

    it('should fail eligibility for low readiness', () => {
      const result = program.checkEligibility(80, true, 98, false, 'pilot');
      assert.strictEqual(result.eligible, false);
      assert.ok(result.failures.some(f => f.includes('Readiness score')));
    });

    it('should fail eligibility for expired attestations', () => {
      const result = program.checkEligibility(95, false, 98, false, 'pilot');
      assert.strictEqual(result.eligible, false);
      assert.ok(result.failures.some(f => f.includes('Attestations')));
    });

    it('should fail eligibility for low drill compliance', () => {
      const result = program.checkEligibility(95, true, 80, false, 'pilot');
      assert.strictEqual(result.eligible, false);
      assert.ok(result.failures.some(f => f.includes('Drill compliance')));
    });

    it('should fail eligibility for expired critical exceptions', () => {
      const result = program.checkEligibility(95, true, 98, true, 'pilot');
      assert.strictEqual(result.eligible, false);
      assert.ok(result.failures.some(f => f.includes('expired critical exceptions')));
    });

    it('should accumulate multiple failures', () => {
      const result = program.checkEligibility(50, false, 50, true, 'pilot');
      assert.strictEqual(result.eligible, false);
      assert.ok(result.failures.length >= 3);
    });
  });

  // ==========================================================================
  // Exit Criteria Tests
  // ==========================================================================

  describe('Exit Criteria Checks', () => {
    it('should pass exit for meeting all criteria', () => {
      const result = program.checkExitCriteria(4, true, 98, 'pilot');
      assert.strictEqual(result.met, true);
    });

    it('should fail exit for insufficient KPI weeks', () => {
      const result = program.checkExitCriteria(2, true, 98, 'pilot');
      assert.strictEqual(result.met, false);
      assert.ok(result.failures.some(f => f.includes('KPI weeks')));
    });

    it('should fail exit for unstable exception rate', () => {
      const result = program.checkExitCriteria(4, false, 98, 'pilot');
      assert.strictEqual(result.met, false);
      assert.ok(result.failures.some(f => f.includes('Exception rate')));
    });

    it('should fail exit for low game day success', () => {
      const result = program.checkExitCriteria(4, true, 80, 'pilot');
      assert.strictEqual(result.met, false);
      assert.ok(result.failures.some(f => f.includes('Game day success')));
    });

    it('should have stricter exit criteria for pilot', () => {
      const pilotExit = program.getExitCriteria('pilot');
      const cohortExit = program.getExitCriteria('cohort');
      assert.ok(pilotExit.kpiTargetsMetWeeks >= cohortExit.kpiTargetsMetWeeks);
      assert.ok(pilotExit.minGameDaySuccessRate >= cohortExit.minGameDaySuccessRate);
    });
  });

  // ==========================================================================
  // Summary Generation Tests
  // ==========================================================================

  describe('Summary Generation', () => {
    it('should generate rollout summary', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      const summary = program.generateRolloutSummary(rollout.id);
      assert.ok(summary);
      assert.strictEqual(summary.rolloutId, rollout.id);
      assert.ok(summary.generatedAt);
    });

    it('should count enrollments by phase', () => {
      const rollout = program.createRollout('Q1 2026');
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      program.enrollService('sha256:svc_002' as ServiceId, agencyA, 'cohort', 85);

      const summary = program.generateRolloutSummary(rollout.id);
      assert.strictEqual(summary?.enrollmentsByPhase.pilot, 1);
      assert.strictEqual(summary?.enrollmentsByPhase.cohort, 1);
    });

    it('should count graduated services', () => {
      const rollout = program.createRollout('Q1 2026');
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      program.graduateService('sha256:svc_001' as ServiceId);

      const summary = program.generateRolloutSummary(rollout.id);
      assert.strictEqual(summary?.graduatedServices, 1);
    });

    it('should count removed services', () => {
      const rollout = program.createRollout('Q1 2026');
      program.enrollService('sha256:svc_001' as ServiceId, agencyA, 'pilot', 95);
      program.removeService('sha256:svc_001' as ServiceId);

      const summary = program.generateRolloutSummary(rollout.id);
      assert.strictEqual(summary?.removedServices, 1);
    });

    it('should track active stop conditions', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.triggerStopCondition(rollout.id, 'audit_alert');

      const summary = program.generateRolloutSummary(rollout.id);
      assert.strictEqual(summary?.activeStopConditions, 1);
    });
  });

  // ==========================================================================
  // Phase History Tests
  // ==========================================================================

  describe('Phase History', () => {
    it('should track phase transitions', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);
      program.advancePhase(rollout.id, approver);

      const history = program.getPhaseHistory(rollout.id);
      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].toPhase, 'pilot');
      assert.strictEqual(history[1].toPhase, 'cohort');
    });

    it('should record approver for each transition', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);

      const history = program.getPhaseHistory(rollout.id);
      assert.strictEqual(history[0].approvedBy, approver);
    });

    it('should record transition timestamps', () => {
      const rollout = program.createRollout('Q1 2026');
      program.startRollout(rollout.id, approver);

      const history = program.getPhaseHistory(rollout.id);
      assert.ok(history[0].transitionedAt);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of entrance criteria', () => {
      const criteria1 = program.getEntranceCriteria('pilot');
      const criteria2 = program.getEntranceCriteria('pilot');
      assert.ok(criteria1 !== criteria2);
    });

    it('should return copies of exit criteria', () => {
      const criteria1 = program.getExitCriteria('pilot');
      const criteria2 = program.getExitCriteria('pilot');
      assert.ok(criteria1 !== criteria2);
    });

    it('should generate fresh summary each call', () => {
      const rollout = program.createRollout('Q1 2026');
      const s1 = program.generateRolloutSummary(rollout.id);
      const s2 = program.generateRolloutSummary(rollout.id);
      assert.ok(s1 !== s2);
    });
  });
});

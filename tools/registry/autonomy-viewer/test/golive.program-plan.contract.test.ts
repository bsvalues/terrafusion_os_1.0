/**
 * Phase XXIII — Global Program Synthesis + Go-Live Playbook
 * ==========================================================
 * Contract: golive.program-plan.contract.test.ts
 *
 * Tests program plan: cohort definitions, rollout schedules,
 * readiness thresholds, stop conditions, and auto-pause logic.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Cohort rollout is deterministic and bounded
 * - Stop conditions trigger automatic pause
 * - Readiness thresholds gate progression
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type CohortId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type PlanId = `sha256:${string}`;
type StopConditionId = `sha256:${string}`;
type RolloutId = `sha256:${string}`;

type CohortStage = 'pilot' | 'early_adopter' | 'general' | 'broad' | 'complete';
type RolloutStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'aborted';
type StopConditionType =
  | 'mttr_regression'
  | 'rollback_failure'
  | 'dr_failure'
  | 'audit_integrity'
  | 'sla_breach'
  | 'security_incident';

interface Cohort {
  readonly id: CohortId;
  readonly name: string;
  readonly stage: CohortStage;
  readonly agencies: readonly AgencyId[];
  readonly serviceScope: readonly string[];
  readonly maxConcurrentRollouts: number;
  readonly readinessThreshold: number;
  readonly createdAt: string;
}

interface BlackoutWindow {
  readonly start: string;
  readonly end: string;
  readonly reason: string;
  readonly scope: 'global' | 'cohort' | 'agency';
  readonly targetId?: CohortId | AgencyId;
}

interface RolloutSchedule {
  readonly id: RolloutId;
  readonly cohortId: CohortId;
  readonly plannedStart: string;
  readonly plannedEnd: string;
  readonly status: RolloutStatus;
  readonly actualStart?: string;
  readonly actualEnd?: string;
  readonly pausedAt?: string;
  readonly pauseReason?: string;
  readonly resumedAt?: string;
  readonly resumedBy?: string;
}

interface StopCondition {
  readonly id: StopConditionId;
  readonly type: StopConditionType;
  readonly threshold: number;
  readonly windowHours: number;
  readonly stage: CohortStage | 'all';
  readonly autoResumeEnabled: boolean;
  readonly notificationChannels: readonly string[];
}

interface ReadinessThreshold {
  readonly metric: string;
  readonly minimumValue: number;
  readonly unit: string;
  readonly required: boolean;
  readonly weight: number;
}

interface ProgramPlan {
  readonly id: PlanId;
  readonly name: string;
  readonly version: string;
  readonly status: 'draft' | 'approved' | 'active' | 'completed' | 'cancelled';
  readonly cohorts: readonly Cohort[];
  readonly schedules: readonly RolloutSchedule[];
  readonly stopConditions: readonly StopCondition[];
  readonly readinessThresholds: readonly ReadinessThreshold[];
  readonly blackoutWindows: readonly BlackoutWindow[];
  readonly createdAt: string;
  readonly approvedAt?: string;
  readonly approvedBy?: string;
}

interface RolloutPauseEvent {
  readonly rolloutId: RolloutId;
  readonly stopConditionId: StopConditionId;
  readonly triggeredAt: string;
  readonly metricValue: number;
  readonly threshold: number;
  readonly requiresApprovalToResume: boolean;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockProgramPlanService() {
  const plans = new Map<PlanId, ProgramPlan>();
  const pauseEvents: RolloutPauseEvent[] = [];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  const defaultStopConditions: StopCondition[] = [
    {
      id: generateId('stop') as StopConditionId,
      type: 'mttr_regression',
      threshold: 1.5,
      windowHours: 24,
      stage: 'all',
      autoResumeEnabled: false,
      notificationChannels: ['pagerduty', 'slack'],
    },
    {
      id: generateId('stop') as StopConditionId,
      type: 'rollback_failure',
      threshold: 1,
      windowHours: 1,
      stage: 'all',
      autoResumeEnabled: false,
      notificationChannels: ['pagerduty', 'slack', 'email'],
    },
    {
      id: generateId('stop') as StopConditionId,
      type: 'dr_failure',
      threshold: 1,
      windowHours: 168,
      stage: 'all',
      autoResumeEnabled: false,
      notificationChannels: ['pagerduty', 'slack', 'email'],
    },
    {
      id: generateId('stop') as StopConditionId,
      type: 'audit_integrity',
      threshold: 1,
      windowHours: 1,
      stage: 'all',
      autoResumeEnabled: false,
      notificationChannels: ['pagerduty', 'slack', 'email', 'executive'],
    },
    {
      id: generateId('stop') as StopConditionId,
      type: 'sla_breach',
      threshold: 3,
      windowHours: 24,
      stage: 'broad',
      autoResumeEnabled: true,
      notificationChannels: ['slack'],
    },
    {
      id: generateId('stop') as StopConditionId,
      type: 'security_incident',
      threshold: 1,
      windowHours: 1,
      stage: 'all',
      autoResumeEnabled: false,
      notificationChannels: ['pagerduty', 'slack', 'email', 'executive', 'ciso'],
    },
  ];

  const defaultReadinessThresholds: ReadinessThreshold[] = [
    {
      metric: 'onboarding_completion',
      minimumValue: 100,
      unit: 'percent',
      required: true,
      weight: 1.0,
    },
    {
      metric: 'attestation_freshness',
      minimumValue: 95,
      unit: 'percent',
      required: true,
      weight: 0.9,
    },
    { metric: 'drill_compliance', minimumValue: 90, unit: 'percent', required: true, weight: 0.8 },
    {
      metric: 'training_completion',
      minimumValue: 100,
      unit: 'percent',
      required: true,
      weight: 1.0,
    },
    {
      metric: 'exception_burn_down',
      minimumValue: 80,
      unit: 'percent',
      required: true,
      weight: 0.7,
    },
    {
      metric: 'key_rotation_compliant',
      minimumValue: 100,
      unit: 'percent',
      required: true,
      weight: 1.0,
    },
    { metric: 'dr_pass_rate', minimumValue: 100, unit: 'percent', required: true, weight: 1.0 },
  ];

  return {
    // Plan Management
    createPlan(name: string, version: string): ProgramPlan {
      const id = generateId('plan') as PlanId;

      const plan: ProgramPlan = {
        id,
        name,
        version,
        status: 'draft',
        cohorts: [],
        schedules: [],
        stopConditions: [...defaultStopConditions],
        readinessThresholds: [...defaultReadinessThresholds],
        blackoutWindows: [],
        createdAt: new Date().toISOString(),
      };

      plans.set(id, plan);
      return plan;
    },

    getPlan(id: PlanId): ProgramPlan | null {
      return plans.get(id) ?? null;
    },

    approvePlan(id: PlanId, approvedBy: string): ProgramPlan | null {
      const plan = plans.get(id);
      if (!plan || plan.status !== 'draft') return null;

      // Validate plan has cohorts and schedules
      if (plan.cohorts.length === 0) return null;
      if (plan.schedules.length === 0) return null;

      const updated: ProgramPlan = {
        ...plan,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy,
      };

      plans.set(id, updated);
      return updated;
    },

    activatePlan(id: PlanId): ProgramPlan | null {
      const plan = plans.get(id);
      if (!plan || plan.status !== 'approved') return null;

      const updated: ProgramPlan = { ...plan, status: 'active' };
      plans.set(id, updated);
      return updated;
    },

    // Cohort Management
    addCohort(
      planId: PlanId,
      name: string,
      stage: CohortStage,
      agencies: readonly AgencyId[],
      serviceScope: readonly string[],
      maxConcurrentRollouts: number = 3,
      readinessThreshold: number = 95
    ): Cohort | null {
      const plan = plans.get(planId);
      if (!plan || plan.status !== 'draft') return null;

      const cohort: Cohort = {
        id: generateId('cohort') as CohortId,
        name,
        stage,
        agencies,
        serviceScope,
        maxConcurrentRollouts,
        readinessThreshold,
        createdAt: new Date().toISOString(),
      };

      const updated: ProgramPlan = {
        ...plan,
        cohorts: [...plan.cohorts, cohort],
      };

      plans.set(planId, updated);
      return cohort;
    },

    getCohort(planId: PlanId, cohortId: CohortId): Cohort | null {
      const plan = plans.get(planId);
      return plan?.cohorts.find(c => c.id === cohortId) ?? null;
    },

    getCohortsByStage(planId: PlanId, stage: CohortStage): readonly Cohort[] {
      const plan = plans.get(planId);
      return plan?.cohorts.filter(c => c.stage === stage) ?? [];
    },

    // Schedule Management
    scheduleRollout(
      planId: PlanId,
      cohortId: CohortId,
      plannedStart: string,
      plannedEnd: string
    ): RolloutSchedule | null {
      const plan = plans.get(planId);
      if (!plan) return null;

      const cohort = plan.cohorts.find(c => c.id === cohortId);
      if (!cohort) return null;

      // Validate no overlap with existing schedules for same cohort
      const hasOverlap = plan.schedules.some(s => {
        if (s.cohortId !== cohortId) return false;
        const existingStart = new Date(s.plannedStart).getTime();
        const existingEnd = new Date(s.plannedEnd).getTime();
        const newStart = new Date(plannedStart).getTime();
        const newEnd = new Date(plannedEnd).getTime();
        return !(newEnd <= existingStart || newStart >= existingEnd);
      });

      if (hasOverlap) return null;

      // Validate duration is bounded (max 30 days)
      const durationDays =
        (new Date(plannedEnd).getTime() - new Date(plannedStart).getTime()) / (1000 * 60 * 60 * 24);
      if (durationDays > 30 || durationDays <= 0) return null;

      // Check blackout windows
      const inBlackout = this.isInBlackout(planId, plannedStart, plannedEnd, cohortId);
      if (inBlackout) return null;

      const schedule: RolloutSchedule = {
        id: generateId('rollout') as RolloutId,
        cohortId,
        plannedStart,
        plannedEnd,
        status: 'pending',
      };

      const updated: ProgramPlan = {
        ...plan,
        schedules: [...plan.schedules, schedule],
      };

      plans.set(planId, updated);
      return schedule;
    },

    getSchedule(planId: PlanId, rolloutId: RolloutId): RolloutSchedule | null {
      const plan = plans.get(planId);
      return plan?.schedules.find(s => s.id === rolloutId) ?? null;
    },

    startRollout(planId: PlanId, rolloutId: RolloutId): RolloutSchedule | null {
      const plan = plans.get(planId);
      if (!plan || plan.status !== 'active') return null;

      const scheduleIndex = plan.schedules.findIndex(s => s.id === rolloutId);
      if (scheduleIndex === -1) return null;

      const schedule = plan.schedules[scheduleIndex];
      if (schedule.status !== 'pending') return null;

      const updated: RolloutSchedule = {
        ...schedule,
        status: 'in_progress',
        actualStart: new Date().toISOString(),
      };

      const updatedSchedules = [...plan.schedules];
      updatedSchedules[scheduleIndex] = updated;

      plans.set(planId, { ...plan, schedules: updatedSchedules });
      return updated;
    },

    completeRollout(planId: PlanId, rolloutId: RolloutId): RolloutSchedule | null {
      const plan = plans.get(planId);
      if (!plan) return null;

      const scheduleIndex = plan.schedules.findIndex(s => s.id === rolloutId);
      if (scheduleIndex === -1) return null;

      const schedule = plan.schedules[scheduleIndex];
      if (schedule.status !== 'in_progress') return null;

      const updated: RolloutSchedule = {
        ...schedule,
        status: 'completed',
        actualEnd: new Date().toISOString(),
      };

      const updatedSchedules = [...plan.schedules];
      updatedSchedules[scheduleIndex] = updated;

      plans.set(planId, { ...plan, schedules: updatedSchedules });
      return updated;
    },

    // Stop Conditions & Pause Logic
    triggerStopCondition(
      planId: PlanId,
      rolloutId: RolloutId,
      conditionType: StopConditionType,
      metricValue: number
    ): RolloutPauseEvent | null {
      const plan = plans.get(planId);
      if (!plan) return null;

      const scheduleIndex = plan.schedules.findIndex(s => s.id === rolloutId);
      if (scheduleIndex === -1) return null;

      const schedule = plan.schedules[scheduleIndex];
      if (schedule.status !== 'in_progress') return null;

      const cohort = plan.cohorts.find(c => c.id === schedule.cohortId);
      if (!cohort) return null;

      const condition = plan.stopConditions.find(
        sc => sc.type === conditionType && (sc.stage === 'all' || sc.stage === cohort.stage)
      );
      if (!condition) return null;

      if (metricValue < condition.threshold) return null;

      // Pause the rollout
      const pausedSchedule: RolloutSchedule = {
        ...schedule,
        status: 'paused',
        pausedAt: new Date().toISOString(),
        pauseReason: `Stop condition triggered: ${conditionType} (${metricValue} >= ${condition.threshold})`,
      };

      const updatedSchedules = [...plan.schedules];
      updatedSchedules[scheduleIndex] = pausedSchedule;

      plans.set(planId, { ...plan, schedules: updatedSchedules });

      const pauseEvent: RolloutPauseEvent = {
        rolloutId,
        stopConditionId: condition.id,
        triggeredAt: new Date().toISOString(),
        metricValue,
        threshold: condition.threshold,
        requiresApprovalToResume: !condition.autoResumeEnabled,
      };

      pauseEvents.push(pauseEvent);
      return pauseEvent;
    },

    resumeRollout(planId: PlanId, rolloutId: RolloutId, resumedBy: string): RolloutSchedule | null {
      const plan = plans.get(planId);
      if (!plan) return null;

      const scheduleIndex = plan.schedules.findIndex(s => s.id === rolloutId);
      if (scheduleIndex === -1) return null;

      const schedule = plan.schedules[scheduleIndex];
      if (schedule.status !== 'paused') return null;

      const updated: RolloutSchedule = {
        ...schedule,
        status: 'in_progress',
        resumedAt: new Date().toISOString(),
        resumedBy,
      };

      const updatedSchedules = [...plan.schedules];
      updatedSchedules[scheduleIndex] = updated;

      plans.set(planId, { ...plan, schedules: updatedSchedules });
      return updated;
    },

    getPauseEvents(rolloutId: RolloutId): readonly RolloutPauseEvent[] {
      return pauseEvents.filter(e => e.rolloutId === rolloutId);
    },

    // Blackout Windows
    addBlackoutWindow(
      planId: PlanId,
      start: string,
      end: string,
      reason: string,
      scope: BlackoutWindow['scope'],
      targetId?: CohortId | AgencyId
    ): BlackoutWindow | null {
      const plan = plans.get(planId);
      if (!plan) return null;

      const window: BlackoutWindow = { start, end, reason, scope, targetId };

      const updated: ProgramPlan = {
        ...plan,
        blackoutWindows: [...plan.blackoutWindows, window],
      };

      plans.set(planId, updated);
      return window;
    },

    isInBlackout(planId: PlanId, start: string, end: string, cohortId?: CohortId): boolean {
      const plan = plans.get(planId);
      if (!plan) return false;

      const checkStart = new Date(start).getTime();
      const checkEnd = new Date(end).getTime();

      return plan.blackoutWindows.some(bw => {
        // Check scope applicability
        if (bw.scope === 'cohort' && bw.targetId !== cohortId) return false;

        const bwStart = new Date(bw.start).getTime();
        const bwEnd = new Date(bw.end).getTime();

        return !(checkEnd <= bwStart || checkStart >= bwEnd);
      });
    },

    getBlackoutWindows(planId: PlanId): readonly BlackoutWindow[] {
      const plan = plans.get(planId);
      return [...(plan?.blackoutWindows ?? [])];
    },

    // Readiness Thresholds
    getReadinessThresholds(planId: PlanId): readonly ReadinessThreshold[] {
      const plan = plans.get(planId);
      return [...(plan?.readinessThresholds ?? [])];
    },

    checkReadiness(
      planId: PlanId,
      metrics: Record<string, number>
    ): { ready: boolean; gaps: readonly string[]; score: number } {
      const plan = plans.get(planId);
      if (!plan) return { ready: false, gaps: ['Plan not found'], score: 0 };

      const gaps: string[] = [];
      let totalWeight = 0;
      let weightedScore = 0;

      for (const threshold of plan.readinessThresholds) {
        const value = metrics[threshold.metric] ?? 0;
        totalWeight += threshold.weight;

        if (value >= threshold.minimumValue) {
          weightedScore += threshold.weight;
        } else if (threshold.required) {
          gaps.push(
            `${threshold.metric}: ${value}${threshold.unit} < ${threshold.minimumValue}${threshold.unit}`
          );
        }
      }

      const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
      return { ready: gaps.length === 0, gaps, score };
    },

    addReadinessThreshold(
      planId: PlanId,
      threshold: ReadinessThreshold
    ): ReadinessThreshold | null {
      const plan = plans.get(planId);
      if (!plan || plan.status !== 'draft') return null;

      const updated: ProgramPlan = {
        ...plan,
        readinessThresholds: [...plan.readinessThresholds, threshold],
      };

      plans.set(planId, updated);
      return threshold;
    },

    // Stop Conditions
    getStopConditions(planId: PlanId): readonly StopCondition[] {
      const plan = plans.get(planId);
      return [...(plan?.stopConditions ?? [])];
    },

    getStopConditionsByStage(planId: PlanId, stage: CohortStage): readonly StopCondition[] {
      const plan = plans.get(planId);
      return (plan?.stopConditions ?? []).filter(sc => sc.stage === 'all' || sc.stage === stage);
    },

    addStopCondition(planId: PlanId, condition: Omit<StopCondition, 'id'>): StopCondition | null {
      const plan = plans.get(planId);
      if (!plan || plan.status !== 'draft') return null;

      const fullCondition: StopCondition = {
        ...condition,
        id: generateId('stop') as StopConditionId,
      };

      const updated: ProgramPlan = {
        ...plan,
        stopConditions: [...plan.stopConditions, fullCondition],
      };

      plans.set(planId, updated);
      return fullCondition;
    },

    // Validation
    validatePlan(planId: PlanId): { valid: boolean; errors: readonly string[] } {
      const plan = plans.get(planId);
      if (!plan) return { valid: false, errors: ['Plan not found'] };

      const errors: string[] = [];

      // Check cohort progression (pilot → early_adopter → general → broad → complete)
      const stageOrder: CohortStage[] = ['pilot', 'early_adopter', 'general', 'broad', 'complete'];
      const stages = new Set(plan.cohorts.map(c => c.stage));

      if (!stages.has('pilot')) {
        errors.push('Plan must include a pilot cohort');
      }

      // Check each cohort has at least one agency
      for (const cohort of plan.cohorts) {
        if (cohort.agencies.length === 0) {
          errors.push(`Cohort ${cohort.name} has no agencies`);
        }
      }

      // Check stop conditions cover all stages
      const coveredStages = new Set(
        plan.stopConditions.flatMap(sc => (sc.stage === 'all' ? stageOrder : [sc.stage]))
      );

      for (const stage of stages) {
        if (!coveredStages.has(stage)) {
          errors.push(`Stage ${stage} has no stop conditions`);
        }
      }

      // Check schedules don't overlap for same cohort
      const cohortSchedules = new Map<CohortId, RolloutSchedule[]>();
      for (const schedule of plan.schedules) {
        const existing = cohortSchedules.get(schedule.cohortId) ?? [];
        cohortSchedules.set(schedule.cohortId, [...existing, schedule]);
      }

      for (const [cohortId, schedules] of cohortSchedules) {
        for (let i = 0; i < schedules.length; i++) {
          for (let j = i + 1; j < schedules.length; j++) {
            const a = schedules[i];
            const b = schedules[j];
            const aStart = new Date(a.plannedStart).getTime();
            const aEnd = new Date(a.plannedEnd).getTime();
            const bStart = new Date(b.plannedStart).getTime();
            const bEnd = new Date(b.plannedEnd).getTime();

            if (!(aEnd <= bStart || aStart >= bEnd)) {
              errors.push(`Overlapping schedules for cohort ${cohortId}`);
            }
          }
        }
      }

      return { valid: errors.length === 0, errors };
    },

    // Progress Tracking
    getPlanProgress(planId: PlanId): { completed: number; total: number; percentage: number } {
      const plan = plans.get(planId);
      if (!plan) return { completed: 0, total: 0, percentage: 0 };

      const completed = plan.schedules.filter(s => s.status === 'completed').length;
      const total = plan.schedules.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage };
    },

    getActiveRollouts(planId: PlanId): readonly RolloutSchedule[] {
      const plan = plans.get(planId);
      return (plan?.schedules ?? []).filter(s => s.status === 'in_progress');
    },

    getPausedRollouts(planId: PlanId): readonly RolloutSchedule[] {
      const plan = plans.get(planId);
      return (plan?.schedules ?? []).filter(s => s.status === 'paused');
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIII: Go-Live Program Plan Contracts', () => {
  let planService: ReturnType<typeof createMockProgramPlanService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;
  const agencyC = 'sha256:agency_gamma' as AgencyId;

  beforeEach(() => {
    planService = createMockProgramPlanService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate plan IDs with sha256: prefix', () => {
      const plan = planService.createPlan('TerraFusion Go-Live', '1.0.0');
      assert.ok(plan.id.startsWith('sha256:'));
    });

    it('should generate cohort IDs with sha256: prefix', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      assert.ok(cohort?.id.startsWith('sha256:'));
    });

    it('should generate rollout IDs with sha256: prefix', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const cohort = plan.cohorts[0] ?? planService.getCohortsByStage(plan.id, 'pilot')[0];
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      assert.ok(schedule?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Plan Management Tests
  // ==========================================================================

  describe('Plan Management', () => {
    it('should create plan in draft status', () => {
      const plan = planService.createPlan('TerraFusion Go-Live', '1.0.0');
      assert.strictEqual(plan.status, 'draft');
    });

    it('should include default stop conditions', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      assert.ok(plan.stopConditions.length >= 5);
    });

    it('should include default readiness thresholds', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      assert.ok(plan.readinessThresholds.length >= 5);
    });

    it('should not approve plan without cohorts', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const approved = planService.approvePlan(plan.id, 'admin');
      assert.strictEqual(approved, null);
    });

    it('should not approve plan without schedules', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const approved = planService.approvePlan(plan.id, 'admin');
      assert.strictEqual(approved, null);
    });

    it('should approve valid plan', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      const approved = planService.approvePlan(plan.id, 'admin');

      assert.strictEqual(approved?.status, 'approved');
      assert.ok(approved?.approvedAt);
    });

    it('should activate approved plan', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      const activated = planService.activatePlan(plan.id);

      assert.strictEqual(activated?.status, 'active');
    });
  });

  // ==========================================================================
  // Cohort Definition Tests
  // ==========================================================================

  describe('Cohort Definitions', () => {
    it('should add cohort to plan', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(
        plan.id,
        'Pilot Agencies',
        'pilot',
        [agencyA, agencyB],
        ['core', 'analytics']
      );

      assert.ok(cohort);
      assert.strictEqual(cohort.stage, 'pilot');
      assert.strictEqual(cohort.agencies.length, 2);
    });

    it('should not add cohort to approved plan', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');

      const newCohort = planService.addCohort(plan.id, 'Late', 'general', [agencyC], ['core']);
      assert.strictEqual(newCohort, null);
    });

    it('should get cohorts by stage', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      planService.addCohort(plan.id, 'Pilot 1', 'pilot', [agencyA], ['core']);
      planService.addCohort(plan.id, 'Pilot 2', 'pilot', [agencyB], ['core']);
      planService.addCohort(plan.id, 'General', 'general', [agencyC], ['core']);

      const pilots = planService.getCohortsByStage(plan.id, 'pilot');
      assert.strictEqual(pilots.length, 2);
    });

    it('should enforce service scope', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(
        plan.id,
        'Pilot',
        'pilot',
        [agencyA],
        ['core', 'analytics', 'reporting']
      );

      assert.strictEqual(cohort?.serviceScope.length, 3);
    });

    it('should set readiness threshold per cohort', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core'], 5, 98);

      assert.strictEqual(cohort?.readinessThreshold, 98);
      assert.strictEqual(cohort?.maxConcurrentRollouts, 5);
    });
  });

  // ==========================================================================
  // Schedule Management Tests
  // ==========================================================================

  describe('Schedule Management', () => {
    it('should schedule rollout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');

      assert.ok(schedule);
      assert.strictEqual(schedule.status, 'pending');
    });

    it('should reject overlapping schedules', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      const overlap = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-10', '2026-03-25');

      assert.strictEqual(overlap, null);
    });

    it('should allow non-overlapping schedules', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      const second = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-16', '2026-03-30');

      assert.ok(second);
    });

    it('should enforce bounded duration (max 30 days)', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const tooLong = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-05-01');

      assert.strictEqual(tooLong, null);
    });

    it('should start rollout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);

      const started = planService.startRollout(plan.id, schedule!.id);
      assert.strictEqual(started?.status, 'in_progress');
      assert.ok(started?.actualStart);
    });

    it('should complete rollout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);

      const completed = planService.completeRollout(plan.id, schedule!.id);
      assert.strictEqual(completed?.status, 'completed');
      assert.ok(completed?.actualEnd);
    });
  });

  // ==========================================================================
  // Blackout Window Tests
  // ==========================================================================

  describe('Blackout Windows', () => {
    it('should add blackout window', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const window = planService.addBlackoutWindow(
        plan.id,
        '2026-12-20',
        '2027-01-05',
        'Holiday freeze',
        'global'
      );

      assert.ok(window);
      assert.strictEqual(window.scope, 'global');
    });

    it('should reject schedule during blackout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.addBlackoutWindow(
        plan.id,
        '2026-12-20',
        '2027-01-05',
        'Holiday freeze',
        'global'
      );

      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-12-25', '2027-01-03');
      assert.strictEqual(schedule, null);
    });

    it('should allow schedule outside blackout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.addBlackoutWindow(
        plan.id,
        '2026-12-20',
        '2027-01-05',
        'Holiday freeze',
        'global'
      );

      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      assert.ok(schedule);
    });

    it('should support cohort-scoped blackout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort1 = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const cohort2 = planService.addCohort(plan.id, 'General', 'general', [agencyB], ['core']);
      planService.addBlackoutWindow(
        plan.id,
        '2026-03-01',
        '2026-03-15',
        'Pilot freeze',
        'cohort',
        cohort1!.id
      );

      // Should reject for cohort1
      const s1 = planService.scheduleRollout(plan.id, cohort1!.id, '2026-03-05', '2026-03-10');
      assert.strictEqual(s1, null);

      // Should allow for cohort2
      const s2 = planService.scheduleRollout(plan.id, cohort2!.id, '2026-03-05', '2026-03-10');
      assert.ok(s2);
    });
  });

  // ==========================================================================
  // Stop Condition Tests
  // ==========================================================================

  describe('Stop Conditions', () => {
    it('should have default stop conditions', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const conditions = planService.getStopConditions(plan.id);

      assert.ok(conditions.some(c => c.type === 'mttr_regression'));
      assert.ok(conditions.some(c => c.type === 'rollback_failure'));
      assert.ok(conditions.some(c => c.type === 'dr_failure'));
      assert.ok(conditions.some(c => c.type === 'audit_integrity'));
    });

    it('should get stop conditions by stage', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const conditions = planService.getStopConditionsByStage(plan.id, 'pilot');

      // Should include 'all' stage conditions
      assert.ok(conditions.length > 0);
    });

    it('should trigger stop condition and pause rollout', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);

      const pauseEvent = planService.triggerStopCondition(
        plan.id,
        schedule!.id,
        'mttr_regression',
        2.0
      );

      assert.ok(pauseEvent);
      assert.strictEqual(pauseEvent.requiresApprovalToResume, true);

      const paused = planService.getSchedule(plan.id, schedule!.id);
      assert.strictEqual(paused?.status, 'paused');
    });

    it('should not trigger below threshold', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);

      const pauseEvent = planService.triggerStopCondition(
        plan.id,
        schedule!.id,
        'mttr_regression',
        1.2
      );
      assert.strictEqual(pauseEvent, null);
    });

    it('should resume paused rollout with approval', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);
      planService.triggerStopCondition(plan.id, schedule!.id, 'mttr_regression', 2.0);

      const resumed = planService.resumeRollout(plan.id, schedule!.id, 'executive_approver');
      assert.strictEqual(resumed?.status, 'in_progress');
      assert.ok(resumed?.resumedBy);
    });

    it('should record pause events', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);
      planService.triggerStopCondition(plan.id, schedule!.id, 'mttr_regression', 2.0);

      const events = planService.getPauseEvents(schedule!.id);
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].metricValue, 2.0);
    });
  });

  // ==========================================================================
  // Readiness Threshold Tests
  // ==========================================================================

  describe('Readiness Thresholds', () => {
    it('should have default readiness thresholds', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const thresholds = planService.getReadinessThresholds(plan.id);

      assert.ok(thresholds.some(t => t.metric === 'onboarding_completion'));
      assert.ok(thresholds.some(t => t.metric === 'training_completion'));
      assert.ok(thresholds.some(t => t.metric === 'dr_pass_rate'));
    });

    it('should check readiness - passing', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const result = planService.checkReadiness(plan.id, {
        onboarding_completion: 100,
        attestation_freshness: 98,
        drill_compliance: 95,
        training_completion: 100,
        exception_burn_down: 85,
        key_rotation_compliant: 100,
        dr_pass_rate: 100,
      });

      assert.strictEqual(result.ready, true);
      assert.strictEqual(result.gaps.length, 0);
    });

    it('should check readiness - failing', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const result = planService.checkReadiness(plan.id, {
        onboarding_completion: 100,
        attestation_freshness: 80, // Below 95
        drill_compliance: 95,
        training_completion: 100,
        exception_burn_down: 85,
        key_rotation_compliant: 100,
        dr_pass_rate: 100,
      });

      assert.strictEqual(result.ready, false);
      assert.ok(result.gaps.length > 0);
    });

    it('should calculate weighted readiness score', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const result = planService.checkReadiness(plan.id, {
        onboarding_completion: 100,
        attestation_freshness: 98,
        drill_compliance: 95,
        training_completion: 100,
        exception_burn_down: 85,
        key_rotation_compliant: 100,
        dr_pass_rate: 100,
      });

      assert.ok(result.score > 0);
      assert.ok(result.score <= 100);
    });

    it('should add custom readiness threshold', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const threshold = planService.addReadinessThreshold(plan.id, {
        metric: 'custom_metric',
        minimumValue: 80,
        unit: 'percent',
        required: true,
        weight: 0.5,
      });

      assert.ok(threshold);
      const thresholds = planService.getReadinessThresholds(plan.id);
      assert.ok(thresholds.some(t => t.metric === 'custom_metric'));
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Plan Validation', () => {
    it('should validate plan requires pilot cohort', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      planService.addCohort(plan.id, 'General', 'general', [agencyA], ['core']);

      const result = planService.validatePlan(plan.id);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('pilot')));
    });

    it('should validate cohorts have agencies', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      planService.addCohort(plan.id, 'Empty', 'pilot', [], ['core']);

      const result = planService.validatePlan(plan.id);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('no agencies')));
    });

    it('should validate no schedule overlaps', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');

      const result = planService.validatePlan(plan.id);
      assert.strictEqual(result.valid, true);
    });
  });

  // ==========================================================================
  // Progress Tracking Tests
  // ==========================================================================

  describe('Progress Tracking', () => {
    it('should track plan progress', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const s1 = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.scheduleRollout(plan.id, cohort!.id, '2026-03-16', '2026-03-30');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, s1!.id);
      planService.completeRollout(plan.id, s1!.id);

      const progress = planService.getPlanProgress(plan.id);
      assert.strictEqual(progress.completed, 1);
      assert.strictEqual(progress.total, 2);
      assert.strictEqual(progress.percentage, 50);
    });

    it('should get active rollouts', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);

      const active = planService.getActiveRollouts(plan.id);
      assert.strictEqual(active.length, 1);
    });

    it('should get paused rollouts', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const cohort = planService.addCohort(plan.id, 'Pilot', 'pilot', [agencyA], ['core']);
      const schedule = planService.scheduleRollout(plan.id, cohort!.id, '2026-03-01', '2026-03-15');
      planService.approvePlan(plan.id, 'admin');
      planService.activatePlan(plan.id);
      planService.startRollout(plan.id, schedule!.id);
      planService.triggerStopCondition(plan.id, schedule!.id, 'dr_failure', 1);

      const paused = planService.getPausedRollouts(plan.id);
      assert.strictEqual(paused.length, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of readiness thresholds', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const t1 = planService.getReadinessThresholds(plan.id);
      const t2 = planService.getReadinessThresholds(plan.id);
      assert.ok(t1 !== t2);
    });

    it('should return copies of stop conditions', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      const c1 = planService.getStopConditions(plan.id);
      const c2 = planService.getStopConditions(plan.id);
      assert.ok(c1 !== c2);
    });

    it('should return copies of blackout windows', () => {
      const plan = planService.createPlan('Test Plan', '1.0.0');
      planService.addBlackoutWindow(plan.id, '2026-12-20', '2027-01-05', 'Holiday', 'global');
      const b1 = planService.getBlackoutWindows(plan.id);
      const b2 = planService.getBlackoutWindows(plan.id);
      assert.ok(b1 !== b2);
    });
  });
});

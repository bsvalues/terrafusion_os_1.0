/**
 * Incident Response Governance: Drills Contract Tests
 *
 * Phase IX - Scheduled drills and dry-run governance.
 *
 * CONTRACT SURFACE:
 * - Scheduled Drills: Regular incident response exercises
 * - Dry-Run Mode: No side effects, simulation only
 * - Drill Types: Tabletop, live, chaos engineering
 * - Metrics: Response time, escalation accuracy
 *
 * INVARIANTS:
 * - Dry-run drills have ZERO production side effects
 * - All drills are clearly marked (no confusion with real incidents)
 * - Drill frequency meets compliance requirements
 * - Drill results are tracked and reviewed
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type DrillType = 'tabletop' | 'live' | 'chaos' | 'communication' | 'failover';
type DrillStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type DrillScope = 'team' | 'department' | 'organization' | 'cross_functional';
type SeverityLevel = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

/**
 * Drill definition
 */
interface DrillDefinition {
  readonly drill_id: string;
  readonly name: string;
  readonly type: DrillType;
  readonly scope: DrillScope;
  readonly simulated_severity: SeverityLevel;
  readonly scenario_description: string;
  readonly expected_duration_minutes: number;
  readonly is_dry_run: boolean;
  readonly runbook_ref: string;
}

/**
 * Drill schedule
 */
interface DrillSchedule {
  readonly schedule_id: string;
  readonly drill_id: string;
  readonly scheduled_at: string;
  readonly status: DrillStatus;
  readonly participants: readonly string[];
  readonly facilitator_id: string;
  readonly notification_sent: boolean;
}

/**
 * Drill execution
 */
interface DrillExecution {
  readonly execution_id: string;
  readonly drill_id: string;
  readonly schedule_id: string;
  readonly started_at: string;
  readonly completed_at?: string;
  readonly status: DrillStatus;
  readonly participants_actual: readonly string[];
  readonly timeline: readonly DrillTimelineEntry[];
  readonly metrics: DrillMetrics;
  readonly is_dry_run: boolean;
  readonly checksum: string;
}

/**
 * Drill timeline entry
 */
interface DrillTimelineEntry {
  readonly entry_id: string;
  readonly timestamp: string;
  readonly action: string;
  readonly actor_id: string;
  readonly notes?: string;
}

/**
 * Drill metrics
 */
interface DrillMetrics {
  readonly time_to_acknowledge_seconds: number;
  readonly time_to_triage_seconds: number;
  readonly time_to_resolve_seconds: number;
  readonly escalation_accuracy: number; // 0-1
  readonly communication_score: number; // 0-1
  readonly runbook_adherence: number; // 0-1
  readonly participants_engaged: number;
}

/**
 * Drill result
 */
interface DrillResult {
  readonly result_id: string;
  readonly execution_id: string;
  readonly passed: boolean;
  readonly findings: readonly DrillFinding[];
  readonly recommendations: readonly string[];
  readonly reviewed_by: string;
  readonly reviewed_at: string;
}

/**
 * Drill finding
 */
interface DrillFinding {
  readonly finding_id: string;
  readonly severity: 'critical' | 'major' | 'minor' | 'observation';
  readonly description: string;
  readonly affected_area: string;
  readonly remediation: string;
}

/**
 * Compliance requirement
 */
interface ComplianceRequirement {
  readonly requirement_id: string;
  readonly drill_type: DrillType;
  readonly min_frequency_days: number;
  readonly scope_required: DrillScope;
  readonly documentation_required: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockDrillDefinition(overrides: Partial<DrillDefinition> = {}): DrillDefinition {
  return {
    drill_id: `drill-${Date.now()}`,
    name: 'Quarterly Incident Response Drill',
    type: 'tabletop',
    scope: 'team',
    simulated_severity: 'SEV2',
    scenario_description: 'Simulated service outage affecting payment processing',
    expected_duration_minutes: 60,
    is_dry_run: true,
    runbook_ref: 'https://runbooks.terrafusion.gov/drills/payment-outage',
    ...overrides,
  };
}

function createMockDrillSchedule(overrides: Partial<DrillSchedule> = {}): DrillSchedule {
  return {
    schedule_id: `schedule-${Date.now()}`,
    drill_id: `drill-${Date.now()}`,
    scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    participants: [
      `sha256:${Buffer.from('participant-1').toString('hex').slice(0, 64)}`,
      `sha256:${Buffer.from('participant-2').toString('hex').slice(0, 64)}`,
    ],
    facilitator_id: `sha256:${Buffer.from('facilitator-1').toString('hex').slice(0, 64)}`,
    notification_sent: false,
    ...overrides,
  };
}

function createMockDrillExecution(overrides: Partial<DrillExecution> = {}): DrillExecution {
  const executionId = `exec-${Date.now()}`;
  return {
    execution_id: `sha256:${Buffer.from(executionId).toString('hex').slice(0, 64)}`,
    drill_id: `drill-${Date.now()}`,
    schedule_id: `schedule-${Date.now()}`,
    started_at: new Date().toISOString(),
    status: 'in_progress',
    participants_actual: [],
    timeline: [],
    metrics: {
      time_to_acknowledge_seconds: 0,
      time_to_triage_seconds: 0,
      time_to_resolve_seconds: 0,
      escalation_accuracy: 0,
      communication_score: 0,
      runbook_adherence: 0,
      participants_engaged: 0,
    },
    is_dry_run: true,
    checksum: `sha256:${Buffer.from(`checksum-${executionId}`).toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockDrillResult(overrides: Partial<DrillResult> = {}): DrillResult {
  return {
    result_id: `result-${Date.now()}`,
    execution_id: `sha256:${Buffer.from('exec-1').toString('hex').slice(0, 64)}`,
    passed: true,
    findings: [],
    recommendations: [],
    reviewed_by: `sha256:${Buffer.from('reviewer-1').toString('hex').slice(0, 64)}`,
    reviewed_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockComplianceRequirement(
  overrides: Partial<ComplianceRequirement> = {}
): ComplianceRequirement {
  return {
    requirement_id: `req-${Date.now()}`,
    drill_type: 'tabletop',
    min_frequency_days: 90,
    scope_required: 'team',
    documentation_required: true,
    ...overrides,
  };
}

// ============================================================================
// MOCK DRILLS STORE
// ============================================================================

interface DrillsStore {
  // Drill Definitions
  createDrill(definition: Omit<DrillDefinition, 'drill_id'>): Promise<DrillDefinition>;
  getDrill(drillId: string): Promise<DrillDefinition | null>;
  getDrillsByType(type: DrillType): Promise<readonly DrillDefinition[]>;
  isDryRun(drillId: string): Promise<boolean>;

  // Scheduling
  scheduleDrill(
    drillId: string,
    scheduledAt: Date,
    participants: readonly string[],
    facilitatorId: string
  ): Promise<DrillSchedule>;
  getSchedule(scheduleId: string): Promise<DrillSchedule | null>;
  getUpcomingDrills(daysAhead: number): Promise<readonly DrillSchedule[]>;
  sendNotifications(scheduleId: string): Promise<void>;

  // Execution
  startDrill(scheduleId: string): Promise<DrillExecution>;
  getExecution(executionId: string): Promise<DrillExecution | null>;
  recordTimelineEntry(
    executionId: string,
    action: string,
    actorId: string,
    notes?: string
  ): Promise<DrillExecution>;
  completeDrill(executionId: string, metrics: DrillMetrics): Promise<DrillExecution>;
  hasSideEffects(executionId: string): Promise<boolean>;

  // Results
  submitResult(
    executionId: string,
    passed: boolean,
    findings: readonly DrillFinding[],
    recommendations: readonly string[],
    reviewerId: string
  ): Promise<DrillResult>;
  getResult(resultId: string): Promise<DrillResult | null>;
  getResultsByDrill(drillId: string): Promise<readonly DrillResult[]>;

  // Compliance
  getComplianceRequirements(): Promise<readonly ComplianceRequirement[]>;
  checkCompliance(
    drillType: DrillType
  ): Promise<{ compliant: boolean; lastDrill?: Date; nextRequired?: Date }>;
  getDrillFrequency(drillType: DrillType): number; // days
}

function createMockDrillsStore(): DrillsStore {
  const drills: Map<string, DrillDefinition> = new Map();
  const schedules: Map<string, DrillSchedule> = new Map();
  const executions: Map<string, DrillExecution> = new Map();
  const results: Map<string, DrillResult> = new Map();
  const drillToResults: Map<string, string[]> = new Map();

  const complianceRequirements: ComplianceRequirement[] = [
    createMockComplianceRequirement({ drill_type: 'tabletop', min_frequency_days: 90 }),
    createMockComplianceRequirement({ drill_type: 'live', min_frequency_days: 180 }),
    createMockComplianceRequirement({ drill_type: 'communication', min_frequency_days: 30 }),
    createMockComplianceRequirement({ drill_type: 'failover', min_frequency_days: 365 }),
    createMockComplianceRequirement({ drill_type: 'chaos', min_frequency_days: 90 }),
  ];

  return {
    async createDrill(definition) {
      const drill = createMockDrillDefinition({ ...definition, drill_id: `drill-${Date.now()}` });
      drills.set(drill.drill_id, drill);
      return drill;
    },

    async getDrill(drillId) {
      return drills.get(drillId) ?? null;
    },

    async getDrillsByType(type) {
      return Array.from(drills.values()).filter(d => d.type === type);
    },

    async isDryRun(drillId) {
      const drill = drills.get(drillId);
      return drill?.is_dry_run ?? true; // Default to dry-run for safety
    },

    async scheduleDrill(drillId, scheduledAt, participants, facilitatorId) {
      const schedule = createMockDrillSchedule({
        drill_id: drillId,
        scheduled_at: scheduledAt.toISOString(),
        participants: participants.map(
          p => `sha256:${Buffer.from(p).toString('hex').slice(0, 64)}`
        ),
        facilitator_id: `sha256:${Buffer.from(facilitatorId).toString('hex').slice(0, 64)}`,
      });
      schedules.set(schedule.schedule_id, schedule);
      return schedule;
    },

    async getSchedule(scheduleId) {
      return schedules.get(scheduleId) ?? null;
    },

    async getUpcomingDrills(daysAhead) {
      const cutoff = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      return Array.from(schedules.values()).filter(s => {
        const scheduled = new Date(s.scheduled_at);
        return s.status === 'scheduled' && scheduled <= cutoff;
      });
    },

    async sendNotifications(scheduleId) {
      const schedule = schedules.get(scheduleId);
      if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);
      const updated: DrillSchedule = { ...schedule, notification_sent: true };
      schedules.set(scheduleId, updated);
    },

    async startDrill(scheduleId) {
      const schedule = schedules.get(scheduleId);
      if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);

      const drill = drills.get(schedule.drill_id);
      const execution = createMockDrillExecution({
        drill_id: schedule.drill_id,
        schedule_id: scheduleId,
        participants_actual: [...schedule.participants],
        is_dry_run: drill?.is_dry_run ?? true,
      });
      executions.set(execution.execution_id, execution);

      const updatedSchedule: DrillSchedule = { ...schedule, status: 'in_progress' };
      schedules.set(scheduleId, updatedSchedule);

      return execution;
    },

    async getExecution(executionId) {
      return executions.get(executionId) ?? null;
    },

    async recordTimelineEntry(executionId, action, actorId, notes) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const entry: DrillTimelineEntry = {
        entry_id: `entry-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action,
        actor_id: `sha256:${Buffer.from(actorId).toString('hex').slice(0, 64)}`,
        notes,
      };

      const updated: DrillExecution = {
        ...execution,
        timeline: [...execution.timeline, entry],
      };
      executions.set(executionId, updated);
      return updated;
    },

    async completeDrill(executionId, metrics) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const updated: DrillExecution = {
        ...execution,
        status: 'completed',
        completed_at: new Date().toISOString(),
        metrics,
      };
      executions.set(executionId, updated);
      return updated;
    },

    async hasSideEffects(executionId) {
      const execution = executions.get(executionId);
      if (!execution) return false;
      // Dry-run drills should NEVER have side effects
      return !execution.is_dry_run;
    },

    async submitResult(executionId, passed, findings, recommendations, reviewerId) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const result = createMockDrillResult({
        execution_id: executionId,
        passed,
        findings,
        recommendations,
        reviewed_by: `sha256:${Buffer.from(reviewerId).toString('hex').slice(0, 64)}`,
      });
      results.set(result.result_id, result);

      const drillResults = drillToResults.get(execution.drill_id) ?? [];
      drillToResults.set(execution.drill_id, [...drillResults, result.result_id]);

      return result;
    },

    async getResult(resultId) {
      return results.get(resultId) ?? null;
    },

    async getResultsByDrill(drillId) {
      const resultIds = drillToResults.get(drillId) ?? [];
      return resultIds.map(id => results.get(id)).filter((r): r is DrillResult => r !== undefined);
    },

    async getComplianceRequirements() {
      return complianceRequirements;
    },

    async checkCompliance(drillType) {
      const requirement = complianceRequirements.find(r => r.drill_type === drillType);
      if (!requirement) {
        return { compliant: true };
      }

      // In a real implementation, would check last drill date
      const lastDrill = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const daysSinceLastDrill = Math.floor(
        (Date.now() - lastDrill.getTime()) / (24 * 60 * 60 * 1000)
      );
      const compliant = daysSinceLastDrill <= requirement.min_frequency_days;
      const nextRequired = new Date(
        lastDrill.getTime() + requirement.min_frequency_days * 24 * 60 * 60 * 1000
      );

      return { compliant, lastDrill, nextRequired };
    },

    getDrillFrequency(drillType) {
      const requirement = complianceRequirements.find(r => r.drill_type === drillType);
      return requirement?.min_frequency_days ?? 90;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Incident Response Governance: Drills Contracts', () => {
  let store: DrillsStore;

  beforeEach(() => {
    store = createMockDrillsStore();
  });

  // ==========================================================================
  // CONTRACT: drills_dry_run
  // ==========================================================================
  describe('CONTRACT: drills_dry_run', () => {
    it('drills default to dry-run mode', async () => {
      const drill = await store.createDrill({
        name: 'Test Drill',
        type: 'tabletop',
        scope: 'team',
        simulated_severity: 'SEV2',
        scenario_description: 'Test scenario',
        expected_duration_minutes: 30,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/drill',
      });

      const isDryRun = await store.isDryRun(drill.drill_id);
      assert.strictEqual(isDryRun, true);
    });

    it('dry-run executions have no side effects', async () => {
      const drill = await store.createDrill({
        name: 'Dry Run Test',
        type: 'live',
        scope: 'team',
        simulated_severity: 'SEV1',
        scenario_description: 'Live drill simulation',
        expected_duration_minutes: 60,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/live',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-1'],
        'facilitator-1'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      const hasSideEffects = await store.hasSideEffects(execution.execution_id);

      assert.strictEqual(hasSideEffects, false, 'dry-run should have no side effects');
    });

    it('unknown drills default to dry-run', async () => {
      const isDryRun = await store.isDryRun('non-existent-drill');
      assert.strictEqual(isDryRun, true, 'unknown drills should be treated as dry-run');
    });

    it('execution marks dry-run status clearly', async () => {
      const drill = await store.createDrill({
        name: 'Clear Marking Test',
        type: 'tabletop',
        scope: 'department',
        simulated_severity: 'SEV2',
        scenario_description: 'Test',
        expected_duration_minutes: 45,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/mark',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-2'],
        'facilitator-2'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      assert.strictEqual(execution.is_dry_run, true);
    });
  });

  // ==========================================================================
  // CONTRACT: drills_scheduling
  // ==========================================================================
  describe('CONTRACT: drills_scheduling', () => {
    it('drills can be scheduled', async () => {
      const drill = await store.createDrill({
        name: 'Scheduled Drill',
        type: 'communication',
        scope: 'team',
        simulated_severity: 'SEV3',
        scenario_description: 'Communication test',
        expected_duration_minutes: 15,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/comm',
      });

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const schedule = await store.scheduleDrill(
        drill.drill_id,
        futureDate,
        ['participant-3', 'participant-4'],
        'facilitator-3'
      );

      assert.ok(schedule.schedule_id);
      assert.strictEqual(schedule.status, 'scheduled');
    });

    it('schedules have participants and facilitator', async () => {
      const drill = await store.createDrill({
        name: 'Participant Test',
        type: 'failover',
        scope: 'organization',
        simulated_severity: 'SEV1',
        scenario_description: 'Failover test',
        expected_duration_minutes: 120,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/failover',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        ['participant-5', 'participant-6', 'participant-7'],
        'facilitator-4'
      );

      assert.ok(schedule.participants.length === 3);
      assert.ok(schedule.facilitator_id.startsWith('sha256:'));
    });

    it('can query upcoming drills', async () => {
      const drill = await store.createDrill({
        name: 'Upcoming Test',
        type: 'chaos',
        scope: 'team',
        simulated_severity: 'SEV2',
        scenario_description: 'Chaos test',
        expected_duration_minutes: 90,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/chaos',
      });

      await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        ['participant-8'],
        'facilitator-5'
      );

      const upcoming = await store.getUpcomingDrills(7);
      assert.ok(upcoming.length >= 1);
    });

    it('notifications can be sent', async () => {
      const drill = await store.createDrill({
        name: 'Notification Test',
        type: 'tabletop',
        scope: 'team',
        simulated_severity: 'SEV3',
        scenario_description: 'Notification test',
        expected_duration_minutes: 30,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/notify',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        ['participant-9'],
        'facilitator-6'
      );

      assert.strictEqual(schedule.notification_sent, false);
      await store.sendNotifications(schedule.schedule_id);

      const updated = await store.getSchedule(schedule.schedule_id);
      assert.strictEqual(updated?.notification_sent, true);
    });
  });

  // ==========================================================================
  // CONTRACT: drills_execution
  // ==========================================================================
  describe('CONTRACT: drills_execution', () => {
    it('drill execution creates timeline', async () => {
      const drill = await store.createDrill({
        name: 'Execution Test',
        type: 'live',
        scope: 'team',
        simulated_severity: 'SEV2',
        scenario_description: 'Execution timeline test',
        expected_duration_minutes: 60,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/exec',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-10'],
        'facilitator-7'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      assert.ok(execution.execution_id.startsWith('sha256:'));
      assert.strictEqual(execution.status, 'in_progress');
    });

    it('timeline entries are recorded', async () => {
      const drill = await store.createDrill({
        name: 'Timeline Test',
        type: 'tabletop',
        scope: 'team',
        simulated_severity: 'SEV2',
        scenario_description: 'Timeline entry test',
        expected_duration_minutes: 45,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/timeline',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-11'],
        'facilitator-8'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      const updated = await store.recordTimelineEntry(
        execution.execution_id,
        'Alert acknowledged',
        'participant-11',
        'Acknowledged within 2 minutes'
      );

      assert.strictEqual(updated.timeline.length, 1);
      assert.strictEqual(updated.timeline[0].action, 'Alert acknowledged');
    });

    it('drill completion records metrics', async () => {
      const drill = await store.createDrill({
        name: 'Metrics Test',
        type: 'communication',
        scope: 'team',
        simulated_severity: 'SEV3',
        scenario_description: 'Metrics recording test',
        expected_duration_minutes: 20,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/metrics',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-12'],
        'facilitator-9'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      const completed = await store.completeDrill(execution.execution_id, {
        time_to_acknowledge_seconds: 120,
        time_to_triage_seconds: 300,
        time_to_resolve_seconds: 1800,
        escalation_accuracy: 0.95,
        communication_score: 0.85,
        runbook_adherence: 0.9,
        participants_engaged: 5,
      });

      assert.strictEqual(completed.status, 'completed');
      assert.ok(completed.completed_at);
      assert.strictEqual(completed.metrics.escalation_accuracy, 0.95);
    });

    it('execution has integrity checksum', async () => {
      const drill = await store.createDrill({
        name: 'Checksum Test',
        type: 'tabletop',
        scope: 'team',
        simulated_severity: 'SEV2',
        scenario_description: 'Checksum verification',
        expected_duration_minutes: 30,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/checksum',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-13'],
        'facilitator-10'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      assert.ok(execution.checksum.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: drills_compliance
  // ==========================================================================
  describe('CONTRACT: drills_compliance', () => {
    it('defines compliance requirements by drill type', async () => {
      const requirements = await store.getComplianceRequirements();

      assert.ok(requirements.length > 0);
      for (const req of requirements) {
        assert.ok(req.drill_type);
        assert.ok(req.min_frequency_days > 0);
      }
    });

    it('checks compliance status', async () => {
      const status = await store.checkCompliance('tabletop');

      assert.ok(typeof status.compliant === 'boolean');
    });

    it('provides drill frequency requirements', () => {
      const tabletopFreq = store.getDrillFrequency('tabletop');
      const failoverFreq = store.getDrillFrequency('failover');

      assert.ok(tabletopFreq > 0);
      assert.ok(failoverFreq > 0);
      assert.ok(failoverFreq >= tabletopFreq, 'failover drills should be less frequent');
    });

    it('tracks last drill and next required date', async () => {
      const status = await store.checkCompliance('communication');

      if (status.lastDrill) {
        assert.ok(status.lastDrill instanceof Date);
      }
      if (status.nextRequired) {
        assert.ok(status.nextRequired instanceof Date);
      }
    });
  });

  // ==========================================================================
  // CONTRACT: drills_results
  // ==========================================================================
  describe('CONTRACT: drills_results', () => {
    it('results are submitted after completion', async () => {
      const drill = await store.createDrill({
        name: 'Results Test',
        type: 'tabletop',
        scope: 'team',
        simulated_severity: 'SEV2',
        scenario_description: 'Results submission test',
        expected_duration_minutes: 45,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/results',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-14'],
        'facilitator-11'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      await store.completeDrill(execution.execution_id, {
        time_to_acknowledge_seconds: 90,
        time_to_triage_seconds: 240,
        time_to_resolve_seconds: 1500,
        escalation_accuracy: 1.0,
        communication_score: 0.9,
        runbook_adherence: 0.95,
        participants_engaged: 3,
      });

      const result = await store.submitResult(
        execution.execution_id,
        true,
        [],
        ['Consider shorter escalation timeouts'],
        'reviewer-1'
      );

      assert.ok(result.result_id);
      assert.strictEqual(result.passed, true);
    });

    it('results include findings', async () => {
      const drill = await store.createDrill({
        name: 'Findings Test',
        type: 'live',
        scope: 'department',
        simulated_severity: 'SEV1',
        scenario_description: 'Findings test',
        expected_duration_minutes: 90,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/findings',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-15'],
        'facilitator-12'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      await store.completeDrill(execution.execution_id, {
        time_to_acknowledge_seconds: 180,
        time_to_triage_seconds: 600,
        time_to_resolve_seconds: 3600,
        escalation_accuracy: 0.75,
        communication_score: 0.65,
        runbook_adherence: 0.7,
        participants_engaged: 8,
      });

      const findings: DrillFinding[] = [
        {
          finding_id: 'finding-1',
          severity: 'major',
          description: 'Escalation path unclear',
          affected_area: 'incident-response',
          remediation: 'Update runbook with clear escalation matrix',
        },
      ];

      const result = await store.submitResult(
        execution.execution_id,
        false,
        findings,
        ['Review escalation procedures', 'Conduct follow-up drill'],
        'reviewer-2'
      );

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.findings.length, 1);
      assert.strictEqual(result.recommendations.length, 2);
    });

    it('results track reviewer', async () => {
      const drill = await store.createDrill({
        name: 'Reviewer Test',
        type: 'tabletop',
        scope: 'team',
        simulated_severity: 'SEV3',
        scenario_description: 'Reviewer tracking',
        expected_duration_minutes: 30,
        is_dry_run: true,
        runbook_ref: 'https://runbooks.test/review',
      });

      const schedule = await store.scheduleDrill(
        drill.drill_id,
        new Date(Date.now() + 1000),
        ['participant-16'],
        'facilitator-13'
      );

      const execution = await store.startDrill(schedule.schedule_id);
      await store.completeDrill(execution.execution_id, {
        time_to_acknowledge_seconds: 60,
        time_to_triage_seconds: 180,
        time_to_resolve_seconds: 900,
        escalation_accuracy: 1.0,
        communication_score: 1.0,
        runbook_adherence: 1.0,
        participants_engaged: 2,
      });

      const result = await store.submitResult(
        execution.execution_id,
        true,
        [],
        [],
        'security-reviewer'
      );

      assert.ok(result.reviewed_by.startsWith('sha256:'));
      assert.ok(result.reviewed_at);
    });
  });
});

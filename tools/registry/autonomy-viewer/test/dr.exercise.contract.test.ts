/**
 * Phase XVII — Federation Resilience & DR: Exercise Contract Tests
 * =================================================================
 *
 * TDD-first tests for DR exercises and drills:
 *   - Scheduled DR drills
 *   - Evidence pack generation from exercises
 *   - Postmortem governance
 *   - Success metrics tracking
 *
 * CONTRACT SURFACE:
 * - Drill Scheduling: Planned and ad-hoc DR exercises
 * - Evidence Generation: Automatic evidence pack creation
 * - Postmortem: Required review and action items
 * - Metrics: Success rates, recovery times, improvement tracking
 *
 * INVARIANTS:
 * - All IDs are opaque sha256:
 * - Exercises generate audit-grade evidence
 * - Postmortems are required for all exercises
 * - Drill results are immutable after completion
 *
 * @module dr.exercise.contract.test
 * @version 17.1
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ExerciseType = 'tabletop' | 'walkthrough' | 'simulation' | 'live-failover';
type ExerciseStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
type ScenarioCategory =
  | 'region-loss'
  | 'key-compromise'
  | 'data-corruption'
  | 'cert-expiry'
  | 'ransomware'
  | 'insider-threat';

/**
 * DR Exercise definition
 */
interface DRExercise {
  readonly exercise_id: string; // sha256:
  readonly exercise_type: ExerciseType;
  readonly scenario: ScenarioCategory;
  readonly title: string;
  readonly description: string;
  readonly scheduled_at: string;
  readonly started_at?: string;
  readonly completed_at?: string;
  readonly status: ExerciseStatus;
  readonly participants: readonly string[]; // sha256: participant IDs
  readonly coordinator: string; // sha256: coordinator ID
  readonly target_rto_minutes: number;
  readonly target_rpo_minutes: number;
}

/**
 * Exercise execution result
 */
interface ExerciseResult {
  readonly result_id: string; // sha256:
  readonly exercise_id: string; // sha256:
  readonly actual_rto_minutes: number;
  readonly actual_rpo_minutes: number;
  readonly rto_met: boolean;
  readonly rpo_met: boolean;
  readonly success: boolean;
  readonly failure_points: readonly string[];
  readonly observations: readonly string[];
  readonly evidence_pack_id: string; // sha256:
  readonly recorded_at: string;
}

/**
 * Evidence pack from exercise
 */
interface ExerciseEvidencePack {
  readonly pack_id: string; // sha256:
  readonly exercise_id: string; // sha256:
  readonly artifacts: readonly EvidenceArtifact[];
  readonly chain_head_at_creation: string; // sha256:
  readonly created_at: string;
  readonly checksum: string; // sha256:
  readonly sealed: boolean;
}

/**
 * Individual evidence artifact
 */
interface EvidenceArtifact {
  readonly artifact_id: string; // sha256:
  readonly artifact_type:
    | 'log'
    | 'screenshot'
    | 'config-snapshot'
    | 'metric-export'
    | 'runbook-trace';
  readonly description: string;
  readonly content_hash: string; // sha256:
  readonly timestamp: string;
}

/**
 * Postmortem record
 */
interface Postmortem {
  readonly postmortem_id: string; // sha256:
  readonly exercise_id: string; // sha256:
  readonly summary: string;
  readonly root_causes: readonly string[];
  readonly action_items: readonly ActionItem[];
  readonly lessons_learned: readonly string[];
  readonly participants: readonly string[]; // sha256:
  readonly approved_by: string; // sha256:
  readonly approved_at?: string;
  readonly status: 'draft' | 'review' | 'approved' | 'published';
}

/**
 * Action item from postmortem
 */
interface ActionItem {
  readonly item_id: string; // sha256:
  readonly description: string;
  readonly owner: string; // sha256:
  readonly due_date: string;
  readonly priority: SeverityLevel;
  readonly status: 'open' | 'in-progress' | 'completed' | 'deferred';
  readonly completion_evidence?: string; // sha256: link to evidence
}

/**
 * Exercise metrics
 */
interface ExerciseMetrics {
  readonly period_start: string;
  readonly period_end: string;
  readonly exercises_completed: number;
  readonly exercises_passed: number;
  readonly pass_rate: number;
  readonly avg_rto_minutes: number;
  readonly avg_rpo_minutes: number;
  readonly rto_trend: 'improving' | 'stable' | 'declining';
  readonly rpo_trend: 'improving' | 'stable' | 'declining';
  readonly action_items_open: number;
  readonly action_items_overdue: number;
}

/**
 * Drill schedule
 */
interface DrillSchedule {
  readonly schedule_id: string; // sha256:
  readonly scenario: ScenarioCategory;
  readonly frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  readonly next_scheduled: string;
  readonly last_executed?: string;
  readonly auto_create: boolean;
  readonly notify_days_before: number;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockExercise(overrides: Partial<DRExercise> = {}): DRExercise {
  const exerciseId = `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    exercise_id: `sha256:${Buffer.from(exerciseId).toString('hex').slice(0, 64)}`,
    exercise_type: 'simulation',
    scenario: 'region-loss',
    title: 'US-East Region Loss Drill',
    description: 'Simulate complete loss of us-east-1 region',
    scheduled_at: new Date().toISOString(),
    status: 'scheduled',
    participants: [
      `sha256:${Buffer.from('participant-1').toString('hex').slice(0, 64)}`,
      `sha256:${Buffer.from('participant-2').toString('hex').slice(0, 64)}`,
    ],
    coordinator: `sha256:${Buffer.from('coordinator-1').toString('hex').slice(0, 64)}`,
    target_rto_minutes: 60,
    target_rpo_minutes: 15,
    ...overrides,
  };
}

function createMockExerciseResult(overrides: Partial<ExerciseResult> = {}): ExerciseResult {
  const resultId = `result-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    result_id: `sha256:${Buffer.from(resultId).toString('hex').slice(0, 64)}`,
    exercise_id: `sha256:${Buffer.from('exercise-1').toString('hex').slice(0, 64)}`,
    actual_rto_minutes: 45,
    actual_rpo_minutes: 10,
    rto_met: true,
    rpo_met: true,
    success: true,
    failure_points: [],
    observations: ['Failover completed smoothly', 'DNS propagation took longer than expected'],
    evidence_pack_id: `sha256:${Buffer.from('evidence-pack-1').toString('hex').slice(0, 64)}`,
    recorded_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockEvidencePack(
  overrides: Partial<ExerciseEvidencePack> = {}
): ExerciseEvidencePack {
  const packId = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    pack_id: `sha256:${Buffer.from(packId).toString('hex').slice(0, 64)}`,
    exercise_id: `sha256:${Buffer.from('exercise-1').toString('hex').slice(0, 64)}`,
    artifacts: [
      {
        artifact_id: `sha256:${Buffer.from('artifact-1').toString('hex').slice(0, 64)}`,
        artifact_type: 'log',
        description: 'Failover execution log',
        content_hash: `sha256:${Buffer.from('log-content').toString('hex').slice(0, 64)}`,
        timestamp: new Date().toISOString(),
      },
    ],
    chain_head_at_creation: `sha256:${Buffer.from('chain-head-1').toString('hex').slice(0, 64)}`,
    created_at: new Date().toISOString(),
    checksum: `sha256:${Buffer.from('pack-checksum').toString('hex').slice(0, 64)}`,
    sealed: true,
    ...overrides,
  };
}

function createMockPostmortem(overrides: Partial<Postmortem> = {}): Postmortem {
  const postmortemId = `postmortem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    postmortem_id: `sha256:${Buffer.from(postmortemId).toString('hex').slice(0, 64)}`,
    exercise_id: `sha256:${Buffer.from('exercise-1').toString('hex').slice(0, 64)}`,
    summary: 'Exercise completed successfully with minor observations',
    root_causes: [],
    action_items: [],
    lessons_learned: ['Need to improve DNS failover speed'],
    participants: [`sha256:${Buffer.from('participant-1').toString('hex').slice(0, 64)}`],
    approved_by: `sha256:${Buffer.from('approver-1').toString('hex').slice(0, 64)}`,
    status: 'draft',
    ...overrides,
  };
}

function createMockActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  const itemId = `action-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    item_id: `sha256:${Buffer.from(itemId).toString('hex').slice(0, 64)}`,
    description: 'Optimize DNS failover configuration',
    owner: `sha256:${Buffer.from('owner-1').toString('hex').slice(0, 64)}`,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    status: 'open',
    ...overrides,
  };
}

function createMockSchedule(overrides: Partial<DrillSchedule> = {}): DrillSchedule {
  const scheduleId = `schedule-${Date.now()}`;
  return {
    schedule_id: `sha256:${Buffer.from(scheduleId).toString('hex').slice(0, 64)}`,
    scenario: 'region-loss',
    frequency: 'quarterly',
    next_scheduled: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    auto_create: true,
    notify_days_before: 7,
    ...overrides,
  };
}

// ============================================================================
// MOCK EXERCISE SERVICE
// ============================================================================

interface ExerciseService {
  // Exercise Management
  createExercise(exercise: Omit<DRExercise, 'exercise_id' | 'status'>): Promise<DRExercise>;
  getExercise(exerciseId: string): Promise<DRExercise | null>;
  listExercises(status?: ExerciseStatus): Promise<readonly DRExercise[]>;
  startExercise(exerciseId: string): Promise<DRExercise>;
  completeExercise(
    exerciseId: string,
    result: Omit<ExerciseResult, 'result_id' | 'exercise_id' | 'recorded_at'>
  ): Promise<ExerciseResult>;
  cancelExercise(exerciseId: string, reason: string): Promise<DRExercise>;

  // Evidence
  generateEvidencePack(exerciseId: string): Promise<ExerciseEvidencePack>;
  sealEvidencePack(packId: string): Promise<ExerciseEvidencePack>;
  getEvidencePack(packId: string): Promise<ExerciseEvidencePack | null>;
  addEvidenceArtifact(
    packId: string,
    artifact: Omit<EvidenceArtifact, 'artifact_id'>
  ): Promise<EvidenceArtifact>;

  // Postmortem
  createPostmortem(exerciseId: string): Promise<Postmortem>;
  updatePostmortem(postmortemId: string, updates: Partial<Postmortem>): Promise<Postmortem>;
  approvePostmortem(postmortemId: string, approverId: string): Promise<Postmortem>;
  addActionItem(
    postmortemId: string,
    item: Omit<ActionItem, 'item_id' | 'status'>
  ): Promise<ActionItem>;
  completeActionItem(itemId: string, evidence?: string): Promise<ActionItem>;

  // Metrics
  getMetrics(periodDays: number): Promise<ExerciseMetrics>;
  getRtoTrend(exerciseCount: number): Promise<readonly number[]>;
  getRpoTrend(exerciseCount: number): Promise<readonly number[]>;

  // Scheduling
  createSchedule(schedule: Omit<DrillSchedule, 'schedule_id'>): Promise<DrillSchedule>;
  getSchedules(): Promise<readonly DrillSchedule[]>;
  getUpcomingExercises(days: number): Promise<readonly DRExercise[]>;
}

function createMockExerciseService(): ExerciseService {
  const exercises: Map<string, DRExercise> = new Map();
  const results: Map<string, ExerciseResult> = new Map();
  const evidencePacks: Map<string, ExerciseEvidencePack> = new Map();
  const postmortems: Map<string, Postmortem> = new Map();
  const actionItems: Map<string, ActionItem> = new Map();
  const schedules: Map<string, DrillSchedule> = new Map();

  return {
    async createExercise(exercise) {
      const created = createMockExercise({
        ...exercise,
        status: 'scheduled',
      });
      exercises.set(created.exercise_id, created);
      return created;
    },

    async getExercise(exerciseId) {
      return exercises.get(exerciseId) ?? null;
    },

    async listExercises(status) {
      const result: DRExercise[] = [];
      for (const exercise of exercises.values()) {
        if (!status || exercise.status === status) {
          result.push(exercise);
        }
      }
      return result;
    },

    async startExercise(exerciseId) {
      const exercise = exercises.get(exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      const updated: DRExercise = {
        ...exercise,
        status: 'in-progress',
        started_at: new Date().toISOString(),
      };
      exercises.set(exerciseId, updated);
      return updated;
    },

    async completeExercise(exerciseId, result) {
      const exercise = exercises.get(exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      const updated: DRExercise = {
        ...exercise,
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
      };
      exercises.set(exerciseId, updated);

      const exerciseResult = createMockExerciseResult({
        exercise_id: exerciseId,
        ...result,
      });
      results.set(exerciseResult.result_id, exerciseResult);

      return exerciseResult;
    },

    async cancelExercise(exerciseId, _reason) {
      const exercise = exercises.get(exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      const updated: DRExercise = {
        ...exercise,
        status: 'cancelled',
      };
      exercises.set(exerciseId, updated);
      return updated;
    },

    async generateEvidencePack(exerciseId) {
      const pack = createMockEvidencePack({
        exercise_id: exerciseId,
        sealed: false,
        artifacts: [],
      });
      evidencePacks.set(pack.pack_id, pack);
      return pack;
    },

    async sealEvidencePack(packId) {
      const pack = evidencePacks.get(packId);
      if (!pack) {
        throw new Error('Evidence pack not found');
      }

      const sealed: ExerciseEvidencePack = {
        ...pack,
        sealed: true,
        checksum: `sha256:${Buffer.from(JSON.stringify(pack.artifacts)).toString('hex').slice(0, 64)}`,
      };
      evidencePacks.set(packId, sealed);
      return sealed;
    },

    async getEvidencePack(packId) {
      return evidencePacks.get(packId) ?? null;
    },

    async addEvidenceArtifact(packId, artifact) {
      const pack = evidencePacks.get(packId);
      if (!pack) {
        throw new Error('Evidence pack not found');
      }
      if (pack.sealed) {
        throw new Error('Cannot add artifact to sealed pack');
      }

      const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const newArtifact: EvidenceArtifact = {
        artifact_id: `sha256:${Buffer.from(artifactId).toString('hex').slice(0, 64)}`,
        ...artifact,
      };

      const updated: ExerciseEvidencePack = {
        ...pack,
        artifacts: [...pack.artifacts, newArtifact],
      };
      evidencePacks.set(packId, updated);

      return newArtifact;
    },

    async createPostmortem(exerciseId) {
      const postmortem = createMockPostmortem({
        exercise_id: exerciseId,
        status: 'draft',
        action_items: [],
      });
      postmortems.set(postmortem.postmortem_id, postmortem);
      return postmortem;
    },

    async updatePostmortem(postmortemId, updates) {
      const postmortem = postmortems.get(postmortemId);
      if (!postmortem) {
        throw new Error('Postmortem not found');
      }

      const updated: Postmortem = {
        ...postmortem,
        ...updates,
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    async approvePostmortem(postmortemId, approverId) {
      const postmortem = postmortems.get(postmortemId);
      if (!postmortem) {
        throw new Error('Postmortem not found');
      }

      const updated: Postmortem = {
        ...postmortem,
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    async addActionItem(postmortemId, item) {
      const postmortem = postmortems.get(postmortemId);
      if (!postmortem) {
        throw new Error('Postmortem not found');
      }

      const actionItem = createMockActionItem({
        ...item,
        status: 'open',
      });
      actionItems.set(actionItem.item_id, actionItem);

      const updated: Postmortem = {
        ...postmortem,
        action_items: [...postmortem.action_items, actionItem],
      };
      postmortems.set(postmortemId, updated);

      return actionItem;
    },

    async completeActionItem(itemId, evidence) {
      const item = actionItems.get(itemId);
      if (!item) {
        throw new Error('Action item not found');
      }

      const updated: ActionItem = {
        ...item,
        status: 'completed',
        completion_evidence: evidence,
      };
      actionItems.set(itemId, updated);
      return updated;
    },

    async getMetrics(periodDays) {
      const now = Date.now();
      const periodStart = new Date(now - periodDays * 24 * 60 * 60 * 1000);

      let completed = 0;
      let passed = 0;
      let totalRto = 0;
      let totalRpo = 0;

      for (const result of results.values()) {
        const recordedAt = new Date(result.recorded_at);
        if (recordedAt >= periodStart) {
          completed++;
          if (result.success) passed++;
          totalRto += result.actual_rto_minutes;
          totalRpo += result.actual_rpo_minutes;
        }
      }

      let openItems = 0;
      let overdueItems = 0;
      for (const item of actionItems.values()) {
        if (item.status === 'open' || item.status === 'in-progress') {
          openItems++;
          if (new Date(item.due_date) < new Date()) {
            overdueItems++;
          }
        }
      }

      return {
        period_start: periodStart.toISOString(),
        period_end: new Date().toISOString(),
        exercises_completed: completed,
        exercises_passed: passed,
        pass_rate: completed > 0 ? passed / completed : 0,
        avg_rto_minutes: completed > 0 ? totalRto / completed : 0,
        avg_rpo_minutes: completed > 0 ? totalRpo / completed : 0,
        rto_trend: 'stable',
        rpo_trend: 'stable',
        action_items_open: openItems,
        action_items_overdue: overdueItems,
      };
    },

    async getRtoTrend(exerciseCount) {
      const sortedResults = Array.from(results.values())
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .slice(-exerciseCount);

      return sortedResults.map(r => r.actual_rto_minutes);
    },

    async getRpoTrend(exerciseCount) {
      const sortedResults = Array.from(results.values())
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .slice(-exerciseCount);

      return sortedResults.map(r => r.actual_rpo_minutes);
    },

    async createSchedule(schedule) {
      const created = createMockSchedule(schedule);
      schedules.set(created.schedule_id, created);
      return created;
    },

    async getSchedules() {
      return Array.from(schedules.values());
    },

    async getUpcomingExercises(days) {
      const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const upcoming: DRExercise[] = [];

      for (const exercise of exercises.values()) {
        if (exercise.status === 'scheduled') {
          const scheduledDate = new Date(exercise.scheduled_at);
          if (scheduledDate <= cutoff) {
            upcoming.push(exercise);
          }
        }
      }

      return upcoming.sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Phase XVII — DR Exercise Contracts', () => {
  let service: ExerciseService;

  beforeEach(() => {
    service = createMockExerciseService();
  });

  // ==========================================================================
  // CONTRACT: exercise_management
  // ==========================================================================
  describe('CONTRACT: exercise_management', () => {
    it('creates exercise', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Q1 DR Drill',
        description: 'Quarterly DR drill',
        scheduled_at: new Date().toISOString(),
        participants: ['sha256:p1'],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      assert.ok(exercise.exercise_id.startsWith('sha256:'));
      assert.strictEqual(exercise.status, 'scheduled');
    });

    it('retrieves exercise by ID', async () => {
      const created = await service.createExercise({
        exercise_type: 'tabletop',
        scenario: 'key-compromise',
        title: 'Key Compromise Tabletop',
        description: 'Test key compromise response',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 30,
        target_rpo_minutes: 5,
      });

      const retrieved = await service.getExercise(created.exercise_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.exercise_id, created.exercise_id);
    });

    it('lists exercises by status', async () => {
      await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test 1',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const scheduled = await service.listExercises('scheduled');
      assert.ok(scheduled.length > 0);
    });

    it('starts exercise', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'live-failover',
        scenario: 'region-loss',
        title: 'Live Failover Test',
        description: 'Live test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const started = await service.startExercise(exercise.exercise_id);

      assert.strictEqual(started.status, 'in-progress');
      assert.ok(started.started_at);
    });

    it('completes exercise with result', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      await service.startExercise(exercise.exercise_id);
      const result = await service.completeExercise(exercise.exercise_id, {
        actual_rto_minutes: 45,
        actual_rpo_minutes: 10,
        rto_met: true,
        rpo_met: true,
        success: true,
        failure_points: [],
        observations: ['Smooth execution'],
        evidence_pack_id: 'sha256:pack1',
      });

      assert.ok(result.result_id.startsWith('sha256:'));
      assert.strictEqual(result.success, true);
    });

    it('cancels exercise', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const cancelled = await service.cancelExercise(exercise.exercise_id, 'Resource conflict');
      assert.strictEqual(cancelled.status, 'cancelled');
    });
  });

  // ==========================================================================
  // CONTRACT: evidence_generation
  // ==========================================================================
  describe('CONTRACT: evidence_generation', () => {
    it('generates evidence pack', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const pack = await service.generateEvidencePack(exercise.exercise_id);

      assert.ok(pack.pack_id.startsWith('sha256:'));
      assert.strictEqual(pack.sealed, false);
    });

    it('adds artifact to pack', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const pack = await service.generateEvidencePack(exercise.exercise_id);
      const artifact = await service.addEvidenceArtifact(pack.pack_id, {
        artifact_type: 'log',
        description: 'Failover log',
        content_hash: 'sha256:logcontent',
        timestamp: new Date().toISOString(),
      });

      assert.ok(artifact.artifact_id.startsWith('sha256:'));
    });

    it('seals evidence pack', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const pack = await service.generateEvidencePack(exercise.exercise_id);
      const sealed = await service.sealEvidencePack(pack.pack_id);

      assert.strictEqual(sealed.sealed, true);
      assert.ok(sealed.checksum.startsWith('sha256:'));
    });

    it('prevents adding to sealed pack', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const pack = await service.generateEvidencePack(exercise.exercise_id);
      await service.sealEvidencePack(pack.pack_id);

      await assert.rejects(
        async () =>
          service.addEvidenceArtifact(pack.pack_id, {
            artifact_type: 'log',
            description: 'Test',
            content_hash: 'sha256:test',
            timestamp: new Date().toISOString(),
          }),
        /sealed/i
      );
    });

    it('links pack to chain head', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const pack = await service.generateEvidencePack(exercise.exercise_id);

      assert.ok(pack.chain_head_at_creation.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: postmortem_governance
  // ==========================================================================
  describe('CONTRACT: postmortem_governance', () => {
    it('creates postmortem', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const postmortem = await service.createPostmortem(exercise.exercise_id);

      assert.ok(postmortem.postmortem_id.startsWith('sha256:'));
      assert.strictEqual(postmortem.status, 'draft');
    });

    it('updates postmortem', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const postmortem = await service.createPostmortem(exercise.exercise_id);
      const updated = await service.updatePostmortem(postmortem.postmortem_id, {
        summary: 'Exercise completed with observations',
        lessons_learned: ['Improve DNS'],
      });

      assert.strictEqual(updated.summary, 'Exercise completed with observations');
    });

    it('approves postmortem', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const postmortem = await service.createPostmortem(exercise.exercise_id);
      const approved = await service.approvePostmortem(
        postmortem.postmortem_id,
        'sha256:approver1'
      );

      assert.strictEqual(approved.status, 'approved');
      assert.ok(approved.approved_at);
    });

    it('adds action item', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const postmortem = await service.createPostmortem(exercise.exercise_id);
      const item = await service.addActionItem(postmortem.postmortem_id, {
        description: 'Fix DNS failover',
        owner: 'sha256:owner1',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
      });

      assert.ok(item.item_id.startsWith('sha256:'));
      assert.strictEqual(item.status, 'open');
    });

    it('completes action item with evidence', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const postmortem = await service.createPostmortem(exercise.exercise_id);
      const item = await service.addActionItem(postmortem.postmortem_id, {
        description: 'Fix DNS failover',
        owner: 'sha256:owner1',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
      });

      const completed = await service.completeActionItem(item.item_id, 'sha256:pr-evidence');

      assert.strictEqual(completed.status, 'completed');
      assert.strictEqual(completed.completion_evidence, 'sha256:pr-evidence');
    });
  });

  // ==========================================================================
  // CONTRACT: metrics_tracking
  // ==========================================================================
  describe('CONTRACT: metrics_tracking', () => {
    it('calculates period metrics', async () => {
      const metrics = await service.getMetrics(90);

      assert.ok(metrics.period_start);
      assert.ok(metrics.period_end);
      assert.strictEqual(typeof metrics.exercises_completed, 'number');
      assert.strictEqual(typeof metrics.pass_rate, 'number');
    });

    it('tracks RTO/RPO averages', async () => {
      const metrics = await service.getMetrics(90);

      assert.strictEqual(typeof metrics.avg_rto_minutes, 'number');
      assert.strictEqual(typeof metrics.avg_rpo_minutes, 'number');
    });

    it('reports trends', async () => {
      const metrics = await service.getMetrics(90);

      assert.ok(['improving', 'stable', 'declining'].includes(metrics.rto_trend));
      assert.ok(['improving', 'stable', 'declining'].includes(metrics.rpo_trend));
    });

    it('tracks open action items', async () => {
      const metrics = await service.getMetrics(90);

      assert.strictEqual(typeof metrics.action_items_open, 'number');
      assert.strictEqual(typeof metrics.action_items_overdue, 'number');
    });

    it('provides RTO trend data', async () => {
      const trend = await service.getRtoTrend(10);

      assert.ok(Array.isArray(trend));
      for (const value of trend) {
        assert.strictEqual(typeof value, 'number');
      }
    });

    it('provides RPO trend data', async () => {
      const trend = await service.getRpoTrend(10);

      assert.ok(Array.isArray(trend));
      for (const value of trend) {
        assert.strictEqual(typeof value, 'number');
      }
    });
  });

  // ==========================================================================
  // CONTRACT: scheduling
  // ==========================================================================
  describe('CONTRACT: scheduling', () => {
    it('creates drill schedule', async () => {
      const schedule = await service.createSchedule({
        scenario: 'region-loss',
        frequency: 'quarterly',
        next_scheduled: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        auto_create: true,
        notify_days_before: 7,
      });

      assert.ok(schedule.schedule_id.startsWith('sha256:'));
      assert.strictEqual(schedule.frequency, 'quarterly');
    });

    it('lists schedules', async () => {
      await service.createSchedule({
        scenario: 'region-loss',
        frequency: 'quarterly',
        next_scheduled: new Date().toISOString(),
        auto_create: true,
        notify_days_before: 7,
      });

      const schedules = await service.getSchedules();
      assert.ok(schedules.length > 0);
    });

    it('lists upcoming exercises', async () => {
      await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Upcoming Test',
        description: 'Test',
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const upcoming = await service.getUpcomingExercises(30);
      assert.ok(upcoming.length > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: auditability
  // ==========================================================================
  describe('CONTRACT: auditability', () => {
    it('all exercise IDs are opaque sha256', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      assert.ok(exercise.exercise_id.startsWith('sha256:'));
    });

    it('participant IDs are opaque sha256', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: ['sha256:participant1'],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      for (const participant of exercise.participants) {
        assert.ok(participant.startsWith('sha256:'));
      }
    });

    it('evidence pack has checksum', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const pack = await service.generateEvidencePack(exercise.exercise_id);
      const sealed = await service.sealEvidencePack(pack.pack_id);

      assert.ok(sealed.checksum.startsWith('sha256:'));
    });

    it('timestamps are ISO format', async () => {
      const exercise = await service.createExercise({
        exercise_type: 'simulation',
        scenario: 'region-loss',
        title: 'Test',
        description: 'Test',
        scheduled_at: new Date().toISOString(),
        participants: [],
        coordinator: 'sha256:coord1',
        target_rto_minutes: 60,
        target_rpo_minutes: 15,
      });

      const date = new Date(exercise.scheduled_at);
      assert.ok(!isNaN(date.getTime()));
    });
  });
});

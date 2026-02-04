/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: gameday.scheduler.contract.test.ts
 *
 * Tests game day scheduling: cadence management, opt-in scopes,
 * dry-run rules, blackout windows, and participant coordination.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Dry-run mode never affects production state
 * - Blackout windows are enforced
 * - All schedule changes are audited
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type GameDayId = `sha256:${string}`;
type ScenarioId = `sha256:${string}`;
type ParticipantId = `sha256:${string}`;
type AuditEventId = `sha256:${string}`;

type GameDayStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type ExecutionMode = 'dry_run' | 'live_sim' | 'production';
type Cadence = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';

interface BlackoutWindow {
  readonly id: string;
  readonly startTime: string; // ISO 8601
  readonly endTime: string; // ISO 8601
  readonly reason: string;
  readonly enforced: boolean;
}

interface OptInScope {
  readonly scopeId: string;
  readonly scopeType: 'region' | 'service' | 'team' | 'agency';
  readonly optedIn: boolean;
  readonly approvedBy: ParticipantId;
  readonly approvedAt: string;
}

interface GameDaySchedule {
  readonly id: GameDayId;
  readonly title: string;
  readonly scheduledFor: string; // ISO 8601
  readonly cadence: Cadence;
  readonly status: GameDayStatus;
  readonly mode: ExecutionMode;
  readonly scenarios: readonly ScenarioId[];
  readonly participants: readonly ParticipantId[];
  readonly optInScopes: readonly OptInScope[];
  readonly createdAt: string;
  readonly createdBy: ParticipantId;
  readonly confirmedBy?: ParticipantId;
  readonly confirmedAt?: string;
}

interface ScheduleAuditEntry {
  readonly id: AuditEventId;
  readonly gameDayId: GameDayId;
  readonly action:
    | 'created'
    | 'confirmed'
    | 'started'
    | 'completed'
    | 'cancelled'
    | 'rescheduled'
    | 'scope_changed';
  readonly actor: ParticipantId;
  readonly timestamp: string;
  readonly previousHash: string;
  readonly entryHash: string;
  readonly details: Record<string, unknown>;
}

interface ScheduleValidationResult {
  readonly valid: boolean;
  readonly conflicts: readonly string[];
  readonly blackoutViolations: readonly string[];
  readonly missingConfirmations: readonly ParticipantId[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockSchedulerService() {
  const schedules = new Map<GameDayId, GameDaySchedule>();
  const auditLog: ScheduleAuditEntry[] = [];
  const blackouts: BlackoutWindow[] = [];
  let lastHash = 'sha256:genesis';

  function generateId(prefix: string): GameDayId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as GameDayId;
  }

  function appendAudit(
    gameDayId: GameDayId,
    action: ScheduleAuditEntry['action'],
    actor: ParticipantId,
    details: Record<string, unknown> = {}
  ): ScheduleAuditEntry {
    const entry: ScheduleAuditEntry = {
      id: generateId('audit') as AuditEventId,
      gameDayId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      previousHash: lastHash,
      entryHash: `sha256:entry_${Math.random().toString(36).slice(2)}`,
      details,
    };
    lastHash = entry.entryHash;
    auditLog.push(entry);
    return entry;
  }

  return {
    // Schedule management
    createSchedule(
      title: string,
      scheduledFor: string,
      cadence: Cadence,
      mode: ExecutionMode,
      scenarios: readonly ScenarioId[],
      createdBy: ParticipantId
    ): GameDaySchedule {
      const id = generateId('gameday');
      const schedule: GameDaySchedule = {
        id,
        title,
        scheduledFor,
        cadence,
        status: 'scheduled',
        mode,
        scenarios,
        participants: [createdBy],
        optInScopes: [],
        createdAt: new Date().toISOString(),
        createdBy,
      };
      schedules.set(id, schedule);
      appendAudit(id, 'created', createdBy, { title, mode, cadence });
      return schedule;
    },

    confirmSchedule(id: GameDayId, confirmedBy: ParticipantId): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule || schedule.status !== 'scheduled') return null;

      const updated: GameDaySchedule = {
        ...schedule,
        status: 'confirmed',
        confirmedBy,
        confirmedAt: new Date().toISOString(),
      };
      schedules.set(id, updated);
      appendAudit(id, 'confirmed', confirmedBy);
      return updated;
    },

    startGameDay(id: GameDayId, actor: ParticipantId): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule || schedule.status !== 'confirmed') return null;

      // Check blackout windows
      const now = new Date();
      for (const blackout of blackouts) {
        if (blackout.enforced) {
          const start = new Date(blackout.startTime);
          const end = new Date(blackout.endTime);
          if (now >= start && now <= end) {
            return null; // Cannot start during blackout
          }
        }
      }

      const updated: GameDaySchedule = {
        ...schedule,
        status: 'in_progress',
      };
      schedules.set(id, updated);
      appendAudit(id, 'started', actor);
      return updated;
    },

    completeGameDay(id: GameDayId, actor: ParticipantId): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule || schedule.status !== 'in_progress') return null;

      const updated: GameDaySchedule = {
        ...schedule,
        status: 'completed',
      };
      schedules.set(id, updated);
      appendAudit(id, 'completed', actor);
      return updated;
    },

    cancelGameDay(id: GameDayId, actor: ParticipantId, reason: string): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule || schedule.status === 'completed' || schedule.status === 'cancelled') {
        return null;
      }

      const updated: GameDaySchedule = {
        ...schedule,
        status: 'cancelled',
      };
      schedules.set(id, updated);
      appendAudit(id, 'cancelled', actor, { reason });
      return updated;
    },

    reschedule(id: GameDayId, newTime: string, actor: ParticipantId): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule || schedule.status !== 'scheduled') return null;

      const updated: GameDaySchedule = {
        ...schedule,
        scheduledFor: newTime,
      };
      schedules.set(id, updated);
      appendAudit(id, 'rescheduled', actor, { previousTime: schedule.scheduledFor, newTime });
      return updated;
    },

    // Opt-in scope management
    addOptInScope(
      id: GameDayId,
      scope: Omit<OptInScope, 'approvedAt'>,
      actor: ParticipantId
    ): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule) return null;

      const newScope: OptInScope = {
        ...scope,
        approvedAt: new Date().toISOString(),
      };

      const updated: GameDaySchedule = {
        ...schedule,
        optInScopes: [...schedule.optInScopes, newScope],
      };
      schedules.set(id, updated);
      appendAudit(id, 'scope_changed', actor, { action: 'add', scope: newScope });
      return updated;
    },

    removeOptInScope(id: GameDayId, scopeId: string, actor: ParticipantId): GameDaySchedule | null {
      const schedule = schedules.get(id);
      if (!schedule) return null;

      const updated: GameDaySchedule = {
        ...schedule,
        optInScopes: schedule.optInScopes.filter(s => s.scopeId !== scopeId),
      };
      schedules.set(id, updated);
      appendAudit(id, 'scope_changed', actor, { action: 'remove', scopeId });
      return updated;
    },

    // Blackout management
    addBlackout(window: BlackoutWindow): void {
      blackouts.push(window);
    },

    getBlackouts(): readonly BlackoutWindow[] {
      return [...blackouts];
    },

    isInBlackout(time: Date): BlackoutWindow | null {
      for (const blackout of blackouts) {
        if (blackout.enforced) {
          const start = new Date(blackout.startTime);
          const end = new Date(blackout.endTime);
          if (time >= start && time <= end) {
            return blackout;
          }
        }
      }
      return null;
    },

    // Validation
    validateSchedule(id: GameDayId): ScheduleValidationResult {
      const schedule = schedules.get(id);
      if (!schedule) {
        return {
          valid: false,
          conflicts: ['Schedule not found'],
          blackoutViolations: [],
          missingConfirmations: [],
        };
      }

      const conflicts: string[] = [];
      const blackoutViolations: string[] = [];
      const missingConfirmations: ParticipantId[] = [];

      // Check for conflicting schedules
      for (const [otherId, other] of schedules) {
        if (otherId !== id && other.status !== 'cancelled' && other.status !== 'completed') {
          if (other.scheduledFor === schedule.scheduledFor) {
            conflicts.push(`Conflicts with ${otherId}`);
          }
        }
      }

      // Check blackout windows
      const scheduledTime = new Date(schedule.scheduledFor);
      for (const blackout of blackouts) {
        if (blackout.enforced) {
          const start = new Date(blackout.startTime);
          const end = new Date(blackout.endTime);
          if (scheduledTime >= start && scheduledTime <= end) {
            blackoutViolations.push(`Scheduled during blackout: ${blackout.reason}`);
          }
        }
      }

      // Check confirmations for live/production modes
      if (schedule.mode !== 'dry_run' && !schedule.confirmedBy) {
        missingConfirmations.push(schedule.createdBy);
      }

      return {
        valid: conflicts.length === 0 && blackoutViolations.length === 0,
        conflicts,
        blackoutViolations,
        missingConfirmations,
      };
    },

    // Cadence helpers
    getNextScheduledDate(cadence: Cadence, fromDate: Date = new Date()): Date {
      const next = new Date(fromDate);
      switch (cadence) {
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'biweekly':
          next.setDate(next.getDate() + 14);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          break;
        case 'annual':
          next.setFullYear(next.getFullYear() + 1);
          break;
      }
      return next;
    },

    // Queries
    getSchedule(id: GameDayId): GameDaySchedule | null {
      return schedules.get(id) ?? null;
    },

    getUpcomingSchedules(): readonly GameDaySchedule[] {
      return [...schedules.values()]
        .filter(s => s.status === 'scheduled' || s.status === 'confirmed')
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    },

    getSchedulesByStatus(status: GameDayStatus): readonly GameDaySchedule[] {
      return [...schedules.values()].filter(s => s.status === status);
    },

    getAuditLog(gameDayId?: GameDayId): readonly ScheduleAuditEntry[] {
      if (gameDayId) {
        return auditLog.filter(e => e.gameDayId === gameDayId);
      }
      return [...auditLog];
    },

    verifyAuditChain(): boolean {
      let expectedPrevHash = 'sha256:genesis';
      for (const entry of auditLog) {
        if (entry.previousHash !== expectedPrevHash) {
          return false;
        }
        expectedPrevHash = entry.entryHash;
      }
      return true;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: Game Day Scheduler Contracts', () => {
  let scheduler: ReturnType<typeof createMockSchedulerService>;
  const creatorId = 'sha256:creator_abc123' as ParticipantId;
  const confirmerId = 'sha256:confirmer_def456' as ParticipantId;
  const scenarioId = 'sha256:scenario_ghi789' as ScenarioId;

  beforeEach(() => {
    scheduler = createMockSchedulerService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate schedule IDs with sha256: prefix', () => {
      const schedule = scheduler.createSchedule(
        'Q1 DR Exercise',
        '2026-03-15T10:00:00Z',
        'quarterly',
        'dry_run',
        [scenarioId],
        creatorId
      );
      assert.ok(schedule.id.startsWith('sha256:'), 'Schedule ID must be opaque sha256:');
    });

    it('should generate audit IDs with sha256: prefix', () => {
      scheduler.createSchedule(
        'Weekly Check',
        '2026-02-10T10:00:00Z',
        'weekly',
        'dry_run',
        [scenarioId],
        creatorId
      );
      const audit = scheduler.getAuditLog();
      assert.ok(audit[0].id.startsWith('sha256:'), 'Audit ID must be opaque sha256:');
    });

    it('should maintain hash chain with sha256: prefixes', () => {
      scheduler.createSchedule(
        'Test',
        '2026-02-10T10:00:00Z',
        'monthly',
        'dry_run',
        [scenarioId],
        creatorId
      );
      const audit = scheduler.getAuditLog();
      assert.ok(audit[0].entryHash.startsWith('sha256:'), 'Entry hash must be sha256:');
    });
  });

  // ==========================================================================
  // Schedule Creation Tests
  // ==========================================================================

  describe('Schedule Creation', () => {
    it('should create a schedule with all required fields', () => {
      const schedule = scheduler.createSchedule(
        'Monthly DR Drill',
        '2026-03-01T09:00:00Z',
        'monthly',
        'live_sim',
        [scenarioId],
        creatorId
      );
      assert.strictEqual(schedule.title, 'Monthly DR Drill');
      assert.strictEqual(schedule.status, 'scheduled');
      assert.strictEqual(schedule.mode, 'live_sim');
      assert.strictEqual(schedule.cadence, 'monthly');
      assert.deepStrictEqual(schedule.scenarios, [scenarioId]);
    });

    it('should include creator as participant', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      assert.ok(schedule.participants.includes(creatorId));
    });

    it('should record creation timestamp', () => {
      const before = new Date().toISOString();
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const after = new Date().toISOString();
      assert.ok(schedule.createdAt >= before && schedule.createdAt <= after);
    });

    it('should audit schedule creation', () => {
      const schedule = scheduler.createSchedule(
        'Audited Schedule',
        '2026-03-01T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      const audit = scheduler.getAuditLog(schedule.id);
      assert.strictEqual(audit.length, 1);
      assert.strictEqual(audit[0].action, 'created');
      assert.strictEqual(audit[0].actor, creatorId);
    });
  });

  // ==========================================================================
  // Schedule Confirmation Tests
  // ==========================================================================

  describe('Schedule Confirmation', () => {
    it('should confirm a scheduled game day', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const confirmed = scheduler.confirmSchedule(schedule.id, confirmerId);
      assert.ok(confirmed);
      assert.strictEqual(confirmed!.status, 'confirmed');
      assert.strictEqual(confirmed!.confirmedBy, confirmerId);
    });

    it('should record confirmation timestamp', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const confirmed = scheduler.confirmSchedule(schedule.id, confirmerId);
      assert.ok(confirmed!.confirmedAt);
    });

    it('should not confirm already confirmed schedule', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(schedule.id, confirmerId);
      const reconfirm = scheduler.confirmSchedule(schedule.id, confirmerId);
      assert.strictEqual(reconfirm, null);
    });

    it('should audit confirmation', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(schedule.id, confirmerId);
      const audit = scheduler.getAuditLog(schedule.id);
      assert.strictEqual(audit[1].action, 'confirmed');
    });
  });

  // ==========================================================================
  // Execution Mode Tests
  // ==========================================================================

  describe('Execution Mode Constraints', () => {
    it('should support dry_run mode', () => {
      const schedule = scheduler.createSchedule(
        'Dry Run Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      assert.strictEqual(schedule.mode, 'dry_run');
    });

    it('should support live_sim mode', () => {
      const schedule = scheduler.createSchedule(
        'Live Sim Test',
        '2026-03-01T09:00:00Z',
        'monthly',
        'live_sim',
        [],
        creatorId
      );
      assert.strictEqual(schedule.mode, 'live_sim');
    });

    it('should support production mode', () => {
      const schedule = scheduler.createSchedule(
        'Production Test',
        '2026-03-01T09:00:00Z',
        'quarterly',
        'production',
        [],
        creatorId
      );
      assert.strictEqual(schedule.mode, 'production');
    });

    it('should require confirmation for non-dry-run modes', () => {
      const schedule = scheduler.createSchedule(
        'Production Test',
        '2026-03-01T09:00:00Z',
        'quarterly',
        'production',
        [],
        creatorId
      );
      const validation = scheduler.validateSchedule(schedule.id);
      assert.ok(validation.missingConfirmations.length > 0);
    });

    it('should not require confirmation for dry_run mode', () => {
      const schedule = scheduler.createSchedule(
        'Dry Run',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      // For dry_run, we allow execution without confirmation
      const validation = scheduler.validateSchedule(schedule.id);
      assert.strictEqual(validation.missingConfirmations.length, 0);
    });
  });

  // ==========================================================================
  // Blackout Window Tests
  // ==========================================================================

  describe('Blackout Windows', () => {
    it('should add blackout windows', () => {
      scheduler.addBlackout({
        id: 'blackout-1',
        startTime: '2026-03-01T00:00:00Z',
        endTime: '2026-03-02T00:00:00Z',
        reason: 'Production freeze',
        enforced: true,
      });
      const blackouts = scheduler.getBlackouts();
      assert.strictEqual(blackouts.length, 1);
    });

    it('should detect schedule during blackout', () => {
      scheduler.addBlackout({
        id: 'blackout-1',
        startTime: '2026-03-01T00:00:00Z',
        endTime: '2026-03-02T00:00:00Z',
        reason: 'Production freeze',
        enforced: true,
      });
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T12:00:00Z', // During blackout
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const validation = scheduler.validateSchedule(schedule.id);
      assert.ok(validation.blackoutViolations.length > 0);
      assert.strictEqual(validation.valid, false);
    });

    it('should allow schedule outside blackout', () => {
      scheduler.addBlackout({
        id: 'blackout-1',
        startTime: '2026-03-01T00:00:00Z',
        endTime: '2026-03-02T00:00:00Z',
        reason: 'Production freeze',
        enforced: true,
      });
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-03T12:00:00Z', // After blackout
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const validation = scheduler.validateSchedule(schedule.id);
      assert.strictEqual(validation.blackoutViolations.length, 0);
    });

    it('should not enforce non-enforced blackouts', () => {
      scheduler.addBlackout({
        id: 'blackout-1',
        startTime: '2026-03-01T00:00:00Z',
        endTime: '2026-03-02T00:00:00Z',
        reason: 'Soft freeze',
        enforced: false,
      });
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T12:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const validation = scheduler.validateSchedule(schedule.id);
      assert.strictEqual(validation.blackoutViolations.length, 0);
    });

    it('should prevent starting game day during blackout', () => {
      // Add current-time blackout
      const now = new Date();
      const later = new Date(now.getTime() + 3600000);
      scheduler.addBlackout({
        id: 'blackout-now',
        startTime: new Date(now.getTime() - 1000).toISOString(),
        endTime: later.toISOString(),
        reason: 'Active blackout',
        enforced: true,
      });

      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-10T12:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(schedule.id, confirmerId);
      const started = scheduler.startGameDay(schedule.id, creatorId);
      assert.strictEqual(started, null);
    });
  });

  // ==========================================================================
  // Opt-In Scope Tests
  // ==========================================================================

  describe('Opt-In Scopes', () => {
    it('should add opt-in scope to schedule', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const updated = scheduler.addOptInScope(
        schedule.id,
        {
          scopeId: 'region-west',
          scopeType: 'region',
          optedIn: true,
          approvedBy: confirmerId,
        },
        confirmerId
      );
      assert.ok(updated);
      assert.strictEqual(updated!.optInScopes.length, 1);
      assert.strictEqual(updated!.optInScopes[0].scopeId, 'region-west');
    });

    it('should record scope approval timestamp', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const updated = scheduler.addOptInScope(
        schedule.id,
        {
          scopeId: 'team-alpha',
          scopeType: 'team',
          optedIn: true,
          approvedBy: confirmerId,
        },
        confirmerId
      );
      assert.ok(updated!.optInScopes[0].approvedAt);
    });

    it('should remove opt-in scope', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.addOptInScope(
        schedule.id,
        {
          scopeId: 'region-east',
          scopeType: 'region',
          optedIn: true,
          approvedBy: confirmerId,
        },
        confirmerId
      );
      const updated = scheduler.removeOptInScope(schedule.id, 'region-east', creatorId);
      assert.ok(updated);
      assert.strictEqual(updated!.optInScopes.length, 0);
    });

    it('should audit scope changes', () => {
      const schedule = scheduler.createSchedule(
        'Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.addOptInScope(
        schedule.id,
        {
          scopeId: 'service-api',
          scopeType: 'service',
          optedIn: true,
          approvedBy: confirmerId,
        },
        confirmerId
      );
      const audit = scheduler.getAuditLog(schedule.id);
      const scopeChange = audit.find(e => e.action === 'scope_changed');
      assert.ok(scopeChange);
    });
  });

  // ==========================================================================
  // Cadence Tests
  // ==========================================================================

  describe('Cadence Management', () => {
    it('should calculate next weekly date', () => {
      const from = new Date('2026-02-01T10:00:00Z');
      const next = scheduler.getNextScheduledDate('weekly', from);
      assert.strictEqual(next.toISOString(), '2026-02-08T10:00:00.000Z');
    });

    it('should calculate next biweekly date', () => {
      const from = new Date('2026-02-01T10:00:00Z');
      const next = scheduler.getNextScheduledDate('biweekly', from);
      assert.strictEqual(next.toISOString(), '2026-02-15T10:00:00.000Z');
    });

    it('should calculate next monthly date', () => {
      // Use summer dates to avoid DST transitions
      const from = new Date('2026-07-15T10:00:00Z');
      const next = scheduler.getNextScheduledDate('monthly', from);
      assert.strictEqual(next.toISOString(), '2026-08-15T10:00:00.000Z');
    });

    it('should calculate next quarterly date', () => {
      // Use summer dates to avoid DST transitions
      const from = new Date('2026-06-15T10:00:00Z');
      const next = scheduler.getNextScheduledDate('quarterly', from);
      assert.strictEqual(next.toISOString(), '2026-09-15T10:00:00.000Z');
    });

    it('should calculate next annual date', () => {
      const from = new Date('2026-03-15T10:00:00Z');
      const next = scheduler.getNextScheduledDate('annual', from);
      assert.strictEqual(next.toISOString(), '2027-03-15T10:00:00.000Z');
    });
  });

  // ==========================================================================
  // Lifecycle Tests
  // ==========================================================================

  describe('Schedule Lifecycle', () => {
    it('should progress through lifecycle: scheduled → confirmed → in_progress → completed', () => {
      const schedule = scheduler.createSchedule(
        'Full Lifecycle',
        '2026-03-01T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      assert.strictEqual(schedule.status, 'scheduled');

      const confirmed = scheduler.confirmSchedule(schedule.id, confirmerId);
      assert.strictEqual(confirmed!.status, 'confirmed');

      const started = scheduler.startGameDay(schedule.id, creatorId);
      assert.strictEqual(started!.status, 'in_progress');

      const completed = scheduler.completeGameDay(schedule.id, creatorId);
      assert.strictEqual(completed!.status, 'completed');
    });

    it('should allow cancellation from scheduled state', () => {
      const schedule = scheduler.createSchedule(
        'To Cancel',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const cancelled = scheduler.cancelGameDay(schedule.id, creatorId, 'Conflict');
      assert.ok(cancelled);
      assert.strictEqual(cancelled!.status, 'cancelled');
    });

    it('should allow cancellation from confirmed state', () => {
      const schedule = scheduler.createSchedule(
        'To Cancel',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(schedule.id, confirmerId);
      const cancelled = scheduler.cancelGameDay(schedule.id, creatorId, 'Emergency');
      assert.ok(cancelled);
      assert.strictEqual(cancelled!.status, 'cancelled');
    });

    it('should not allow cancellation of completed game day', () => {
      const schedule = scheduler.createSchedule(
        'Completed',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(schedule.id, confirmerId);
      scheduler.startGameDay(schedule.id, creatorId);
      scheduler.completeGameDay(schedule.id, creatorId);
      const cancelled = scheduler.cancelGameDay(schedule.id, creatorId, 'Too late');
      assert.strictEqual(cancelled, null);
    });

    it('should allow rescheduling from scheduled state', () => {
      const schedule = scheduler.createSchedule(
        'To Reschedule',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      const rescheduled = scheduler.reschedule(schedule.id, '2026-03-08T09:00:00Z', creatorId);
      assert.ok(rescheduled);
      assert.strictEqual(rescheduled!.scheduledFor, '2026-03-08T09:00:00Z');
    });

    it('should audit reschedule with previous time', () => {
      const schedule = scheduler.createSchedule(
        'To Reschedule',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.reschedule(schedule.id, '2026-03-08T09:00:00Z', creatorId);
      const audit = scheduler.getAuditLog(schedule.id);
      const rescheduleEvent = audit.find(e => e.action === 'rescheduled');
      assert.ok(rescheduleEvent);
      assert.strictEqual(rescheduleEvent!.details.previousTime, '2026-03-01T09:00:00Z');
    });
  });

  // ==========================================================================
  // Conflict Detection Tests
  // ==========================================================================

  describe('Conflict Detection', () => {
    it('should detect conflicting schedules at same time', () => {
      scheduler.createSchedule(
        'First',
        '2026-03-01T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      const second = scheduler.createSchedule(
        'Second',
        '2026-03-01T09:00:00Z', // Same time
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      const validation = scheduler.validateSchedule(second.id);
      assert.ok(validation.conflicts.length > 0);
    });

    it('should not report conflict with cancelled schedule', () => {
      const first = scheduler.createSchedule(
        'First',
        '2026-03-01T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.cancelGameDay(first.id, creatorId, 'Cancelled');
      const second = scheduler.createSchedule(
        'Second',
        '2026-03-01T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      const validation = scheduler.validateSchedule(second.id);
      assert.strictEqual(validation.conflicts.length, 0);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Schedule Queries', () => {
    it('should get upcoming schedules sorted by date', () => {
      scheduler.createSchedule(
        'Later',
        '2026-03-15T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.createSchedule(
        'Earlier',
        '2026-03-01T09:00:00Z',
        'monthly',
        'dry_run',
        [],
        creatorId
      );
      const upcoming = scheduler.getUpcomingSchedules();
      assert.strictEqual(upcoming.length, 2);
      assert.strictEqual(upcoming[0].title, 'Earlier');
      assert.strictEqual(upcoming[1].title, 'Later');
    });

    it('should filter schedules by status', () => {
      const s1 = scheduler.createSchedule(
        'One',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.createSchedule('Two', '2026-03-02T09:00:00Z', 'weekly', 'dry_run', [], creatorId);
      scheduler.confirmSchedule(s1.id, confirmerId);

      const scheduled = scheduler.getSchedulesByStatus('scheduled');
      const confirmed = scheduler.getSchedulesByStatus('confirmed');
      assert.strictEqual(scheduled.length, 1);
      assert.strictEqual(confirmed.length, 1);
    });

    it('should not include completed in upcoming', () => {
      const s = scheduler.createSchedule(
        'Done',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(s.id, confirmerId);
      scheduler.startGameDay(s.id, creatorId);
      scheduler.completeGameDay(s.id, creatorId);
      const upcoming = scheduler.getUpcomingSchedules();
      assert.strictEqual(upcoming.length, 0);
    });
  });

  // ==========================================================================
  // Audit Chain Tests
  // ==========================================================================

  describe('Audit Chain Integrity', () => {
    it('should maintain valid hash chain', () => {
      const s = scheduler.createSchedule(
        'Chain Test',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(s.id, confirmerId);
      scheduler.startGameDay(s.id, creatorId);
      scheduler.completeGameDay(s.id, creatorId);
      assert.ok(scheduler.verifyAuditChain());
    });

    it('should link all entries to previous hash', () => {
      scheduler.createSchedule('One', '2026-03-01T09:00:00Z', 'weekly', 'dry_run', [], creatorId);
      scheduler.createSchedule('Two', '2026-03-02T09:00:00Z', 'weekly', 'dry_run', [], creatorId);
      const audit = scheduler.getAuditLog();
      assert.strictEqual(audit[0].previousHash, 'sha256:genesis');
      assert.strictEqual(audit[1].previousHash, audit[0].entryHash);
    });

    it('should track all lifecycle events in audit', () => {
      const s = scheduler.createSchedule(
        'Full Audit',
        '2026-03-01T09:00:00Z',
        'weekly',
        'dry_run',
        [],
        creatorId
      );
      scheduler.confirmSchedule(s.id, confirmerId);
      scheduler.startGameDay(s.id, creatorId);
      scheduler.completeGameDay(s.id, creatorId);
      const audit = scheduler.getAuditLog(s.id);
      const actions = audit.map(e => e.action);
      assert.deepStrictEqual(actions, ['created', 'confirmed', 'started', 'completed']);
    });
  });
});

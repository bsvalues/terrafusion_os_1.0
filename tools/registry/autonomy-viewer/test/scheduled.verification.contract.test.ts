/**
 * Scheduled Verification Contract Tests
 * =======================================
 *
 * Phase IVe: Validates scheduled postdeploy verification with paging thresholds.
 *
 * Contract:
 * - verification_runs_on_schedule: daily/weekly checks auto-execute
 * - verification_uses_separate_paging_path: ops alerts don't compete with auth path
 * - verification_respects_cadence_config: schedule is operator-configurable
 * - verification_emits_status_events: all runs emit auditable events
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Types for Scheduled Verification
// ============================================================================

/**
 * Verification schedule cadence.
 */
type ScheduleCadence = 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * Paging path type.
 */
type PagingPath = 'auth' | 'ops' | 'infrastructure';

/**
 * Verification schedule config.
 */
interface VerificationScheduleConfig {
  readonly cadence: ScheduleCadence;
  readonly enabledEnvironments: readonly ('development' | 'staging' | 'production')[];
  readonly pagingPath: PagingPath;
  readonly pagingThreshold: number; // consecutive failures before paging
  readonly quietHoursRespected: boolean;
  readonly runAtTime?: string; // HH:MM in UTC
  readonly runOnDays?: readonly number[]; // 0=Sunday, 6=Saturday
}

/**
 * Verification run status.
 */
type VerificationRunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

/**
 * Verification run result.
 */
interface VerificationRunResult {
  readonly runId: string;
  readonly environment: string;
  readonly status: VerificationRunStatus;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
  readonly checksPerformed: number;
  readonly checksPassed: number;
  readonly checksFailed: number;
  readonly pagingTriggered: boolean;
  readonly pagingPath: PagingPath;
  readonly consecutiveFailures: number;
  readonly issues: readonly string[];
}

/**
 * Schedule execution record.
 */
interface ScheduleExecutionRecord {
  readonly scheduleId: string;
  readonly cadence: ScheduleCadence;
  readonly environment: string;
  readonly lastRunAt?: string;
  readonly nextRunAt: string;
  readonly consecutiveSuccesses: number;
  readonly consecutiveFailures: number;
  readonly totalRuns: number;
  readonly enabled: boolean;
}

/**
 * Verification status event.
 */
interface VerificationStatusEvent {
  readonly eventId: string;
  readonly eventType: 'run_started' | 'run_completed' | 'run_failed' | 'paging_triggered' | 'schedule_updated';
  readonly runId: string;
  readonly environment: string;
  readonly timestamp: string;
  readonly details: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SCHEDULE_CONFIG: VerificationScheduleConfig = {
  cadence: 'daily',
  enabledEnvironments: ['staging', 'production'],
  pagingPath: 'ops',
  pagingThreshold: 3,
  quietHoursRespected: true,
  runAtTime: '06:00',
};

const PRODUCTION_SCHEDULE_CONFIG: VerificationScheduleConfig = {
  cadence: 'hourly',
  enabledEnvironments: ['production'],
  pagingPath: 'ops',
  pagingThreshold: 2,
  quietHoursRespected: false, // production always pages
  runAtTime: undefined, // runs every hour
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Calculate next run time based on cadence.
 */
function calculateNextRunTime(
  cadence: ScheduleCadence,
  lastRun: Date | undefined,
  _config: VerificationScheduleConfig
): Date {
  const now = new Date();
  const base = lastRun ?? now;

  switch (cadence) {
    case 'hourly':
      return new Date(base.getTime() + 60 * 60 * 1000);
    case 'daily': {
      // Simply add 24 hours for daily cadence
      return new Date(base.getTime() + 24 * 60 * 60 * 1000);
    }
    case 'weekly': {
      return new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    case 'monthly': {
      const next = new Date(base);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
  }
}

/**
 * Check if schedule should run now.
 */
function shouldRunNow(
  schedule: ScheduleExecutionRecord,
  config: VerificationScheduleConfig,
  now: Date = new Date()
): boolean {
  if (!schedule.enabled) return false;

  const nextRun = new Date(schedule.nextRunAt);
  if (now < nextRun) return false;

  // Check quiet hours only if respected AND not production config
  if (config.quietHoursRespected && config.cadence !== 'hourly') {
    const hour = now.getUTCHours();
    // Quiet hours: 22:00 - 06:00 UTC
    if (hour >= 22 || hour < 6) return false;
  }

  return true;
}

/**
 * Create verification schedule.
 */
function createSchedule(
  environment: string,
  config: VerificationScheduleConfig
): ScheduleExecutionRecord {
  return {
    scheduleId: `sched-${environment}-${Date.now()}`,
    cadence: config.cadence,
    environment,
    lastRunAt: undefined,
    nextRunAt: calculateNextRunTime(config.cadence, undefined, config).toISOString(),
    consecutiveSuccesses: 0,
    consecutiveFailures: 0,
    totalRuns: 0,
    enabled: config.enabledEnvironments.includes(environment as 'development' | 'staging' | 'production'),
  };
}

/**
 * Run scheduled verification.
 */
function runScheduledVerification(
  schedule: ScheduleExecutionRecord,
  config: VerificationScheduleConfig,
  options: {
    simulateFailure?: boolean;
    checksToRun?: number;
  } = {}
): { result: VerificationRunResult; events: VerificationStatusEvent[]; updatedSchedule: ScheduleExecutionRecord } {
  const { simulateFailure = false, checksToRun = 10 } = options;
  const events: VerificationStatusEvent[] = [];
  const runId = `run-${Date.now()}`;
  const startedAt = new Date().toISOString();

  // Emit start event
  events.push({
    eventId: `evt-${Date.now()}-start`,
    eventType: 'run_started',
    runId,
    environment: schedule.environment,
    timestamp: startedAt,
    details: { cadence: schedule.cadence, scheduledAt: schedule.nextRunAt },
  });

  // Simulate verification
  const checksPassed = simulateFailure ? Math.floor(checksToRun * 0.6) : checksToRun;
  const checksFailed = checksToRun - checksPassed;
  const passed = checksFailed === 0;

  const newConsecutiveFailures = passed ? 0 : schedule.consecutiveFailures + 1;
  const pagingTriggered = newConsecutiveFailures >= config.pagingThreshold;

  const completedAt = new Date().toISOString();
  const result: VerificationRunResult = {
    runId,
    environment: schedule.environment,
    status: passed ? 'passed' : 'failed',
    startedAt,
    completedAt,
    durationMs: 150,
    checksPerformed: checksToRun,
    checksPassed,
    checksFailed,
    pagingTriggered,
    pagingPath: config.pagingPath,
    consecutiveFailures: newConsecutiveFailures,
    issues: simulateFailure ? ['SLO check failed', 'Audit drain degraded'] : [],
  };

  // Emit completion event
  events.push({
    eventId: `evt-${Date.now()}-complete`,
    eventType: passed ? 'run_completed' : 'run_failed',
    runId,
    environment: schedule.environment,
    timestamp: completedAt,
    details: { passed, checksPassed, checksFailed, durationMs: result.durationMs },
  });

  // Emit paging event if triggered
  if (pagingTriggered) {
    events.push({
      eventId: `evt-${Date.now()}-page`,
      eventType: 'paging_triggered',
      runId,
      environment: schedule.environment,
      timestamp: completedAt,
      details: {
        pagingPath: config.pagingPath,
        consecutiveFailures: newConsecutiveFailures,
        threshold: config.pagingThreshold,
      },
    });
  }

  // Update schedule
  const updatedSchedule: ScheduleExecutionRecord = {
    ...schedule,
    lastRunAt: completedAt,
    nextRunAt: calculateNextRunTime(config.cadence, new Date(completedAt), config).toISOString(),
    consecutiveSuccesses: passed ? schedule.consecutiveSuccesses + 1 : 0,
    consecutiveFailures: newConsecutiveFailures,
    totalRuns: schedule.totalRuns + 1,
  };

  return { result, events, updatedSchedule };
}

/**
 * Validate paging path isolation.
 */
function validatePagingPathIsolation(path: PagingPath): { isolated: boolean; reason: string } {
  // Auth path is for authentication/authorization failures only
  // Ops path is for operational health checks
  // Infrastructure path is for underlying system issues
  const pathDescriptions: Record<PagingPath, string> = {
    auth: 'Authentication and authorization failures',
    ops: 'Operational health and SLO violations',
    infrastructure: 'Underlying system and infrastructure issues',
  };

  // Verification should NEVER use auth path
  if (path === 'auth') {
    return { isolated: false, reason: 'Verification must not use auth paging path' };
  }

  return { isolated: true, reason: `Using ${path}: ${pathDescriptions[path]}` };
}

// ============================================================================
// Contract: verification_runs_on_schedule
// ============================================================================

describe('Scheduled Verification Contract', () => {
  describe('verification_runs_on_schedule', () => {
    it('should create schedule with correct next run time', () => {
      const schedule = createSchedule('production', DEFAULT_SCHEDULE_CONFIG);

      assert.ok(schedule.scheduleId);
      assert.strictEqual(schedule.cadence, 'daily');
      assert.ok(schedule.nextRunAt);
      assert.strictEqual(schedule.enabled, true);
    });

    it('should calculate hourly next run correctly', () => {
      const now = new Date();
      const next = calculateNextRunTime('hourly', now, PRODUCTION_SCHEDULE_CONFIG);

      const diff = next.getTime() - now.getTime();
      assert.strictEqual(diff, 60 * 60 * 1000); // 1 hour
    });

    it('should calculate daily next run correctly', () => {
      const now = new Date();
      const next = calculateNextRunTime('daily', now, DEFAULT_SCHEDULE_CONFIG);

      const diff = next.getTime() - now.getTime();
      assert.ok(diff >= 23 * 60 * 60 * 1000); // at least 23 hours
      assert.ok(diff <= 25 * 60 * 60 * 1000); // at most 25 hours
    });

    it('should detect when schedule should run', () => {
      const schedule = createSchedule('production', DEFAULT_SCHEDULE_CONFIG);

      // Override nextRunAt to be in the past (24 hours ago)
      const pastSchedule: ScheduleExecutionRecord = {
        ...schedule,
        nextRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      // Create a time that's definitely after nextRunAt and during business hours (12:00 UTC)
      const businessHours = new Date();
      businessHours.setUTCHours(12, 0, 0, 0);
      // Ensure it's today or in the future
      if (businessHours < new Date()) {
        businessHours.setDate(businessHours.getDate() + 1);
      }

      const shouldRun = shouldRunNow(pastSchedule, DEFAULT_SCHEDULE_CONFIG, businessHours);
      assert.ok(shouldRun);
    });

    it('should not run disabled schedules', () => {
      const schedule = createSchedule('development', DEFAULT_SCHEDULE_CONFIG);
      // development is not in enabledEnvironments

      assert.strictEqual(schedule.enabled, false);
      assert.ok(!shouldRunNow(schedule, DEFAULT_SCHEDULE_CONFIG));
    });
  });

  // ============================================================================
  // Contract: verification_uses_separate_paging_path
  // ============================================================================

  describe('verification_uses_separate_paging_path', () => {
    it('should use ops paging path by default', () => {
      assert.strictEqual(DEFAULT_SCHEDULE_CONFIG.pagingPath, 'ops');
      assert.strictEqual(PRODUCTION_SCHEDULE_CONFIG.pagingPath, 'ops');
    });

    it('should reject auth paging path for verification', () => {
      const authValidation = validatePagingPathIsolation('auth');
      assert.ok(!authValidation.isolated);
      assert.ok(authValidation.reason.includes('must not'));
    });

    it('should accept ops paging path', () => {
      const opsValidation = validatePagingPathIsolation('ops');
      assert.ok(opsValidation.isolated);
      assert.ok(opsValidation.reason.includes('Operational'));
    });

    it('should accept infrastructure paging path', () => {
      const infraValidation = validatePagingPathIsolation('infrastructure');
      assert.ok(infraValidation.isolated);
      assert.ok(infraValidation.reason.includes('infrastructure'));
    });

    it('should include paging path in run result', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      const { result } = runScheduledVerification(schedule, PRODUCTION_SCHEDULE_CONFIG);

      assert.strictEqual(result.pagingPath, 'ops');
    });
  });

  // ============================================================================
  // Contract: verification_respects_cadence_config
  // ============================================================================

  describe('verification_respects_cadence_config', () => {
    it('should respect hourly cadence', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      assert.strictEqual(schedule.cadence, 'hourly');
    });

    it('should respect daily cadence', () => {
      const schedule = createSchedule('staging', DEFAULT_SCHEDULE_CONFIG);
      assert.strictEqual(schedule.cadence, 'daily');
    });

    it('should respect quiet hours when configured', () => {
      const schedule = createSchedule('staging', DEFAULT_SCHEDULE_CONFIG);
      const pastSchedule: ScheduleExecutionRecord = {
        ...schedule,
        nextRunAt: new Date(Date.now() - 1000).toISOString(),
      };

      // During quiet hours (23:00 UTC)
      const quietHours = new Date();
      quietHours.setUTCHours(23, 0, 0, 0);

      const shouldRun = shouldRunNow(pastSchedule, DEFAULT_SCHEDULE_CONFIG, quietHours);
      assert.ok(!shouldRun);
    });

    it('should ignore quiet hours when disabled', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      const pastSchedule: ScheduleExecutionRecord = {
        ...schedule,
        nextRunAt: new Date(Date.now() - 1000).toISOString(),
      };

      // During quiet hours but production ignores them
      const quietHours = new Date();
      quietHours.setUTCHours(23, 0, 0, 0);

      const shouldRun = shouldRunNow(pastSchedule, PRODUCTION_SCHEDULE_CONFIG, quietHours);
      assert.ok(shouldRun);
    });

    it('should respect paging threshold', () => {
      let schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);

      // First failure - no paging
      const { result: result1, updatedSchedule: schedule1 } = runScheduledVerification(
        schedule,
        PRODUCTION_SCHEDULE_CONFIG,
        { simulateFailure: true }
      );
      assert.ok(!result1.pagingTriggered);
      assert.strictEqual(schedule1.consecutiveFailures, 1);

      // Second failure - triggers paging (threshold is 2)
      const { result: result2 } = runScheduledVerification(schedule1, PRODUCTION_SCHEDULE_CONFIG, {
        simulateFailure: true,
      });
      assert.ok(result2.pagingTriggered);
    });
  });

  // ============================================================================
  // Contract: verification_emits_status_events
  // ============================================================================

  describe('verification_emits_status_events', () => {
    it('should emit run_started event', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      const { events } = runScheduledVerification(schedule, PRODUCTION_SCHEDULE_CONFIG);

      const startEvent = events.find((e) => e.eventType === 'run_started');
      assert.ok(startEvent);
      assert.ok(startEvent.runId);
      assert.ok(startEvent.timestamp);
    });

    it('should emit run_completed event on success', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      const { events } = runScheduledVerification(schedule, PRODUCTION_SCHEDULE_CONFIG);

      const completeEvent = events.find((e) => e.eventType === 'run_completed');
      assert.ok(completeEvent);
      assert.ok(completeEvent.details.passed);
    });

    it('should emit run_failed event on failure', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      const { events } = runScheduledVerification(schedule, PRODUCTION_SCHEDULE_CONFIG, {
        simulateFailure: true,
      });

      const failEvent = events.find((e) => e.eventType === 'run_failed');
      assert.ok(failEvent);
      assert.ok(!failEvent.details.passed);
    });

    it('should emit paging_triggered event when threshold reached', () => {
      let schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);

      // First failure
      const { updatedSchedule: schedule1 } = runScheduledVerification(schedule, PRODUCTION_SCHEDULE_CONFIG, {
        simulateFailure: true,
      });

      // Second failure - triggers paging
      const { events } = runScheduledVerification(schedule1, PRODUCTION_SCHEDULE_CONFIG, {
        simulateFailure: true,
      });

      const pageEvent = events.find((e) => e.eventType === 'paging_triggered');
      assert.ok(pageEvent);
      assert.strictEqual(pageEvent.details.pagingPath, 'ops');
    });

    it('should include correlation details in events', () => {
      const schedule = createSchedule('production', PRODUCTION_SCHEDULE_CONFIG);
      const { result, events } = runScheduledVerification(schedule, PRODUCTION_SCHEDULE_CONFIG);

      for (const event of events) {
        assert.strictEqual(event.runId, result.runId);
        assert.strictEqual(event.environment, 'production');
      }
    });
  });
});

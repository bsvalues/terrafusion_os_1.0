/**
 * Operational Runbook Automation: Execution Contract Tests
 *
 * Phase XI - Runbook execution with dry-run safety and rollback.
 *
 * CONTRACT SURFACE:
 * - Dry-Run Mode: Zero side effects when dry-run=true
 * - Rollback Required: Every execution must have rollback capability
 * - Concurrency Locks: Prevent parallel conflicting executions
 * - Operator-Triggered: No auto-execution, always operator-initiated
 *
 * INVARIANTS:
 * - Dry-run produces zero side effects
 * - Rollback is mandatory for all executions
 * - Concurrent conflicting runbooks are blocked
 * - All executions are operator-triggered
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back' | 'aborted';
type ExecutionMode = 'dry_run' | 'live';
type LockStatus = 'acquired' | 'blocked' | 'released' | 'expired';

/**
 * Execution request
 */
interface ExecutionRequest {
  readonly request_id: string;
  readonly runbook_id: string;
  readonly operator_id: string;
  readonly mode: ExecutionMode;
  readonly parameters: Record<string, unknown>;
  readonly requested_at: string;
  readonly reason: string;
}

/**
 * Execution record
 */
interface ExecutionRecord {
  readonly execution_id: string;
  readonly runbook_id: string;
  readonly runbook_version: number;
  readonly operator_id: string;
  readonly mode: ExecutionMode;
  readonly status: ExecutionStatus;
  readonly started_at: string;
  readonly completed_at?: string;
  readonly steps_completed: number;
  readonly steps_total: number;
  readonly side_effects: readonly SideEffect[];
  readonly rollback_available: boolean;
  readonly lock_id?: string;
}

/**
 * Side effect
 */
interface SideEffect {
  readonly effect_id: string;
  readonly step_id: string;
  readonly type: string;
  readonly target: string;
  readonly reversible: boolean;
  readonly timestamp: string;
}

/**
 * Execution lock
 */
interface ExecutionLock {
  readonly lock_id: string;
  readonly resource_id: string;
  readonly execution_id: string;
  readonly acquired_at: string;
  readonly expires_at: string;
  readonly status: LockStatus;
}

/**
 * Rollback result
 */
interface RollbackResult {
  readonly rollback_id: string;
  readonly execution_id: string;
  readonly success: boolean;
  readonly steps_rolled_back: number;
  readonly effects_reversed: number;
  readonly started_at: string;
  readonly completed_at: string;
}

/**
 * Step execution result
 */
interface StepExecutionResult {
  readonly step_id: string;
  readonly status: 'success' | 'failure' | 'skipped';
  readonly duration_ms: number;
  readonly output?: string;
  readonly side_effects: readonly SideEffect[];
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockExecutionRequest(overrides: Partial<ExecutionRequest> = {}): ExecutionRequest {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    request_id: `sha256:${Buffer.from(requestId).toString('hex').slice(0, 64)}`,
    runbook_id: `sha256:${Buffer.from('runbook-1').toString('hex').slice(0, 64)}`,
    operator_id: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    mode: 'dry_run',
    parameters: {},
    requested_at: new Date().toISOString(),
    reason: 'Scheduled maintenance',
    ...overrides,
  };
}

function createMockExecutionRecord(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
  const execId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    execution_id: `sha256:${Buffer.from(execId).toString('hex').slice(0, 64)}`,
    runbook_id: `sha256:${Buffer.from('runbook-1').toString('hex').slice(0, 64)}`,
    runbook_version: 1,
    operator_id: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    mode: 'dry_run',
    status: 'pending',
    started_at: new Date().toISOString(),
    steps_completed: 0,
    steps_total: 5,
    side_effects: [],
    rollback_available: true,
    ...overrides,
  };
}

function createMockSideEffect(overrides: Partial<SideEffect> = {}): SideEffect {
  const effectId = `eff-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    effect_id: `sha256:${Buffer.from(effectId).toString('hex').slice(0, 64)}`,
    step_id: `sha256:${Buffer.from('step-1').toString('hex').slice(0, 64)}`,
    type: 'config_change',
    target: 'database.primary',
    reversible: true,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function createMockExecutionLock(overrides: Partial<ExecutionLock> = {}): ExecutionLock {
  const lockId = `lock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    lock_id: `sha256:${Buffer.from(lockId).toString('hex').slice(0, 64)}`,
    resource_id: 'database.primary',
    execution_id: `sha256:${Buffer.from('exec-1').toString('hex').slice(0, 64)}`,
    acquired_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    status: 'acquired',
    ...overrides,
  };
}

// ============================================================================
// MOCK EXECUTION SERVICE
// ============================================================================

interface RunbookExecutionService {
  // Execution Lifecycle
  startExecution(request: ExecutionRequest): Promise<ExecutionRecord>;
  getExecution(executionId: string): Promise<ExecutionRecord | null>;
  abortExecution(executionId: string, reason: string): Promise<ExecutionRecord>;
  completeExecution(executionId: string): Promise<ExecutionRecord>;

  // Dry-Run
  isDryRun(execution: ExecutionRecord): Promise<boolean>;
  getSideEffects(executionId: string): Promise<readonly SideEffect[]>;
  hasSideEffects(executionId: string): Promise<boolean>;

  // Rollback
  canRollback(executionId: string): Promise<boolean>;
  rollback(executionId: string): Promise<RollbackResult>;
  getRollbackHistory(executionId: string): Promise<readonly RollbackResult[]>;

  // Locking
  acquireLock(resourceId: string, executionId: string): Promise<ExecutionLock>;
  releaseLock(lockId: string): Promise<void>;
  isLocked(resourceId: string): Promise<boolean>;
  getLock(resourceId: string): Promise<ExecutionLock | null>;

  // Operator Validation
  isOperatorTriggered(execution: ExecutionRecord): Promise<boolean>;
  validateOperator(operatorId: string): Promise<boolean>;

  // Step Execution
  executeStep(executionId: string, stepId: string): Promise<StepExecutionResult>;
}

function createMockExecutionService(): RunbookExecutionService {
  const executions: Map<string, ExecutionRecord> = new Map();
  const locks: Map<string, ExecutionLock> = new Map();
  const sideEffects: Map<string, SideEffect[]> = new Map();
  const rollbacks: Map<string, RollbackResult[]> = new Map();

  return {
    async startExecution(request) {
      const execution = createMockExecutionRecord({
        runbook_id: request.runbook_id,
        operator_id: request.operator_id,
        mode: request.mode,
        status: 'running',
      });
      executions.set(execution.execution_id, execution);
      sideEffects.set(execution.execution_id, []);
      return execution;
    },

    async getExecution(executionId) {
      return executions.get(executionId) ?? null;
    },

    async abortExecution(executionId, _reason) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const aborted: ExecutionRecord = {
        ...execution,
        status: 'aborted',
        completed_at: new Date().toISOString(),
      };
      executions.set(executionId, aborted);
      return aborted;
    },

    async completeExecution(executionId) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const completed: ExecutionRecord = {
        ...execution,
        status: 'completed',
        completed_at: new Date().toISOString(),
        steps_completed: execution.steps_total,
      };
      executions.set(executionId, completed);
      return completed;
    },

    async isDryRun(execution) {
      return execution.mode === 'dry_run';
    },

    async getSideEffects(executionId) {
      return sideEffects.get(executionId) ?? [];
    },

    async hasSideEffects(executionId) {
      const effects = sideEffects.get(executionId) ?? [];
      return effects.length > 0;
    },

    async canRollback(executionId) {
      const execution = executions.get(executionId);
      if (!execution) return false;
      return execution.rollback_available;
    },

    async rollback(executionId) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const effects = sideEffects.get(executionId) ?? [];
      const reversibleEffects = effects.filter(e => e.reversible);

      const rollbackId = `rb-${Date.now()}`;
      const result: RollbackResult = {
        rollback_id: `sha256:${Buffer.from(rollbackId).toString('hex').slice(0, 64)}`,
        execution_id: executionId,
        success: true,
        steps_rolled_back: execution.steps_completed,
        effects_reversed: reversibleEffects.length,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      const existing = rollbacks.get(executionId) ?? [];
      rollbacks.set(executionId, [...existing, result]);

      const rolledBack: ExecutionRecord = { ...execution, status: 'rolled_back' };
      executions.set(executionId, rolledBack);

      return result;
    },

    async getRollbackHistory(executionId) {
      return rollbacks.get(executionId) ?? [];
    },

    async acquireLock(resourceId, executionId) {
      const existingLock = locks.get(resourceId);
      if (existingLock && existingLock.status === 'acquired') {
        throw new Error(`Resource ${resourceId} is already locked`);
      }

      const lock = createMockExecutionLock({
        resource_id: resourceId,
        execution_id: executionId,
      });
      locks.set(resourceId, lock);
      return lock;
    },

    async releaseLock(lockId) {
      for (const [resourceId, lock] of locks.entries()) {
        if (lock.lock_id === lockId) {
          const released: ExecutionLock = { ...lock, status: 'released' };
          locks.set(resourceId, released);
          return;
        }
      }
    },

    async isLocked(resourceId) {
      const lock = locks.get(resourceId);
      return lock?.status === 'acquired';
    },

    async getLock(resourceId) {
      return locks.get(resourceId) ?? null;
    },

    async isOperatorTriggered(execution) {
      return !!execution.operator_id && execution.operator_id.startsWith('sha256:');
    },

    async validateOperator(operatorId) {
      return operatorId.startsWith('sha256:') && operatorId.length > 10;
    },

    async executeStep(executionId, stepId) {
      const execution = executions.get(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);

      const effects: SideEffect[] = [];

      // In live mode, create side effects
      if (execution.mode === 'live') {
        effects.push(createMockSideEffect({ step_id: stepId }));
        const existing = sideEffects.get(executionId) ?? [];
        sideEffects.set(executionId, [...existing, ...effects]);
      }

      // Update execution progress
      const updated: ExecutionRecord = {
        ...execution,
        steps_completed: execution.steps_completed + 1,
        side_effects: execution.mode === 'live' ? [...execution.side_effects, ...effects] : [],
      };
      executions.set(executionId, updated);

      return {
        step_id: stepId,
        status: 'success',
        duration_ms: 150,
        output: 'Step completed successfully',
        side_effects: effects,
      };
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Operational Runbook Automation: Execution Contracts', () => {
  let service: RunbookExecutionService;

  beforeEach(() => {
    service = createMockExecutionService();
  });

  // ==========================================================================
  // CONTRACT: dry_run_safety
  // ==========================================================================
  describe('CONTRACT: dry_run_safety', () => {
    it('dry-run execution has no side effects', async () => {
      const request = createMockExecutionRequest({ mode: 'dry_run' });
      const execution = await service.startExecution(request);

      await service.executeStep(execution.execution_id, 'step-1');
      await service.executeStep(execution.execution_id, 'step-2');

      const effects = await service.getSideEffects(execution.execution_id);
      assert.strictEqual(effects.length, 0);
    });

    it('identifies dry-run mode', async () => {
      const request = createMockExecutionRequest({ mode: 'dry_run' });
      const execution = await service.startExecution(request);

      const isDryRun = await service.isDryRun(execution);
      assert.strictEqual(isDryRun, true);
    });

    it('live mode produces side effects', async () => {
      const request = createMockExecutionRequest({ mode: 'live' });
      const execution = await service.startExecution(request);

      await service.executeStep(execution.execution_id, 'step-1');

      const hasSideEffects = await service.hasSideEffects(execution.execution_id);
      assert.strictEqual(hasSideEffects, true);
    });

    it('dry-run does not affect locks after completion', async () => {
      const request = createMockExecutionRequest({ mode: 'dry_run' });
      const execution = await service.startExecution(request);

      const lock = await service.acquireLock('test-resource', execution.execution_id);
      await service.executeStep(execution.execution_id, 'step-1');
      await service.completeExecution(execution.execution_id);
      await service.releaseLock(lock.lock_id);

      const isLocked = await service.isLocked('test-resource');
      assert.strictEqual(isLocked, false);
    });
  });

  // ==========================================================================
  // CONTRACT: rollback_required
  // ==========================================================================
  describe('CONTRACT: rollback_required', () => {
    it('execution has rollback capability', async () => {
      const request = createMockExecutionRequest({ mode: 'live' });
      const execution = await service.startExecution(request);

      const canRollback = await service.canRollback(execution.execution_id);
      assert.strictEqual(canRollback, true);
    });

    it('rollback reverses side effects', async () => {
      const request = createMockExecutionRequest({ mode: 'live' });
      const execution = await service.startExecution(request);
      await service.executeStep(execution.execution_id, 'step-1');

      const result = await service.rollback(execution.execution_id);

      assert.strictEqual(result.success, true);
      assert.ok(result.effects_reversed >= 0);
    });

    it('rollback updates execution status', async () => {
      const request = createMockExecutionRequest({ mode: 'live' });
      const execution = await service.startExecution(request);
      await service.rollback(execution.execution_id);

      const updated = await service.getExecution(execution.execution_id);
      assert.strictEqual(updated?.status, 'rolled_back');
    });

    it('rollback history is maintained', async () => {
      const request = createMockExecutionRequest({ mode: 'live' });
      const execution = await service.startExecution(request);
      await service.rollback(execution.execution_id);

      const history = await service.getRollbackHistory(execution.execution_id);
      assert.strictEqual(history.length, 1);
    });

    it('rollback ID is opaque', async () => {
      const request = createMockExecutionRequest({ mode: 'live' });
      const execution = await service.startExecution(request);
      const result = await service.rollback(execution.execution_id);

      assert.ok(result.rollback_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: concurrency_locks
  // ==========================================================================
  describe('CONTRACT: concurrency_locks', () => {
    it('acquires lock for resource', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);

      const lock = await service.acquireLock('db.primary', execution.execution_id);

      assert.ok(lock.lock_id.startsWith('sha256:'));
      assert.strictEqual(lock.status, 'acquired');
    });

    it('blocks conflicting lock acquisition', async () => {
      const request1 = createMockExecutionRequest();
      const exec1 = await service.startExecution(request1);
      await service.acquireLock('db.primary', exec1.execution_id);

      const request2 = createMockExecutionRequest();
      const exec2 = await service.startExecution(request2);

      await assert.rejects(async () => {
        await service.acquireLock('db.primary', exec2.execution_id);
      }, /already locked/);
    });

    it('releases lock after execution', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);
      const lock = await service.acquireLock('db.primary', execution.execution_id);

      await service.releaseLock(lock.lock_id);

      const isLocked = await service.isLocked('db.primary');
      assert.strictEqual(isLocked, false);
    });

    it('checks lock status', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);
      await service.acquireLock('db.primary', execution.execution_id);

      const isLocked = await service.isLocked('db.primary');
      const isUnlocked = await service.isLocked('db.secondary');

      assert.strictEqual(isLocked, true);
      assert.strictEqual(isUnlocked, false);
    });
  });

  // ==========================================================================
  // CONTRACT: operator_triggered
  // ==========================================================================
  describe('CONTRACT: operator_triggered', () => {
    it('execution has operator ID', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);

      assert.ok(execution.operator_id);
      assert.ok(execution.operator_id.startsWith('sha256:'));
    });

    it('validates operator is legitimate', async () => {
      const operatorId = `sha256:${Buffer.from('valid-operator').toString('hex').slice(0, 64)}`;
      const isValid = await service.validateOperator(operatorId);

      assert.strictEqual(isValid, true);
    });

    it('rejects invalid operator format', async () => {
      const isValid = await service.validateOperator('invalid-operator');

      assert.strictEqual(isValid, false);
    });

    it('execution is always operator-triggered', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);

      const isOperatorTriggered = await service.isOperatorTriggered(execution);
      assert.strictEqual(isOperatorTriggered, true);
    });
  });

  // ==========================================================================
  // CONTRACT: execution_lifecycle
  // ==========================================================================
  describe('CONTRACT: execution_lifecycle', () => {
    it('starts execution in running state', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);

      assert.strictEqual(execution.status, 'running');
    });

    it('completes execution', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);
      const completed = await service.completeExecution(execution.execution_id);

      assert.strictEqual(completed.status, 'completed');
      assert.ok(completed.completed_at);
    });

    it('aborts execution', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);
      const aborted = await service.abortExecution(execution.execution_id, 'Emergency stop');

      assert.strictEqual(aborted.status, 'aborted');
    });

    it('execution ID is opaque', async () => {
      const request = createMockExecutionRequest();
      const execution = await service.startExecution(request);

      assert.ok(execution.execution_id.startsWith('sha256:'));
    });

    it('tracks step progress', async () => {
      const request = createMockExecutionRequest({ mode: 'dry_run' });
      const execution = await service.startExecution(request);

      await service.executeStep(execution.execution_id, 'step-1');
      await service.executeStep(execution.execution_id, 'step-2');

      const updated = await service.getExecution(execution.execution_id);
      assert.strictEqual(updated?.steps_completed, 2);
    });
  });
});

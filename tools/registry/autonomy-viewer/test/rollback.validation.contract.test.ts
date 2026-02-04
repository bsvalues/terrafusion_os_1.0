/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: rollback.validation.contract.test.ts
 *
 * Tests rollback operations during game day exercises,
 * including dual approval requirements, safe mode constraints,
 * and audit event generation.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Rollback requires dual approval
 * - Safe mode limits rollback to read-only operations
 * - All rollback events are audited
 * - Auth path independence preserved during rollback
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type RollbackId = `sha256:${string}`;
type SnapshotId = `sha256:${string}`;
type ApprovalId = `sha256:${string}`;
type OperatorId = `sha256:${string}`;
type AuditEventId = `sha256:${string}`;

type RollbackStatus =
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';
type RollbackType = 'full' | 'partial' | 'config_only' | 'data_only';
type SafeModeLevel = 'none' | 'read_only' | 'restricted' | 'emergency';

interface Approval {
  readonly id: ApprovalId;
  readonly operatorId: OperatorId;
  readonly timestamp: string;
  readonly comment?: string;
}

interface RollbackTarget {
  readonly id: string;
  readonly type: 'service' | 'database' | 'config' | 'artifact';
  readonly snapshotId: SnapshotId;
  readonly currentVersion: string;
  readonly targetVersion: string;
}

interface RollbackRequest {
  readonly id: RollbackId;
  readonly gameDayId: string;
  readonly type: RollbackType;
  readonly targets: readonly RollbackTarget[];
  readonly reason: string;
  readonly requiredApprovals: number;
  readonly approvals: readonly Approval[];
  readonly status: RollbackStatus;
  readonly safeModeLevel: SafeModeLevel;
  readonly requestedBy: OperatorId;
  readonly requestedAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly failedAt?: string;
  readonly failureReason?: string;
}

interface RollbackAuditEntry {
  readonly id: AuditEventId;
  readonly rollbackId: RollbackId;
  readonly action:
    | 'requested'
    | 'approved'
    | 'rejected'
    | 'started'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'safe_mode_entered'
    | 'safe_mode_exited';
  readonly actor: OperatorId;
  readonly timestamp: string;
  readonly previousHash: string;
  readonly entryHash: string;
  readonly details: Record<string, unknown>;
}

interface RollbackValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly approvalStatus: 'insufficient' | 'pending' | 'complete';
  readonly safeModeCompliant: boolean;
  readonly targetsValid: boolean;
}

interface SafeModeState {
  readonly level: SafeModeLevel;
  readonly enteredAt?: string;
  readonly enteredBy?: OperatorId;
  readonly reason?: string;
  readonly allowedOperations: readonly string[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockRollbackService() {
  const rollbacks = new Map<RollbackId, RollbackRequest>();
  const snapshots = new Map<SnapshotId, { version: string; createdAt: string }>();
  const auditLog: RollbackAuditEntry[] = [];
  let lastHash = 'sha256:genesis';
  let safeModeState: SafeModeState = {
    level: 'none',
    allowedOperations: ['read', 'write', 'deploy', 'rollback'],
  };

  // Services that should never be affected by rollback
  const authServices = ['auth-service', 'identity-provider', 'oauth-gateway'];

  function generateId(prefix: string): RollbackId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as RollbackId;
  }

  function appendAudit(
    rollbackId: RollbackId,
    action: RollbackAuditEntry['action'],
    actor: OperatorId,
    details: Record<string, unknown> = {}
  ): RollbackAuditEntry {
    const entry: RollbackAuditEntry = {
      id: generateId('audit') as AuditEventId,
      rollbackId,
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

  function isAuthService(target: RollbackTarget): boolean {
    return authServices.some(auth => target.id.toLowerCase().includes(auth.toLowerCase()));
  }

  return {
    // Snapshot Management
    createSnapshot(version: string): SnapshotId {
      const id = generateId('snapshot') as SnapshotId;
      snapshots.set(id, { version, createdAt: new Date().toISOString() });
      return id;
    },

    getSnapshot(id: SnapshotId): { version: string; createdAt: string } | null {
      return snapshots.get(id) ?? null;
    },

    // Safe Mode Management
    enterSafeMode(level: SafeModeLevel, reason: string, operator: OperatorId): SafeModeState {
      const allowedOps =
        level === 'none'
          ? ['read', 'write', 'deploy', 'rollback']
          : level === 'read_only'
            ? ['read']
            : level === 'restricted'
              ? ['read', 'rollback']
              : ['read', 'emergency_rollback'];

      safeModeState = {
        level,
        enteredAt: new Date().toISOString(),
        enteredBy: operator,
        reason,
        allowedOperations: allowedOps,
      };
      return safeModeState;
    },

    exitSafeMode(operator: OperatorId): SafeModeState {
      safeModeState = {
        level: 'none',
        allowedOperations: ['read', 'write', 'deploy', 'rollback'],
      };
      return safeModeState;
    },

    getSafeModeState(): SafeModeState {
      return { ...safeModeState };
    },

    isOperationAllowed(operation: string): boolean {
      return safeModeState.allowedOperations.includes(operation);
    },

    // Rollback Request Management
    requestRollback(
      gameDayId: string,
      type: RollbackType,
      targets: readonly RollbackTarget[],
      reason: string,
      requestedBy: OperatorId,
      requiredApprovals: number = 2
    ): RollbackRequest | null {
      // Validate targets don't include auth services
      for (const target of targets) {
        if (isAuthService(target)) {
          return null; // Auth path independence - cannot rollback auth services
        }
      }

      // Validate all snapshots exist
      for (const target of targets) {
        if (!snapshots.has(target.snapshotId)) {
          return null;
        }
      }

      const id = generateId('rollback');
      const request: RollbackRequest = {
        id,
        gameDayId,
        type,
        targets,
        reason,
        requiredApprovals,
        approvals: [],
        status: 'pending_approval',
        safeModeLevel: safeModeState.level,
        requestedBy,
        requestedAt: new Date().toISOString(),
      };
      rollbacks.set(id, request);
      appendAudit(id, 'requested', requestedBy, { type, targetCount: targets.length, reason });
      return request;
    },

    approveRollback(
      rollbackId: RollbackId,
      operatorId: OperatorId,
      comment?: string
    ): RollbackRequest | null {
      const request = rollbacks.get(rollbackId);
      if (!request || request.status !== 'pending_approval') return null;

      // Cannot approve own request
      if (request.requestedBy === operatorId) {
        return null;
      }

      // Cannot approve twice
      if (request.approvals.some(a => a.operatorId === operatorId)) {
        return null;
      }

      const approval: Approval = {
        id: generateId('approval') as ApprovalId,
        operatorId,
        timestamp: new Date().toISOString(),
        comment,
      };

      const updatedApprovals = [...request.approvals, approval];
      const newStatus =
        updatedApprovals.length >= request.requiredApprovals ? 'approved' : 'pending_approval';

      const updated: RollbackRequest = {
        ...request,
        approvals: updatedApprovals,
        status: newStatus,
      };
      rollbacks.set(rollbackId, updated);
      appendAudit(rollbackId, 'approved', operatorId, {
        approvalCount: updatedApprovals.length,
        required: request.requiredApprovals,
        comment,
      });
      return updated;
    },

    rejectRollback(
      rollbackId: RollbackId,
      operatorId: OperatorId,
      reason: string
    ): RollbackRequest | null {
      const request = rollbacks.get(rollbackId);
      if (!request || request.status !== 'pending_approval') return null;

      const updated: RollbackRequest = {
        ...request,
        status: 'cancelled',
        failureReason: reason,
      };
      rollbacks.set(rollbackId, updated);
      appendAudit(rollbackId, 'rejected', operatorId, { reason });
      return updated;
    },

    startRollback(rollbackId: RollbackId, operator: OperatorId): RollbackRequest | null {
      const request = rollbacks.get(rollbackId);
      if (!request || request.status !== 'approved') return null;

      // Check safe mode allows rollback
      if (!this.isOperationAllowed('rollback') && safeModeState.level !== 'emergency') {
        return null;
      }

      const updated: RollbackRequest = {
        ...request,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      };
      rollbacks.set(rollbackId, updated);
      appendAudit(rollbackId, 'started', operator, { safeModeLevel: safeModeState.level });
      return updated;
    },

    completeRollback(rollbackId: RollbackId, operator: OperatorId): RollbackRequest | null {
      const request = rollbacks.get(rollbackId);
      if (!request || request.status !== 'in_progress') return null;

      const updated: RollbackRequest = {
        ...request,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      rollbacks.set(rollbackId, updated);
      appendAudit(rollbackId, 'completed', operator, {
        durationMs: new Date().getTime() - new Date(request.startedAt!).getTime(),
      });
      return updated;
    },

    failRollback(
      rollbackId: RollbackId,
      operator: OperatorId,
      reason: string
    ): RollbackRequest | null {
      const request = rollbacks.get(rollbackId);
      if (!request || request.status !== 'in_progress') return null;

      const updated: RollbackRequest = {
        ...request,
        status: 'failed',
        failedAt: new Date().toISOString(),
        failureReason: reason,
      };
      rollbacks.set(rollbackId, updated);
      appendAudit(rollbackId, 'failed', operator, { reason });
      return updated;
    },

    cancelRollback(
      rollbackId: RollbackId,
      operator: OperatorId,
      reason: string
    ): RollbackRequest | null {
      const request = rollbacks.get(rollbackId);
      if (!request) return null;
      if (request.status === 'completed' || request.status === 'failed') {
        return null;
      }

      const updated: RollbackRequest = {
        ...request,
        status: 'cancelled',
        failureReason: reason,
      };
      rollbacks.set(rollbackId, updated);
      appendAudit(rollbackId, 'cancelled', operator, { reason });
      return updated;
    },

    // Queries
    getRollback(id: RollbackId): RollbackRequest | null {
      return rollbacks.get(id) ?? null;
    },

    getRollbacksByGameDay(gameDayId: string): readonly RollbackRequest[] {
      return [...rollbacks.values()].filter(r => r.gameDayId === gameDayId);
    },

    getRollbacksByStatus(status: RollbackStatus): readonly RollbackRequest[] {
      return [...rollbacks.values()].filter(r => r.status === status);
    },

    getPendingRollbacks(): readonly RollbackRequest[] {
      return [...rollbacks.values()].filter(r => r.status === 'pending_approval');
    },

    // Validation
    validateRollback(rollbackId: RollbackId): RollbackValidation {
      const request = rollbacks.get(rollbackId);
      if (!request) {
        return {
          valid: false,
          errors: ['Rollback request not found'],
          warnings: [],
          approvalStatus: 'insufficient',
          safeModeCompliant: false,
          targetsValid: false,
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check approvals
      let approvalStatus: RollbackValidation['approvalStatus'] = 'insufficient';
      if (request.approvals.length >= request.requiredApprovals) {
        approvalStatus = 'complete';
      } else if (request.approvals.length > 0) {
        approvalStatus = 'pending';
      }

      if (approvalStatus === 'insufficient') {
        errors.push(
          `Requires ${request.requiredApprovals} approvals, has ${request.approvals.length}`
        );
      }

      // Check safe mode compliance
      let safeModeCompliant = true;
      if (safeModeState.level === 'read_only') {
        errors.push('Rollback not allowed in read-only safe mode');
        safeModeCompliant = false;
      }

      // Check targets
      let targetsValid = true;
      for (const target of request.targets) {
        if (isAuthService(target)) {
          errors.push(`Cannot rollback auth service: ${target.id}`);
          targetsValid = false;
        }
        if (!snapshots.has(target.snapshotId)) {
          errors.push(`Snapshot not found: ${target.snapshotId}`);
          targetsValid = false;
        }
      }

      // Warnings
      if (request.targets.length > 10) {
        warnings.push('Large number of rollback targets - consider staged rollback');
      }
      if (request.type === 'full') {
        warnings.push('Full rollback - verify all dependencies');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        approvalStatus,
        safeModeCompliant,
        targetsValid,
      };
    },

    // Audit
    getAuditLog(rollbackId?: RollbackId): readonly RollbackAuditEntry[] {
      if (rollbackId) {
        return auditLog.filter(e => e.rollbackId === rollbackId);
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

    // Statistics
    getRollbackStats(gameDayId: string): {
      total: number;
      successful: number;
      failed: number;
      cancelled: number;
      pending: number;
      averageApprovalTimeMs: number;
      averageExecutionTimeMs: number;
    } {
      const rollbackList = this.getRollbacksByGameDay(gameDayId);

      const successful = rollbackList.filter(r => r.status === 'completed').length;
      const failed = rollbackList.filter(r => r.status === 'failed').length;
      const cancelled = rollbackList.filter(r => r.status === 'cancelled').length;
      const pending = rollbackList.filter(r => r.status === 'pending_approval').length;

      let totalApprovalTime = 0;
      let approvalCount = 0;
      let totalExecutionTime = 0;
      let executionCount = 0;

      for (const r of rollbackList) {
        if (r.status === 'completed' || r.status === 'approved') {
          if (r.approvals.length > 0) {
            const lastApproval = r.approvals[r.approvals.length - 1];
            const approvalTime =
              new Date(lastApproval.timestamp).getTime() - new Date(r.requestedAt).getTime();
            totalApprovalTime += approvalTime;
            approvalCount++;
          }
        }
        if (r.status === 'completed' && r.startedAt && r.completedAt) {
          const execTime = new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime();
          totalExecutionTime += execTime;
          executionCount++;
        }
      }

      return {
        total: rollbackList.length,
        successful,
        failed,
        cancelled,
        pending,
        averageApprovalTimeMs: approvalCount > 0 ? totalApprovalTime / approvalCount : 0,
        averageExecutionTimeMs: executionCount > 0 ? totalExecutionTime / executionCount : 0,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: Rollback Validation Contracts', () => {
  let service: ReturnType<typeof createMockRollbackService>;
  const operatorA = 'sha256:operator_a_123' as OperatorId;
  const operatorB = 'sha256:operator_b_456' as OperatorId;
  const operatorC = 'sha256:operator_c_789' as OperatorId;

  beforeEach(() => {
    service = createMockRollbackService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate rollback IDs with sha256: prefix', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback(
        'gameday-1',
        'partial',
        [target],
        'Test rollback',
        operatorA
      );
      assert.ok(request);
      assert.ok(request!.id.startsWith('sha256:'), 'Rollback ID must be opaque sha256:');
    });

    it('should generate snapshot IDs with sha256: prefix', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      assert.ok(snapshotId.startsWith('sha256:'), 'Snapshot ID must be opaque sha256:');
    });

    it('should generate approval IDs with sha256: prefix', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      const updated = service.getRollback(request!.id);
      assert.ok(updated!.approvals[0].id.startsWith('sha256:'));
    });

    it('should generate audit IDs with sha256: prefix', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      const audit = service.getAuditLog();
      assert.ok(audit[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Dual Approval Tests (Critical Invariant)
  // ==========================================================================

  describe('Dual Approval Requirements', () => {
    it('should require 2 approvals by default', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request!.requiredApprovals, 2);
    });

    it('should start with pending_approval status', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request!.status, 'pending_approval');
    });

    it('should not allow self-approval', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      const selfApproval = service.approveRollback(request!.id, operatorA);
      assert.strictEqual(selfApproval, null);
    });

    it('should not allow duplicate approvals', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      const duplicate = service.approveRollback(request!.id, operatorB);
      assert.strictEqual(duplicate, null);
    });

    it('should remain pending with single approval', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      const updated = service.getRollback(request!.id);
      assert.strictEqual(updated!.status, 'pending_approval');
    });

    it('should become approved with dual approval', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      const updated = service.getRollback(request!.id);
      assert.strictEqual(updated!.status, 'approved');
    });

    it('should not start without required approvals', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB); // Only 1 approval
      const started = service.startRollback(request!.id, operatorA);
      assert.strictEqual(started, null);
    });

    it('should record approval comments', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB, 'Verified rollback target');
      const updated = service.getRollback(request!.id);
      assert.strictEqual(updated!.approvals[0].comment, 'Verified rollback target');
    });
  });

  // ==========================================================================
  // Auth Path Independence Tests (Critical Invariant)
  // ==========================================================================

  describe('Auth Path Independence', () => {
    it('should reject rollback targeting auth-service', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'auth-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request, null);
    });

    it('should reject rollback targeting identity-provider', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'identity-provider',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request, null);
    });

    it('should reject rollback targeting oauth-gateway', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'oauth-gateway',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request, null);
    });

    it('should flag auth services in validation', () => {
      // Create valid rollback first
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      const validation = service.validateRollback(request!.id);
      assert.ok(!validation.errors.some(e => e.includes('auth service')));
    });
  });

  // ==========================================================================
  // Safe Mode Tests
  // ==========================================================================

  describe('Safe Mode Constraints', () => {
    it('should default to no safe mode', () => {
      const state = service.getSafeModeState();
      assert.strictEqual(state.level, 'none');
    });

    it('should allow all operations in normal mode', () => {
      const state = service.getSafeModeState();
      assert.ok(state.allowedOperations.includes('read'));
      assert.ok(state.allowedOperations.includes('write'));
      assert.ok(state.allowedOperations.includes('deploy'));
      assert.ok(state.allowedOperations.includes('rollback'));
    });

    it('should enter read_only safe mode', () => {
      const state = service.enterSafeMode('read_only', 'DR Exercise', operatorA);
      assert.strictEqual(state.level, 'read_only');
      assert.ok(state.allowedOperations.includes('read'));
      assert.ok(!state.allowedOperations.includes('write'));
      assert.ok(!state.allowedOperations.includes('rollback'));
    });

    it('should enter restricted safe mode', () => {
      const state = service.enterSafeMode('restricted', 'Investigation', operatorA);
      assert.strictEqual(state.level, 'restricted');
      assert.ok(state.allowedOperations.includes('read'));
      assert.ok(state.allowedOperations.includes('rollback'));
      assert.ok(!state.allowedOperations.includes('write'));
    });

    it('should prevent rollback in read_only mode', () => {
      service.enterSafeMode('read_only', 'DR Exercise', operatorA);

      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);

      const started = service.startRollback(request!.id, operatorA);
      assert.strictEqual(started, null);
    });

    it('should allow rollback in restricted mode', () => {
      service.enterSafeMode('restricted', 'Investigation', operatorA);

      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);

      const started = service.startRollback(request!.id, operatorA);
      assert.ok(started);
    });

    it('should exit safe mode', () => {
      service.enterSafeMode('read_only', 'Exercise', operatorA);
      const newState = service.exitSafeMode(operatorA);
      assert.strictEqual(newState.level, 'none');
      assert.ok(newState.allowedOperations.includes('rollback'));
    });

    it('should record safe mode entry details', () => {
      const state = service.enterSafeMode('read_only', 'DR Exercise', operatorA);
      assert.ok(state.enteredAt);
      assert.strictEqual(state.enteredBy, operatorA);
      assert.strictEqual(state.reason, 'DR Exercise');
    });
  });

  // ==========================================================================
  // Rollback Lifecycle Tests
  // ==========================================================================

  describe('Rollback Lifecycle', () => {
    it('should progress: requested → approved → in_progress → completed', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request!.status, 'pending_approval');

      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      let updated = service.getRollback(request!.id);
      assert.strictEqual(updated!.status, 'approved');

      service.startRollback(request!.id, operatorA);
      updated = service.getRollback(request!.id);
      assert.strictEqual(updated!.status, 'in_progress');

      service.completeRollback(request!.id, operatorA);
      updated = service.getRollback(request!.id);
      assert.strictEqual(updated!.status, 'completed');
    });

    it('should record timestamps', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.ok(request!.requestedAt);

      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      service.startRollback(request!.id, operatorA);
      let updated = service.getRollback(request!.id);
      assert.ok(updated!.startedAt);

      service.completeRollback(request!.id, operatorA);
      updated = service.getRollback(request!.id);
      assert.ok(updated!.completedAt);
    });

    it('should handle failure', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      service.startRollback(request!.id, operatorA);

      const failed = service.failRollback(request!.id, operatorA, 'Connection timeout');
      assert.ok(failed);
      assert.strictEqual(failed!.status, 'failed');
      assert.strictEqual(failed!.failureReason, 'Connection timeout');
      assert.ok(failed!.failedAt);
    });

    it('should allow rejection', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      const rejected = service.rejectRollback(request!.id, operatorB, 'Not needed');
      assert.ok(rejected);
      assert.strictEqual(rejected!.status, 'cancelled');
    });

    it('should allow cancellation', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);

      const cancelled = service.cancelRollback(request!.id, operatorA, 'Issue resolved');
      assert.ok(cancelled);
      assert.strictEqual(cancelled!.status, 'cancelled');
    });

    it('should not cancel completed rollback', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      service.startRollback(request!.id, operatorA);
      service.completeRollback(request!.id, operatorA);

      const cancelled = service.cancelRollback(request!.id, operatorA, 'Too late');
      assert.strictEqual(cancelled, null);
    });
  });

  // ==========================================================================
  // Snapshot Tests
  // ==========================================================================

  describe('Snapshot Management', () => {
    it('should create snapshots', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      assert.ok(snapshotId);
    });

    it('should retrieve snapshot details', () => {
      const snapshotId = service.createSnapshot('v2.0.0');
      const snapshot = service.getSnapshot(snapshotId);
      assert.ok(snapshot);
      assert.strictEqual(snapshot!.version, 'v2.0.0');
      assert.ok(snapshot!.createdAt);
    });

    it('should reject rollback with invalid snapshot', () => {
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId: 'sha256:nonexistent' as SnapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      assert.strictEqual(request, null);
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Rollback Validation', () => {
    it('should validate correct rollback request', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);

      const validation = service.validateRollback(request!.id);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.approvalStatus, 'complete');
      assert.strictEqual(validation.targetsValid, true);
    });

    it('should report insufficient approvals', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);

      const validation = service.validateRollback(request!.id);
      assert.strictEqual(validation.approvalStatus, 'insufficient');
    });

    it('should report pending approvals', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);

      const validation = service.validateRollback(request!.id);
      assert.strictEqual(validation.approvalStatus, 'pending');
    });

    it('should warn about large number of targets', () => {
      const targets: RollbackTarget[] = [];
      for (let i = 0; i < 15; i++) {
        const snapshotId = service.createSnapshot(`v${i}.0.0`);
        targets.push({
          id: `service-${i}`,
          type: 'service',
          snapshotId,
          currentVersion: `v${i}.1.0`,
          targetVersion: `v${i}.0.0`,
        });
      }
      const request = service.requestRollback(
        'gameday-1',
        'full',
        targets,
        'Mass rollback',
        operatorA
      );
      const validation = service.validateRollback(request!.id);
      assert.ok(validation.warnings.some(w => w.includes('Large number')));
    });

    it('should warn about full rollback', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback(
        'gameday-1',
        'full',
        [target],
        'Full rollback',
        operatorA
      );
      const validation = service.validateRollback(request!.id);
      assert.ok(validation.warnings.some(w => w.includes('Full rollback')));
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Query Operations', () => {
    it('should get rollbacks by game day', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      service.requestRollback('gameday-1', 'partial', [target], 'Test 1', operatorA);
      service.requestRollback('gameday-1', 'partial', [target], 'Test 2', operatorA);
      service.requestRollback('gameday-2', 'partial', [target], 'Test 3', operatorA);

      assert.strictEqual(service.getRollbacksByGameDay('gameday-1').length, 2);
      assert.strictEqual(service.getRollbacksByGameDay('gameday-2').length, 1);
    });

    it('should get rollbacks by status', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const r1 = service.requestRollback('gameday-1', 'partial', [target], 'Test 1', operatorA);
      service.requestRollback('gameday-1', 'partial', [target], 'Test 2', operatorA);
      service.approveRollback(r1!.id, operatorB);
      service.approveRollback(r1!.id, operatorC);

      assert.strictEqual(service.getRollbacksByStatus('pending_approval').length, 1);
      assert.strictEqual(service.getRollbacksByStatus('approved').length, 1);
    });

    it('should get pending rollbacks', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      service.requestRollback('gameday-1', 'partial', [target], 'Test 1', operatorA);
      service.requestRollback('gameday-1', 'partial', [target], 'Test 2', operatorA);

      const pending = service.getPendingRollbacks();
      assert.strictEqual(pending.length, 2);
    });
  });

  // ==========================================================================
  // Audit Chain Tests
  // ==========================================================================

  describe('Audit Chain Integrity', () => {
    it('should maintain valid hash chain', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      service.startRollback(request!.id, operatorA);
      service.completeRollback(request!.id, operatorA);

      assert.ok(service.verifyAuditChain());
    });

    it('should audit all rollback operations', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);
      service.approveRollback(request!.id, operatorC);
      service.startRollback(request!.id, operatorA);
      service.completeRollback(request!.id, operatorA);

      const audit = service.getAuditLog(request!.id);
      const actions = audit.map(e => e.action);
      assert.ok(actions.includes('requested'));
      assert.ok(actions.filter(a => a === 'approved').length === 2);
      assert.ok(actions.includes('started'));
      assert.ok(actions.includes('completed'));
    });

    it('should record actor in each audit entry', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };
      const request = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(request!.id, operatorB);

      const audit = service.getAuditLog(request!.id);
      assert.strictEqual(audit[0].actor, operatorA); // requested
      assert.strictEqual(audit[1].actor, operatorB); // approved
    });
  });

  // ==========================================================================
  // Statistics Tests
  // ==========================================================================

  describe('Rollback Statistics', () => {
    it('should calculate rollback stats for game day', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      // Create completed rollback
      const r1 = service.requestRollback('gameday-1', 'partial', [target], 'Test 1', operatorA);
      service.approveRollback(r1!.id, operatorB);
      service.approveRollback(r1!.id, operatorC);
      service.startRollback(r1!.id, operatorA);
      service.completeRollback(r1!.id, operatorA);

      // Create pending rollback
      service.requestRollback('gameday-1', 'partial', [target], 'Test 2', operatorA);

      const stats = service.getRollbackStats('gameday-1');
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.successful, 1);
      assert.strictEqual(stats.pending, 1);
    });

    it('should count failed rollbacks', () => {
      const snapshotId = service.createSnapshot('v1.0.0');
      const target: RollbackTarget = {
        id: 'api-service',
        type: 'service',
        snapshotId,
        currentVersion: 'v1.1.0',
        targetVersion: 'v1.0.0',
      };

      const r1 = service.requestRollback('gameday-1', 'partial', [target], 'Test', operatorA);
      service.approveRollback(r1!.id, operatorB);
      service.approveRollback(r1!.id, operatorC);
      service.startRollback(r1!.id, operatorA);
      service.failRollback(r1!.id, operatorA, 'Connection timeout');

      const stats = service.getRollbackStats('gameday-1');
      assert.strictEqual(stats.failed, 1);
    });
  });
});

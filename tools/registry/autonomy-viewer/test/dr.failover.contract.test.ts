/**
 * Phase XVII — Federation Resilience & DR: Failover Contract Tests
 * =================================================================
 *
 * TDD-first tests for region failover:
 *   - Canary failover detection and promotion
 *   - Safe mode activation during outages
 *   - Promotion and rollback controls
 *   - Auth path independence
 *
 * CONTRACT SURFACE:
 * - Failover Detection: Health checks and canary triggers
 * - Safe Mode: Read-only governance plane during outages
 * - Promotion: Controlled replica promotion to primary
 * - Rollback: Revert to previous primary when restored
 * - Auth Independence: Auth path remains operational during DR
 *
 * INVARIANTS:
 * - All IDs are opaque sha256:
 * - Safe mode is read-only (no mutations)
 * - Auth path independence is critical (never blocked by DR)
 * - Rollback requires dual approval
 * - All failover events are audited
 *
 * @module dr.failover.contract.test
 * @version 17.1
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ReplicaRegion = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'gov-cloud-east';
type FailoverState = 'normal' | 'degraded' | 'failover-pending' | 'failover-active' | 'recovery';
type SafeModeLevel = 'none' | 'read-only' | 'emergency-only' | 'full-lockdown';
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unreachable';
type FailoverTrigger = 'manual' | 'canary' | 'health-check' | 'scheduled-drill';

/**
 * Region health check result
 */
interface RegionHealth {
  readonly region: ReplicaRegion;
  readonly status: HealthStatus;
  readonly latency_ms: number;
  readonly last_check: string;
  readonly consecutive_failures: number;
  readonly services_healthy: number;
  readonly services_total: number;
}

/**
 * Failover event record
 */
interface FailoverEvent {
  readonly event_id: string; // sha256:
  readonly trigger: FailoverTrigger;
  readonly from_region: ReplicaRegion;
  readonly to_region: ReplicaRegion;
  readonly initiated_by: string; // sha256: operator ID
  readonly initiated_at: string;
  readonly completed_at?: string;
  readonly state: FailoverState;
  readonly safe_mode_level: SafeModeLevel;
  readonly approved_by?: readonly string[]; // sha256: approver IDs
}

/**
 * Safe mode configuration
 */
interface SafeModeConfig {
  readonly config_id: string;
  readonly level: SafeModeLevel;
  readonly allowed_operations: readonly string[];
  readonly blocked_operations: readonly string[];
  readonly auto_activate_on: readonly FailoverTrigger[];
  readonly require_approval_to_exit: boolean;
}

/**
 * Canary check configuration
 */
interface CanaryConfig {
  readonly canary_id: string;
  readonly check_interval_seconds: number;
  readonly failure_threshold: number;
  readonly recovery_threshold: number;
  readonly endpoints: readonly string[];
}

/**
 * Promotion request
 */
interface PromotionRequest {
  readonly request_id: string; // sha256:
  readonly target_region: ReplicaRegion;
  readonly reason: string;
  readonly requested_by: string; // sha256:
  readonly requested_at: string;
  readonly approvals: readonly { approver_id: string; approved_at: string }[];
  readonly status: 'pending' | 'approved' | 'rejected' | 'executed';
}

/**
 * Rollback request
 */
interface RollbackRequest {
  readonly request_id: string; // sha256:
  readonly from_region: ReplicaRegion;
  readonly to_region: ReplicaRegion;
  readonly reason: string;
  readonly requested_by: string; // sha256:
  readonly requested_at: string;
  readonly approvals: readonly { approver_id: string; approved_at: string }[];
  readonly requires_dual_approval: boolean;
  readonly status: 'pending' | 'approved' | 'rejected' | 'executed';
}

/**
 * Auth path status (independent of governance plane)
 */
interface AuthPathStatus {
  readonly operational: boolean;
  readonly region: ReplicaRegion;
  readonly last_auth_at: string;
  readonly auth_latency_ms: number;
  readonly independent_of_governance: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockRegionHealth(overrides: Partial<RegionHealth> = {}): RegionHealth {
  return {
    region: 'us-east-1',
    status: 'healthy',
    latency_ms: 50,
    last_check: new Date().toISOString(),
    consecutive_failures: 0,
    services_healthy: 10,
    services_total: 10,
    ...overrides,
  };
}

function createMockFailoverEvent(overrides: Partial<FailoverEvent> = {}): FailoverEvent {
  const eventId = `failover-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    event_id: `sha256:${Buffer.from(eventId).toString('hex').slice(0, 64)}`,
    trigger: 'health-check',
    from_region: 'us-east-1',
    to_region: 'us-west-2',
    initiated_by: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    initiated_at: new Date().toISOString(),
    state: 'failover-pending',
    safe_mode_level: 'read-only',
    ...overrides,
  };
}

function createMockSafeModeConfig(overrides: Partial<SafeModeConfig> = {}): SafeModeConfig {
  const configId = `safemode-${Date.now()}`;
  return {
    config_id: `sha256:${Buffer.from(configId).toString('hex').slice(0, 64)}`,
    level: 'read-only',
    allowed_operations: ['read', 'list', 'health-check', 'audit-query'],
    blocked_operations: ['create', 'update', 'delete', 'promote', 'revoke'],
    auto_activate_on: ['canary', 'health-check'],
    require_approval_to_exit: true,
    ...overrides,
  };
}

function createMockPromotionRequest(overrides: Partial<PromotionRequest> = {}): PromotionRequest {
  const requestId = `promo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    request_id: `sha256:${Buffer.from(requestId).toString('hex').slice(0, 64)}`,
    target_region: 'us-west-2',
    reason: 'Primary region failure',
    requested_by: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    requested_at: new Date().toISOString(),
    approvals: [],
    status: 'pending',
    ...overrides,
  };
}

function createMockRollbackRequest(overrides: Partial<RollbackRequest> = {}): RollbackRequest {
  const requestId = `rollback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    request_id: `sha256:${Buffer.from(requestId).toString('hex').slice(0, 64)}`,
    from_region: 'us-west-2',
    to_region: 'us-east-1',
    reason: 'Primary region restored',
    requested_by: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    requested_at: new Date().toISOString(),
    approvals: [],
    requires_dual_approval: true,
    status: 'pending',
    ...overrides,
  };
}

// ============================================================================
// MOCK FAILOVER SERVICE
// ============================================================================

interface FailoverService {
  // Health Monitoring
  checkRegionHealth(region: ReplicaRegion): Promise<RegionHealth>;
  getHealthHistory(region: ReplicaRegion, minutes: number): Promise<readonly RegionHealth[]>;
  setRegionStatus(region: ReplicaRegion, status: HealthStatus): Promise<void>;

  // Failover State
  getFailoverState(): Promise<FailoverState>;
  getCurrentPrimary(): Promise<ReplicaRegion>;
  getFailoverHistory(): Promise<readonly FailoverEvent[]>;

  // Safe Mode
  getSafeModeConfig(): Promise<SafeModeConfig>;
  activateSafeMode(level: SafeModeLevel, reason: string): Promise<void>;
  deactivateSafeMode(approver: string): Promise<void>;
  isOperationAllowed(operation: string): Promise<boolean>;

  // Canary
  runCanaryCheck(): Promise<{ passed: boolean; failures: string[] }>;
  getCanaryConfig(): Promise<CanaryConfig>;

  // Promotion
  requestPromotion(
    targetRegion: ReplicaRegion,
    reason: string,
    requestedBy: string
  ): Promise<PromotionRequest>;
  approvePromotion(requestId: string, approverId: string): Promise<PromotionRequest>;
  executePromotion(requestId: string): Promise<FailoverEvent>;

  // Rollback
  requestRollback(
    fromRegion: ReplicaRegion,
    toRegion: ReplicaRegion,
    reason: string,
    requestedBy: string
  ): Promise<RollbackRequest>;
  approveRollback(requestId: string, approverId: string): Promise<RollbackRequest>;
  executeRollback(requestId: string): Promise<FailoverEvent>;

  // Auth Path Independence
  getAuthPathStatus(region: ReplicaRegion): Promise<AuthPathStatus>;
  verifyAuthIndependence(): Promise<boolean>;
}

function createMockFailoverService(): FailoverService {
  const regionHealth: Map<ReplicaRegion, RegionHealth> = new Map();
  const healthHistory: Map<ReplicaRegion, RegionHealth[]> = new Map();
  const failoverHistory: FailoverEvent[] = [];
  const promotionRequests: Map<string, PromotionRequest> = new Map();
  const rollbackRequests: Map<string, RollbackRequest> = new Map();

  let currentPrimary: ReplicaRegion = 'us-east-1';
  let failoverState: FailoverState = 'normal';
  let safeModeConfig = createMockSafeModeConfig({ level: 'none' });

  // Initialize healthy regions
  for (const region of [
    'us-east-1',
    'us-west-2',
    'eu-west-1',
    'gov-cloud-east',
  ] as ReplicaRegion[]) {
    regionHealth.set(region, createMockRegionHealth({ region }));
    healthHistory.set(region, []);
  }

  return {
    async checkRegionHealth(region) {
      const health =
        regionHealth.get(region) ?? createMockRegionHealth({ region, status: 'unreachable' });

      // Record in history
      const history = healthHistory.get(region) ?? [];
      history.push({ ...health, last_check: new Date().toISOString() });
      if (history.length > 100) history.shift();
      healthHistory.set(region, history);

      return health;
    },

    async getHealthHistory(region, minutes) {
      const history = healthHistory.get(region) ?? [];
      const cutoff = Date.now() - minutes * 60 * 1000;
      return history.filter(h => new Date(h.last_check).getTime() >= cutoff);
    },

    async setRegionStatus(region, status) {
      const current = regionHealth.get(region) ?? createMockRegionHealth({ region });
      const consecutiveFailures =
        status === 'unhealthy' || status === 'unreachable' ? current.consecutive_failures + 1 : 0;

      regionHealth.set(region, {
        ...current,
        status,
        consecutive_failures: consecutiveFailures,
        last_check: new Date().toISOString(),
      });
    },

    async getFailoverState() {
      return failoverState;
    },

    async getCurrentPrimary() {
      return currentPrimary;
    },

    async getFailoverHistory() {
      return failoverHistory;
    },

    async getSafeModeConfig() {
      return safeModeConfig;
    },

    async activateSafeMode(level, _reason) {
      safeModeConfig = createMockSafeModeConfig({ level });
      if (level !== 'none') {
        failoverState = 'degraded';
      }
    },

    async deactivateSafeMode(_approver) {
      safeModeConfig = createMockSafeModeConfig({ level: 'none' });
      if (failoverState === 'degraded') {
        failoverState = 'normal';
      }
    },

    async isOperationAllowed(operation) {
      if (safeModeConfig.level === 'none') {
        return true;
      }
      if (safeModeConfig.blocked_operations.includes(operation)) {
        return false;
      }
      return safeModeConfig.allowed_operations.includes(operation);
    },

    async runCanaryCheck() {
      const failures: string[] = [];

      for (const [region, health] of regionHealth.entries()) {
        if (health.status !== 'healthy') {
          failures.push(region);
        }
      }

      return { passed: failures.length === 0, failures };
    },

    async getCanaryConfig() {
      const canaryId = `canary-${Date.now()}`;
      return {
        canary_id: `sha256:${Buffer.from(canaryId).toString('hex').slice(0, 64)}`,
        check_interval_seconds: 30,
        failure_threshold: 3,
        recovery_threshold: 2,
        endpoints: ['/health', '/ready', '/governance/status'],
      };
    },

    async requestPromotion(targetRegion, reason, requestedBy) {
      const request = createMockPromotionRequest({
        target_region: targetRegion,
        reason,
        requested_by: requestedBy,
      });
      promotionRequests.set(request.request_id, request);
      return request;
    },

    async approvePromotion(requestId, approverId) {
      const request = promotionRequests.get(requestId);
      if (!request) {
        throw new Error('Promotion request not found');
      }

      const updatedApprovals = [
        ...request.approvals,
        { approver_id: approverId, approved_at: new Date().toISOString() },
      ];

      const updated: PromotionRequest = {
        ...request,
        approvals: updatedApprovals,
        status: 'approved',
      };
      promotionRequests.set(requestId, updated);
      return updated;
    },

    async executePromotion(requestId) {
      const request = promotionRequests.get(requestId);
      if (!request || request.status !== 'approved') {
        throw new Error('Promotion not approved');
      }

      const event = createMockFailoverEvent({
        trigger: 'manual',
        from_region: currentPrimary,
        to_region: request.target_region,
        state: 'failover-active',
        approved_by: request.approvals.map(a => a.approver_id),
      });

      currentPrimary = request.target_region;
      failoverState = 'failover-active';
      failoverHistory.push(event);

      promotionRequests.set(requestId, { ...request, status: 'executed' });

      return event;
    },

    async requestRollback(fromRegion, toRegion, reason, requestedBy) {
      const request = createMockRollbackRequest({
        from_region: fromRegion,
        to_region: toRegion,
        reason,
        requested_by: requestedBy,
      });
      rollbackRequests.set(request.request_id, request);
      return request;
    },

    async approveRollback(requestId, approverId) {
      const request = rollbackRequests.get(requestId);
      if (!request) {
        throw new Error('Rollback request not found');
      }

      const updatedApprovals = [
        ...request.approvals,
        { approver_id: approverId, approved_at: new Date().toISOString() },
      ];

      const approved = !request.requires_dual_approval || updatedApprovals.length >= 2;

      const updated: RollbackRequest = {
        ...request,
        approvals: updatedApprovals,
        status: approved ? 'approved' : 'pending',
      };
      rollbackRequests.set(requestId, updated);
      return updated;
    },

    async executeRollback(requestId) {
      const request = rollbackRequests.get(requestId);
      if (!request || request.status !== 'approved') {
        throw new Error('Rollback not approved');
      }

      const event = createMockFailoverEvent({
        trigger: 'manual',
        from_region: request.from_region,
        to_region: request.to_region,
        state: 'recovery',
        approved_by: request.approvals.map(a => a.approver_id),
      });

      currentPrimary = request.to_region;
      failoverState = 'recovery';
      failoverHistory.push(event);

      rollbackRequests.set(requestId, { ...request, status: 'executed' });

      return event;
    },

    async getAuthPathStatus(region) {
      return {
        operational: true,
        region,
        last_auth_at: new Date().toISOString(),
        auth_latency_ms: 25,
        independent_of_governance: true, // Critical invariant
      };
    },

    async verifyAuthIndependence() {
      // Auth path must always work regardless of governance plane state
      return true;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Phase XVII — DR Failover Contracts', () => {
  let service: FailoverService;

  beforeEach(() => {
    service = createMockFailoverService();
  });

  // ==========================================================================
  // CONTRACT: health_monitoring
  // ==========================================================================
  describe('CONTRACT: health_monitoring', () => {
    it('checks region health', async () => {
      const health = await service.checkRegionHealth('us-east-1');

      assert.strictEqual(health.region, 'us-east-1');
      assert.ok(['healthy', 'degraded', 'unhealthy', 'unreachable'].includes(health.status));
    });

    it('tracks consecutive failures', async () => {
      await service.setRegionStatus('us-east-1', 'unhealthy');
      await service.setRegionStatus('us-east-1', 'unhealthy');

      const health = await service.checkRegionHealth('us-east-1');
      assert.ok(health.consecutive_failures >= 2);
    });

    it('resets failures on recovery', async () => {
      await service.setRegionStatus('us-east-1', 'unhealthy');
      await service.setRegionStatus('us-east-1', 'healthy');

      const health = await service.checkRegionHealth('us-east-1');
      assert.strictEqual(health.consecutive_failures, 0);
    });

    it('records health history', async () => {
      await service.checkRegionHealth('us-east-1');
      await service.checkRegionHealth('us-east-1');

      const history = await service.getHealthHistory('us-east-1', 60);
      assert.ok(history.length >= 2);
    });

    it('includes service counts', async () => {
      const health = await service.checkRegionHealth('us-east-1');

      assert.ok(typeof health.services_healthy === 'number');
      assert.ok(typeof health.services_total === 'number');
      assert.ok(health.services_healthy <= health.services_total);
    });
  });

  // ==========================================================================
  // CONTRACT: failover_state
  // ==========================================================================
  describe('CONTRACT: failover_state', () => {
    it('reports current failover state', async () => {
      const state = await service.getFailoverState();

      const validStates: FailoverState[] = [
        'normal',
        'degraded',
        'failover-pending',
        'failover-active',
        'recovery',
      ];
      assert.ok(validStates.includes(state));
    });

    it('tracks current primary region', async () => {
      const primary = await service.getCurrentPrimary();

      const validRegions: ReplicaRegion[] = [
        'us-east-1',
        'us-west-2',
        'eu-west-1',
        'gov-cloud-east',
      ];
      assert.ok(validRegions.includes(primary));
    });

    it('maintains failover history', async () => {
      const history = await service.getFailoverHistory();
      assert.ok(Array.isArray(history));
    });

    it('failover events have required fields', async () => {
      // Trigger a failover
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');
      await service.approvePromotion(request.request_id, 'sha256:approver1');
      await service.executePromotion(request.request_id);

      const history = await service.getFailoverHistory();
      assert.ok(history.length > 0);

      const event = history[0];
      assert.ok(event.event_id.startsWith('sha256:'));
      assert.ok(event.from_region);
      assert.ok(event.to_region);
      assert.ok(event.initiated_at);
    });
  });

  // ==========================================================================
  // CONTRACT: safe_mode
  // ==========================================================================
  describe('CONTRACT: safe_mode', () => {
    it('retrieves safe mode config', async () => {
      const config = await service.getSafeModeConfig();

      assert.ok(config.config_id.startsWith('sha256:'));
      assert.ok(Array.isArray(config.allowed_operations));
      assert.ok(Array.isArray(config.blocked_operations));
    });

    it('activates safe mode', async () => {
      await service.activateSafeMode('read-only', 'region outage');

      const config = await service.getSafeModeConfig();
      assert.strictEqual(config.level, 'read-only');
    });

    it('blocks mutations in read-only mode', async () => {
      await service.activateSafeMode('read-only', 'test');

      const createAllowed = await service.isOperationAllowed('create');
      const deleteAllowed = await service.isOperationAllowed('delete');

      assert.strictEqual(createAllowed, false);
      assert.strictEqual(deleteAllowed, false);
    });

    it('allows reads in read-only mode', async () => {
      await service.activateSafeMode('read-only', 'test');

      const readAllowed = await service.isOperationAllowed('read');
      const listAllowed = await service.isOperationAllowed('list');

      assert.strictEqual(readAllowed, true);
      assert.strictEqual(listAllowed, true);
    });

    it('deactivates safe mode', async () => {
      await service.activateSafeMode('read-only', 'test');
      await service.deactivateSafeMode('sha256:approver');

      const config = await service.getSafeModeConfig();
      assert.strictEqual(config.level, 'none');
    });

    it('all operations allowed when safe mode is off', async () => {
      const createAllowed = await service.isOperationAllowed('create');
      const readAllowed = await service.isOperationAllowed('read');

      assert.strictEqual(createAllowed, true);
      assert.strictEqual(readAllowed, true);
    });
  });

  // ==========================================================================
  // CONTRACT: canary_checks
  // ==========================================================================
  describe('CONTRACT: canary_checks', () => {
    it('runs canary check', async () => {
      const result = await service.runCanaryCheck();

      assert.strictEqual(typeof result.passed, 'boolean');
      assert.ok(Array.isArray(result.failures));
    });

    it('reports failures on unhealthy regions', async () => {
      await service.setRegionStatus('us-east-1', 'unhealthy');

      const result = await service.runCanaryCheck();

      assert.strictEqual(result.passed, false);
      assert.ok(result.failures.includes('us-east-1'));
    });

    it('retrieves canary config', async () => {
      const config = await service.getCanaryConfig();

      assert.ok(config.canary_id.startsWith('sha256:'));
      assert.ok(config.check_interval_seconds > 0);
      assert.ok(config.failure_threshold > 0);
      assert.ok(Array.isArray(config.endpoints));
    });

    it('config includes recovery threshold', async () => {
      const config = await service.getCanaryConfig();
      assert.ok(config.recovery_threshold > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: promotion
  // ==========================================================================
  describe('CONTRACT: promotion', () => {
    it('creates promotion request', async () => {
      const request = await service.requestPromotion('us-west-2', 'Primary failure', 'sha256:op1');

      assert.ok(request.request_id.startsWith('sha256:'));
      assert.strictEqual(request.target_region, 'us-west-2');
      assert.strictEqual(request.status, 'pending');
    });

    it('approves promotion request', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');
      const approved = await service.approvePromotion(request.request_id, 'sha256:approver1');

      assert.strictEqual(approved.status, 'approved');
      assert.ok(approved.approvals.length > 0);
    });

    it('executes approved promotion', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');
      await service.approvePromotion(request.request_id, 'sha256:approver1');
      const event = await service.executePromotion(request.request_id);

      assert.strictEqual(event.to_region, 'us-west-2');
      assert.strictEqual(event.state, 'failover-active');
    });

    it('updates current primary after promotion', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');
      await service.approvePromotion(request.request_id, 'sha256:approver1');
      await service.executePromotion(request.request_id);

      const primary = await service.getCurrentPrimary();
      assert.strictEqual(primary, 'us-west-2');
    });

    it('rejects execution without approval', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');

      await assert.rejects(
        async () => service.executePromotion(request.request_id),
        /not approved/i
      );
    });
  });

  // ==========================================================================
  // CONTRACT: rollback
  // ==========================================================================
  describe('CONTRACT: rollback', () => {
    it('creates rollback request', async () => {
      const request = await service.requestRollback(
        'us-west-2',
        'us-east-1',
        'Primary restored',
        'sha256:op1'
      );

      assert.ok(request.request_id.startsWith('sha256:'));
      assert.strictEqual(request.from_region, 'us-west-2');
      assert.strictEqual(request.to_region, 'us-east-1');
    });

    it('rollback requires dual approval', async () => {
      const request = await service.requestRollback('us-west-2', 'us-east-1', 'test', 'sha256:op1');

      assert.strictEqual(request.requires_dual_approval, true);
    });

    it('single approval is insufficient for rollback', async () => {
      const request = await service.requestRollback('us-west-2', 'us-east-1', 'test', 'sha256:op1');
      const afterFirst = await service.approveRollback(request.request_id, 'sha256:approver1');

      assert.strictEqual(afterFirst.status, 'pending');
    });

    it('dual approval enables rollback', async () => {
      const request = await service.requestRollback('us-west-2', 'us-east-1', 'test', 'sha256:op1');
      await service.approveRollback(request.request_id, 'sha256:approver1');
      const afterSecond = await service.approveRollback(request.request_id, 'sha256:approver2');

      assert.strictEqual(afterSecond.status, 'approved');
    });

    it('executes approved rollback', async () => {
      const request = await service.requestRollback('us-west-2', 'us-east-1', 'test', 'sha256:op1');
      await service.approveRollback(request.request_id, 'sha256:approver1');
      await service.approveRollback(request.request_id, 'sha256:approver2');
      const event = await service.executeRollback(request.request_id);

      assert.strictEqual(event.to_region, 'us-east-1');
      assert.strictEqual(event.state, 'recovery');
    });

    it('rollback records approvers in event', async () => {
      const request = await service.requestRollback('us-west-2', 'us-east-1', 'test', 'sha256:op1');
      await service.approveRollback(request.request_id, 'sha256:approver1');
      await service.approveRollback(request.request_id, 'sha256:approver2');
      const event = await service.executeRollback(request.request_id);

      assert.ok(event.approved_by);
      assert.ok(event.approved_by.length >= 2);
    });
  });

  // ==========================================================================
  // CONTRACT: auth_independence
  // ==========================================================================
  describe('CONTRACT: auth_independence', () => {
    it('auth path remains operational during failover', async () => {
      const status = await service.getAuthPathStatus('us-east-1');

      assert.strictEqual(status.operational, true);
      assert.strictEqual(status.independent_of_governance, true);
    });

    it('verifies auth independence', async () => {
      const independent = await service.verifyAuthIndependence();
      assert.strictEqual(independent, true);
    });

    it('auth path works even in safe mode', async () => {
      await service.activateSafeMode('full-lockdown', 'DR test');

      const status = await service.getAuthPathStatus('us-east-1');
      assert.strictEqual(status.operational, true);
    });

    it('auth path has low latency', async () => {
      const status = await service.getAuthPathStatus('us-east-1');

      assert.ok(typeof status.auth_latency_ms === 'number');
      assert.ok(status.auth_latency_ms >= 0);
    });
  });

  // ==========================================================================
  // CONTRACT: auditability
  // ==========================================================================
  describe('CONTRACT: auditability', () => {
    it('all failover events have sha256 IDs', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');
      await service.approvePromotion(request.request_id, 'sha256:approver1');
      await service.executePromotion(request.request_id);

      const history = await service.getFailoverHistory();

      for (const event of history) {
        assert.ok(event.event_id.startsWith('sha256:'));
      }
    });

    it('operator IDs are opaque', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');

      assert.ok(request.requested_by.startsWith('sha256:'));
    });

    it('approval timestamps are recorded', async () => {
      const request = await service.requestPromotion('us-west-2', 'test', 'sha256:op1');
      const approved = await service.approvePromotion(request.request_id, 'sha256:approver1');

      assert.ok(approved.approvals[0].approved_at);
      const date = new Date(approved.approvals[0].approved_at);
      assert.ok(!isNaN(date.getTime()));
    });

    it('failover history is append-only', async () => {
      const request1 = await service.requestPromotion('us-west-2', 'test1', 'sha256:op1');
      await service.approvePromotion(request1.request_id, 'sha256:approver1');
      await service.executePromotion(request1.request_id);

      const historyBefore = await service.getFailoverHistory();
      const countBefore = historyBefore.length;

      const request2 = await service.requestRollback(
        'us-west-2',
        'us-east-1',
        'test2',
        'sha256:op1'
      );
      await service.approveRollback(request2.request_id, 'sha256:approver1');
      await service.approveRollback(request2.request_id, 'sha256:approver2');
      await service.executeRollback(request2.request_id);

      const historyAfter = await service.getFailoverHistory();
      assert.ok(historyAfter.length > countBefore);
    });
  });
});

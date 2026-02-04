/**
 * Pipeline Rollback Contract Tests
 * ==================================
 *
 * Phase IVc: Validates CI/CD pipeline rollback wiring.
 *
 * Contract:
 * - rollback_triggers_on_breach_detection: automatic response to SLO breaches
 * - rollback_executes_to_safe_stage: always lands on known-good state
 * - rollback_preserves_all_audit_records: no audit deletion during rollback
 * - rollback_emits_correlated_events: full traceability
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Pipeline Rollback
// ============================================================================

/**
 * Deployment environment.
 */
type DeploymentEnvironment = 'development' | 'staging' | 'production';

/**
 * Pipeline stage.
 */
type PipelineStage = 'silent' | 'log_only' | 'ticket_on_high' | 'page_on_critical' | 'full_paging';

/**
 * Breach type.
 */
type BreachType =
  | 'slo_notification_failure'
  | 'slo_audit_drain_breach'
  | 'slo_dedupe_degradation'
  | 'integrity_alert'
  | 'sustained_publish_failures'
  | 'excessive_breaker_open';

/**
 * Breach detection result.
 */
interface BreachDetection {
  readonly detected: boolean;
  readonly type: BreachType;
  readonly severity: 'warning' | 'critical';
  readonly sustained: boolean;
  readonly durationMinutes: number;
  readonly threshold: number;
  readonly observed: number;
  readonly detectedAt: string;
}

/**
 * Rollback request.
 */
interface RollbackRequest {
  readonly environment: DeploymentEnvironment;
  readonly currentStage: PipelineStage;
  readonly targetStage: PipelineStage;
  readonly correlationId: string;
  readonly reason: BreachType | 'operator_initiated' | 'incident_response';
  readonly breachDetection?: BreachDetection;
  readonly immediate: boolean;
  readonly preserveAudit: true; // Must always be true
  readonly operatorIdHash?: string;
}

/**
 * Rollback result.
 */
interface RollbackResult {
  readonly success: boolean;
  readonly previousStage: PipelineStage;
  readonly currentStage: PipelineStage;
  readonly rollbackId: string;
  readonly correlationId: string;
  readonly auditPreserved: boolean;
  readonly safeStateReached: boolean;
  readonly timestamp: string;
}

/**
 * Audit record.
 */
interface AuditRecord {
  readonly id: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly environment: DeploymentEnvironment;
  readonly stage: PipelineStage;
  readonly data: Record<string, unknown>;
}

/**
 * Rollback event.
 */
interface RollbackEvent {
  readonly eventId: string;
  readonly eventType:
    | 'rollback_triggered'
    | 'rollback_executing'
    | 'rollback_completed'
    | 'rollback_failed';
  readonly correlationId: string;
  readonly environment: DeploymentEnvironment;
  readonly previousStage: PipelineStage;
  readonly targetStage: PipelineStage;
  readonly reason: string;
  readonly breachType?: BreachType;
  readonly timestamp: string;
  readonly operatorIdHash?: string;
}

/**
 * Breach monitor config.
 */
interface BreachMonitorConfig {
  readonly notificationFailureThreshold: number;
  readonly auditDrainBreachThresholdMs: number;
  readonly dedupeDegradationThreshold: number;
  readonly sustainedBreachMinutes: number;
  readonly breakerOpenMaxMinutes: number;
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_ORDER: PipelineStage[] = [
  'silent',
  'log_only',
  'ticket_on_high',
  'page_on_critical',
  'full_paging',
];

const DEFAULT_BREACH_CONFIG: BreachMonitorConfig = {
  notificationFailureThreshold: 0.01, // >1% failure
  auditDrainBreachThresholdMs: 5000, // >5s p95
  dedupeDegradationThreshold: 0.05, // >5% drop
  sustainedBreachMinutes: 5,
  breakerOpenMaxMinutes: 15,
};

const SAFE_STAGES: Record<PipelineStage, PipelineStage> = {
  silent: 'silent',
  log_only: 'silent',
  ticket_on_high: 'log_only',
  page_on_critical: 'ticket_on_high',
  full_paging: 'page_on_critical',
};

// ============================================================================
// Mock Implementations
// ============================================================================

const auditRecords: AuditRecord[] = [];
const rollbackEvents: RollbackEvent[] = [];

/**
 * Reset mocks.
 */
function resetMocks(): void {
  auditRecords.length = 0;
  rollbackEvents.length = 0;
}

/**
 * Get stage index.
 */
function getStageIndex(stage: PipelineStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Check if rollback is valid (must go backward or stay same).
 */
function isValidRollback(current: PipelineStage, target: PipelineStage): boolean {
  return getStageIndex(target) <= getStageIndex(current);
}

/**
 * Get safe stage for current stage.
 */
function getSafeStage(current: PipelineStage): PipelineStage {
  return SAFE_STAGES[current];
}

/**
 * Evaluate breach severity.
 */
function evaluateBreachSeverity(breach: BreachDetection): 'warning' | 'critical' {
  if (breach.type === 'integrity_alert') return 'critical';
  if (breach.sustained && breach.durationMinutes >= DEFAULT_BREACH_CONFIG.sustainedBreachMinutes) {
    return 'critical';
  }
  return 'warning';
}

/**
 * Should trigger rollback based on breach.
 */
function shouldTriggerRollback(breach: BreachDetection, config: BreachMonitorConfig): boolean {
  if (breach.type === 'integrity_alert') return true;
  if (!breach.sustained) return false;
  if (breach.durationMinutes < config.sustainedBreachMinutes) return false;

  switch (breach.type) {
    case 'slo_notification_failure':
      return breach.observed > config.notificationFailureThreshold;
    case 'slo_audit_drain_breach':
      return breach.observed > config.auditDrainBreachThresholdMs;
    case 'slo_dedupe_degradation':
      return breach.observed > config.dedupeDegradationThreshold;
    case 'excessive_breaker_open':
      return breach.durationMinutes > config.breakerOpenMaxMinutes;
    case 'sustained_publish_failures':
      return breach.sustained;
    default:
      return false;
  }
}

/**
 * Execute pipeline rollback.
 */
function executeRollback(request: RollbackRequest): RollbackResult {
  // Contract: preserveAudit must be true
  if (!request.preserveAudit) {
    throw new Error('INVARIANT: preserveAudit must be true');
  }

  // Validate rollback direction
  if (!isValidRollback(request.currentStage, request.targetStage)) {
    throw new Error(
      `Cannot promote via rollback: ${request.currentStage} -> ${request.targetStage}`
    );
  }

  const rollbackId = `rollback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();

  // Emit triggered event
  rollbackEvents.push({
    eventId: `${rollbackId}-triggered`,
    eventType: 'rollback_triggered',
    correlationId: request.correlationId,
    environment: request.environment,
    previousStage: request.currentStage,
    targetStage: request.targetStage,
    reason: request.reason,
    breachType: request.breachDetection?.type,
    timestamp,
    operatorIdHash: request.operatorIdHash,
  });

  // Emit executing event
  rollbackEvents.push({
    eventId: `${rollbackId}-executing`,
    eventType: 'rollback_executing',
    correlationId: request.correlationId,
    environment: request.environment,
    previousStage: request.currentStage,
    targetStage: request.targetStage,
    reason: request.reason,
    breachType: request.breachDetection?.type,
    timestamp: new Date().toISOString(),
    operatorIdHash: request.operatorIdHash,
  });

  // Execute rollback (mock: just change stage)
  const newStage = request.targetStage;
  const safeStage = getSafeStage(request.currentStage);
  const safeStateReached = getStageIndex(newStage) <= getStageIndex(safeStage);

  // Emit completed event
  rollbackEvents.push({
    eventId: `${rollbackId}-completed`,
    eventType: 'rollback_completed',
    correlationId: request.correlationId,
    environment: request.environment,
    previousStage: request.currentStage,
    targetStage: newStage,
    reason: request.reason,
    breachType: request.breachDetection?.type,
    timestamp: new Date().toISOString(),
    operatorIdHash: request.operatorIdHash,
  });

  return {
    success: true,
    previousStage: request.currentStage,
    currentStage: newStage,
    rollbackId,
    correlationId: request.correlationId,
    auditPreserved: true,
    safeStateReached,
    timestamp,
  };
}

/**
 * Get rollback events by correlation ID.
 */
function getRollbackEventsByCorrelation(correlationId: string): readonly RollbackEvent[] {
  return rollbackEvents.filter(e => e.correlationId === correlationId);
}

/**
 * Get audit record count.
 */
function getAuditRecordCount(): number {
  return auditRecords.length;
}

/**
 * Add audit record.
 */
function addAuditRecord(record: AuditRecord): void {
  auditRecords.push(record);
}

/**
 * Generate valid correlation ID.
 */
function generateCorrelationId(): string {
  const hexPart = () => Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `${hexPart()}-${hexPart().slice(0, 4)}-${hexPart().slice(0, 4)}-${hexPart().slice(0, 4)}-${hexPart()}${hexPart().slice(0, 4)}`;
}

/**
 * Create breach detection.
 */
function createBreachDetection(
  type: BreachType,
  sustained: boolean,
  durationMinutes: number
): BreachDetection {
  const observed = (() => {
    switch (type) {
      case 'slo_notification_failure':
        return 0.05; // 5% failure
      case 'slo_audit_drain_breach':
        return 8000; // 8s p95
      case 'slo_dedupe_degradation':
        return 0.15; // 15% drop
      case 'excessive_breaker_open':
        return durationMinutes;
      default:
        return 1;
    }
  })();

  return {
    detected: true,
    type,
    severity: sustained && durationMinutes >= 5 ? 'critical' : 'warning',
    sustained,
    durationMinutes,
    threshold: 0.01,
    observed,
    detectedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Contract: rollback_triggers_on_breach_detection
// ============================================================================

describe('Pipeline Rollback Contract', () => {
  describe('rollback_triggers_on_breach_detection', () => {
    it('should trigger on sustained notification failure', () => {
      const breach = createBreachDetection('slo_notification_failure', true, 10);
      const shouldTrigger = shouldTriggerRollback(breach, DEFAULT_BREACH_CONFIG);

      assert.ok(shouldTrigger);
    });

    it('should not trigger on transient breach', () => {
      const breach = createBreachDetection('slo_notification_failure', false, 1);
      const shouldTrigger = shouldTriggerRollback(breach, DEFAULT_BREACH_CONFIG);

      assert.ok(!shouldTrigger);
    });

    it('should trigger immediately on integrity alert', () => {
      const breach = createBreachDetection('integrity_alert', false, 0);
      const shouldTrigger = shouldTriggerRollback(breach, DEFAULT_BREACH_CONFIG);

      assert.ok(shouldTrigger);
    });

    it('should trigger on excessive breaker open time', () => {
      const breach = createBreachDetection('excessive_breaker_open', true, 20);
      const shouldTrigger = shouldTriggerRollback(breach, DEFAULT_BREACH_CONFIG);

      assert.ok(shouldTrigger);
    });

    it('should not trigger on brief breaker open', () => {
      const breach = createBreachDetection('excessive_breaker_open', true, 5);
      const shouldTrigger = shouldTriggerRollback(breach, DEFAULT_BREACH_CONFIG);

      assert.ok(!shouldTrigger);
    });
  });

  // ============================================================================
  // Contract: rollback_executes_to_safe_stage
  // ============================================================================

  describe('rollback_executes_to_safe_stage', () => {
    it('should rollback to safe stage', () => {
      resetMocks();

      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        reason: 'slo_notification_failure',
        immediate: true,
        preserveAudit: true,
      };

      const result = executeRollback(request);

      assert.ok(result.success);
      assert.ok(result.safeStateReached);
      assert.equal(result.currentStage, 'ticket_on_high');
    });

    it('should allow rollback to silent', () => {
      resetMocks();

      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'full_paging',
        targetStage: 'silent',
        correlationId: generateCorrelationId(),
        reason: 'incident_response',
        immediate: true,
        preserveAudit: true,
      };

      const result = executeRollback(request);

      assert.ok(result.success);
      assert.equal(result.currentStage, 'silent');
    });

    it('should reject promotion via rollback', () => {
      resetMocks();

      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'page_on_critical',
        correlationId: generateCorrelationId(),
        reason: 'operator_initiated',
        immediate: true,
        preserveAudit: true,
      };

      assert.throws(() => executeRollback(request), /Cannot promote via rollback/);
    });

    it('should calculate safe stage correctly', () => {
      assert.equal(getSafeStage('full_paging'), 'page_on_critical');
      assert.equal(getSafeStage('page_on_critical'), 'ticket_on_high');
      assert.equal(getSafeStage('ticket_on_high'), 'log_only');
      assert.equal(getSafeStage('log_only'), 'silent');
      assert.equal(getSafeStage('silent'), 'silent');
    });
  });

  // ============================================================================
  // Contract: rollback_preserves_all_audit_records
  // ============================================================================

  describe('rollback_preserves_all_audit_records', () => {
    it('should require preserveAudit flag', () => {
      resetMocks();

      const request = {
        environment: 'production' as const,
        currentStage: 'page_on_critical' as const,
        targetStage: 'log_only' as const,
        correlationId: generateCorrelationId(),
        reason: 'slo_notification_failure' as const,
        immediate: true,
        preserveAudit: false as const,
      };

      // @ts-expect-error - Testing invalid input
      assert.throws(() => executeRollback(request), /preserveAudit must be true/);
    });

    it('should not delete audit records during rollback', () => {
      resetMocks();

      // Add some pre-existing audit records
      addAuditRecord({
        id: 'audit-1',
        eventType: 'promotion',
        timestamp: new Date().toISOString(),
        correlationId: 'old-correlation',
        environment: 'production',
        stage: 'page_on_critical',
        data: {},
      });

      const beforeCount = getAuditRecordCount();

      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'log_only',
        correlationId: generateCorrelationId(),
        reason: 'slo_notification_failure',
        immediate: true,
        preserveAudit: true,
      };

      const result = executeRollback(request);

      assert.ok(result.auditPreserved);
      assert.equal(getAuditRecordCount(), beforeCount);
    });

    it('should maintain audit integrity across multiple rollbacks', () => {
      resetMocks();

      // Add initial records
      for (let i = 0; i < 5; i++) {
        addAuditRecord({
          id: `audit-${i}`,
          eventType: 'action',
          timestamp: new Date().toISOString(),
          correlationId: `correlation-${i}`,
          environment: 'production',
          stage: 'page_on_critical',
          data: {},
        });
      }

      const initialCount = getAuditRecordCount();

      // Execute multiple rollbacks
      for (let i = 0; i < 3; i++) {
        executeRollback({
          environment: 'production',
          currentStage: 'page_on_critical',
          targetStage: 'ticket_on_high',
          correlationId: generateCorrelationId(),
          reason: 'operator_initiated',
          immediate: true,
          preserveAudit: true,
        });
      }

      assert.equal(getAuditRecordCount(), initialCount);
    });
  });

  // ============================================================================
  // Contract: rollback_emits_correlated_events
  // ============================================================================

  describe('rollback_emits_correlated_events', () => {
    it('should emit events with correlation ID', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'log_only',
        correlationId,
        reason: 'slo_notification_failure',
        immediate: true,
        preserveAudit: true,
      };

      executeRollback(request);

      const events = getRollbackEventsByCorrelation(correlationId);
      assert.ok(events.length > 0);
      assert.ok(events.every(e => e.correlationId === correlationId));
    });

    it('should emit triggered, executing, and completed events', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'log_only',
        correlationId,
        reason: 'integrity_alert',
        immediate: true,
        preserveAudit: true,
      };

      executeRollback(request);

      const events = getRollbackEventsByCorrelation(correlationId);
      const types = events.map(e => e.eventType);

      assert.ok(types.includes('rollback_triggered'));
      assert.ok(types.includes('rollback_executing'));
      assert.ok(types.includes('rollback_completed'));
    });

    it('should include breach type in events', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const breach = createBreachDetection('slo_audit_drain_breach', true, 10);

      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'log_only',
        correlationId,
        reason: 'slo_audit_drain_breach',
        breachDetection: breach,
        immediate: true,
        preserveAudit: true,
      };

      executeRollback(request);

      const events = getRollbackEventsByCorrelation(correlationId);
      assert.ok(events.some(e => e.breachType === 'slo_audit_drain_breach'));
    });

    it('should include operator hash when present', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const operatorHash =
        'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';

      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'log_only',
        correlationId,
        reason: 'operator_initiated',
        immediate: true,
        preserveAudit: true,
        operatorIdHash: operatorHash,
      };

      executeRollback(request);

      const events = getRollbackEventsByCorrelation(correlationId);
      assert.ok(events.some(e => e.operatorIdHash === operatorHash));
    });

    it('should have consistent timestamps across event chain', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: RollbackRequest = {
        environment: 'production',
        currentStage: 'page_on_critical',
        targetStage: 'log_only',
        correlationId,
        reason: 'incident_response',
        immediate: true,
        preserveAudit: true,
      };

      executeRollback(request);

      const events = getRollbackEventsByCorrelation(correlationId);
      const timestamps = events.map(e => new Date(e.timestamp).getTime());

      // Events should be in chronological order
      for (let i = 1; i < timestamps.length; i++) {
        assert.ok(timestamps[i] >= timestamps[i - 1]);
      }
    });
  });
});

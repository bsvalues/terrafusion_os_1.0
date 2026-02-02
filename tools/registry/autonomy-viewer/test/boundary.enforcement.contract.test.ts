/**
 * Boundary Enforcement: Core Enforcement Contract Tests
 *
 * Phase XIII - Block changes that violate governance boundaries at
 * deployment/change time with auditable gate enforcement.
 *
 * CONTRACT SURFACE:
 * - Gate Enforcement: Block changes violating invariants
 * - Exception Handling: Approved exceptions with expiry
 * - Audit Logging: Immutable record of gate decisions
 * - Violation Remediation: Guidance for fixing violations
 *
 * INVARIANTS:
 * - No bypass without approved exception
 * - All gate decisions are logged
 * - All IDs are opaque sha256:
 * - Exceptions require dual-approval and have expiry
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type GateType =
  | 'policy_lint'
  | 'readiness_score'
  | 'approval_required'
  | 'forbidden_path'
  | 'port_allowlist';
type GateDecision = 'allow' | 'block' | 'warn';
type ExceptionStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'revoked';

/**
 * Gate check request
 */
interface GateCheckRequest {
  readonly request_id: string;
  readonly change_id: string;
  readonly service_id: string;
  readonly environment: string;
  readonly change_type: 'deploy' | 'config' | 'schema' | 'policy';
  readonly files_changed: readonly string[];
  readonly requested_by: string;
  readonly requested_at: string;
}

/**
 * Gate check result
 */
interface GateCheckResult {
  readonly result_id: string;
  readonly request_id: string;
  readonly gate_type: GateType;
  readonly decision: GateDecision;
  readonly violations: readonly GateViolation[];
  readonly exception_applied?: string;
  readonly evaluated_at: string;
}

/**
 * Gate violation
 */
interface GateViolation {
  readonly violation_id: string;
  readonly gate_type: GateType;
  readonly rule_name: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly file_path?: string;
  readonly line_number?: number;
  readonly message: string;
  readonly remediation: string;
}

/**
 * Exception request
 */
interface ExceptionRequest {
  readonly exception_id: string;
  readonly service_id: string;
  readonly gate_type: GateType;
  readonly rule_name: string;
  readonly reason: string;
  readonly requested_by: string;
  readonly approvers: readonly string[];
  readonly status: ExceptionStatus;
  readonly expires_at?: string;
  readonly created_at: string;
}

/**
 * Audit log entry
 */
interface AuditLogEntry {
  readonly log_id: string;
  readonly event_type:
    | 'gate_check'
    | 'exception_request'
    | 'exception_approval'
    | 'violation_remediated';
  readonly request_id: string;
  readonly decision: GateDecision;
  readonly actor: string;
  readonly details: Record<string, unknown>;
  readonly logged_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockRequest(overrides: Partial<GateCheckRequest> = {}): GateCheckRequest {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    request_id: `sha256:${Buffer.from(requestId).toString('hex').slice(0, 64)}`,
    change_id: `sha256:${Buffer.from('change-1').toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    environment: 'production',
    change_type: 'deploy',
    files_changed: ['src/handler.ts', 'config/env.yaml'],
    requested_by: `sha256:${Buffer.from('user-1').toString('hex').slice(0, 64)}`,
    requested_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockResult(overrides: Partial<GateCheckResult> = {}): GateCheckResult {
  const resultId = `result-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    result_id: `sha256:${Buffer.from(resultId).toString('hex').slice(0, 64)}`,
    request_id: `sha256:${Buffer.from('req-1').toString('hex').slice(0, 64)}`,
    gate_type: 'policy_lint',
    decision: 'allow',
    violations: [],
    evaluated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockViolation(overrides: Partial<GateViolation> = {}): GateViolation {
  const violationId = `viol-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    violation_id: `sha256:${Buffer.from(violationId).toString('hex').slice(0, 64)}`,
    gate_type: 'policy_lint',
    rule_name: 'no-pii-in-logs',
    severity: 'critical',
    file_path: 'src/handler.ts',
    line_number: 42,
    message: 'PII detected in log statement',
    remediation: 'use opaque reference instead of raw PII',
    ...overrides,
  };
}

function createMockException(overrides: Partial<ExceptionRequest> = {}): ExceptionRequest {
  const exceptionId = `exc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    exception_id: `sha256:${Buffer.from(exceptionId).toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    gate_type: 'policy_lint',
    rule_name: 'no-hardcoded-ports',
    reason: 'legacy integration requires static port',
    requested_by: `sha256:${Buffer.from('user-1').toString('hex').slice(0, 64)}`,
    approvers: [
      `sha256:${Buffer.from('approver-1').toString('hex').slice(0, 64)}`,
      `sha256:${Buffer.from('approver-2').toString('hex').slice(0, 64)}`,
    ],
    status: 'approved',
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockAuditLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    log_id: `sha256:${Buffer.from(logId).toString('hex').slice(0, 64)}`,
    event_type: 'gate_check',
    request_id: `sha256:${Buffer.from('req-1').toString('hex').slice(0, 64)}`,
    decision: 'allow',
    actor: `sha256:${Buffer.from('system').toString('hex').slice(0, 64)}`,
    details: {},
    logged_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK BOUNDARY ENFORCEMENT SERVICE
// ============================================================================

interface BoundaryEnforcementService {
  // Gate Enforcement
  checkGate(request: GateCheckRequest): Promise<GateCheckResult>;
  checkAllGates(request: GateCheckRequest): Promise<readonly GateCheckResult[]>;
  isChangeAllowed(request: GateCheckRequest): Promise<boolean>;
  getBlockingViolations(results: readonly GateCheckResult[]): Promise<readonly GateViolation[]>;

  // Exception Handling
  requestException(
    serviceId: string,
    gateType: GateType,
    ruleName: string,
    reason: string
  ): Promise<ExceptionRequest>;
  approveException(exceptionId: string, approverId: string): Promise<ExceptionRequest>;
  hasValidException(serviceId: string, ruleName: string): Promise<boolean>;
  getActiveExceptions(serviceId: string): Promise<readonly ExceptionRequest[]>;

  // Audit Logging
  logGateCheck(result: GateCheckResult): Promise<AuditLogEntry>;
  getAuditLogs(requestId: string): Promise<readonly AuditLogEntry[]>;
  getServiceAuditLogs(serviceId: string, limit: number): Promise<readonly AuditLogEntry[]>;

  // Remediation
  getRemediationGuidance(violation: GateViolation): Promise<string>;
  markRemediated(violationId: string, remediatedBy: string): Promise<boolean>;
}

function createMockBoundaryEnforcementService(): BoundaryEnforcementService {
  const exceptions: Map<string, ExceptionRequest> = new Map();
  const auditLogs: AuditLogEntry[] = [];

  return {
    async checkGate(request) {
      const violations: GateViolation[] = [];

      // Check for forbidden paths
      for (const file of request.files_changed) {
        if (file.includes('ARCHIVE')) {
          violations.push(
            createMockViolation({
              gate_type: 'forbidden_path',
              rule_name: 'no-archive-modification',
              message: `forbidden path: ${file}`,
              file_path: file,
            })
          );
        }
      }

      const decision: GateDecision = violations.length > 0 ? 'block' : 'allow';

      return createMockResult({
        request_id: request.request_id,
        decision,
        violations,
      });
    },

    async checkAllGates(request) {
      const gates: GateType[] = [
        'policy_lint',
        'readiness_score',
        'forbidden_path',
        'port_allowlist',
      ];
      const results: GateCheckResult[] = [];

      for (const gate of gates) {
        const result = await this.checkGate(request);
        results.push(
          createMockResult({
            ...result,
            gate_type: gate,
          })
        );
      }

      return results;
    },

    async isChangeAllowed(request) {
      const results = await this.checkAllGates(request);
      const blocking = await this.getBlockingViolations(results);

      // Check for valid exceptions
      for (const violation of blocking) {
        const hasException = await this.hasValidException(request.service_id, violation.rule_name);
        if (!hasException) {
          return false;
        }
      }

      return true;
    },

    async getBlockingViolations(results) {
      const allViolations: GateViolation[] = [];
      for (const result of results) {
        if (result.decision === 'block') {
          allViolations.push(...result.violations);
        }
      }
      return allViolations.filter(v => v.severity === 'critical' || v.severity === 'high');
    },

    async requestException(serviceId, gateType, ruleName, reason) {
      const exception = createMockException({
        service_id: serviceId,
        gate_type: gateType,
        rule_name: ruleName,
        reason,
        status: 'pending',
        approvers: [],
      });

      exceptions.set(exception.exception_id, exception);
      return exception;
    },

    async approveException(exceptionId, approverId) {
      const exception = exceptions.get(exceptionId);
      if (!exception) {
        throw new Error('exception not found');
      }

      const updatedApprovers = [...exception.approvers, approverId];
      const status: ExceptionStatus = updatedApprovers.length >= 2 ? 'approved' : 'pending';

      const updated = createMockException({
        ...exception,
        approvers: updatedApprovers,
        status,
        expires_at:
          status === 'approved' ? new Date(Date.now() + 86400000 * 30).toISOString() : undefined,
      });

      exceptions.set(exceptionId, updated);
      return updated;
    },

    async hasValidException(serviceId, ruleName) {
      for (const exception of exceptions.values()) {
        if (
          exception.service_id === serviceId &&
          exception.rule_name === ruleName &&
          exception.status === 'approved' &&
          exception.expires_at &&
          new Date(exception.expires_at) > new Date()
        ) {
          return true;
        }
      }
      return false;
    },

    async getActiveExceptions(serviceId) {
      const active: ExceptionRequest[] = [];
      for (const exception of exceptions.values()) {
        if (
          exception.service_id === serviceId &&
          exception.status === 'approved' &&
          exception.expires_at &&
          new Date(exception.expires_at) > new Date()
        ) {
          active.push(exception);
        }
      }
      return active;
    },

    async logGateCheck(result) {
      const log = createMockAuditLog({
        event_type: 'gate_check',
        request_id: result.request_id,
        decision: result.decision,
        details: { gate_type: result.gate_type, violation_count: result.violations.length },
      });

      auditLogs.push(log);
      return log;
    },

    async getAuditLogs(requestId) {
      return auditLogs.filter(log => log.request_id === requestId);
    },

    async getServiceAuditLogs(serviceId, limit) {
      // In real implementation, would filter by service
      return auditLogs.slice(0, limit);
    },

    async getRemediationGuidance(violation) {
      return violation.remediation;
    },

    async markRemediated(violationId, remediatedBy) {
      auditLogs.push(
        createMockAuditLog({
          event_type: 'violation_remediated',
          details: { violation_id: violationId, remediated_by: remediatedBy },
        })
      );
      return true;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Boundary Enforcement: Core Enforcement Contracts', () => {
  let service: BoundaryEnforcementService;

  beforeEach(() => {
    service = createMockBoundaryEnforcementService();
  });

  // ==========================================================================
  // CONTRACT: gate_enforcement
  // ==========================================================================
  describe('CONTRACT: gate_enforcement', () => {
    it('checks gate for request', async () => {
      const request = createMockRequest();
      const result = await service.checkGate(request);

      assert.ok(result.result_id.startsWith('sha256:'));
      assert.ok(['allow', 'block', 'warn'].includes(result.decision));
    });

    it('blocks forbidden paths', async () => {
      const request = createMockRequest({
        files_changed: ['src/ARCHIVE/old-code.ts'],
      });

      const result = await service.checkGate(request);
      assert.strictEqual(result.decision, 'block');
      assert.ok(result.violations.length > 0);
    });

    it('allows clean changes', async () => {
      const request = createMockRequest({
        files_changed: ['src/handler.ts'],
      });

      const result = await service.checkGate(request);
      assert.strictEqual(result.decision, 'allow');
    });

    it('checks all gates', async () => {
      const request = createMockRequest();
      const results = await service.checkAllGates(request);

      assert.ok(results.length > 1);
    });

    it('determines if change is allowed', async () => {
      const request = createMockRequest({
        files_changed: ['src/clean.ts'],
      });

      const allowed = await service.isChangeAllowed(request);
      assert.strictEqual(typeof allowed, 'boolean');
    });

    it('identifies blocking violations', async () => {
      const results = [
        createMockResult({
          decision: 'block',
          violations: [createMockViolation({ severity: 'critical' })],
        }),
      ];

      const blocking = await service.getBlockingViolations(results);
      assert.ok(blocking.length > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: exception_handling
  // ==========================================================================
  describe('CONTRACT: exception_handling', () => {
    it('requests exception', async () => {
      const serviceId = `sha256:${Buffer.from('exc-svc').toString('hex').slice(0, 64)}`;
      const exception = await service.requestException(
        serviceId,
        'policy_lint',
        'no-hardcoded-ports',
        'legacy system requirement'
      );

      assert.ok(exception.exception_id.startsWith('sha256:'));
      assert.strictEqual(exception.status, 'pending');
    });

    it('requires dual approval', async () => {
      const serviceId = `sha256:${Buffer.from('dual-svc').toString('hex').slice(0, 64)}`;
      const exception = await service.requestException(
        serviceId,
        'policy_lint',
        'test-rule',
        'reason'
      );

      // First approval
      const afterFirst = await service.approveException(
        exception.exception_id,
        `sha256:${Buffer.from('approver-1').toString('hex').slice(0, 64)}`
      );
      assert.strictEqual(afterFirst.status, 'pending');

      // Second approval
      const afterSecond = await service.approveException(
        exception.exception_id,
        `sha256:${Buffer.from('approver-2').toString('hex').slice(0, 64)}`
      );
      assert.strictEqual(afterSecond.status, 'approved');
    });

    it('approved exceptions have expiry', async () => {
      const serviceId = `sha256:${Buffer.from('expiry-svc').toString('hex').slice(0, 64)}`;
      const exception = await service.requestException(
        serviceId,
        'policy_lint',
        'test-rule',
        'reason'
      );

      await service.approveException(exception.exception_id, `sha256:${'a'.repeat(64)}`);
      const approved = await service.approveException(
        exception.exception_id,
        `sha256:${'b'.repeat(64)}`
      );

      assert.ok(approved.expires_at);
      const expiresAt = new Date(approved.expires_at);
      assert.ok(expiresAt > new Date());
    });

    it('checks for valid exception', async () => {
      const serviceId = `sha256:${Buffer.from('check-exc-svc').toString('hex').slice(0, 64)}`;
      const hasException = await service.hasValidException(serviceId, 'some-rule');

      assert.strictEqual(typeof hasException, 'boolean');
    });

    it('gets active exceptions for service', async () => {
      const serviceId = `sha256:${Buffer.from('active-exc-svc').toString('hex').slice(0, 64)}`;
      const active = await service.getActiveExceptions(serviceId);

      assert.ok(Array.isArray(active));
    });
  });

  // ==========================================================================
  // CONTRACT: audit_logging
  // ==========================================================================
  describe('CONTRACT: audit_logging', () => {
    it('logs gate check', async () => {
      const result = createMockResult();
      const log = await service.logGateCheck(result);

      assert.ok(log.log_id.startsWith('sha256:'));
      assert.strictEqual(log.event_type, 'gate_check');
    });

    it('logs include decision', async () => {
      const result = createMockResult({ decision: 'block' });
      const log = await service.logGateCheck(result);

      assert.strictEqual(log.decision, 'block');
    });

    it('retrieves logs by request', async () => {
      const result = createMockResult();
      await service.logGateCheck(result);

      const logs = await service.getAuditLogs(result.request_id);
      assert.ok(Array.isArray(logs));
    });

    it('retrieves service audit logs', async () => {
      const serviceId = `sha256:${Buffer.from('audit-svc').toString('hex').slice(0, 64)}`;
      const logs = await service.getServiceAuditLogs(serviceId, 10);

      assert.ok(Array.isArray(logs));
      assert.ok(logs.length <= 10);
    });

    it('audit logs have timestamps', async () => {
      const result = createMockResult();
      const log = await service.logGateCheck(result);

      assert.ok(log.logged_at);
      const date = new Date(log.logged_at);
      assert.ok(!isNaN(date.getTime()));
    });
  });

  // ==========================================================================
  // CONTRACT: remediation
  // ==========================================================================
  describe('CONTRACT: remediation', () => {
    it('provides remediation guidance', async () => {
      const violation = createMockViolation();
      const guidance = await service.getRemediationGuidance(violation);

      assert.ok(guidance.length > 0);
    });

    it('marks violation as remediated', async () => {
      const violationId = `sha256:${Buffer.from('rem-viol').toString('hex').slice(0, 64)}`;
      const remediatedBy = `sha256:${Buffer.from('user-1').toString('hex').slice(0, 64)}`;

      const success = await service.markRemediated(violationId, remediatedBy);
      assert.strictEqual(success, true);
    });

    it('remediation logged', async () => {
      const violationId = `sha256:${Buffer.from('log-rem-viol').toString('hex').slice(0, 64)}`;
      const remediatedBy = `sha256:${Buffer.from('user-1').toString('hex').slice(0, 64)}`;

      await service.markRemediated(violationId, remediatedBy);

      // Check that a log was created (service logs internally)
      const logs = await service.getServiceAuditLogs('any', 100);
      const remediationLog = logs.find(l => l.event_type === 'violation_remediated');
      assert.ok(remediationLog);
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const request = createMockRequest();
      const result = await service.checkGate(request);

      assert.ok(request.request_id.startsWith('sha256:'));
      assert.ok(result.result_id.startsWith('sha256:'));
    });

    it('violations have remediation', async () => {
      const violation = createMockViolation();
      assert.ok(violation.remediation.length > 0);
    });

    it('no bypass without exception', async () => {
      const request = createMockRequest({
        files_changed: ['src/ARCHIVE/forbidden.ts'],
      });

      // Without exception, should be blocked
      const allowed = await service.isChangeAllowed(request);

      // Since no exception exists for this rule, it should be blocked
      assert.strictEqual(allowed, false);
    });

    it('result timestamps are valid', async () => {
      const request = createMockRequest();
      const result = await service.checkGate(request);

      const date = new Date(result.evaluated_at);
      assert.ok(!isNaN(date.getTime()));
    });
  });
});

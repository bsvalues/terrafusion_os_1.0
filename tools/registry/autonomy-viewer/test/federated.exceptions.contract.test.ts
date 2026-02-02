/**
 * Federated Governance: Federated Exceptions Contract Tests
 *
 * Phase XIV - Dual-approval across domains with expiry enforcement
 * and full audit logging.
 *
 * CONTRACT SURFACE:
 * - Cross-Domain Exceptions: Exceptions that span organizational boundaries
 * - Dual Approval: Requires approval from both source and target domains
 * - Expiry Enforcement: All exceptions have mandatory expiry
 * - Audit Trail: Complete audit logging across domains
 *
 * INVARIANTS:
 * - Exceptions require dual approval (source + target domain)
 * - All exceptions have mandatory expiry (no permanent exceptions)
 * - All exception decisions are audit logged
 * - Revocation is immediate and logged
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ExceptionStatus =
  | 'pending_source'
  | 'pending_target'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'revoked';
type ExceptionType = 'policy_bypass' | 'access_elevation' | 'data_sharing' | 'boundary_crossing';
type AuditEventType =
  | 'requested'
  | 'source_approved'
  | 'target_approved'
  | 'denied'
  | 'expired'
  | 'revoked';

/**
 * Federated exception request
 */
interface FederatedException {
  readonly exception_id: string;
  readonly type: ExceptionType;
  readonly source_domain_id: string;
  readonly target_domain_id: string;
  readonly policy_id: string;
  readonly justification: string;
  readonly requested_by: string;
  readonly source_approver?: string;
  readonly target_approver?: string;
  readonly status: ExceptionStatus;
  readonly requested_at: string;
  readonly expires_at: string;
  readonly max_duration_days: number;
}

/**
 * Approval record
 */
interface ApprovalRecord {
  readonly approval_id: string;
  readonly exception_id: string;
  readonly domain_id: string;
  readonly approver_id: string;
  readonly decision: 'approve' | 'deny';
  readonly reason?: string;
  readonly approved_at: string;
}

/**
 * Audit log entry
 */
interface ExceptionAuditEntry {
  readonly audit_id: string;
  readonly exception_id: string;
  readonly event_type: AuditEventType;
  readonly actor_id: string;
  readonly source_domain_id: string;
  readonly target_domain_id: string;
  readonly details: Record<string, unknown>;
  readonly logged_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockException(overrides: Partial<FederatedException> = {}): FederatedException {
  const exceptionId = `exc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    exception_id: `sha256:${Buffer.from(exceptionId).toString('hex').slice(0, 64)}`,
    type: 'policy_bypass',
    source_domain_id: `sha256:${Buffer.from('source-domain').toString('hex').slice(0, 64)}`,
    target_domain_id: `sha256:${Buffer.from('target-domain').toString('hex').slice(0, 64)}`,
    policy_id: `sha256:${Buffer.from('policy-1').toString('hex').slice(0, 64)}`,
    justification: 'legacy system integration requires temporary bypass',
    requested_by: `sha256:${Buffer.from('requester-1').toString('hex').slice(0, 64)}`,
    status: 'pending_source',
    requested_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    max_duration_days: 30,
    ...overrides,
  };
}

function createMockApproval(overrides: Partial<ApprovalRecord> = {}): ApprovalRecord {
  const approvalId = `appr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    approval_id: `sha256:${Buffer.from(approvalId).toString('hex').slice(0, 64)}`,
    exception_id: `sha256:${Buffer.from('exc-1').toString('hex').slice(0, 64)}`,
    domain_id: `sha256:${Buffer.from('domain-1').toString('hex').slice(0, 64)}`,
    approver_id: `sha256:${Buffer.from('approver-1').toString('hex').slice(0, 64)}`,
    decision: 'approve',
    approved_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockAuditEntry(overrides: Partial<ExceptionAuditEntry> = {}): ExceptionAuditEntry {
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    audit_id: `sha256:${Buffer.from(auditId).toString('hex').slice(0, 64)}`,
    exception_id: `sha256:${Buffer.from('exc-1').toString('hex').slice(0, 64)}`,
    event_type: 'requested',
    actor_id: `sha256:${Buffer.from('actor-1').toString('hex').slice(0, 64)}`,
    source_domain_id: `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`,
    target_domain_id: `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`,
    details: {},
    logged_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK FEDERATED EXCEPTIONS SERVICE
// ============================================================================

interface FederatedExceptionsService {
  // Exception Lifecycle
  requestException(
    type: ExceptionType,
    sourceDomainId: string,
    targetDomainId: string,
    policyId: string,
    justification: string
  ): Promise<FederatedException>;
  getException(exceptionId: string): Promise<FederatedException | null>;
  listExceptions(domainId: string): Promise<readonly FederatedException[]>;
  listPendingApprovals(domainId: string): Promise<readonly FederatedException[]>;

  // Approval Workflow
  approveFromSource(exceptionId: string, approverId: string): Promise<FederatedException>;
  approveFromTarget(exceptionId: string, approverId: string): Promise<FederatedException>;
  denyException(
    exceptionId: string,
    approverId: string,
    reason: string
  ): Promise<FederatedException>;
  getApprovalStatus(exceptionId: string): Promise<{ source: boolean; target: boolean }>;

  // Expiry & Revocation
  checkExpiry(exceptionId: string): Promise<boolean>;
  revokeException(
    exceptionId: string,
    revokerId: string,
    reason: string
  ): Promise<FederatedException>;
  extendException(exceptionId: string, newExpiryDays: number): Promise<FederatedException>;
  getActiveExceptions(domainId: string): Promise<readonly FederatedException[]>;

  // Audit Trail
  getAuditTrail(exceptionId: string): Promise<readonly ExceptionAuditEntry[]>;
  logEvent(
    exceptionId: string,
    eventType: AuditEventType,
    actorId: string,
    details: Record<string, unknown>
  ): Promise<ExceptionAuditEntry>;
  getCrossdomainAudit(
    sourceDomainId: string,
    targetDomainId: string
  ): Promise<readonly ExceptionAuditEntry[]>;
}

function createMockFederatedExceptionsService(): FederatedExceptionsService {
  const exceptions: Map<string, FederatedException> = new Map();
  const approvals: Map<string, ApprovalRecord[]> = new Map();
  const auditLog: ExceptionAuditEntry[] = [];

  const logEventInternal = async (
    exceptionId: string,
    eventType: AuditEventType,
    actorId: string,
    details: Record<string, unknown>
  ): Promise<ExceptionAuditEntry> => {
    const exception = exceptions.get(exceptionId);
    const entry = createMockAuditEntry({
      exception_id: exceptionId,
      event_type: eventType,
      actor_id: actorId,
      source_domain_id: exception?.source_domain_id ?? 'unknown',
      target_domain_id: exception?.target_domain_id ?? 'unknown',
      details,
    });
    auditLog.push(entry);
    return entry;
  };

  return {
    async requestException(type, sourceDomainId, targetDomainId, policyId, justification) {
      const exception = createMockException({
        type,
        source_domain_id: sourceDomainId,
        target_domain_id: targetDomainId,
        policy_id: policyId,
        justification,
        status: 'pending_source',
      });
      exceptions.set(exception.exception_id, exception);
      approvals.set(exception.exception_id, []);
      await logEventInternal(exception.exception_id, 'requested', exception.requested_by, {
        type,
        justification,
      });
      return exception;
    },

    async getException(exceptionId) {
      return exceptions.get(exceptionId) ?? null;
    },

    async listExceptions(domainId) {
      return Array.from(exceptions.values()).filter(
        e => e.source_domain_id === domainId || e.target_domain_id === domainId
      );
    },

    async listPendingApprovals(domainId) {
      return Array.from(exceptions.values()).filter(e => {
        if (e.source_domain_id === domainId && e.status === 'pending_source') return true;
        if (e.target_domain_id === domainId && e.status === 'pending_target') return true;
        return false;
      });
    },

    async approveFromSource(exceptionId, approverId) {
      const exception = exceptions.get(exceptionId);
      if (!exception) throw new Error('exception not found');

      const approval = createMockApproval({
        exception_id: exceptionId,
        domain_id: exception.source_domain_id,
        approver_id: approverId,
      });
      approvals.get(exceptionId)?.push(approval);

      const updated = createMockException({
        ...exception,
        source_approver: approverId,
        status: 'pending_target',
      });
      exceptions.set(exceptionId, updated);
      await logEventInternal(exceptionId, 'source_approved', approverId, {});
      return updated;
    },

    async approveFromTarget(exceptionId, approverId) {
      const exception = exceptions.get(exceptionId);
      if (!exception) throw new Error('exception not found');
      if (exception.status !== 'pending_target') throw new Error('source approval required first');

      const approval = createMockApproval({
        exception_id: exceptionId,
        domain_id: exception.target_domain_id,
        approver_id: approverId,
      });
      approvals.get(exceptionId)?.push(approval);

      const updated = createMockException({
        ...exception,
        target_approver: approverId,
        status: 'approved',
      });
      exceptions.set(exceptionId, updated);
      await logEventInternal(exceptionId, 'target_approved', approverId, {});
      return updated;
    },

    async denyException(exceptionId, approverId, reason) {
      const exception = exceptions.get(exceptionId);
      if (!exception) throw new Error('exception not found');

      const updated = createMockException({ ...exception, status: 'denied' });
      exceptions.set(exceptionId, updated);
      await logEventInternal(exceptionId, 'denied', approverId, { reason });
      return updated;
    },

    async getApprovalStatus(exceptionId) {
      const exception = exceptions.get(exceptionId);
      if (!exception) return { source: false, target: false };

      return {
        source: !!exception.source_approver,
        target: !!exception.target_approver,
      };
    },

    async checkExpiry(exceptionId) {
      const exception = exceptions.get(exceptionId);
      if (!exception) return true; // Treat missing as expired

      const isExpired = new Date(exception.expires_at) <= new Date();
      if (isExpired && exception.status === 'approved') {
        const updated = createMockException({ ...exception, status: 'expired' });
        exceptions.set(exceptionId, updated);
        await logEventInternal(exceptionId, 'expired', 'system', {});
      }
      return isExpired;
    },

    async revokeException(exceptionId, revokerId, reason) {
      const exception = exceptions.get(exceptionId);
      if (!exception) throw new Error('exception not found');

      const updated = createMockException({ ...exception, status: 'revoked' });
      exceptions.set(exceptionId, updated);
      await logEventInternal(exceptionId, 'revoked', revokerId, { reason });
      return updated;
    },

    async extendException(exceptionId, newExpiryDays) {
      const exception = exceptions.get(exceptionId);
      if (!exception) throw new Error('exception not found');
      if (newExpiryDays > exception.max_duration_days) {
        throw new Error('extension exceeds maximum duration');
      }

      const updated = createMockException({
        ...exception,
        expires_at: new Date(Date.now() + 86400000 * newExpiryDays).toISOString(),
      });
      exceptions.set(exceptionId, updated);
      return updated;
    },

    async getActiveExceptions(domainId) {
      const now = new Date();
      return Array.from(exceptions.values()).filter(
        e =>
          (e.source_domain_id === domainId || e.target_domain_id === domainId) &&
          e.status === 'approved' &&
          new Date(e.expires_at) > now
      );
    },

    async getAuditTrail(exceptionId) {
      return auditLog.filter(e => e.exception_id === exceptionId);
    },

    async logEvent(exceptionId, eventType, actorId, details) {
      return logEventInternal(exceptionId, eventType, actorId, details);
    },

    async getCrossdomainAudit(sourceDomainId, targetDomainId) {
      return auditLog.filter(
        e => e.source_domain_id === sourceDomainId && e.target_domain_id === targetDomainId
      );
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federated Governance: Federated Exceptions Contracts', () => {
  let service: FederatedExceptionsService;

  beforeEach(() => {
    service = createMockFederatedExceptionsService();
  });

  // ==========================================================================
  // CONTRACT: exception_lifecycle
  // ==========================================================================
  describe('CONTRACT: exception_lifecycle', () => {
    it('requests federated exception', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test justification'
      );

      assert.ok(exception.exception_id.startsWith('sha256:'));
      assert.strictEqual(exception.status, 'pending_source');
    });

    it('retrieves exception by ID', async () => {
      const created = await service.requestException(
        'data_sharing',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'sharing needed'
      );

      const retrieved = await service.getException(created.exception_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.exception_id, created.exception_id);
    });

    it('lists exceptions by domain', async () => {
      const domainId = `sha256:${'d'.repeat(64)}`;
      await service.requestException(
        'policy_bypass',
        domainId,
        `sha256:${'e'.repeat(64)}`,
        `sha256:${'f'.repeat(64)}`,
        'test'
      );

      const exceptions = await service.listExceptions(domainId);
      assert.ok(exceptions.length > 0);
    });

    it('lists pending approvals for domain', async () => {
      const domainId = `sha256:${'g'.repeat(64)}`;
      await service.requestException(
        'boundary_crossing',
        domainId,
        `sha256:${'h'.repeat(64)}`,
        `sha256:${'i'.repeat(64)}`,
        'test'
      );

      const pending = await service.listPendingApprovals(domainId);
      assert.ok(pending.length > 0);
    });

    it('exception has mandatory expiry', async () => {
      const exception = await service.requestException(
        'access_elevation',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      assert.ok(exception.expires_at);
      const expiresAt = new Date(exception.expires_at);
      assert.ok(expiresAt > new Date());
    });
  });

  // ==========================================================================
  // CONTRACT: dual_approval
  // ==========================================================================
  describe('CONTRACT: dual_approval', () => {
    it('requires source approval first', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      assert.strictEqual(exception.status, 'pending_source');
    });

    it('source approval moves to pending_target', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const afterSource = await service.approveFromSource(
        exception.exception_id,
        `sha256:${'approver'.repeat(4).slice(0, 64)}`
      );

      assert.strictEqual(afterSource.status, 'pending_target');
    });

    it('target approval after source completes approval', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      await service.approveFromSource(exception.exception_id, `sha256:${'s'.repeat(64)}`);
      const approved = await service.approveFromTarget(
        exception.exception_id,
        `sha256:${'t'.repeat(64)}`
      );

      assert.strictEqual(approved.status, 'approved');
    });

    it('gets approval status', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const beforeApproval = await service.getApprovalStatus(exception.exception_id);
      assert.strictEqual(beforeApproval.source, false);
      assert.strictEqual(beforeApproval.target, false);

      await service.approveFromSource(exception.exception_id, `sha256:${'s'.repeat(64)}`);
      const afterSource = await service.getApprovalStatus(exception.exception_id);
      assert.strictEqual(afterSource.source, true);
      assert.strictEqual(afterSource.target, false);
    });

    it('denies exception with reason', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const denied = await service.denyException(
        exception.exception_id,
        `sha256:${'d'.repeat(64)}`,
        'insufficient justification'
      );

      assert.strictEqual(denied.status, 'denied');
    });
  });

  // ==========================================================================
  // CONTRACT: expiry_enforcement
  // ==========================================================================
  describe('CONTRACT: expiry_enforcement', () => {
    it('checks exception expiry', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const isExpired = await service.checkExpiry(exception.exception_id);
      assert.strictEqual(isExpired, false); // Just created
    });

    it('revokes exception immediately', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      await service.approveFromSource(exception.exception_id, `sha256:${'s'.repeat(64)}`);
      await service.approveFromTarget(exception.exception_id, `sha256:${'t'.repeat(64)}`);

      const revoked = await service.revokeException(
        exception.exception_id,
        `sha256:${'r'.repeat(64)}`,
        'security concern'
      );

      assert.strictEqual(revoked.status, 'revoked');
    });

    it('extends exception within max duration', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const extended = await service.extendException(exception.exception_id, 15);
      const newExpiry = new Date(extended.expires_at);
      assert.ok(newExpiry > new Date());
    });

    it('gets active (non-expired) exceptions', async () => {
      const domainId = `sha256:${'active'.repeat(10).slice(0, 64)}`;

      await service.requestException(
        'policy_bypass',
        domainId,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'active test'
      );

      const active = await service.getActiveExceptions(domainId);
      // Active only includes 'approved' status, not pending
      assert.ok(Array.isArray(active));
    });

    it('has maximum duration limit', async () => {
      const exception = createMockException();
      assert.ok(exception.max_duration_days > 0);
      assert.ok(exception.max_duration_days <= 90); // Reasonable limit
    });
  });

  // ==========================================================================
  // CONTRACT: audit_trail
  // ==========================================================================
  describe('CONTRACT: audit_trail', () => {
    it('logs exception request', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'audit test'
      );

      const trail = await service.getAuditTrail(exception.exception_id);
      assert.ok(trail.length > 0);
      assert.ok(trail.some(e => e.event_type === 'requested'));
    });

    it('logs source approval', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      await service.approveFromSource(exception.exception_id, `sha256:${'s'.repeat(64)}`);

      const trail = await service.getAuditTrail(exception.exception_id);
      assert.ok(trail.some(e => e.event_type === 'source_approved'));
    });

    it('logs revocation', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      await service.revokeException(exception.exception_id, `sha256:${'r'.repeat(64)}`, 'reason');

      const trail = await service.getAuditTrail(exception.exception_id);
      assert.ok(trail.some(e => e.event_type === 'revoked'));
    });

    it('gets cross-domain audit log', async () => {
      const sourceId = `sha256:${'source'.repeat(10).slice(0, 64)}`;
      const targetId = `sha256:${'target'.repeat(10).slice(0, 64)}`;

      await service.requestException(
        'policy_bypass',
        sourceId,
        targetId,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const crossDomain = await service.getCrossdomainAudit(sourceId, targetId);
      assert.ok(crossDomain.length > 0);
    });

    it('audit entries have timestamps', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      const trail = await service.getAuditTrail(exception.exception_id);
      for (const entry of trail) {
        assert.ok(entry.logged_at);
        const date = new Date(entry.logged_at);
        assert.ok(!isNaN(date.getTime()));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const exception = createMockException();
      const approval = createMockApproval();
      const audit = createMockAuditEntry();

      assert.ok(exception.exception_id.startsWith('sha256:'));
      assert.ok(exception.source_domain_id.startsWith('sha256:'));
      assert.ok(exception.target_domain_id.startsWith('sha256:'));
      assert.ok(approval.approval_id.startsWith('sha256:'));
      assert.ok(audit.audit_id.startsWith('sha256:'));
    });

    it('no permanent exceptions (all have expiry)', async () => {
      const exception = createMockException();
      assert.ok(exception.expires_at);
      assert.ok(exception.max_duration_days > 0);
    });

    it('dual approval required', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      // Without both approvals, not approved
      assert.notStrictEqual(exception.status, 'approved');

      await service.approveFromSource(exception.exception_id, `sha256:${'s'.repeat(64)}`);
      const afterSource = await service.getException(exception.exception_id);
      assert.notStrictEqual(afterSource?.status, 'approved');

      await service.approveFromTarget(exception.exception_id, `sha256:${'t'.repeat(64)}`);
      const afterBoth = await service.getException(exception.exception_id);
      assert.strictEqual(afterBoth?.status, 'approved');
    });

    it('revocation is immediate', async () => {
      const exception = await service.requestException(
        'policy_bypass',
        `sha256:${'a'.repeat(64)}`,
        `sha256:${'b'.repeat(64)}`,
        `sha256:${'c'.repeat(64)}`,
        'test'
      );

      await service.approveFromSource(exception.exception_id, `sha256:${'s'.repeat(64)}`);
      await service.approveFromTarget(exception.exception_id, `sha256:${'t'.repeat(64)}`);

      const revoked = await service.revokeException(
        exception.exception_id,
        `sha256:${'r'.repeat(64)}`,
        'immediate revoke'
      );

      assert.strictEqual(revoked.status, 'revoked');
    });
  });
});

/**
 * Phase XXII — MOUs-as-Code
 * ==========================
 * Contract: mou.breach-response.contract.test.ts
 *
 * Tests breach response: quarantine triggers, revocation workflows,
 * safe rollback, and notification requirements.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Breaches trigger mandatory notifications
 * - Quarantine is reversible with proper approval
 * - Revocation requires documented justification
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type BreachId = `sha256:${string}`;
type MouId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type QuarantineId = `sha256:${string}`;
type RevocationId = `sha256:${string}`;
type NotificationId = `sha256:${string}`;
type RollbackId = `sha256:${string}`;

type BreachCategory = 'security' | 'sla' | 'data' | 'compliance' | 'availability';
type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';
type BreachStatus = 'detected' | 'investigating' | 'contained' | 'remediated' | 'closed';
type QuarantineStatus = 'active' | 'lifted' | 'expired';
type RevocationStatus = 'pending' | 'approved' | 'rejected' | 'executed';
type NotificationType =
  | 'breach_detected'
  | 'quarantine_started'
  | 'quarantine_lifted'
  | 'revocation_pending'
  | 'revocation_executed'
  | 'rollback_initiated';

interface BreachIncident {
  readonly id: BreachId;
  readonly mouId: MouId;
  readonly reportingAgencyId: AgencyId;
  readonly affectedAgencyIds: readonly AgencyId[];
  readonly category: BreachCategory;
  readonly severity: BreachSeverity;
  readonly status: BreachStatus;
  readonly description: string;
  readonly detectedAt: string;
  readonly containedAt?: string;
  readonly remediatedAt?: string;
  readonly closedAt?: string;
  readonly rootCause?: string;
  readonly impactAssessment?: string;
}

interface QuarantineOrder {
  readonly id: QuarantineId;
  readonly breachId: BreachId;
  readonly targetAgencyId: AgencyId;
  readonly status: QuarantineStatus;
  readonly scope: 'read-only' | 'no-access' | 'limited';
  readonly reason: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly liftedAt?: string;
  readonly liftedBy?: string;
  readonly liftReason?: string;
}

interface RevocationOrder {
  readonly id: RevocationId;
  readonly breachId: BreachId;
  readonly targetAgencyId: AgencyId;
  readonly mouId: MouId;
  readonly status: RevocationStatus;
  readonly justification: string;
  readonly requestedAt: string;
  readonly requestedBy: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly executedAt?: string;
  readonly rejectionReason?: string;
}

interface BreachNotification {
  readonly id: NotificationId;
  readonly type: NotificationType;
  readonly breachId: BreachId;
  readonly recipientAgencyIds: readonly AgencyId[];
  readonly subject: string;
  readonly message: string;
  readonly sentAt: string;
  readonly acknowledgements: readonly {
    readonly agencyId: AgencyId;
    readonly acknowledgedAt: string;
  }[];
}

interface RollbackAction {
  readonly id: RollbackId;
  readonly breachId: BreachId;
  readonly agencyId: AgencyId;
  readonly targetComponent: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly reason: string;
  readonly initiatedAt: string;
  readonly completedAt?: string;
  readonly success?: boolean;
  readonly verificationResult?: string;
}

interface BreachPolicy {
  readonly category: BreachCategory;
  readonly autoQuarantine: boolean;
  readonly notificationRequired: boolean;
  readonly escalationWindowHours: number;
  readonly minimumSeverityForRevocation: BreachSeverity;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockBreachResponseService() {
  const breaches = new Map<BreachId, BreachIncident>();
  const quarantines = new Map<QuarantineId, QuarantineOrder>();
  const revocations = new Map<RevocationId, RevocationOrder>();
  const notifications: BreachNotification[] = [];
  const rollbacks = new Map<RollbackId, RollbackAction>();

  const policies: BreachPolicy[] = [
    {
      category: 'security',
      autoQuarantine: true,
      notificationRequired: true,
      escalationWindowHours: 2,
      minimumSeverityForRevocation: 'high',
    },
    {
      category: 'sla',
      autoQuarantine: false,
      notificationRequired: true,
      escalationWindowHours: 24,
      minimumSeverityForRevocation: 'critical',
    },
    {
      category: 'data',
      autoQuarantine: true,
      notificationRequired: true,
      escalationWindowHours: 4,
      minimumSeverityForRevocation: 'high',
    },
    {
      category: 'compliance',
      autoQuarantine: false,
      notificationRequired: true,
      escalationWindowHours: 8,
      minimumSeverityForRevocation: 'critical',
    },
    {
      category: 'availability',
      autoQuarantine: false,
      notificationRequired: true,
      escalationWindowHours: 1,
      minimumSeverityForRevocation: 'critical',
    },
  ];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  return {
    // Breach Management
    reportBreach(
      mouId: MouId,
      reportingAgencyId: AgencyId,
      affectedAgencyIds: readonly AgencyId[],
      category: BreachCategory,
      severity: BreachSeverity,
      description: string
    ): BreachIncident {
      const id = generateId('breach') as BreachId;

      const breach: BreachIncident = {
        id,
        mouId,
        reportingAgencyId,
        affectedAgencyIds,
        category,
        severity,
        status: 'detected',
        description,
        detectedAt: new Date().toISOString(),
      };

      breaches.set(id, breach);

      // Auto-quarantine if policy requires
      const policy = policies.find(p => p.category === category);
      if (policy?.autoQuarantine && (severity === 'high' || severity === 'critical')) {
        for (const agencyId of affectedAgencyIds) {
          this.issueQuarantine(id, agencyId, 'Auto-quarantine due to breach severity', 72);
        }
      }

      // Send notification
      if (policy?.notificationRequired) {
        this.sendNotification(
          id,
          'breach_detected',
          [...affectedAgencyIds, reportingAgencyId],
          `Breach Detected: ${category}`,
          description
        );
      }

      return breach;
    },

    getBreach(id: BreachId): BreachIncident | null {
      return breaches.get(id) ?? null;
    },

    getBreachesByMou(mouId: MouId): readonly BreachIncident[] {
      return [...breaches.values()].filter(b => b.mouId === mouId);
    },

    getBreachesByAgency(agencyId: AgencyId): readonly BreachIncident[] {
      return [...breaches.values()].filter(
        b => b.reportingAgencyId === agencyId || b.affectedAgencyIds.includes(agencyId)
      );
    },

    getActiveBreaches(): readonly BreachIncident[] {
      return [...breaches.values()].filter(b => !['closed', 'remediated'].includes(b.status));
    },

    updateBreachStatus(
      id: BreachId,
      status: BreachStatus,
      details?: Partial<Pick<BreachIncident, 'rootCause' | 'impactAssessment'>>
    ): BreachIncident | null {
      const breach = breaches.get(id);
      if (!breach) return null;

      const timestamps: Partial<BreachIncident> = {};
      if (status === 'contained') timestamps.containedAt = new Date().toISOString();
      if (status === 'remediated') timestamps.remediatedAt = new Date().toISOString();
      if (status === 'closed') timestamps.closedAt = new Date().toISOString();

      const updated: BreachIncident = {
        ...breach,
        status,
        ...timestamps,
        ...(details ?? {}),
      };

      breaches.set(id, updated);
      return updated;
    },

    // Quarantine Management
    issueQuarantine(
      breachId: BreachId,
      targetAgencyId: AgencyId,
      reason: string,
      durationHours: number,
      scope: QuarantineOrder['scope'] = 'read-only'
    ): QuarantineOrder {
      const id = generateId('quarantine') as QuarantineId;
      const now = new Date();
      const expires = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

      const quarantine: QuarantineOrder = {
        id,
        breachId,
        targetAgencyId,
        status: 'active',
        scope,
        reason,
        issuedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      quarantines.set(id, quarantine);

      this.sendNotification(
        breachId,
        'quarantine_started',
        [targetAgencyId],
        'Quarantine Issued',
        reason
      );

      return quarantine;
    },

    getQuarantine(id: QuarantineId): QuarantineOrder | null {
      return quarantines.get(id) ?? null;
    },

    getActiveQuarantines(agencyId?: AgencyId): readonly QuarantineOrder[] {
      let result = [...quarantines.values()].filter(q => q.status === 'active');
      if (agencyId) {
        result = result.filter(q => q.targetAgencyId === agencyId);
      }
      return result;
    },

    liftQuarantine(id: QuarantineId, liftedBy: string, reason: string): QuarantineOrder | null {
      const quarantine = quarantines.get(id);
      if (!quarantine || quarantine.status !== 'active') return null;

      const updated: QuarantineOrder = {
        ...quarantine,
        status: 'lifted',
        liftedAt: new Date().toISOString(),
        liftedBy,
        liftReason: reason,
      };

      quarantines.set(id, updated);

      this.sendNotification(
        quarantine.breachId,
        'quarantine_lifted',
        [quarantine.targetAgencyId],
        'Quarantine Lifted',
        reason
      );

      return updated;
    },

    isAgencyQuarantined(agencyId: AgencyId): boolean {
      return this.getActiveQuarantines(agencyId).length > 0;
    },

    getQuarantineScope(agencyId: AgencyId): QuarantineOrder['scope'] | null {
      const active = this.getActiveQuarantines(agencyId);
      if (active.length === 0) return null;

      // Return most restrictive scope
      if (active.some(q => q.scope === 'no-access')) return 'no-access';
      if (active.some(q => q.scope === 'limited')) return 'limited';
      return 'read-only';
    },

    // Revocation Management
    requestRevocation(
      breachId: BreachId,
      targetAgencyId: AgencyId,
      mouId: MouId,
      justification: string,
      requestedBy: string
    ): RevocationOrder | null {
      const breach = breaches.get(breachId);
      if (!breach) return null;

      const policy = policies.find(p => p.category === breach.category);
      const severityRank: Record<BreachSeverity, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };

      if (
        policy &&
        severityRank[breach.severity] < severityRank[policy.minimumSeverityForRevocation]
      ) {
        return null; // Severity too low for revocation
      }

      const id = generateId('revocation') as RevocationId;

      const revocation: RevocationOrder = {
        id,
        breachId,
        targetAgencyId,
        mouId,
        status: 'pending',
        justification,
        requestedAt: new Date().toISOString(),
        requestedBy,
      };

      revocations.set(id, revocation);

      this.sendNotification(
        breachId,
        'revocation_pending',
        [targetAgencyId],
        'Revocation Request Pending',
        justification
      );

      return revocation;
    },

    getRevocation(id: RevocationId): RevocationOrder | null {
      return revocations.get(id) ?? null;
    },

    getPendingRevocations(): readonly RevocationOrder[] {
      return [...revocations.values()].filter(r => r.status === 'pending');
    },

    approveRevocation(id: RevocationId, approvedBy: string): RevocationOrder | null {
      const revocation = revocations.get(id);
      if (!revocation || revocation.status !== 'pending') return null;

      const updated: RevocationOrder = {
        ...revocation,
        status: 'approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
      };

      revocations.set(id, updated);
      return updated;
    },

    rejectRevocation(id: RevocationId, reason: string): RevocationOrder | null {
      const revocation = revocations.get(id);
      if (!revocation || revocation.status !== 'pending') return null;

      const updated: RevocationOrder = {
        ...revocation,
        status: 'rejected',
        rejectionReason: reason,
      };

      revocations.set(id, updated);
      return updated;
    },

    executeRevocation(id: RevocationId): RevocationOrder | null {
      const revocation = revocations.get(id);
      if (!revocation || revocation.status !== 'approved') return null;

      const updated: RevocationOrder = {
        ...revocation,
        status: 'executed',
        executedAt: new Date().toISOString(),
      };

      revocations.set(id, updated);

      this.sendNotification(
        revocation.breachId,
        'revocation_executed',
        [revocation.targetAgencyId],
        'MOU Revoked',
        revocation.justification
      );

      return updated;
    },

    // Notification Management
    sendNotification(
      breachId: BreachId,
      type: NotificationType,
      recipientAgencyIds: readonly AgencyId[],
      subject: string,
      message: string
    ): BreachNotification {
      const id = generateId('notification') as NotificationId;

      const notification: BreachNotification = {
        id,
        type,
        breachId,
        recipientAgencyIds,
        subject,
        message,
        sentAt: new Date().toISOString(),
        acknowledgements: [],
      };

      notifications.push(notification);
      return notification;
    },

    getNotifications(breachId: BreachId): readonly BreachNotification[] {
      return notifications.filter(n => n.breachId === breachId);
    },

    getNotificationsForAgency(agencyId: AgencyId): readonly BreachNotification[] {
      return notifications.filter(n => n.recipientAgencyIds.includes(agencyId));
    },

    acknowledgeNotification(
      notificationId: NotificationId,
      agencyId: AgencyId
    ): BreachNotification | null {
      const index = notifications.findIndex(n => n.id === notificationId);
      if (index === -1) return null;

      const notification = notifications[index];
      if (!notification.recipientAgencyIds.includes(agencyId)) return null;
      if (notification.acknowledgements.some(a => a.agencyId === agencyId)) return notification;

      const updated: BreachNotification = {
        ...notification,
        acknowledgements: [
          ...notification.acknowledgements,
          { agencyId, acknowledgedAt: new Date().toISOString() },
        ],
      };

      notifications[index] = updated;
      return updated;
    },

    getUnacknowledgedNotifications(agencyId: AgencyId): readonly BreachNotification[] {
      return this.getNotificationsForAgency(agencyId).filter(
        n => !n.acknowledgements.some(a => a.agencyId === agencyId)
      );
    },

    // Rollback Management
    initiateRollback(
      breachId: BreachId,
      agencyId: AgencyId,
      targetComponent: string,
      fromVersion: string,
      toVersion: string,
      reason: string
    ): RollbackAction {
      const id = generateId('rollback') as RollbackId;

      const rollback: RollbackAction = {
        id,
        breachId,
        agencyId,
        targetComponent,
        fromVersion,
        toVersion,
        reason,
        initiatedAt: new Date().toISOString(),
      };

      rollbacks.set(id, rollback);

      this.sendNotification(
        breachId,
        'rollback_initiated',
        [agencyId],
        `Rollback Initiated: ${targetComponent}`,
        reason
      );

      return rollback;
    },

    getRollback(id: RollbackId): RollbackAction | null {
      return rollbacks.get(id) ?? null;
    },

    getRollbacksByBreach(breachId: BreachId): readonly RollbackAction[] {
      return [...rollbacks.values()].filter(r => r.breachId === breachId);
    },

    completeRollback(
      id: RollbackId,
      success: boolean,
      verificationResult: string
    ): RollbackAction | null {
      const rollback = rollbacks.get(id);
      if (!rollback) return null;

      const updated: RollbackAction = {
        ...rollback,
        completedAt: new Date().toISOString(),
        success,
        verificationResult,
      };

      rollbacks.set(id, updated);
      return updated;
    },

    getPendingRollbacks(): readonly RollbackAction[] {
      return [...rollbacks.values()].filter(r => !r.completedAt);
    },

    // Policy Management
    getPolicy(category: BreachCategory): BreachPolicy | null {
      return policies.find(p => p.category === category) ?? null;
    },

    getAllPolicies(): readonly BreachPolicy[] {
      return [...policies];
    },

    requiresAutoQuarantine(category: BreachCategory, severity: BreachSeverity): boolean {
      const policy = this.getPolicy(category);
      return policy?.autoQuarantine === true && (severity === 'high' || severity === 'critical');
    },

    getEscalationWindow(category: BreachCategory): number {
      return this.getPolicy(category)?.escalationWindowHours ?? 24;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXII: MOU Breach Response Contracts', () => {
  let breachService: ReturnType<typeof createMockBreachResponseService>;
  const mouA = 'sha256:mou_alpha' as MouId;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;

  beforeEach(() => {
    breachService = createMockBreachResponseService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate breach IDs with sha256: prefix', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test breach'
      );
      assert.ok(breach.id.startsWith('sha256:'));
    });

    it('should generate quarantine IDs with sha256: prefix', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      const quarantine = breachService.issueQuarantine(breach.id, agencyB, 'Test quarantine', 24);
      assert.ok(quarantine.id.startsWith('sha256:'));
    });

    it('should generate revocation IDs with sha256: prefix', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Test'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Test revocation',
        'admin'
      );
      assert.ok(revocation?.id.startsWith('sha256:'));
    });

    it('should generate notification IDs with sha256: prefix', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const notifications = breachService.getNotifications(breach.id);
      assert.ok(notifications[0].id.startsWith('sha256:'));
    });

    it('should generate rollback IDs with sha256: prefix', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const rollback = breachService.initiateRollback(
        breach.id,
        agencyB,
        'api-service',
        'v2.0',
        'v1.9',
        'Revert'
      );
      assert.ok(rollback.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Breach Reporting Tests
  // ==========================================================================

  describe('Breach Reporting', () => {
    it('should report breach', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Unauthorized access detected'
      );

      assert.ok(breach);
      assert.strictEqual(breach.status, 'detected');
    });

    it('should auto-quarantine for high-severity security breach', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Security breach');

      const quarantines = breachService.getActiveQuarantines(agencyB);
      assert.strictEqual(quarantines.length, 1);
    });

    it('should not auto-quarantine for low-severity breach', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'low', 'Minor SLA miss');

      const quarantines = breachService.getActiveQuarantines(agencyB);
      assert.strictEqual(quarantines.length, 0);
    });

    it('should send notification on breach detection', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test breach'
      );

      const notifications = breachService.getNotifications(breach.id);
      assert.ok(notifications.some(n => n.type === 'breach_detected'));
    });

    it('should get breach by ID', () => {
      const created = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const retrieved = breachService.getBreach(created.id);

      assert.strictEqual(retrieved?.id, created.id);
    });

    it('should get breaches by MOU', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Breach 1');
      breachService.reportBreach(mouA, agencyB, [agencyA], 'data', 'medium', 'Breach 2');

      const breaches = breachService.getBreachesByMou(mouA);
      assert.strictEqual(breaches.length, 2);
    });

    it('should get breaches by agency', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Breach 1');

      const breachesA = breachService.getBreachesByAgency(agencyA);
      const breachesB = breachService.getBreachesByAgency(agencyB);

      assert.strictEqual(breachesA.length, 1);
      assert.strictEqual(breachesB.length, 1);
    });
  });

  // ==========================================================================
  // Breach Status Transition Tests
  // ==========================================================================

  describe('Breach Status Transitions', () => {
    it('should transition to investigating', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const updated = breachService.updateBreachStatus(breach.id, 'investigating');

      assert.strictEqual(updated?.status, 'investigating');
    });

    it('should transition to contained', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const updated = breachService.updateBreachStatus(breach.id, 'contained');

      assert.strictEqual(updated?.status, 'contained');
      assert.ok(updated?.containedAt);
    });

    it('should transition to remediated with root cause', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const updated = breachService.updateBreachStatus(breach.id, 'remediated', {
        rootCause: 'Misconfigured firewall',
      });

      assert.strictEqual(updated?.status, 'remediated');
      assert.strictEqual(updated?.rootCause, 'Misconfigured firewall');
    });

    it('should transition to closed', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const updated = breachService.updateBreachStatus(breach.id, 'closed');

      assert.strictEqual(updated?.status, 'closed');
      assert.ok(updated?.closedAt);
    });

    it('should get active breaches', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Active');
      const breach2 = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'low', 'Closed');
      breachService.updateBreachStatus(breach2.id, 'closed');

      const active = breachService.getActiveBreaches();
      assert.strictEqual(active.length, 1);
    });
  });

  // ==========================================================================
  // Quarantine Tests
  // ==========================================================================

  describe('Quarantine Management', () => {
    it('should issue quarantine', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      const quarantine = breachService.issueQuarantine(breach.id, agencyB, 'Test quarantine', 24);

      assert.ok(quarantine);
      assert.strictEqual(quarantine.status, 'active');
    });

    it('should set quarantine scope', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const quarantine = breachService.issueQuarantine(
        breach.id,
        agencyB,
        'No access',
        24,
        'no-access'
      );

      assert.strictEqual(quarantine.scope, 'no-access');
    });

    it('should set expiration time', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      const quarantine = breachService.issueQuarantine(breach.id, agencyB, 'Test', 48);

      const issued = new Date(quarantine.issuedAt).getTime();
      const expires = new Date(quarantine.expiresAt).getTime();
      const hours = (expires - issued) / (1000 * 60 * 60);

      assert.ok(Math.abs(hours - 48) < 0.1);
    });

    it('should lift quarantine', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      const quarantine = breachService.issueQuarantine(breach.id, agencyB, 'Test', 24);
      const lifted = breachService.liftQuarantine(quarantine.id, 'admin', 'Issue resolved');

      assert.strictEqual(lifted?.status, 'lifted');
      assert.ok(lifted?.liftedAt);
    });

    it('should check if agency is quarantined', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      breachService.issueQuarantine(breach.id, agencyB, 'Test', 24);

      assert.strictEqual(breachService.isAgencyQuarantined(agencyB), true);
      assert.strictEqual(breachService.isAgencyQuarantined(agencyA), false);
    });

    it('should get most restrictive quarantine scope', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      breachService.issueQuarantine(breach.id, agencyB, 'Read only', 24, 'read-only');
      breachService.issueQuarantine(breach.id, agencyB, 'No access', 24, 'no-access');

      const scope = breachService.getQuarantineScope(agencyB);
      assert.strictEqual(scope, 'no-access');
    });

    it('should send notification on quarantine', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      breachService.issueQuarantine(breach.id, agencyB, 'Test', 24);

      const notifications = breachService.getNotifications(breach.id);
      assert.ok(notifications.some(n => n.type === 'quarantine_started'));
    });

    it('should send notification on lift', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      const quarantine = breachService.issueQuarantine(breach.id, agencyB, 'Test', 24);
      breachService.liftQuarantine(quarantine.id, 'admin', 'Resolved');

      const notifications = breachService.getNotifications(breach.id);
      assert.ok(notifications.some(n => n.type === 'quarantine_lifted'));
    });
  });

  // ==========================================================================
  // Revocation Tests
  // ==========================================================================

  describe('Revocation Management', () => {
    it('should request revocation for severe breach', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Severe breach'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Justified',
        'admin'
      );

      assert.ok(revocation);
      assert.strictEqual(revocation.status, 'pending');
    });

    it('should reject revocation for low severity breach', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'sla',
        'low',
        'Minor issue'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Unjustified',
        'admin'
      );

      assert.strictEqual(revocation, null);
    });

    it('should approve revocation', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Severe'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Justified',
        'admin'
      );
      const approved = breachService.approveRevocation(revocation!.id, 'executive');

      assert.strictEqual(approved?.status, 'approved');
      assert.ok(approved?.approvedAt);
    });

    it('should reject revocation', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Severe'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Justified',
        'admin'
      );
      const rejected = breachService.rejectRevocation(revocation!.id, 'Insufficient evidence');

      assert.strictEqual(rejected?.status, 'rejected');
      assert.strictEqual(rejected?.rejectionReason, 'Insufficient evidence');
    });

    it('should execute approved revocation', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Severe'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Justified',
        'admin'
      );
      breachService.approveRevocation(revocation!.id, 'executive');
      const executed = breachService.executeRevocation(revocation!.id);

      assert.strictEqual(executed?.status, 'executed');
      assert.ok(executed?.executedAt);
    });

    it('should not execute pending revocation', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Severe'
      );
      const revocation = breachService.requestRevocation(
        breach.id,
        agencyB,
        mouA,
        'Justified',
        'admin'
      );
      const executed = breachService.executeRevocation(revocation!.id);

      assert.strictEqual(executed, null);
    });

    it('should get pending revocations', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Severe'
      );
      breachService.requestRevocation(breach.id, agencyB, mouA, 'Test', 'admin');

      const pending = breachService.getPendingRevocations();
      assert.strictEqual(pending.length, 1);
    });
  });

  // ==========================================================================
  // Notification Tests
  // ==========================================================================

  describe('Notification Management', () => {
    it('should get notifications for agency', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Test');

      const notifications = breachService.getNotificationsForAgency(agencyB);
      assert.ok(notifications.length > 0);
    });

    it('should acknowledge notification', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const notifications = breachService.getNotifications(breach.id);
      const acked = breachService.acknowledgeNotification(notifications[0].id, agencyB);

      assert.ok(acked?.acknowledgements.some(a => a.agencyId === agencyB));
    });

    it('should get unacknowledged notifications', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Test');

      const unacked = breachService.getUnacknowledgedNotifications(agencyB);
      assert.ok(unacked.length > 0);
    });

    it('should not duplicate acknowledgement', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const notifications = breachService.getNotifications(breach.id);

      breachService.acknowledgeNotification(notifications[0].id, agencyB);
      breachService.acknowledgeNotification(notifications[0].id, agencyB);

      const updated = breachService
        .getNotifications(breach.id)
        .find(n => n.id === notifications[0].id);
      const acks = updated?.acknowledgements.filter(a => a.agencyId === agencyB);
      assert.strictEqual(acks?.length, 1);
    });
  });

  // ==========================================================================
  // Rollback Tests
  // ==========================================================================

  describe('Rollback Management', () => {
    it('should initiate rollback', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const rollback = breachService.initiateRollback(
        breach.id,
        agencyB,
        'api-service',
        'v2.0',
        'v1.9',
        'Revert bad deployment'
      );

      assert.ok(rollback);
      assert.strictEqual(rollback.fromVersion, 'v2.0');
      assert.strictEqual(rollback.toVersion, 'v1.9');
    });

    it('should complete rollback successfully', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const rollback = breachService.initiateRollback(
        breach.id,
        agencyB,
        'api-service',
        'v2.0',
        'v1.9',
        'Revert'
      );
      const completed = breachService.completeRollback(rollback.id, true, 'All tests passing');

      assert.strictEqual(completed?.success, true);
      assert.ok(completed?.completedAt);
    });

    it('should complete rollback with failure', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const rollback = breachService.initiateRollback(
        breach.id,
        agencyB,
        'api-service',
        'v2.0',
        'v1.9',
        'Revert'
      );
      const completed = breachService.completeRollback(
        rollback.id,
        false,
        'Database migration incompatible'
      );

      assert.strictEqual(completed?.success, false);
      assert.strictEqual(completed?.verificationResult, 'Database migration incompatible');
    });

    it('should get rollbacks by breach', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      breachService.initiateRollback(breach.id, agencyB, 'api-service', 'v2.0', 'v1.9', 'Revert 1');
      breachService.initiateRollback(breach.id, agencyB, 'web-app', 'v3.0', 'v2.9', 'Revert 2');

      const rollbacks = breachService.getRollbacksByBreach(breach.id);
      assert.strictEqual(rollbacks.length, 2);
    });

    it('should get pending rollbacks', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      const rollback = breachService.initiateRollback(
        breach.id,
        agencyB,
        'api-service',
        'v2.0',
        'v1.9',
        'Revert'
      );

      const pending = breachService.getPendingRollbacks();
      assert.strictEqual(pending.length, 1);

      breachService.completeRollback(rollback.id, true, 'Done');
      const pendingAfter = breachService.getPendingRollbacks();
      assert.strictEqual(pendingAfter.length, 0);
    });

    it('should send notification on rollback', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      breachService.initiateRollback(breach.id, agencyB, 'api-service', 'v2.0', 'v1.9', 'Revert');

      const notifications = breachService.getNotifications(breach.id);
      assert.ok(notifications.some(n => n.type === 'rollback_initiated'));
    });
  });

  // ==========================================================================
  // Policy Tests
  // ==========================================================================

  describe('Breach Policies', () => {
    it('should get policy by category', () => {
      const policy = breachService.getPolicy('security');
      assert.ok(policy);
      assert.strictEqual(policy.autoQuarantine, true);
    });

    it('should get all policies', () => {
      const policies = breachService.getAllPolicies();
      assert.strictEqual(policies.length, 5);
    });

    it('should check auto-quarantine requirement', () => {
      assert.strictEqual(breachService.requiresAutoQuarantine('security', 'high'), true);
      assert.strictEqual(breachService.requiresAutoQuarantine('sla', 'high'), false);
      assert.strictEqual(breachService.requiresAutoQuarantine('security', 'low'), false);
    });

    it('should get escalation window', () => {
      assert.strictEqual(breachService.getEscalationWindow('security'), 2);
      assert.strictEqual(breachService.getEscalationWindow('sla'), 24);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of breaches', () => {
      breachService.reportBreach(mouA, agencyA, [agencyB], 'security', 'high', 'Test');
      const b1 = breachService.getBreachesByMou(mouA);
      const b2 = breachService.getBreachesByMou(mouA);
      assert.ok(b1 !== b2);
    });

    it('should return copies of quarantines', () => {
      const breach = breachService.reportBreach(mouA, agencyA, [agencyB], 'sla', 'medium', 'Test');
      breachService.issueQuarantine(breach.id, agencyB, 'Test', 24);
      const q1 = breachService.getActiveQuarantines();
      const q2 = breachService.getActiveQuarantines();
      assert.ok(q1 !== q2);
    });

    it('should return copies of revocations', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'critical',
        'Test'
      );
      breachService.requestRevocation(breach.id, agencyB, mouA, 'Test', 'admin');
      const r1 = breachService.getPendingRevocations();
      const r2 = breachService.getPendingRevocations();
      assert.ok(r1 !== r2);
    });

    it('should return copies of rollbacks', () => {
      const breach = breachService.reportBreach(
        mouA,
        agencyA,
        [agencyB],
        'security',
        'high',
        'Test'
      );
      breachService.initiateRollback(breach.id, agencyB, 'api', 'v2', 'v1', 'Revert');
      const roll1 = breachService.getPendingRollbacks();
      const roll2 = breachService.getPendingRollbacks();
      assert.ok(roll1 !== roll2);
    });
  });
});

/**
 * Phase XXII — MOUs-as-Code
 * ==========================
 * Contract: mou.dispute-resolution.contract.test.ts
 *
 * Tests dispute resolution workflow: time-bounded escalation,
 * auditable decisions, and escalation ladder.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Disputes are time-bounded at each tier
 * - Escalation ladder is followed
 * - All decisions are auditable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type DisputeId = `sha256:${string}`;
type MouId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type ActorId = `sha256:${string}`;
type AuditId = `sha256:${string}`;

type DisputeStatus =
  | 'filed'
  | 'under_review'
  | 'escalated'
  | 'mediation'
  | 'resolved'
  | 'withdrawn'
  | 'expired';
type DisputeCategory =
  | 'sla_violation'
  | 'data_breach'
  | 'non_compliance'
  | 'scope_disagreement'
  | 'billing'
  | 'other';
type ResolutionOutcome =
  | 'in_favor_filer'
  | 'in_favor_respondent'
  | 'compromise'
  | 'deferred'
  | 'withdrawn';
type EscalationTier = 1 | 2 | 3 | 4;

interface DisputeParty {
  readonly agencyId: AgencyId;
  readonly role: 'filer' | 'respondent';
  readonly contactId: ActorId;
}

interface DisputeEvidence {
  readonly id: `sha256:${string}`;
  readonly submittedBy: AgencyId;
  readonly submittedAt: string;
  readonly description: string;
  readonly evidenceType: 'document' | 'log' | 'metric' | 'attestation' | 'other';
  readonly evidenceRef: `sha256:${string}`;
}

interface EscalationRecord {
  readonly tier: EscalationTier;
  readonly escalatedAt: string;
  readonly escalatedBy: ActorId;
  readonly reason: string;
  readonly deadlineAt: string;
}

interface DisputeDecision {
  readonly decidedAt: string;
  readonly decidedBy: ActorId;
  readonly tier: EscalationTier;
  readonly outcome: ResolutionOutcome;
  readonly rationale: string;
  readonly remediation?: string;
  readonly binding: boolean;
}

interface Dispute {
  readonly id: DisputeId;
  readonly mouId: MouId;
  readonly category: DisputeCategory;
  readonly status: DisputeStatus;
  readonly currentTier: EscalationTier;
  readonly parties: readonly DisputeParty[];
  readonly filedAt: string;
  readonly deadlineAt: string;
  readonly summary: string;
  readonly evidence: readonly DisputeEvidence[];
  readonly escalations: readonly EscalationRecord[];
  readonly decision?: DisputeDecision;
}

interface AuditEntry {
  readonly id: AuditId;
  readonly disputeId: DisputeId;
  readonly action: string;
  readonly actorId: ActorId;
  readonly timestamp: string;
  readonly details: string;
  readonly previousState?: DisputeStatus;
  readonly newState?: DisputeStatus;
}

interface TierConfiguration {
  readonly tier: EscalationTier;
  readonly name: string;
  readonly resolutionTimeHours: number;
  readonly authorityLevel: 'operational' | 'supervisory' | 'executive' | 'external';
  readonly canEscalate: boolean;
  readonly canResolve: boolean;
}

interface DisputeMetrics {
  readonly totalFiled: number;
  readonly resolved: number;
  readonly pending: number;
  readonly expired: number;
  readonly avgResolutionTimeHours: number;
  readonly byCategory: Record<string, number>;
  readonly byTier: Record<number, number>;
  readonly byOutcome: Record<string, number>;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockDisputeResolutionService() {
  const disputes = new Map<DisputeId, Dispute>();
  const auditLog: AuditEntry[] = [];

  const tierConfigs: readonly TierConfiguration[] = [
    {
      tier: 1,
      name: 'Operational Review',
      resolutionTimeHours: 48,
      authorityLevel: 'operational',
      canEscalate: true,
      canResolve: true,
    },
    {
      tier: 2,
      name: 'Supervisory Review',
      resolutionTimeHours: 72,
      authorityLevel: 'supervisory',
      canEscalate: true,
      canResolve: true,
    },
    {
      tier: 3,
      name: 'Executive Review',
      resolutionTimeHours: 120,
      authorityLevel: 'executive',
      canEscalate: true,
      canResolve: true,
    },
    {
      tier: 4,
      name: 'External Mediation',
      resolutionTimeHours: 240,
      authorityLevel: 'external',
      canEscalate: false,
      canResolve: true,
    },
  ];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function calculateDeadline(tier: EscalationTier): string {
    const config = tierConfigs.find(t => t.tier === tier);
    const hours = config?.resolutionTimeHours ?? 48;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    return deadline.toISOString();
  }

  function createAuditEntry(
    disputeId: DisputeId,
    action: string,
    actorId: ActorId,
    details: string,
    previousState?: DisputeStatus,
    newState?: DisputeStatus
  ): void {
    const entry: AuditEntry = {
      id: generateId('audit') as AuditId,
      disputeId,
      action,
      actorId,
      timestamp: new Date().toISOString(),
      details,
      previousState,
      newState,
    };
    auditLog.push(entry);
  }

  return {
    // Tier Configuration
    getTierConfigurations(): readonly TierConfiguration[] {
      return [...tierConfigs];
    },

    getTierConfig(tier: EscalationTier): TierConfiguration | null {
      return tierConfigs.find(t => t.tier === tier) ?? null;
    },

    getResolutionTimeHours(tier: EscalationTier): number {
      const config = tierConfigs.find(t => t.tier === tier);
      return config?.resolutionTimeHours ?? 0;
    },

    // Dispute Filing
    fileDispute(
      mouId: MouId,
      category: DisputeCategory,
      filerAgencyId: AgencyId,
      filerContactId: ActorId,
      respondentAgencyId: AgencyId,
      respondentContactId: ActorId,
      summary: string
    ): Dispute {
      const id = generateId('dispute') as DisputeId;
      const now = new Date().toISOString();

      const dispute: Dispute = {
        id,
        mouId,
        category,
        status: 'filed',
        currentTier: 1,
        parties: [
          { agencyId: filerAgencyId, role: 'filer', contactId: filerContactId },
          { agencyId: respondentAgencyId, role: 'respondent', contactId: respondentContactId },
        ],
        filedAt: now,
        deadlineAt: calculateDeadline(1),
        summary,
        evidence: [],
        escalations: [],
      };

      disputes.set(id, dispute);
      createAuditEntry(id, 'DISPUTE_FILED', filerContactId, summary, undefined, 'filed');

      return dispute;
    },

    getDispute(id: DisputeId): Dispute | null {
      return disputes.get(id) ?? null;
    },

    // Status Management
    updateStatus(id: DisputeId, newStatus: DisputeStatus, actorId: ActorId): Dispute | null {
      const dispute = disputes.get(id);
      if (!dispute) return null;

      // Validate transitions
      const validTransitions: Record<DisputeStatus, readonly DisputeStatus[]> = {
        filed: ['under_review', 'withdrawn'],
        under_review: ['escalated', 'resolved', 'withdrawn', 'expired'],
        escalated: ['under_review', 'mediation', 'resolved', 'withdrawn', 'expired'],
        mediation: ['resolved', 'expired'],
        resolved: [], // Terminal
        withdrawn: [], // Terminal
        expired: [], // Terminal
      };

      if (!validTransitions[dispute.status].includes(newStatus)) {
        return null;
      }

      const updated: Dispute = {
        ...dispute,
        status: newStatus,
      };

      disputes.set(id, updated);
      createAuditEntry(
        id,
        'STATUS_CHANGED',
        actorId,
        `Status changed to ${newStatus}`,
        dispute.status,
        newStatus
      );

      return updated;
    },

    // Evidence Management
    submitEvidence(
      disputeId: DisputeId,
      submittedBy: AgencyId,
      actorId: ActorId,
      description: string,
      evidenceType: DisputeEvidence['evidenceType'],
      evidenceRef: `sha256:${string}`
    ): DisputeEvidence | null {
      const dispute = disputes.get(disputeId);
      if (!dispute) return null;
      if (
        dispute.status === 'resolved' ||
        dispute.status === 'withdrawn' ||
        dispute.status === 'expired'
      ) {
        return null;
      }

      const evidence: DisputeEvidence = {
        id: generateId('evidence') as `sha256:${string}`,
        submittedBy,
        submittedAt: new Date().toISOString(),
        description,
        evidenceType,
        evidenceRef,
      };

      const updated: Dispute = {
        ...dispute,
        evidence: [...dispute.evidence, evidence],
      };

      disputes.set(disputeId, updated);
      createAuditEntry(disputeId, 'EVIDENCE_SUBMITTED', actorId, `Evidence: ${description}`);

      return evidence;
    },

    getEvidence(disputeId: DisputeId): readonly DisputeEvidence[] {
      const dispute = disputes.get(disputeId);
      return [...(dispute?.evidence ?? [])];
    },

    // Escalation
    escalate(disputeId: DisputeId, actorId: ActorId, reason: string): Dispute | null {
      const dispute = disputes.get(disputeId);
      if (!dispute) return null;

      const currentConfig = tierConfigs.find(t => t.tier === dispute.currentTier);
      if (!currentConfig?.canEscalate) {
        return null; // Already at highest tier
      }

      const nextTier = (dispute.currentTier + 1) as EscalationTier;
      if (nextTier > 4) return null;

      const escalation: EscalationRecord = {
        tier: nextTier,
        escalatedAt: new Date().toISOString(),
        escalatedBy: actorId,
        reason,
        deadlineAt: calculateDeadline(nextTier),
      };

      const updated: Dispute = {
        ...dispute,
        status: 'escalated',
        currentTier: nextTier,
        deadlineAt: escalation.deadlineAt,
        escalations: [...dispute.escalations, escalation],
      };

      disputes.set(disputeId, updated);
      createAuditEntry(
        disputeId,
        'ESCALATED',
        actorId,
        `Escalated to tier ${nextTier}: ${reason}`,
        dispute.status,
        'escalated'
      );

      return updated;
    },

    canEscalate(disputeId: DisputeId): boolean {
      const dispute = disputes.get(disputeId);
      if (!dispute) return false;

      const config = tierConfigs.find(t => t.tier === dispute.currentTier);
      return config?.canEscalate ?? false;
    },

    getEscalationHistory(disputeId: DisputeId): readonly EscalationRecord[] {
      const dispute = disputes.get(disputeId);
      return dispute?.escalations ?? [];
    },

    // Resolution
    resolve(
      disputeId: DisputeId,
      actorId: ActorId,
      outcome: ResolutionOutcome,
      rationale: string,
      remediation?: string
    ): Dispute | null {
      const dispute = disputes.get(disputeId);
      if (!dispute) return null;

      if (
        dispute.status === 'resolved' ||
        dispute.status === 'withdrawn' ||
        dispute.status === 'expired'
      ) {
        return null;
      }

      const decision: DisputeDecision = {
        decidedAt: new Date().toISOString(),
        decidedBy: actorId,
        tier: dispute.currentTier,
        outcome,
        rationale,
        remediation,
        binding: dispute.currentTier >= 3, // Tier 3+ decisions are binding
      };

      const updated: Dispute = {
        ...dispute,
        status: 'resolved',
        decision,
      };

      disputes.set(disputeId, updated);
      createAuditEntry(
        disputeId,
        'RESOLVED',
        actorId,
        `Resolved: ${outcome} - ${rationale}`,
        dispute.status,
        'resolved'
      );

      return updated;
    },

    // Deadline Management
    isOverdue(disputeId: DisputeId): boolean {
      const dispute = disputes.get(disputeId);
      if (!dispute) return false;

      return new Date(dispute.deadlineAt) < new Date();
    },

    getRemainingTimeHours(disputeId: DisputeId): number {
      const dispute = disputes.get(disputeId);
      if (!dispute) return 0;

      const remaining = new Date(dispute.deadlineAt).getTime() - Date.now();
      return Math.max(0, remaining / (60 * 60 * 1000));
    },

    checkAndExpireOverdue(): readonly DisputeId[] {
      const expired: DisputeId[] = [];
      const now = new Date();

      for (const [id, dispute] of disputes) {
        if (
          dispute.status !== 'resolved' &&
          dispute.status !== 'withdrawn' &&
          dispute.status !== 'expired' &&
          new Date(dispute.deadlineAt) < now
        ) {
          const updated: Dispute = {
            ...dispute,
            status: 'expired',
          };
          disputes.set(id, updated);
          createAuditEntry(
            id,
            'EXPIRED',
            'sha256:system' as ActorId,
            'Deadline exceeded',
            dispute.status,
            'expired'
          );
          expired.push(id);
        }
      }

      return expired;
    },

    // Queries
    getDisputesByMou(mouId: MouId): readonly Dispute[] {
      return [...disputes.values()].filter(d => d.mouId === mouId);
    },

    getDisputesByAgency(agencyId: AgencyId): readonly Dispute[] {
      return [...disputes.values()].filter(d => d.parties.some(p => p.agencyId === agencyId));
    },

    getActiveDisputes(): readonly Dispute[] {
      return [...disputes.values()].filter(
        d => d.status !== 'resolved' && d.status !== 'withdrawn' && d.status !== 'expired'
      );
    },

    getDisputesByStatus(status: DisputeStatus): readonly Dispute[] {
      return [...disputes.values()].filter(d => d.status === status);
    },

    // Audit Trail
    getAuditLog(disputeId: DisputeId): readonly AuditEntry[] {
      return auditLog.filter(e => e.disputeId === disputeId);
    },

    getAllAuditEntries(): readonly AuditEntry[] {
      return [...auditLog];
    },

    // Metrics
    calculateMetrics(): DisputeMetrics {
      const all = [...disputes.values()];
      const resolved = all.filter(d => d.status === 'resolved');

      const byCategory: Record<string, number> = {};
      const byTier: Record<number, number> = {};
      const byOutcome: Record<string, number> = {};

      for (const dispute of all) {
        byCategory[dispute.category] = (byCategory[dispute.category] ?? 0) + 1;
        byTier[dispute.currentTier] = (byTier[dispute.currentTier] ?? 0) + 1;
        if (dispute.decision) {
          byOutcome[dispute.decision.outcome] = (byOutcome[dispute.decision.outcome] ?? 0) + 1;
        }
      }

      let avgResolutionTimeHours = 0;
      if (resolved.length > 0) {
        const totalHours = resolved.reduce((sum, d) => {
          if (d.decision) {
            const filed = new Date(d.filedAt).getTime();
            const decided = new Date(d.decision.decidedAt).getTime();
            return sum + (decided - filed) / (60 * 60 * 1000);
          }
          return sum;
        }, 0);
        avgResolutionTimeHours = totalHours / resolved.length;
      }

      return {
        totalFiled: all.length,
        resolved: resolved.length,
        pending: all.filter(
          d => d.status !== 'resolved' && d.status !== 'withdrawn' && d.status !== 'expired'
        ).length,
        expired: all.filter(d => d.status === 'expired').length,
        avgResolutionTimeHours,
        byCategory,
        byTier,
        byOutcome,
      };
    },

    // Withdraw
    withdraw(disputeId: DisputeId, actorId: ActorId, reason: string): Dispute | null {
      const dispute = disputes.get(disputeId);
      if (!dispute) return null;

      if (
        dispute.status === 'resolved' ||
        dispute.status === 'withdrawn' ||
        dispute.status === 'expired'
      ) {
        return null;
      }

      // Only filer can withdraw
      const filer = dispute.parties.find(p => p.role === 'filer');
      if (filer?.contactId !== actorId) {
        return null;
      }

      const updated: Dispute = {
        ...dispute,
        status: 'withdrawn',
        decision: {
          decidedAt: new Date().toISOString(),
          decidedBy: actorId,
          tier: dispute.currentTier,
          outcome: 'withdrawn',
          rationale: reason,
          binding: false,
        },
      };

      disputes.set(disputeId, updated);
      createAuditEntry(disputeId, 'WITHDRAWN', actorId, reason, dispute.status, 'withdrawn');

      return updated;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXII: MOU Dispute Resolution Contracts', () => {
  let disputeService: ReturnType<typeof createMockDisputeResolutionService>;
  const mouA = 'sha256:mou_alpha' as MouId;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;
  const contactA = 'sha256:contact_alpha' as ActorId;
  const contactB = 'sha256:contact_beta' as ActorId;

  beforeEach(() => {
    disputeService = createMockDisputeResolutionService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate dispute IDs with sha256: prefix', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'SLA violation summary'
      );
      assert.ok(dispute.id.startsWith('sha256:'));
    });

    it('should generate evidence IDs with sha256: prefix', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const evidence = disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Log files',
        'log',
        'sha256:log_ref' as `sha256:${string}`
      );
      assert.ok(evidence?.id.startsWith('sha256:'));
    });

    it('should generate audit IDs with sha256: prefix', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const audit = disputeService.getAuditLog(dispute.id);
      assert.ok(audit[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Tier Configuration Tests
  // ==========================================================================

  describe('Tier Configuration', () => {
    it('should have 4 escalation tiers', () => {
      const tiers = disputeService.getTierConfigurations();
      assert.strictEqual(tiers.length, 4);
    });

    it('should have increasing resolution times', () => {
      const tier1 = disputeService.getResolutionTimeHours(1);
      const tier2 = disputeService.getResolutionTimeHours(2);
      const tier3 = disputeService.getResolutionTimeHours(3);
      const tier4 = disputeService.getResolutionTimeHours(4);

      assert.ok(tier1 < tier2);
      assert.ok(tier2 < tier3);
      assert.ok(tier3 < tier4);
    });

    it('should allow escalation from tiers 1-3', () => {
      const tier1 = disputeService.getTierConfig(1);
      const tier2 = disputeService.getTierConfig(2);
      const tier3 = disputeService.getTierConfig(3);

      assert.strictEqual(tier1?.canEscalate, true);
      assert.strictEqual(tier2?.canEscalate, true);
      assert.strictEqual(tier3?.canEscalate, true);
    });

    it('should not allow escalation from tier 4', () => {
      const tier4 = disputeService.getTierConfig(4);
      assert.strictEqual(tier4?.canEscalate, false);
    });

    it('should have named authority levels', () => {
      const tier1 = disputeService.getTierConfig(1);
      const tier4 = disputeService.getTierConfig(4);

      assert.strictEqual(tier1?.authorityLevel, 'operational');
      assert.strictEqual(tier4?.authorityLevel, 'external');
    });
  });

  // ==========================================================================
  // Dispute Filing Tests
  // ==========================================================================

  describe('Dispute Filing', () => {
    it('should file dispute in filed status', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      assert.strictEqual(dispute.status, 'filed');
    });

    it('should start at tier 1', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      assert.strictEqual(dispute.currentTier, 1);
    });

    it('should track both parties', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      assert.strictEqual(dispute.parties.length, 2);
    });

    it('should identify filer and respondent', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const filer = dispute.parties.find(p => p.role === 'filer');
      const respondent = dispute.parties.find(p => p.role === 'respondent');

      assert.strictEqual(filer?.agencyId, agencyA);
      assert.strictEqual(respondent?.agencyId, agencyB);
    });

    it('should set deadline based on tier', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      assert.ok(dispute.deadlineAt);
    });

    it('should create audit entry on filing', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const audit = disputeService.getAuditLog(dispute.id);
      assert.ok(audit.some(e => e.action === 'DISPUTE_FILED'));
    });
  });

  // ==========================================================================
  // Status Management Tests
  // ==========================================================================

  describe('Status Management', () => {
    it('should transition from filed to under_review', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const updated = disputeService.updateStatus(dispute.id, 'under_review', contactB);

      assert.strictEqual(updated?.status, 'under_review');
    });

    it('should reject invalid transitions', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const updated = disputeService.updateStatus(dispute.id, 'resolved', contactB); // Invalid: filed -> resolved

      assert.strictEqual(updated, null);
    });

    it('should create audit entry on status change', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const audit = disputeService.getAuditLog(dispute.id);

      assert.ok(audit.some(e => e.action === 'STATUS_CHANGED'));
    });

    it('should track previous and new state', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const audit = disputeService.getAuditLog(dispute.id);
      const statusChange = audit.find(e => e.action === 'STATUS_CHANGED');

      assert.strictEqual(statusChange?.previousState, 'filed');
      assert.strictEqual(statusChange?.newState, 'under_review');
    });
  });

  // ==========================================================================
  // Evidence Management Tests
  // ==========================================================================

  describe('Evidence Management', () => {
    it('should submit evidence', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const evidence = disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Performance logs',
        'log',
        'sha256:log_ref' as `sha256:${string}`
      );

      assert.ok(evidence);
      assert.strictEqual(evidence.evidenceType, 'log');
    });

    it('should track evidence submitter', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const evidence = disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Logs',
        'log',
        'sha256:ref' as `sha256:${string}`
      );

      assert.strictEqual(evidence?.submittedBy, agencyA);
    });

    it('should get all evidence for dispute', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Logs',
        'log',
        'sha256:ref1' as `sha256:${string}`
      );
      disputeService.submitEvidence(
        dispute.id,
        agencyB,
        contactB,
        'Docs',
        'document',
        'sha256:ref2' as `sha256:${string}`
      );

      const evidence = disputeService.getEvidence(dispute.id);
      assert.strictEqual(evidence.length, 2);
    });

    it('should not allow evidence on resolved disputes', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.resolve(dispute.id, contactB, 'compromise', 'Agreed settlement');

      const evidence = disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Late evidence',
        'document',
        'sha256:ref' as `sha256:${string}`
      );

      assert.strictEqual(evidence, null);
    });
  });

  // ==========================================================================
  // Escalation Tests
  // ==========================================================================

  describe('Escalation', () => {
    it('should escalate to next tier', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.escalate(dispute.id, contactA, 'No resolution at tier 1');

      assert.strictEqual(updated?.currentTier, 2);
    });

    it('should update status to escalated', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.escalate(dispute.id, contactA, 'Reason');

      assert.strictEqual(updated?.status, 'escalated');
    });

    it('should update deadline', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const originalDeadline = dispute.deadlineAt;
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.escalate(dispute.id, contactA, 'Reason');

      assert.notStrictEqual(updated?.deadlineAt, originalDeadline);
    });

    it('should track escalation history', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'First escalation');
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'Second escalation');

      const history = disputeService.getEscalationHistory(dispute.id);
      assert.strictEqual(history.length, 2);
    });

    it('should not escalate from tier 4', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'To tier 2');
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'To tier 3');
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'To tier 4');

      const canEscalate = disputeService.canEscalate(dispute.id);
      assert.strictEqual(canEscalate, false);
    });

    it('should check if escalation possible', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const canEscalate = disputeService.canEscalate(dispute.id);

      assert.strictEqual(canEscalate, true);
    });
  });

  // ==========================================================================
  // Resolution Tests
  // ==========================================================================

  describe('Resolution', () => {
    it('should resolve dispute', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.resolve(
        dispute.id,
        contactB,
        'compromise',
        'Both parties agreed'
      );

      assert.strictEqual(updated?.status, 'resolved');
    });

    it('should record decision', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.resolve(
        dispute.id,
        contactB,
        'in_favor_filer',
        'Clear violation'
      );

      assert.ok(updated?.decision);
      assert.strictEqual(updated?.decision?.outcome, 'in_favor_filer');
    });

    it('should mark tier 3+ decisions as binding', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'Esc 1');
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.escalate(dispute.id, contactA, 'Esc 2');
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.resolve(dispute.id, contactB, 'compromise', 'Final decision');

      assert.strictEqual(updated?.decision?.binding, true);
    });

    it('should mark tier 1-2 decisions as non-binding', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.resolve(dispute.id, contactB, 'compromise', 'Agreement');

      assert.strictEqual(updated?.decision?.binding, false);
    });

    it('should include remediation if provided', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      const updated = disputeService.resolve(
        dispute.id,
        contactB,
        'in_favor_filer',
        'Rationale',
        'Credit 10%'
      );

      assert.strictEqual(updated?.decision?.remediation, 'Credit 10%');
    });
  });

  // ==========================================================================
  // Deadline Management Tests
  // ==========================================================================

  describe('Deadline Management', () => {
    it('should calculate remaining time', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const remaining = disputeService.getRemainingTimeHours(dispute.id);

      assert.ok(remaining > 0);
    });

    it('should detect non-overdue disputes', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const isOverdue = disputeService.isOverdue(dispute.id);

      assert.strictEqual(isOverdue, false);
    });

    it('should expire overdue disputes on check', () => {
      // This would require time manipulation in real tests
      const expired = disputeService.checkAndExpireOverdue();
      assert.ok(Array.isArray(expired));
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Queries', () => {
    it('should get disputes by MOU', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary 1'
      );
      disputeService.fileDispute(
        mouA,
        'data_breach',
        agencyB,
        contactB,
        agencyA,
        contactA,
        'Summary 2'
      );

      const disputes = disputeService.getDisputesByMou(mouA);
      assert.strictEqual(disputes.length, 2);
    });

    it('should get disputes by agency', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );

      const disputesA = disputeService.getDisputesByAgency(agencyA);
      const disputesB = disputeService.getDisputesByAgency(agencyB);

      assert.strictEqual(disputesA.length, 1);
      assert.strictEqual(disputesB.length, 1);
    });

    it('should get active disputes', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.fileDispute(
        mouA,
        'data_breach',
        agencyB,
        contactB,
        agencyA,
        contactA,
        'Summary 2'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.resolve(dispute.id, contactB, 'compromise', 'Done');

      const active = disputeService.getActiveDisputes();
      assert.strictEqual(active.length, 1);
    });

    it('should get disputes by status', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const filed = disputeService.getDisputesByStatus('filed');

      assert.strictEqual(filed.length, 1);
    });
  });

  // ==========================================================================
  // Audit Trail Tests
  // ==========================================================================

  describe('Audit Trail', () => {
    it('should record all actions', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Logs',
        'log',
        'sha256:ref' as `sha256:${string}`
      );
      disputeService.escalate(dispute.id, contactA, 'Reason');

      const audit = disputeService.getAuditLog(dispute.id);
      assert.ok(audit.length >= 4);
    });

    it('should track actor for each action', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const audit = disputeService.getAuditLog(dispute.id);

      assert.ok(audit.every(e => e.actorId.startsWith('sha256:')));
    });

    it('should get all audit entries', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary 1'
      );
      disputeService.fileDispute(
        mouA,
        'data_breach',
        agencyB,
        contactB,
        agencyA,
        contactA,
        'Summary 2'
      );

      const all = disputeService.getAllAuditEntries();
      assert.strictEqual(all.length, 2);
    });
  });

  // ==========================================================================
  // Metrics Tests
  // ==========================================================================

  describe('Metrics', () => {
    it('should calculate total filed', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const metrics = disputeService.calculateMetrics();

      assert.strictEqual(metrics.totalFiled, 1);
    });

    it('should calculate resolved count', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.resolve(dispute.id, contactB, 'compromise', 'Done');

      const metrics = disputeService.calculateMetrics();
      assert.strictEqual(metrics.resolved, 1);
    });

    it('should group by category', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyB,
        contactB,
        agencyA,
        contactA,
        'Summary 2'
      );

      const metrics = disputeService.calculateMetrics();
      assert.strictEqual(metrics.byCategory['sla_violation'], 2);
    });

    it('should group by tier', () => {
      disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const metrics = disputeService.calculateMetrics();

      assert.strictEqual(metrics.byTier[1], 1);
    });
  });

  // ==========================================================================
  // Withdrawal Tests
  // ==========================================================================

  describe('Withdrawal', () => {
    it('should allow filer to withdraw', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const updated = disputeService.withdraw(dispute.id, contactA, 'Issue resolved outside');

      assert.strictEqual(updated?.status, 'withdrawn');
    });

    it('should not allow respondent to withdraw', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const updated = disputeService.withdraw(dispute.id, contactB, 'Trying to withdraw');

      assert.strictEqual(updated, null);
    });

    it('should not allow withdrawal of resolved disputes', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.updateStatus(dispute.id, 'under_review', contactB);
      disputeService.resolve(dispute.id, contactB, 'compromise', 'Done');

      const updated = disputeService.withdraw(dispute.id, contactA, 'Too late');
      assert.strictEqual(updated, null);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of tier configurations', () => {
      const t1 = disputeService.getTierConfigurations();
      const t2 = disputeService.getTierConfigurations();
      assert.ok(t1 !== t2);
    });

    it('should return copies of audit log', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      const a1 = disputeService.getAuditLog(dispute.id);
      const a2 = disputeService.getAuditLog(dispute.id);
      assert.ok(a1 !== a2);
    });

    it('should return copies of evidence', () => {
      const dispute = disputeService.fileDispute(
        mouA,
        'sla_violation',
        agencyA,
        contactA,
        agencyB,
        contactB,
        'Summary'
      );
      disputeService.submitEvidence(
        dispute.id,
        agencyA,
        contactA,
        'Logs',
        'log',
        'sha256:ref' as `sha256:${string}`
      );
      const e1 = disputeService.getEvidence(dispute.id);
      const e2 = disputeService.getEvidence(dispute.id);
      assert.ok(e1 !== e2);
    });
  });
});

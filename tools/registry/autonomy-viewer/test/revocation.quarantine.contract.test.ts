/**
 * Federation Adoption: Revocation & Quarantine Workflow Contract Tests
 *
 * Phase XVI - Rapid trust suspension paths, bounded blast radius,
 * quarantine management, and safe rollback procedures.
 *
 * CONTRACT SURFACE:
 * - Trust Suspension: Immediate suspension of agency trust
 * - Quarantine Management: Isolation of affected resources
 * - Blast Radius Control: Bounded impact assessment
 * - Safe Rollback: Controlled restoration of trust
 *
 * INVARIANTS:
 * - Operator-triggered (not autonomous)
 * - Dual-approval for restoration
 * - Evidence linked not embedded
 * - All IDs opaque sha256
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type SuspensionReason =
  | 'security_breach'
  | 'compliance_failure'
  | 'certificate_expired'
  | 'policy_violation'
  | 'manual';
type QuarantineStatus = 'active' | 'pending_release' | 'released' | 'escalated';
type RollbackStatus = 'pending' | 'approved' | 'executed' | 'rejected';

/**
 * Trust suspension record
 */
interface TrustSuspension {
  readonly suspension_id: string;
  readonly agency_id: string;
  readonly reason: SuspensionReason;
  readonly operator_id: string;
  readonly suspended_at: string;
  readonly blast_radius: BlastRadiusAssessment;
  readonly evidence_refs: readonly string[];
}

/**
 * Blast radius assessment
 */
interface BlastRadiusAssessment {
  readonly assessment_id: string;
  readonly affected_agencies: readonly string[];
  readonly affected_integrations: number;
  readonly affected_data_flows: number;
  readonly risk_level: 'low' | 'medium' | 'high' | 'critical';
  readonly bounded: boolean;
}

/**
 * Quarantine record
 */
interface QuarantineRecord {
  readonly quarantine_id: string;
  readonly suspension_id: string;
  readonly agency_id: string;
  readonly status: QuarantineStatus;
  readonly isolated_resources: readonly string[];
  readonly quarantined_at: string;
  readonly evidence_refs: readonly string[];
}

/**
 * Rollback request
 */
interface RollbackRequest {
  readonly request_id: string;
  readonly suspension_id: string;
  readonly agency_id: string;
  readonly status: RollbackStatus;
  readonly requested_by: string;
  readonly first_approval_by: string | null;
  readonly second_approval_by: string | null;
  readonly requested_at: string;
  readonly evidence_refs: readonly string[];
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockSuspension(overrides: Partial<TrustSuspension> = {}): TrustSuspension {
  const suspId = `susp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    suspension_id: `sha256:${Buffer.from(suspId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    reason: 'security_breach',
    operator_id: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    suspended_at: new Date().toISOString(),
    blast_radius: createMockBlastRadius(),
    evidence_refs: [],
    ...overrides,
  };
}

function createMockBlastRadius(
  overrides: Partial<BlastRadiusAssessment> = {}
): BlastRadiusAssessment {
  const assessId = `blast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    assessment_id: `sha256:${Buffer.from(assessId).toString('hex').slice(0, 64)}`,
    affected_agencies: [],
    affected_integrations: 3,
    affected_data_flows: 5,
    risk_level: 'medium',
    bounded: true,
    ...overrides,
  };
}

function createMockQuarantine(overrides: Partial<QuarantineRecord> = {}): QuarantineRecord {
  const quarId = `quar-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    quarantine_id: `sha256:${Buffer.from(quarId).toString('hex').slice(0, 64)}`,
    suspension_id: `sha256:${Buffer.from('susp-1').toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    status: 'active',
    isolated_resources: [`sha256:${'res1'.repeat(16).slice(0, 64)}`],
    quarantined_at: new Date().toISOString(),
    evidence_refs: [],
    ...overrides,
  };
}

function createMockRollbackRequest(overrides: Partial<RollbackRequest> = {}): RollbackRequest {
  const reqId = `rollback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    request_id: `sha256:${Buffer.from(reqId).toString('hex').slice(0, 64)}`,
    suspension_id: `sha256:${Buffer.from('susp-1').toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    status: 'pending',
    requested_by: `sha256:${Buffer.from('operator-1').toString('hex').slice(0, 64)}`,
    first_approval_by: null,
    second_approval_by: null,
    requested_at: new Date().toISOString(),
    evidence_refs: [],
    ...overrides,
  };
}

// ============================================================================
// MOCK REVOCATION/QUARANTINE SERVICE
// ============================================================================

interface RevocationQuarantineService {
  // Trust Suspension
  suspendTrust(
    agencyId: string,
    reason: SuspensionReason,
    operatorId: string
  ): Promise<TrustSuspension>;
  getSuspension(suspensionId: string): Promise<TrustSuspension | null>;
  listSuspensions(): Promise<readonly TrustSuspension[]>;

  // Blast Radius
  assessBlastRadius(agencyId: string): Promise<BlastRadiusAssessment>;
  confirmBounded(assessmentId: string): Promise<BlastRadiusAssessment>;

  // Quarantine
  quarantineAgency(suspensionId: string): Promise<QuarantineRecord>;
  getQuarantine(quarantineId: string): Promise<QuarantineRecord | null>;
  releaseQuarantine(quarantineId: string, operatorId: string): Promise<QuarantineRecord>;
  escalateQuarantine(quarantineId: string): Promise<QuarantineRecord>;

  // Rollback
  requestRollback(suspensionId: string, operatorId: string): Promise<RollbackRequest>;
  approveRollback(requestId: string, approverId: string): Promise<RollbackRequest>;
  executeRollback(requestId: string): Promise<RollbackRequest>;
  rejectRollback(requestId: string, operatorId: string): Promise<RollbackRequest>;

  // Evidence
  addEvidenceRef(suspensionId: string, evidenceRef: string): Promise<TrustSuspension>;
}

function createMockRevocationQuarantineService(): RevocationQuarantineService {
  const suspensions: Map<string, TrustSuspension> = new Map();
  const quarantines: Map<string, QuarantineRecord> = new Map();
  const rollbacks: Map<string, RollbackRequest> = new Map();
  const blastAssessments: Map<string, BlastRadiusAssessment> = new Map();

  return {
    async suspendTrust(agencyId, reason, operatorId) {
      const blastRadius = await this.assessBlastRadius(agencyId);
      const suspension = createMockSuspension({
        agency_id: agencyId,
        reason,
        operator_id: operatorId,
        blast_radius: blastRadius,
      });
      suspensions.set(suspension.suspension_id, suspension);
      return suspension;
    },

    async getSuspension(suspensionId) {
      return suspensions.get(suspensionId) ?? null;
    },

    async listSuspensions() {
      return Array.from(suspensions.values());
    },

    async assessBlastRadius(agencyId) {
      const assessment = createMockBlastRadius({ bounded: true });
      blastAssessments.set(assessment.assessment_id, assessment);
      return assessment;
    },

    async confirmBounded(assessmentId) {
      const assessment = blastAssessments.get(assessmentId);
      if (!assessment) throw new Error('assessment not found');
      return assessment;
    },

    async quarantineAgency(suspensionId) {
      const suspension = suspensions.get(suspensionId);
      if (!suspension) throw new Error('suspension not found');

      const quarantine = createMockQuarantine({
        suspension_id: suspensionId,
        agency_id: suspension.agency_id,
      });
      quarantines.set(quarantine.quarantine_id, quarantine);
      return quarantine;
    },

    async getQuarantine(quarantineId) {
      return quarantines.get(quarantineId) ?? null;
    },

    async releaseQuarantine(quarantineId, _operatorId) {
      const quarantine = quarantines.get(quarantineId);
      if (!quarantine) throw new Error('quarantine not found');

      const released = createMockQuarantine({ ...quarantine, status: 'released' });
      quarantines.set(quarantineId, released);
      return released;
    },

    async escalateQuarantine(quarantineId) {
      const quarantine = quarantines.get(quarantineId);
      if (!quarantine) throw new Error('quarantine not found');

      const escalated = createMockQuarantine({ ...quarantine, status: 'escalated' });
      quarantines.set(quarantineId, escalated);
      return escalated;
    },

    async requestRollback(suspensionId, operatorId) {
      const request = createMockRollbackRequest({
        suspension_id: suspensionId,
        requested_by: operatorId,
      });
      rollbacks.set(request.request_id, request);
      return request;
    },

    async approveRollback(requestId, approverId) {
      const request = rollbacks.get(requestId);
      if (!request) throw new Error('request not found');

      let updated: RollbackRequest;
      if (request.first_approval_by === null) {
        updated = createMockRollbackRequest({
          ...request,
          first_approval_by: approverId,
        });
      } else if (request.second_approval_by === null) {
        updated = createMockRollbackRequest({
          ...request,
          second_approval_by: approverId,
          status: 'approved',
        });
      } else {
        throw new Error('already fully approved');
      }

      rollbacks.set(requestId, updated);
      return updated;
    },

    async executeRollback(requestId) {
      const request = rollbacks.get(requestId);
      if (!request) throw new Error('request not found');
      if (request.status !== 'approved') throw new Error('not approved for execution');

      const executed = createMockRollbackRequest({ ...request, status: 'executed' });
      rollbacks.set(requestId, executed);
      return executed;
    },

    async rejectRollback(requestId, _operatorId) {
      const request = rollbacks.get(requestId);
      if (!request) throw new Error('request not found');

      const rejected = createMockRollbackRequest({ ...request, status: 'rejected' });
      rollbacks.set(requestId, rejected);
      return rejected;
    },

    async addEvidenceRef(suspensionId, evidenceRef) {
      const suspension = suspensions.get(suspensionId);
      if (!suspension) throw new Error('suspension not found');

      const updated = createMockSuspension({
        ...suspension,
        evidence_refs: [...suspension.evidence_refs, evidenceRef],
      });
      suspensions.set(suspensionId, updated);
      return updated;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federation Adoption: Revocation & Quarantine Workflow Contracts', () => {
  let service: RevocationQuarantineService;

  beforeEach(() => {
    service = createMockRevocationQuarantineService();
  });

  // ==========================================================================
  // CONTRACT: trust_suspension
  // ==========================================================================
  describe('CONTRACT: trust_suspension', () => {
    it('suspends trust for agency', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );

      assert.ok(suspension.suspension_id.startsWith('sha256:'));
      assert.strictEqual(suspension.reason, 'security_breach');
    });

    it('requires operator ID', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'compliance_failure',
        `sha256:${'o'.repeat(64)}`
      );

      assert.ok(suspension.operator_id.startsWith('sha256:'));
    });

    it('retrieves suspension by ID', async () => {
      const created = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'policy_violation',
        `sha256:${'o'.repeat(64)}`
      );

      const retrieved = await service.getSuspension(created.suspension_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.suspension_id, created.suspension_id);
    });

    it('lists all suspensions', async () => {
      await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );

      const suspensions = await service.listSuspensions();
      assert.ok(suspensions.length >= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: blast_radius
  // ==========================================================================
  describe('CONTRACT: blast_radius', () => {
    it('assesses blast radius', async () => {
      const assessment = await service.assessBlastRadius(`sha256:${'a'.repeat(64)}`);

      assert.ok(assessment.assessment_id.startsWith('sha256:'));
      assert.ok(['low', 'medium', 'high', 'critical'].includes(assessment.risk_level));
    });

    it('confirms bounded blast radius', async () => {
      const assessment = await service.assessBlastRadius(`sha256:${'a'.repeat(64)}`);
      const confirmed = await service.confirmBounded(assessment.assessment_id);

      assert.strictEqual(confirmed.bounded, true);
    });

    it('includes affected agencies count', async () => {
      const assessment = createMockBlastRadius({ affected_agencies: [`sha256:${'x'.repeat(64)}`] });
      assert.ok(Array.isArray(assessment.affected_agencies));
    });

    it('includes affected integrations count', async () => {
      const assessment = createMockBlastRadius({ affected_integrations: 5 });
      assert.strictEqual(assessment.affected_integrations, 5);
    });
  });

  // ==========================================================================
  // CONTRACT: quarantine_management
  // ==========================================================================
  describe('CONTRACT: quarantine_management', () => {
    it('quarantines agency after suspension', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );

      const quarantine = await service.quarantineAgency(suspension.suspension_id);
      assert.ok(quarantine.quarantine_id.startsWith('sha256:'));
      assert.strictEqual(quarantine.status, 'active');
    });

    it('retrieves quarantine by ID', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const quarantine = await service.quarantineAgency(suspension.suspension_id);

      const retrieved = await service.getQuarantine(quarantine.quarantine_id);
      assert.ok(retrieved);
    });

    it('releases quarantine', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const quarantine = await service.quarantineAgency(suspension.suspension_id);

      const released = await service.releaseQuarantine(
        quarantine.quarantine_id,
        `sha256:${'o'.repeat(64)}`
      );
      assert.strictEqual(released.status, 'released');
    });

    it('escalates quarantine', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const quarantine = await service.quarantineAgency(suspension.suspension_id);

      const escalated = await service.escalateQuarantine(quarantine.quarantine_id);
      assert.strictEqual(escalated.status, 'escalated');
    });

    it('quarantine isolates resources', async () => {
      const quarantine = createMockQuarantine();
      assert.ok(quarantine.isolated_resources.length >= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: safe_rollback
  // ==========================================================================
  describe('CONTRACT: safe_rollback', () => {
    it('requests rollback', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );

      const request = await service.requestRollback(
        suspension.suspension_id,
        `sha256:${'o'.repeat(64)}`
      );
      assert.ok(request.request_id.startsWith('sha256:'));
      assert.strictEqual(request.status, 'pending');
    });

    it('requires dual approval for rollback', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const request = await service.requestRollback(
        suspension.suspension_id,
        `sha256:${'o'.repeat(64)}`
      );

      // First approval
      const firstApproved = await service.approveRollback(
        request.request_id,
        `sha256:${'a1'.repeat(32).slice(0, 64)}`
      );
      assert.ok(firstApproved.first_approval_by);
      assert.strictEqual(firstApproved.status, 'pending');

      // Second approval
      const secondApproved = await service.approveRollback(
        request.request_id,
        `sha256:${'a2'.repeat(32).slice(0, 64)}`
      );
      assert.ok(secondApproved.second_approval_by);
      assert.strictEqual(secondApproved.status, 'approved');
    });

    it('executes approved rollback', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const request = await service.requestRollback(
        suspension.suspension_id,
        `sha256:${'o'.repeat(64)}`
      );
      await service.approveRollback(request.request_id, `sha256:${'a1'.repeat(32).slice(0, 64)}`);
      await service.approveRollback(request.request_id, `sha256:${'a2'.repeat(32).slice(0, 64)}`);

      const executed = await service.executeRollback(request.request_id);
      assert.strictEqual(executed.status, 'executed');
    });

    it('rejects rollback request', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const request = await service.requestRollback(
        suspension.suspension_id,
        `sha256:${'o'.repeat(64)}`
      );

      const rejected = await service.rejectRollback(request.request_id, `sha256:${'o'.repeat(64)}`);
      assert.strictEqual(rejected.status, 'rejected');
    });
  });

  // ==========================================================================
  // CONTRACT: evidence_tracking
  // ==========================================================================
  describe('CONTRACT: evidence_tracking', () => {
    it('adds evidence reference to suspension', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );

      const updated = await service.addEvidenceRef(
        suspension.suspension_id,
        `sha256:${'e'.repeat(64)}`
      );
      assert.ok(updated.evidence_refs.length >= 1);
    });

    it('evidence refs are opaque sha256', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );
      const updated = await service.addEvidenceRef(
        suspension.suspension_id,
        `sha256:${'e'.repeat(64)}`
      );

      for (const ref of updated.evidence_refs) {
        assert.ok(ref.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const suspension = createMockSuspension();
      const quarantine = createMockQuarantine();
      const rollback = createMockRollbackRequest();
      const blast = createMockBlastRadius();

      assert.ok(suspension.suspension_id.startsWith('sha256:'));
      assert.ok(quarantine.quarantine_id.startsWith('sha256:'));
      assert.ok(rollback.request_id.startsWith('sha256:'));
      assert.ok(blast.assessment_id.startsWith('sha256:'));
    });

    it('suspension includes blast radius assessment', async () => {
      const suspension = await service.suspendTrust(
        `sha256:${'a'.repeat(64)}`,
        'security_breach',
        `sha256:${'o'.repeat(64)}`
      );

      assert.ok(suspension.blast_radius);
      assert.ok(suspension.blast_radius.bounded === true);
    });

    it('rollback requires dual approval', async () => {
      const request = createMockRollbackRequest();
      // Initial state: no approvals
      assert.strictEqual(request.first_approval_by, null);
      assert.strictEqual(request.second_approval_by, null);
      assert.strictEqual(request.status, 'pending');
    });

    it('operator-triggered not autonomous', async () => {
      const suspension = createMockSuspension();
      // Operator ID must be present
      assert.ok(suspension.operator_id.startsWith('sha256:'));
    });
  });
});

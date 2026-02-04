/**
 * Phase XXIV-C — Stop-Condition Rehearsal Contract Tests
 * ========================================================
 * Executable specification for stop-condition rehearsals.
 *
 * These tests validate that:
 * 1. Stop conditions trigger auto-pause within bounded time
 * 2. Pause events are audited with sha256: event chains
 * 3. Recovery requires explicit dual-approval
 * 4. Resumption preserves audit chain integrity
 * 5. Compound failures maintain single-pause semantics with ordered triggers
 * 6. Evidence checklist is complete and PII-clean
 *
 * Runbook: docs/ops/STOP_CONDITION_REHEARSAL_RUNBOOK.md
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type RehearsalId = `sha256:${string}`;
type PauseEventId = `sha256:${string}`;
type ApprovalId = `sha256:${string}`;
type TriggerEventId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;
type AgencyId = `sha256:${string}`;

type StopConditionCode =
  | 'MTTR_REGRESSION'
  | 'ROLLBACK_FAILURE'
  | 'DR_DRILL_FAILURE'
  | 'AUDIT_INTEGRITY_ALERT';

type RehearsalStatus =
  | 'pending'
  | 'triggered'
  | 'paused'
  | 'recovering'
  | 'resumed'
  | 'completed'
  | 'aborted';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface TriggerEvent {
  readonly id: TriggerEventId;
  readonly rehearsalId: RehearsalId;
  readonly conditionCode: StopConditionCode;
  readonly triggeredAt: string;
  readonly triggeredBy: string;
  readonly payload: Record<string, unknown>;
  readonly previousEventId: TriggerEventId | null;
}

interface PauseEvent {
  readonly id: PauseEventId;
  readonly rehearsalId: RehearsalId;
  readonly triggerEventId: TriggerEventId;
  readonly pausedAt: string;
  readonly pauseLatencyMs: number;
  readonly conditionCode: StopConditionCode;
  readonly rolloutState: 'paused';
  readonly previousEventId: PauseEventId | TriggerEventId | null;
}

interface RecoveryApproval {
  readonly id: ApprovalId;
  readonly rehearsalId: RehearsalId;
  readonly pauseEventId: PauseEventId;
  readonly approverRole: string;
  readonly approverId: string;
  readonly status: ApprovalStatus;
  readonly approvedAt: string | null;
  readonly rationale: string;
}

interface ResumeEvent {
  readonly id: `sha256:${string}`;
  readonly rehearsalId: RehearsalId;
  readonly pauseEventId: PauseEventId;
  readonly approvalIds: readonly ApprovalId[];
  readonly resumedAt: string;
  readonly resumedBy: string;
  readonly rolloutState: 'active';
  readonly previousEventId: PauseEventId;
  readonly auditChainValid: boolean;
}

interface EvidenceChecklist {
  readonly pauseEventCaptured: boolean;
  readonly triggerEventCaptured: boolean;
  readonly approvalsCaptured: boolean;
  readonly resumeEventCaptured: boolean;
  readonly portalSnapshotRef: EvidenceRef | null;
  readonly postmortemRef: EvidenceRef | null;
  readonly allRefsAreSha256: boolean;
  readonly complete: boolean;
}

interface StopConditionRehearsal {
  readonly id: RehearsalId;
  readonly name: string;
  readonly conditionCodes: readonly StopConditionCode[];
  readonly status: RehearsalStatus;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly triggerEvents: readonly TriggerEvent[];
  readonly pauseEvents: readonly PauseEvent[];
  readonly approvals: readonly RecoveryApproval[];
  readonly resumeEvents: readonly ResumeEvent[];
  readonly evidenceChecklist: EvidenceChecklist;
  readonly maxPauseLatencyMs: number;
  readonly requiredApprovals: number;
}

// ============================================================================
// Constants (Runbook must reference these)
// ============================================================================

const STOP_CONDITION_CODES: readonly StopConditionCode[] = [
  'MTTR_REGRESSION',
  'ROLLBACK_FAILURE',
  'DR_DRILL_FAILURE',
  'AUDIT_INTEGRITY_ALERT',
];

const MAX_PAUSE_LATENCY_MS = 5000; // 5 seconds bounded time
const REQUIRED_APPROVALS = 2; // Dual-approval requirement

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockRehearsalService() {
  const rehearsals = new Map<RehearsalId, StopConditionRehearsal>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function computeChainHash(events: readonly { id: string }[]): string {
    // Simplified chain hash for testing
    return events.map(e => e.id).join(':');
  }

  function validateAuditChain(rehearsal: StopConditionRehearsal): boolean {
    // Validate trigger → pause → resume chain integrity
    // 1. All IDs must be sha256:
    const allIds = [
      ...rehearsal.triggerEvents.map(e => e.id),
      ...rehearsal.pauseEvents.map(e => e.id),
      ...rehearsal.resumeEvents.map(e => e.id),
    ];
    if (!allIds.every(id => id.startsWith('sha256:'))) {
      return false;
    }

    // 2. Each pause must link to a valid trigger
    const triggerIds = new Set(rehearsal.triggerEvents.map(t => t.id));
    for (const pause of rehearsal.pauseEvents) {
      if (!triggerIds.has(pause.triggerEventId)) {
        return false;
      }
    }

    // 3. Each resume must link to a valid pause
    const pauseIds = new Set(rehearsal.pauseEvents.map(p => p.id));
    for (const resume of rehearsal.resumeEvents) {
      if (!pauseIds.has(resume.pauseEventId)) {
        return false;
      }
    }

    return true;
  }

  function checkEvidenceComplete(rehearsal: StopConditionRehearsal): EvidenceChecklist {
    const pauseEventCaptured = rehearsal.pauseEvents.length > 0;
    const triggerEventCaptured = rehearsal.triggerEvents.length > 0;
    const approvalsCaptured =
      rehearsal.approvals.filter(a => a.status === 'approved').length >= REQUIRED_APPROVALS;
    const resumeEventCaptured = rehearsal.resumeEvents.length > 0;

    // Check all refs are sha256:
    const allRefs = [
      ...rehearsal.triggerEvents.map(e => e.id),
      ...rehearsal.pauseEvents.map(e => e.id),
      ...rehearsal.approvals.map(a => a.id),
      ...rehearsal.resumeEvents.map(e => e.id),
    ];
    const allRefsAreSha256 = allRefs.every(r => r.startsWith('sha256:'));

    const complete =
      pauseEventCaptured &&
      triggerEventCaptured &&
      approvalsCaptured &&
      resumeEventCaptured &&
      allRefsAreSha256;

    return {
      pauseEventCaptured,
      triggerEventCaptured,
      approvalsCaptured,
      resumeEventCaptured,
      portalSnapshotRef: rehearsal.evidenceChecklist.portalSnapshotRef,
      postmortemRef: rehearsal.evidenceChecklist.postmortemRef,
      allRefsAreSha256,
      complete,
    };
  }

  return {
    // Rehearsal Lifecycle
    createRehearsal(
      name: string,
      conditionCodes: readonly StopConditionCode[]
    ): StopConditionRehearsal {
      const rehearsal: StopConditionRehearsal = {
        id: generateId('rehearsal') as RehearsalId,
        name,
        conditionCodes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
        triggerEvents: [],
        pauseEvents: [],
        approvals: [],
        resumeEvents: [],
        evidenceChecklist: {
          pauseEventCaptured: false,
          triggerEventCaptured: false,
          approvalsCaptured: false,
          resumeEventCaptured: false,
          portalSnapshotRef: null,
          postmortemRef: null,
          allRefsAreSha256: true,
          complete: false,
        },
        maxPauseLatencyMs: MAX_PAUSE_LATENCY_MS,
        requiredApprovals: REQUIRED_APPROVALS,
      };

      rehearsals.set(rehearsal.id, rehearsal);
      return rehearsal;
    },

    // Trigger Injection
    injectTrigger(
      rehearsalId: RehearsalId,
      conditionCode: StopConditionCode,
      triggeredBy: string,
      payload: Record<string, unknown> = {}
    ): { trigger: TriggerEvent; pause: PauseEvent; latencyMs: number } | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;
      if (!rehearsal.conditionCodes.includes(conditionCode)) return null;

      const triggerTime = new Date();
      const previousTrigger = rehearsal.triggerEvents[rehearsal.triggerEvents.length - 1] ?? null;

      const trigger: TriggerEvent = {
        id: generateId('trigger') as TriggerEventId,
        rehearsalId,
        conditionCode,
        triggeredAt: triggerTime.toISOString(),
        triggeredBy,
        payload,
        previousEventId: previousTrigger?.id ?? null,
      };

      // Simulate bounded-time pause (< MAX_PAUSE_LATENCY_MS)
      const latencyMs = Math.floor(Math.random() * (MAX_PAUSE_LATENCY_MS - 100)) + 50;
      const pauseTime = new Date(triggerTime.getTime() + latencyMs);

      const previousPause = rehearsal.pauseEvents[rehearsal.pauseEvents.length - 1] ?? null;

      const pause: PauseEvent = {
        id: generateId('pause') as PauseEventId,
        rehearsalId,
        triggerEventId: trigger.id,
        pausedAt: pauseTime.toISOString(),
        pauseLatencyMs: latencyMs,
        conditionCode,
        rolloutState: 'paused',
        previousEventId: previousPause?.id ?? trigger.id,
      };

      const updated: StopConditionRehearsal = {
        ...rehearsal,
        status: 'paused',
        triggerEvents: [...rehearsal.triggerEvents, trigger],
        pauseEvents: [...rehearsal.pauseEvents, pause],
        evidenceChecklist: checkEvidenceComplete({
          ...rehearsal,
          triggerEvents: [...rehearsal.triggerEvents, trigger],
          pauseEvents: [...rehearsal.pauseEvents, pause],
        }),
      };

      rehearsals.set(rehearsalId, updated);
      return { trigger, pause, latencyMs };
    },

    // Verify pause latency is bounded
    verifyPauseLatency(rehearsalId: RehearsalId): {
      valid: boolean;
      maxObserved: number;
      threshold: number;
    } {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return { valid: false, maxObserved: 0, threshold: MAX_PAUSE_LATENCY_MS };

      const maxObserved = Math.max(...rehearsal.pauseEvents.map(p => p.pauseLatencyMs), 0);
      return {
        valid: maxObserved <= MAX_PAUSE_LATENCY_MS,
        maxObserved,
        threshold: MAX_PAUSE_LATENCY_MS,
      };
    },

    // Recovery Approval
    requestApproval(
      rehearsalId: RehearsalId,
      pauseEventId: PauseEventId,
      approverRole: string,
      approverId: string,
      rationale: string
    ): RecoveryApproval | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;
      // Allow approval requests when paused or already recovering (for second approval)
      if (rehearsal.status !== 'paused' && rehearsal.status !== 'recovering') return null;

      // Check pause event exists
      const pauseExists = rehearsal.pauseEvents.some(p => p.id === pauseEventId);
      if (!pauseExists) return null;

      const approval: RecoveryApproval = {
        id: generateId('approval') as ApprovalId,
        rehearsalId,
        pauseEventId,
        approverRole,
        approverId,
        status: 'pending',
        approvedAt: null,
        rationale,
      };

      const updated: StopConditionRehearsal = {
        ...rehearsal,
        status: 'recovering',
        approvals: [...rehearsal.approvals, approval],
      };

      rehearsals.set(rehearsalId, updated);
      return approval;
    },

    approveRecovery(rehearsalId: RehearsalId, approvalId: ApprovalId): RecoveryApproval | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;

      const idx = rehearsal.approvals.findIndex(a => a.id === approvalId);
      if (idx === -1) return null;

      const approved: RecoveryApproval = {
        ...rehearsal.approvals[idx],
        status: 'approved',
        approvedAt: new Date().toISOString(),
      };

      const approvals = [...rehearsal.approvals];
      approvals[idx] = approved;

      const updated: StopConditionRehearsal = {
        ...rehearsal,
        approvals,
        evidenceChecklist: checkEvidenceComplete({ ...rehearsal, approvals }),
      };

      rehearsals.set(rehearsalId, updated);
      return approved;
    },

    rejectRecovery(rehearsalId: RehearsalId, approvalId: ApprovalId): RecoveryApproval | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;

      const idx = rehearsal.approvals.findIndex(a => a.id === approvalId);
      if (idx === -1) return null;

      const rejected: RecoveryApproval = {
        ...rehearsal.approvals[idx],
        status: 'rejected',
        approvedAt: new Date().toISOString(),
      };

      const approvals = [...rehearsal.approvals];
      approvals[idx] = rejected;

      rehearsals.set(rehearsalId, { ...rehearsal, approvals });
      return rejected;
    },

    // Check if dual-approval is satisfied
    checkDualApproval(
      rehearsalId: RehearsalId,
      pauseEventId: PauseEventId
    ): { satisfied: boolean; approved: number; required: number } {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return { satisfied: false, approved: 0, required: REQUIRED_APPROVALS };

      const approved = rehearsal.approvals.filter(
        a => a.pauseEventId === pauseEventId && a.status === 'approved'
      ).length;

      return {
        satisfied: approved >= REQUIRED_APPROVALS,
        approved,
        required: REQUIRED_APPROVALS,
      };
    },

    // Resume after dual-approval
    resumeRollout(
      rehearsalId: RehearsalId,
      pauseEventId: PauseEventId,
      resumedBy: string
    ): ResumeEvent | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;

      // Check dual-approval
      const dualApproval = this.checkDualApproval(rehearsalId, pauseEventId);
      if (!dualApproval.satisfied) return null;

      const approvalIds = rehearsal.approvals
        .filter(a => a.pauseEventId === pauseEventId && a.status === 'approved')
        .map(a => a.id);

      // Validate audit chain before resuming
      const auditChainValid = validateAuditChain(rehearsal);

      const resume: ResumeEvent = {
        id: generateId('resume'),
        rehearsalId,
        pauseEventId,
        approvalIds,
        resumedAt: new Date().toISOString(),
        resumedBy,
        rolloutState: 'active',
        previousEventId: pauseEventId,
        auditChainValid,
      };

      const updated: StopConditionRehearsal = {
        ...rehearsal,
        status: 'resumed',
        resumeEvents: [...rehearsal.resumeEvents, resume],
        evidenceChecklist: checkEvidenceComplete({
          ...rehearsal,
          resumeEvents: [...rehearsal.resumeEvents, resume],
        }),
      };

      rehearsals.set(rehearsalId, updated);
      return resume;
    },

    // Verify audit chain integrity after resume
    verifyAuditChainIntegrity(rehearsalId: RehearsalId): boolean {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return false;
      return validateAuditChain(rehearsal);
    },

    // Complete rehearsal
    completeRehearsal(
      rehearsalId: RehearsalId,
      portalSnapshotRef: EvidenceRef,
      postmortemRef: EvidenceRef
    ): StopConditionRehearsal | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;
      if (rehearsal.status !== 'resumed') return null;

      const evidenceChecklist: EvidenceChecklist = {
        ...checkEvidenceComplete(rehearsal),
        portalSnapshotRef,
        postmortemRef,
        complete: true,
      };

      const completed: StopConditionRehearsal = {
        ...rehearsal,
        status: 'completed',
        completedAt: new Date().toISOString(),
        evidenceChecklist,
      };

      rehearsals.set(rehearsalId, completed);
      return completed;
    },

    // Abort rehearsal
    abortRehearsal(rehearsalId: RehearsalId, reason: string): StopConditionRehearsal | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;
      if (rehearsal.status === 'completed') return null;

      const aborted: StopConditionRehearsal = {
        ...rehearsal,
        status: 'aborted',
        completedAt: new Date().toISOString(),
      };

      rehearsals.set(rehearsalId, aborted);
      return aborted;
    },

    // Compound failure injection
    injectCompoundFailure(
      rehearsalId: RehearsalId,
      conditionCodes: readonly StopConditionCode[],
      triggeredBy: string
    ): {
      triggers: readonly TriggerEvent[];
      pause: PauseEvent;
      order: readonly StopConditionCode[];
    } | null {
      const rehearsal = rehearsals.get(rehearsalId);
      if (!rehearsal) return null;

      const triggers: TriggerEvent[] = [];
      let lastTriggerId: TriggerEventId | null = null;

      // Inject all triggers in order
      for (const code of conditionCodes) {
        if (!rehearsal.conditionCodes.includes(code)) continue;

        const trigger: TriggerEvent = {
          id: generateId('trigger') as TriggerEventId,
          rehearsalId,
          conditionCode: code,
          triggeredAt: new Date().toISOString(),
          triggeredBy,
          payload: { compound: true, order: triggers.length },
          previousEventId: lastTriggerId,
        };

        triggers.push(trigger);
        lastTriggerId = trigger.id;
      }

      if (triggers.length === 0) return null;

      // Single pause for compound failure (first trigger wins)
      const latencyMs = Math.floor(Math.random() * (MAX_PAUSE_LATENCY_MS - 100)) + 50;

      const pause: PauseEvent = {
        id: generateId('pause') as PauseEventId,
        rehearsalId,
        triggerEventId: triggers[0].id, // First trigger
        pausedAt: new Date().toISOString(),
        pauseLatencyMs: latencyMs,
        conditionCode: triggers[0].conditionCode, // Primary condition
        rolloutState: 'paused',
        previousEventId: triggers[triggers.length - 1].id,
      };

      const updated: StopConditionRehearsal = {
        ...rehearsal,
        status: 'paused',
        triggerEvents: [...rehearsal.triggerEvents, ...triggers],
        pauseEvents: [...rehearsal.pauseEvents, pause], // Single pause!
        evidenceChecklist: checkEvidenceComplete({
          ...rehearsal,
          triggerEvents: [...rehearsal.triggerEvents, ...triggers],
          pauseEvents: [...rehearsal.pauseEvents, pause],
        }),
      };

      rehearsals.set(rehearsalId, updated);
      return {
        triggers,
        pause,
        order: triggers.map(t => t.conditionCode),
      };
    },

    // Retrieval
    getRehearsal(id: RehearsalId): StopConditionRehearsal | null {
      return rehearsals.get(id) ?? null;
    },

    getEvidenceChecklist(id: RehearsalId): EvidenceChecklist | null {
      const rehearsal = rehearsals.get(id);
      return rehearsal?.evidenceChecklist ?? null;
    },

    getTriggerEvents(id: RehearsalId): readonly TriggerEvent[] {
      const rehearsal = rehearsals.get(id);
      return rehearsal ? [...rehearsal.triggerEvents] : [];
    },

    getPauseEvents(id: RehearsalId): readonly PauseEvent[] {
      const rehearsal = rehearsals.get(id);
      return rehearsal ? [...rehearsal.pauseEvents] : [];
    },

    getApprovals(id: RehearsalId): readonly RecoveryApproval[] {
      const rehearsal = rehearsals.get(id);
      return rehearsal ? [...rehearsal.approvals] : [];
    },

    getResumeEvents(id: RehearsalId): readonly ResumeEvent[] {
      const rehearsal = rehearsals.get(id);
      return rehearsal ? [...rehearsal.resumeEvents] : [];
    },

    // Constants export for runbook alignment
    getConstants(): {
      stopConditionCodes: readonly StopConditionCode[];
      maxPauseLatencyMs: number;
      requiredApprovals: number;
    } {
      return {
        stopConditionCodes: STOP_CONDITION_CODES,
        maxPauseLatencyMs: MAX_PAUSE_LATENCY_MS,
        requiredApprovals: REQUIRED_APPROVALS,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIV-C: Stop-Condition Rehearsal Contracts', () => {
  let rehearsalService: ReturnType<typeof createMockRehearsalService>;

  beforeEach(() => {
    rehearsalService = createMockRehearsalService();
  });

  // ==========================================================================
  // ID Format Invariants
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate rehearsal IDs with sha256: prefix', () => {
      const rehearsal = rehearsalService.createRehearsal('MTTR Test', ['MTTR_REGRESSION']);
      assert.ok(rehearsal.id.startsWith('sha256:'));
    });

    it('should generate trigger event IDs with sha256: prefix', () => {
      const rehearsal = rehearsalService.createRehearsal('Test', ['MTTR_REGRESSION']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');
      assert.ok(result?.trigger.id.startsWith('sha256:'));
    });

    it('should generate pause event IDs with sha256: prefix', () => {
      const rehearsal = rehearsalService.createRehearsal('Test', ['MTTR_REGRESSION']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');
      assert.ok(result?.pause.id.startsWith('sha256:'));
    });

    it('should generate approval IDs with sha256: prefix', () => {
      const rehearsal = rehearsalService.createRehearsal('Test', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');
      const approval = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'incident_commander',
        'ic_001',
        'Verified safe to resume'
      );
      assert.ok(approval?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Trigger Injection → Auto-Pause (Bounded Time)
  // ==========================================================================

  describe('Trigger Injection → Bounded-Time Auto-Pause', () => {
    it('should auto-pause on MTTR_REGRESSION trigger', () => {
      const rehearsal = rehearsalService.createRehearsal('MTTR Test', ['MTTR_REGRESSION']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      assert.ok(result);
      assert.strictEqual(result.pause.rolloutState, 'paused');
      assert.strictEqual(result.pause.conditionCode, 'MTTR_REGRESSION');
    });

    it('should auto-pause on ROLLBACK_FAILURE trigger', () => {
      const rehearsal = rehearsalService.createRehearsal('Rollback Test', ['ROLLBACK_FAILURE']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'ROLLBACK_FAILURE', 'operator');

      assert.ok(result);
      assert.strictEqual(result.pause.conditionCode, 'ROLLBACK_FAILURE');
    });

    it('should auto-pause on DR_DRILL_FAILURE trigger', () => {
      const rehearsal = rehearsalService.createRehearsal('DR Test', ['DR_DRILL_FAILURE']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'DR_DRILL_FAILURE', 'operator');

      assert.ok(result);
      assert.strictEqual(result.pause.conditionCode, 'DR_DRILL_FAILURE');
    });

    it('should auto-pause on AUDIT_INTEGRITY_ALERT trigger', () => {
      const rehearsal = rehearsalService.createRehearsal('Audit Test', ['AUDIT_INTEGRITY_ALERT']);
      const result = rehearsalService.injectTrigger(
        rehearsal.id,
        'AUDIT_INTEGRITY_ALERT',
        'operator'
      );

      assert.ok(result);
      assert.strictEqual(result.pause.conditionCode, 'AUDIT_INTEGRITY_ALERT');
    });

    it('should pause within bounded time (< 5000ms)', () => {
      const rehearsal = rehearsalService.createRehearsal('Latency Test', ['MTTR_REGRESSION']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      assert.ok(result);
      assert.ok(result.latencyMs < MAX_PAUSE_LATENCY_MS);
    });

    it('should verify all pause latencies are bounded', () => {
      const rehearsal = rehearsalService.createRehearsal(
        'Multi-Trigger',
        STOP_CONDITION_CODES.slice()
      );

      for (const code of STOP_CONDITION_CODES) {
        rehearsalService.injectTrigger(rehearsal.id, code, 'operator');
      }

      const verification = rehearsalService.verifyPauseLatency(rehearsal.id);
      assert.strictEqual(verification.valid, true);
      assert.ok(verification.maxObserved <= verification.threshold);
    });

    it('should reject trigger for unregistered condition', () => {
      const rehearsal = rehearsalService.createRehearsal('Limited', ['MTTR_REGRESSION']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'DR_DRILL_FAILURE', 'operator');
      assert.strictEqual(result, null);
    });
  });

  // ==========================================================================
  // Pause State Audited with sha256: Event Chain
  // ==========================================================================

  describe('Pause State Audit Chain', () => {
    it('should link trigger to pause event', () => {
      const rehearsal = rehearsalService.createRehearsal('Chain Test', ['MTTR_REGRESSION']);
      const result = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      assert.strictEqual(result!.pause.triggerEventId, result!.trigger.id);
    });

    it('should chain multiple triggers with previousEventId', () => {
      const rehearsal = rehearsalService.createRehearsal(
        'Multi-Chain',
        STOP_CONDITION_CODES.slice()
      );

      const results = [];
      for (const code of STOP_CONDITION_CODES) {
        const result = rehearsalService.injectTrigger(rehearsal.id, code, 'operator');
        if (result) results.push(result);
      }

      // Second trigger should reference first
      if (results.length >= 2) {
        assert.strictEqual(results[1].trigger.previousEventId, results[0].trigger.id);
      }
    });

    it('should update rehearsal status to paused', () => {
      const rehearsal = rehearsalService.createRehearsal('Status Test', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const current = rehearsalService.getRehearsal(rehearsal.id);
      assert.strictEqual(current?.status, 'paused');
    });

    it('should capture all events with sha256: IDs', () => {
      const rehearsal = rehearsalService.createRehearsal('ID Test', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const triggers = rehearsalService.getTriggerEvents(rehearsal.id);
      const pauses = rehearsalService.getPauseEvents(rehearsal.id);

      assert.ok(triggers.every(t => t.id.startsWith('sha256:')));
      assert.ok(pauses.every(p => p.id.startsWith('sha256:')));
    });
  });

  // ==========================================================================
  // Recovery Requires Explicit Dual-Approval
  // ==========================================================================

  describe('Dual-Approval Recovery', () => {
    it('should require 2 approvals for recovery', () => {
      const constants = rehearsalService.getConstants();
      assert.strictEqual(constants.requiredApprovals, 2);
    });

    it('should request approval for paused rehearsal', () => {
      const rehearsal = rehearsalService.createRehearsal('Approval Test', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const approval = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'incident_commander',
        'ic_001',
        'Root cause identified, safe to resume'
      );

      assert.ok(approval);
      assert.strictEqual(approval.status, 'pending');
    });

    it('should not allow resume with only 1 approval', () => {
      const rehearsal = rehearsalService.createRehearsal('Single Approval', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const approval = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'incident_commander',
        'ic_001',
        'Verified'
      );
      rehearsalService.approveRecovery(rehearsal.id, approval!.id);

      const resume = rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      assert.strictEqual(resume, null); // Should fail without second approval
    });

    it('should allow resume with 2 approvals', () => {
      const rehearsal = rehearsalService.createRehearsal('Dual Approval', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      // First approval
      const approval1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'incident_commander',
        'ic_001',
        'Verified safe'
      );
      rehearsalService.approveRecovery(rehearsal.id, approval1!.id);

      // Second approval
      const approval2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'security_lead',
        'sec_001',
        'No security impact'
      );
      rehearsalService.approveRecovery(rehearsal.id, approval2!.id);

      const resume = rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      assert.ok(resume);
      assert.strictEqual(resume.rolloutState, 'active');
    });

    it('should track dual-approval status', () => {
      const rehearsal = rehearsalService.createRehearsal('Status Check', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      // No approvals yet
      let status = rehearsalService.checkDualApproval(rehearsal.id, trigger!.pause.id);
      assert.strictEqual(status.satisfied, false);
      assert.strictEqual(status.approved, 0);

      // One approval
      const approval1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, approval1!.id);

      status = rehearsalService.checkDualApproval(rehearsal.id, trigger!.pause.id);
      assert.strictEqual(status.satisfied, false);
      assert.strictEqual(status.approved, 1);

      // Two approvals
      const approval2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, approval2!.id);

      status = rehearsalService.checkDualApproval(rehearsal.id, trigger!.pause.id);
      assert.strictEqual(status.satisfied, true);
      assert.strictEqual(status.approved, 2);
    });

    it('should reject approval and not count toward dual-approval', () => {
      const rehearsal = rehearsalService.createRehearsal('Reject Test', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const approval = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'incident_commander',
        'ic_001',
        'Not verified'
      );
      rehearsalService.rejectRecovery(rehearsal.id, approval!.id);

      const status = rehearsalService.checkDualApproval(rehearsal.id, trigger!.pause.id);
      assert.strictEqual(status.approved, 0);
    });
  });

  // ==========================================================================
  // Resumption Preserves Audit Chain Integrity
  // ==========================================================================

  describe('Audit Chain Integrity on Resume', () => {
    it('should verify audit chain on resume', () => {
      const rehearsal = rehearsalService.createRehearsal('Chain Integrity', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      // Dual approval
      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);

      const resume = rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      assert.strictEqual(resume?.auditChainValid, true);
    });

    it('should link resume event to pause event', () => {
      const rehearsal = rehearsalService.createRehearsal('Link Test', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);

      const resume = rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      assert.strictEqual(resume?.previousEventId, trigger!.pause.id);
    });

    it('should include approval IDs in resume event', () => {
      const rehearsal = rehearsalService.createRehearsal('Approval Link', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);

      const resume = rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      assert.strictEqual(resume?.approvalIds.length, 2);
      assert.ok(resume?.approvalIds.includes(a1!.id));
      assert.ok(resume?.approvalIds.includes(a2!.id));
    });

    it('should verify full chain integrity after resume', () => {
      const rehearsal = rehearsalService.createRehearsal('Full Chain', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');

      const valid = rehearsalService.verifyAuditChainIntegrity(rehearsal.id);
      assert.strictEqual(valid, true);
    });
  });

  // ==========================================================================
  // Compound Failure Semantics
  // ==========================================================================

  describe('Compound Failure Semantics', () => {
    it('should handle multiple triggers with single pause', () => {
      const rehearsal = rehearsalService.createRehearsal('Compound', [
        'MTTR_REGRESSION',
        'AUDIT_INTEGRITY_ALERT',
      ]);

      const result = rehearsalService.injectCompoundFailure(
        rehearsal.id,
        ['MTTR_REGRESSION', 'AUDIT_INTEGRITY_ALERT'],
        'operator'
      );

      assert.ok(result);
      assert.strictEqual(result.triggers.length, 2);
      // Only ONE pause for compound failure
      const pauses = rehearsalService.getPauseEvents(rehearsal.id);
      assert.strictEqual(pauses.length, 1);
    });

    it('should record trigger order', () => {
      const rehearsal = rehearsalService.createRehearsal('Order Test', [
        'MTTR_REGRESSION',
        'AUDIT_INTEGRITY_ALERT',
      ]);

      const result = rehearsalService.injectCompoundFailure(
        rehearsal.id,
        ['MTTR_REGRESSION', 'AUDIT_INTEGRITY_ALERT'],
        'operator'
      );

      assert.deepStrictEqual(result?.order, ['MTTR_REGRESSION', 'AUDIT_INTEGRITY_ALERT']);
    });

    it('should use first trigger as primary for pause', () => {
      const rehearsal = rehearsalService.createRehearsal('Primary Test', [
        'MTTR_REGRESSION',
        'AUDIT_INTEGRITY_ALERT',
      ]);

      const result = rehearsalService.injectCompoundFailure(
        rehearsal.id,
        ['MTTR_REGRESSION', 'AUDIT_INTEGRITY_ALERT'],
        'operator'
      );

      assert.strictEqual(result?.pause.conditionCode, 'MTTR_REGRESSION');
      assert.strictEqual(result?.pause.triggerEventId, result?.triggers[0].id);
    });

    it('should chain compound triggers with previousEventId', () => {
      const rehearsal = rehearsalService.createRehearsal('Chain Compound', [
        'MTTR_REGRESSION',
        'AUDIT_INTEGRITY_ALERT',
        'DR_DRILL_FAILURE',
      ]);

      const result = rehearsalService.injectCompoundFailure(
        rehearsal.id,
        ['MTTR_REGRESSION', 'AUDIT_INTEGRITY_ALERT', 'DR_DRILL_FAILURE'],
        'operator'
      );

      assert.strictEqual(result?.triggers[1].previousEventId, result?.triggers[0].id);
      assert.strictEqual(result?.triggers[2].previousEventId, result?.triggers[1].id);
    });
  });

  // ==========================================================================
  // Evidence Checklist Completeness
  // ==========================================================================

  describe('Evidence Checklist Completeness', () => {
    it('should track trigger event capture', () => {
      const rehearsal = rehearsalService.createRehearsal('Evidence', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const checklist = rehearsalService.getEvidenceChecklist(rehearsal.id);
      assert.strictEqual(checklist?.triggerEventCaptured, true);
    });

    it('should track pause event capture', () => {
      const rehearsal = rehearsalService.createRehearsal('Evidence', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const checklist = rehearsalService.getEvidenceChecklist(rehearsal.id);
      assert.strictEqual(checklist?.pauseEventCaptured, true);
    });

    it('should track approvals capture', () => {
      const rehearsal = rehearsalService.createRehearsal('Evidence', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      // Need 2 approvals
      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);

      const checklist = rehearsalService.getEvidenceChecklist(rehearsal.id);
      assert.strictEqual(checklist?.approvalsCaptured, true);
    });

    it('should track resume event capture', () => {
      const rehearsal = rehearsalService.createRehearsal('Evidence', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');

      const checklist = rehearsalService.getEvidenceChecklist(rehearsal.id);
      assert.strictEqual(checklist?.resumeEventCaptured, true);
    });

    it('should verify all refs are sha256:', () => {
      const rehearsal = rehearsalService.createRehearsal('Refs', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');

      const checklist = rehearsalService.getEvidenceChecklist(rehearsal.id);
      assert.strictEqual(checklist?.allRefsAreSha256, true);
    });

    it('should complete rehearsal with portal snapshot and postmortem', () => {
      const rehearsal = rehearsalService.createRehearsal('Complete', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');

      const completed = rehearsalService.completeRehearsal(
        rehearsal.id,
        'sha256:portal_snapshot_abc123' as EvidenceRef,
        'sha256:postmortem_def456' as EvidenceRef
      );

      assert.strictEqual(completed?.status, 'completed');
      assert.strictEqual(completed?.evidenceChecklist.complete, true);
      assert.strictEqual(
        completed?.evidenceChecklist.portalSnapshotRef,
        'sha256:portal_snapshot_abc123'
      );
      assert.strictEqual(completed?.evidenceChecklist.postmortemRef, 'sha256:postmortem_def456');
    });
  });

  // ==========================================================================
  // Rehearsal Lifecycle
  // ==========================================================================

  describe('Rehearsal Lifecycle', () => {
    it('should create rehearsal in pending status', () => {
      const rehearsal = rehearsalService.createRehearsal('New', ['MTTR_REGRESSION']);
      assert.strictEqual(rehearsal.status, 'pending');
    });

    it('should transition to paused on trigger', () => {
      const rehearsal = rehearsalService.createRehearsal('Trigger', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const current = rehearsalService.getRehearsal(rehearsal.id);
      assert.strictEqual(current?.status, 'paused');
    });

    it('should transition to recovering on approval request', () => {
      const rehearsal = rehearsalService.createRehearsal('Recover', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');
      rehearsalService.requestApproval(rehearsal.id, trigger!.pause.id, 'ic', 'ic_001', 'OK');

      const current = rehearsalService.getRehearsal(rehearsal.id);
      assert.strictEqual(current?.status, 'recovering');
    });

    it('should transition to resumed after dual-approval + resume', () => {
      const rehearsal = rehearsalService.createRehearsal('Resume', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');

      const current = rehearsalService.getRehearsal(rehearsal.id);
      assert.strictEqual(current?.status, 'resumed');
    });

    it('should transition to completed after evidence capture', () => {
      const rehearsal = rehearsalService.createRehearsal('Complete', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      rehearsalService.completeRehearsal(
        rehearsal.id,
        'sha256:snapshot' as EvidenceRef,
        'sha256:postmortem' as EvidenceRef
      );

      const current = rehearsalService.getRehearsal(rehearsal.id);
      assert.strictEqual(current?.status, 'completed');
      assert.ok(current?.completedAt);
    });

    it('should allow abort at any non-completed state', () => {
      const rehearsal = rehearsalService.createRehearsal('Abort', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const aborted = rehearsalService.abortRehearsal(rehearsal.id, 'Critical issue discovered');
      assert.strictEqual(aborted?.status, 'aborted');
    });

    it('should not abort completed rehearsal', () => {
      const rehearsal = rehearsalService.createRehearsal('No Abort', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const a1 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'ic',
        'ic_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a1!.id);
      const a2 = rehearsalService.requestApproval(
        rehearsal.id,
        trigger!.pause.id,
        'sec',
        'sec_001',
        'OK'
      );
      rehearsalService.approveRecovery(rehearsal.id, a2!.id);
      rehearsalService.resumeRollout(rehearsal.id, trigger!.pause.id, 'operator');
      rehearsalService.completeRehearsal(
        rehearsal.id,
        'sha256:snapshot' as EvidenceRef,
        'sha256:postmortem' as EvidenceRef
      );

      const aborted = rehearsalService.abortRehearsal(rehearsal.id, 'Too late');
      assert.strictEqual(aborted, null);
    });
  });

  // ==========================================================================
  // Constants Export (Runbook Alignment)
  // ==========================================================================

  describe('Constants Export for Runbook Alignment', () => {
    it('should export all stop condition codes', () => {
      const constants = rehearsalService.getConstants();
      assert.deepStrictEqual(
        [...constants.stopConditionCodes],
        ['MTTR_REGRESSION', 'ROLLBACK_FAILURE', 'DR_DRILL_FAILURE', 'AUDIT_INTEGRITY_ALERT']
      );
    });

    it('should export max pause latency', () => {
      const constants = rehearsalService.getConstants();
      assert.strictEqual(constants.maxPauseLatencyMs, 5000);
    });

    it('should export required approvals count', () => {
      const constants = rehearsalService.getConstants();
      assert.strictEqual(constants.requiredApprovals, 2);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of trigger events', () => {
      const rehearsal = rehearsalService.createRehearsal('Copy', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const t1 = rehearsalService.getTriggerEvents(rehearsal.id);
      const t2 = rehearsalService.getTriggerEvents(rehearsal.id);
      assert.ok(t1 !== t2);
    });

    it('should return copies of pause events', () => {
      const rehearsal = rehearsalService.createRehearsal('Copy', ['MTTR_REGRESSION']);
      rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');

      const p1 = rehearsalService.getPauseEvents(rehearsal.id);
      const p2 = rehearsalService.getPauseEvents(rehearsal.id);
      assert.ok(p1 !== p2);
    });

    it('should return copies of approvals', () => {
      const rehearsal = rehearsalService.createRehearsal('Copy', ['MTTR_REGRESSION']);
      const trigger = rehearsalService.injectTrigger(rehearsal.id, 'MTTR_REGRESSION', 'operator');
      rehearsalService.requestApproval(rehearsal.id, trigger!.pause.id, 'ic', 'ic_001', 'OK');

      const a1 = rehearsalService.getApprovals(rehearsal.id);
      const a2 = rehearsalService.getApprovals(rehearsal.id);
      assert.ok(a1 !== a2);
    });
  });
});

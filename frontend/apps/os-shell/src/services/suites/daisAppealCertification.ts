/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * Dais Appeal Certification Domain Logic
 *
 * Dais-owned appeal outcome recording, certification impact computation,
 * and readiness checks. All mutations guarded by assertWriteLane('dais', 'appeal').
 * Trace events emitted for outcome/readiness/block.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// ============================================================================
// Types
// ============================================================================

export interface OutcomeInput {
  appealId: string;
  parcelId: string;
  hearingId: string;
  packetId: string;
  hearingStatus: 'unscheduled' | 'scheduled' | 'rescheduled' | 'cancelled' | 'blocked';
  packetValid: boolean;
  decision: 'sustained' | 'denied' | 'withdrawn' | 'continued';
  decisionReason: string;
}

export interface AppealOutcome {
  outcomeId: string;
  appealId: string;
  parcelId: string;
  hearingId: string;
  packetId: string;
  decision: 'sustained' | 'denied' | 'withdrawn' | 'continued';
  decisionReason: string;
  status: 'decided';
  decidedAt: string;
}

export interface OutcomeResult {
  success: boolean;
  blockers: string[];
  outcome?: AppealOutcome;
}

export interface CertificationImpact {
  parcelId: string;
  appealId: string;
  impactType: 'value-change' | 'no-change' | 'pending';
  requiresValueAdjustment: boolean;
  checklistItems: string[];
}

export interface CertificationReadinessInput {
  parcelId: string;
  appealId: string;
  outcomeRecorded: boolean;
  decision: 'sustained' | 'denied' | 'withdrawn' | 'continued';
  packetValid: boolean;
  hearingCompleted: boolean;
  noticeGenerated: boolean;
}

export interface CertificationReadinessResult {
  ready: boolean;
  blockers: string[];
}

// ============================================================================
// Helpers
// ============================================================================

function generateOutcomeId(): string {
  return `OUT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Record Appeal Outcome (Dais-owned)
// ============================================================================

export function recordAppealOutcome(input: OutcomeInput): OutcomeResult {
  assertWriteLane('dais', 'appeal');

  const blockers: string[] = [];

  if (!input.appealId || input.appealId.trim() === '') {
    blockers.push('appeal ID is required');
  }

  if (!input.parcelId || input.parcelId.trim() === '') {
    blockers.push('parcel ID is required');
  }

  if (!input.packetValid) {
    blockers.push('packet reference is invalid or revised');
  }

  if (input.hearingStatus === 'unscheduled' || input.hearingStatus === 'blocked') {
    blockers.push('hearing must be scheduled before recording outcome');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'appeal_outcome_blocked',
      'certification',
      input.appealId || 'unknown',
      undefined,
      { blockers },
    );
    return { success: false, blockers };
  }

  const outcomeId = generateOutcomeId();

  const outcome: AppealOutcome = {
    outcomeId,
    appealId: input.appealId,
    parcelId: input.parcelId,
    hearingId: input.hearingId,
    packetId: input.packetId,
    decision: input.decision,
    decisionReason: input.decisionReason,
    status: 'decided',
    decidedAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'appeal_outcome_recorded',
    'certification',
    outcomeId,
    undefined,
    {
      appealId: input.appealId,
      parcelId: input.parcelId,
      decision: input.decision,
    },
  );

  return { success: true, blockers: [], outcome };
}

// ============================================================================
// Compute Certification Impact
// ============================================================================

export function computeCertificationImpact(outcome: AppealOutcome): CertificationImpact {
  const requiresValueAdjustment = outcome.decision === 'sustained';
  const impactType = requiresValueAdjustment ? 'value-change' : 'no-change';

  const checklistItems: string[] = ['appeal-outcome-recorded'];

  if (requiresValueAdjustment) {
    checklistItems.push('value-adjustment-required');
  }

  return {
    parcelId: outcome.parcelId,
    appealId: outcome.appealId,
    impactType,
    requiresValueAdjustment,
    checklistItems,
  };
}

// ============================================================================
// Certification Readiness Check
// ============================================================================

export function checkCertificationReadiness(input: CertificationReadinessInput): CertificationReadinessResult {
  const blockers: string[] = [];

  if (!input.appealId || input.appealId.trim() === '') {
    blockers.push('appeal ID is required');
  }

  if (!input.outcomeRecorded) {
    blockers.push('appeal outcome must be recorded');
  }

  if (!input.packetValid) {
    blockers.push('packet reference is invalid or revised');
  }

  if (!input.hearingCompleted) {
    blockers.push('hearing must be completed');
  }

  if (!input.noticeGenerated) {
    blockers.push('notice must be generated');
  }

  const ready = blockers.length === 0;

  if (ready) {
    emitTraceEvent(
      'certification_readiness_checked',
      'certification',
      input.parcelId,
      undefined,
      { ready: true, appealId: input.appealId },
    );
  } else {
    emitTraceEvent(
      'certification_readiness_blocked',
      'certification',
      input.parcelId,
      undefined,
      { blockers },
    );
  }

  return { ready, blockers };
}

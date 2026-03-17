/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * Dais Appeal Deadline Domain Logic
 *
 * Dais-owned deadline computation, hearing-state tracking, and
 * packet drift detection for appeal workflows.
 *
 * Write-lane: assertWriteLane('dais', 'appeal') guards all mutations.
 * Trace: emits appeal_deadline_created / appeal_deadline_blocked.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// Re-export AppealIntakeRecord for test convenience
export type { AppealIntakeRecord } from './daisAppealIntake';
import type { AppealIntakeRecord } from './daisAppealIntake';

// ============================================================================
// Types
// ============================================================================

export interface DeadlineState {
  appealId: string;
  parcelId: string;
  packetId: string;
  packetValid: boolean;
  filingDeadline: string;
  hearingDeadline: string;
  hearingScheduledAt?: string;
  createdAt: string;
}

export interface DeadlineResult {
  success: boolean;
  blockers: string[];
  deadline?: DeadlineState;
}

export type HearingState = 'unscheduled' | 'scheduled' | 'blocked';

export interface HearingStatusResult {
  hearingState: HearingState;
  blockers: string[];
}

export interface DeadlineDriftResult {
  drifted: boolean;
  reason?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Filing window: 30 days from intake creation */
const FILING_WINDOW_DAYS = 30;

/** Hearing window: 60 days from intake creation */
const HEARING_WINDOW_DAYS = 60;

// ============================================================================
// Deadline Computation (Dais-owned)
// ============================================================================

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function createDeadlineState(intake: AppealIntakeRecord): DeadlineResult {
  // Write-lane enforcement — Dais writes to appeal domain only
  assertWriteLane('dais', 'appeal');

  const blockers: string[] = [];

  if (intake.packetSnapshotStatus !== 'finalized') {
    blockers.push('appeal must reference a finalized packet');
  }

  if (!intake.appealId || intake.appealId.trim() === '') {
    blockers.push('appeal ID is required');
  }

  if (!intake.parcelId || intake.parcelId.trim() === '') {
    blockers.push('parcel ID is required');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'appeal_deadline_blocked',
      'appeal',
      intake.appealId,
      undefined,
      { blockers },
    );

    return { success: false, blockers };
  }

  const deadline: DeadlineState = {
    appealId: intake.appealId,
    parcelId: intake.parcelId,
    packetId: intake.packetId,
    packetValid: true,
    filingDeadline: addDays(intake.createdAt, FILING_WINDOW_DAYS),
    hearingDeadline: addDays(intake.createdAt, HEARING_WINDOW_DAYS),
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'appeal_deadline_created',
    'appeal',
    intake.appealId,
    undefined,
    {
      parcelId: intake.parcelId,
      packetId: intake.packetId,
      hearingState: 'unscheduled',
      filingDeadline: deadline.filingDeadline,
      hearingDeadline: deadline.hearingDeadline,
    },
  );

  return { success: true, blockers: [], deadline };
}

// ============================================================================
// Hearing State
// ============================================================================

export function computeHearingStatus(deadline: DeadlineState): HearingStatusResult {
  const blockers: string[] = [];

  if (!deadline.packetValid) {
    blockers.push('packet reference is invalid or revised');
    return { hearingState: 'blocked', blockers };
  }

  if (deadline.hearingScheduledAt) {
    return { hearingState: 'scheduled', blockers: [] };
  }

  return { hearingState: 'unscheduled', blockers: [] };
}

// ============================================================================
// Packet Drift Detection
// ============================================================================

export function checkDeadlineDrift(
  deadline: DeadlineState,
  currentPacketStatus: 'finalized' | 'draft',
): DeadlineDriftResult {
  if (currentPacketStatus !== 'finalized') {
    return {
      drifted: true,
      reason: `Appeal ${deadline.appealId}: packet has been revised since deadline creation (status: ${currentPacketStatus})`,
    };
  }

  return { drifted: false };
}

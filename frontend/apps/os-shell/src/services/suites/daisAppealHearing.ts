/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * Dais Appeal Hearing Domain Logic
 *
 * Dais-owned hearing scheduling, rescheduling, and cancellation.
 * All mutations guarded by assertWriteLane('dais', 'appeal').
 * Trace events emitted for schedule/reschedule/cancel/block.
 *
 * Depends on DeadlineState from daisAppealDeadline for readiness checks.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// Re-export DeadlineState for test convenience
export type { DeadlineState } from './daisAppealDeadline';
import type { DeadlineState } from './daisAppealDeadline';

// ============================================================================
// Types
// ============================================================================

export interface HearingInput {
  appealId: string;
  parcelId: string;
  packetId: string;
  hearingDate: string;
  hearingTime: string;
  location: string;
}

export interface HearingSchedule {
  hearingId: string;
  appealId: string;
  parcelId: string;
  packetId: string;
  hearingDate: string;
  hearingTime: string;
  location: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled';
  createdAt: string;
  cancelReason?: string;
  priorHearingId?: string;
}

export interface HearingScheduleResult {
  success: boolean;
  blockers: string[];
  schedule?: HearingSchedule;
}

export interface SchedulingReadiness {
  ready: boolean;
  blockers: string[];
}

// ============================================================================
// Helpers
// ============================================================================

function generateHearingId(): string {
  return `HRG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Readiness Validation
// ============================================================================

export function validateSchedulingReadiness(deadline: DeadlineState): SchedulingReadiness {
  const blockers: string[] = [];

  if (!deadline.packetValid) {
    blockers.push('packet reference is invalid or revised');
  }

  if (!deadline.appealId || deadline.appealId.trim() === '') {
    blockers.push('appeal ID is required');
  }

  return { ready: blockers.length === 0, blockers };
}

// ============================================================================
// Schedule (Dais-owned)
// ============================================================================

export function scheduleHearing(
  input: HearingInput,
  deadline: DeadlineState,
): HearingScheduleResult {
  // Write-lane enforcement
  assertWriteLane('dais', 'appeal');

  // Validate readiness
  const readiness = validateSchedulingReadiness(deadline);
  const blockers = [...readiness.blockers];

  // Validate input fields
  if (!input.hearingDate || input.hearingDate.trim() === '') {
    blockers.push('hearing date is required');
  }
  if (!input.hearingTime || input.hearingTime.trim() === '') {
    blockers.push('hearing time is required');
  }
  if (!input.location || input.location.trim() === '') {
    blockers.push('hearing location is required');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'appeal_hearing_blocked',
      'hearing',
      input.appealId,
      undefined,
      { blockers },
    );
    return { success: false, blockers };
  }

  const hearingId = generateHearingId();

  const schedule: HearingSchedule = {
    hearingId,
    appealId: input.appealId,
    parcelId: input.parcelId,
    packetId: input.packetId,
    hearingDate: input.hearingDate,
    hearingTime: input.hearingTime,
    location: input.location,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'appeal_hearing_scheduled',
    'hearing',
    hearingId,
    undefined,
    {
      appealId: input.appealId,
      parcelId: input.parcelId,
      hearingDate: input.hearingDate,
      hearingTime: input.hearingTime,
      location: input.location,
    },
  );

  return { success: true, blockers: [], schedule };
}

// ============================================================================
// Reschedule (Dais-owned)
// ============================================================================

export function rescheduleHearing(
  existing: HearingSchedule,
  newInput: HearingInput,
  deadline: DeadlineState,
): HearingScheduleResult {
  // Write-lane enforcement
  assertWriteLane('dais', 'appeal');

  // Validate readiness
  const readiness = validateSchedulingReadiness(deadline);
  if (!readiness.ready) {
    emitTraceEvent(
      'appeal_hearing_blocked',
      'hearing',
      existing.hearingId,
      undefined,
      { blockers: readiness.blockers },
    );
    return { success: false, blockers: readiness.blockers };
  }

  const hearingId = generateHearingId();

  const schedule: HearingSchedule = {
    hearingId,
    appealId: newInput.appealId,
    parcelId: newInput.parcelId,
    packetId: newInput.packetId,
    hearingDate: newInput.hearingDate,
    hearingTime: newInput.hearingTime,
    location: newInput.location,
    status: 'rescheduled',
    createdAt: new Date().toISOString(),
    priorHearingId: existing.hearingId,
  };

  emitTraceEvent(
    'appeal_hearing_rescheduled',
    'hearing',
    hearingId,
    {
      hearingId: existing.hearingId,
      hearingDate: existing.hearingDate,
      hearingTime: existing.hearingTime,
      location: existing.location,
    },
    {
      hearingDate: newInput.hearingDate,
      hearingTime: newInput.hearingTime,
      location: newInput.location,
      priorHearingId: existing.hearingId,
    },
  );

  return { success: true, blockers: [], schedule };
}

// ============================================================================
// Cancel (Dais-owned)
// ============================================================================

export function cancelHearing(
  existing: HearingSchedule,
  reason: string,
): HearingSchedule {
  // Write-lane enforcement
  assertWriteLane('dais', 'appeal');

  const cancelled: HearingSchedule = {
    ...existing,
    status: 'cancelled',
    cancelReason: reason,
  };

  emitTraceEvent(
    'appeal_hearing_cancelled',
    'hearing',
    existing.hearingId,
    { status: existing.status, hearingDate: existing.hearingDate },
    { status: 'cancelled', cancelReason: reason },
  );

  return cancelled;
}

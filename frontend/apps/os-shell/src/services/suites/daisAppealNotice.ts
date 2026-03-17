/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * Dais Appeal Notice Domain Logic
 *
 * Dais-owned notice eligibility, generation, and queue handoff.
 * All mutations guarded by assertWriteLane('dais', 'appeal').
 * Trace events emitted for generate/queue/block.
 *
 * Does not touch dossier-owned packet or narrative content.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// ============================================================================
// Types
// ============================================================================

export interface NoticeEligibilityInput {
  appealId: string;
  parcelId: string;
  hearingStatus: 'unscheduled' | 'scheduled' | 'rescheduled' | 'cancelled' | 'blocked';
  packetValid: boolean;
  deadlineBlockers: string[];
}

export interface NoticeEligibilityResult {
  eligible: boolean;
  blockers: string[];
}

export interface NoticeGenerationInput {
  appealId: string;
  parcelId: string;
  hearingId: string;
  packetId: string;
  hearingDate: string;
  hearingTime: string;
  hearingLocation: string;
  hearingStatus: 'scheduled' | 'rescheduled' | 'cancelled';
  petitionerName: string;
}

export interface AppealNotice {
  noticeId: string;
  appealId: string;
  parcelId: string;
  hearingId: string;
  packetId: string;
  hearingDate: string;
  hearingTime: string;
  hearingLocation: string;
  petitionerName: string;
  templateKey: string;
  status: 'generated' | 'queued' | 'sent' | 'failed';
  createdAt: string;
}

export interface NoticeGenerationResult {
  success: boolean;
  blockers: string[];
  notice?: AppealNotice;
}

export interface NoticeQueueEntry {
  noticeId: string;
  appealId: string;
  parcelId: string;
  hearingId: string;
  packetId: string;
  status: 'queued';
  queuedAt: string;
}

export interface NoticeQueueResult {
  success: boolean;
  blockers: string[];
  queueEntry?: NoticeQueueEntry;
}

// ============================================================================
// Helpers
// ============================================================================

function generateNoticeId(): string {
  return `NTC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function selectTemplate(hearingStatus: string): string {
  switch (hearingStatus) {
    case 'cancelled':
      return 'appeal-hearing-cancelled';
    case 'rescheduled':
      return 'appeal-hearing-rescheduled';
    default:
      return 'appeal-hearing-scheduled';
  }
}

// ============================================================================
// Eligibility Check
// ============================================================================

export function checkNoticeEligibility(input: NoticeEligibilityInput): NoticeEligibilityResult {
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

  if (input.hearingStatus !== 'scheduled' && input.hearingStatus !== 'cancelled' && input.hearingStatus !== 'rescheduled') {
    blockers.push('hearing must be scheduled or cancelled before notice generation');
  }

  if (input.deadlineBlockers.length > 0) {
    blockers.push(...input.deadlineBlockers);
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'appeal_notice_blocked',
      'notice',
      input.appealId || 'unknown',
      undefined,
      { blockers },
    );
  }

  return { eligible: blockers.length === 0, blockers };
}

// ============================================================================
// Notice Generation (Dais-owned)
// ============================================================================

export function generateAppealNotice(input: NoticeGenerationInput): NoticeGenerationResult {
  // Write-lane enforcement
  assertWriteLane('dais', 'appeal');

  const noticeId = generateNoticeId();
  const templateKey = selectTemplate(input.hearingStatus);

  const notice: AppealNotice = {
    noticeId,
    appealId: input.appealId,
    parcelId: input.parcelId,
    hearingId: input.hearingId,
    packetId: input.packetId,
    hearingDate: input.hearingDate,
    hearingTime: input.hearingTime,
    hearingLocation: input.hearingLocation,
    petitionerName: input.petitionerName,
    templateKey,
    status: 'generated',
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'appeal_notice_generated',
    'notice',
    noticeId,
    undefined,
    {
      appealId: input.appealId,
      parcelId: input.parcelId,
      hearingId: input.hearingId,
      templateKey,
    },
  );

  return { success: true, blockers: [], notice };
}

// ============================================================================
// Queue Handoff (Dais-owned)
// ============================================================================

export function handoffNoticeToQueue(notice: AppealNotice): NoticeQueueResult {
  // Write-lane enforcement
  assertWriteLane('dais', 'appeal');

  const queueEntry: NoticeQueueEntry = {
    noticeId: notice.noticeId,
    appealId: notice.appealId,
    parcelId: notice.parcelId,
    hearingId: notice.hearingId,
    packetId: notice.packetId,
    status: 'queued',
    queuedAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'appeal_notice_queued',
    'notice',
    notice.noticeId,
    undefined,
    {
      appealId: notice.appealId,
      parcelId: notice.parcelId,
      status: 'queued',
    },
  );

  return { success: true, blockers: [], queueEntry };
}

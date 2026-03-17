/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * Dais Notice Batch Domain Logic
 *
 * Batch derivation, eligibility validation, and mail/print queue handoff.
 * Mutations guarded by assertWriteLane('dais', 'appeal').
 * Trace events emitted for batch_created, batch_queue_handoff.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// ============================================================================
// Types
// ============================================================================

export interface NoticeBatchItem {
  noticeId: string;
  parcelId: string;
  appealId: string;
  hearingId: string;
  templateKey: string;
  hearingCompleted: boolean;
  outcomeRecorded: boolean;
  packetValid: boolean;
}

export interface NoticeBatch {
  batchId: string;
  items: NoticeBatchItem[];
  groups: Record<string, NoticeBatchItem[]>;
  rejectedItems: Array<{ noticeId: string; reasons: string[] }>;
  status: 'pending' | 'dispatched';
  createdAt: string;
}

export interface BatchEligibilityResult {
  eligible: boolean;
  dispatchMode: 'mail' | 'print';
  templateKeys: string[];
  blockers: string[];
}

export interface QueueEntry {
  batchId: string;
  channel: 'mail' | 'print';
  dispatchStatus: 'queued';
  queuedAt: string;
  queuedBy: string;
  itemCount: number;
  noticeIds: string[];
}

export interface QueueHandoffResult {
  success: boolean;
  queueEntry?: QueueEntry;
}

// ============================================================================
// Helpers
// ============================================================================

function generateBatchId(): string {
  return `BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateItem(item: NoticeBatchItem): string[] {
  const reasons: string[] = [];
  if (!item.packetValid) reasons.push('packet invalid');
  // Cancellation notices don't require hearing completion or outcome
  const isCancellation = item.templateKey.includes('cancelled');
  if (!isCancellation && !item.hearingCompleted) reasons.push('hearing not completed');
  if (!isCancellation && !item.outcomeRecorded) reasons.push('outcome not recorded');
  return reasons;
}

// ============================================================================
// Derive Notice Batch
// ============================================================================

export function deriveNoticeBatch(items: NoticeBatchItem[]): NoticeBatch {
  const batchId = generateBatchId();
  const accepted: NoticeBatchItem[] = [];
  const rejected: Array<{ noticeId: string; reasons: string[] }> = [];

  for (const item of items) {
    const reasons = validateItem(item);
    if (reasons.length > 0) {
      rejected.push({ noticeId: item.noticeId, reasons });
    } else {
      accepted.push(item);
    }
  }

  const groups: Record<string, NoticeBatchItem[]> = {};
  for (const item of accepted) {
    if (!groups[item.templateKey]) {
      groups[item.templateKey] = [];
    }
    groups[item.templateKey].push(item);
  }

  const batch: NoticeBatch = {
    batchId,
    items: accepted,
    groups,
    rejectedItems: rejected,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'batch_created',
    'notice_batch',
    batchId,
    undefined,
    { itemCount: accepted.length, rejectedCount: rejected.length },
  );

  return batch;
}

// ============================================================================
// Validate Batch Eligibility
// ============================================================================

export function validateBatchEligibility(
  batch: NoticeBatch,
  dispatchMode: 'mail' | 'print',
): BatchEligibilityResult {
  const blockers: string[] = [];

  if (batch.items.length === 0) {
    blockers.push('batch contains no eligible items');
  }

  const templateKeys = Object.keys(batch.groups);

  return {
    eligible: blockers.length === 0,
    dispatchMode,
    templateKeys,
    blockers,
  };
}

// ============================================================================
// Queue Batch for Dispatch (Dais-owned)
// ============================================================================

export function queueBatchForDispatch(
  batch: NoticeBatch,
  channel: 'mail' | 'print',
  queuedBy: string,
): QueueHandoffResult {
  assertWriteLane('dais', 'appeal');

  const queueEntry: QueueEntry = {
    batchId: batch.batchId,
    channel,
    dispatchStatus: 'queued',
    queuedAt: new Date().toISOString(),
    queuedBy,
    itemCount: batch.items.length,
    noticeIds: batch.items.map((i) => i.noticeId),
  };

  emitTraceEvent(
    'batch_queue_handoff',
    'notice_batch',
    batch.batchId,
    undefined,
    { channel, queuedBy, itemCount: batch.items.length },
  );

  return { success: true, queueEntry };
}

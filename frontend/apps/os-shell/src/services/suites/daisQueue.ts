/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * Dais Queue Domain Logic
 *
 * Cross-parcel work queue derivation, assignment, reassignment, and
 * escalation computation. Assignment mutations guarded by
 * assertWriteLane('dais', 'appeal'). Trace events emitted for
 * assign/reassign/escalate/block.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// ============================================================================
// Types
// ============================================================================

export interface QueueDerivationInput {
  parcelId: string;
  currentStatus: string;
  appealId?: string;
  certificationReady: boolean;
  blockers: string[];
  dueAt: string;
  assignedTo?: string;
}

export interface QueueItem {
  queueItemId: string;
  parcelId: string;
  currentStatus: string;
  appealId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueAt: string;
  assignedTo?: string;
  priorAssignee?: string;
  blockerSummary: string[];
  certificationReady: boolean;
  createdAt: string;
}

export interface QueueAssignmentResult {
  success: boolean;
  blockers: string[];
  item?: QueueItem;
}

export interface EscalationState {
  escalationLevel: 'normal' | 'warning' | 'overdue' | 'escalated';
  reasons: string[];
}

// ============================================================================
// Constants
// ============================================================================

const WARNING_THRESHOLD_DAYS = 7;

// ============================================================================
// Helpers
// ============================================================================

function generateQueueItemId(): string {
  return `QI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computePriority(input: QueueDerivationInput): QueueItem['priority'] {
  if (input.blockers.length > 0) return 'high';
  if (input.certificationReady) return 'low';
  return 'normal';
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return (new Date(a).getTime() - new Date(b).getTime()) / msPerDay;
}

// ============================================================================
// Derive Queue Item (read-only, no write-lane needed)
// ============================================================================

export function deriveQueueItem(input: QueueDerivationInput): QueueItem {
  return {
    queueItemId: generateQueueItemId(),
    parcelId: input.parcelId,
    currentStatus: input.currentStatus,
    appealId: input.appealId,
    priority: computePriority(input),
    dueAt: input.dueAt,
    assignedTo: input.assignedTo,
    blockerSummary: [...input.blockers],
    certificationReady: input.certificationReady,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// Assign Queue Item (Dais-owned)
// ============================================================================

export function assignQueueItem(item: QueueItem, assignee: string): QueueAssignmentResult {
  assertWriteLane('dais', 'appeal');

  const assigned: QueueItem = {
    ...item,
    assignedTo: assignee,
  };

  emitTraceEvent(
    'queue_item_assigned',
    'queue',
    item.queueItemId,
    undefined,
    {
      assignedTo: assignee,
      parcelId: item.parcelId,
    },
  );

  return { success: true, blockers: [], item: assigned };
}

// ============================================================================
// Reassign Queue Item (Dais-owned)
// ============================================================================

export function reassignQueueItem(item: QueueItem, newAssignee: string): QueueAssignmentResult {
  assertWriteLane('dais', 'appeal');

  if (!item.assignedTo) {
    emitTraceEvent(
      'queue_action_blocked',
      'queue',
      item.queueItemId,
      undefined,
      { reason: 'cannot reassign unassigned item' },
    );
    return { success: false, blockers: ['cannot reassign unassigned item'] };
  }

  const priorAssignee = item.assignedTo;

  const reassigned: QueueItem = {
    ...item,
    assignedTo: newAssignee,
    priorAssignee,
  };

  emitTraceEvent(
    'queue_item_reassigned',
    'queue',
    item.queueItemId,
    { assignedTo: priorAssignee },
    { assignedTo: newAssignee },
  );

  return { success: true, blockers: [], item: reassigned };
}

// ============================================================================
// Compute Escalation State
// ============================================================================

export function computeEscalationState(item: QueueItem, now: string): EscalationState {
  const reasons: string[] = [];
  const daysUntilDue = daysBetween(item.dueAt, now);
  const isOverdue = daysUntilDue < 0;
  const isWarning = daysUntilDue >= 0 && daysUntilDue <= WARNING_THRESHOLD_DAYS;
  const hasBlockers = item.blockerSummary.length > 0;

  if (isOverdue) {
    reasons.push('past due date');
  }

  if (hasBlockers) {
    reasons.push(...item.blockerSummary);
  }

  let escalationLevel: EscalationState['escalationLevel'] = 'normal';

  if (isOverdue && hasBlockers) {
    escalationLevel = 'escalated';
  } else if (isOverdue) {
    escalationLevel = 'overdue';
  } else if (isWarning) {
    escalationLevel = 'warning';
  }

  if (escalationLevel !== 'normal') {
    emitTraceEvent(
      'queue_item_escalated',
      'queue',
      item.queueItemId,
      undefined,
      { escalationLevel, reasons },
    );
  }

  return { escalationLevel, reasons };
}

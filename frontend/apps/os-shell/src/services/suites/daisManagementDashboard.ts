/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * Dais Management Dashboard Domain Logic
 *
 * Pure aggregation of queue, notice, cert, and appeal state into a
 * supervisory rollup. Read-lane enforcement ensures no writes into
 * Forge/Atlas/Dossier. Supervisory actions are narrow: drill-through
 * references, reassign, escalate. Trace events emitted for rollup
 * build, drill-through, and blocked actions.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

import type { QueueItem } from './daisQueue';
import type { NoticeBatch } from './daisNoticeBatch';
import type { CertBatch } from './daisCertRoll';

// ============================================================================
// Types
// ============================================================================

export interface ManagementRollupInput {
  queueItems: QueueItem[];
  noticeBatches: NoticeBatch[];
  certBatches: CertBatch[];
  appealCount: number;
  openAppealCount: number;
}

export interface WorkloadSummary {
  totalItems: number;
  assignedCount: number;
  unassignedCount: number;
  escalatedCount: number;
}

export interface AppealExposure {
  totalAppeals: number;
  openAppeals: number;
  exposureLevel: 'low' | 'moderate' | 'high';
}

export interface CertificationRisk {
  totalBatches: number;
  signedBatches: number;
  pendingBatches: number;
  blockedParcels: number;
}

export interface NoticeQueueState {
  totalBatches: number;
  pendingBatches: number;
  dispatchedBatches: number;
}

export interface ExceptionSummary {
  escalatedItems: string[];
  blockedCertParcels: string[];
  overdueItems: string[];
}

export interface ManagementRollup {
  rollupId: string;
  workloadSummary: WorkloadSummary;
  appealExposure: AppealExposure;
  certificationRisk: CertificationRisk;
  noticeQueueState: NoticeQueueState;
  exceptionSummary: ExceptionSummary;
  createdAt: string;
}

export interface ReadLaneAccess {
  allowed: boolean;
  writeAllowed: boolean;
}

export interface SupervisoryActionResult {
  success: boolean;
  blockers: string[];
  targetRef?: string;
}

// ============================================================================
// Allowed supervisory actions
// ============================================================================

const ALLOWED_ACTIONS = new Set([
  'drill-through-queue',
  'drill-through-parcel',
  'reassign-queue-item',
  'escalate-queue-item',
]);

const DAIS_WRITE_LANES = new Set(['dais']);

// ============================================================================
// Helpers
// ============================================================================

function generateRollupId(): string {
  return `ROLLUP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeExposureLevel(openAppeals: number, totalAppeals: number): AppealExposure['exposureLevel'] {
  if (totalAppeals === 0) return 'low';
  const ratio = openAppeals / totalAppeals;
  if (ratio > 0.5) return 'high';
  if (ratio > 0.2) return 'moderate';
  return 'low';
}

// ============================================================================
// Build Management Dashboard Rollup (pure aggregation)
// ============================================================================

export function buildManagementDashboardRollup(input: ManagementRollupInput): ManagementRollup {
  const rollupId = generateRollupId();

  // Workload
  const assignedCount = input.queueItems.filter((q) => q.assignedTo).length;
  const escalatedItems = input.queueItems
    .filter((q) => q.blockerSummary.length > 0)
    .map((q) => q.queueItemId);
  const overdueItems: string[] = []; // Would be computed from dueAt vs now

  const workloadSummary: WorkloadSummary = {
    totalItems: input.queueItems.length,
    assignedCount,
    unassignedCount: input.queueItems.length - assignedCount,
    escalatedCount: escalatedItems.length,
  };

  // Appeal exposure
  const appealExposure: AppealExposure = {
    totalAppeals: input.appealCount,
    openAppeals: input.openAppealCount,
    exposureLevel: computeExposureLevel(input.openAppealCount, input.appealCount),
  };

  // Certification risk
  const signedBatches = input.certBatches.filter((b) => b.status === 'signed').length;
  const pendingBatches = input.certBatches.filter((b) => b.status === 'pending').length;
  const blockedParcels = input.certBatches.reduce(
    (sum, b) => sum + b.rejectedParcels.length,
    0,
  );

  const certificationRisk: CertificationRisk = {
    totalBatches: input.certBatches.length,
    signedBatches,
    pendingBatches,
    blockedParcels,
  };

  // Notice queue state
  const pendingNoticeBatches = input.noticeBatches.filter((b) => b.status === 'pending').length;
  const dispatchedBatches = input.noticeBatches.filter((b) => b.status === 'dispatched').length;

  const noticeQueueState: NoticeQueueState = {
    totalBatches: input.noticeBatches.length,
    pendingBatches: pendingNoticeBatches,
    dispatchedBatches,
  };

  // Exception summary
  const blockedCertParcels = input.certBatches.flatMap((b) =>
    b.rejectedParcels.map((r) => r.parcelId),
  );

  const exceptionSummary: ExceptionSummary = {
    escalatedItems,
    blockedCertParcels,
    overdueItems,
  };

  const rollup: ManagementRollup = {
    rollupId,
    workloadSummary,
    appealExposure,
    certificationRisk,
    noticeQueueState,
    exceptionSummary,
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'dashboard_rollup_built',
    'management_dashboard',
    rollupId,
    undefined,
    {
      queueItemCount: input.queueItems.length,
      noticeBatchCount: input.noticeBatches.length,
      certBatchCount: input.certBatches.length,
    },
  );

  return rollup;
}

// ============================================================================
// Validate Read-Lane Access
// ============================================================================

export function validateReadLaneAccess(sourceLane: string): ReadLaneAccess {
  return {
    allowed: true,
    writeAllowed: DAIS_WRITE_LANES.has(sourceLane),
  };
}

// ============================================================================
// Attempt Supervisory Action
// ============================================================================

export function attemptSupervisoryAction(
  actionType: string,
  targetRef: string,
  actor: string,
): SupervisoryActionResult {
  // Check if action is in the allowed set
  if (!ALLOWED_ACTIONS.has(actionType)) {
    emitTraceEvent(
      'dashboard_action_blocked',
      'management_dashboard',
      targetRef,
      undefined,
      { actionType, actor, reason: 'forbidden cross-lane write' },
    );
    return { success: false, blockers: ['forbidden cross-lane write'] };
  }

  // Drill-through actions are reference-only (no write-lane needed)
  if (actionType.startsWith('drill-through-')) {
    emitTraceEvent(
      'dashboard_drill_through',
      'management_dashboard',
      targetRef,
      undefined,
      { actionType, targetRef, actor },
    );
    return { success: true, blockers: [], targetRef };
  }

  // Dais-owned supervisory actions require write-lane
  assertWriteLane('dais', 'appeal');

  emitTraceEvent(
    'dashboard_supervisory_action',
    'management_dashboard',
    targetRef,
    undefined,
    { actionType, actor },
  );

  return { success: true, blockers: [], targetRef };
}

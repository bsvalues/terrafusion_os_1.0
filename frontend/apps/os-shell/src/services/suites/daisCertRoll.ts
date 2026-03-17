/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * Dais Certification Roll Domain Logic
 *
 * Cross-parcel certification batch derivation, roll sign-off,
 * and statutory export model generation. Sign-off mutations
 * guarded by assertWriteLane('dais', 'appeal'). Trace events
 * emitted for batch-build, sign-off, export, and blocked ops.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// ============================================================================
// Types
// ============================================================================

export interface CertBatchParcel {
  parcelId: string;
  appealId: string;
  outcomeRecorded: boolean;
  hearingCompleted: boolean;
  noticeGenerated: boolean;
  packetValid: boolean;
  certificationReady: boolean;
  openAppeals: number;
  certBlockers: string[];
}

export interface CertBatch {
  batchId: string;
  parcels: CertBatchParcel[];
  rejectedParcels: Array<{ parcelId: string; reasons: string[] }>;
  status: 'pending' | 'signed';
  createdAt: string;
}

export interface SignedCertBatch extends CertBatch {
  status: 'signed';
  signedBy: string;
  signedAt: string;
}

export interface SignOffResult {
  success: boolean;
  blockers: string[];
  signedBatch?: SignedCertBatch;
}

export interface StatutoryExportModel {
  exportId: string;
  batchId: string;
  parcelIds: string[];
  signedBy: string;
  signedAt: string;
  status: 'ready';
  createdAt: string;
}

export interface ExportResult {
  success: boolean;
  blockers: string[];
  exportModel?: StatutoryExportModel;
}

// ============================================================================
// Helpers
// ============================================================================

function generateBatchId(): string {
  return `CBATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateExportId(): string {
  return `CEXP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateParcel(parcel: CertBatchParcel): string[] {
  const reasons: string[] = [];
  if (!parcel.certificationReady) reasons.push('not certification ready');
  if (parcel.openAppeals > 0) reasons.push(`${parcel.openAppeals} open appeals`);
  if (!parcel.outcomeRecorded) reasons.push('outcome not recorded');
  if (!parcel.hearingCompleted) reasons.push('hearing not completed');
  if (!parcel.noticeGenerated) reasons.push('notice not generated');
  if (!parcel.packetValid) reasons.push('packet invalid');
  if (parcel.certBlockers.length > 0) reasons.push(...parcel.certBlockers);
  return reasons;
}

// ============================================================================
// Derive Certification Batch
// ============================================================================

export function deriveCertificationBatch(parcels: CertBatchParcel[]): CertBatch {
  const batchId = generateBatchId();
  const accepted: CertBatchParcel[] = [];
  const rejected: Array<{ parcelId: string; reasons: string[] }> = [];

  for (const parcel of parcels) {
    const reasons = validateParcel(parcel);
    if (reasons.length > 0) {
      rejected.push({ parcelId: parcel.parcelId, reasons });
    } else {
      accepted.push(parcel);
    }
  }

  const batch: CertBatch = {
    batchId,
    parcels: accepted,
    rejectedParcels: rejected,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'cert_batch_created',
    'cert_roll',
    batchId,
    undefined,
    { parcelCount: accepted.length, rejectedCount: rejected.length },
  );

  return batch;
}

// ============================================================================
// Validate Roll Eligibility
// ============================================================================

export function validateRollEligibility(batch: CertBatch): { eligible: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (batch.parcels.length === 0) {
    blockers.push('batch contains no eligible parcels');
  }

  for (const parcel of batch.parcels) {
    const reasons = validateParcel(parcel);
    if (reasons.length > 0) {
      blockers.push(`parcel ${parcel.parcelId}: ${reasons.join(', ')}`);
    }
  }

  return { eligible: blockers.length === 0, blockers };
}

// ============================================================================
// Sign Off Certification Batch (Dais-owned)
// ============================================================================

export function signOffCertificationBatch(batch: CertBatch, signer: string): SignOffResult {
  assertWriteLane('dais', 'appeal');

  const blockers: string[] = [];

  for (const parcel of batch.parcels) {
    const reasons = validateParcel(parcel);
    if (reasons.length > 0) {
      blockers.push(`parcel ${parcel.parcelId}: ${reasons.join(', ')}`);
    }
  }

  if (batch.parcels.length === 0) {
    blockers.push('batch contains no eligible parcels');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'cert_signoff_blocked',
      'cert_roll',
      batch.batchId,
      undefined,
      { blockers },
    );
    return { success: false, blockers };
  }

  const signedBatch: SignedCertBatch = {
    ...batch,
    status: 'signed',
    signedBy: signer,
    signedAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'cert_batch_signed',
    'cert_roll',
    batch.batchId,
    undefined,
    { signedBy: signer, parcelCount: batch.parcels.length },
  );

  return { success: true, blockers: [], signedBatch };
}

// ============================================================================
// Build Statutory Export Model
// ============================================================================

export function buildStatutoryExportModel(batch: SignedCertBatch): ExportResult {
  const blockers: string[] = [];

  if (batch.status !== 'signed') {
    blockers.push('batch is not signed');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'cert_export_blocked',
      'cert_roll',
      batch.batchId,
      undefined,
      { blockers },
    );
    return { success: false, blockers };
  }

  const exportId = generateExportId();

  const exportModel: StatutoryExportModel = {
    exportId,
    batchId: batch.batchId,
    parcelIds: batch.parcels.map((p) => p.parcelId),
    signedBy: batch.signedBy,
    signedAt: batch.signedAt,
    status: 'ready',
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'cert_export_created',
    'cert_roll',
    batch.batchId,
    undefined,
    { exportId, parcelCount: batch.parcels.length },
  );

  return { success: true, blockers: [], exportModel };
}

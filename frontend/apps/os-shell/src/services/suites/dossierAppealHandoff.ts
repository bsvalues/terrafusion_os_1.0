/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Dossier Appeal Handoff Domain Logic
 *
 * Pure functions for preparing appeal handoff artifacts from finalized
 * Dossier packets. Dossier owns document/packet preparation; it does
 * NOT write to the appeal domain (owned by Dais).
 *
 * Write-lane: assertWriteLane('dossier', 'document') guards preparation.
 * Trace: emits appeal_handoff_prepared / appeal_handoff_blocked.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// Re-export FinalizedSnapshot for test convenience
export type { FinalizedSnapshot } from './dossierPacketFinalization';
import type { FinalizedSnapshot } from './dossierPacketFinalization';

// ============================================================================
// Types
// ============================================================================

export interface AppealHandoffModel {
  parcelId: string;
  packetId: string;
  packetType: string;
  packetStatus: 'finalized' | 'draft';
  narrativeIncluded: boolean;
  coverSheetIncluded: boolean;
  sectionCount: number;
  totalItems: number;
  narrativeSummary: string;
  preparedAt: string;
  preparedBy: string;
}

export interface HandoffResult {
  success: boolean;
  blockers: string[];
  handoff?: AppealHandoffModel;
}

// ============================================================================
// Handoff Preparation (Dossier-owned)
// ============================================================================

export function prepareAppealHandoff(snapshot: FinalizedSnapshot): HandoffResult {
  // Write-lane enforcement — Dossier prepares under document ownership
  assertWriteLane('dossier', 'document');

  const blockers: string[] = [];

  if (snapshot.status !== 'finalized') {
    blockers.push('packet must be finalized before appeal handoff');
  }

  if (!snapshot.frozen) {
    blockers.push('packet must be frozen before appeal handoff');
  }

  if (!snapshot.narrativeSummary || snapshot.narrativeSummary.trim() === '') {
    blockers.push('narrative summary is required for appeal handoff');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'appeal_handoff_blocked',
      'packet',
      snapshot.packetId,
      undefined,
      { blockers },
    );

    return { success: false, blockers };
  }

  const handoff: AppealHandoffModel = {
    parcelId: snapshot.parcelId,
    packetId: snapshot.packetId,
    packetType: snapshot.packetType,
    packetStatus: snapshot.status,
    narrativeIncluded: !!snapshot.narrativeSummary,
    coverSheetIncluded: true,
    sectionCount: snapshot.sectionCount,
    totalItems: snapshot.totalItems,
    narrativeSummary: snapshot.narrativeSummary,
    preparedAt: new Date().toISOString(),
    preparedBy: snapshot.finalizedBy,
  };

  emitTraceEvent(
    'appeal_handoff_prepared',
    'packet',
    snapshot.packetId,
    { status: 'finalized' },
    { handoffReady: true, parcelId: snapshot.parcelId },
  );

  return { success: true, blockers: [], handoff };
}

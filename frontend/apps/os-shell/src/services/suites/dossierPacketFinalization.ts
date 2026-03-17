/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 4
 * Dossier Packet Finalization Domain Logic
 *
 * Pure functions for packet finalization, revision, cover sheet
 * generation, and section drift detection.
 *
 * Write-lane enforcement: finalizePacketModel calls assertWriteLane.
 * Trace emission: finalize/revise emit via emitTraceEvent (fire-and-forget).
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

// ============================================================================
// Types (re-export PacketSection for test convenience)
// ============================================================================

export interface PacketSection {
  sectionType: string;
  itemIds: string[];
}

export interface FinalizationInput {
  parcelId: string;
  packetId: string;
  title: string;
  packetType: string;
  sections: PacketSection[];
  narrativeSummary: string;
  finalizedBy: string;
}

export interface FinalizedSnapshot {
  parcelId: string;
  packetId: string;
  title: string;
  packetType: string;
  status: 'finalized' | 'draft';
  finalizedBy: string;
  finalizedAt: string;
  sectionCount: number;
  totalItems: number;
  frozen: boolean;
  narrativeSummary: string;
  revisionReason?: string;
  revisedBy?: string;
  revisedAt?: string;
}

export interface FinalizationResult {
  success: boolean;
  blockers: string[];
  snapshot?: FinalizedSnapshot;
}

export interface MutabilityResult {
  mutable: boolean;
  reason?: string;
}

export interface DriftResult {
  drifted: boolean;
  reason?: string;
}

export interface CoverSheet {
  parcelId: string;
  packetId: string;
  packetType: string;
  title: string;
  readiness: string;
  sectionCount: number;
  totalItems: number;
  narrativeSummary: string;
  generatedAt: string;
}

// ============================================================================
// Finalization
// ============================================================================

export function finalizePacketModel(input: FinalizationInput): FinalizationResult {
  // Write-lane enforcement — throws before any state change
  assertWriteLane('dossier', 'document');

  const blockers: string[] = [];

  if (!input.title || input.title.trim() === '') {
    blockers.push('title is required');
  }
  if (!input.sections || input.sections.length === 0) {
    blockers.push('at least one section is required');
  }
  if (!input.narrativeSummary || input.narrativeSummary.trim() === '') {
    blockers.push('narrative summary is required');
  }

  if (blockers.length > 0) {
    emitTraceEvent(
      'packet_finalization_blocked',
      'packet',
      input.packetId,
      undefined,
      { blockers },
    );

    return { success: false, blockers };
  }

  const totalItems = input.sections.reduce((sum, s) => sum + s.itemIds.length, 0);

  const snapshot: FinalizedSnapshot = {
    parcelId: input.parcelId,
    packetId: input.packetId,
    title: input.title,
    packetType: input.packetType,
    status: 'finalized',
    finalizedBy: input.finalizedBy,
    finalizedAt: new Date().toISOString(),
    sectionCount: input.sections.length,
    totalItems,
    frozen: true,
    narrativeSummary: input.narrativeSummary,
  };

  emitTraceEvent(
    'packet_finalized',
    'packet',
    input.packetId,
    { status: 'draft' },
    { status: 'finalized', finalizedBy: input.finalizedBy },
  );

  return { success: true, blockers: [], snapshot };
}

// ============================================================================
// Revision
// ============================================================================

export function checkFinalizedMutability(snapshot: FinalizedSnapshot): MutabilityResult {
  if (snapshot.frozen && snapshot.status === 'finalized') {
    return {
      mutable: false,
      reason: 'Packet is finalized and frozen. Use revisePacket() to reopen.',
    };
  }
  return { mutable: true };
}

export function revisePacket(
  snapshot: FinalizedSnapshot,
  revisedBy: string,
  revisionReason: string,
): FinalizedSnapshot {
  const revised: FinalizedSnapshot = {
    ...snapshot,
    status: 'draft',
    frozen: false,
    revisionReason,
    revisedBy,
    revisedAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'packet_revised',
    'packet',
    snapshot.packetId,
    { status: 'finalized', frozen: true },
    { status: 'draft', revisionReason, revisedBy },
  );

  return revised;
}

export function checkSectionDrift(
  snapshot: FinalizedSnapshot,
  currentSections: PacketSection[],
): DriftResult {
  const currentSectionCount = currentSections.length;
  const currentTotalItems = currentSections.reduce((s, sec) => s + sec.itemIds.length, 0);

  if (
    currentSectionCount !== snapshot.sectionCount ||
    currentTotalItems !== snapshot.totalItems
  ) {
    return {
      drifted: true,
      reason: 'Packet has undergone material change since finalization.',
    };
  }

  return { drifted: false };
}

// ============================================================================
// Cover Sheet
// ============================================================================

export function buildCoverSheet(
  snapshot: FinalizedSnapshot,
  options?: { enforceWriteLane?: boolean },
): CoverSheet {
  if (options?.enforceWriteLane) {
    assertWriteLane('dossier', 'document');
  }

  return {
    parcelId: snapshot.parcelId,
    packetId: snapshot.packetId,
    packetType: snapshot.packetType,
    title: snapshot.title,
    readiness: snapshot.status,
    sectionCount: snapshot.sectionCount,
    totalItems: snapshot.totalItems,
    narrativeSummary: snapshot.narrativeSummary,
    generatedAt: new Date().toISOString(),
  };
}

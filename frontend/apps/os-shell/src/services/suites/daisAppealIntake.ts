/**
 * Phase 19 — TerraDossier Defense Spine, Tranche 5
 * Dais Appeal Intake Domain Logic
 *
 * Dais-owned entrypoint for accepting appeal handoffs from Dossier.
 * Dais owns the appeal domain; it creates workflow state but does
 * NOT write to dossier/document domain.
 *
 * Write-lane: assertWriteLane('dais', 'appeal') guards intake creation.
 * Trace: emits appeal_handoff_accepted.
 */

import { assertWriteLane } from '../writeLane';
import { emitTraceEvent } from '../terraTrace';

import type { AppealHandoffModel } from './dossierAppealHandoff';

// ============================================================================
// Types
// ============================================================================

export interface AppealIntakeRecord {
  appealId: string;
  parcelId: string;
  packetId: string;
  packetSnapshotStatus: 'finalized' | 'draft';
  status: 'pending' | 'accepted' | 'scheduled' | 'resolved';
  narrativeIncluded: boolean;
  coverSheetIncluded: boolean;
  sectionCount: number;
  totalItems: number;
  createdAt: string;
}

export interface IntakeResult {
  success: boolean;
  blockers: string[];
  intake?: AppealIntakeRecord;
}

export interface PacketValidityResult {
  valid: boolean;
  reason?: string;
}

// ============================================================================
// Appeal Intake (Dais-owned)
// ============================================================================

function generateAppealId(): string {
  return `APL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function acceptAppealHandoff(handoff: AppealHandoffModel): IntakeResult {
  // Write-lane enforcement — Dais writes to appeal domain only
  assertWriteLane('dais', 'appeal');

  if (handoff.packetStatus !== 'finalized') {
    return {
      success: false,
      blockers: ['cannot accept handoff for non-finalized packet'],
    };
  }

  const appealId = generateAppealId();

  const intake: AppealIntakeRecord = {
    appealId,
    parcelId: handoff.parcelId,
    packetId: handoff.packetId,
    packetSnapshotStatus: handoff.packetStatus,
    status: 'pending',
    narrativeIncluded: handoff.narrativeIncluded,
    coverSheetIncluded: handoff.coverSheetIncluded,
    sectionCount: handoff.sectionCount,
    totalItems: handoff.totalItems,
    createdAt: new Date().toISOString(),
  };

  emitTraceEvent(
    'appeal_handoff_accepted',
    'appeal',
    appealId,
    undefined,
    { packetId: handoff.packetId, parcelId: handoff.parcelId, status: 'pending' },
  );

  return { success: true, blockers: [], intake };
}

// ============================================================================
// Packet Validity Check
// ============================================================================

export function checkAppealPacketValidity(
  intake: AppealIntakeRecord,
  currentHandoff: AppealHandoffModel,
): PacketValidityResult {
  if (currentHandoff.packetStatus !== 'finalized') {
    return {
      valid: false,
      reason: `Appeal ${intake.appealId}: packet has been revised since handoff (status: ${currentHandoff.packetStatus})`,
    };
  }

  return { valid: true };
}

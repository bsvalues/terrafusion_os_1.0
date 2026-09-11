/**
 * Retired browser decision entrypoints. Packet judgments, IDs, time and receipts are server-owned.
 * Types remain for legacy presentation consumers; no function here can authorize or persist state.
 */
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

const serverRequired = 'Use the authenticated Dossier packet workflow server for this operation.';

export function finalizePacketModel(_input: FinalizationInput): FinalizationResult {
  return { success: false, blockers: [serverRequired] };
}

export function checkFinalizedMutability(_snapshot: FinalizedSnapshot): MutabilityResult {
  return { mutable: false, reason: serverRequired };
}

export function revisePacket(_snapshot: FinalizedSnapshot, _revisedBy: string, _revisionReason: string): FinalizedSnapshot {
  throw new Error(serverRequired);
}

/** Equal item counts cannot establish revision identity. Reload the server's exact snapshot. */
export function checkSectionDrift(_snapshot: FinalizedSnapshot, _currentSections: PacketSection[]): DriftResult {
  return { drifted: true, reason: serverRequired };
}

/** Unverified presentation only: preserves supplied metadata, never creates a seal or a new time. */
export function buildCoverSheet(snapshot: FinalizedSnapshot, options?: { enforceWriteLane?: boolean }): CoverSheet {
  if (options?.enforceWriteLane) throw new Error(serverRequired);
  return {
    parcelId: snapshot.parcelId, packetId: snapshot.packetId, packetType: snapshot.packetType,
    title: snapshot.title, readiness: 'unverified', sectionCount: snapshot.sectionCount,
    totalItems: snapshot.totalItems, narrativeSummary: snapshot.narrativeSummary,
    generatedAt: snapshot.finalizedAt,
  };
}

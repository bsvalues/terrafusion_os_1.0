/**
 * Retired browser handoff producer. Dossier's authenticated server alone prepares durable handoffs.
 * Legacy types remain for presentation callers until their owned migration; no appeal state writes.
 */
export type { FinalizedSnapshot } from './dossierPacketFinalization';
import type { FinalizedSnapshot } from './dossierPacketFinalization';

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

export function prepareAppealHandoff(_snapshot: FinalizedSnapshot): HandoffResult {
  return { success: false, blockers: ['Use the authenticated Dossier packet workflow server to prepare a handoff.'] };
}

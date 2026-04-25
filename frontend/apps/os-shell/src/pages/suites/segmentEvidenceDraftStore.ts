/**
 * segmentEvidenceDraftStore.ts
 * -------------------------------------------------------------
 * Task D3 — session-scoped draft state for a County Studio
 * handoff to Dossier.
 *
 * Zustand-only (no backend entity, no persistence). When the user
 * navigates away or refreshes, the draft vanishes. Matches the
 * "session subscriber, not session owner" law: the evidence packet
 * builder (once shipped) will own persistence; Dossier's suite home
 * just receives the handoff and holds it until the user chooses to
 * promote it into a real packet.
 */
import { create } from 'zustand';

export interface SegmentEvidenceDraft {
  template:     string;   // e.g. 'SegmentEvidence'
  segmentId:    string;
  segmentLabel: string;   // falls back to segmentId at render time
  createdAt:    string;   // ISO-8601 UTC timestamp
}

interface SegmentEvidenceDraftState {
  /** The single active draft; null when no handoff has been received this session. */
  activeDraft: SegmentEvidenceDraft | null;

  /** Create a new draft (overwrites the previous one — only one draft at a time). */
  createDraft(template: string, segmentId: string, segmentLabel: string): void;

  /** Dismiss/clear the current draft. */
  clearDraft(): void;
}

export const useSegmentEvidenceDraftStore = create<SegmentEvidenceDraftState>((set) => ({
  activeDraft: null,

  createDraft: (template, segmentId, segmentLabel) =>
    set({
      activeDraft: {
        template,
        segmentId,
        segmentLabel: segmentLabel || segmentId,
        createdAt:    new Date().toISOString(),
      },
    }),

  clearDraft: () => set({ activeDraft: null }),
}));

/**
 * segmentEvidenceDraftStore.ts
 * -------------------------------------------------------------
 * Task D3 — session-scoped draft state for a County Studio
 * handoff to Dossier.
 *
 * Persisted locally so County Studio handoff receipts survive refresh while
 * Dossier remains a non-owning downstream subscriber for segment evidence.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SegmentEvidenceDraftHandoff {
  receiptId?: string;
  exceptionSetId?: string;
  destination?: 'Dossier';
  countyId?: string;
  studyId?: string;
}

export interface SegmentEvidenceDraft {
  template:     string;   // e.g. 'SegmentEvidence'
  segmentId:    string;
  segmentLabel: string;   // falls back to segmentId at render time
  createdAt:    string;   // ISO-8601 UTC timestamp
  handoff?:      SegmentEvidenceDraftHandoff;
}

interface SegmentEvidenceDraftState {
  /** The single active draft; null when no handoff has been received this session. */
  activeDraft: SegmentEvidenceDraft | null;

  /** Create a new draft (overwrites the previous one — only one draft at a time). */
  createDraft(template: string, segmentId: string, segmentLabel: string, handoff?: SegmentEvidenceDraftHandoff): void;

  /** Dismiss/clear the current draft. */
  clearDraft(): void;
}

export const useSegmentEvidenceDraftStore = create<SegmentEvidenceDraftState>()(
  persist(
    (set) => ({
      activeDraft: null,

      createDraft: (template, segmentId, segmentLabel, handoff) =>
        set({
          activeDraft: {
            template,
            segmentId,
            segmentLabel: segmentLabel || segmentId,
            createdAt:    new Date().toISOString(),
            handoff,
          },
        }),

      clearDraft: () => set({ activeDraft: null }),
    }),
    {
      name: 'terrafusion-segment-evidence-draft',
      version: 1,
      partialize: (state) => ({ activeDraft: state.activeDraft }),
    },
  ),
);

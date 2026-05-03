/**
 * segmentWorkflowDraftStore.ts
 * -------------------------------------------------------------
 * Task D3 — session-scoped draft state for a County Studio
 * handoff to Dais.
 *
 * Persisted locally so County Studio handoff receipts survive refresh while
 * Dais remains a non-owning downstream subscriber for segment workflows.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SegmentWorkflowDraftHandoff {
  receiptId?: string;
  exceptionSetId?: string;
  destination?: 'Dais';
  countyId?: string;
  studyId?: string;
}

export interface SegmentWorkflowDraft {
  template:     string;   // e.g. 'SegmentReview'
  segmentId:    string;
  segmentLabel: string;   // falls back to segmentId at render time
  createdAt:    string;   // ISO-8601 UTC timestamp — ms precision
  handoff?:      SegmentWorkflowDraftHandoff;
}

interface SegmentWorkflowDraftState {
  /** The single active draft; null when no handoff has been received this session. */
  activeDraft: SegmentWorkflowDraft | null;

  /** Create a new draft (overwrites the previous one — only one draft at a time). */
  createDraft(template: string, segmentId: string, segmentLabel: string, handoff?: SegmentWorkflowDraftHandoff): void;

  /** Dismiss/clear the current draft. */
  clearDraft(): void;
}

export const useSegmentWorkflowDraftStore = create<SegmentWorkflowDraftState>()(
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
      name: 'terrafusion-segment-workflow-draft',
      version: 1,
      partialize: (state) => ({ activeDraft: state.activeDraft }),
    },
  ),
);

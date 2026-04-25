/**
 * segmentWorkflowDraftStore.ts
 * -------------------------------------------------------------
 * Task D3 — session-scoped draft state for a County Studio
 * handoff to Dais.
 *
 * Zustand-only (no backend entity, no persistence). When the user
 * navigates away or refreshes, the draft vanishes. Acceptable for
 * v1: Dais is a non-owning session subscriber for segment workflows
 * at this stage — authoring happens in the per-parcel Dais workbench
 * tab, which already has its own persistence story.
 */
import { create } from 'zustand';

export interface SegmentWorkflowDraft {
  template:     string;   // e.g. 'SegmentReview'
  segmentId:    string;
  segmentLabel: string;   // falls back to segmentId at render time
  createdAt:    string;   // ISO-8601 UTC timestamp — ms precision
}

interface SegmentWorkflowDraftState {
  /** The single active draft; null when no handoff has been received this session. */
  activeDraft: SegmentWorkflowDraft | null;

  /** Create a new draft (overwrites the previous one — only one draft at a time). */
  createDraft(template: string, segmentId: string, segmentLabel: string): void;

  /** Dismiss/clear the current draft. */
  clearDraft(): void;
}

export const useSegmentWorkflowDraftStore = create<SegmentWorkflowDraftState>((set) => ({
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

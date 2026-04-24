/**
 * compsForgeHandoffStore.ts
 * -------------------------------------------------------------
 * Task D3 — session-scoped County Studio handoff context for
 * CompsForgeModule. Holds the preloaded sample parcel ids + segment
 * metadata read from the shell window's metadata on mount.
 *
 * Zustand-only (no backend persistence). When the user navigates
 * away the draft vanishes — matches the "session subscriber, not
 * session owner" law for non-owning surfaces.
 *
 * Separate from CompsForge's internal filter + selection state
 * (`useReducer`/`useState` in CompsForgeModule) so we never
 * conflate a qualified-pool filter with an Inspector handoff.
 */
import { create } from 'zustand';

interface CompsForgeHandoffState {
  /** Parcels handed off from the County Studio Inspector; null when standalone. */
  preloadedSampleIds:   string[] | null;
  /** Segment id for the round-trip chip; null when no handoff. */
  contextSegmentId:     string | null;
  /** Human label for the chip (falls back to segmentId). */
  contextSegmentLabel:  string | null;

  /** Populate the handoff. Pass ([], null, null) via clearHandoffContext to reset. */
  setHandoffContext(
    parcelIds:     string[],
    segmentId:     string | null,
    segmentLabel?: string | null,
  ): void;

  /** Clear the handoff (user dismissed, or manual reset). */
  clearHandoffContext(): void;
}

export const useCompsForgeHandoffStore = create<CompsForgeHandoffState>((set) => ({
  preloadedSampleIds:  null,
  contextSegmentId:    null,
  contextSegmentLabel: null,

  setHandoffContext: (parcelIds, segmentId, segmentLabel = null) =>
    set({
      preloadedSampleIds:  parcelIds.length > 0 ? [...parcelIds] : null,
      contextSegmentId:    segmentId,
      contextSegmentLabel: segmentLabel,
    }),

  clearHandoffContext: () =>
    set({
      preloadedSampleIds:  null,
      contextSegmentId:    null,
      contextSegmentLabel: null,
    }),
}));

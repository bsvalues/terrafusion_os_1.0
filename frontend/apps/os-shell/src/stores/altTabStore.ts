/**
 * TerraFusion OS - Alt+Tab Switcher Store
 *
 * Manages Alt+Tab window switching state with frozen candidate list
 * for deterministic cycling behavior.
 *
 * Priority 14: Alt+Tab MVP
 * - Cycles only windows on currentDesktopId
 * - Excludes minimized windows
 * - Uses zIndex for ordering (highest first)
 *
 * @module stores/altTabStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface AltTabState {
  /** Whether Alt+Tab switcher is currently open */
  isOpen: boolean;

  /** Frozen list of candidate window IDs for this Alt+Tab session */
  candidateWindowIds: string[];

  /** Current selected index in candidate list */
  selectedIndex: number;

  /** The window that was active before Alt+Tab opened (for cancel/restore) */
  previousActiveWindowId: string | null;

  /** Timestamp when Alt+Tab session started (for debugging) */
  startedAt: number | null;

  // Actions
  /** Open Alt+Tab with candidates and previous active window */
  open: (candidateIds: string[], previousActiveId: string | null) => void;

  /** Move selection to next window (wraps around) */
  next: () => void;

  /** Move selection to previous window (wraps around) */
  prev: () => void;

  /** Get the currently selected window ID */
  getSelectedWindowId: () => string | null;

  /** Commit the selection (returns selected window ID for focusing) */
  commit: () => string | null;

  /** Cancel Alt+Tab and return previous active window ID for restoration */
  cancel: () => string | null;

  /** Close Alt+Tab without committing or canceling */
  close: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useAltTabStore = create<AltTabState>()(
  devtools(
    (set, get) => ({
      // Initial State
      isOpen: false,
      candidateWindowIds: [],
      selectedIndex: 0,
      previousActiveWindowId: null,
      startedAt: null,

      // Actions
      open: (candidateIds: string[], previousActiveId: string | null) => {
        if (candidateIds.length === 0) {
          // No candidates - don't open
          return;
        }

        // Find index of current active window in candidates
        const activeIndex = previousActiveId ? candidateIds.indexOf(previousActiveId) : -1;

        // Start at active window if present, otherwise start at 0
        const startIndex = activeIndex >= 0 ? activeIndex : 0;

        set({
          isOpen: true,
          candidateWindowIds: candidateIds,
          selectedIndex: startIndex,
          previousActiveWindowId: previousActiveId,
          startedAt: Date.now(),
        });
      },

      next: () => {
        const { candidateWindowIds, selectedIndex } = get();
        if (candidateWindowIds.length === 0) return;

        const nextIndex = (selectedIndex + 1) % candidateWindowIds.length;
        set({ selectedIndex: nextIndex });
      },

      prev: () => {
        const { candidateWindowIds, selectedIndex } = get();
        if (candidateWindowIds.length === 0) return;

        const prevIndex =
          (selectedIndex - 1 + candidateWindowIds.length) % candidateWindowIds.length;
        set({ selectedIndex: prevIndex });
      },

      getSelectedWindowId: () => {
        const { candidateWindowIds, selectedIndex } = get();
        if (candidateWindowIds.length === 0) return null;
        return candidateWindowIds[selectedIndex] || null;
      },

      commit: () => {
        const selectedId = get().getSelectedWindowId();
        get().close();
        return selectedId;
      },

      cancel: () => {
        const { previousActiveWindowId } = get();
        get().close();
        return previousActiveWindowId;
      },

      close: () => {
        set({
          isOpen: false,
          candidateWindowIds: [],
          selectedIndex: 0,
          previousActiveWindowId: null,
          startedAt: null,
        });
      },
    }),
    { name: 'AltTabStore' }
  )
);

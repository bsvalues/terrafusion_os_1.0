/**
 * TerraFusion OS Window Peek Store
 *
 * Manages the state for taskbar window preview on hover.
 * Handles delay timing and target window tracking.
 *
 * @module stores/windowPeekStore
 * @see Priority 13: Window Peek/Preview
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface WindowPeekState {
  /** Currently peeked window ID */
  targetWindowId: string | null;
  /** Position of the peek popup (from taskbar button) */
  position: { x: number; y: number } | null;
  /** Whether the peek is visible */
  isVisible: boolean;
  /** Pending window ID (during delay) */
  pendingWindowId: string | null;

  // Actions
  showPeek: (windowId: string, position: { x: number; y: number }) => void;
  hidePeek: () => void;
  setPending: (windowId: string | null) => void;
  clearPending: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Delay before showing peek preview (ms) */
export const PEEK_DELAY_MS = 300;

/** Delay before hiding peek when mouse leaves (ms) */
export const PEEK_HIDE_DELAY_MS = 100;

// ============================================================================
// Store Implementation
// ============================================================================

export const useWindowPeekStore = create<WindowPeekState>((set) => ({
  targetWindowId: null,
  position: null,
  isVisible: false,
  pendingWindowId: null,

  showPeek: (windowId, position) =>
    set({
      targetWindowId: windowId,
      position,
      isVisible: true,
      pendingWindowId: null,
    }),

  hidePeek: () =>
    set({
      targetWindowId: null,
      position: null,
      isVisible: false,
      pendingWindowId: null,
    }),

  setPending: (windowId) =>
    set({ pendingWindowId: windowId }),

  clearPending: () =>
    set({ pendingWindowId: null }),
}));

// ============================================================================
// Convenience Hooks
// ============================================================================

/** Hook for peek visibility */
export const useWindowPeekVisible = () =>
  useWindowPeekStore((state) => state.isVisible);

/** Hook for peeked window ID */
export const useWindowPeekTarget = () =>
  useWindowPeekStore((state) => state.targetWindowId);

/** Hook for peek position */
export const useWindowPeekPosition = () =>
  useWindowPeekStore((state) => state.position);

/** Hook for peek actions */
export const useWindowPeekActions = () =>
  useWindowPeekStore((state) => ({
    showPeek: state.showPeek,
    hidePeek: state.hidePeek,
    setPending: state.setPending,
    clearPending: state.clearPending,
  }));

export default useWindowPeekStore;

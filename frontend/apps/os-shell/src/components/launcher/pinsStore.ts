/**
 * Pins Store for Launcher
 *
 * Manages pinned launcher items with persistence.
 * Uses Zustand for reactivity and storageAdapter for persistence.
 *
 * @module launcher/pinsStore
 */

import { create } from 'zustand';
import { getStorageAdapter } from './storageAdapter';

// ============================================================================
// Types
// ============================================================================

export interface PinsState {
  /** Set of pinned item IDs */
  pinnedIds: Set<string>;
  /** Check if an item is pinned */
  isPinned: (id: string) => boolean;
  /** Toggle pin state for an item */
  togglePin: (id: string) => void;
  /** Add a pin */
  pin: (id: string) => void;
  /** Remove a pin */
  unpin: (id: string) => void;
  /** Get all pinned IDs as array */
  getPinnedIds: () => string[];
  /** Initialize from storage */
  hydrate: () => void;
}

// ============================================================================
// Storage Keys
// ============================================================================

const PINS_STORAGE_KEY = 'pins';

// ============================================================================
// Store
// ============================================================================

export const usePinsStore = create<PinsState>((set, get) => ({
  pinnedIds: new Set<string>(),

  isPinned: (id: string): boolean => {
    return get().pinnedIds.has(id);
  },

  togglePin: (id: string): void => {
    const { isPinned, pin, unpin } = get();
    if (isPinned(id)) {
      unpin(id);
    } else {
      pin(id);
    }
  },

  pin: (id: string): void => {
    set((state) => {
      const newPins = new Set(state.pinnedIds);
      newPins.add(id);
      // Persist
      getStorageAdapter().set(PINS_STORAGE_KEY, Array.from(newPins));
      return { pinnedIds: newPins };
    });
  },

  unpin: (id: string): void => {
    set((state) => {
      const newPins = new Set(state.pinnedIds);
      newPins.delete(id);
      // Persist
      getStorageAdapter().set(PINS_STORAGE_KEY, Array.from(newPins));
      return { pinnedIds: newPins };
    });
  },

  getPinnedIds: (): string[] => {
    return Array.from(get().pinnedIds);
  },

  hydrate: (): void => {
    const stored = getStorageAdapter().get<string[]>(PINS_STORAGE_KEY);
    if (stored && Array.isArray(stored)) {
      set({ pinnedIds: new Set(stored) });
    }
  },
}));

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize pins store from storage.
 * Call this once at app startup.
 */
export function initPinsStore(): void {
  usePinsStore.getState().hydrate();
}

/**
 * Reset pins store (for testing).
 */
export function resetPinsStore(): void {
  usePinsStore.setState({ pinnedIds: new Set<string>() });
}

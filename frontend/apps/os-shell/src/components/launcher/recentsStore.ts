/**
 * Recents Store for Launcher
 *
 * Tracks recently activated launcher items with persistence.
 * Uses Zustand for reactivity and storageAdapter for persistence.
 *
 * Features:
 * - MRU (Most Recently Used) ordering
 * - Deduplication (re-activation bumps to front)
 * - Bounded size (max 10 items)
 *
 * @module launcher/recentsStore
 */

import { create } from 'zustand';
import { getStorageAdapter } from './storageAdapter';

// ============================================================================
// Types
// ============================================================================

export interface RecentsState {
  /** List of recent item IDs (MRU order, index 0 = most recent) */
  recentIds: string[];
  /** Record an item activation (adds/bumps to front) */
  record: (id: string) => void;
  /** Get all recent IDs */
  getRecentIds: () => string[];
  /** Clear all recents */
  clear: () => void;
  /** Initialize from storage */
  hydrate: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const RECENTS_STORAGE_KEY = 'recents';
const MAX_RECENTS = 10;

// ============================================================================
// Store
// ============================================================================

export const useRecentsStore = create<RecentsState>((set, get) => ({
  recentIds: [],

  record: (id: string): void => {
    set((state) => {
      // Remove existing occurrence (dedupe)
      const filtered = state.recentIds.filter((existingId) => existingId !== id);
      // Add to front
      const newRecents = [id, ...filtered];
      // Cap at max
      const bounded = newRecents.slice(0, MAX_RECENTS);
      // Persist
      getStorageAdapter().set(RECENTS_STORAGE_KEY, bounded);
      return { recentIds: bounded };
    });
  },

  getRecentIds: (): string[] => {
    return get().recentIds;
  },

  clear: (): void => {
    getStorageAdapter().set(RECENTS_STORAGE_KEY, []);
    set({ recentIds: [] });
  },

  hydrate: (): void => {
    const stored = getStorageAdapter().get<string[]>(RECENTS_STORAGE_KEY);
    if (stored && Array.isArray(stored)) {
      // Ensure max cap on load
      set({ recentIds: stored.slice(0, MAX_RECENTS) });
    }
  },
}));

// ============================================================================
// Initialization Helper
// ============================================================================

/**
 * Initialize recents store from storage.
 * Call this once at app startup.
 */
export function initRecentsStore(): void {
  useRecentsStore.getState().hydrate();
}

/**
 * Reset recents store (for testing).
 */
export function resetRecentsStore(): void {
  useRecentsStore.setState({ recentIds: [] });
}

/**
 * Get max recents limit.
 */
export function getMaxRecents(): number {
  return MAX_RECENTS;
}

/**
 * @fileoverview Parcel Context Service
 *
 * OS-owned service for managing current parcel context across navigation.
 * This is the single source of truth for "which parcel is the user working with?"
 *
 * Context Sources (in priority order):
 * 1. Explicit: User selects a parcel from search/selector
 * 2. Route: URL contains parcelId (e.g., /property/:parcelId/tab)
 * 3. Session: Previously viewed parcel (persisted to sessionStorage)
 * 4. None: No parcel context available
 *
 * Usage:
 * - `useParcelContext()` - React hook for components
 * - `getParcelContext()` - Direct access (for non-React code like launcherModel)
 * - `setParcelContext()` - Update context (from route changes, user selection)
 * - `clearParcelContext()` - Clear context (e.g., when switching views)
 *
 * @module context/parcelContext
 * @see Slice 9: Unified "Open Context" Contract
 */

import { create } from 'zustand';
import { useDesktopStore } from '../stores/desktopStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Parcel context shape.
 * Represents the currently active parcel (if any).
 */
export interface ParcelContext {
  /** Parcel identifier (e.g., 'P-12345', '1234567890') */
  parcelId: string;
  /** Human-readable parcel name (optional - for display) */
  parcelName?: string;
  /** Source of the context (for debugging/audit) */
  source?: ParcelContextSource;
}

/**
 * Source of parcel context.
 */
export type ParcelContextSource =
  | 'route' // Extracted from URL params
  | 'selection' // User explicitly selected
  | 'session' // Restored from session storage
  | 'demo' // Demo/fallback parcel
  | 'indicator_recent'; // Selected from recent parcels in indicator

/**
 * Maximum number of recent parcels to track.
 */
export const MAX_RECENT_PARCELS = 10;

/**
 * Parcel context store state.
 */
interface ParcelContextState {
  /** Current parcel context (null if none) */
  context: ParcelContext | null;
  /** Recent parcels (MRU order, most recent first) */
  recentParcels: string[];
  /** Set parcel context */
  setContext: (context: ParcelContext | null) => void;
  /** Clear parcel context */
  clearContext: () => void;
  /** Update context from route params */
  setFromRoute: (parcelId: string, parcelName?: string) => void;
  /** Record a parcel to recents (internal) */
  recordRecent: (parcelId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Session storage key for persisting parcel context */
const SESSION_STORAGE_KEY = 'tf:parcel-context';

/** Session storage key for persisting recent parcels */
const RECENT_PARCELS_STORAGE_KEY = 'tf:recent-parcels';

// ============================================================================
// Store
// ============================================================================

/**
 * Parcel context Zustand store.
 * Manages current parcel context with session persistence.
 */
export const useParcelContextStore = create<ParcelContextState>((set, get) => ({
  context: restoreFromSession(),
  recentParcels: restoreRecentsFromSession(),

  setContext: (context) => {
    set({ context });
    if (context) {
      persistToSession(context);
      // Also record to recents
      get().recordRecent(context.parcelId);
    } else {
      clearSessionStorage();
    }
  },

  clearContext: () => {
    set({ context: null });
    clearSessionStorage();
  },

  setFromRoute: (parcelId, parcelName) => {
    const context: ParcelContext = {
      parcelId,
      parcelName,
      source: 'route',
    };
    set({ context });
    persistToSession(context);
    // Also record to recents
    get().recordRecent(parcelId);
  },

  recordRecent: (parcelId) => {
    if (!parcelId) return;

    const { recentParcels } = get();
    // Remove if already exists (dedupe)
    const filtered = recentParcels.filter((id) => id !== parcelId);
    // Add to front
    const updated = [parcelId, ...filtered].slice(0, MAX_RECENT_PARCELS);

    set({ recentParcels: updated });
    persistRecentsToSession(updated);
  },
}));

// ============================================================================
// Session Persistence
// ============================================================================

function persistToSession(context: ParcelContext): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Session storage might be unavailable (private browsing, etc.)
  }
}

function restoreFromSession(): ParcelContext | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ParcelContext;
      // Mark as session-restored
      return { ...parsed, source: 'session' };
    }
  } catch {
    // Session storage might be unavailable
  }
  return null;
}

function clearSessionStorage(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Session storage might be unavailable
  }
}

// ============================================================================
// Recent Parcels Persistence (localStorage for cross-session persistence)
// ============================================================================

function persistRecentsToSession(recents: string[]): void {
  try {
    localStorage.setItem(RECENT_PARCELS_STORAGE_KEY, JSON.stringify(recents));
  } catch {
    // localStorage might be unavailable (private browsing, etc.)
  }
}

function restoreRecentsFromSession(): string[] {
  try {
    // Try localStorage first (cross-session persistence)
    const stored = localStorage.getItem(RECENT_PARCELS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_RECENT_PARCELS);
      }
    }
    // Fallback: migrate from sessionStorage if present
    const sessionStored = sessionStorage.getItem(RECENT_PARCELS_STORAGE_KEY);
    if (sessionStored) {
      const parsed = JSON.parse(sessionStored);
      if (Array.isArray(parsed)) {
        const recents = parsed.slice(0, MAX_RECENT_PARCELS);
        // Migrate to localStorage
        localStorage.setItem(RECENT_PARCELS_STORAGE_KEY, JSON.stringify(recents));
        sessionStorage.removeItem(RECENT_PARCELS_STORAGE_KEY);
        return recents;
      }
    }
  } catch {
    // Storage might be unavailable
  }
  return [];
}

// ============================================================================
// Non-React API (for imperative code like launcherModel)
// ============================================================================

/**
 * Get current parcel context (non-React).
 * Use `useParcelContext()` hook in React components instead.
 */
export function getParcelContext(): ParcelContext | null {
  return useParcelContextStore.getState().context;
}

/**
 * Set parcel context (non-React).
 * Prefer using the hook's setContext in React components.
 */
export function setParcelContext(context: ParcelContext | null): void {
  useParcelContextStore.getState().setContext(context);
}

/**
 * Clear parcel context (non-React).
 */
export function clearParcelContext(): void {
  useParcelContextStore.getState().clearContext();
}

/**
 * Set parcel context from route params (non-React).
 */
export function setParcelContextFromRoute(parcelId: string, parcelName?: string): void {
  useParcelContextStore.getState().setFromRoute(parcelId, parcelName);
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to access current parcel context.
 *
 * @example
 * ```tsx
 * const parcel = useParcelContext();
 * if (parcel) {
 *   console.log(`Working with parcel: ${parcel.parcelId}`);
 * }
 * ```
 */
export function useParcelContext(): ParcelContext | null {
  return useParcelContextStore((state) => state.context);
}

/**
 * Hook to access parcel context actions.
 *
 * @example
 * ```tsx
 * const { setContext, clearContext } = useParcelContextActions();
 * setContext({ parcelId: 'P-12345', source: 'selection' });
 * ```
 */
export function useParcelContextActions() {
  const setContext = useParcelContextStore((state) => state.setContext);
  const clearContext = useParcelContextStore((state) => state.clearContext);
  const setFromRoute = useParcelContextStore((state) => state.setFromRoute);

  return { setContext, clearContext, setFromRoute };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if parcel context exists.
 */
export function hasParcelContext(): boolean {
  return getParcelContext() !== null;
}

/**
 * Get parcel ID from context (or null).
 */
export function getCurrentParcelId(): string | null {
  return getParcelContext()?.parcelId ?? null;
}

// ============================================================================
// Recent Parcels API
// ============================================================================

/**
 * Get recent parcels list (MRU order).
 */
export function getRecentParcels(): string[] {
  return useParcelContextStore.getState().recentParcels;
}

/**
 * Record a parcel to recents (adds to front, dedupes, caps).
 */
export function recordRecentParcel(parcelId: string): void {
  useParcelContextStore.getState().recordRecent(parcelId);
}

/**
 * Select a parcel from recents and set as current context.
 * Emits trace event with source: 'indicator_recent'.
 */
export function selectRecentParcel(parcelId: string): void {
  const { recentParcels, setContext, recordRecent } = useParcelContextStore.getState();

  // Only select if parcel exists in recents
  if (!recentParcels.includes(parcelId)) {
    return;
  }

  // Set context with indicator_recent source
  setContext({
    parcelId,
    source: 'indicator_recent',
  });

  // Move to front of recents
  recordRecent(parcelId);

  // Emit trace event synchronously
  // Using direct event dispatch to avoid circular import
  const hashParcelId = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `h-${Math.abs(hash).toString(16)}`;
  };

  window.dispatchEvent(
    new CustomEvent('terratrace:parcel_context', {
      detail: {
        type: 'parcel_context_set',
        timestamp: Date.now(),
        payload: {
          parcelIdHash: hashParcelId(parcelId),
          source: 'indicator_recent',
        },
      },
    })
  );
}

/**
 * Hook to access recent parcels.
 */
export function useRecentParcels(): string[] {
  return useParcelContextStore((state) => state.recentParcels);
}

// ============================================================================
// Workbench Window Opener (Phase A)
// ============================================================================

/**
 * Open the Property Workbench as a desktop window for a given parcel.
 *
 * If a workbench window for this parcel is already open, it will be focused.
 * Otherwise a new window is created with the parcel ID in metadata.
 *
 * @param parcelId - The parcel to open
 * @param tabId - Optional tab to focus (defaults to 'summary')
 */
export function openWorkbenchWindow(parcelId?: string, tabId?: string): void {
  // useDesktopStore imported at module top level (no circular dep exists)
  const { windows, openWindow, focusWindow } = useDesktopStore.getState();

  // If no parcelId, open a blank workbench (shows NoParcelSelected state)
  if (!parcelId) {
    const blankExisting = windows.find(
      (w) => w.moduleId === 'property-workbench' && !w.metadata?.parcelId
    );
    if (blankExisting) {
      focusWindow(blankExisting.id);
      return;
    }
    openWindow('property-workbench', 'Property Workbench', '🏠', { defaultMaximized: true });
    return;
  }

  // Check if a workbench window for this parcel already exists
  const existing = windows.find(
    (w) =>
      w.moduleId === 'property-workbench' &&
      w.metadata?.parcelId === parcelId
  );

  if (existing) {
    focusWindow(existing.id);
    return;
  }

  // Set parcel context + record to recents
  const { setContext, recordRecent } = useParcelContextStore.getState();
  setContext({ parcelId, source: 'selection' });
  recordRecent(parcelId);

  // Broadcast to companion context bus — Pilot auto-updates to this parcel
  import('../stores/companionStore').then(({ useCompanionStore }) => {
    useCompanionStore.getState().setActiveParcel(parcelId!);
  });

  // Pre-load parcel data via property store (DataProvider-backed)
  import('../stores/propertyStore').then(({ usePropertyStore }) => {
    usePropertyStore.getState().selectParcel(parcelId!);
  });

  // Open new workbench window
  const truncatedId = parcelId.length > 20 ? parcelId.slice(0, 20) + '…' : parcelId;
  openWindow(
    'property-workbench',
    `Property: ${truncatedId}`,
    '🏠',
    { parcelId, tabId: tabId ?? 'summary', defaultMaximized: true }
  );
}

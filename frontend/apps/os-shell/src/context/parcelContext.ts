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
  | 'demo'; // Demo/fallback parcel

/**
 * Parcel context store state.
 */
interface ParcelContextState {
  /** Current parcel context (null if none) */
  context: ParcelContext | null;
  /** Set parcel context */
  setContext: (context: ParcelContext | null) => void;
  /** Clear parcel context */
  clearContext: () => void;
  /** Update context from route params */
  setFromRoute: (parcelId: string, parcelName?: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Session storage key for persisting parcel context */
const SESSION_STORAGE_KEY = 'tf:parcel-context';

// ============================================================================
// Store
// ============================================================================

/**
 * Parcel context Zustand store.
 * Manages current parcel context with session persistence.
 */
export const useParcelContextStore = create<ParcelContextState>((set) => ({
  context: restoreFromSession(),

  setContext: (context) => {
    set({ context });
    if (context) {
      persistToSession(context);
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

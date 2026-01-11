/**
 * TerraFusion OS Hydration Hook
 *
 * React hook for restoring persisted state on application mount.
 * Handles loading state from localStorage and hydrating Zustand stores.
 *
 * @module hooks/useHydration
 * @see SUCCESS CRITERIA SC-5.17, SC-5.18: Hydration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  persistenceService,
  type PersistedDesktopState,
  type PersistedStartMenuState,
} from '../services/persistenceService';
import { useDesktopStore } from '../stores/desktopStore';
import { useModuleRegistryStore } from '../stores/moduleRegistryStore';
import { useStartMenuStore, type Module } from '../stores/startMenuStore';

// ============================================================================
// Types
// ============================================================================

export interface HydrationState {
  isHydrating: boolean;
  isHydrated: boolean;
  error: Error | null;
}

export interface HydrationResult extends HydrationState {
  /**
   * Manually trigger hydration
   * @param force - If true, forces re-hydration even if already hydrated
   */
  hydrate: (force?: boolean) => Promise<void>;
  /**
   * Clear all persisted state and reset to defaults
   */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to hydrate application state from localStorage
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isHydrating, isHydrated, error } = useHydration();
 *
 *   if (isHydrating) {
 *     return <LoadingScreen />;
 *   }
 *
 *   if (error) {
 *     return <ErrorScreen error={error} />;
 *   }
 *
 *   return <Desktop />;
 * }
 * ```
 */
export function useHydration(): HydrationResult {
  const [state, setState] = useState<HydrationState>({
    isHydrating: true,
    isHydrated: false,
    error: null,
  });

  // Prevent multiple hydrations
  const hasHydratedRef = useRef(false);

  // Get store actions
  const openWindow = useDesktopStore((s) => s.openWindow);
  const updateWindowPosition = useDesktopStore((s) => s.updateWindowPosition);
  const updateWindowSize = useDesktopStore((s) => s.updateWindowSize);
  const maximizeWindow = useDesktopStore((s) => s.maximizeWindow);
  const snapWindow = useDesktopStore((s) => s.snapWindow);

  const setPinnedApps = useStartMenuStore((s) => s.setPinnedApps);
  const allApps = useStartMenuStore((s) => s.allApps);

  const getModuleById = useModuleRegistryStore((s) => s.getModuleById);

  /**
   * Hydrate desktop state from persistence
   */
  const hydrateDesktop = useCallback(
    (desktopState: PersistedDesktopState) => {
      desktopState.windows.forEach((w) => {
        // Check if module exists (skip if removed)
        const module = getModuleById(w.moduleId);
        if (!module) {
          console.warn(`[Hydration] Skipping window for missing module: ${w.moduleId}`);
          return;
        }

        // Open window
        const windowId = openWindow(w.moduleId, w.title, w.icon);

        // Restore position and size
        updateWindowPosition(windowId, w.position);
        updateWindowSize(windowId, w.size);

        // Restore window state
        if (w.state === 'maximized') {
          maximizeWindow(windowId);
        } else if (w.state === 'snapped' && w.snapZone) {
          // For snapped windows, we need viewport dimensions
          // Use stored position/size as approximation
          snapWindow(
            windowId,
            w.snapZone,
            w.size.width * 2, // Approximate viewport width
            w.size.height + 48 // Approximate viewport height with taskbar
          );
        }
      });
    },
    [openWindow, updateWindowPosition, updateWindowSize, maximizeWindow, snapWindow, getModuleById]
  );

  /**
   * Hydrate start menu state from persistence
   */
  const hydrateStartMenu = useCallback(
    (startMenuState: PersistedStartMenuState) => {
      // Filter pinned apps to only include those that still exist
      const validPinnedApps: Module[] = startMenuState.pinnedAppIds
        .map((id) => allApps.find((app) => app.id === id))
        .filter((app): app is Module => app !== undefined);

      if (validPinnedApps.length > 0) {
        setPinnedApps(validPinnedApps);
      }
    },
    [allApps, setPinnedApps]
  );

  /**
   * Main hydration function
   * @param force - If true, forces re-hydration even if already hydrated
   */
  const hydrate = useCallback(
    async (force = false) => {
      // Prevent multiple hydrations unless forced
      if (hasHydratedRef.current && !force) {
        return;
      }
      hasHydratedRef.current = true;

      setState({ isHydrating: true, isHydrated: false, error: null });

      try {
        // Check for version migration
        persistenceService.migrateIfNeeded();

        // Load persisted state
        const desktopState = persistenceService.loadDesktopState();
        const startMenuState = persistenceService.loadStartMenuState();

        // Hydrate stores
        if (desktopState) {
          hydrateDesktop(desktopState);
        }

        if (startMenuState) {
          hydrateStartMenu(startMenuState);
        }

        setState({ isHydrating: false, isHydrated: true, error: null });
      } catch (error) {
        console.error('[Hydration] Failed to hydrate state:', error);
        setState({
          isHydrating: false,
          isHydrated: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    },
    [hydrateDesktop, hydrateStartMenu]
  );

  /**
   * Reset all persisted state
   */
  const reset = useCallback(() => {
    persistenceService.clearAll();

    // Reset stores to initial state
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,
    });

    useStartMenuStore.setState({
      isOpen: false,
      searchQuery: '',
      pinnedApps: [],
    });

    setState({ isHydrating: false, isHydrated: true, error: null });
  }, []);

  // Auto-hydrate on mount
  useEffect(() => {
    // Small delay to ensure stores are ready
    const timer = setTimeout(() => {
      hydrate();
    }, 0);

    return () => clearTimeout(timer);
  }, [hydrate]);

  return {
    ...state,
    hydrate,
    reset,
  };
}

/**
 * Hook to auto-persist desktop state on changes
 */
export function useDesktopPersistence(): void {
  const windows = useDesktopStore((s) => s.windows);

  useEffect(() => {
    // Skip if no windows (initial state)
    if (windows.length === 0) return;

    // Debounced save
    persistenceService.saveDesktopStateDebounced({
      windows: windows.map((w) => ({
        moduleId: w.moduleId,
        title: w.title,
        icon: w.icon,
        position: w.position,
        size: w.size,
        state: w.state,
        snapZone: w.snapZone,
      })),
    });
  }, [windows]);
}

/**
 * Hook to auto-persist start menu state on changes
 */
export function useStartMenuPersistence(): void {
  const pinnedApps = useStartMenuStore((s) => s.pinnedApps);

  useEffect(() => {
    // Get current recent modules
    const currentState = persistenceService.loadStartMenuState();

    persistenceService.saveStartMenuStateDebounced({
      pinnedAppIds: pinnedApps.map((app) => app.id),
      recentModuleIds: currentState?.recentModuleIds || [],
    });
  }, [pinnedApps]);
}

/**
 * Hook to track and persist recent modules
 */
export function useRecentModules(): {
  recentModuleIds: string[];
  addRecent: (moduleId: string) => void;
} {
  const [recentModuleIds, setRecentModuleIds] = useState<string[]>([]);

  // Load on mount
  useEffect(() => {
    const state = persistenceService.loadStartMenuState();
    if (state?.recentModuleIds) {
      setRecentModuleIds(state.recentModuleIds);
    }
  }, []);

  const addRecent = useCallback((moduleId: string) => {
    persistenceService.addRecentModule(moduleId);

    // Update local state
    setRecentModuleIds((prev) => {
      const filtered = prev.filter((id) => id !== moduleId);
      return [moduleId, ...filtered].slice(0, 10);
    });
  }, []);

  return { recentModuleIds, addRecent };
}

export default useHydration;

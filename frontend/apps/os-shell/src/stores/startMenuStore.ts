/**
 * TerraFusion OS Start Menu Store
 *
 * Zustand store for managing Start Menu state including:
 * - Open/close state
 * - Search functionality with real-time filtering
 * - Pinned apps management
 * - All apps catalog
 *
 * @module stores/startMenuStore
 * @see SUCCESS CRITERIA SC-3: Start Menu Component
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ModuleStatus = 'active' | 'inactive' | 'loading' | 'error';

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: ModuleStatus;
}

export interface StartMenuState {
  // State
  isOpen: boolean;
  searchQuery: string;
  pinnedApps: Module[];
  allApps: Module[];

  // Actions
  toggle: () => void;
  open: () => void;
  close: () => void;
  clearSearch: () => void;
  setSearchQuery: (query: string) => void;
  setPinnedApps: (apps: Module[]) => void;
  setAllApps: (apps: Module[]) => void;
  addPinnedApp: (app: Module) => void;
  removePinnedApp: (appId: string) => void;

  // Selectors (computed values as functions)
  getFilteredApps: () => Module[];
  getActiveApps: () => Module[];
  getAppsByCategory: () => Record<string, Module[]>;

  // Aliases for StartMenu component compatibility
  getPinnedModules: () => Module[];
  getFilteredModules: () => Module[];
}

// ============================================================================
// Store
// ============================================================================

export const useStartMenuStore = create<StartMenuState>()(
  devtools(
    (set, get) => ({
      // Initial State
      isOpen: false,
      searchQuery: '',
      pinnedApps: [],
      allApps: [],

      // Actions
      toggle: () => {
        const { isOpen } = get();
        if (isOpen) {
          // Closing - clear search query
          set({ isOpen: false, searchQuery: '' });
        } else {
          // Opening
          set({ isOpen: true });
        }
      },

      open: () => {
        set({ isOpen: true });
      },

      close: () => {
        set({ isOpen: false, searchQuery: '' });
      },

      clearSearch: () => {
        set({ searchQuery: '' });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query.trim() });
      },

      setPinnedApps: (apps: Module[]) => {
        set({ pinnedApps: apps });
      },

      setAllApps: (apps: Module[]) => {
        set({ allApps: apps });
      },

      addPinnedApp: (app: Module) => {
        const { pinnedApps } = get();

        // Check if already pinned
        if (pinnedApps.some((pinned) => pinned.id === app.id)) {
          return;
        }

        set({ pinnedApps: [...pinnedApps, app] });
      },

      removePinnedApp: (appId: string) => {
        const { pinnedApps } = get();
        set({ pinnedApps: pinnedApps.filter((app) => app.id !== appId) });
      },

      // Selectors
      getFilteredApps: (): Module[] => {
        const { allApps, searchQuery } = get();

        let filtered = allApps;

        // Filter by search query if present
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = allApps.filter(
            (app) =>
              app.name.toLowerCase().includes(query) ||
              app.description.toLowerCase().includes(query) ||
              app.category.toLowerCase().includes(query)
          );
        }

        // Sort alphabetically by name
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      },

      getActiveApps: (): Module[] => {
        const { allApps } = get();
        return allApps.filter((app) => app.status === 'active');
      },

      getAppsByCategory: (): Record<string, Module[]> => {
        const { allApps } = get();

        return allApps.reduce(
          (grouped, app) => {
            const category = app.category;
            if (!grouped[category]) {
              grouped[category] = [];
            }
            grouped[category].push(app);
            return grouped;
          },
          {} as Record<string, Module[]>
        );
      },

      // Aliases for StartMenu component compatibility
      getPinnedModules: (): Module[] => {
        return get().pinnedApps;
      },

      getFilteredModules: (): Module[] => {
        return get().getFilteredApps();
      },
    }),
    { name: 'TerraFusion-StartMenu-Store' }
  )
);

// ============================================================================
// Convenience Hooks (for React components)
// ============================================================================

/**
 * Hook to get Start Menu open state
 */
export const useStartMenuOpen = () => useStartMenuStore((state) => state.isOpen);

/**
 * Hook to get search query
 */
export const useSearchQuery = () => useStartMenuStore((state) => state.searchQuery);

/**
 * Hook to get pinned apps
 */
export const usePinnedApps = () => useStartMenuStore((state) => state.pinnedApps);

/**
 * Hook to get all apps
 */
export const useAllApps = () => useStartMenuStore((state) => state.allApps);

/**
 * Hook to get Start Menu actions
 */
export const useStartMenuActions = () =>
  useStartMenuStore((state) => ({
    toggle: state.toggle,
    open: state.open,
    close: state.close,
    setSearchQuery: state.setSearchQuery,
    setPinnedApps: state.setPinnedApps,
    setAllApps: state.setAllApps,
    addPinnedApp: state.addPinnedApp,
    removePinnedApp: state.removePinnedApp,
  }));

export default useStartMenuStore;

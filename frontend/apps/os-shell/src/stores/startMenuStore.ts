/**
 * TerraFusion OS Start Menu Store
 *
 * Zustand store for managing Start Menu state including:
 * - Open/close state
 * - Search functionality with real-time filtering
 * - Pinned apps management
 * - Recent apps tracking
 * - All apps catalog
 * - Keyboard navigation state
 *
 * @module stores/startMenuStore
 * @see SUCCESS CRITERIA SC-3: Start Menu Component, Phase 6: Enhancements
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persistenceService } from '../services/persistenceService';

// ============================================================================
// Constants
// ============================================================================

const MAX_RECENT = 10;

// ============================================================================
// Types
// ============================================================================

export type ModuleStatus = 'active' | 'inactive' | 'loading' | 'error';

export type FocusedSection = 'search' | 'pinned' | 'recent' | 'all';

/**
 * Entry type for wiring status display
 * - url: Opens external URL (popup/iframe)
 * - route: Native OS route
 * - mf: Module federation
 */
export type EntryType = 'url' | 'route' | 'mf';

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: ModuleStatus;
  /** Optional: Entry type for wiring status badge (url=external, route=native, mf=federated) */
  entryType?: EntryType;
}

export interface StartMenuState {
  // State
  isOpen: boolean;
  searchQuery: string;
  pinnedApps: Module[];
  recentApps: Module[];
  allApps: Module[];

  // Module launch state (for integration with ModuleLoader)
  selectedModuleId: string | null;

  // Keyboard navigation state
  focusedIndex: number;
  focusedSection: FocusedSection;

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

  // Recent apps actions
  addRecentApp: (app: Module) => void;
  setRecentApps: (apps: Module[]) => void;
  clearRecentApps: () => void;

  // Keyboard navigation actions
  setFocusedIndex: (index: number) => void;
  setFocusedSection: (section: FocusedSection) => void;
  resetFocus: () => void;

  // Module launch actions
  launchModule: (moduleId: string) => void;
  clearSelectedModule: () => void;

  // Selectors (computed values as functions)
  getFilteredApps: () => Module[];
  getActiveApps: () => Module[];
  getAppsByCategory: () => Record<string, Module[]>;
  getRecentModules: () => Module[];

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
      recentApps: [],
      allApps: [],
      selectedModuleId: null,
      focusedIndex: -1,
      focusedSection: 'search',

      // Actions
      toggle: () => {
        const { isOpen } = get();
        if (isOpen) {
          // Closing - clear search query and reset focus
          set({ isOpen: false, searchQuery: '', focusedIndex: -1, focusedSection: 'search' });
        } else {
          // Opening
          set({ isOpen: true });
        }
      },

      open: () => {
        set({ isOpen: true });
      },

      close: () => {
        set({ isOpen: false, searchQuery: '', focusedIndex: -1, focusedSection: 'search' });
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

      // Recent apps actions
      addRecentApp: (app: Module) => {
        const { recentApps } = get();

        // Remove if already exists (will re-add at front)
        const filtered = recentApps.filter((a) => a.id !== app.id);

        // Add to front
        const updated = [app, ...filtered];

        // Limit to MAX_RECENT
        const limited = updated.slice(0, MAX_RECENT);

        set({ recentApps: limited });

        // Persist to localStorage
        try {
          persistenceService.addRecentModule(app.id);
        } catch {
          // Ignore persistence errors
        }
      },

      setRecentApps: (apps: Module[]) => {
        set({ recentApps: apps.slice(0, MAX_RECENT) });
      },

      clearRecentApps: () => {
        set({ recentApps: [] });
      },

      // Keyboard navigation actions
      setFocusedIndex: (index: number) => {
        set({ focusedIndex: index });
      },

      setFocusedSection: (section: FocusedSection) => {
        set({ focusedSection: section, focusedIndex: 0 });
      },

      resetFocus: () => {
        set({ focusedIndex: -1, focusedSection: 'search' });
      },

      // Module launch actions
      launchModule: (moduleId: string) => {
        // Set the selected module and close the menu
        set({
          selectedModuleId: moduleId,
          isOpen: false,
          searchQuery: '',
          focusedIndex: -1,
          focusedSection: 'search',
        });
      },

      clearSelectedModule: () => {
        set({ selectedModuleId: null });
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

      getRecentModules: (): Module[] => {
        return get().recentApps;
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
 * Hook to get recent apps
 */
export const useRecentApps = () => useStartMenuStore((state) => state.recentApps);

/**
 * Hook to get all apps
 */
export const useAllApps = () => useStartMenuStore((state) => state.allApps);

/**
 * Hook to get keyboard navigation state
 */
export const useFocusState = () =>
  useStartMenuStore((state) => ({
    focusedIndex: state.focusedIndex,
    focusedSection: state.focusedSection,
  }));

/**
 * Hook to get Start Menu actions
 */
export const useStartMenuActions = () =>
  useStartMenuStore((state) => ({
    toggle: state.toggle,
    open: state.open,
    close: state.close,
    setSearchQuery: state.setSearchQuery,
    clearSearch: state.clearSearch,
    setPinnedApps: state.setPinnedApps,
    setAllApps: state.setAllApps,
    addPinnedApp: state.addPinnedApp,
    removePinnedApp: state.removePinnedApp,
    addRecentApp: state.addRecentApp,
    setRecentApps: state.setRecentApps,
    clearRecentApps: state.clearRecentApps,
    setFocusedIndex: state.setFocusedIndex,
    setFocusedSection: state.setFocusedSection,
    resetFocus: state.resetFocus,
    launchModule: state.launchModule,
    clearSelectedModule: state.clearSelectedModule,
  }));

/**
 * Hook to get the currently selected module ID (for ModuleLoader integration)
 */
export const useSelectedModuleId = () => useStartMenuStore((state) => state.selectedModuleId);

export default useStartMenuStore;

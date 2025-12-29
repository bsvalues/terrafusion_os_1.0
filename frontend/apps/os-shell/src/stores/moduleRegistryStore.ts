/**
 * TerraFusion OS Module Registry Store
 * 
 * Zustand store for managing the module registry including:
 * - Module definitions from API
 * - Loading states per module
 * - Integration with desktopStore for window management
 * - Selectors for filtering/grouping modules
 * 
 * @module stores/moduleRegistryStore
 * @see SUCCESS CRITERIA Phase 3.1
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useDesktopStore } from './desktopStore';

// ============================================================================
// Types
// ============================================================================

export type ModuleTier = 'Tier1' | 'Tier2' | 'Tier3';
export type ModuleStatus = 'active' | 'inactive' | 'loading' | 'error';
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface ModuleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  tier: ModuleTier;
  status: ModuleStatus;
  version: string;
  launchPath: string;
  isCore: boolean;
  priority: number;
}

export interface ModuleLoadState {
  status: LoadStatus;
  error: string | null;
  windowId: string | null;
}

export interface ModuleRegistryState {
  // State
  modules: Map<string, ModuleDefinition>;
  loadStates: Map<string, ModuleLoadState>;
  isInitialized: boolean;
  initError: string | null;

  // Actions
  registerModules: (modules: ModuleDefinition[]) => void;
  launchModule: (moduleId: string) => Promise<string | null>;
  closeModule: (moduleId: string) => void;
  setModuleError: (moduleId: string, error: string) => void;

  // Selectors
  getModuleById: (moduleId: string) => ModuleDefinition | undefined;
  getModulesByCategory: () => Record<string, ModuleDefinition[]>;
  getModulesByTier: (tier: ModuleTier) => ModuleDefinition[];
  getActiveModules: () => ModuleDefinition[];
  getCoreModules: () => ModuleDefinition[];
  getAllModulesArray: () => ModuleDefinition[];
  isModuleLoaded: (moduleId: string) => boolean;
  isModuleLoading: (moduleId: string) => boolean;
  getModuleWindowId: (moduleId: string) => string | null;
}

// ============================================================================
// Store
// ============================================================================

export const useModuleRegistryStore = create<ModuleRegistryState>()(
  devtools(
    (set, get) => ({
      // Initial State
      modules: new Map(),
      loadStates: new Map(),
      isInitialized: false,
      initError: null,

      // Actions
      registerModules: (modules: ModuleDefinition[]) => {
        const modulesMap = new Map<string, ModuleDefinition>();
        const loadStatesMap = new Map<string, ModuleLoadState>();

        modules.forEach(module => {
          modulesMap.set(module.id, module);
          loadStatesMap.set(module.id, {
            status: 'idle',
            error: null,
            windowId: null,
          });
        });

        set({
          modules: modulesMap,
          loadStates: loadStatesMap,
          isInitialized: true,
          initError: null,
        });
      },

      launchModule: async (moduleId: string): Promise<string | null> => {
        const { modules, loadStates } = get();
        const module = modules.get(moduleId);

        if (!module) {
          throw new Error(`Module not found: ${moduleId}`);
        }

        // Check if already loaded - focus existing window
        const existingState = loadStates.get(moduleId);
        if (existingState?.status === 'loaded' && existingState.windowId) {
          const desktopState = useDesktopStore.getState();
          // Verify window still exists
          const windowExists = desktopState.windows.some(
            (w: { id: string; moduleId: string }) => w.id === existingState.windowId
          );
          if (windowExists) {
            desktopState.focusWindow(existingState.windowId);
            return existingState.windowId;
          }
        }

        // Set loading state
        set({
          loadStates: new Map(loadStates).set(moduleId, {
            status: 'loading',
            error: null,
            windowId: null,
          }),
        });

        try {
          // Open window in desktop store
          const desktopState = useDesktopStore.getState();
          const windowId = desktopState.openWindow(
            module.id,
            module.displayName,
            module.icon
          );

          // Update load state to loaded
          set({
            loadStates: new Map(get().loadStates).set(moduleId, {
              status: 'loaded',
              error: null,
              windowId,
            }),
          });

          return windowId;
        } catch (error) {
          // Update load state to error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            loadStates: new Map(get().loadStates).set(moduleId, {
              status: 'error',
              error: errorMessage,
              windowId: null,
            }),
          });
          throw error;
        }
      },

      closeModule: (moduleId: string) => {
        const { loadStates } = get();
        
        if (!loadStates.has(moduleId)) {
          return; // Module not registered, do nothing
        }

        set({
          loadStates: new Map(loadStates).set(moduleId, {
            status: 'idle',
            error: null,
            windowId: null,
          }),
        });
      },

      setModuleError: (moduleId: string, error: string) => {
        const { loadStates } = get();
        
        set({
          loadStates: new Map(loadStates).set(moduleId, {
            status: 'error',
            error,
            windowId: null,
          }),
        });
      },

      // Selectors
      getModuleById: (moduleId: string): ModuleDefinition | undefined => {
        return get().modules.get(moduleId);
      },

      getModulesByCategory: (): Record<string, ModuleDefinition[]> => {
        const { modules } = get();
        const grouped: Record<string, ModuleDefinition[]> = {};

        modules.forEach(module => {
          if (!grouped[module.category]) {
            grouped[module.category] = [];
          }
          grouped[module.category].push(module);
        });

        return grouped;
      },

      getModulesByTier: (tier: ModuleTier): ModuleDefinition[] => {
        const { modules } = get();
        return Array.from(modules.values()).filter(m => m.tier === tier);
      },

      getActiveModules: (): ModuleDefinition[] => {
        const { modules } = get();
        return Array.from(modules.values()).filter(m => m.status === 'active');
      },

      getCoreModules: (): ModuleDefinition[] => {
        const { modules } = get();
        return Array.from(modules.values()).filter(m => m.isCore === true);
      },

      getAllModulesArray: (): ModuleDefinition[] => {
        const { modules } = get();
        return Array.from(modules.values()).sort((a, b) => a.priority - b.priority);
      },

      isModuleLoaded: (moduleId: string): boolean => {
        const { loadStates } = get();
        return loadStates.get(moduleId)?.status === 'loaded';
      },

      isModuleLoading: (moduleId: string): boolean => {
        const { loadStates } = get();
        return loadStates.get(moduleId)?.status === 'loading';
      },

      getModuleWindowId: (moduleId: string): string | null => {
        const { loadStates } = get();
        return loadStates.get(moduleId)?.windowId ?? null;
      },
    }),
    { name: 'TerraFusion-ModuleRegistry-Store' }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get initialization status
 */
export const useModuleRegistryInitialized = () => 
  useModuleRegistryStore((state) => state.isInitialized);

/**
 * Hook to get all modules as array
 */
export const useAllModules = () => 
  useModuleRegistryStore((state) => state.getAllModulesArray());

/**
 * Hook to get active modules
 */
export const useActiveModules = () => 
  useModuleRegistryStore((state) => state.getActiveModules());

/**
 * Hook to get core modules
 */
export const useCoreModules = () => 
  useModuleRegistryStore((state) => state.getCoreModules());

/**
 * Hook to get module registry actions
 */
export const useModuleRegistryActions = () => 
  useModuleRegistryStore((state) => ({
    registerModules: state.registerModules,
    launchModule: state.launchModule,
    closeModule: state.closeModule,
    setModuleError: state.setModuleError,
  }));

/**
 * Hook to check if a specific module is loaded
 */
export const useIsModuleLoaded = (moduleId: string) => 
  useModuleRegistryStore((state) => state.isModuleLoaded(moduleId));

/**
 * Hook to check if a specific module is loading
 */
export const useIsModuleLoading = (moduleId: string) => 
  useModuleRegistryStore((state) => state.isModuleLoading(moduleId));

export default useModuleRegistryStore;

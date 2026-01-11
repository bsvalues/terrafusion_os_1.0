/**
 * TerraFusion OS Module Registry Store
 * 
 * Zustand store for managing module registration and lazy loading.
 * Supports:
 * - Module definition registration
 * - Lazy loading with caching
 * - Loading state tracking (idle, loading, loaded, error)
 * - Error handling and retry
 * 
 * Phase 3.1: App Module System - Module Registry
 * 
 * @module stores/moduleRegistryStore
 * @see SUCCESS CRITERIA SC-5: App Module System
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ComponentType } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Loading states for modules
 */
export type ModuleLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Module definition - metadata about a module that can be registered
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  entryPoint: string;
  permissions: string[];
  category: string;
}

/**
 * A loaded module with its component ready to render
 */
export interface LoadedModule {
  definition: ModuleDefinition;
  component: ComponentType<unknown>;
  loadedAt: Date;
}

/**
 * Function signature for module loaders
 */
export type ModuleLoader = (definition: ModuleDefinition) => Promise<ComponentType<unknown>>;

/**
 * Module Registry Store State
 */
export interface ModuleRegistryState {
  // State
  definitions: Map<string, ModuleDefinition>;
  loadedModules: Map<string, LoadedModule>;
  loadingStates: Map<string, ModuleLoadState>;
  errors: Map<string, Error>;
  moduleLoader: ModuleLoader | null;

  // Actions
  registerModule: (definition: ModuleDefinition) => void;
  registerModules: (definitions: ModuleDefinition[]) => void;
  unregisterModule: (moduleId: string) => void;
  loadModule: (moduleId: string) => Promise<LoadedModule>;
  unloadModule: (moduleId: string) => void;
  setModuleLoader: (loader: ModuleLoader) => void;
  retryLoad: (moduleId: string) => Promise<LoadedModule>;

  // Selectors
  getDefinition: (moduleId: string) => ModuleDefinition | undefined;
  getLoadedModule: (moduleId: string) => LoadedModule | undefined;
  isModuleLoaded: (moduleId: string) => boolean;
  isModuleLoading: (moduleId: string) => boolean;
  getModuleError: (moduleId: string) => Error | undefined;
  getLoadingState: (moduleId: string) => ModuleLoadState | undefined;
  getAllDefinitions: () => ModuleDefinition[];
  getDefinitionsByCategory: () => Record<string, ModuleDefinition[]>;
  getLoadedModuleIds: () => string[];
}

// ============================================================================
// Default Module Loader
// ============================================================================

/**
 * Default module loader that dynamically imports from entryPoint
 * This can be replaced with setModuleLoader for testing or custom loading
 */
const defaultModuleLoader: ModuleLoader = async (definition: ModuleDefinition) => {
  // In production, this would use dynamic imports
  // For now, throw to indicate implementation needed
  throw new Error(`No module loader configured for: ${definition.id}`);
};

// ============================================================================
// Store
// ============================================================================

export const useModuleRegistryStore = create<ModuleRegistryState>()(
  devtools(
    (set, get) => ({
      // Initial State
      definitions: new Map(),
      loadedModules: new Map(),
      loadingStates: new Map(),
      errors: new Map(),
      moduleLoader: null,

      // Actions
      registerModule: (definition: ModuleDefinition) => {
        set((state) => {
          const newDefinitions = new Map(state.definitions);
          const newLoadingStates = new Map(state.loadingStates);
          
          newDefinitions.set(definition.id, definition);
          
          // Only set to idle if not already in loadingStates
          if (!newLoadingStates.has(definition.id)) {
            newLoadingStates.set(definition.id, 'idle');
          }
          
          return {
            definitions: newDefinitions,
            loadingStates: newLoadingStates,
          };
        });
      },

      registerModules: (definitions: ModuleDefinition[]) => {
        const { registerModule } = get();
        definitions.forEach(registerModule);
      },

      unregisterModule: (moduleId: string) => {
        set((state) => {
          const newDefinitions = new Map(state.definitions);
          const newLoadedModules = new Map(state.loadedModules);
          const newLoadingStates = new Map(state.loadingStates);
          const newErrors = new Map(state.errors);

          newDefinitions.delete(moduleId);
          newLoadedModules.delete(moduleId);
          newLoadingStates.delete(moduleId);
          newErrors.delete(moduleId);

          return {
            definitions: newDefinitions,
            loadedModules: newLoadedModules,
            loadingStates: newLoadingStates,
            errors: newErrors,
          };
        });
      },

      loadModule: async (moduleId: string): Promise<LoadedModule> => {
        const state = get();
        const definition = state.definitions.get(moduleId);

        // Check if module is registered
        if (!definition) {
          throw new Error(`Module not registered: ${moduleId}`);
        }

        // Return cached if already loaded
        const existingLoaded = state.loadedModules.get(moduleId);
        if (existingLoaded && state.loadingStates.get(moduleId) === 'loaded') {
          return existingLoaded;
        }

        // Set loading state
        set((state) => ({
          loadingStates: new Map(state.loadingStates).set(moduleId, 'loading'),
          errors: new Map([...state.errors].filter(([k]) => k !== moduleId)),
        }));

        try {
          // Use custom loader or default
          const loader = state.moduleLoader || defaultModuleLoader;
          const component = await loader(definition);

          const loadedModule: LoadedModule = {
            definition,
            component,
            loadedAt: new Date(),
          };

          set((state) => ({
            loadedModules: new Map(state.loadedModules).set(moduleId, loadedModule),
            loadingStates: new Map(state.loadingStates).set(moduleId, 'loaded'),
          }));

          return loadedModule;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          
          set((state) => ({
            loadingStates: new Map(state.loadingStates).set(moduleId, 'error'),
            errors: new Map(state.errors).set(moduleId, err),
          }));

          throw err;
        }
      },

      unloadModule: (moduleId: string) => {
        set((state) => {
          const newLoadedModules = new Map(state.loadedModules);
          const newLoadingStates = new Map(state.loadingStates);
          const newErrors = new Map(state.errors);

          newLoadedModules.delete(moduleId);
          newErrors.delete(moduleId);
          
          // Reset to idle if module is still registered
          if (state.definitions.has(moduleId)) {
            newLoadingStates.set(moduleId, 'idle');
          }

          return {
            loadedModules: newLoadedModules,
            loadingStates: newLoadingStates,
            errors: newErrors,
          };
        });
      },

      setModuleLoader: (loader: ModuleLoader) => {
        set({ moduleLoader: loader });
      },

      retryLoad: async (moduleId: string): Promise<LoadedModule> => {
        // Clear error state first
        set((state) => {
          const newErrors = new Map(state.errors);
          newErrors.delete(moduleId);
          return { errors: newErrors };
        });

        // Attempt to load again
        return get().loadModule(moduleId);
      },

      // Selectors
      getDefinition: (moduleId: string): ModuleDefinition | undefined => {
        return get().definitions.get(moduleId);
      },

      getLoadedModule: (moduleId: string): LoadedModule | undefined => {
        return get().loadedModules.get(moduleId);
      },

      isModuleLoaded: (moduleId: string): boolean => {
        return get().loadingStates.get(moduleId) === 'loaded';
      },

      isModuleLoading: (moduleId: string): boolean => {
        return get().loadingStates.get(moduleId) === 'loading';
      },

      getModuleError: (moduleId: string): Error | undefined => {
        return get().errors.get(moduleId);
      },

      getLoadingState: (moduleId: string): ModuleLoadState | undefined => {
        return get().loadingStates.get(moduleId);
      },

      getAllDefinitions: (): ModuleDefinition[] => {
        return Array.from(get().definitions.values());
      },

      getDefinitionsByCategory: (): Record<string, ModuleDefinition[]> => {
        const definitions = get().definitions;
        const result: Record<string, ModuleDefinition[]> = {};

        definitions.forEach((def) => {
          if (!result[def.category]) {
            result[def.category] = [];
          }
          result[def.category].push(def);
        });

        return result;
      },

      getLoadedModuleIds: (): string[] => {
        const { loadingStates } = get();
        return Array.from(loadingStates.entries())
          .filter(([_, state]) => state === 'loaded')
          .map(([id]) => id);
      },
    }),
    { name: 'TerraFusion-ModuleRegistry-Store' }
  )
);

// ============================================================================
// Convenience Hooks (for React components)
// ============================================================================

/**
 * Hook to get all module definitions
 */
export const useModuleDefinitions = () => 
  useModuleRegistryStore((state) => Array.from(state.definitions.values()));

/**
 * Hook to get loaded modules
 */
export const useLoadedModules = () => 
  useModuleRegistryStore((state) => Array.from(state.loadedModules.values()));

/**
 * Hook to get loading state for a specific module
 */
export const useModuleLoadingState = (moduleId: string) => 
  useModuleRegistryStore((state) => state.loadingStates.get(moduleId));

/**
 * Hook to get error for a specific module
 */
export const useModuleError = (moduleId: string) => 
  useModuleRegistryStore((state) => state.errors.get(moduleId));

/**
 * Hook to get module registry actions
 */
export const useModuleRegistryActions = () => useModuleRegistryStore((state) => ({
  registerModule: state.registerModule,
  registerModules: state.registerModules,
  unregisterModule: state.unregisterModule,
  loadModule: state.loadModule,
  unloadModule: state.unloadModule,
  setModuleLoader: state.setModuleLoader,
  retryLoad: state.retryLoad,
}));

export default useModuleRegistryStore;

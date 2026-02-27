/**
 * TerraFusion OS Module Loader Store
 *
 * State machine for module loading with:
 * - Promise deduplication (no double-loads on rapid clicks)
 * - Race safety (selection changes cancel stale loads)
 * - Error recovery with retry capability
 * - ATLAS telemetry integration
 *
 * @module stores/moduleLoaderStore
 * @see Phase 2: Infrastructure Layer
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { normalizeModuleId as canonicalNormalize, isModuleRegistered as canonicalIsRegistered } from '../config/moduleComponents';
import { analytics } from '../utils/analytics';

// ============================================================================
// Types
// ============================================================================

export type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export interface LoadError {
  message: string;
  code?: string;
  timestamp: number;
  retryCount: number;
}

export interface LoadResult {
  moduleId: string;
  loadedAt: number;
  durationMs: number;
}

export interface ModuleLoadEntry {
  status: LoadState;
  error: LoadError | null;
  result: LoadResult | null;
}

// Internal tracking for promise deduplication
interface LoadingPromiseEntry {
  promise: Promise<LoadResult>;
  requestId: number;
  startTime: number;
}

// MODULE_ALIASES and MODULE_REGISTRY are now imported from the canonical source:
// config/moduleComponents.tsx (single source of truth, no duplication)

// ============================================================================
// Store State
// ============================================================================

export interface ModuleLoaderState {
  // State maps
  loadStates: Map<string, ModuleLoadEntry>;

  // Race safety: current request ID per module
  currentRequestIds: Map<string, number>;

  // Promise deduplication: active loading promises
  loadingPromises: Map<string, LoadingPromiseEntry>;

  // Global request counter for race safety
  requestCounter: number;

  // Actions
  loadModule: (moduleId: string) => Promise<LoadResult>;
  retryModule: (moduleId: string) => Promise<LoadResult>;
  resetModule: (moduleId: string) => void;
  resetAllModules: () => void;

  // Selectors
  getModuleState: (moduleId: string) => ModuleLoadEntry;
  isModuleLoading: (moduleId: string) => boolean;
  isModuleLoaded: (moduleId: string) => boolean;
  hasModuleError: (moduleId: string) => boolean;
  getModuleError: (moduleId: string) => LoadError | null;

  // Utilities
  normalizeModuleId: (moduleId: string) => string;
  isModuleRegistered: (moduleId: string) => boolean;
}

// ============================================================================
// Default State
// ============================================================================

const createDefaultEntry = (): ModuleLoadEntry => ({
  status: 'idle',
  error: null,
  result: null,
});

// ============================================================================
// Telemetry Helpers
// ============================================================================

const trackModuleEvent = (
  eventName: string,
  moduleId: string,
  properties?: Record<string, unknown>
) => {
  analytics.trackEvent({
    name: eventName,
    properties: {
      moduleId,
      timestamp: Date.now(),
      ...properties,
    },
  });
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useModuleLoaderStore = create<ModuleLoaderState>()(
  devtools(
    (set, get) => ({
      // Initial state
      loadStates: new Map(),
      currentRequestIds: new Map(),
      loadingPromises: new Map(),
      requestCounter: 0,

      // ========================================================================
      // Utility Functions
      // ========================================================================

      normalizeModuleId: (moduleId: string): string => {
        return canonicalNormalize(moduleId);
      },

      isModuleRegistered: (moduleId: string): boolean => {
        return canonicalIsRegistered(moduleId);
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      getModuleState: (moduleId: string): ModuleLoadEntry => {
        const normalized = get().normalizeModuleId(moduleId);
        return get().loadStates.get(normalized) || createDefaultEntry();
      },

      isModuleLoading: (moduleId: string): boolean => {
        return get().getModuleState(moduleId).status === 'loading';
      },

      isModuleLoaded: (moduleId: string): boolean => {
        return get().getModuleState(moduleId).status === 'loaded';
      },

      hasModuleError: (moduleId: string): boolean => {
        return get().getModuleState(moduleId).status === 'error';
      },

      getModuleError: (moduleId: string): LoadError | null => {
        return get().getModuleState(moduleId).error;
      },

      // ========================================================================
      // Actions
      // ========================================================================

      loadModule: async (moduleId: string): Promise<LoadResult> => {
        const state = get();
        const normalizedId = state.normalizeModuleId(moduleId);

        // Track activation event
        trackModuleEvent('module.activate', normalizedId);

        // ====================================================================
        // Check 1: Already loaded? Return cached result
        // ====================================================================
        const existingState = state.loadStates.get(normalizedId);
        if (existingState?.status === 'loaded' && existingState.result) {
          trackModuleEvent('module.cache_hit', normalizedId);
          return existingState.result;
        }

        // ====================================================================
        // Check 2: Already loading? Return existing promise (dedupe)
        // ====================================================================
        const existingPromise = state.loadingPromises.get(normalizedId);
        if (existingPromise) {
          trackModuleEvent('module.dedupe', normalizedId, {
            existingRequestId: existingPromise.requestId,
          });
          return existingPromise.promise;
        }

        // ====================================================================
        // Check 3: Module not registered? Fail fast
        // ====================================================================
        if (!state.isModuleRegistered(normalizedId)) {
          // Preserve retry count from previous error state
          const existingError = state.loadStates.get(normalizedId)?.error;
          const retryCount = (existingError?.retryCount ?? -1) + 1;

          const error: LoadError = {
            message: `Module "${normalizedId}" is not registered`,
            code: 'MODULE_NOT_FOUND',
            timestamp: Date.now(),
            retryCount,
          };

          set((s) => ({
            loadStates: new Map(s.loadStates).set(normalizedId, {
              status: 'error',
              error,
              result: null,
            }),
          }));

          trackModuleEvent('module.error', normalizedId, {
            errorCode: error.code,
            // Safe: no sensitive data in this message
            errorKind: 'MODULE_NOT_FOUND',
          });

          throw new Error(error.message);
        }

        // ====================================================================
        // Create new load request
        // ====================================================================
        const requestId = state.requestCounter + 1;
        const startTime = performance.now();

        // Create the load promise
        const loadPromise = (async (): Promise<LoadResult> => {
          // Simulate async module resolution
          // In practice, React.lazy handles the actual chunk loading
          // This is for state machine lifecycle + telemetry
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Race safety check: is this request still current?
          const currentId = get().currentRequestIds.get(normalizedId);
          if (currentId !== requestId) {
            throw new Error('Request superseded by newer load');
          }

          const durationMs = Math.round(performance.now() - startTime);
          const result: LoadResult = {
            moduleId: normalizedId,
            loadedAt: Date.now(),
            durationMs,
          };

          // Update state to loaded
          set((s) => {
            const newLoadStates = new Map(s.loadStates);
            newLoadStates.set(normalizedId, {
              status: 'loaded',
              error: null,
              result,
            });

            const newLoadingPromises = new Map(s.loadingPromises);
            newLoadingPromises.delete(normalizedId);

            return {
              loadStates: newLoadStates,
              loadingPromises: newLoadingPromises,
            };
          });

          // Track success
          trackModuleEvent('module.loaded', normalizedId, {
            durationMs,
            requestId,
          });

          return result;
        })();

        // Handle errors
        const safePromise = loadPromise.catch((error) => {
          // Only update state if this request is still current
          const currentId = get().currentRequestIds.get(normalizedId);
          if (currentId === requestId) {
            const existingError = get().getModuleError(normalizedId);
            const retryCount = (existingError?.retryCount || 0) + 1;

            const loadError: LoadError = {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'LOAD_FAILED',
              timestamp: Date.now(),
              retryCount,
            };

            set((s) => {
              const newLoadStates = new Map(s.loadStates);
              newLoadStates.set(normalizedId, {
                status: 'error',
                error: loadError,
                result: null,
              });

              const newLoadingPromises = new Map(s.loadingPromises);
              newLoadingPromises.delete(normalizedId);

              return {
                loadStates: newLoadStates,
                loadingPromises: newLoadingPromises,
              };
            });

            trackModuleEvent('module.error', normalizedId, {
              errorCode: loadError.code,
              // Truncate error message to prevent leaking sensitive data
              errorKind: loadError.message?.split(':')[0]?.slice(0, 50) || 'Unknown',
              retryCount,
            });
          }

          throw error;
        });

        // Update state to loading
        set((s) => ({
          requestCounter: requestId,
          currentRequestIds: new Map(s.currentRequestIds).set(normalizedId, requestId),
          loadingPromises: new Map(s.loadingPromises).set(normalizedId, {
            promise: safePromise,
            requestId,
            startTime,
          }),
          loadStates: new Map(s.loadStates).set(normalizedId, {
            status: 'loading',
            error: null,
            result: null,
          }),
        }));

        return safePromise;
      },

      retryModule: async (moduleId: string): Promise<LoadResult> => {
        const state = get();
        const normalizedId = state.normalizeModuleId(moduleId);

        // Reset the module state first
        state.resetModule(moduleId);

        trackModuleEvent('module.retry', normalizedId);

        // Re-attempt load
        return state.loadModule(moduleId);
      },

      resetModule: (moduleId: string): void => {
        const normalizedId = get().normalizeModuleId(moduleId);

        set((s) => {
          const newLoadStates = new Map(s.loadStates);
          newLoadStates.delete(normalizedId);

          const newLoadingPromises = new Map(s.loadingPromises);
          newLoadingPromises.delete(normalizedId);

          const newCurrentRequestIds = new Map(s.currentRequestIds);
          newCurrentRequestIds.delete(normalizedId);

          return {
            loadStates: newLoadStates,
            loadingPromises: newLoadingPromises,
            currentRequestIds: newCurrentRequestIds,
          };
        });

        trackModuleEvent('module.reset', normalizedId);
      },

      resetAllModules: (): void => {
        set({
          loadStates: new Map(),
          loadingPromises: new Map(),
          currentRequestIds: new Map(),
        });

        trackModuleEvent('module.reset_all', 'all');
      },
    }),
    { name: 'TerraFusion-ModuleLoader-Store' }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get module load state
 */
export const useModuleLoadState = (moduleId: string) =>
  useModuleLoaderStore((state) => state.getModuleState(moduleId));

/**
 * Hook to check if module is loading
 */
export const useIsModuleLoading = (moduleId: string) =>
  useModuleLoaderStore((state) => state.isModuleLoading(moduleId));

/**
 * Hook to check if module is loaded
 */
export const useIsModuleLoaded = (moduleId: string) =>
  useModuleLoaderStore((state) => state.isModuleLoaded(moduleId));

/**
 * Hook to get module error
 */
export const useModuleError = (moduleId: string) =>
  useModuleLoaderStore((state) => state.getModuleError(moduleId));

/**
 * Hook to get loader actions
 */
export const useModuleLoaderActions = () =>
  useModuleLoaderStore((state) => ({
    loadModule: state.loadModule,
    retryModule: state.retryModule,
    resetModule: state.resetModule,
    resetAllModules: state.resetAllModules,
    normalizeModuleId: state.normalizeModuleId,
    isModuleRegistered: state.isModuleRegistered,
  }));

export default useModuleLoaderStore;

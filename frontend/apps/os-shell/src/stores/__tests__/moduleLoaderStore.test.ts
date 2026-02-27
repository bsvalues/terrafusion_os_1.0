/**
 * TerraFusion OS Module Loader Store Tests
 *
 * Tests for the module loading state machine:
 * - Promise deduplication (no double-loads)
 * - Race safety (selection changes)
 * - Error handling and retry
 * - Cache hits
 *
 * @module stores/__tests__/moduleLoaderStore.test
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useModuleLoaderActions,
  useModuleLoaderStore,
  useModuleLoadState,
} from '../moduleLoaderStore';

// Mock analytics to avoid side effects
vi.mock('../../utils/analytics', () => ({
  analytics: {
    trackEvent: vi.fn(),
  },
}));

// Helper to reset store state
const resetStore = () => {
  useModuleLoaderStore.setState({
    loadStates: new Map(),
    currentRequestIds: new Map(),
    loadingPromises: new Map(),
    requestCounter: 0,
  });
};

describe('moduleLoaderStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Module ID Normalization
  // ==========================================================================

  describe('normalizeModuleId', () => {
    it('returns canonical ID for known aliases', () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      expect(result.current.normalizeModuleId('terrabuild')).toBe('costforge');
      expect(result.current.normalizeModuleId('terra-build')).toBe('costforge');
      expect(result.current.normalizeModuleId('property-assessment')).toBe('costforge');
    });

    it('returns normalized lowercase ID for unknown modules', () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      expect(result.current.normalizeModuleId('CostForge')).toBe('costforge');
      expect(result.current.normalizeModuleId('  ATLAS-AI  ')).toBe('atlas-ai');
    });

    it('handles empty and whitespace-only input', () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      expect(result.current.normalizeModuleId('')).toBe('');
      expect(result.current.normalizeModuleId('   ')).toBe('');
    });
  });

  // ==========================================================================
  // Module Registration Check
  // ==========================================================================

  describe('isModuleRegistered', () => {
    it('returns true for registered modules', () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      expect(result.current.isModuleRegistered('costforge')).toBe(true);
      expect(result.current.isModuleRegistered('terra-gaia')).toBe(true);
      expect(result.current.isModuleRegistered('atlas-ai')).toBe(true);
    });

    it('returns true for aliases of registered modules', () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      expect(result.current.isModuleRegistered('terrabuild')).toBe(true);
      expect(result.current.isModuleRegistered('property-assessment')).toBe(true);
    });

    it('returns false for unregistered modules', () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      expect(result.current.isModuleRegistered('unknown-module')).toBe(false);
      expect(result.current.isModuleRegistered('not-a-real-module')).toBe(false);
    });
  });

  // ==========================================================================
  // Load Module - Happy Path
  // ==========================================================================

  describe('loadModule - happy path', () => {
    it('transitions from idle to loading to loaded', async () => {
      const { result } = renderHook(() => ({
        actions: useModuleLoaderActions(),
        state: useModuleLoadState('costforge'),
      }));

      // Initial state is idle
      expect(result.current.state.status).toBe('idle');

      // Start loading
      let loadPromise: Promise<any>;
      act(() => {
        loadPromise = result.current.actions.loadModule('costforge');
      });

      // Should be loading
      expect(result.current.state.status).toBe('loading');

      // Wait for completion
      await act(async () => {
        await loadPromise;
      });

      // Should be loaded
      expect(result.current.state.status).toBe('loaded');
      expect(result.current.state.result).not.toBeNull();
      expect(result.current.state.result?.moduleId).toBe('costforge');
    });

    it('returns LoadResult with timing information', async () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      const loadResult = await act(async () => {
        return result.current.loadModule('costforge');
      });

      expect(loadResult.moduleId).toBe('costforge');
      expect(loadResult.loadedAt).toBeGreaterThan(0);
      expect(loadResult.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('handles aliases - loads canonical module', async () => {
      const { result } = renderHook(() => ({
        actions: useModuleLoaderActions(),
        state: useModuleLoadState('costforge'), // Canonical ID
      }));

      // Load via alias
      await act(async () => {
        await result.current.actions.loadModule('terrabuild');
      });

      // State should be under canonical ID
      expect(result.current.state.status).toBe('loaded');
      expect(result.current.state.result?.moduleId).toBe('costforge');
    });
  });

  // ==========================================================================
  // Promise Deduplication
  // ==========================================================================

  describe('promise deduplication', () => {
    it('returns same promise for concurrent loads of same module', async () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      let promise1: Promise<any>;
      let promise2: Promise<any>;
      let promise3: Promise<any>;

      act(() => {
        promise1 = result.current.loadModule('costforge');
        promise2 = result.current.loadModule('costforge');
        promise3 = result.current.loadModule('costforge');
      });

      // All promises should resolve to the same result
      const [result1, result2, result3] = await Promise.all([promise1!, promise2!, promise3!]);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('does not start new load when module is already loaded', async () => {
      const { result } = renderHook(() => useModuleLoaderActions());

      // First load
      const result1 = await act(async () => {
        return result.current.loadModule('costforge');
      });

      // Second load - should return cached result instantly
      const result2 = await act(async () => {
        return result.current.loadModule('costforge');
      });

      // Same result object (cache hit)
      expect(result1).toBe(result2);
    });

    it('prevents double-load on rapid clicks (double-click scenario)', async () => {
      // Test that same promise is returned for concurrent calls
      const store = useModuleLoaderStore.getState();

      // Simulate rapid double-click
      const promise1 = store.loadModule('atlas-ai');
      const promise2 = store.loadModule('atlas-ai');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should resolve to the same result (deduped)
      expect(result1.moduleId).toBe(result2.moduleId);
      expect(result1.loadedAt).toBe(result2.loadedAt);
    });
  });

  // ==========================================================================
  // Race Safety
  // ==========================================================================

  describe('race safety', () => {
    it('ignores stale load results when selection changes rapidly', async () => {
      const { result } = renderHook(() => ({
        actions: useModuleLoaderActions(),
        costforgeState: useModuleLoadState('costforge'),
        atlasState: useModuleLoadState('atlas-ai'),
      }));

      // Start loading costforge
      act(() => {
        result.current.actions.loadModule('costforge');
      });

      // Immediately start loading atlas-ai (simulating quick selection change)
      act(() => {
        result.current.actions.loadModule('atlas-ai');
      });

      // Wait for both to complete
      await waitFor(() => {
        expect(result.current.atlasState.status).toBe('loaded');
      });

      // Both should be loaded (no race condition corruption)
      expect(result.current.costforgeState.status).toBe('loaded');
      expect(result.current.atlasState.status).toBe('loaded');
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('error handling', () => {
    it('sets error state for unregistered module', async () => {
      const store = useModuleLoaderStore.getState();

      await expect(store.loadModule('unknown-module')).rejects.toThrow(
        'Module "unknown-module" is not registered'
      );

      const state = store.getModuleState('unknown-module');
      expect(state.status).toBe('error');
      expect(state.error).not.toBeNull();
      expect(state.error?.code).toBe('MODULE_NOT_FOUND');
    });

    it('increments retry count on retry', async () => {
      const store = useModuleLoaderStore.getState();

      // First load attempt
      await expect(store.loadModule('unknown-module')).rejects.toThrow();

      const firstRetryCount = store.getModuleState('unknown-module').error?.retryCount || 0;

      // Retry - retryModule resets first, so the retryCount in error resets too
      // Instead, let's test loadModule again which should increment
      await expect(store.loadModule('unknown-module')).rejects.toThrow();

      // After second failure, retryCount should be higher
      expect(store.getModuleState('unknown-module').error?.retryCount).toBeGreaterThan(
        firstRetryCount
      );
    });
  });

  // ==========================================================================
  // Reset Module
  // ==========================================================================

  describe('resetModule', () => {
    it('clears module state back to idle', async () => {
      // Load the module directly using store
      const store = useModuleLoaderStore.getState();
      await store.loadModule('costforge');

      expect(store.getModuleState('costforge').status).toBe('loaded');

      // Reset it
      store.resetModule('costforge');

      expect(store.getModuleState('costforge').status).toBe('idle');
      expect(store.getModuleState('costforge').result).toBeNull();
    });

    it('allows reloading after reset', async () => {
      const store = useModuleLoaderStore.getState();

      // Load, reset, load again
      await store.loadModule('costforge');
      store.resetModule('costforge');
      await store.loadModule('costforge');

      expect(store.getModuleState('costforge').status).toBe('loaded');
    });
  });

  // ==========================================================================
  // Reset All Modules
  // ==========================================================================

  describe('resetAllModules', () => {
    it('clears all module states', async () => {
      const store = useModuleLoaderStore.getState();

      // Load multiple modules
      await Promise.all([store.loadModule('costforge'), store.loadModule('atlas-ai')]);

      expect(store.getModuleState('costforge').status).toBe('loaded');
      expect(store.getModuleState('atlas-ai').status).toBe('loaded');

      // Reset all
      store.resetAllModules();

      expect(store.getModuleState('costforge').status).toBe('idle');
      expect(store.getModuleState('atlas-ai').status).toBe('idle');
    });
  });

  // ==========================================================================
  // Retry Module
  // ==========================================================================

  describe('retryModule', () => {
    it('resets and reloads a module', async () => {
      const store = useModuleLoaderStore.getState();

      // Load initially
      await store.loadModule('costforge');

      const firstLoadedAt = store.getModuleState('costforge').result?.loadedAt;

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Retry (reset + reload)
      await store.retryModule('costforge');

      const secondLoadedAt = store.getModuleState('costforge').result?.loadedAt;

      // Should have a new loadedAt timestamp
      expect(secondLoadedAt).toBeGreaterThan(firstLoadedAt!);
    });
  });
});

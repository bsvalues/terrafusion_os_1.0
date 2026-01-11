/**
 * TerraFusion OS Module Registry Store Tests
 * 
 * Comprehensive test suite for the Zustand store managing module registration and loading.
 * Following TDD principles - tests written BEFORE implementation.
 * 
 * Phase 3.1: App Module System - Module Registry
 * 
 * @module stores/__tests__/moduleRegistryStore.test
 * @see SUCCESS CRITERIA SC-5: App Module System
 */

import { act, renderHook, waitFor } from '@testing-library/react';

// Import will be created after tests are written
import { 
  useModuleRegistryStore,
  type ModuleDefinition,
  type LoadedModule,
  type ModuleLoadState,
} from '../moduleRegistryStore';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockModuleDefinition = (overrides: Partial<ModuleDefinition> = {}): ModuleDefinition => ({
  id: 'test-module',
  name: 'Test Module',
  description: 'A test module for testing',
  icon: '🧪',
  version: '1.0.0',
  entryPoint: '/modules/test-module/index.js',
  permissions: ['read'],
  category: 'testing',
  ...overrides,
});

const mockGovernmentEdition: ModuleDefinition = {
  id: 'government-edition',
  name: 'Government Edition',
  description: 'Core government assessment tools',
  icon: '🏛️',
  version: '2.0.0',
  entryPoint: '/modules/government-edition/index.js',
  permissions: ['read', 'write', 'admin'],
  category: 'core',
};

const mockCostForgeAI: ModuleDefinition = {
  id: 'costforge-ai',
  name: 'CostForge AI',
  description: 'AI-powered cost analysis',
  icon: '💰',
  version: '1.5.0',
  entryPoint: '/modules/costforge-ai/index.js',
  permissions: ['read', 'ai-compute'],
  category: 'ai',
};

const mockTerraFlow: ModuleDefinition = {
  id: 'terra-flow',
  name: 'Terra Flow',
  description: 'Workflow automation',
  icon: '🌊',
  version: '1.2.0',
  entryPoint: '/modules/terra-flow/index.js',
  permissions: ['read', 'write'],
  category: 'workflow',
};

// Mock component for loaded modules
const MockModuleComponent = () => null;

// ============================================================================
// Store Reset
// ============================================================================

beforeEach(() => {
  // Clear the store state before each test including moduleLoader
  useModuleRegistryStore.setState({
    definitions: new Map(),
    loadedModules: new Map(),
    loadingStates: new Map(),
    errors: new Map(),
    moduleLoader: null,
  });
});

// ============================================================================
// Test Suites
// ============================================================================

describe('Module Registry Store', () => {
  
  // --------------------------------------------------------------------------
  // Initial State
  // --------------------------------------------------------------------------
  describe('Initial State', () => {
    it('starts with empty definitions map', () => {
      const { definitions } = useModuleRegistryStore.getState();
      expect(definitions.size).toBe(0);
    });

    it('starts with empty loadedModules map', () => {
      const { loadedModules } = useModuleRegistryStore.getState();
      expect(loadedModules.size).toBe(0);
    });

    it('starts with empty loadingStates map', () => {
      const { loadingStates } = useModuleRegistryStore.getState();
      expect(loadingStates.size).toBe(0);
    });

    it('starts with empty errors map', () => {
      const { errors } = useModuleRegistryStore.getState();
      expect(errors.size).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Module Registration
  // --------------------------------------------------------------------------
  describe('registerModule', () => {
    it('registers a module definition', () => {
      const { registerModule } = useModuleRegistryStore.getState();
      const moduleDef = createMockModuleDefinition();

      act(() => {
        registerModule(moduleDef);
      });

      const { definitions } = useModuleRegistryStore.getState();
      expect(definitions.has('test-module')).toBe(true);
      expect(definitions.get('test-module')).toEqual(moduleDef);
    });

    it('registers multiple module definitions', () => {
      const { registerModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        registerModule(mockCostForgeAI);
        registerModule(mockTerraFlow);
      });

      const { definitions } = useModuleRegistryStore.getState();
      expect(definitions.size).toBe(3);
      expect(definitions.has('government-edition')).toBe(true);
      expect(definitions.has('costforge-ai')).toBe(true);
      expect(definitions.has('terra-flow')).toBe(true);
    });

    it('overwrites existing definition with same ID', () => {
      const { registerModule } = useModuleRegistryStore.getState();
      const original = createMockModuleDefinition({ version: '1.0.0' });
      const updated = createMockModuleDefinition({ version: '2.0.0' });

      act(() => {
        registerModule(original);
      });

      expect(useModuleRegistryStore.getState().definitions.get('test-module')?.version).toBe('1.0.0');

      act(() => {
        registerModule(updated);
      });

      expect(useModuleRegistryStore.getState().definitions.get('test-module')?.version).toBe('2.0.0');
    });

    it('sets initial loading state to idle after registration', () => {
      const { registerModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
      });

      const { loadingStates } = useModuleRegistryStore.getState();
      expect(loadingStates.get('government-edition')).toBe('idle');
    });
  });

  // --------------------------------------------------------------------------
  // Batch Registration
  // --------------------------------------------------------------------------
  describe('registerModules', () => {
    it('registers multiple modules in a single call', () => {
      const { registerModules } = useModuleRegistryStore.getState();

      act(() => {
        registerModules([mockGovernmentEdition, mockCostForgeAI, mockTerraFlow]);
      });

      const { definitions } = useModuleRegistryStore.getState();
      expect(definitions.size).toBe(3);
    });

    it('handles empty array gracefully', () => {
      const { registerModules, definitions: before } = useModuleRegistryStore.getState();

      act(() => {
        registerModules([]);
      });

      const { definitions: after } = useModuleRegistryStore.getState();
      expect(after.size).toBe(before.size);
    });
  });

  // --------------------------------------------------------------------------
  // Module Unregistration
  // --------------------------------------------------------------------------
  describe('unregisterModule', () => {
    it('removes module definition', () => {
      const { registerModule, unregisterModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
      });

      expect(useModuleRegistryStore.getState().definitions.has('government-edition')).toBe(true);

      act(() => {
        unregisterModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().definitions.has('government-edition')).toBe(false);
    });

    it('also removes loaded module if it was loaded', () => {
      const { registerModule, unregisterModule } = useModuleRegistryStore.getState();

      // Manually set a loaded module for this test
      act(() => {
        registerModule(mockGovernmentEdition);
        useModuleRegistryStore.setState((state) => ({
          loadedModules: new Map(state.loadedModules).set('government-edition', {
            definition: mockGovernmentEdition,
            component: MockModuleComponent,
            loadedAt: new Date(),
          }),
        }));
      });

      expect(useModuleRegistryStore.getState().loadedModules.has('government-edition')).toBe(true);

      act(() => {
        unregisterModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().loadedModules.has('government-edition')).toBe(false);
    });

    it('clears loading state when unregistering', () => {
      const { registerModule, unregisterModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
      });

      expect(useModuleRegistryStore.getState().loadingStates.has('government-edition')).toBe(true);

      act(() => {
        unregisterModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().loadingStates.has('government-edition')).toBe(false);
    });

    it('clears error when unregistering', () => {
      const { registerModule, unregisterModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        useModuleRegistryStore.setState((state) => ({
          errors: new Map(state.errors).set('government-edition', new Error('Test error')),
        }));
      });

      expect(useModuleRegistryStore.getState().errors.has('government-edition')).toBe(true);

      act(() => {
        unregisterModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().errors.has('government-edition')).toBe(false);
    });

    it('does nothing for non-existent module', () => {
      const { unregisterModule, definitions: before } = useModuleRegistryStore.getState();

      act(() => {
        unregisterModule('non-existent');
      });

      const { definitions: after } = useModuleRegistryStore.getState();
      expect(after.size).toBe(before.size);
    });
  });

  // --------------------------------------------------------------------------
  // Module Loading
  // --------------------------------------------------------------------------
  describe('loadModule', () => {
    it('sets loading state to loading when starting load', async () => {
      // Set up a loader that we can control
      let resolveLoader: (value: React.ComponentType) => void;
      const loaderPromise = new Promise<React.ComponentType>((resolve) => {
        resolveLoader = resolve;
      });
      
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockGovernmentEdition);
        setModuleLoader(() => loaderPromise);
      });

      const { loadModule } = useModuleRegistryStore.getState();
      
      // Start loading but don't await yet
      let loadPromise: Promise<any>;
      act(() => {
        loadPromise = loadModule('government-edition');
      });

      // Should be loading immediately
      expect(useModuleRegistryStore.getState().loadingStates.get('government-edition')).toBe('loading');
      
      // Clean up: resolve the promise to complete the test properly
      await act(async () => {
        resolveLoader!(MockModuleComponent);
        await loadPromise;
      });
    });

    it('returns existing loaded module if already loaded (caching)', async () => {
      const loadedAt = new Date();

      act(() => {
        const { registerModule } = useModuleRegistryStore.getState();
        registerModule(mockGovernmentEdition);
        // Manually inject a loaded module
        useModuleRegistryStore.setState((state) => ({
          loadedModules: new Map(state.loadedModules).set('government-edition', {
            definition: mockGovernmentEdition,
            component: MockModuleComponent,
            loadedAt,
          }),
          loadingStates: new Map(state.loadingStates).set('government-edition', 'loaded'),
        }));
      });

      // Get loadModule AFTER state is set up to ensure we're testing cache behavior
      const { loadModule } = useModuleRegistryStore.getState();
      
      let result: LoadedModule | null = null;
      await act(async () => {
        result = await loadModule('government-edition');
      });

      expect(result).not.toBeNull();
      expect(result?.loadedAt).toBe(loadedAt); // Same instance = cached
    });

    it('throws error if module is not registered', async () => {
      const { loadModule } = useModuleRegistryStore.getState();

      await expect(async () => {
        await act(async () => {
          await loadModule('non-existent');
        });
      }).rejects.toThrow('Module not registered: non-existent');
    });

    it('sets loading state to loaded on success', async () => {
      const { registerModule, loadModule, setModuleLoader } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        // Set up a mock loader that returns immediately
        setModuleLoader(async () => MockModuleComponent);
      });

      await act(async () => {
        await loadModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().loadingStates.get('government-edition')).toBe('loaded');
    });

    it('stores loaded module in loadedModules map', async () => {
      const { registerModule, loadModule, setModuleLoader } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        setModuleLoader(async () => MockModuleComponent);
      });

      await act(async () => {
        await loadModule('government-edition');
      });

      const { loadedModules } = useModuleRegistryStore.getState();
      expect(loadedModules.has('government-edition')).toBe(true);
      
      const loaded = loadedModules.get('government-edition');
      expect(loaded?.definition).toEqual(mockGovernmentEdition);
      expect(loaded?.component).toBe(MockModuleComponent);
      expect(loaded?.loadedAt).toBeInstanceOf(Date);
    });

    it('sets loading state to error on failure', async () => {
      const { registerModule, loadModule, setModuleLoader } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        setModuleLoader(async () => {
          throw new Error('Failed to load module');
        });
      });

      await expect(async () => {
        await act(async () => {
          await loadModule('government-edition');
        });
      }).rejects.toThrow('Failed to load module');

      expect(useModuleRegistryStore.getState().loadingStates.get('government-edition')).toBe('error');
    });

    it('stores error in errors map on failure', async () => {
      const { registerModule, loadModule, setModuleLoader } = useModuleRegistryStore.getState();
      const expectedError = new Error('Network error');

      act(() => {
        registerModule(mockGovernmentEdition);
        setModuleLoader(async () => {
          throw expectedError;
        });
      });

      try {
        await act(async () => {
          await loadModule('government-edition');
        });
      } catch {
        // Expected to throw
      }

      const { errors } = useModuleRegistryStore.getState();
      expect(errors.get('government-edition')).toBe(expectedError);
    });
  });

  // --------------------------------------------------------------------------
  // Module Unloading
  // --------------------------------------------------------------------------
  describe('unloadModule', () => {
    it('removes module from loadedModules', () => {
      const { registerModule, unloadModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        useModuleRegistryStore.setState((state) => ({
          loadedModules: new Map(state.loadedModules).set('government-edition', {
            definition: mockGovernmentEdition,
            component: MockModuleComponent,
            loadedAt: new Date(),
          }),
          loadingStates: new Map(state.loadingStates).set('government-edition', 'loaded'),
        }));
      });

      expect(useModuleRegistryStore.getState().loadedModules.has('government-edition')).toBe(true);

      act(() => {
        unloadModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().loadedModules.has('government-edition')).toBe(false);
    });

    it('resets loading state to idle', () => {
      const { registerModule, unloadModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        useModuleRegistryStore.setState((state) => ({
          loadedModules: new Map(state.loadedModules).set('government-edition', {
            definition: mockGovernmentEdition,
            component: MockModuleComponent,
            loadedAt: new Date(),
          }),
          loadingStates: new Map(state.loadingStates).set('government-edition', 'loaded'),
        }));
      });

      act(() => {
        unloadModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().loadingStates.get('government-edition')).toBe('idle');
    });

    it('clears any existing error', () => {
      const { registerModule, unloadModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        useModuleRegistryStore.setState((state) => ({
          errors: new Map(state.errors).set('government-edition', new Error('Previous error')),
        }));
      });

      act(() => {
        unloadModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().errors.has('government-edition')).toBe(false);
    });

    it('keeps definition after unloading (can reload)', () => {
      const { registerModule, unloadModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
        useModuleRegistryStore.setState((state) => ({
          loadedModules: new Map(state.loadedModules).set('government-edition', {
            definition: mockGovernmentEdition,
            component: MockModuleComponent,
            loadedAt: new Date(),
          }),
        }));
      });

      act(() => {
        unloadModule('government-edition');
      });

      // Definition should still exist
      expect(useModuleRegistryStore.getState().definitions.has('government-edition')).toBe(true);
    });

    it('does nothing for non-loaded module', () => {
      const { registerModule, unloadModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
      });

      // Should not throw
      act(() => {
        unloadModule('government-edition');
      });

      // State should be unchanged
      expect(useModuleRegistryStore.getState().loadingStates.get('government-edition')).toBe('idle');
    });
  });

  // --------------------------------------------------------------------------
  // Selectors
  // --------------------------------------------------------------------------
  describe('Selectors', () => {
    describe('getDefinition', () => {
      it('returns module definition by ID', () => {
        const { registerModule, getDefinition } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
        });

        const definition = useModuleRegistryStore.getState().getDefinition('government-edition');
        expect(definition).toEqual(mockGovernmentEdition);
      });

      it('returns undefined for non-existent module', () => {
        const definition = useModuleRegistryStore.getState().getDefinition('non-existent');
        expect(definition).toBeUndefined();
      });
    });

    describe('getLoadedModule', () => {
      it('returns loaded module by ID', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
          useModuleRegistryStore.setState((state) => ({
            loadedModules: new Map(state.loadedModules).set('government-edition', {
              definition: mockGovernmentEdition,
              component: MockModuleComponent,
              loadedAt: new Date(),
            }),
          }));
        });

        const loaded = useModuleRegistryStore.getState().getLoadedModule('government-edition');
        expect(loaded).toBeDefined();
        expect(loaded?.definition).toEqual(mockGovernmentEdition);
      });

      it('returns undefined for non-loaded module', () => {
        const loaded = useModuleRegistryStore.getState().getLoadedModule('non-existent');
        expect(loaded).toBeUndefined();
      });
    });

    describe('isModuleLoaded', () => {
      it('returns true if module is loaded', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
          useModuleRegistryStore.setState((state) => ({
            loadingStates: new Map(state.loadingStates).set('government-edition', 'loaded'),
          }));
        });

        expect(useModuleRegistryStore.getState().isModuleLoaded('government-edition')).toBe(true);
      });

      it('returns false if module is not loaded', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
        });

        expect(useModuleRegistryStore.getState().isModuleLoaded('government-edition')).toBe(false);
      });

      it('returns false if module is loading', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
          useModuleRegistryStore.setState((state) => ({
            loadingStates: new Map(state.loadingStates).set('government-edition', 'loading'),
          }));
        });

        expect(useModuleRegistryStore.getState().isModuleLoaded('government-edition')).toBe(false);
      });
    });

    describe('isModuleLoading', () => {
      it('returns true if module is loading', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
          useModuleRegistryStore.setState((state) => ({
            loadingStates: new Map(state.loadingStates).set('government-edition', 'loading'),
          }));
        });

        expect(useModuleRegistryStore.getState().isModuleLoading('government-edition')).toBe(true);
      });

      it('returns false if module is not loading', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
        });

        expect(useModuleRegistryStore.getState().isModuleLoading('government-edition')).toBe(false);
      });
    });

    describe('getModuleError', () => {
      it('returns error for module', () => {
        const { registerModule } = useModuleRegistryStore.getState();
        const error = new Error('Test error');

        act(() => {
          registerModule(mockGovernmentEdition);
          useModuleRegistryStore.setState((state) => ({
            errors: new Map(state.errors).set('government-edition', error),
          }));
        });

        expect(useModuleRegistryStore.getState().getModuleError('government-edition')).toBe(error);
      });

      it('returns undefined if no error', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
        });

        expect(useModuleRegistryStore.getState().getModuleError('government-edition')).toBeUndefined();
      });
    });

    describe('getLoadingState', () => {
      it('returns loading state for module', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
        });

        expect(useModuleRegistryStore.getState().getLoadingState('government-edition')).toBe('idle');
      });

      it('returns undefined for non-registered module', () => {
        expect(useModuleRegistryStore.getState().getLoadingState('non-existent')).toBeUndefined();
      });
    });

    describe('getAllDefinitions', () => {
      it('returns array of all registered definitions', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
          registerModule(mockCostForgeAI);
          registerModule(mockTerraFlow);
        });

        const definitions = useModuleRegistryStore.getState().getAllDefinitions();
        expect(definitions).toHaveLength(3);
        expect(definitions).toContainEqual(mockGovernmentEdition);
        expect(definitions).toContainEqual(mockCostForgeAI);
        expect(definitions).toContainEqual(mockTerraFlow);
      });

      it('returns empty array when no modules registered', () => {
        const definitions = useModuleRegistryStore.getState().getAllDefinitions();
        expect(definitions).toEqual([]);
      });
    });

    describe('getDefinitionsByCategory', () => {
      it('returns definitions grouped by category', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition); // core
          registerModule(mockCostForgeAI);       // ai
          registerModule(mockTerraFlow);          // workflow
          registerModule(createMockModuleDefinition({ id: 'another-ai', category: 'ai' })); // ai
        });

        const byCategory = useModuleRegistryStore.getState().getDefinitionsByCategory();
        expect(byCategory['core']).toHaveLength(1);
        expect(byCategory['ai']).toHaveLength(2);
        expect(byCategory['workflow']).toHaveLength(1);
      });
    });

    describe('getLoadedModuleIds', () => {
      it('returns array of loaded module IDs', () => {
        const { registerModule } = useModuleRegistryStore.getState();

        act(() => {
          registerModule(mockGovernmentEdition);
          registerModule(mockCostForgeAI);
          useModuleRegistryStore.setState((state) => ({
            loadedModules: new Map(state.loadedModules)
              .set('government-edition', {
                definition: mockGovernmentEdition,
                component: MockModuleComponent,
                loadedAt: new Date(),
              }),
            loadingStates: new Map(state.loadingStates).set('government-edition', 'loaded'),
          }));
        });

        const loadedIds = useModuleRegistryStore.getState().getLoadedModuleIds();
        expect(loadedIds).toContain('government-edition');
        expect(loadedIds).not.toContain('costforge-ai');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Module Loader Configuration
  // --------------------------------------------------------------------------
  describe('setModuleLoader', () => {
    it('sets custom module loader function', () => {
      const { setModuleLoader } = useModuleRegistryStore.getState();
      const customLoader = jest.fn().mockResolvedValue(MockModuleComponent);

      act(() => {
        setModuleLoader(customLoader);
      });

      // The loader should be stored (we'll test it works in loadModule tests)
      expect(useModuleRegistryStore.getState().moduleLoader).toBe(customLoader);
    });
  });

  // --------------------------------------------------------------------------
  // Retry Loading
  // --------------------------------------------------------------------------
  describe('retryLoad', () => {
    it('clears error and retries loading', async () => {
      // Start at 1 to simulate a previous failed attempt
      let attempts = 1;

      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockGovernmentEdition);
        setModuleLoader(async () => {
          attempts++;
          if (attempts === 1) {
            // This won't be reached since we start at attempts = 1
            throw new Error('First attempt failed');
          }
          return MockModuleComponent;
        });
        // Simulate previous error state from a failed load
        useModuleRegistryStore.setState((state) => ({
          loadingStates: new Map(state.loadingStates).set('government-edition', 'error'),
          errors: new Map(state.errors).set('government-edition', new Error('Previous error')),
        }));
      });

      // Get retryLoad AFTER state is set up
      const { retryLoad } = useModuleRegistryStore.getState();
      
      await act(async () => {
        await retryLoad('government-edition');
      });

      expect(useModuleRegistryStore.getState().loadingStates.get('government-edition')).toBe('loaded');
      expect(useModuleRegistryStore.getState().errors.has('government-edition')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // React Hook Integration
  // --------------------------------------------------------------------------
  describe('React Hook Integration', () => {
    it('re-renders when definitions change', () => {
      const { result } = renderHook(() => 
        useModuleRegistryStore((state) => state.definitions.size)
      );

      expect(result.current).toBe(0);

      act(() => {
        useModuleRegistryStore.getState().registerModule(mockGovernmentEdition);
      });

      expect(result.current).toBe(1);
    });

    it('re-renders when loading state changes', () => {
      const { registerModule } = useModuleRegistryStore.getState();

      act(() => {
        registerModule(mockGovernmentEdition);
      });

      const { result } = renderHook(() => 
        useModuleRegistryStore((state) => state.loadingStates.get('government-edition'))
      );

      expect(result.current).toBe('idle');

      act(() => {
        useModuleRegistryStore.setState((state) => ({
          loadingStates: new Map(state.loadingStates).set('government-edition', 'loading'),
        }));
      });

      expect(result.current).toBe('loading');
    });
  });
});

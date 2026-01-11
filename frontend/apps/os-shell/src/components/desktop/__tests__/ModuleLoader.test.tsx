/**
 * TerraFusion OS ModuleLoader Component Tests
 * 
 * Integration tests for ModuleLoader component following SPECLOCK contract.
 * Tests written RED-first (TDD) - these must fail before implementation.
 * 
 * Phase 3.2: ModuleLoader + StartMenu Integration
 * 
 * @module components/desktop/__tests__/ModuleLoader.test
 * @see SPECLOCK.md for contract details
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ModuleLoader } from '../ModuleLoader';
import { useModuleRegistryStore, type LoadedModule, type ModuleDefinition } from '../../../stores/moduleRegistryStore';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockModuleDefinition: ModuleDefinition = {
  id: 'test-module',
  name: 'Test Module',
  description: 'A test module',
  icon: '🧪',
  version: '1.0.0',
  entryPoint: '/modules/test-module/index.js',
  permissions: ['read'],
  category: 'testing',
};

const MockModuleComponent: React.FC = () => (
  <div data-testid="mock-module-content">Mock Module Loaded Successfully</div>
);

// ============================================================================
// Store Reset
// ============================================================================

beforeEach(() => {
  // Reset module registry store before each test
  useModuleRegistryStore.setState({
    definitions: new Map(),
    loadedModules: new Map(),
    loadingStates: new Map(),
    errors: new Map(),
    moduleLoader: null,
  });
});

// ============================================================================
// Test Suites - Following SPECLOCK INT-001 through INT-007
// ============================================================================

describe('ModuleLoader Component', () => {
  
  // --------------------------------------------------------------------------
  // INT-007: Null moduleId shows empty state
  // --------------------------------------------------------------------------
  describe('Empty State (INT-007)', () => {
    it('renders nothing when moduleId is null', () => {
      const { container } = render(<ModuleLoader moduleId={null} />);
      
      // Should render empty or minimal placeholder
      expect(container.firstChild).toBeNull();
    });

    it('has no side effects when moduleId is null', () => {
      const onLoadSuccess = jest.fn();
      const onLoadError = jest.fn();
      
      render(
        <ModuleLoader 
          moduleId={null} 
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
        />
      );

      expect(onLoadSuccess).not.toHaveBeenCalled();
      expect(onLoadError).not.toHaveBeenCalled();
      expect(useModuleRegistryStore.getState().loadingStates.size).toBe(0);
    });

    it('remains stable across re-renders with null moduleId', () => {
      const { rerender } = render(<ModuleLoader moduleId={null} />);
      
      // Re-render multiple times
      rerender(<ModuleLoader moduleId={null} />);
      rerender(<ModuleLoader moduleId={null} />);
      
      // Store should remain untouched
      expect(useModuleRegistryStore.getState().loadingStates.size).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // INT-002: ModuleLoader shows loading state
  // --------------------------------------------------------------------------
  describe('Loading State (INT-002)', () => {
    it('shows spinner when module is loading', async () => {
      // Set up controlled loader
      let resolveLoader: (component: React.ComponentType) => void;
      const loaderPromise = new Promise<React.ComponentType>((resolve) => {
        resolveLoader = resolve;
      });

      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(() => loaderPromise);
      });

      render(<ModuleLoader moduleId="test-module" />);

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Clean up
      await act(async () => {
        resolveLoader!(MockModuleComponent);
      });
    });

    it('shows loading text with module name', async () => {
      let resolveLoader: (component: React.ComponentType) => void;
      const loaderPromise = new Promise<React.ComponentType>((resolve) => {
        resolveLoader = resolve;
      });

      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(() => loaderPromise);
      });

      render(<ModuleLoader moduleId="test-module" />);

      await waitFor(() => {
        expect(screen.getByText(/loading.*test module/i)).toBeInTheDocument();
      });

      // Clean up
      await act(async () => {
        resolveLoader!(MockModuleComponent);
      });
    });
  });

  // --------------------------------------------------------------------------
  // INT-003: ModuleLoader shows success state
  // --------------------------------------------------------------------------
  describe('Success State (INT-003)', () => {
    it('renders module component when loaded', async () => {
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => MockModuleComponent);
      });

      render(<ModuleLoader moduleId="test-module" />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-module-content')).toBeInTheDocument();
      });
    });

    it('calls onLoadSuccess callback with loaded module', async () => {
      const onLoadSuccess = jest.fn();

      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => MockModuleComponent);
      });

      render(<ModuleLoader moduleId="test-module" onLoadSuccess={onLoadSuccess} />);

      await waitFor(() => {
        expect(onLoadSuccess).toHaveBeenCalledTimes(1);
      });

      expect(onLoadSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: mockModuleDefinition,
          component: MockModuleComponent,
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // INT-004: ModuleLoader shows error + retry
  // --------------------------------------------------------------------------
  describe('Error State (INT-004)', () => {
    it('shows error message when load fails', async () => {
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => {
          throw new Error('Network error');
        });
      });

      render(<ModuleLoader moduleId="test-module" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('shows retry button when load fails', async () => {
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => {
          throw new Error('Network error');
        });
      });

      render(<ModuleLoader moduleId="test-module" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('calls onLoadError callback with error', async () => {
      const onLoadError = jest.fn();
      const testError = new Error('Test failure');

      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => {
          throw testError;
        });
      });

      render(<ModuleLoader moduleId="test-module" onLoadError={onLoadError} />);

      await waitFor(() => {
        expect(onLoadError).toHaveBeenCalledTimes(1);
      });

      expect(onLoadError).toHaveBeenCalledWith(testError);
    });
  });

  // --------------------------------------------------------------------------
  // INT-005: Retry button clears error and reloads
  // --------------------------------------------------------------------------
  describe('Retry Behavior (INT-005)', () => {
    it('clears error and shows loading on retry click', async () => {
      let attemptCount = 0;
      
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('First attempt failed');
          }
          return MockModuleComponent;
        });
      });

      render(<ModuleLoader moduleId="test-module" />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      // Should show loading again
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Then success
      await waitFor(() => {
        expect(screen.getByTestId('mock-module-content')).toBeInTheDocument();
      });
    });

    it('calls retryLoad from store on retry click', async () => {
      const retryLoadSpy = jest.fn();
      
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => {
          throw new Error('Fail');
        });
        // Set up error state manually
        useModuleRegistryStore.setState((state) => ({
          loadingStates: new Map(state.loadingStates).set('test-module', 'error'),
          errors: new Map(state.errors).set('test-module', new Error('Previous error')),
        }));
      });

      // Mock retryLoad
      const originalRetryLoad = useModuleRegistryStore.getState().retryLoad;
      useModuleRegistryStore.setState({
        retryLoad: async (moduleId: string) => {
          retryLoadSpy(moduleId);
          return originalRetryLoad(moduleId);
        },
      });

      render(<ModuleLoader moduleId="test-module" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(retryLoadSpy).toHaveBeenCalledWith('test-module');
    });
  });

  // --------------------------------------------------------------------------
  // INT-006: Cache hit returns immediately
  // --------------------------------------------------------------------------
  describe('Cache Behavior (INT-006)', () => {
    it('renders cached module immediately without calling loader', async () => {
      const loaderSpy = jest.fn().mockResolvedValue(MockModuleComponent);
      
      // Pre-load the module into cache
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(loaderSpy);
        
        // Pre-populate cache
        useModuleRegistryStore.setState((state) => ({
          loadedModules: new Map(state.loadedModules).set('test-module', {
            definition: mockModuleDefinition,
            component: MockModuleComponent,
            loadedAt: new Date(),
          }),
          loadingStates: new Map(state.loadingStates).set('test-module', 'loaded'),
        }));
      });

      render(<ModuleLoader moduleId="test-module" />);

      // Should render immediately
      expect(screen.getByTestId('mock-module-content')).toBeInTheDocument();
      
      // Loader should NOT have been called (cache hit)
      expect(loaderSpy).not.toHaveBeenCalled();
    });

    it('second render uses cache (no cross-test pollution)', async () => {
      const loaderSpy = jest.fn().mockResolvedValue(MockModuleComponent);
      
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(loaderSpy);
      });

      // First render - should call loader
      const { unmount } = render(<ModuleLoader moduleId="test-module" />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-module-content')).toBeInTheDocument();
      });

      expect(loaderSpy).toHaveBeenCalledTimes(1);

      // Unmount
      unmount();

      // Reset spy call count but keep cache
      loaderSpy.mockClear();

      // Second render - should hit cache
      render(<ModuleLoader moduleId="test-module" />);

      expect(screen.getByTestId('mock-module-content')).toBeInTheDocument();
      
      // Loader should NOT have been called again
      expect(loaderSpy).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Props Testing
  // --------------------------------------------------------------------------
  describe('Props', () => {
    it('applies className prop to container', async () => {
      act(() => {
        const { registerModule, setModuleLoader } = useModuleRegistryStore.getState();
        registerModule(mockModuleDefinition);
        setModuleLoader(async () => MockModuleComponent);
      });

      const { container } = render(
        <ModuleLoader moduleId="test-module" className="custom-class" />
      );

      await waitFor(() => {
        expect(container.querySelector('.custom-class')).toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Error Boundary Integration
  // --------------------------------------------------------------------------
  describe('Module Not Registered', () => {
    it('shows error when moduleId is not registered', async () => {
      // No module registered, but try to load it
      render(<ModuleLoader moduleId="non-existent-module" />);

      await waitFor(() => {
        expect(screen.getByText(/module not found/i)).toBeInTheDocument();
      });
    });
  });
});

/**
 * TerraFusion OS ModuleHost Component Tests
 *
 * Tests for the single render surface component that integrates
 * the loader state machine with UI rendering.
 *
 * @module components/modules/__tests__/ModuleHost.test
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useModuleLoaderStore } from '../../../stores/moduleLoaderStore';
import { useModuleRegistryStore } from '../../../stores/moduleRegistryStore';
import { ModuleHost } from '../ModuleHost';

// Mock analytics
jest.mock('../../../utils/analytics', () => ({
  analytics: {
    trackEvent: jest.fn(),
  },
}));

// Mock moduleComponents to avoid lazy loading complexity
jest.mock('../../../config/moduleComponents', () => ({
  normalizeModuleId: (id: string) => {
    const aliases: Record<string, string> = {
      terrabuild: 'costforge',
      'terra-build': 'costforge',
    };
    const normalized = id.toLowerCase().trim();
    return aliases[normalized] || normalized;
  },
  getModuleEntry: (id: string) => {
    const modules: Record<string, any> = {
      costforge: { id: 'costforge', status: 'active' },
      'terra-gaia': { id: 'terra-gaia', status: 'active' },
      'atlas-ai': { id: 'atlas-ai', status: 'active' },
    };
    return modules[id] || null;
  },
  ModuleRenderer: ({ module }: { module: { id: string } }) => (
    <div data-testid='mock-module-renderer'>Module: {module.id}</div>
  ),
}));

// Reset store before each test
const mockRegistryModule = {
  id: 'costforge',
  name: 'CostForge',
  displayName: 'CostForge',
  description: 'Property assessment module',
  icon: 'Building2',
  category: 'assessment',
  tier: 'Tier1',
  status: 'active',
  version: '1.0.0',
  launchPath: '/modules/costforge',
  isCore: true,
  priority: 1,
};

const resetStore = () => {
  useModuleLoaderStore.setState({
    loadStates: new Map(),
    currentRequestIds: new Map(),
    loadingPromises: new Map(),
    requestCounter: 0,
  });
  useModuleRegistryStore.setState({
    modules: new Map([[mockRegistryModule.id, mockRegistryModule]]),
    loadStates: new Map(),
    isInitialized: true,
    initError: null,
  });
};

describe('ModuleHost', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // Empty State
  // ==========================================================================

  describe('empty state', () => {
    it('renders empty state when no moduleId provided', () => {
      render(<ModuleHost moduleId='' />);

      expect(screen.getByTestId('module-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to TerraFusion/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Loading State
  // ==========================================================================

  describe('loading state', () => {
    it('shows loading UI while module is loading', async () => {
      render(<ModuleHost moduleId='costforge' />);

      // Should show loading initially (brief moment)
      await waitFor(() => {
        const host = screen.getByTestId('module-host');
        // After initial load, should transition to loaded
        expect(host).toHaveAttribute('data-load-state');
      });
    });

    it('displays module ID in loading state', async () => {
      // Set loading state directly
      useModuleLoaderStore.setState({
        loadStates: new Map([['costforge', { status: 'loading', error: null, result: null }]]),
        loadingPromises: new Map([
          [
            'costforge',
            {
              promise: new Promise(() => {}), // Never resolves
              requestId: 1,
              startTime: Date.now(),
            },
          ],
        ]),
        currentRequestIds: new Map([['costforge', 1]]),
      });

      render(<ModuleHost moduleId='costforge' />);

      expect(screen.getByTestId('module-loading')).toBeInTheDocument();
      expect(screen.getByText(/costforge/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Loaded State
  // ==========================================================================

  describe('loaded state', () => {
    it('renders module content when loaded', async () => {
      render(<ModuleHost moduleId='costforge' />);

      await waitFor(() => {
        expect(screen.getByTestId('module-host')).toHaveAttribute('data-load-state', 'loaded');
      });
    });

    it('sets correct data attributes on host element', async () => {
      render(<ModuleHost moduleId='costforge' />);

      await waitFor(() => {
        const host = screen.getByTestId('module-host');
        expect(host).toHaveAttribute('data-module-id', 'costforge');
      });
    });
  });

  // ==========================================================================
  // Error State
  // ==========================================================================

  describe('error state', () => {
    it('shows error boundary UI when module has error', async () => {
      // Set error state
      useModuleLoaderStore.setState({
        loadStates: new Map([
          [
            'unknown-module',
            {
              status: 'error',
              error: {
                message: 'Module not found',
                code: 'MODULE_NOT_FOUND',
                timestamp: Date.now(),
                retryCount: 0,
              },
              result: null,
            },
          ],
        ]),
      });

      render(<ModuleHost moduleId='unknown-module' />);

      expect(screen.getByTestId('module-error-boundary')).toBeInTheDocument();
    });

    it('provides retry button in error state', async () => {
      // Use a module ID that won't auto-load successfully
      // by not adding it to the loadStates and letting it fail naturally
      // OR mock the loadModule to fail
      const failingModuleId = 'failing-test-module';

      useModuleLoaderStore.setState({
        loadStates: new Map([
          [
            failingModuleId,
            {
              status: 'error',
              error: {
                message: 'Load failed',
                code: 'LOAD_FAILED',
                timestamp: Date.now(),
                retryCount: 1,
              },
              result: null,
            },
          ],
        ]),
      });

      render(<ModuleHost moduleId={failingModuleId} />);

      // Wait for the error boundary to render
      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Alias Resolution
  // ==========================================================================

  describe('alias resolution', () => {
    it('normalizes alias to canonical moduleId', async () => {
      render(<ModuleHost moduleId='terrabuild' />);

      await waitFor(() => {
        const host = screen.getByTestId('module-host');
        // Should normalize terrabuild -> costforge
        expect(host).toHaveAttribute('data-module-id', 'costforge');
      });
    });
  });

  // ==========================================================================
  // Close Handler
  // ==========================================================================

  describe('onClose callback', () => {
    it('calls onClose when provided in error state', async () => {
      const onClose = jest.fn();
      const failingModuleId = 'failing-close-test-module';

      useModuleLoaderStore.setState({
        loadStates: new Map([
          [
            failingModuleId,
            {
              status: 'error',
              error: {
                message: 'Test error',
                code: 'TEST_ERROR',
                timestamp: Date.now(),
                retryCount: 0,
              },
              result: null,
            },
          ],
        ]),
      });

      render(<ModuleHost moduleId={failingModuleId} onClose={onClose} />);

      // Wait for error UI to render, then click close
      await waitFor(async () => {
        const closeButton = screen.queryByRole('button', { name: /close/i });
        if (closeButton) {
          await userEvent.click(closeButton);
        }
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Custom className
  // ==========================================================================

  describe('className prop', () => {
    it('applies custom className to host element', async () => {
      render(<ModuleHost moduleId='costforge' className='custom-class' />);

      await waitFor(() => {
        const host = screen.getByTestId('module-host');
        expect(host).toHaveClass('custom-class');
      });
    });
  });
});

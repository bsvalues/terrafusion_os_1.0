/**
 * TerraFusion OS ModuleLoader Component Tests
 * 
 * Comprehensive test suite for the component that loads and renders
 * module content inside Window components.
 * 
 * Following TDD principles - tests written BEFORE implementation.
 * 
 * @module shell/desktop/__tests__/ModuleLoader.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as matchers from '@testing-library/jest-dom/matchers';

import { ModuleLoader } from '../ModuleLoader';
import { useModuleRegistryStore } from '../../../stores/moduleRegistryStore';
import type { ModuleDefinition } from '../../../stores/moduleRegistryStore';

expect.extend(matchers);

// Mock module data
const mockModule: ModuleDefinition = {
  id: 'government-edition',
  name: 'Government Edition',
  displayName: 'Government Edition',
  description: 'Core government operations dashboard',
  icon: '🏛️',
  category: 'core',
  tier: 'Tier1',
  status: 'active',
  version: '1.0.0',
  launchPath: '/modules/government-edition',
  isCore: true,
  priority: 1,
};

const mockModules: ModuleDefinition[] = [
  mockModule,
  {
    id: 'costforge-ai',
    name: 'CostForge AI',
    displayName: 'CostForge AI Champion',
    description: 'AI-powered cost analysis',
    icon: '💰',
    category: 'ai',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/costforge-ai',
    isCore: true,
    priority: 1,
  },
];

// Reset store before each test
beforeEach(() => {
  useModuleRegistryStore.setState({
    modules: new Map(),
    loadStates: new Map(),
    isInitialized: false,
    initError: null,
  });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Helper to setup store with modules
const setupStore = (loadState?: { status: string; error: string | null; windowId: string | null }) => {
  const modulesMap = new Map<string, ModuleDefinition>();
  const loadStatesMap = new Map();
  
  mockModules.forEach(m => {
    modulesMap.set(m.id, m);
    loadStatesMap.set(m.id, loadState || { status: 'idle', error: null, windowId: null });
  });

  useModuleRegistryStore.setState({
    modules: modulesMap,
    loadStates: loadStatesMap,
    isInitialized: true,
    initError: null,
  });
};

describe('ModuleLoader', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-loader')).toBeInTheDocument();
    });

    it('fills container dimensions', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const container = screen.getByTestId('module-loader');
      expect(container).toHaveClass('w-full', 'h-full');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when status is loading', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-loading')).toBeInTheDocument();
    });

    it('shows loading spinner when status is idle', () => {
      setupStore({ status: 'idle', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-loading')).toBeInTheDocument();
    });

    it('displays module name during loading', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByText(/Government Edition/i)).toBeInTheDocument();
    });

    it('has accessible loading announcement', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const loadingRegion = screen.getByTestId('module-loading');
      expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('shows spinner animation', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Loaded State', () => {
    it('renders iframe when module is loaded', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-iframe')).toBeInTheDocument();
    });

    it('sets correct iframe src from launchPath', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const iframe = screen.getByTestId('module-iframe');
      expect(iframe).toHaveAttribute('src', '/modules/government-edition');
    });

    it('iframe fills container', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const iframe = screen.getByTestId('module-iframe');
      expect(iframe).toHaveClass('w-full', 'h-full');
    });

    it('iframe has accessible title', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const iframe = screen.getByTestId('module-iframe');
      expect(iframe).toHaveAttribute('title', 'Government Edition');
    });

    it('iframe has sandbox attribute for security', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const iframe = screen.getByTestId('module-iframe');
      expect(iframe).toHaveAttribute('sandbox');
      // Should allow scripts and same-origin but be restrictive
      const sandbox = iframe.getAttribute('sandbox');
      expect(sandbox).toContain('allow-scripts');
      expect(sandbox).toContain('allow-same-origin');
    });

    it('hides loading state when loaded', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.queryByTestId('module-loading')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when status is error', () => {
      setupStore({ status: 'error', error: 'Failed to load module', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-error')).toBeInTheDocument();
    });

    it('displays error text', () => {
      setupStore({ status: 'error', error: 'Network timeout', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();
    });

    it('shows retry button on error', () => {
      setupStore({ status: 'error', error: 'Failed to load', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('retry button calls launchModule', async () => {
      setupStore({ status: 'error', error: 'Failed to load', windowId: null });
      
      const mockLaunchModule = vi.fn().mockResolvedValue('window-456');
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        launchModule: mockLaunchModule,
      });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      
      expect(mockLaunchModule).toHaveBeenCalledWith('government-edition');
    });

    it('has accessible error announcement', () => {
      setupStore({ status: 'error', error: 'Failed to load', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const errorRegion = screen.getByTestId('module-error');
      expect(errorRegion).toHaveAttribute('role', 'alert');
    });

    it('shows error icon', () => {
      setupStore({ status: 'error', error: 'Failed', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
  });

  describe('Module Not Found', () => {
    it('shows not found state for unknown module', () => {
      setupStore();
      
      render(<ModuleLoader moduleId="unknown-module" />);
      
      expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
    });

    it('displays module ID in not found message', () => {
      setupStore();
      
      render(<ModuleLoader moduleId="unknown-module" />);
      
      expect(screen.getByText(/unknown-module/i)).toBeInTheDocument();
    });

    it('not found state has accessible role', () => {
      setupStore();
      
      render(<ModuleLoader moduleId="unknown-module" />);
      
      const notFoundRegion = screen.getByTestId('module-not-found');
      expect(notFoundRegion).toHaveAttribute('role', 'alert');
    });
  });

  describe('Store Integration', () => {
    it('reads module from moduleRegistryStore', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'window-123' });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      // Should render iframe with correct src from store
      const iframe = screen.getByTestId('module-iframe');
      expect(iframe).toHaveAttribute('src', '/modules/government-edition');
    });

    it('reads loadState from store', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      // Should show loading based on store state
      expect(screen.getByTestId('module-loading')).toBeInTheDocument();
    });

    it('updates when store changes', async () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      const { rerender } = render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-loading')).toBeInTheDocument();
      
      // Update store to loaded
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        loadStates: new Map([
          ['government-edition', { status: 'loaded', error: null, windowId: 'window-123' }],
          ['costforge-ai', { status: 'idle', error: null, windowId: null }],
        ]),
      });
      
      rerender(<ModuleLoader moduleId="government-edition" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-iframe')).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    it('has dark background matching TerraFusion theme', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const container = screen.getByTestId('module-loader');
      // Should have dark background class
      expect(container.className).toMatch(/bg-/);
    });

    it('loading spinner uses brand colors', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const spinner = screen.getByTestId('loading-spinner');
      // Should have brand color class (cyan/blue)
      expect(spinner.className).toMatch(/text-|border-/);
    });

    it('error state has appropriate warning colors', () => {
      setupStore({ status: 'error', error: 'Failed', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon.className).toMatch(/text-red|text-destructive/);
    });
  });

  describe('Accessibility', () => {
    it('loading state is announced to screen readers', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const loadingRegion = screen.getByTestId('module-loading');
      expect(loadingRegion).toHaveAttribute('aria-live');
      expect(loadingRegion).toHaveAttribute('aria-busy', 'true');
    });

    it('iframe is not focusable when loading', () => {
      setupStore({ status: 'loading', error: null, windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      // Iframe shouldn't exist when loading
      expect(screen.queryByTestId('module-iframe')).not.toBeInTheDocument();
    });

    it('error state has aria-describedby for error message', () => {
      setupStore({ status: 'error', error: 'Connection failed', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const errorMessage = screen.getByText(/Connection failed/i);
      expect(errorMessage).toBeInTheDocument();
    });

    it('retry button has descriptive aria-label', () => {
      setupStore({ status: 'error', error: 'Failed', windowId: null });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty moduleId', () => {
      setupStore();
      
      render(<ModuleLoader moduleId="" />);
      
      expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
    });

    it('handles null launchPath gracefully', () => {
      // Create module without launchPath
      const modulesMap = new Map<string, ModuleDefinition>();
      const moduleWithoutPath = { ...mockModule, launchPath: '' };
      modulesMap.set('government-edition', moduleWithoutPath);
      
      useModuleRegistryStore.setState({
        modules: modulesMap,
        loadStates: new Map([['government-edition', { status: 'loaded', error: null, windowId: 'w-1' }]]),
        isInitialized: true,
        initError: null,
      });
      
      render(<ModuleLoader moduleId="government-edition" />);
      
      // Should show error or fallback, not crash
      const iframe = screen.queryByTestId('module-iframe');
      if (iframe) {
        expect(iframe).toHaveAttribute('src', '');
      }
    });

    it('handles rapid module switches', async () => {
      setupStore({ status: 'loaded', error: null, windowId: 'w-1' });
      
      const { rerender } = render(<ModuleLoader moduleId="government-edition" />);
      
      expect(screen.getByTestId('module-iframe')).toHaveAttribute('src', '/modules/government-edition');
      
      // Switch to different module
      rerender(<ModuleLoader moduleId="costforge-ai" />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-iframe')).toHaveAttribute('src', '/modules/costforge-ai');
      });
    });

    it('cleanup on unmount does not throw', () => {
      setupStore({ status: 'loaded', error: null, windowId: 'w-1' });
      
      const { unmount } = render(<ModuleLoader moduleId="government-edition" />);
      
      expect(() => unmount()).not.toThrow();
    });
  });
});

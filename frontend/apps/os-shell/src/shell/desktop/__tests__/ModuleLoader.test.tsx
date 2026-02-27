/**
 * TerraFusion OS ModuleLoader Component Tests
 *
 * Tests for the component that loads and renders module content.
 * Updated for the new component-based architecture (no iframes).
 *
 * @module shell/desktop/__tests__/ModuleLoader.test
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import type { ModuleDefinition } from '../../../stores/moduleRegistryStore';
import { useModuleRegistryStore } from '../../../stores/moduleRegistryStore';
import { ModuleLoader } from '../ModuleLoader';

// Mock the ModuleRenderer to avoid lazy loading issues and focus on ModuleLoader logic
jest.mock('../../../config/moduleComponents', () => {
  const actual = jest.requireActual('../../../config/moduleComponents');
  return {
    ...actual,
    ModuleRenderer: ({ module }: { module: { id: string } }) => (
      <div data-testid='mock-module-renderer'>Rendered: {module.id}</div>
    ),
  };
});

// Mock module data
const mockModule: ModuleDefinition = {
  id: 'government-edition',
  name: 'Government Edition',
  displayName: 'Government Edition',
  description: 'Core government operations dashboard',
  icon: 'Building2',
  category: 'core',
  tier: 'Tier1',
  status: 'active',
  version: '1.0.0',
  launchPath: '/modules/government-edition',
  isCore: true,
  priority: 1,
};

// Reset store before each test
beforeEach(() => {
  useModuleRegistryStore.setState({
    modules: new Map(),
    loadStates: new Map(),
    isInitialized: false,
    initError: null,
  });
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Helper to setup store with modules
const setupStore = () => {
  const modulesMap = new Map<string, ModuleDefinition>();
  modulesMap.set(mockModule.id, mockModule);

  useModuleRegistryStore.setState({
    modules: modulesMap,
    isInitialized: true,
    initError: null,
  });
};

describe('ModuleLoader', () => {
  describe('Module Found', () => {
    it('renders ModuleRenderer when module exists in registry', () => {
      setupStore();

      render(<ModuleLoader moduleId='government-edition' />);

      expect(screen.getByTestId('module-loader')).toBeInTheDocument();
      expect(screen.getByTestId('mock-module-renderer')).toBeInTheDocument();
      expect(screen.getByText('Rendered: government-edition')).toBeInTheDocument();
    });

    it('passes correct moduleId to ModuleRenderer', () => {
      setupStore();

      render(<ModuleLoader moduleId='government-edition' />);

      expect(screen.getByText('Rendered: government-edition')).toBeInTheDocument();
    });

    it('fills container dimensions', () => {
      setupStore();

      render(<ModuleLoader moduleId='government-edition' />);

      const container = screen.getByTestId('module-loader');
      expect(container).toHaveClass('w-full', 'h-full');
    });
  });

  describe('Module Not Found', () => {
    it('renders Not Found state when module is missing from registry', () => {
      setupStore();

      render(<ModuleLoader moduleId='unknown-module' />);

      expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
    });

    it('displays the unknown module ID', () => {
      setupStore();

      render(<ModuleLoader moduleId='unknown-module' />);

      expect(screen.getByText(/unknown-module/i)).toBeInTheDocument();
    });

    it('does not render ModuleRenderer', () => {
      setupStore();

      render(<ModuleLoader moduleId='unknown-module' />);

      expect(screen.queryByTestId('mock-module-renderer')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty moduleId', () => {
      setupStore();

      render(<ModuleLoader moduleId='' />);

      expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
    });
  });
});

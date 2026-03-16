/**
 * TerraFusion OS Integration Tests
 *
 * Tests verifying the integration between stores and components:
 * - moduleRegistryStore + desktopStore
 * - launchModule flow
 * - Window + ModuleLoader integration
 *
 * @module shell/desktop/__tests__/integration.test
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';

import { useDesktopStore, type DesktopWindow } from '../../../stores/desktopStore';
import { useModuleRegistryStore, type ModuleDefinition } from '../../../stores/moduleRegistryStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { ModuleLoader } from '../ModuleLoader';
import { Window } from '../Window';
import { WindowManager } from '../WindowManager';

// Mock modules matching the real TerraFusion modules
const mockModules: ModuleDefinition[] = [
  {
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
  },
  {
    id: 'costforge-ai',
    name: 'CostForge AI',
    displayName: 'CostForge AI Champion',
    description: 'AI-powered cost analysis',
    icon: 'Calculator',
    category: 'ai',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/costforge-ai',
    isCore: true,
    priority: 1,
  },
  {
    id: 'gispro',
    name: 'GIS Pro',
    displayName: 'GIS Professional',
    description: 'Geographic information systems',
    icon: 'Map',
    category: 'mapping',
    tier: 'Tier2',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/gispro',
    isCore: false,
    priority: 2,
  },
];

// Reset all stores before each test
beforeEach(() => {
  // Reset desktop store
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });

  // Reset start menu store
  useStartMenuStore.setState({
    isOpen: false,
    searchQuery: '',
    pinnedApps: [],
    allApps: [],
  });

  // Reset module registry store
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

// Helper to initialize stores with mock data
const initializeModuleRegistry = () => {
  useModuleRegistryStore.getState().registerModules(mockModules);
};

describe('Integration: Store to Store', () => {
  describe('moduleRegistryStore → desktopStore', () => {
    it('launchModule creates window in desktopStore', async () => {
      initializeModuleRegistry();

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      const windows = useDesktopStore.getState().windows;
      expect(windows.length).toBe(1);
      expect(windows[0].moduleId).toBe('government-edition');
      expect(windows[0].title).toBe('Government Edition');
    });

    it('launchModule updates loadState to loaded', async () => {
      initializeModuleRegistry();

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      const loadState = useModuleRegistryStore.getState().loadStates.get('government-edition');
      expect(loadState?.status).toBe('loaded');
    });

    it('launchModule stores windowId in loadState', async () => {
      initializeModuleRegistry();

      const windowId = await useModuleRegistryStore.getState().launchModule('government-edition');

      const loadState = useModuleRegistryStore.getState().loadStates.get('government-edition');
      expect(loadState?.windowId).toBe(windowId);
    });

    it('launching same module twice returns same windowId', async () => {
      initializeModuleRegistry();

      const windowId1 = await useModuleRegistryStore.getState().launchModule('government-edition');
      const windowId2 = await useModuleRegistryStore.getState().launchModule('government-edition');

      expect(windowId2).toBe(windowId1);
      expect(useDesktopStore.getState().windows.length).toBe(1);
    });

    it('can open multiple different modules', async () => {
      initializeModuleRegistry();

      await useModuleRegistryStore.getState().launchModule('government-edition');
      await useModuleRegistryStore.getState().launchModule('costforge-ai');
      await useModuleRegistryStore.getState().launchModule('gispro');

      const windows = useDesktopStore.getState().windows;
      expect(windows.length).toBe(3);
      expect(windows.map((w) => w.moduleId)).toEqual([
        'government-edition',
        'costforge-ai',
        'gispro',
      ]);
    });
  });

  describe('closeModule flow', () => {
    it('closeModule resets loadState to idle', async () => {
      initializeModuleRegistry();

      await useModuleRegistryStore.getState().launchModule('government-edition');
      expect(useModuleRegistryStore.getState().loadStates.get('government-edition')?.status).toBe(
        'loaded'
      );

      useModuleRegistryStore.getState().closeModule('government-edition');
      expect(useModuleRegistryStore.getState().loadStates.get('government-edition')?.status).toBe(
        'idle'
      );
    });
  });
});

describe('Integration: Window + ModuleLoader', () => {
  it('Window renders ModuleLoader when passed as children', () => {
    initializeModuleRegistry();

    // Set up a loaded module state
    useModuleRegistryStore.setState({
      ...useModuleRegistryStore.getState(),
      loadStates: new Map([
        ['government-edition', { status: 'loaded', error: null, windowId: 'win-1' }],
      ]),
    });

    const windowData: DesktopWindow = {
      id: 'win-1',
      moduleId: 'government-edition',
      title: 'Government Edition',
      icon: 'Building2',
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
      state: 'normal',
      zIndex: 1,
    };

    render(
      <Window window={windowData}>
        <ModuleLoader moduleId='government-edition' />
      </Window>
    );

    expect(screen.getByTestId('window')).toBeInTheDocument();
    expect(screen.getByTestId('module-loader')).toBeInTheDocument();
    // ModuleLoader now renders ModuleRenderer directly (no iframe)
    expect(screen.getByTestId('module-loader')).toHaveAttribute(
      'data-module-id',
      'government-edition'
    );
  });

  it('ModuleLoader shows not found state for unregistered module', () => {
    // Don't initialize registry - module won't be found

    const windowData: DesktopWindow = {
      id: 'win-1',
      moduleId: 'unknown-module',
      title: 'Unknown',
      icon: 'Activity',
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
      state: 'normal',
      zIndex: 1,
    };

    render(
      <Window window={windowData}>
        <ModuleLoader moduleId='unknown-module' />
      </Window>
    );

    expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
    expect(screen.getByText(/Module Not Found/i)).toBeInTheDocument();
  });
});

describe('Integration: WindowManager renders with ModuleLoader', () => {
  it('WindowManager includes ModuleLoader in each window', async () => {
    initializeModuleRegistry();

    // Launch a module to create a window
    await useModuleRegistryStore.getState().launchModule('government-edition');

    render(<WindowManager />);

    expect(screen.getByTestId('window-manager')).toBeInTheDocument();
    expect(screen.getByTestId('window')).toBeInTheDocument();
    expect(screen.getByTestId('module-loader')).toBeInTheDocument();
  });

  it('multiple windows each have their own ModuleLoader', async () => {
    initializeModuleRegistry();

    await useModuleRegistryStore.getState().launchModule('government-edition');
    await useModuleRegistryStore.getState().launchModule('costforge-ai');

    render(<WindowManager />);

    const windows = screen.getAllByTestId('window');
    const loaders = screen.getAllByTestId('module-loader');

    expect(windows.length).toBe(2);
    expect(loaders.length).toBe(2);
  });

  it('ModuleLoader has correct module ID attribute', async () => {
    initializeModuleRegistry();

    await useModuleRegistryStore.getState().launchModule('gispro');

    render(<WindowManager />);

    const loader = screen.getByTestId('module-loader');
    expect(loader).toHaveAttribute('data-module-id', 'gispro');
  });
});

describe('Integration: Z-Index ordering', () => {
  it('windows have correct z-index based on open order', async () => {
    initializeModuleRegistry();

    await useModuleRegistryStore.getState().launchModule('government-edition');
    await useModuleRegistryStore.getState().launchModule('costforge-ai');
    await useModuleRegistryStore.getState().launchModule('gispro');

    const windows = useDesktopStore.getState().windows;

    const gov = windows.find((w) => w.moduleId === 'government-edition');
    const cost = windows.find((w) => w.moduleId === 'costforge-ai');
    const gis = windows.find((w) => w.moduleId === 'gispro');

    // Later opened windows have higher z-index
    expect(gov!.zIndex).toBeLessThan(cost!.zIndex);
    expect(cost!.zIndex).toBeLessThan(gis!.zIndex);
  });

  it('focusWindow updates z-index', async () => {
    initializeModuleRegistry();

    await useModuleRegistryStore.getState().launchModule('government-edition');
    await useModuleRegistryStore.getState().launchModule('costforge-ai');

    const govWindowBefore = useDesktopStore
      .getState()
      .windows.find((w) => w.moduleId === 'government-edition');
    const costWindowBefore = useDesktopStore
      .getState()
      .windows.find((w) => w.moduleId === 'costforge-ai');

    expect(govWindowBefore!.zIndex).toBeLessThan(costWindowBefore!.zIndex);

    // Focus the first window
    useDesktopStore.getState().focusWindow(govWindowBefore!.id);

    const govWindowAfter = useDesktopStore
      .getState()
      .windows.find((w) => w.moduleId === 'government-edition');
    const costWindowAfter = useDesktopStore
      .getState()
      .windows.find((w) => w.moduleId === 'costforge-ai');

    // Now government-edition should have higher z-index
    expect(govWindowAfter!.zIndex).toBeGreaterThan(costWindowAfter!.zIndex);
  });
});

describe('Integration: Error handling', () => {
  it('ModuleLoader shows not found for unregistered module', () => {
    // Don't call initializeModuleRegistry() - leave registry empty

    render(<ModuleLoader moduleId='nonexistent-module' />);

    expect(screen.getByTestId('module-not-found')).toBeInTheDocument();
    expect(screen.getByText(/Module Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/nonexistent-module/)).toBeInTheDocument();
  });

  it('not found state displays module ID in error message', () => {
    // Don't call initializeModuleRegistry() - leave registry empty

    render(<ModuleLoader moduleId='special-module-id' />);

    expect(screen.getByText(/special-module-id/)).toBeInTheDocument();
  });
});

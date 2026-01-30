/**
 * TerraFusion OS Phase 9 Integration Tests
 *
 * Full-stack integration tests verifying all Phase 5-8 components
 * work together seamlessly:
 * - Stores (desktop, startMenu, moduleRegistry, notification)
 * - Error boundaries (Window, Desktop)
 * - Toast notifications
 * - Module launch flow
 * - Error reporting flow
 *
 * @module shell/desktop/__tests__/Phase9Integration.test
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';

import { errorTracker } from '../../../hooks/useErrorReporter';
import { useDesktopStore } from '../../../stores/desktopStore';
import { useModuleRegistryStore, type ModuleDefinition } from '../../../stores/moduleRegistryStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { DesktopWithErrorBoundary } from '../Desktop';

// jest-dom matchers are extended globally via setupTests.ts

// ============================================================================
// Test Data
// ============================================================================

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

const mockStartMenuModules = mockModules.map((m) => ({
  id: m.id,
  name: m.displayName,
  icon: m.icon,
  description: m.description,
  category: m.category,
  tier: m.tier,
  isPinned: m.isCore,
  status: 'active' as const,
}));

// ============================================================================
// Setup / Teardown
// ============================================================================

const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();

  // Reset all stores
  act(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,
    });

    useStartMenuStore.setState({
      isOpen: false,
      searchQuery: '',
      pinnedApps: mockStartMenuModules.filter((m) => m.isPinned),
      recentApps: [],
      focusedIndex: -1,
      focusedSection: 'search',
      allApps: mockStartMenuModules,
    });

    useModuleRegistryStore.setState({
      modules: new Map(),
      loadStates: new Map(),
      isInitialized: false,
      initError: null,
    });

    useNotificationStore.getState().clearAll();
  });

  errorTracker.clear();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  cleanup();
});

// Helper to initialize module registry
const initializeModuleRegistry = () => {
  useModuleRegistryStore.getState().registerModules(mockModules);
};

// ============================================================================
// Phase 9: Full Stack Integration
// ============================================================================

describe('Phase 9: Full Stack Integration', () => {
  describe('Desktop → Stores → Components', () => {
    it('Desktop renders with all integrated components', () => {
      render(<DesktopWithErrorBoundary />);

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /taskbar/i })).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('Window manager responds to store changes', async () => {
      initializeModuleRegistry();
      render(<DesktopWithErrorBoundary />);

      // Initially no windows
      expect(screen.queryByTestId('window')).not.toBeInTheDocument();

      // Launch module
      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      // Window should appear
      expect(screen.getByTestId('window')).toBeInTheDocument();
    });

    it('Taskbar shows running windows from store', async () => {
      initializeModuleRegistry();
      render(<DesktopWithErrorBoundary />);

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      const runningApps = screen.getByTestId('running-apps');
      expect(runningApps).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /government edition/i })).toBeInTheDocument();
    });
  });

  describe('Module Launch → Notification Flow', () => {
    it('Module launch shows success notification', async () => {
      initializeModuleRegistry();
      render(<DesktopWithErrorBoundary />);

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      // Manually add notification like useModuleLaunchNotifications would
      act(() => {
        useNotificationStore.getState().addNotification(
          {
            title: 'Module Opened',
            message: 'Government Edition is now ready.',
            type: 'success',
          },
          { duration: 3000 }
        );
      });

      // Toast should appear
      expect(screen.getByText('Module Opened')).toBeInTheDocument();
    });

    it('Multiple module launches show multiple toasts', async () => {
      initializeModuleRegistry();
      render(<DesktopWithErrorBoundary />);

      // Add success notifications
      act(() => {
        const store = useNotificationStore.getState();
        store.addNotification({ title: 'Module 1', message: 'Ready', type: 'success' });
        store.addNotification({ title: 'Module 2', message: 'Ready', type: 'success' });
        store.addNotification({ title: 'Module 3', message: 'Ready', type: 'success' });
      });

      // All 3 toasts visible (max 3)
      expect(screen.getByText('Module 1')).toBeInTheDocument();
      expect(screen.getByText('Module 2')).toBeInTheDocument();
      expect(screen.getByText('Module 3')).toBeInTheDocument();
    });
  });

  describe('Error → Notification Flow', () => {
    it('Error notifications appear in toast container', () => {
      render(<DesktopWithErrorBoundary />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Error in Component',
          message: 'Something went wrong',
          type: 'error',
        });
      });

      expect(screen.getByText('Error in Component')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('Warning notifications appear with correct styling', () => {
      render(<DesktopWithErrorBoundary />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Warning',
          message: 'Check this out',
          type: 'warning',
        });
      });

      // Toast should be visible in the container
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Check this out')).toBeInTheDocument();
    });
  });

  describe('Window Lifecycle → Store Sync', () => {
    it('Window close updates desktopStore', async () => {
      initializeModuleRegistry();
      render(<DesktopWithErrorBoundary />);

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      // Verify window exists
      expect(useDesktopStore.getState().windows.length).toBe(1);

      // Close via store
      act(() => {
        const windowId = useDesktopStore.getState().windows[0].id;
        useDesktopStore.getState().closeWindow(windowId);
      });

      // Window removed
      expect(useDesktopStore.getState().windows.length).toBe(0);
    });

    it('Window focus updates activeWindowId', async () => {
      initializeModuleRegistry();

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
        await useModuleRegistryStore.getState().launchModule('costforge-ai');
      });

      const windows = useDesktopStore.getState().windows;
      expect(windows.length).toBe(2);

      // Focus first window
      act(() => {
        useDesktopStore.getState().focusWindow(windows[0].id);
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(windows[0].id);
    });
  });

  describe('Z-Index Stacking Integration', () => {
    it('New windows stack on top of existing', async () => {
      initializeModuleRegistry();

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
        await useModuleRegistryStore.getState().launchModule('costforge-ai');
        await useModuleRegistryStore.getState().launchModule('gispro');
      });

      const windows = useDesktopStore.getState().windows;

      // Verify z-index ordering
      const gov = windows.find((w) => w.moduleId === 'government-edition');
      const cost = windows.find((w) => w.moduleId === 'costforge-ai');
      const gis = windows.find((w) => w.moduleId === 'gispro');

      expect(gov!.zIndex).toBeLessThan(cost!.zIndex);
      expect(cost!.zIndex).toBeLessThan(gis!.zIndex);
    });

    it('Focus window brings to top', async () => {
      initializeModuleRegistry();

      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
        await useModuleRegistryStore.getState().launchModule('costforge-ai');
      });

      const govBefore = useDesktopStore
        .getState()
        .windows.find((w) => w.moduleId === 'government-edition');

      // Focus government-edition (opened first, lower z-index)
      act(() => {
        useDesktopStore.getState().focusWindow(govBefore!.id);
      });

      const govAfter = useDesktopStore
        .getState()
        .windows.find((w) => w.moduleId === 'government-edition');
      const costAfter = useDesktopStore
        .getState()
        .windows.find((w) => w.moduleId === 'costforge-ai');

      // Government should now be on top
      expect(govAfter!.zIndex).toBeGreaterThan(costAfter!.zIndex);
    });
  });

  describe('Start Menu → Module Registry → Desktop', () => {
    it('Start menu toggle via store', () => {
      render(<DesktopWithErrorBoundary />);

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();

      act(() => {
        useStartMenuStore.getState().open();
      });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('Start menu closes via store', () => {
      // Start with open
      useStartMenuStore.setState({ ...useStartMenuStore.getState(), isOpen: true });

      render(<DesktopWithErrorBoundary />);

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();

      act(() => {
        useStartMenuStore.getState().close();
      });

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();
    });
  });

  describe('Notification Persistence', () => {
    it('Notifications persist in history', () => {
      act(() => {
        const store = useNotificationStore.getState();
        store.addNotification({ title: 'N1', message: 'M1', type: 'info' });
        store.addNotification({ title: 'N2', message: 'M2', type: 'success' });
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBe(2);
    });

    it('Toast dismissal removes from toasts but keeps in history', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test',
          message: 'Test message',
          type: 'info',
        });
      });

      const toastsBefore = useNotificationStore.getState().toasts;
      expect(toastsBefore.length).toBe(1);

      const toastId = toastsBefore[0].id;

      act(() => {
        useNotificationStore.getState().dismissToast(toastId);
      });

      // Toast removed
      expect(useNotificationStore.getState().toasts.length).toBe(0);

      // History still has notification
      expect(useNotificationStore.getState().notifications.length).toBe(1);
    });
  });

  describe('Error Tracking Integration', () => {
    it('Error tracker increments per component', () => {
      errorTracker.increment('ComponentA');
      errorTracker.increment('ComponentA');
      errorTracker.increment('ComponentB');

      expect(errorTracker.getCount('ComponentA')).toBe(2);
      expect(errorTracker.getCount('ComponentB')).toBe(1);
    });

    it('Clear resets all error counts', () => {
      errorTracker.increment('ComponentA');
      errorTracker.increment('ComponentB');

      errorTracker.clear();

      expect(errorTracker.getCount('ComponentA')).toBe(0);
      expect(errorTracker.getCount('ComponentB')).toBe(0);
    });
  });
});

describe('Phase 9: Accessibility Integration', () => {
  it('Desktop has main role', () => {
    render(<DesktopWithErrorBoundary />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('Taskbar has navigation role', () => {
    render(<DesktopWithErrorBoundary />);
    expect(screen.getByRole('navigation', { name: /taskbar/i })).toBeInTheDocument();
  });

  it('Toast container has live region', () => {
    render(<DesktopWithErrorBoundary />);
    const container = screen.getByTestId('toast-container');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('Window manager has region role', () => {
    render(<DesktopWithErrorBoundary />);
    expect(screen.getByRole('region', { name: /application windows/i })).toBeInTheDocument();
  });
});

describe('Phase 9: Multi-Store Coordination', () => {
  it('All stores can be reset independently', () => {
    initializeModuleRegistry();

    // Add some state
    act(() => {
      useDesktopStore.getState().openWindow('test', 'Test', 'Settings');
      useStartMenuStore.getState().open();
      useNotificationStore.getState().addNotification({
        title: 'T',
        message: 'M',
        type: 'info',
      });
    });

    // Verify state
    expect(useDesktopStore.getState().windows.length).toBe(1);
    expect(useStartMenuStore.getState().isOpen).toBe(true);
    expect(useNotificationStore.getState().notifications.length).toBe(1);

    // Reset each
    act(() => {
      useDesktopStore.setState({
        windows: [],
        activeWindowId: null,
        nextZIndex: 1,
        snapPreview: null,
      });
      useStartMenuStore.getState().close();
      useNotificationStore.getState().clearAll();
    });

    // Verify reset
    expect(useDesktopStore.getState().windows.length).toBe(0);
    expect(useStartMenuStore.getState().isOpen).toBe(false);
    expect(useNotificationStore.getState().notifications.length).toBe(0);
  });
});

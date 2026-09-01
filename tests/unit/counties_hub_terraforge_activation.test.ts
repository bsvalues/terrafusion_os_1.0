import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RevealableWindow } from '../../frontend/apps/os-shell/src/stores/windowReveal';

interface TestDesktopWindow extends RevealableWindow {
  moduleId: string;
  title: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  windowType?: 'normal' | 'companion' | 'workbench' | 'suite';
  metadata?: Record<string, unknown>;
}

interface TestDesktopState {
  shellMode: 'desktop' | 'home' | 'application';
  windows: TestDesktopWindow[];
  activeWindowId: string | null;
  nextZIndex: number;
  currentDesktopId: string;
}

const { desktopStoreHarness, trackEvent } = vi.hoisted(() => ({
  desktopStoreHarness: {
    state: undefined as unknown as TestDesktopState,
    openWindow: vi.fn(),
    replaceWindowMetadata: vi.fn(),
    revealWindow: vi.fn(),
  },
  trackEvent: vi.fn(),
}));

vi.mock('../../frontend/apps/os-shell/src/config/moduleComponents', () => ({
  normalizeModuleId: (moduleId: string) => moduleId,
  isModuleRegistered: (moduleId: string) => moduleId === 'suite-forge',
}));

vi.mock('../../frontend/apps/os-shell/src/services/telemetry', () => ({
  telemetry: { trackEvent },
}));

vi.mock('../../frontend/apps/os-shell/src/stores/desktopStore', () => ({
  useDesktopStore: {
    getState: () => ({
      windows: desktopStoreHarness.state.windows,
      openWindow: desktopStoreHarness.openWindow,
      replaceWindowMetadata: desktopStoreHarness.replaceWindowMetadata,
      revealWindow: desktopStoreHarness.revealWindow,
    }),
  },
}));

vi.mock('../../frontend/apps/os-shell/src/stores/moduleLoaderStore', () => ({
  useModuleLoaderStore: {
    getState: () => ({ loadModule: vi.fn().mockResolvedValue(undefined) }),
  },
}));

vi.mock('../../frontend/apps/os-shell/src/stores/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({ addNotification: vi.fn() }),
  },
}));

import { activateModule } from '../../frontend/apps/os-shell/src/orchestration/moduleActivation';
import { computeWindowReveal } from '../../frontend/apps/os-shell/src/stores/windowReveal';

const ADAMS_COUNTY_CONTEXT = {
  countyCode: '001',
  countyName: 'Adams',
  resetValuationScope: true,
  launchContext: 'washington-counties-hub',
  dataTrustTier: 'public-reference-not-county-certified',
  referencePackageSource: 'repository-reference',
  referenceDataPosture: 'unavailable',
  referenceRecordCount: null,
  latestReferenceSaleDate: null,
  salesReviewAvailability: 'unavailable',
  salesReviewUnavailableMessage: 'No governed public sales workflow is available for Adams County.',
};

function forgeWindow(overrides: Partial<TestDesktopWindow> = {}): TestDesktopWindow {
  return {
    id: 'terraforge-window',
    moduleId: 'suite-forge',
    title: 'TerraForge',
    icon: 'Hammer',
    desktopId: 'desktop-1',
    position: { x: 100, y: 50 },
    size: { width: 1200, height: 680 },
    state: 'normal',
    zIndex: 1,
    windowType: 'suite',
    metadata: {
      countyCode: '005',
      countyName: 'Benton',
      segmentId: 'stale-benton-segment',
    },
    ...overrides,
  };
}

function countiesHubWindow(): TestDesktopWindow {
  return {
    id: 'counties-hub-window',
    moduleId: 'counties',
    title: 'Washington Counties Hub',
    icon: 'Map',
    desktopId: 'desktop-2',
    position: { x: 100, y: 50 },
    size: { width: 1000, height: 700 },
    state: 'normal',
    zIndex: 2,
  };
}

beforeEach(() => {
  trackEvent.mockReset();
  desktopStoreHarness.openWindow.mockReset();
  desktopStoreHarness.state = {
    shellMode: 'application',
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    currentDesktopId: 'desktop-1',
  };

  desktopStoreHarness.replaceWindowMetadata.mockReset().mockImplementation(
    (windowId: string, metadata: Record<string, unknown>) => {
      desktopStoreHarness.state = {
        ...desktopStoreHarness.state,
        windows: desktopStoreHarness.state.windows.map((window) =>
          window.id === windowId ? { ...window, metadata: { ...metadata } } : window,
        ),
      };
    },
  );

  desktopStoreHarness.revealWindow.mockReset().mockImplementation((windowId: string) => {
    const transition = computeWindowReveal(
      {
        windows: desktopStoreHarness.state.windows,
        nextZIndex: desktopStoreHarness.state.nextZIndex,
        currentDesktopId: desktopStoreHarness.state.currentDesktopId,
      },
      windowId,
    );
    if (!transition) return;

    desktopStoreHarness.state = {
      ...desktopStoreHarness.state,
      windows: transition.windows,
      activeWindowId: transition.activeWindowId,
      currentDesktopId: transition.currentDesktopId,
      nextZIndex: transition.nextZIndex,
      shellMode: 'application',
    };
  });
});

describe('Counties HUB to existing TerraForge activation', () => {
  it('keeps an already-active TerraForge visible while replacing its county context', async () => {
    desktopStoreHarness.state = {
      ...desktopStoreHarness.state,
      shellMode: 'home',
      windows: [forgeWindow()],
      activeWindowId: 'terraforge-window',
      nextZIndex: 2,
    };

    await activateModule('suite-forge', {
      source: 'system',
      metadata: ADAMS_COUNTY_CONTEXT,
    });

    const state = desktopStoreHarness.state;
    const terraForge = state.windows.find((window) => window.id === 'terraforge-window');
    expect(terraForge?.state).toBe('normal');
    expect(terraForge?.metadata).toEqual(ADAMS_COUNTY_CONTEXT);
    expect(state.activeWindowId).toBe('terraforge-window');
    expect(state.currentDesktopId).toBe('desktop-1');
    expect(state.shellMode).toBe('application');
    expect(desktopStoreHarness.openWindow).not.toHaveBeenCalled();
  });

  it('switches to and restores a cross-desktop TerraForge singleton', async () => {
    desktopStoreHarness.state = {
      ...desktopStoreHarness.state,
      windows: [forgeWindow({ state: 'minimized' }), countiesHubWindow()],
      activeWindowId: 'counties-hub-window',
      nextZIndex: 3,
      currentDesktopId: 'desktop-2',
    };

    await activateModule('suite-forge', {
      source: 'system',
      metadata: ADAMS_COUNTY_CONTEXT,
    });

    const state = desktopStoreHarness.state;
    const terraForge = state.windows.find((window) => window.id === 'terraforge-window');
    const visibleWindowIds = state.windows
      .filter(
        (window) =>
          window.desktopId === state.currentDesktopId && window.state !== 'minimized',
      )
      .map((window) => window.id);

    expect(state.currentDesktopId).toBe('desktop-1');
    expect(state.activeWindowId).toBe('terraforge-window');
    expect(state.shellMode).toBe('application');
    expect(terraForge?.state).toBe('normal');
    expect(terraForge?.zIndex).toBe(3);
    expect(terraForge?.metadata).toEqual(ADAMS_COUNTY_CONTEXT);
    expect(visibleWindowIds).toContain('terraforge-window');
    expect(desktopStoreHarness.openWindow).not.toHaveBeenCalled();
  });
});

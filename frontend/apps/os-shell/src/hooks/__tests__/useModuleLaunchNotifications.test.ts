/**
 * TerraFusion OS useModuleLaunchNotifications Hook Tests
 *
 * Tests for module launch integration:
 * - Launch success notifications
 * - Launch failure notifications
 * - Duplicate launch handling
 * - Close notifications
 *
 * @module hooks/__tests__/useModuleLaunchNotifications.test
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)

import { useDesktopStore } from '../../stores/desktopStore';
import { useModuleRegistryStore, type ModuleDefinition } from '../../stores/moduleRegistryStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useModuleLaunchNotifications } from '../useModuleLaunchNotifications';

// Mock module definitions
const mockModules: ModuleDefinition[] = [
  {
    id: 'gov-edition',
    name: 'Government Edition',
    displayName: 'Government Edition',
    description: 'Core government dashboard',
    icon: '🏛️',
    category: 'core',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/gov-edition',
    isCore: true,
    priority: 1,
  },
  {
    id: 'costforge',
    name: 'CostForge',
    displayName: 'CostForge AI',
    description: 'AI cost analysis',
    icon: '💰',
    category: 'ai',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/costforge',
    isCore: true,
    priority: 1,
  },
];

// Helper to initialize module registry with mock data
const initializeRegistry = () => {
  useModuleRegistryStore.getState().registerModules(mockModules);
};

beforeEach(() => {
  // Reset desktop store
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    snapPreview: null,
  });

  // Reset module registry
  useModuleRegistryStore.setState({
    modules: new Map(),
    loadStates: new Map(),
    isInitialized: false,
    initError: null,
  });

  // Reset notifications
  act(() => {
    useNotificationStore.getState().clearAll();
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useModuleLaunchNotifications', () => {
  describe('launchModule', () => {
    it('returns windowId on successful launch', async () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      let windowId: string | null = null;
      await act(async () => {
        windowId = await result.current.launchModule('gov-edition');
      });

      expect(windowId).toBeTruthy();
    });

    it('shows success notification on launch', async () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      await act(async () => {
        await result.current.launchModule('gov-edition');
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Module Opened');
      expect(toasts[0].message).toContain('Government Edition');
      expect(toasts[0].type).toBe('success');
    });

    it('shows error notification on launch failure', async () => {
      initializeRegistry();

      // Force launchModule to throw
      const originalLaunch = useModuleRegistryStore.getState().launchModule;
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        launchModule: jest.fn().mockRejectedValue(new Error('Network timeout')),
      });

      const { result } = renderHook(() => useModuleLaunchNotifications());

      await act(async () => {
        await result.current.launchModule('gov-edition');
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Launch Failed');
      expect(toasts[0].message).toContain('Network timeout');
      expect(toasts[0].type).toBe('error');

      // Restore original
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        launchModule: originalLaunch,
      });
    });

    it('returns null on launch failure', async () => {
      initializeRegistry();

      // Force launchModule to throw
      const originalLaunch = useModuleRegistryStore.getState().launchModule;
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        launchModule: jest.fn().mockRejectedValue(new Error('Failed')),
      });

      const { result } = renderHook(() => useModuleLaunchNotifications());

      let windowId: string | null = 'not-null';
      await act(async () => {
        windowId = await result.current.launchModule('gov-edition');
      });

      expect(windowId).toBeNull();

      // Restore original
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        launchModule: originalLaunch,
      });
    });

    it('focuses existing window without duplicate notification', async () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      // First launch - shows notification
      await act(async () => {
        await result.current.launchModule('gov-edition');
      });

      expect(useNotificationStore.getState().toasts.length).toBe(1);

      // Clear for second launch
      act(() => {
        useNotificationStore.getState().clearAll();
      });

      // Second launch - should just focus, no notification
      await act(async () => {
        await result.current.launchModule('gov-edition');
      });

      // No new toast because window already exists
      expect(useNotificationStore.getState().toasts.length).toBe(0);
    });

    it('can launch multiple different modules', async () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      await act(async () => {
        await result.current.launchModule('gov-edition');
        await result.current.launchModule('costforge');
      });

      const windows = useDesktopStore.getState().windows;
      expect(windows.length).toBe(2);

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(2);
    });
  });

  describe('closeModule', () => {
    it('closes module without notification by default', async () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      await act(async () => {
        await result.current.launchModule('gov-edition');
      });

      // Clear open notification
      act(() => {
        useNotificationStore.getState().clearAll();
      });

      act(() => {
        result.current.closeModule('gov-edition');
      });

      // No close notification
      expect(useNotificationStore.getState().toasts.length).toBe(0);
    });

    it('shows notification when showNotification is true', async () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      await act(async () => {
        await result.current.launchModule('gov-edition');
      });

      // Clear open notification
      act(() => {
        useNotificationStore.getState().clearAll();
      });

      act(() => {
        result.current.closeModule('gov-edition', true);
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Module Closed');
      expect(toasts[0].type).toBe('info');
    });
  });

  describe('isLoading', () => {
    it('returns false when idle', () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      expect(result.current.isLoading('gov-edition')).toBe(false);
    });

    it('returns true when loading', () => {
      initializeRegistry();

      // Set loading state manually
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        loadStates: new Map([['gov-edition', { status: 'loading', error: null, windowId: null }]]),
      });

      const { result } = renderHook(() => useModuleLaunchNotifications());

      expect(result.current.isLoading('gov-edition')).toBe(true);
    });
  });

  describe('hasError', () => {
    it('returns null when no error', () => {
      initializeRegistry();

      const { result } = renderHook(() => useModuleLaunchNotifications());

      expect(result.current.hasError('gov-edition')).toBeNull();
    });

    it('returns error message when errored', () => {
      initializeRegistry();

      // Set error state manually
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        loadStates: new Map([
          ['gov-edition', { status: 'error', error: 'Network failed', windowId: null }],
        ]),
      });

      const { result } = renderHook(() => useModuleLaunchNotifications());

      expect(result.current.hasError('gov-edition')).toBe('Network failed');
    });
  });

  describe('Fallback behavior', () => {
    it('uses fallback when registry not initialized', async () => {
      // Don't initialize registry
      const { result } = renderHook(() => useModuleLaunchNotifications());

      await act(async () => {
        await result.current.launchModule('unknown-module');
      });

      // Should still create window and show notification
      const windows = useDesktopStore.getState().windows;
      expect(windows.length).toBe(1);
      expect(windows[0].moduleId).toBe('unknown-module');

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Module Opened');
    });
  });
});

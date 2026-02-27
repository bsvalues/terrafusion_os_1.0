/**
 * TerraFusion OS Module Notification Integration Tests
 * 
 * Tests for module events triggering notifications:
 * - Module launch → success notification
 * - Module error → error notification
 * - Window close → optional notification
 * 
 * @module stores/__tests__/moduleNotificationIntegration.test
 * @vitest-environment jsdom
 */

// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)
import { act } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

import { useModuleRegistryStore } from '../moduleRegistryStore';
import { useDesktopStore } from '../desktopStore';
import { useNotificationStore } from '../notificationStore';
import { 
  notifyModuleLaunched, 
  notifyModuleError, 
  notifyModuleClosed,
  setupModuleNotifications 
} from '../../services/moduleNotifications';

expect.extend(matchers);

beforeEach(() => {
  // Reset all stores
  act(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,
    });
    
    useModuleRegistryStore.setState({
      modules: new Map(),
      loadStates: new Map(),
      isInitialized: false,
      initError: null,
    });
    
    useNotificationStore.getState().clearAll();
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// Helper to register a test module
const registerTestModule = (id: string, displayName: string) => {
  act(() => {
    const store = useModuleRegistryStore.getState();
    const modules = new Map(store.modules);
    modules.set(id, {
      id,
      name: id,
      displayName,
      description: 'Test module',
      icon: '📦',
      category: 'Test',
      tier: 'Tier1' as const,
      status: 'active' as const,
      version: '1.0.0',
      launchPath: '/test',
      isCore: false,
      priority: 1,
    });
    
    const loadStates = new Map(store.loadStates);
    loadStates.set(id, {
      status: 'idle',
      error: null,
      windowId: null,
    });
    
    store.modules = modules;
    store.loadStates = loadStates;
    store.isInitialized = true;
  });
};

describe('Module Notification Integration', () => {
  describe('notifyModuleLaunched', () => {
    it('adds success notification when module launches', () => {
      notifyModuleLaunched('Assessment Pro', '📊');
      
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].title).toContain('Assessment Pro');
    });

    it('includes module icon in notification', () => {
      notifyModuleLaunched('GIS Viewer', '🗺️');
      
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].message).toContain('🗺️');
    });

    it('creates toast with short duration', () => {
      notifyModuleLaunched('Test Module', '📦');
      
      const toasts = useNotificationStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].duration).toBeLessThanOrEqual(3000);
    });
  });

  describe('notifyModuleError', () => {
    it('adds error notification when module fails', () => {
      notifyModuleError('Failed Module', 'Connection timeout');
      
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].title).toContain('Failed Module');
    });

    it('includes error message in notification', () => {
      notifyModuleError('Test Module', 'Network error');
      
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].message).toContain('Network error');
    });

    it('creates toast with longer duration for errors', () => {
      notifyModuleError('Test Module', 'Error message');
      
      const toasts = useNotificationStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].duration).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('notifyModuleClosed', () => {
    it('adds info notification when module closes', () => {
      notifyModuleClosed('Closed Module');
      
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('info');
    });

    it('can be silent (no toast)', () => {
      notifyModuleClosed('Silent Close', { silent: true });
      
      const notifications = useNotificationStore.getState().notifications;
      const toasts = useNotificationStore.getState().toasts;
      
      // Notification added to history but no toast
      expect(notifications).toHaveLength(1);
      expect(toasts).toHaveLength(0);
    });
  });

  describe('setupModuleNotifications', () => {
    it('returns cleanup function', () => {
      const cleanup = setupModuleNotifications();
      
      expect(typeof cleanup).toBe('function');
      
      // Clean up
      cleanup();
    });
  });
});

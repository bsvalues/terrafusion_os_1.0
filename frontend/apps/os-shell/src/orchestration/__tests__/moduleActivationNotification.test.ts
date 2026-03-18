/**
 * TerraFusion OS Module Activation Notification Tests
 *
 * Priority 7: Tests for activateModule() → notification integration.
 *
 * SUCCESS CRITERIA:
 * SC-10.5: Module launch shows notification toast
 * SC-10.6: Toasts stack correctly (max 3 visible)
 * SC-10.7: Toast auto-dismiss works
 *
 * @module orchestration/__tests__/moduleActivationNotification.test
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { activateModule } from '../moduleActivation';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('../../config/moduleComponents', () => ({
  normalizeModuleId: (id: string) => id,
  isModuleRegistered: (id: string) => ['costforge', 'terra-gaia', 'atlas-ai'].includes(id),
}));

vi.mock('../../stores/moduleLoaderStore', () => ({
  useModuleLoaderStore: {
    getState: () => ({
      loadModule: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('../../services/telemetry', () => ({
  telemetry: {
    trackEvent: vi.fn(),
  },
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    useNotificationStore.getState().clearAll();
    useDesktopStore.getState().closeAllWindows?.() || 
      (useDesktopStore.setState({ windows: [], activeWindowId: null }));
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ============================================================================
// Tests
// ============================================================================

describe('activateModule → Notification Integration', () => {
  // ==========================================================================
  // SC-10.5: Module launch shows notification
  // ==========================================================================

  describe('launch notification (SC-10.5)', () => {
    it('shows success notification when module opens', async () => {
      await act(async () => {
        await activateModule('costforge', { source: 'start_menu' });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Module Opened');
      expect(notifications[0].message).toContain('CostForge');
      expect(notifications[0].type).toBe('success');
    });

    it('shows toast for new module', async () => {
      await act(async () => {
        await activateModule('terra-gaia', { source: 'desktop' });
      });

      const { toasts } = useNotificationStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toContain('TerraGaia');
    });

    it('does NOT show notification when focusing existing window', async () => {
      // Open first time
      await act(async () => {
        await activateModule('costforge', { source: 'start_menu' });
      });

      // Clear notifications
      act(() => {
        useNotificationStore.getState().clearAll();
      });

      // Activate again (should focus, not show notification)
      await act(async () => {
        await activateModule('costforge', { source: 'start_menu' });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(0);
    });

    it('respects showNotification: false option', async () => {
      await act(async () => {
        await activateModule('costforge', { 
          source: 'system',
          showNotification: false,
        });
      });

      const { notifications, toasts } = useNotificationStore.getState();
      expect(notifications).toHaveLength(0);
      expect(toasts).toHaveLength(0);
    });
  });

  // ==========================================================================
  // SC-10.6: Toast stacking
  // ==========================================================================

  describe('toast stacking (SC-10.6)', () => {
    it('shows max 3 toasts', async () => {
      await act(async () => {
        await activateModule('costforge', { source: 'start_menu' });
      });
      
      // Clear to reset
      act(() => {
        useDesktopStore.setState({ windows: [] });
      });

      await act(async () => {
        await activateModule('terra-gaia', { source: 'start_menu' });
      });
      
      act(() => {
        useDesktopStore.setState({ windows: [] });
      });

      await act(async () => {
        await activateModule('atlas-ai', { source: 'start_menu' });
      });
      
      act(() => {
        useDesktopStore.setState({ windows: [] });
      });

      // Add 4th - would exceed max
      await act(async () => {
        await activateModule('costforge', { source: 'desktop' });
      });

      const { toasts } = useNotificationStore.getState();
      expect(toasts.length).toBeLessThanOrEqual(3);
    });
  });

  // ==========================================================================
  // SC-10.7: Toast auto-dismiss
  // ==========================================================================

  describe('toast auto-dismiss (SC-10.7)', () => {
    it('toast has 3000ms duration', async () => {
      await act(async () => {
        await activateModule('costforge', { source: 'start_menu' });
      });

      const { toasts } = useNotificationStore.getState();
      expect(toasts[0].duration).toBe(3000);
    });
  });

  // ==========================================================================
  // Different sources
  // ==========================================================================

  describe('activation sources', () => {
    it.each([
      'start_menu',
      'desktop',
      'shortcut',
      'keyboard_shortcut',
      'context_menu',
    ] as const)('shows notification for source: %s', async (source) => {
      // Clear between tests
      act(() => {
        useDesktopStore.setState({ windows: [] });
        useNotificationStore.getState().clearAll();
      });

      await act(async () => {
        await activateModule('costforge', { source });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications.length).toBeGreaterThan(0);
    });
  });
});

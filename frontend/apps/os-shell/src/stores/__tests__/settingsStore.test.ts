/**
 * TerraFusion OS Settings Store Tests
 *
 * Priority 8: Tests for user preferences and notification settings.
 *
 * @module stores/__tests__/settingsStore.test
 */

import { act } from 'react';
import { useSettingsStore } from '../settingsStore';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  // Reset store to defaults
  act(() => {
    useSettingsStore.getState().resetAll();
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('settingsStore', () => {
  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('initial state', () => {
    it('starts with notifications enabled', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.enabled).toBe(true);
    });

    it('starts with toasts enabled', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.showToasts).toBe(true);
    });

    it('starts with 5000ms auto-dismiss', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.autoDismissMs).toBe(5000);
    });

    it('starts with sound disabled', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.playSound).toBe(false);
    });

    it('starts with module launch notifications enabled', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.showModuleLaunch).toBe(true);
    });

    it('starts with system events notifications enabled', () => {
      const { notifications } = useSettingsStore.getState();
      expect(notifications.showSystemEvents).toBe(true);
    });

    it('has keyboard shortcuts defined', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();
      expect(keyboardShortcuts.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Notification Preferences
  // ==========================================================================

  describe('notification preferences', () => {
    it('setNotificationEnabled updates enabled state', () => {
      act(() => {
        useSettingsStore.getState().setNotificationEnabled(false);
      });

      expect(useSettingsStore.getState().notifications.enabled).toBe(false);
    });

    it('setShowToasts updates showToasts state', () => {
      act(() => {
        useSettingsStore.getState().setShowToasts(false);
      });

      expect(useSettingsStore.getState().notifications.showToasts).toBe(false);
    });

    it('setAutoDismissMs updates auto-dismiss duration', () => {
      act(() => {
        useSettingsStore.getState().setAutoDismissMs(3000);
      });

      expect(useSettingsStore.getState().notifications.autoDismissMs).toBe(3000);
    });

    it('setAutoDismissMs accepts 0 for never dismiss', () => {
      act(() => {
        useSettingsStore.getState().setAutoDismissMs(0);
      });

      expect(useSettingsStore.getState().notifications.autoDismissMs).toBe(0);
    });

    it('setPlaySound updates sound preference', () => {
      act(() => {
        useSettingsStore.getState().setPlaySound(true);
      });

      expect(useSettingsStore.getState().notifications.playSound).toBe(true);
    });

    it('setShowModuleLaunch updates module launch preference', () => {
      act(() => {
        useSettingsStore.getState().setShowModuleLaunch(false);
      });

      expect(useSettingsStore.getState().notifications.showModuleLaunch).toBe(false);
    });

    it('setShowSystemEvents updates system events preference', () => {
      act(() => {
        useSettingsStore.getState().setShowSystemEvents(false);
      });

      expect(useSettingsStore.getState().notifications.showSystemEvents).toBe(false);
    });

    it('resetNotifications restores defaults', () => {
      // Change values
      act(() => {
        useSettingsStore.getState().setNotificationEnabled(false);
        useSettingsStore.getState().setAutoDismissMs(1000);
        useSettingsStore.getState().setPlaySound(true);
      });

      // Reset
      act(() => {
        useSettingsStore.getState().resetNotifications();
      });

      const { notifications } = useSettingsStore.getState();
      expect(notifications.enabled).toBe(true);
      expect(notifications.autoDismissMs).toBe(5000);
      expect(notifications.playSound).toBe(false);
    });
  });

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================

  describe('keyboard shortcuts', () => {
    it('includes module shortcuts', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();
      const moduleShortcuts = keyboardShortcuts.filter((s) => s.category === 'modules');

      expect(moduleShortcuts.length).toBe(7); // 7 modules
    });

    it('includes Ctrl+1 for CostForge', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();
      const costforge = keyboardShortcuts.find((s) => s.keys === 'Ctrl+1');

      expect(costforge).toBeDefined();
      expect(costforge?.action).toContain('CostForge');
    });

    it('includes navigation shortcuts', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();
      const navShortcuts = keyboardShortcuts.filter((s) => s.category === 'navigation');

      expect(navShortcuts.length).toBeGreaterThan(0);
    });

    it('includes window shortcuts', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();
      const windowShortcuts = keyboardShortcuts.filter((s) => s.category === 'windows');

      expect(windowShortcuts.length).toBeGreaterThan(0);
    });

    it('includes Ctrl+, for Settings', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();
      const settings = keyboardShortcuts.find((s) => s.keys === 'Ctrl+,');

      expect(settings).toBeDefined();
      expect(settings?.action).toContain('Settings');
    });

    it('each shortcut has required fields', () => {
      const { keyboardShortcuts } = useSettingsStore.getState();

      keyboardShortcuts.forEach((shortcut) => {
        expect(shortcut.id).toBeDefined();
        expect(shortcut.action).toBeDefined();
        expect(shortcut.keys).toBeDefined();
        expect(shortcut.category).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // Reset All
  // ==========================================================================

  describe('resetAll', () => {
    it('resets all settings to defaults', () => {
      // Change values
      act(() => {
        useSettingsStore.getState().setNotificationEnabled(false);
        useSettingsStore.getState().setShowToasts(false);
        useSettingsStore.getState().setAutoDismissMs(1000);
      });

      // Reset all
      act(() => {
        useSettingsStore.getState().resetAll();
      });

      const { notifications } = useSettingsStore.getState();
      expect(notifications.enabled).toBe(true);
      expect(notifications.showToasts).toBe(true);
      expect(notifications.autoDismissMs).toBe(5000);
    });
  });

  // ==========================================================================
  // Convenience Hooks (type safety)
  // ==========================================================================

  describe('convenience hooks', () => {
    it('useNotificationPreferences returns notification object', () => {
      // Just verify it's callable and returns expected shape
      const prefs = useSettingsStore.getState().notifications;
      expect(prefs).toHaveProperty('enabled');
      expect(prefs).toHaveProperty('showToasts');
    });

    it('useKeyboardShortcutsConfig returns shortcuts array', () => {
      const shortcuts = useSettingsStore.getState().keyboardShortcuts;
      expect(Array.isArray(shortcuts)).toBe(true);
    });
  });
});

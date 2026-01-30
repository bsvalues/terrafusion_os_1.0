/**
 * TerraFusion OS Settings Store
 *
 * Zustand store for user preferences beyond theme settings.
 * Handles notification preferences, feature flags, and UI settings.
 *
 * @module stores/settingsStore
 * @see Priority 8: Settings Panel
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface NotificationPreferences {
  /** Enable/disable all notifications */
  enabled: boolean;
  /** Show toast popups */
  showToasts: boolean;
  /** Auto-dismiss duration in ms (0 = never) */
  autoDismissMs: number;
  /** Play sound on notification */
  playSound: boolean;
  /** Show notifications for module launches */
  showModuleLaunch: boolean;
  /** Show notifications for system events */
  showSystemEvents: boolean;
}

export interface KeyboardShortcut {
  id: string;
  action: string;
  keys: string;
  category: 'modules' | 'navigation' | 'windows' | 'system';
}

export interface SettingsState {
  // Notification preferences
  notifications: NotificationPreferences;
  
  // Computed
  keyboardShortcuts: KeyboardShortcut[];

  // Actions
  setNotificationEnabled: (enabled: boolean) => void;
  setShowToasts: (show: boolean) => void;
  setAutoDismissMs: (ms: number) => void;
  setPlaySound: (play: boolean) => void;
  setShowModuleLaunch: (show: boolean) => void;
  setShowSystemEvents: (show: boolean) => void;
  resetNotifications: () => void;
  resetAll: () => void;
}

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  showToasts: true,
  autoDismissMs: 5000,
  playSound: false,
  showModuleLaunch: true,
  showSystemEvents: true,
};

/**
 * Static keyboard shortcuts reference.
 * These are read-only for now (customization in future).
 */
const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Modules
  { id: 'open-costforge', action: 'Open CostForge', keys: 'Ctrl+1', category: 'modules' },
  { id: 'open-terragaia', action: 'Open TerraGaia', keys: 'Ctrl+2', category: 'modules' },
  { id: 'open-atlas', action: 'Open ATLAS', keys: 'Ctrl+3', category: 'modules' },
  { id: 'open-analytics', action: 'Open Analytics', keys: 'Ctrl+4', category: 'modules' },
  { id: 'open-marketplace', action: 'Open Marketplace', keys: 'Ctrl+5', category: 'modules' },
  { id: 'open-counties', action: 'Open Counties Hub', keys: 'Ctrl+6', category: 'modules' },
  { id: 'open-gov-arch', action: 'Open Gov Architecture', keys: 'Ctrl+7', category: 'modules' },
  
  // Navigation
  { id: 'toggle-start', action: 'Toggle Start Menu', keys: 'Ctrl+`', category: 'navigation' },
  { id: 'toggle-start-win', action: 'Toggle Start Menu', keys: 'Win', category: 'navigation' },
  { id: 'close-start', action: 'Close Start Menu', keys: 'Escape', category: 'navigation' },
  { id: 'open-settings', action: 'Open Settings', keys: 'Ctrl+,', category: 'navigation' },
  { id: 'command-palette', action: 'Command Palette', keys: 'Ctrl+K', category: 'navigation' },
  
  // Windows
  { id: 'close-window', action: 'Close Active Window', keys: 'Alt+F4', category: 'windows' },
  { id: 'minimize-window', action: 'Minimize Window', keys: 'Win+Down', category: 'windows' },
  { id: 'maximize-window', action: 'Maximize Window', keys: 'Win+Up', category: 'windows' },
  { id: 'snap-left', action: 'Snap Window Left', keys: 'Win+Left', category: 'windows' },
  { id: 'snap-right', action: 'Snap Window Right', keys: 'Win+Right', category: 'windows' },
  
  // System
  { id: 'task-view', action: 'Task View', keys: 'Win+Tab', category: 'system' },
];

// ============================================================================
// Store Implementation
// ============================================================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: DEFAULT_NOTIFICATION_PREFS,
      keyboardShortcuts: KEYBOARD_SHORTCUTS,

      setNotificationEnabled: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, enabled },
        })),

      setShowToasts: (showToasts) =>
        set((state) => ({
          notifications: { ...state.notifications, showToasts },
        })),

      setAutoDismissMs: (autoDismissMs) =>
        set((state) => ({
          notifications: { ...state.notifications, autoDismissMs },
        })),

      setPlaySound: (playSound) =>
        set((state) => ({
          notifications: { ...state.notifications, playSound },
        })),

      setShowModuleLaunch: (showModuleLaunch) =>
        set((state) => ({
          notifications: { ...state.notifications, showModuleLaunch },
        })),

      setShowSystemEvents: (showSystemEvents) =>
        set((state) => ({
          notifications: { ...state.notifications, showSystemEvents },
        })),

      resetNotifications: () =>
        set({ notifications: DEFAULT_NOTIFICATION_PREFS }),

      resetAll: () =>
        set({
          notifications: DEFAULT_NOTIFICATION_PREFS,
        }),
    }),
    {
      name: 'terrafusion-settings',
      version: 1,
    }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/** Hook for notification preferences */
export const useNotificationPreferences = () =>
  useSettingsStore((state) => state.notifications);

/** Hook for keyboard shortcuts */
export const useKeyboardShortcutsConfig = () =>
  useSettingsStore((state) => state.keyboardShortcuts);

/** Hook for notification actions */
export const useNotificationPreferenceActions = () =>
  useSettingsStore((state) => ({
    setEnabled: state.setNotificationEnabled,
    setShowToasts: state.setShowToasts,
    setAutoDismissMs: state.setAutoDismissMs,
    setPlaySound: state.setPlaySound,
    setShowModuleLaunch: state.setShowModuleLaunch,
    setShowSystemEvents: state.setShowSystemEvents,
    reset: state.resetNotifications,
  }));

export default useSettingsStore;

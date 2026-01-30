/**
 * TerraFusion OS Stores
 *
 * Central export for all Zustand stores used in the desktop shell.
 *
 * @module stores
 */

// Desktop window management
export {
  useActiveWindowId,
  useDesktopStore,
  useSnapActions,
  useSnapPreview,
  useWindowActions,
  useWindows,
  type DesktopState,
  type DesktopWindow,
  type Position,
  type Size,
  type SnapBounds,
  type SnapPreview,
  type SnapZone,
  type WindowState,
} from './desktopStore';

// Start Menu state management
export {
  useAllApps,
  useFocusState,
  usePinnedApps,
  useRecentApps,
  useSearchQuery,
  useStartMenuActions,
  useStartMenuOpen,
  useStartMenuStore,
  type FocusedSection,
  type Module,
  type ModuleStatus,
  type StartMenuState,
} from './startMenuStore';

// Module Registry - manages module definitions and loading state
export {
  useActiveModules,
  useAllModules,
  useCoreModules,
  useIsModuleLoaded,
  useIsModuleLoading,
  useModuleRegistryActions,
  useModuleRegistryInitialized,
  useModuleRegistryStore,
  type LoadStatus,
  type ModuleDefinition,
  type ModuleLoadState,
  type ModuleRegistryState,
  type ModuleTier,
} from './moduleRegistryStore';

// Notification system - toasts and notification history
export {
  MAX_NOTIFICATIONS,
  MAX_VISIBLE_TOASTS,
  useNotificationActions,
  useNotificationStore,
  useNotifications,
  useToasts,
  useUnreadCount,
  type AddNotificationOptions,
  type Notification,
  type NotificationState,
  type NotificationType,
  type Toast,
} from './notificationStore';

// Module Loader - state machine for module loading lifecycle (Phase 2)
export {
  useModuleLoaderActions,
  useModuleLoaderStore,
  useModuleLoadState,
  type ModuleLoadState as LoaderModuleLoadState,
  type ModuleLoaderState,
  type ModuleStatus as LoaderModuleStatus,
} from './moduleLoaderStore';

// Settings - user preferences and notification settings
export {
  useSettingsStore,
  useNotificationPreferences,
  useKeyboardShortcutsConfig,
  useNotificationPreferenceActions,
  type SettingsState,
  type NotificationPreferences,
  type KeyboardShortcut,
} from './settingsStore';

// Command Palette - global search state
export {
  useCommandPaletteStore,
  useCommandPaletteOpen,
  useCommandPaletteSearch,
  useRecentCommands,
  useCommandPaletteActions,
  MAX_RECENT_COMMANDS,
  type CommandPaletteState,
  type CommandCategory,
} from './commandPaletteStore';

// Window Peek - taskbar preview state
export {
  useWindowPeekStore,
  useWindowPeekVisible,
  useWindowPeekTarget,
  useWindowPeekPosition,
  useWindowPeekActions,
  PEEK_DELAY_MS,
  PEEK_HIDE_DELAY_MS,
  type WindowPeekState,
} from './windowPeekStore';

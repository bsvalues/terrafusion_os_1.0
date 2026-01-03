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

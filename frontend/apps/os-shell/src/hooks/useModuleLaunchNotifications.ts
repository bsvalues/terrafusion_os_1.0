/**
 * TerraFusion OS Module Launch Notifications Hook
 *
 * Provides wrapped module launch actions that show toast notifications
 * for launch success and failure.
 *
 * @module hooks/useModuleLaunchNotifications
 * @see SUCCESS CRITERIA Phase 9: Integration
 */

import { useCallback } from 'react';
import { useDesktopStore } from '../stores/desktopStore';
import { useModuleRegistryStore } from '../stores/moduleRegistryStore';
import { useNotificationStore } from '../stores/notificationStore';

// ============================================================================
// Types
// ============================================================================

export interface ModuleLaunchActions {
  /** Launch a module with notification feedback */
  launchModule: (moduleId: string) => Promise<string | null>;
  /** Close a module with optional notification */
  closeModule: (moduleId: string, showNotification?: boolean) => void;
  /** Check if a module is currently loading */
  isLoading: (moduleId: string) => boolean;
  /** Check if a module has errored */
  hasError: (moduleId: string) => string | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useModuleLaunchNotifications - Module launch with toast notifications
 *
 * Wraps moduleRegistryStore.launchModule to automatically show
 * success/failure notifications to the user.
 *
 * Features:
 * - Shows success toast on module launch
 * - Shows error toast on launch failure
 * - Handles duplicate module focus
 * - Provides loading and error state access
 *
 * @returns ModuleLaunchActions interface
 *
 * @example
 * ```tsx
 * function StartMenu() {
 *   const { launchModule } = useModuleLaunchNotifications();
 *
 *   const handleAppClick = async (moduleId: string) => {
 *     // Automatically shows toast on success/failure
 *     await launchModule(moduleId);
 *   };
 * }
 * ```
 */
export function useModuleLaunchNotifications(): ModuleLaunchActions {
  // Module registry store
  const registryLaunch = useModuleRegistryStore((state) => state.launchModule);
  const registryClose = useModuleRegistryStore((state) => state.closeModule);
  const getModuleById = useModuleRegistryStore((state) => state.getModuleById);
  const loadStates = useModuleRegistryStore((state) => state.loadStates);
  const isInitialized = useModuleRegistryStore((state) => state.isInitialized);

  // Desktop store for fallback
  const desktopOpenWindow = useDesktopStore((state) => state.openWindow);
  const desktopFocusWindow = useDesktopStore((state) => state.focusWindow);

  // Notification store
  const addNotification = useNotificationStore((state) => state.addNotification);

  /**
   * Launch module with notification feedback
   */
  const launchModule = useCallback(
    async (moduleId: string): Promise<string | null> => {
      const module = getModuleById(moduleId);
      const moduleName = module?.displayName || module?.name || moduleId;

      // Check if already loaded (focus instead of relaunch)
      const existingState = loadStates.get(moduleId);
      if (existingState?.status === 'loaded' && existingState?.windowId) {
        // Focus existing window instead of showing "opened" toast
        desktopFocusWindow(existingState.windowId);
        return existingState.windowId;
      }

      try {
        let windowId: string;

        if (isInitialized && module) {
          // Primary path: Use module registry
          windowId = await registryLaunch(moduleId);
        } else {
          // Fallback: Direct window open
          windowId = desktopOpenWindow(moduleId, moduleName, module?.icon || '📦');
        }

        // Success notification
        addNotification(
          {
            title: 'Module Opened',
            message: `${moduleName} is now ready.`,
            type: 'success',
          },
          { duration: 3000 }
        );

        return windowId;
      } catch (error) {
        // Error notification
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        addNotification(
          {
            title: 'Launch Failed',
            message: `Could not open ${moduleName}: ${errorMessage}`,
            type: 'error',
          },
          { duration: 5000 }
        );

        console.error(`[ModuleLaunch] Failed to launch ${moduleId}:`, error);
        return null;
      }
    },
    [
      registryLaunch,
      getModuleById,
      loadStates,
      isInitialized,
      desktopOpenWindow,
      desktopFocusWindow,
      addNotification,
    ]
  );

  /**
   * Close module with optional notification
   */
  const closeModule = useCallback(
    (moduleId: string, showNotification = false) => {
      const module = getModuleById(moduleId);
      const moduleName = module?.displayName || module?.name || moduleId;

      registryClose(moduleId);

      if (showNotification) {
        addNotification(
          {
            title: 'Module Closed',
            message: `${moduleName} has been closed.`,
            type: 'info',
          },
          { duration: 2000 }
        );
      }
    },
    [registryClose, getModuleById, addNotification]
  );

  /**
   * Check if module is loading
   */
  const isLoading = useCallback(
    (moduleId: string): boolean => {
      const state = loadStates.get(moduleId);
      return state?.status === 'loading';
    },
    [loadStates]
  );

  /**
   * Check if module has error
   */
  const hasError = useCallback(
    (moduleId: string): string | null => {
      const state = loadStates.get(moduleId);
      return state?.status === 'error' ? state.error || 'Unknown error' : null;
    },
    [loadStates]
  );

  return {
    launchModule,
    closeModule,
    isLoading,
    hasError,
  };
}

export default useModuleLaunchNotifications;

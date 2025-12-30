/**
 * TerraFusion OS Module Notifications Service
 *
 * Connects module lifecycle events to the notification system.
 * Provides helper functions for consistent notification patterns.
 *
 * @module services/moduleNotifications
 * @see SUCCESS CRITERIA Phase 9: Integration
 */

import { useNotificationStore } from '../stores/notificationStore';

// ============================================================================
// Types
// ============================================================================

export interface ModuleCloseOptions {
  /** If true, don't show toast (only add to history) */
  silent?: boolean;
}

// ============================================================================
// Notification Helpers
// ============================================================================

/**
 * Send notification when a module launches successfully
 */
export function notifyModuleLaunched(moduleName: string, icon: string = '📦'): string {
  const { addNotification } = useNotificationStore.getState();

  return addNotification(
    {
      title: `${moduleName} Opened`,
      message: `${icon} ${moduleName} is now running.`,
      type: 'success',
    },
    {
      showToast: true,
      duration: 2500, // Short duration for success
    }
  );
}

/**
 * Send notification when a module fails to load
 */
export function notifyModuleError(moduleName: string, errorMessage: string): string {
  const { addNotification } = useNotificationStore.getState();

  return addNotification(
    {
      title: `${moduleName} Error`,
      message: `Failed to load: ${errorMessage}`,
      type: 'error',
    },
    {
      showToast: true,
      duration: 5000, // Longer duration for errors
    }
  );
}

/**
 * Send notification when a module is closed
 */
export function notifyModuleClosed(
  moduleName: string,
  options: ModuleCloseOptions = {}
): string {
  const { addNotification } = useNotificationStore.getState();
  const { silent = false } = options;

  return addNotification(
    {
      title: `${moduleName} Closed`,
      message: `${moduleName} has been closed.`,
      type: 'info',
    },
    {
      showToast: !silent,
      duration: 2000,
    }
  );
}

/**
 * Send notification for module recovery attempt
 */
export function notifyModuleRecovery(moduleName: string, success: boolean): string {
  const { addNotification } = useNotificationStore.getState();

  if (success) {
    return addNotification(
      {
        title: 'Module Recovered',
        message: `${moduleName} has been reloaded successfully.`,
        type: 'success',
      },
      {
        showToast: true,
        duration: 3000,
      }
    );
  } else {
    return addNotification(
      {
        title: 'Recovery Failed',
        message: `${moduleName} could not be recovered. Please try again.`,
        type: 'error',
      },
      {
        showToast: true,
        duration: 5000,
      }
    );
  }
}

/**
 * Send system notification (for OS-level events)
 */
export function notifySystem(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): string {
  const { addNotification } = useNotificationStore.getState();

  return addNotification(
    { title, message, type },
    {
      showToast: true,
      duration: type === 'error' ? 5000 : 3000,
    }
  );
}

// ============================================================================
// Store Subscription Setup
// ============================================================================

/**
 * Setup module notification listeners
 *
 * Call this once at app initialization to connect module events to notifications.
 * Returns a cleanup function to unsubscribe.
 *
 * @example
 * ```tsx
 * // In App.tsx or main entry
 * useEffect(() => {
 *   const cleanup = setupModuleNotifications();
 *   return cleanup;
 * }, []);
 * ```
 */
export function setupModuleNotifications(): () => void {
  // This is a placeholder for future store subscription
  // In a full implementation, we'd subscribe to moduleRegistryStore changes
  // and automatically trigger notifications

  // For now, components call the notification helpers directly
  // This function exists for API consistency and future expansion

  const cleanup = () => {
    // Cleanup subscriptions when called
  };

  return cleanup;
}

export default {
  notifyModuleLaunched,
  notifyModuleError,
  notifyModuleClosed,
  notifyModuleRecovery,
  notifySystem,
  setupModuleNotifications,
};

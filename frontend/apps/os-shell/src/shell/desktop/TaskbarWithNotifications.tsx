/**
 * TerraFusion OS Taskbar with Notifications Integration
 *
 * Wrapper component that connects Taskbar to the notification store.
 * This provides live notification updates in the taskbar.
 *
 * Priority 7: Notification System Integration
 *
 * @module shell/desktop/TaskbarWithNotifications
 */

import React, { useCallback } from 'react';
import { useNotificationStore, useNotifications } from '../../stores/notificationStore';
import { Taskbar, type TaskbarProps } from './Taskbar';
import type { Notification } from './NotificationBell';

// ============================================================================
// Types
// ============================================================================

export interface TaskbarWithNotificationsProps extends Omit<
  TaskbarProps,
  'notifications' | 'onNotificationClick' | 'onNotificationDismiss' | 'onNotificationClearAll'
> {
  /** Additional callback when notification clicked (after marking as read) */
  onNotificationAction?: (notification: Notification) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TaskbarWithNotifications - Taskbar connected to notification store.
 *
 * Features:
 * - Live notifications from store
 * - Auto-updating badge count
 * - Click to mark as read
 * - Dismiss removes from store
 * - Clear all removes all from store
 *
 * Usage:
 * ```tsx
 * // In Desktop.tsx - replace <Taskbar /> with:
 * <TaskbarWithNotifications />
 * ```
 */
export const TaskbarWithNotifications: React.FC<TaskbarWithNotificationsProps> = ({
  onNotificationAction,
  ...taskbarProps
}) => {
  // Get notifications from store
  const notifications = useNotifications();
  const { dismissNotification, markAsRead, clearAll } = useNotificationStore();

  // Handle notification click (mark as read + optional callback)
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      markAsRead(notification.id);
      onNotificationAction?.(notification);
    },
    [markAsRead, onNotificationAction]
  );

  // Handle dismiss
  const handleDismiss = useCallback(
    (id: string) => {
      dismissNotification(id);
    },
    [dismissNotification]
  );

  // Handle clear all
  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return (
    <Taskbar
      {...taskbarProps}
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onNotificationDismiss={handleDismiss}
      onNotificationClearAll={handleClearAll}
    />
  );
};

export default TaskbarWithNotifications;

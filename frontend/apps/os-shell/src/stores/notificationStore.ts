/**
 * TerraFusion OS Notification Store
 *
 * Centralized state management for notifications and toasts.
 * Uses Zustand for reactive state updates.
 *
 * Features:
 * - Persistent notification history
 * - Toast queue with max visible limit
 * - Read/unread state tracking
 * - Auto-generated IDs and timestamps
 *
 * @module stores/notificationStore
 * @see SUCCESS CRITERIA Phase 8: Notification System
 */

import { create } from 'zustand';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of toasts visible at once */
export const MAX_VISIBLE_TOASTS = 3;

/** Maximum notifications stored in history */
export const MAX_NOTIFICATIONS = 100;

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Toast extends Notification {
  /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
  duration: number;
}

export interface AddNotificationOptions {
  /** Whether to show as toast popup (default: true) */
  showToast?: boolean;
  /** Toast duration in ms (default: 5000) */
  duration?: number;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationState {
  /** All notifications (history) */
  notifications: Notification[];
  /** Currently visible toasts */
  toasts: Toast[];

  // Actions
  addNotification: (
    notification: Pick<Notification, 'title' | 'message' | 'type'>,
    options?: AddNotificationOptions
  ) => string;
  dismissNotification: (id: string) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;

  // Computed
  getUnreadCount: () => number;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],

  addNotification: (notification, options = {}) => {
    const { showToast = true, duration = 5000, action } = options;
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newNotification: Notification = {
      id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: new Date().toISOString(),
      read: false,
      action,
    };

    set((state) => {
      // Add to notifications history (newest first)
      const notifications = [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);

      // Add to toasts if requested
      let toasts = state.toasts;
      if (showToast) {
        const newToast: Toast = { ...newNotification, duration };
        toasts = [newToast, ...state.toasts].slice(0, MAX_VISIBLE_TOASTS);
      }

      return { notifications, toasts };
    });

    return id;
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => {
    set({ notifications: [], toasts: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));

// ============================================================================
// Convenience Hooks
// ============================================================================

/** Hook to get all notifications */
export const useNotifications = () => useNotificationStore((state) => state.notifications);

/** Hook to get visible toasts */
export const useToasts = () => useNotificationStore((state) => state.toasts);

/** Hook to get unread count */
export const useUnreadCount = () => useNotificationStore((state) => state.getUnreadCount());

/** Hook to get notification actions */
export const useNotificationActions = () =>
  useNotificationStore((state) => ({
    addNotification: state.addNotification,
    dismissNotification: state.dismissNotification,
    dismissToast: state.dismissToast,
    markAsRead: state.markAsRead,
    markAllAsRead: state.markAllAsRead,
    clearAll: state.clearAll,
  }));

export default useNotificationStore;

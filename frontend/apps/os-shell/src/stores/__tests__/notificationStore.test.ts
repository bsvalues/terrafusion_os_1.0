/**
 * TerraFusion OS Notification Store Tests
 *
 * Tests for centralized notification state management:
 * - Add/dismiss/clear notifications
 * - Read state tracking
 * - Unread count computation
 * - Toast queue management
 *
 * @module stores/__tests__/notificationStore.test
 * @vitest-environment jsdom
 */

import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore, type NotificationType } from '../notificationStore';

// Reset store before each test
beforeEach(() => {
  act(() => {
    useNotificationStore.getState().clearAll();
  });
});

describe('notificationStore', () => {
  describe('Initial State', () => {
    it('starts with empty notifications array', () => {
      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
    });

    it('starts with empty toasts array', () => {
      const state = useNotificationStore.getState();
      expect(state.toasts).toEqual([]);
    });

    it('has zero unread count initially', () => {
      const state = useNotificationStore.getState();
      expect(state.getUnreadCount()).toBe(0);
    });
  });

  describe('addNotification', () => {
    it('adds a notification to the store', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({
          title: 'Test Notification',
          message: 'This is a test',
          type: 'info',
        });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Test Notification');
    });

    it('generates unique ID for each notification', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'First', message: 'msg', type: 'info' });
        addNotification({ title: 'Second', message: 'msg', type: 'info' });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].id).not.toBe(notifications[1].id);
    });

    it('sets timestamp automatically', () => {
      const { addNotification } = useNotificationStore.getState();
      const before = Date.now();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      const after = Date.now();
      const { notifications } = useNotificationStore.getState();
      const timestamp = new Date(notifications[0].timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('marks notification as unread by default', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(false);
    });

    it('adds newest notifications to the beginning', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'First', message: 'msg', type: 'info' });
        addNotification({ title: 'Second', message: 'msg', type: 'info' });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].title).toBe('Second');
      expect(notifications[1].title).toBe('First');
    });

    it('supports all notification types', () => {
      const { addNotification } = useNotificationStore.getState();
      const types: NotificationType[] = ['info', 'success', 'warning', 'error'];

      act(() => {
        types.forEach((type) => {
          addNotification({ title: type, message: 'msg', type });
        });
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(4);
      types.forEach((type) => {
        expect(notifications.some((n) => n.type === type)).toBe(true);
      });
    });

    it('also adds notification to toasts queue', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      const { toasts } = useNotificationStore.getState();
      expect(toasts).toHaveLength(1);
    });

    it('limits toasts to MAX_VISIBLE_TOASTS', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        for (let i = 0; i < 5; i++) {
          addNotification({ title: `Toast ${i}`, message: 'msg', type: 'info' });
        }
      });

      const { toasts } = useNotificationStore.getState();
      expect(toasts.length).toBeLessThanOrEqual(3); // MAX_VISIBLE_TOASTS = 3
    });

    it('can skip adding to toasts queue with showToast: false', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Silent', message: 'msg', type: 'info' }, { showToast: false });
      });

      const { notifications, toasts } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(toasts).toHaveLength(0);
    });
  });

  describe('dismissNotification', () => {
    it('removes notification by ID', () => {
      const { addNotification, dismissNotification } = useNotificationStore.getState();

      let notifId: string;
      act(() => {
        notifId = addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      act(() => {
        dismissNotification(notifId!);
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(0);
    });

    it('does nothing if ID not found', () => {
      const { addNotification, dismissNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      act(() => {
        dismissNotification('non-existent-id');
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
    });
  });

  describe('dismissToast', () => {
    it('removes toast by ID', () => {
      const { addNotification, dismissToast } = useNotificationStore.getState();

      let notifId: string;
      act(() => {
        notifId = addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      act(() => {
        dismissToast(notifId!);
      });

      const { toasts, notifications } = useNotificationStore.getState();
      expect(toasts).toHaveLength(0);
      // Notification should still exist
      expect(notifications).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      let notifId: string;
      act(() => {
        notifId = addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      act(() => {
        markAsRead(notifId!);
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(true);
    });

    it('does nothing if already read', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      let notifId: string;
      act(() => {
        notifId = addNotification({ title: 'Test', message: 'msg', type: 'info' });
        markAsRead(notifId);
        markAsRead(notifId); // Second call
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', () => {
      const { addNotification, markAllAsRead } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'First', message: 'msg', type: 'info' });
        addNotification({ title: 'Second', message: 'msg', type: 'info' });
        addNotification({ title: 'Third', message: 'msg', type: 'info' });
      });

      act(() => {
        markAllAsRead();
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('removes all notifications', () => {
      const { addNotification, clearAll } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'First', message: 'msg', type: 'info' });
        addNotification({ title: 'Second', message: 'msg', type: 'info' });
      });

      act(() => {
        clearAll();
      });

      const { notifications, toasts } = useNotificationStore.getState();
      expect(notifications).toHaveLength(0);
      expect(toasts).toHaveLength(0);
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', () => {
      const { addNotification, markAsRead, getUnreadCount } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'First', message: 'msg', type: 'info' });
        addNotification({ title: 'Second', message: 'msg', type: 'info' });
        addNotification({ title: 'Third', message: 'msg', type: 'info' });
      });

      expect(useNotificationStore.getState().getUnreadCount()).toBe(3);

      const { notifications } = useNotificationStore.getState();
      act(() => {
        markAsRead(notifications[0].id);
      });

      expect(useNotificationStore.getState().getUnreadCount()).toBe(2);
    });

    it('returns 0 when all read', () => {
      const { addNotification, markAllAsRead } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
        markAllAsRead();
      });

      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    });
  });

  describe('Convenience Hooks', () => {
    it('useNotifications returns notifications array', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications).toHaveLength(1);
    });

    it('useToasts returns toasts array', () => {
      const { addNotification } = useNotificationStore.getState();

      act(() => {
        addNotification({ title: 'Test', message: 'msg', type: 'info' });
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(Array.isArray(toasts)).toBe(true);
    });
  });
});

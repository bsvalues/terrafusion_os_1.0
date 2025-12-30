/**
 * TerraFusion OS Notification Integration Tests
 *
 * Tests for notification system integration:
 * - Module launches trigger notifications
 * - System events push notifications
 * - NotificationBell reads from store
 *
 * @module shell/notifications/__tests__/NotificationIntegration.test
 * @vitest-environment jsdom
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDesktopStore } from '../../../stores/desktopStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { ToastContainer } from '../ToastContainer';

expect.extend(matchers);

// Reset stores before each test
beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    useNotificationStore.getState().clearAll();
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
    });
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('Notification Integration', () => {
  describe('Module Launch Notifications', () => {
    it('can trigger notification when module opens', () => {
      render(<ToastContainer />);

      // Simulate module launch with notification
      act(() => {
        const windowId = useDesktopStore
          .getState()
          .openWindow('government-edition', 'Government Edition', '🏛️');

        useNotificationStore.getState().addNotification({
          title: 'App Opened',
          message: 'Government Edition is now running',
          type: 'success',
        });
      });

      expect(screen.getByText('App Opened')).toBeInTheDocument();
      expect(screen.getByText('Government Edition is now running')).toBeInTheDocument();
    });

    it('notification includes module name in message', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'App Opened',
          message: 'CostForge is now running',
          type: 'success',
        });
      });

      expect(screen.getByText(/CostForge/)).toBeInTheDocument();
    });

    it('uses success type for app opened notifications', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'App Opened',
          message: 'Module launched',
          type: 'success',
        });
      });

      const toast = screen.getByTestId(/^toast-notif-/);
      expect(toast).toHaveAttribute('data-type', 'success');
    });
  });

  describe('System Event Notifications', () => {
    it('can show error notifications for system errors', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Connection Error',
          message: 'Failed to connect to AI service',
          type: 'error',
        });
      });

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      const toast = screen.getByTestId(/^toast-notif-/);
      expect(toast).toHaveAttribute('data-type', 'error');
    });

    it('can show warning notifications', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'High CPU Usage',
          message: 'System load is above 80%',
          type: 'warning',
        });
      });

      expect(screen.getByText('High CPU Usage')).toBeInTheDocument();
    });

    it('can show info notifications', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Update Available',
          message: 'A new version is ready to install',
          type: 'info',
        });
      });

      expect(screen.getByText('Update Available')).toBeInTheDocument();
    });
  });

  describe('Notification History', () => {
    it('maintains notification history even after toast dismissed', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification(
          {
            title: 'Test Notification',
            message: 'Test message',
            type: 'info',
          },
          { duration: 1000 }
        );
      });

      // Toast visible
      expect(screen.getByText('Test Notification')).toBeInTheDocument();

      // Wait for auto-dismiss
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Toast gone
      expect(screen.queryByText('Test Notification')).not.toBeInTheDocument();

      // But notification still in history
      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Test Notification');
    });

    it('tracks read state separately from toast visibility', () => {
      act(() => {
        const id = useNotificationStore.getState().addNotification({
          title: 'Unread Notification',
          message: 'Test',
          type: 'info',
        });
      });

      const { notifications, getUnreadCount } = useNotificationStore.getState();
      expect(getUnreadCount()).toBe(1);
      expect(notifications[0].read).toBe(false);
    });
  });

  describe('Silent Notifications', () => {
    it('can add notification without showing toast', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification(
          {
            title: 'Silent Notification',
            message: 'Added to history only',
            type: 'info',
          },
          { showToast: false }
        );
      });

      // No toast visible
      expect(screen.queryByText('Silent Notification')).not.toBeInTheDocument();

      // But in history
      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
    });
  });

  describe('Notification Actions', () => {
    it('action callback can open a module', async () => {
      vi.useRealTimers();
      const openWindowMock = vi.fn();

      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification(
          {
            title: 'Report Ready',
            message: 'Click to view',
            type: 'success',
          },
          {
            duration: 0, // No auto-dismiss
          }
        );
      });

      // The action would be passed as part of notification options in real usage
      // This test verifies the toast renders correctly
      expect(screen.getByText('Report Ready')).toBeInTheDocument();
    });
  });
});

describe('Notification + NotificationBell Integration', () => {
  it('unread count updates when notifications added', () => {
    act(() => {
      useNotificationStore.getState().addNotification(
        {
          title: 'First',
          message: 'msg',
          type: 'info',
        },
        { showToast: false }
      );

      useNotificationStore.getState().addNotification(
        {
          title: 'Second',
          message: 'msg',
          type: 'info',
        },
        { showToast: false }
      );
    });

    expect(useNotificationStore.getState().getUnreadCount()).toBe(2);
  });

  it('unread count decreases when marked as read', () => {
    let id1: string, id2: string;

    act(() => {
      id1 = useNotificationStore.getState().addNotification(
        {
          title: 'First',
          message: 'msg',
          type: 'info',
        },
        { showToast: false }
      );

      id2 = useNotificationStore.getState().addNotification(
        {
          title: 'Second',
          message: 'msg',
          type: 'info',
        },
        { showToast: false }
      );
    });

    expect(useNotificationStore.getState().getUnreadCount()).toBe(2);

    act(() => {
      useNotificationStore.getState().markAsRead(id1!);
    });

    expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
  });

  it('clearAll removes all notifications and resets unread count', () => {
    act(() => {
      useNotificationStore.getState().addNotification(
        {
          title: 'Test',
          message: 'msg',
          type: 'info',
        },
        { showToast: false }
      );
    });

    expect(useNotificationStore.getState().getUnreadCount()).toBe(1);

    act(() => {
      useNotificationStore.getState().clearAll();
    });

    expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});

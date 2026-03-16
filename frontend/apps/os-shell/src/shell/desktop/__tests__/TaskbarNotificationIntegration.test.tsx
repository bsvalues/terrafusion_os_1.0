/**
 * TerraFusion OS Notification Integration Tests
 *
 * Priority 7: Tests for Taskbar ↔ Notification Store integration.
 *
 * SUCCESS CRITERIA:
 * SC-10.1: Taskbar NotificationBell uses notifications from store
 * SC-10.2: Adding notifications via store appears in taskbar bell
 * SC-10.3: Dismissing from bell updates store
 * SC-10.4: Clear all from bell clears store
 * SC-10.5: Badge count updates reactively
 *
 * @module shell/desktop/__tests__/TaskbarNotificationIntegration.test
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { useNotificationStore } from '../../../stores/notificationStore';

// ============================================================================
// Test Helper
// ============================================================================

// Test helper: Wrap components with Router context for useNavigate() support
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
};

// ============================================================================
// Mocks
// ============================================================================

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // Map of translations
      const translations: Record<string, string> = {
        'notifications.title': 'Notifications',
        'notifications.list': 'Notification list',
        'notifications.clearAll': 'Clear all',
        'notifications.dismiss': 'Dismiss',
        'notifications.closePanel': 'Close notifications',
        'notifications.unread': 'unread',
        'notifications.new': 'new',
        'notifications.noNotifications': 'No notifications',
        'notifications.time.justNow': 'Just now',
        'notifications.time.minAgo': `${options?.count} min ago`,
        'notifications.time.hoursAgo': `${options?.count} hours ago`,
        'notifications.time.daysAgo': `${options?.count} days ago`,
        'clock.currentTime': 'Current time',
      };
      if (options?.count !== undefined && key.includes('time.')) {
        return translations[key] || key;
      }
      return translations[key] || key;
    },
    i18n: {
      language: 'en-US',
    },
  }),
}));

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    useNotificationStore.getState().clearAll();
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

// ============================================================================
// Tests
// ============================================================================

describe('Taskbar ↔ Notification Store Integration', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TaskbarWithNotifications } = require('../TaskbarWithNotifications');

  // ==========================================================================
  // SC-10.1: Taskbar uses notifications from store
  // ==========================================================================

  describe('store connection (SC-10.1)', () => {
    it('renders NotificationBell', () => {
      renderWithRouter(<TaskbarWithNotifications />);

      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('shows zero badge when store is empty', () => {
      renderWithRouter(<TaskbarWithNotifications />);

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-10.2: Adding notifications appears in bell
  // ==========================================================================

  describe('adding notifications (SC-10.2)', () => {
    it('shows badge when notification added to store', () => {
      renderWithRouter(<TaskbarWithNotifications />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'New Alert',
          message: 'Something happened',
          type: 'info',
        });
      });

      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1');
    });

    it('updates badge count when multiple notifications added', () => {
      renderWithRouter(<TaskbarWithNotifications />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'First',
          message: 'msg',
          type: 'info',
        });
        useNotificationStore.getState().addNotification({
          title: 'Second',
          message: 'msg',
          type: 'warning',
        });
      });

      expect(screen.getByTestId('notification-badge')).toHaveTextContent('2');
    });

    it('shows notification in panel when opened', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithRouter(<TaskbarWithNotifications />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test Notification',
          message: 'Click to see details',
          type: 'success',
        });
      });

      await user.click(screen.getByTestId('notification-bell'));

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-10.3: Dismissing from bell updates store
  // ==========================================================================

  describe('dismissing notifications (SC-10.3)', () => {
    it('dismissing notification removes from store', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithRouter(<TaskbarWithNotifications />);

      // Add notification
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'To Dismiss',
          message: 'Will be removed',
          type: 'info',
        });
      });

      // Open panel
      await user.click(screen.getByTestId('notification-bell'));

      // Wait for panel to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Dismiss using testid for reliability
      const dismissButton = screen.getAllByTestId('notification-dismiss-button')[0];
      await user.click(dismissButton);

      // Wait for state update
      await waitFor(() => {
        expect(useNotificationStore.getState().notifications).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // SC-10.4: Clear all from bell clears store
  // ==========================================================================

  describe('clear all (SC-10.4)', () => {
    it('clear all button removes all notifications from store', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithRouter(<TaskbarWithNotifications />);

      // Add multiple notifications
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'First',
          message: 'msg',
          type: 'info',
        });
        useNotificationStore.getState().addNotification({
          title: 'Second',
          message: 'msg',
          type: 'warning',
        });
      });

      // Open panel
      await user.click(screen.getByTestId('notification-bell'));

      // Clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      // Check store
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('badge disappears after clear all', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithRouter(<TaskbarWithNotifications />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test',
          message: 'msg',
          type: 'info',
        });
      });

      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();

      // Open panel and clear
      await user.click(screen.getByTestId('notification-bell'));
      await user.click(screen.getByRole('button', { name: /clear all/i }));

      // Badge should be gone
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-10.5: Badge count updates reactively
  // ==========================================================================

  describe('reactive updates (SC-10.5)', () => {
    it('badge updates when notification marked as read', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithRouter(<TaskbarWithNotifications />);

      // Add notification
      let notifId: string;
      act(() => {
        notifId = useNotificationStore.getState().addNotification({
          title: 'To Read',
          message: 'msg',
          type: 'info',
        });
      });

      expect(screen.getByTestId('notification-badge')).toHaveTextContent('1');

      // Mark as read
      act(() => {
        useNotificationStore.getState().markAsRead(notifId!);
      });

      // Badge should disappear (0 unread)
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('clicking notification marks it as read', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithRouter(<TaskbarWithNotifications />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Click Me',
          message: 'To mark as read',
          type: 'info',
        });
      });

      // Open panel
      await user.click(screen.getByTestId('notification-bell'));

      // Click notification
      await user.click(screen.getByText('Click Me'));

      // Check store
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].read).toBe(true);
    });
  });
});

describe('Notification Type Styling', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TaskbarWithNotifications } = require('../TaskbarWithNotifications');

  beforeEach(() => {
    act(() => {
      useNotificationStore.getState().clearAll();
    });
  });

  it.each([
    ['info', '🔵'],
    ['success', '🟢'],
    ['warning', '🟡'],
    ['error', '🔴'],
  ])('displays %s notification with correct styling', async (type) => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithRouter(<TaskbarWithNotifications />);

    act(() => {
      useNotificationStore.getState().addNotification({
        title: `${type} Test`,
        message: 'msg',
        type: type as 'info' | 'success' | 'warning' | 'error',
      });
    });

    await user.click(screen.getByTestId('notification-bell'));

    expect(screen.getByTestId(`notif-icon-${type}`)).toBeInTheDocument();
  });
});

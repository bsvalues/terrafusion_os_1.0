/**
 * TerraFusion OS Notification Bell Tests
 *
 * Tests for the Notification Bell indicator and panel:
 * - Badge showing unread count
 * - Click to open notification panel
 * - List notifications with timestamps
 * - Clear all functionality
 * - Accessibility
 *
 * @module shell/desktop/__tests__/NotificationBell.test
 * @vitest-environment jsdom
 */

// Vitest imports removed - Jest globals used
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationBell, NotificationPanel, type Notification } from '../NotificationBell';

// Mock i18n
jest.mock('react-i18next', () => ({
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
      };
      return translations[key] || key;
    },
  }),
}));

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Assessment Complete',
    message: 'Property assessment for 123 Main St has been completed.',
    type: 'success',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    read: false,
  },
  {
    id: 'notif-2',
    title: 'AI Analysis Ready',
    message: 'CostForge AI has finished analyzing the Q4 data.',
    type: 'info',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    read: false,
  },
  {
    id: 'notif-3',
    title: 'System Update',
    message: 'TerraFusion OS will restart at midnight for updates.',
    type: 'warning',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: true,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('NotificationBell', () => {
  describe('Rendering', () => {
    it('renders notification bell', () => {
      render(<NotificationBell notifications={mockNotifications} />);

      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('shows bell icon', () => {
      render(<NotificationBell notifications={mockNotifications} />);

      expect(screen.getByText('🔔')).toBeInTheDocument();
    });

    it('shows badge with unread count', () => {
      render(<NotificationBell notifications={mockNotifications} />);

      const badge = screen.getByTestId('notification-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2'); // 2 unread
    });

    it('hides badge when no unread notifications', () => {
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      render(<NotificationBell notifications={allRead} />);

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('hides badge when no notifications', () => {
      render(<NotificationBell notifications={[]} />);

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('has accessible button role', () => {
      render(<NotificationBell notifications={mockNotifications} />);

      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('opens panel on click', async () => {
      render(<NotificationBell notifications={mockNotifications} />);

      await userEvent.click(screen.getByTestId('notification-bell'));

      expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    });

    it('closes panel on second click', async () => {
      render(<NotificationBell notifications={mockNotifications} />);

      await userEvent.click(screen.getByTestId('notification-bell'));
      expect(screen.getByTestId('notification-panel')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('notification-bell'));
      expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
    });

    it('sets aria-expanded when panel is open', async () => {
      render(<NotificationBell notifications={mockNotifications} />);

      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

describe('NotificationPanel', () => {
  describe('Rendering', () => {
    it('renders panel with header', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });

    it('lists all notifications', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByText('Assessment Complete')).toBeInTheDocument();
      expect(screen.getByText('AI Analysis Ready')).toBeInTheDocument();
      expect(screen.getByText('System Update')).toBeInTheDocument();
    });

    it('shows notification messages', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      expect(screen.getByText(/CostForge AI/)).toBeInTheDocument();
    });

    it('shows relative timestamps', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByText(/5 min ago/i)).toBeInTheDocument();
      expect(screen.getByText(/30 min ago/i)).toBeInTheDocument();
    });

    it('shows type icons for notifications', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByTestId('notif-icon-success')).toBeInTheDocument();
      expect(screen.getByTestId('notif-icon-info')).toBeInTheDocument();
      expect(screen.getByTestId('notif-icon-warning')).toBeInTheDocument();
    });

    it('visually distinguishes unread notifications', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      const unreadItems = screen.getAllByTestId('notification-item-unread');
      expect(unreadItems.length).toBe(2);
    });

    it('shows empty state when no notifications', () => {
      render(<NotificationPanel notifications={[]} onClose={() => {}} />);

      expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
    });

    it('shows "Clear all" button when notifications exist', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onClearAll when clear all clicked', async () => {
      const onClearAll = jest.fn();
      render(
        <NotificationPanel
          notifications={mockNotifications}
          onClose={() => {}}
          onClearAll={onClearAll}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /clear all/i }));

      expect(onClearAll).toHaveBeenCalled();
    });

    it('calls onNotificationClick when notification clicked', async () => {
      const onNotificationClick = jest.fn();
      render(
        <NotificationPanel
          notifications={mockNotifications}
          onClose={() => {}}
          onNotificationClick={onNotificationClick}
        />
      );

      await userEvent.click(screen.getByText('Assessment Complete'));

      expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it('calls onDismiss when dismiss button clicked', async () => {
      const onDismiss = jest.fn();
      render(
        <NotificationPanel
          notifications={mockNotifications}
          onClose={() => {}}
          onDismiss={onDismiss}
        />
      );

      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
      await userEvent.click(dismissButtons[0]);

      expect(onDismiss).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button clicked', async () => {
      const onClose = jest.fn();
      render(<NotificationPanel notifications={mockNotifications} onClose={onClose} />);

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', async () => {
      const onClose = jest.fn();
      render(<NotificationPanel notifications={mockNotifications} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Notifications');
    });

    it('notifications list has proper role', () => {
      render(<NotificationPanel notifications={mockNotifications} onClose={() => {}} />);

      expect(screen.getByRole('list', { name: /notification list/i })).toBeInTheDocument();
    });
  });
});

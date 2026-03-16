/**
 * TerraFusion OS Toast Container Tests
 *
 * Tests for toast container that manages multiple toasts:
 * - Positioned bottom-right
 * - Stacks up to 3 visible toasts
 * - Integrates with notification store
 *
 * @module shell/notifications/__tests__/ToastContainer.test
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useNotificationStore } from '../../../stores/notificationStore';
import { ToastContainer } from '../ToastContainer';

// jest-dom matchers are extended globally via setupTests.ts

// Reset store before each test
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

describe('ToastContainer', () => {
  describe('Rendering', () => {
    it('renders container element', () => {
      render(<ToastContainer />);

      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('positions container at bottom-right', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('fixed', 'bottom-0', 'right-0');
    });

    it('renders empty when no toasts', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container.children).toHaveLength(0);
    });
  });

  describe('Toast Display', () => {
    it('displays toast when notification added', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test Toast',
          message: 'Test message',
          type: 'info',
        });
      });

      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('displays multiple toasts', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Toast 1',
          message: 'Message 1',
          type: 'info',
        });
        useNotificationStore.getState().addNotification({
          title: 'Toast 2',
          message: 'Message 2',
          type: 'success',
        });
      });

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });

    it('limits visible toasts to MAX_VISIBLE_TOASTS (3)', () => {
      render(<ToastContainer />);

      act(() => {
        for (let i = 1; i <= 5; i++) {
          useNotificationStore.getState().addNotification({
            title: `Toast ${i}`,
            message: `Message ${i}`,
            type: 'info',
          });
        }
      });

      // Should only show 3 most recent
      const toasts = screen.getAllByTestId(/^toast-notif-/);
      expect(toasts.length).toBeLessThanOrEqual(3);
    });

    it('newest toasts appear at top of stack', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'First Toast',
          message: 'First',
          type: 'info',
        });
        useNotificationStore.getState().addNotification({
          title: 'Second Toast',
          message: 'Second',
          type: 'info',
        });
      });

      const toasts = screen.getAllByTestId(/^toast-notif-/);
      // Second toast should be first in the DOM (top of visual stack)
      expect(toasts[0]).toHaveTextContent('Second Toast');
    });
  });

  describe('Toast Dismissal', () => {
    it('removes toast when dismiss clicked', async () => {
      vi.useRealTimers();
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Dismissable Toast',
          message: 'Click to dismiss',
          type: 'info',
        });
      });

      expect(screen.getByText('Dismissable Toast')).toBeInTheDocument();

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await userEvent.click(dismissButton);

      expect(screen.queryByText('Dismissable Toast')).not.toBeInTheDocument();
    });

    it('auto-dismisses toast after duration', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification(
          {
            title: 'Auto Dismiss',
            message: 'Will disappear',
            type: 'info',
          },
          { duration: 3000 }
        );
      });

      expect(screen.getByText('Auto Dismiss')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByText('Auto Dismiss')).not.toBeInTheDocument();
    });
  });

  describe('Stacking Behavior', () => {
    it('stacks toasts with proper spacing', () => {
      render(<ToastContainer />);

      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Toast 1',
          message: 'Message',
          type: 'info',
        });
        useNotificationStore.getState().addNotification({
          title: 'Toast 2',
          message: 'Message',
          type: 'info',
        });
      });

      const container = screen.getByTestId('toast-container');
      // Should have gap/space-y styling for stacking
      expect(container).toHaveClass('space-y-2');
    });
  });

  describe('Accessibility', () => {
    it('container has aria-live region', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('container has role="region"', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveAttribute('role', 'region');
    });

    it('container has accessible label', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveAttribute('aria-label', 'Notifications');
    });
  });

  describe('Z-Index', () => {
    it('has high z-index to appear above other elements', () => {
      render(<ToastContainer />);

      const container = screen.getByTestId('toast-container');
      expect(container).toHaveClass('z-50');
    });
  });
});

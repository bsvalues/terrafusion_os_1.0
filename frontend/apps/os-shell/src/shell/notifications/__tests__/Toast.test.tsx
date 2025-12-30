/**
 * TerraFusion OS Toast Component Tests
 *
 * Tests for toast notification popups:
 * - Visual rendering by type
 * - Progress bar animation
 * - Auto-dismiss behavior
 * - Manual dismiss
 * - Accessibility
 *
 * @module shell/notifications/__tests__/Toast.test
 * @vitest-environment jsdom
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NotificationType } from '../../../stores/notificationStore';
import { Toast, type ToastProps } from '../Toast';

expect.extend(matchers);

// Mock toast data
const createToast = (overrides: Partial<ToastProps['toast']> = {}): ToastProps['toast'] => ({
  id: 'toast-1',
  title: 'Test Notification',
  message: 'This is a test message',
  type: 'info' as NotificationType,
  timestamp: new Date().toISOString(),
  read: false,
  duration: 5000,
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('Toast Component', () => {
  describe('Rendering', () => {
    it('renders toast with title', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    it('renders toast with message', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    it('renders toast container with testid', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      expect(screen.getByTestId('toast-toast-1')).toBeInTheDocument();
    });

    it('renders dismiss button', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe('Type Styling', () => {
    it('renders info toast with info styling', () => {
      render(<Toast toast={createToast({ type: 'info' })} onDismiss={() => {}} />);

      const toast = screen.getByTestId('toast-toast-1');
      expect(toast).toHaveAttribute('data-type', 'info');
    });

    it('renders success toast with success styling', () => {
      render(<Toast toast={createToast({ type: 'success' })} onDismiss={() => {}} />);

      const toast = screen.getByTestId('toast-toast-1');
      expect(toast).toHaveAttribute('data-type', 'success');
    });

    it('renders warning toast with warning styling', () => {
      render(<Toast toast={createToast({ type: 'warning' })} onDismiss={() => {}} />);

      const toast = screen.getByTestId('toast-toast-1');
      expect(toast).toHaveAttribute('data-type', 'warning');
    });

    it('renders error toast with error styling', () => {
      render(<Toast toast={createToast({ type: 'error' })} onDismiss={() => {}} />);

      const toast = screen.getByTestId('toast-toast-1');
      expect(toast).toHaveAttribute('data-type', 'error');
    });

    it('displays appropriate icon for each type', () => {
      const { rerender } = render(
        <Toast toast={createToast({ type: 'info' })} onDismiss={() => {}} />
      );
      expect(screen.getByTestId('toast-icon-info')).toBeInTheDocument();

      rerender(
        <Toast toast={createToast({ id: 'toast-2', type: 'success' })} onDismiss={() => {}} />
      );
      expect(screen.getByTestId('toast-icon-success')).toBeInTheDocument();

      rerender(
        <Toast toast={createToast({ id: 'toast-3', type: 'warning' })} onDismiss={() => {}} />
      );
      expect(screen.getByTestId('toast-icon-warning')).toBeInTheDocument();

      rerender(
        <Toast toast={createToast({ id: 'toast-4', type: 'error' })} onDismiss={() => {}} />
      );
      expect(screen.getByTestId('toast-icon-error')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar when duration > 0', () => {
      render(<Toast toast={createToast({ duration: 5000 })} onDismiss={() => {}} />);

      expect(screen.getByTestId('toast-progress')).toBeInTheDocument();
    });

    it('does not render progress bar when duration is 0', () => {
      render(<Toast toast={createToast({ duration: 0 })} onDismiss={() => {}} />);

      expect(screen.queryByTestId('toast-progress')).not.toBeInTheDocument();
    });

    it('progress bar has animation duration matching toast duration', () => {
      render(<Toast toast={createToast({ duration: 5000 })} onDismiss={() => {}} />);

      const progressBar = screen.getByTestId('toast-progress');
      expect(progressBar).toHaveStyle({ animationDuration: '5000ms' });
    });
  });

  describe('Auto-Dismiss', () => {
    it('calls onDismiss after duration expires', async () => {
      const onDismiss = vi.fn();
      render(<Toast toast={createToast({ duration: 5000 })} onDismiss={onDismiss} />);

      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    });

    it('does not auto-dismiss when duration is 0', () => {
      const onDismiss = vi.fn();
      render(<Toast toast={createToast({ duration: 0 })} onDismiss={onDismiss} />);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('clears timeout on unmount', () => {
      const onDismiss = vi.fn();
      const { unmount } = render(
        <Toast toast={createToast({ duration: 5000 })} onDismiss={onDismiss} />
      );

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Manual Dismiss', () => {
    it('calls onDismiss when dismiss button clicked', async () => {
      vi.useRealTimers(); // Use real timers for userEvent
      const onDismiss = vi.fn();
      render(<Toast toast={createToast()} onDismiss={onDismiss} />);

      await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    });
  });

  describe('Action Button', () => {
    it('renders action button when action provided', () => {
      const action = { label: 'View Details', onClick: vi.fn() };
      render(<Toast toast={createToast({ action })} onDismiss={() => {}} />);

      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    });

    it('calls action onClick when action button clicked', async () => {
      vi.useRealTimers();
      const onClick = vi.fn();
      const action = { label: 'View Details', onClick };
      render(<Toast toast={createToast({ action })} onDismiss={() => {}} />);

      await userEvent.click(screen.getByRole('button', { name: 'View Details' }));

      expect(onClick).toHaveBeenCalled();
    });

    it('does not render action button when no action', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      expect(screen.queryByRole('button', { name: 'View Details' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="alert" for important notifications', () => {
      render(<Toast toast={createToast({ type: 'error' })} onDismiss={() => {}} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has role="status" for info notifications', () => {
      render(<Toast toast={createToast({ type: 'info' })} onDismiss={() => {}} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('dismiss button has accessible name', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('has aria-live attribute for screen readers', () => {
      render(<Toast toast={createToast()} onDismiss={() => {}} />);

      const toast = screen.getByTestId('toast-toast-1');
      expect(toast).toHaveAttribute('aria-live');
    });
  });
});

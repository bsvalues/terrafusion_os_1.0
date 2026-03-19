/**
 * TerraFusion OS useErrorToast Hook Tests
 *
 * Tests for error toast integration hook:
 * - Report errors with toast notifications
 * - Report warnings with toast notifications
 * - Configurable behavior
 * - Silent mode (no toast)
 *
 * @module hooks/__tests__/useErrorToast.test
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useNotificationStore } from '../../stores/notificationStore';
import { errorTracker } from '../useErrorReporter';
import { useErrorToast } from '../useErrorToast';

// Suppress console output for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();

  // Clear stores
  errorTracker.clear();
  act(() => {
    useNotificationStore.getState().clearAll();
  });
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe('useErrorToast', () => {
  describe('reportError', () => {
    it('logs error to console', () => {
      const { result } = renderHook(() => useErrorToast('TestComponent'));

      act(() => {
        result.current.reportError(new Error('Test error'));
      });

      expect(console.error).toHaveBeenCalled();
    });

    it('shows toast notification for error', () => {
      const { result } = renderHook(() => useErrorToast('TestComponent'));

      act(() => {
        result.current.reportError(new Error('Something went wrong'));
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Error in TestComponent');
      expect(toasts[0].message).toBe('Something went wrong');
      expect(toasts[0].type).toBe('error');
    });

    it('tracks error count', () => {
      const { result } = renderHook(() => useErrorToast('ErrorCounter'));

      expect(result.current.errorCount).toBe(0);

      act(() => {
        result.current.reportError(new Error('Error 1'));
        result.current.reportError(new Error('Error 2'));
      });

      expect(result.current.errorCount).toBe(2);
    });

    it('includes component name in toast', () => {
      const { result } = renderHook(() => useErrorToast('MySpecialComponent'));

      act(() => {
        result.current.reportError(new Error('Failure'));
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts[0].title).toContain('MySpecialComponent');
    });
  });

  describe('reportWarning', () => {
    it('logs warning to console', () => {
      const { result } = renderHook(() => useErrorToast('WarnComponent'));

      act(() => {
        result.current.reportWarning('Something suspicious');
      });

      expect(console.warn).toHaveBeenCalled();
    });

    it('shows toast notification for warning', () => {
      const { result } = renderHook(() => useErrorToast('WarnComponent'));

      act(() => {
        result.current.reportWarning('Check this out');
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Warning in WarnComponent');
      expect(toasts[0].message).toBe('Check this out');
      expect(toasts[0].type).toBe('warning');
    });
  });

  describe('Options', () => {
    it('respects custom duration', () => {
      const { result } = renderHook(() => useErrorToast('DurationTest', { duration: 10000 }));

      act(() => {
        result.current.reportError(new Error('Test'));
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts[0].duration).toBe(10000);
    });

    it('respects custom error type', () => {
      const { result } = renderHook(() => useErrorToast('TypeTest', { errorType: 'warning' }));

      act(() => {
        result.current.reportError(new Error('Test'));
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts[0].type).toBe('warning');
    });

    it('respects custom warning type', () => {
      const { result } = renderHook(() => useErrorToast('WarnTypeTest', { warningType: 'info' }));

      act(() => {
        result.current.reportWarning('Test');
      });

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts[0].type).toBe('info');
    });

    it('can disable toast with showToast: false', () => {
      const { result } = renderHook(() => useErrorToast('SilentComponent', { showToast: false }));

      act(() => {
        result.current.reportError(new Error('Silent error'));
        result.current.reportWarning('Silent warning');
      });

      // Error and warning logged but no toast
      expect(console.error).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();

      const toasts = useNotificationStore.getState().toasts;
      expect(toasts.length).toBe(0);
    });
  });

  describe('hasRecentErrors', () => {
    it('returns false when no errors', () => {
      const { result } = renderHook(() => useErrorToast('NoErrors'));

      expect(result.current.hasRecentErrors).toBe(false);
    });

    it('returns true after error', () => {
      const { result } = renderHook(() => useErrorToast('HasErrors'));

      act(() => {
        result.current.reportError(new Error('Error'));
      });

      expect(result.current.hasRecentErrors).toBe(true);
    });
  });

  describe('clearErrors', () => {
    it('clears error count', () => {
      const { result } = renderHook(() => useErrorToast('ClearTest'));

      act(() => {
        result.current.reportError(new Error('Error 1'));
        result.current.reportError(new Error('Error 2'));
      });

      expect(result.current.errorCount).toBe(2);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errorCount).toBe(0);
      expect(result.current.hasRecentErrors).toBe(false);
    });
  });
});

describe('useErrorToast Integration with NotificationStore', () => {
  it('toast appears in notification history', () => {
    const { result } = renderHook(() => useErrorToast('HistoryTest'));

    act(() => {
      result.current.reportError(new Error('Stored error'));
    });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe('Stored error');
  });

  it('multiple components can report errors independently', () => {
    const { result: comp1 } = renderHook(() => useErrorToast('Component1'));
    const { result: comp2 } = renderHook(() => useErrorToast('Component2'));

    act(() => {
      comp1.current.reportError(new Error('Error in 1'));
      comp2.current.reportError(new Error('Error in 2'));
      comp2.current.reportError(new Error('Another error in 2'));
    });

    expect(comp1.current.errorCount).toBe(1);
    expect(comp2.current.errorCount).toBe(2);

    const toasts = useNotificationStore.getState().toasts;
    expect(toasts.length).toBe(3);
  });
});

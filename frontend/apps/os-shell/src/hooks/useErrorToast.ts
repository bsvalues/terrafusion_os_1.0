/**
 * TerraFusion OS Error Toast Hook
 *
 * Integrates useErrorReporter with useNotificationStore to show
 * toast notifications when errors are reported.
 *
 * @module hooks/useErrorToast
 * @see SUCCESS CRITERIA Phase 9: Integration
 */

import { useCallback } from 'react';
import { useNotificationStore, type NotificationType } from '../stores/notificationStore';
import { useErrorReporter, type ErrorContext } from './useErrorReporter';

// ============================================================================
// Types
// ============================================================================

export interface ErrorToastOptions {
  /** Show toast notification for errors (default: true) */
  showToast?: boolean;
  /** Toast duration in ms (default: 5000) */
  duration?: number;
  /** Toast type for errors (default: 'error') */
  errorType?: NotificationType;
  /** Toast type for warnings (default: 'warning') */
  warningType?: NotificationType;
}

export interface ErrorToastReporter {
  /** Report an error with optional context - shows toast */
  reportError: (error: Error, context?: ErrorContext) => void;
  /** Report a warning message - shows toast */
  reportWarning: (message: string, context?: ErrorContext) => void;
  /** Current error count for this component */
  errorCount: number;
  /** Whether this component has recent errors */
  hasRecentErrors: boolean;
  /** Clear error count for this component */
  clearErrors: () => void;
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<ErrorToastOptions> = {
  showToast: true,
  duration: 5000,
  errorType: 'error',
  warningType: 'warning',
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useErrorToast - Error reporting with toast notifications
 *
 * Combines useErrorReporter with notificationStore to show toast
 * notifications when errors or warnings are reported.
 *
 * Features:
 * - All useErrorReporter functionality
 * - Auto-shows toast on error
 * - Auto-shows toast on warning
 * - Configurable duration and types
 * - Can disable toast for silent logging
 *
 * @param componentName - Name of the component using this hook
 * @param options - Configuration options for toast behavior
 * @returns ErrorToastReporter interface
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { reportError } = useErrorToast('MyComponent');
 *
 *   const handleAction = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       // Logs error AND shows toast notification
 *       reportError(error, { action: 'riskyOperation' });
 *     }
 *   };
 * }
 * ```
 */
export function useErrorToast(
  componentName: string,
  options: ErrorToastOptions = {}
): ErrorToastReporter {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get base error reporter
  const baseReporter = useErrorReporter(componentName);

  // Get notification store actions
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Enhanced reportError that also shows toast
  const reportError = useCallback(
    (error: Error, context?: ErrorContext) => {
      // Call base reporter
      baseReporter.reportError(error, context);

      // Show toast if enabled
      if (opts.showToast) {
        addNotification(
          {
            title: `Error in ${componentName}`,
            message: error.message,
            type: opts.errorType,
          },
          { duration: opts.duration }
        );
      }
    },
    [baseReporter, componentName, addNotification, opts.showToast, opts.duration, opts.errorType]
  );

  // Enhanced reportWarning that also shows toast
  const reportWarning = useCallback(
    (message: string, context?: ErrorContext) => {
      // Call base reporter
      baseReporter.reportWarning(message, context);

      // Show toast if enabled
      if (opts.showToast) {
        addNotification(
          {
            title: `Warning in ${componentName}`,
            message,
            type: opts.warningType,
          },
          { duration: opts.duration }
        );
      }
    },
    [baseReporter, componentName, addNotification, opts.showToast, opts.duration, opts.warningType]
  );

  return {
    reportError,
    reportWarning,
    errorCount: baseReporter.errorCount,
    hasRecentErrors: baseReporter.hasRecentErrors,
    clearErrors: baseReporter.clearErrors,
  };
}

export default useErrorToast;

/**
 * TerraFusion OS Error Reporter Hook
 * 
 * Hook for components to report and track errors.
 * Provides centralized error logging with component context.
 * 
 * @module hooks/useErrorReporter
 * @see SUCCESS CRITERIA Phase 8: Error Boundaries
 */

import { useCallback, useSyncExternalStore } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ErrorContext {
  [key: string]: unknown;
}

export interface ErrorReporter {
  /** Report an error with optional context */
  reportError: (error: Error, context?: ErrorContext) => void;
  /** Report a warning message */
  reportWarning: (message: string, context?: ErrorContext) => void;
  /** Current error count for this component */
  errorCount: number;
  /** Whether this component has recent errors */
  hasRecentErrors: boolean;
  /** Clear error count for this component */
  clearErrors: () => void;
}

// ============================================================================
// Error Tracker (Singleton)
// ============================================================================

type Listener = () => void;

class ErrorTrackerClass {
  private counts: Map<string, number> = new Map();
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  increment(componentName: string): void {
    const current = this.counts.get(componentName) || 0;
    this.counts.set(componentName, current + 1);
    this.notify();
  }

  getCount(componentName: string): number {
    return this.counts.get(componentName) || 0;
  }

  clearComponent(componentName: string): void {
    this.counts.set(componentName, 0);
    this.notify();
  }

  clear(): void {
    this.counts.clear();
    this.notify();
  }

  getAllCounts(): Record<string, number> {
    const result: Record<string, number> = {};
    this.counts.forEach((count, name) => {
      result[name] = count;
    });
    return result;
  }

  getSnapshot(): Map<string, number> {
    return new Map(this.counts);
  }
}

// Export singleton for testing and direct access
export const errorTracker = new ErrorTrackerClass();

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useErrorReporter - Hook for reporting and tracking errors
 * 
 * Features:
 * - Logs errors with component context
 * - Tracks error frequency per component
 * - Provides warning reporting
 * - Supports additional context metadata
 * 
 * @param componentName - Name of the component using this hook
 * @returns ErrorReporter interface
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { reportError, reportWarning, errorCount } = useErrorReporter('MyComponent');
 *   
 *   const handleAction = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       reportError(error, { action: 'riskyOperation' });
 *     }
 *   };
 *   
 *   return <div>Errors: {errorCount}</div>;
 * }
 * ```
 */
export function useErrorReporter(componentName: string): ErrorReporter {
  // Subscribe to error tracker changes
  const errorCount = useSyncExternalStore(
    (listener) => errorTracker.subscribe(listener),
    () => errorTracker.getCount(componentName),
    () => errorTracker.getCount(componentName)
  );

  const reportError = useCallback(
    (error: Error, context?: ErrorContext) => {
      // Increment error count
      errorTracker.increment(componentName);

      // Log to console with context
      if (context) {
        console.error(
          `[${componentName}] Error:`,
          error,
          context
        );
      } else {
        console.error(
          `[${componentName}] Error:`,
          error
        );
      }

      // Future: Send to error reporting service
      // errorReportingService.capture({
      //   error,
      //   componentName,
      //   context,
      //   timestamp: new Date().toISOString(),
      // });
    },
    [componentName]
  );

  const reportWarning = useCallback(
    (message: string, context?: ErrorContext) => {
      if (context) {
        console.warn(`[${componentName}] Warning:`, message, context);
      } else {
        console.warn(`[${componentName}] Warning:`, message);
      }
    },
    [componentName]
  );

  const clearErrors = useCallback(() => {
    errorTracker.clearComponent(componentName);
  }, [componentName]);

  return {
    reportError,
    reportWarning,
    errorCount,
    hasRecentErrors: errorCount > 0,
    clearErrors,
  };
}

export default useErrorReporter;

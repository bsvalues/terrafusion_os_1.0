/**
 * TerraFusion OS Module Error Boundary
 *
 * Catches errors in module components and provides recovery UI.
 * Integrates with ATLAS telemetry for error tracking.
 *
 * @module components/modules/ModuleErrorBoundary
 * @see Phase 2: Infrastructure Layer
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { analytics } from '../../utils/analytics';
import { isDev } from '../../utils/env';

// ============================================================================
// Types
// ============================================================================

export interface ModuleErrorBoundaryProps {
  moduleId: string;
  moduleName?: string;
  children: ReactNode;
  onRetry?: () => void;
  onClose?: () => void;
  fallback?: ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

// ============================================================================
// Error UI Components
// ============================================================================

interface ErrorDisplayProps {
  moduleId: string;
  moduleName: string;
  error: Error | null;
  retryCount: number;
  onRetry: () => void;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  moduleId,
  moduleName,
  error,
  retryCount,
  onRetry,
  onClose,
}) => {
  const showRetryLimit = retryCount >= 3;

  return (
    <div
      data-testid='module-error-boundary'
      role='alert'
      aria-live='assertive'
      className='w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8'
    >
      {/* Error Icon */}
      <div className='w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center mb-6'>
        <svg
          className='w-10 h-10 text-red-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className='text-xl font-semibold text-slate-100 mb-2'>
        {moduleName} Encountered an Error
      </h3>

      {/* Error Message */}
      <p className='text-slate-400 text-center max-w-md mb-2'>
        Something went wrong while running this module.
      </p>

      {/* Technical Details (collapsible) - Stack traces only in dev mode */}
      {error && (
        <details className='mb-6 max-w-md'>
          <summary className='text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors'>
            Technical Details
          </summary>
          <div className='mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700'>
            <code className='text-xs text-red-300 break-all'>
              {/* In prod: show generic message. In dev: show actual error */}
              {isDev()
                ? error.message || 'Unknown error'
                : 'An error occurred while loading this module.'}
            </code>
            <div className='mt-2 text-xs text-slate-500'>
              Module: <span className='text-cyan-400'>{moduleId}</span>
            </div>
            {retryCount > 0 && (
              <div className='mt-1 text-xs text-slate-500'>
                Retry attempts: <span className='text-amber-400'>{retryCount}</span>
              </div>
            )}
            {/* Stack trace only in development - never expose file paths in prod */}
            {isDev() && error.stack && (
              <pre className='mt-2 text-xs text-slate-500 whitespace-pre-wrap overflow-auto max-h-32'>
                {error.stack}
              </pre>
            )}
          </div>
        </details>
      )}

      {/* Retry Limit Warning */}
      {showRetryLimit && (
        <div className='mb-4 px-4 py-2 bg-amber-900/30 border border-amber-500/30 rounded-lg'>
          <p className='text-sm text-amber-300'>
            Multiple retry attempts failed. The module may need attention.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex items-center gap-4'>
        <button
          onClick={onRetry}
          className='
            px-6 py-2.5 rounded-lg
            bg-cyan-500 hover:bg-cyan-400
            text-slate-900 font-semibold text-sm
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
          '
        >
          <span className='flex items-center gap-2'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Retry
          </span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className='
              px-6 py-2.5 rounded-lg
              bg-slate-700 hover:bg-slate-600
              text-slate-200 font-medium text-sm
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900
            '
          >
            Close Module
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ModuleErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { moduleId, moduleName } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Track error to ATLAS - sanitized for prod (no raw stacks or sensitive paths)
    analytics.trackEvent({
      name: 'module.render_error',
      properties: {
        moduleId,
        moduleName: moduleName || moduleId,
        // Truncate error message to avoid leaking sensitive data
        errorMessage: error.message?.slice(0, 100) || 'Unknown error',
        // Only include error signature (first line, no file paths)
        errorSignature: error.name || 'Error',
        retryCount: this.state.retryCount,
        timestamp: Date.now(),
        // Component stack only in dev (can reveal internal structure)
        ...(isDev() && { componentStack: errorInfo.componentStack?.slice(0, 500) }),
      },
    });

    // Log for debugging
    console.error(`[ModuleErrorBoundary] Error in module "${moduleId}":`, error, errorInfo);
  }

  handleRetry = (): void => {
    const { moduleId, onRetry } = this.props;
    const newRetryCount = this.state.retryCount + 1;

    // Track retry attempt
    analytics.trackEvent({
      name: 'module.error_retry',
      properties: {
        moduleId,
        retryCount: newRetryCount,
        timestamp: Date.now(),
      },
    });

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount,
    });

    // Call external retry handler if provided
    onRetry?.();
  };

  handleClose = (): void => {
    const { moduleId, onClose } = this.props;

    // Track close action
    analytics.trackEvent({
      name: 'module.error_close',
      properties: {
        moduleId,
        retryCount: this.state.retryCount,
        timestamp: Date.now(),
      },
    });

    onClose?.();
  };

  render(): ReactNode {
    const { moduleId, moduleName, children, fallback, onClose } = this.props;
    const { hasError, error, retryCount } = this.state;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <ErrorDisplay
          moduleId={moduleId}
          moduleName={moduleName || moduleId}
          error={error}
          retryCount={retryCount}
          onRetry={this.handleRetry}
          onClose={onClose}
        />
      );
    }

    return children;
  }
}

export default ModuleErrorBoundary;

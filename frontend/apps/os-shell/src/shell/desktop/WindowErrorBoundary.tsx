/**
 * TerraFusion OS Window Error Boundary
 * 
 * Error boundary that wraps window content to isolate errors.
 * When a child component throws, shows friendly error UI with recovery options.
 * 
 * @module shell/desktop/WindowErrorBoundary
 * @see SUCCESS CRITERIA Phase 8: Error Boundaries
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface WindowErrorBoundaryProps {
  /** Unique window identifier */
  windowId: string;
  /** Display name of the module */
  moduleName: string;
  /** Child components to render */
  children: ReactNode;
  /** Callback when reload is requested */
  onReload?: (windowId: string) => void;
  /** Callback when close is requested */
  onClose?: (windowId: string) => void;
  /** Optional CSS class */
  className?: string;
}

interface WindowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Fallback Component
// ============================================================================

interface ErrorFallbackProps {
  windowId: string;
  moduleName: string;
  error: Error | null;
  onReload?: (windowId: string) => void;
  onClose?: (windowId: string) => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  windowId,
  moduleName,
  error,
  onReload,
  onClose,
}) => {
  return (
    <div
      data-testid="window-error-fallback"
      role="alert"
      className={cn(
        'w-full h-full flex flex-col items-center justify-center',
        'bg-gradient-to-b from-[#1a0a0a] to-[#0a0e1a]',
        'p-6 text-center'
      )}
    >
      {/* Error Icon */}
      <div className={cn(
        'w-16 h-16 rounded-full mb-4',
        'bg-red-500/20 border border-red-500/30',
        'flex items-center justify-center'
      )}>
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Error Title */}
      <h3 className="text-lg font-semibold text-white mb-2">
        Something went wrong
      </h3>

      {/* Module Name */}
      <p className="text-[#00ffee] font-medium mb-2">
        {moduleName}
      </p>

      {/* Error Message */}
      <p className="text-red-400 text-sm mb-6 max-w-md">
        {error?.message || 'An unexpected error occurred'}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onReload?.(windowId)}
          aria-label="Reload module"
          className={cn(
            'px-4 py-2 rounded-md',
            'bg-[#00ffee]/20 text-[#00ffee] border border-[#00ffee]/30',
            'hover:bg-[#00ffee]/30 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee]'
          )}
        >
          🔄 Reload Module
        </button>

        <button
          onClick={() => onClose?.(windowId)}
          aria-label="Close window"
          className={cn(
            'px-4 py-2 rounded-md',
            'bg-white/10 text-white/70 border border-white/20',
            'hover:bg-white/20 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
          )}
        >
          ✕ Close Window
        </button>
      </div>

      {/* Technical Details (collapsible) */}
      <details className="mt-6 w-full max-w-md text-left">
        <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">
          Technical Details
        </summary>
        <pre className={cn(
          'mt-2 p-3 rounded bg-black/50 border border-white/10',
          'text-xs text-white/50 overflow-auto max-h-32'
        )}>
          {error?.stack || 'No stack trace available'}
        </pre>
      </details>
    </div>
  );
};

// ============================================================================
// Error Boundary Class Component
// ============================================================================

/**
 * WindowErrorBoundary - Isolates errors within individual windows
 * 
 * Features:
 * - Catches JavaScript errors in child component tree
 * - Shows friendly error UI with module name
 * - Reload and Close recovery options
 * - Logs errors for debugging
 * - Does not affect sibling windows
 * 
 * @example
 * ```tsx
 * <WindowErrorBoundary 
 *   windowId={window.id}
 *   moduleName={window.title}
 *   onReload={handleReload}
 *   onClose={handleClose}
 * >
 *   <ModuleLoader moduleId={window.moduleId} />
 * </WindowErrorBoundary>
 * ```
 */
export class WindowErrorBoundary extends Component<
  WindowErrorBoundaryProps,
  WindowErrorBoundaryState
> {
  constructor(props: WindowErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WindowErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    console.error(
      `[WindowErrorBoundary] Error in window "${this.props.windowId}" (${this.props.moduleName}):`,
      error,
      errorInfo
    );

    // Store error info for display
    this.setState({ errorInfo });

    // Could send to error reporting service here
    // errorReporter.captureError(error, {
    //   windowId: this.props.windowId,
    //   moduleName: this.props.moduleName,
    //   componentStack: errorInfo.componentStack,
    // });
  }

  handleReload = (): void => {
    const { windowId, onReload } = this.props;
    
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call reload callback
    onReload?.(windowId);
  };

  handleClose = (): void => {
    const { windowId, onClose } = this.props;
    onClose?.(windowId);
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { windowId, moduleName, children, className } = this.props;

    if (hasError) {
      return (
        <ErrorFallback
          windowId={windowId}
          moduleName={moduleName}
          error={error}
          onReload={this.handleReload}
          onClose={this.handleClose}
        />
      );
    }

    return (
      <div className={className}>
        {children}
      </div>
    );
  }
}

export default WindowErrorBoundary;

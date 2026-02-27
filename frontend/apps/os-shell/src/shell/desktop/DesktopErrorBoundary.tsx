/**
 * TerraFusion OS Desktop Error Boundary
 * 
 * Top-level error boundary that catches catastrophic errors.
 * Shows full-screen recovery UI with restart options.
 * 
 * @module shell/desktop/DesktopErrorBoundary
 * @see SUCCESS CRITERIA Phase 8: Error Boundaries
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DesktopErrorBoundaryProps {
  children: ReactNode;
}

interface DesktopErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  correlationId: string | null;
}

// ============================================================================
// Error Fallback Component
// ============================================================================

interface DesktopErrorFallbackProps {
  error: Error | null;
  correlationId: string | null;
  onRestart: () => void;
  onClearAndRestart: () => void;
}

const DesktopErrorFallback: React.FC<DesktopErrorFallbackProps> = ({
  error,
  correlationId,
  onRestart,
  onClearAndRestart,
}) => {
  return (
    <div
      data-testid="desktop-error-fallback"
      role="alert"
      className={cn(
        'w-screen h-screen',
        'flex flex-col items-center justify-center',
        'bg-gradient-to-b from-[var(--tf-void-black)] via-[var(--tf-surface-darker)] to-[var(--tf-void-black)]',
        'p-8 text-center'
      )}
    >
      {/* TerraFusion Logo */}
      <div className={cn(
        'w-20 h-20 rounded-2xl mb-6',
        'bg-gradient-to-br from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)]',
        'flex items-center justify-center',
        'shadow-[0_0_40px_rgba(0,255,238,0.3)]'
      )}>
        <span className="text-3xl font-bold text-[var(--tf-void-black)]">TF</span>
      </div>

      {/* Error Title */}
      <h1 className="text-2xl font-bold text-white mb-2">
        TerraFusion OS
      </h1>
      
      <h2 className="text-lg text-red-400 mb-4">
        System has encountered an error
      </h2>

      {/* Error Message */}
      <p className="text-white/60 mb-8 max-w-md">
        We apologize for the inconvenience. The desktop environment has stopped unexpectedly.
        Your work may not have been saved.
      </p>

      {/* Recovery Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <button
          onClick={onRestart}
          aria-label="Restart TerraFusion OS"
          className={cn(
            'px-6 py-3 rounded-lg font-medium',
            'bg-[var(--tf-transcend-highlight)] text-[var(--tf-void-black)]',
            'hover:bg-[var(--tf-accent-teal)] transition-colors',
            'shadow-[0_0_20px_rgba(0,255,238,0.3)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tf-void-black)]'
          )}
        >
          🔄 Restart TerraFusion
        </button>

        <button
          onClick={onClearAndRestart}
          aria-label="Clear data and restart"
          className={cn(
            'px-6 py-3 rounded-lg font-medium',
            'bg-white/10 text-white border border-white/20',
            'hover:bg-white/20 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
          )}
        >
          🗑️ Clear Data & Restart
        </button>
      </div>

      {/* Help Text */}
      <p className="text-white/40 text-sm mb-6">
        If the problem persists, try clearing data or contact support.
      </p>

      {/* Technical Details */}
      <details className="w-full max-w-lg text-left">
        <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">
          Technical Details
        </summary>
        <div className={cn(
          'mt-3 p-4 rounded-lg',
          'bg-black/50 border border-white/10'
        )}>
          {correlationId && (
            <p className="text-[var(--tf-transcend-highlight)] text-xs font-mono mb-2">
              Correlation ID: {correlationId}
            </p>
          )}
          <p className="text-red-400 text-sm font-mono mb-2">
            {error?.message || 'Unknown error'}
          </p>
          <pre className="text-xs text-white/30 overflow-auto max-h-40 whitespace-pre-wrap">
            {error?.stack || 'No stack trace available'}
          </pre>
        </div>
      </details>

      {/* Footer */}
      <div className="absolute bottom-4 text-white/30 text-xs">
        TerraFusion OS • Government Operating System
      </div>
    </div>
  );
};

// ============================================================================
// Error Boundary Class Component
// ============================================================================

/**
 * DesktopErrorBoundary - Catches catastrophic errors at the application level
 * 
 * Features:
 * - Full-screen error recovery UI
 * - Restart application option
 * - Clear data and restart option
 * - Error details for debugging
 * - Branded error experience
 * 
 * @example
 * ```tsx
 * // In app root
 * <DesktopErrorBoundary>
 *   <Desktop />
 * </DesktopErrorBoundary>
 * ```
 */
export class DesktopErrorBoundary extends Component<
  DesktopErrorBoundaryProps,
  DesktopErrorBoundaryState
> {
  constructor(props: DesktopErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DesktopErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const correlationId = `ebnd-${crypto.randomUUID()}`;

    // Log the catastrophic error with correlationId for trace-chain
    console.error(
      `[DesktopErrorBoundary] CRITICAL (${correlationId}):`,
      error,
      errorInfo
    );

    this.setState({ errorInfo, correlationId });

    // Could send to error reporting service
    // errorReporter.captureCriticalError(error, {
    //   componentStack: errorInfo.componentStack,
    //   timestamp: new Date().toISOString(),
    // });
  }

  handleRestart = (): void => {
    // Simple page reload
    window.location.reload();
  };

  handleClearAndRestart = (): void => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      
      // Clear sessionStorage too
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    
    // Reload the page
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, correlationId } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <DesktopErrorFallback
          error={error}
          correlationId={correlationId}
          onRestart={this.handleRestart}
          onClearAndRestart={this.handleClearAndRestart}
        />
      );
    }

    return children;
  }
}

export default DesktopErrorBoundary;

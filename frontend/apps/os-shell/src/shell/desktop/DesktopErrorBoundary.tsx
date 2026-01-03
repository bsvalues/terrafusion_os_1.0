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
}

// ============================================================================
// Error Fallback Component
// ============================================================================

interface DesktopErrorFallbackProps {
  error: Error | null;
  onRestart: () => void;
  onClearAndRestart: () => void;
}

const DesktopErrorFallback: React.FC<DesktopErrorFallbackProps> = ({
  error,
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
        'bg-gradient-to-b from-[#0a0e1a] via-[#1a0a1a] to-[#0a0e1a]',
        'p-8 text-center'
      )}
    >
      {/* TerraFusion Logo */}
      <div className={cn(
        'w-20 h-20 rounded-2xl mb-6',
        'bg-gradient-to-br from-[#0099ff] to-[#00ffee]',
        'flex items-center justify-center',
        'shadow-[0_0_40px_rgba(0,255,238,0.3)]'
      )}>
        <span className="text-3xl font-bold text-[#0a0e1a]">TF</span>
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
            'bg-[#00ffee] text-[#0a0e1a]',
            'hover:bg-[#00ddcc] transition-colors',
            'shadow-[0_0_20px_rgba(0,255,238,0.3)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]'
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
        TerraFusion OS • Government-Grade Assessment Platform
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
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DesktopErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the catastrophic error
    console.error(
      '[DesktopErrorBoundary] CRITICAL: Unrecoverable error in TerraFusion OS:',
      error,
      errorInfo
    );

    this.setState({ errorInfo });

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
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <DesktopErrorFallback
          error={error}
          onRestart={this.handleRestart}
          onClearAndRestart={this.handleClearAndRestart}
        />
      );
    }

    return children;
  }
}

export default DesktopErrorBoundary;

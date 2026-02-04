/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ERROR BOUNDARY
 * Phase 1 Day 2: React Error Capture with correlationId
 *
 * Catches unhandled React errors and surfaces correlationId
 * for trace chain debugging. Uses ErrorDisplay contract.
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { Component, ErrorInfo as ReactErrorInfo, ReactNode } from 'react';
import { ErrorInfo } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches React render errors
 *
 * Phase 1 Contract:
 * - Generates correlationId for all caught errors
 * - Uses ErrorDisplay component for consistent UX
 * - Provides reset capability
 * - Reports to monitoring service
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo): void {
    const correlationId = this.generateCorrelationId();

    const tfErrorInfo: ErrorInfo = {
      message: error.message || 'An unexpected error occurred',
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: `boundary-${Date.now()}`,
      correlationId,
      context: {
        errorCode: 'REACT_RENDER_ERROR',
        component: 'ErrorBoundary',
        severity: 'high',
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    this.setState({ errorInfo: tfErrorInfo });

    // Report to monitoring
    this.reportError(tfErrorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(tfErrorInfo);
    }

    // Log to console (dev mode)
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ErrorBoundary caught error:', tfErrorInfo);
      console.error('Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
    }
  }

  /**
   * Generate correlationId for error tracking
   * Format: ebnd-<timestamp>-<random>
   */
  private generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `ebnd-${timestamp}-${random}`;
  }

  /**
   * Report error to monitoring service
   */
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    try {
      await fetch('/api/errors/boundary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorInfo,
          sessionId: sessionStorage.getItem('sessionId') || 'unknown',
        }),
      });
    } catch (reportingError) {
      console.warn('Failed to report error to monitoring:', reportingError);
    }
  }

  /**
   * Reset error boundary state
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.errorInfo) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.errorInfo, this.handleReset);
      }

      // Default fallback: ErrorDisplay with reset button
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <div className='max-w-2xl w-full'>
            <ErrorDisplay
              error={{
                message: this.state.errorInfo.message,
                errorCode: this.state.errorInfo.context?.errorCode as string,
                correlationId: this.state.errorInfo.correlationId,
                timestamp: this.state.errorInfo.timestamp,
                component: this.state.errorInfo.context?.component as string,
              }}
            />

            <div className='mt-6 flex justify-center'>
              <button
                onClick={this.handleReset}
                className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
              >
                🔄 Reset Application
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo.stack && (
              <details className='mt-6 p-4 bg-gray-900 text-gray-100 rounded-md text-xs'>
                <summary className='cursor-pointer text-yellow-400 mb-2'>
                  🔧 Stack Trace (Dev Only)
                </summary>
                <pre className='overflow-x-auto whitespace-pre-wrap'>
                  {this.state.errorInfo.stack}
                </pre>
                {this.state.errorInfo.componentStack && (
                  <>
                    <div className='mt-4 text-yellow-400'>Component Stack:</div>
                    <pre className='overflow-x-auto whitespace-pre-wrap'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

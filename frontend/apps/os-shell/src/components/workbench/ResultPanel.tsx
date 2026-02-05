/**
 * ResultPanel.tsx
 *
 * Phase 6.1: Shared component for displaying tool invocation results
 *
 * Used by: All MWUX tab components
 * Contract:
 * - Idle state: placeholder content
 * - Loading state: spinner + message
 * - Success state: correlationId header + children content
 * - Error state: ErrorDisplay + dismiss button
 * - Dev info panel in development mode
 */

import React, { useCallback } from 'react';
import type { ErrorInfo } from '../../hooks/useErrorHandler';
import { getEnv } from '../../runtime/env';
import { ErrorDisplay } from '../errors/ErrorDisplay';

export interface IdleContent {
  icon: string;
  title: string;
  subtitle?: string;
}

export interface SuccessHeader {
  icon: string;
  title: string;
}

export type ResultStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ResultPanelProps {
  status: ResultStatus;
  correlationId?: string;
  error?: ErrorInfo;
  loadingMessage?: string;
  idleContent?: IdleContent;
  successHeader?: SuccessHeader;
  onDismiss?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  status,
  correlationId,
  error,
  loadingMessage = 'Loading...',
  idleContent,
  successHeader,
  onDismiss,
  children,
  className = '',
}) => {
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const isDev = getEnv('MODE') === 'development';

  // Loading State
  if (status === 'loading') {
    return (
      <div
        role='status'
        className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}
      >
        <div className='animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-blue-500' />
        <span className='text-white/60'>{loadingMessage}</span>
      </div>
    );
  }

  // Idle State
  if (status === 'idle') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
        {idleContent ? (
          <>
            <div className='text-4xl mb-2'>{idleContent.icon}</div>
            <p className='text-white/60'>{idleContent.title}</p>
            {idleContent.subtitle && (
              <p className='text-white/40 text-sm mt-1'>{idleContent.subtitle}</p>
            )}
          </>
        ) : (
          <p className='text-white/60'>Ready to run</p>
        )}
      </div>
    );
  }

  // Error State
  if (status === 'error' && error) {
    return (
      <div className={`bg-red-500/20 rounded-xl p-5 border border-red-500/30 ${className}`}>
        {onDismiss && (
          <div className='flex justify-end mb-2'>
            <button
              onClick={onDismiss}
              className='px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20'
              aria-label='Dismiss error'
            >
              Dismiss
            </button>
          </div>
        )}
        <ErrorDisplay error={error} />
      </div>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Header with correlationId */}
        <div className='flex items-center justify-between mb-3'>
          {successHeader ? (
            <h4 className='text-emerald-400 font-semibold flex items-center gap-2'>
              <span>{successHeader.icon}</span> {successHeader.title}
            </h4>
          ) : (
            <h4 className='text-emerald-400 font-semibold flex items-center gap-2'>
              <span>✅</span> Success
            </h4>
          )}

          {correlationId && (
            <div className='flex items-center gap-2 text-xs'>
              <span className='text-white/50'>ID:</span>
              <code className='text-emerald-400 font-mono'>{correlationId.slice(0, 16)}...</code>
              <button
                onClick={() => copyToClipboard(correlationId)}
                className='text-white/60 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20'
                aria-label='Copy correlation ID'
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Dev Info */}
        {isDev && correlationId && (
          <div className='text-xs text-white/40 border-t border-white/10 pt-3'>
            <details>
              <summary className='cursor-pointer hover:text-white/60'>Developer Info</summary>
              <pre className='mt-2 bg-black/30 rounded p-2 overflow-x-auto'>
                pnpm run trace:query --correlation {correlationId}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return null;
};

export default ResultPanel;

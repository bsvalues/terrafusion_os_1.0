/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ERROR DISPLAY COMPONENT
 * Phase 1: correlationId-First Error UX
 *
 * Implements UI_CONTRACT.md v1.0:
 * - Displays user-safe error messages
 * - Surfaces correlationId with copy button
 * - Shows trace query hint (dev-only)
 * - Provides observability-first debugging experience
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';

export interface ErrorDisplayProps {
  error: {
    message: string;
    errorCode?: string;
    correlationId?: string;
    timestamp?: string;
    component?: string;
    details?: unknown;
  };
}

/**
 * ErrorDisplay Component
 *
 * Core contract:
 * - correlationId visible when present
 * - Copy button for correlationId
 * - Dev-mode trace query hint
 * - User-safe error messages
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!error.correlationId) return;

    try {
      await navigator.clipboard.writeText(error.correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy correlationId:', err);
    }
  };

  const getSeverityClass = (errorCode?: string): string => {
    if (!errorCode) return 'border-yellow-200 bg-yellow-50';

    // Critical errors
    if (errorCode === 'EXECUTION_FAILED' || errorCode === 'HANDLER_ERROR') {
      return 'border-red-300 bg-red-50';
    }

    // Validation/policy errors (warnings)
    if (
      errorCode === 'CONFIRMATION_REQUIRED' ||
      errorCode === 'REASON_CODE_REQUIRED' ||
      errorCode === 'SUPERVISOR_APPROVAL_REQUIRED'
    ) {
      return 'border-yellow-300 bg-yellow-50';
    }

    // Default warning
    return 'border-yellow-200 bg-yellow-50';
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return '';

    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div role='alert' className={`rounded-lg border-2 p-4 ${getSeverityClass(error.errorCode)}`}>
      {/* Header */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center'>
          <svg
            className='w-5 h-5 text-red-600 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
          <h3 className='text-lg font-semibold text-gray-900'>⚠️ Operation Failed</h3>
        </div>
        {error.component && (
          <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
            {error.component}
          </span>
        )}
      </div>

      {/* Error Message */}
      <p className='text-gray-800 mb-3'>{error.message}</p>

      {/* Correlation ID Block */}
      {error.correlationId && (
        <div className='mt-4 p-3 bg-white border border-gray-200 rounded-md'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-xs text-gray-600 mb-1'>Correlation ID:</p>
              <code className='text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded'>
                {error.correlationId}
              </code>
            </div>
            <button
              onClick={handleCopy}
              aria-label='Copy Correlation ID'
              className='ml-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>

          {/* Dev Mode: Trace Query Hint */}
          {process.env.NODE_ENV === 'development' && (
            <details className='mt-3'>
              <summary className='text-xs text-gray-600 cursor-pointer hover:text-gray-800'>
                💻 Developer Info
              </summary>
              <div className='mt-2 p-2 bg-gray-900 rounded text-gray-100 text-xs'>
                <p className='text-gray-400 mb-1'>Debug this error:</p>
                <pre className='overflow-x-auto'>
                  <code>pnpm run trace:query --correlation {error.correlationId}</code>
                </pre>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Error Code Badge */}
      {error.errorCode && (
        <div className='mt-3 inline-block'>
          <span className='text-xs bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono'>
            {error.errorCode}
          </span>
        </div>
      )}

      {/* Timestamp */}
      {error.timestamp && (
        <p className='text-xs text-gray-500 mt-3'>{formatTimestamp(error.timestamp)}</p>
      )}
    </div>
  );
};

/**
 * CorrelationIdBadge - Reusable Widget
 *
 * Standalone component for displaying correlationId in other contexts
 */
export const CorrelationIdBadge: React.FC<{ correlationId: string }> = ({ correlationId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className='inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md'>
      <code className='text-sm font-mono'>{correlationId}</code>
      <button
        onClick={handleCopy}
        aria-label='Copy Correlation ID'
        className='text-blue-600 hover:text-blue-800'
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
};

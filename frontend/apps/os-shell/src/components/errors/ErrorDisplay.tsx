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

  const getSeverityStyle = (errorCode?: string): React.CSSProperties => {
    if (errorCode === 'EXECUTION_FAILED' || errorCode === 'HANDLER_ERROR') {
      return {
        background: 'hsl(var(--tf-error) / 0.12)',
        border: '2px solid hsl(var(--tf-error) / 0.4)',
        borderRadius: '0.5rem',
        padding: '1rem',
      };
    }
    if (
      errorCode === 'CONFIRMATION_REQUIRED' ||
      errorCode === 'REASON_CODE_REQUIRED' ||
      errorCode === 'SUPERVISOR_APPROVAL_REQUIRED'
    ) {
      return {
        background: 'hsl(var(--tf-warning) / 0.12)',
        border: '2px solid hsl(var(--tf-warning) / 0.4)',
        borderRadius: '0.5rem',
        padding: '1rem',
      };
    }
    return {
      background: 'hsl(var(--tf-warning) / 0.08)',
      border: '2px solid hsl(var(--tf-warning) / 0.25)',
      borderRadius: '0.5rem',
      padding: '1rem',
    };
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
    <div role='alert' style={getSeverityStyle(error.errorCode)}>
      {/* Header */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center'>
          <svg
            className='w-5 h-5 mr-2' style={{ color: 'hsl(var(--tf-error))' }}
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
          <h3 className='text-lg font-semibold' style={{ color: 'var(--tf-text-primary)' }}>⚠️ Operation Failed</h3>
        </div>
        {error.component && (
          <span className='text-xs px-2 py-1 rounded' style={{ background: 'hsl(var(--tf-accent) / 0.1)', color: 'hsl(var(--tf-accent))' }}>
            {error.component}
          </span>
        )}
      </div>

      {/* Error Message */}
      <p className='mb-3' style={{ color: 'var(--tf-text-primary)' }}>{error.message}</p>

      {/* Correlation ID Block */}
      {error.correlationId && (
        <div className='mt-4 p-3 rounded-md' style={{ background: 'hsl(var(--tf-accent) / 0.05)', border: '1px solid hsl(var(--tf-accent) / 0.15)' }}>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-xs mb-1' style={{ color: 'var(--tf-text-secondary)' }}>Correlation ID:</p>
              <code className='text-sm font-mono px-2 py-1 rounded' style={{ color: 'var(--tf-text-primary)', background: 'hsl(var(--tf-accent) / 0.08)' }}>
                {error.correlationId}
              </code>
            </div>
            <button
              onClick={handleCopy}
              aria-label='Copy Correlation ID'
              className='ml-3 px-3 py-1 text-sm rounded transition-colors' style={{ background: 'hsl(var(--tf-accent) / 0.2)', color: 'hsl(var(--tf-accent))', border: '1px solid hsl(var(--tf-accent) / 0.4)' }}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>

          {/* Dev Mode: Trace Query Hint */}
          {process.env.NODE_ENV === 'development' && (
            <details className='mt-3'>
              <summary className='text-xs cursor-pointer' style={{ color: 'var(--tf-text-secondary)' }}>
                💻 Developer Info
              </summary>
              <div className='mt-2 p-2 rounded text-xs' style={{ background: 'var(--tf-surface-dark)', color: 'var(--tf-text-primary)' }}>
                <p className='mb-1' style={{ color: 'var(--tf-text-secondary)' }}>Debug this error:</p>
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
          <span className='text-xs px-2 py-1 rounded font-mono' style={{ background: 'hsl(var(--tf-error) / 0.15)', color: 'hsl(var(--tf-error))' }}>
            {error.errorCode}
          </span>
        </div>
      )}

      {/* Timestamp */}
      {error.timestamp && (
        <p className='text-xs mt-3' style={{ color: 'var(--tf-text-secondary)' }}>{formatTimestamp(error.timestamp)}</p>
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
    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-md' style={{ background: 'hsl(var(--tf-accent) / 0.1)', border: '1px solid hsl(var(--tf-accent) / 0.2)' }}>
      <code className='text-sm font-mono'>{correlationId}</code>
      <button
        onClick={handleCopy}
        aria-label='Copy Correlation ID'
        className='' style={{ color: 'hsl(var(--tf-accent))' }}
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
};

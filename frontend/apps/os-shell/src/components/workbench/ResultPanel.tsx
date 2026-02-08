/**
 * ResultPanel.tsx
 *
 * Phase 6.1: Shared component for displaying tool invocation results
 * Phase 6.2: Visual Renaissance materials adoption
 * Slice 21: OS action trace emission for user interactions
 *
 * Used by: All MWUX tab components
 * Contract:
 * - Idle state: placeholder content
 * - Loading state: spinner + message
 * - Success state: correlationId header + children content
 * - Error state: ErrorDisplay + dismiss button
 * - Dev info panel in development mode
 * - LiquidPanel wrapper with quality gate fallback
 * - User interactions emit OS action traces (copy, dismiss, dev info toggle)
 */

import React, { useCallback, useRef } from 'react';
import type { ErrorInfo } from '../../hooks/useErrorHandler';
import { getEnv } from '../../runtime/env';
import {
  executeOsAction,
  type OsAction,
  type OsActionContext,
} from '../../services/osActions';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { ErrorDisplay } from '../errors/ErrorDisplay';

// ============================================================================
// Types
// ============================================================================

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
  /** Optional result type for trace metadata (privacy-safe) */
  resultType?: string;
}

// ============================================================================
// Trace Helpers
// ============================================================================

/**
 * Emit OS action trace for ResultPanel user interactions
 * Only called on explicit user actions, not on render/mount
 */
function emitResultPanelTrace(
  actionId: string,
  resultType?: string
): void {
  const action: OsAction = {
    id: actionId,
    label: actionId.replace(/_/g, ' '),
    intent: 'workbench',
    handlerKey: `result_panel:${actionId}`,
  };

  const context: OsActionContext = {
    navigate: () => {
      // No navigation for handler actions
    },
    suiteId: 'workbench',
    surface: 'workbench',
    moduleId: 'result_panel',
  };

  // Add resultType to context if available
  if (resultType) {
    // Extend context with resultType (additive field)
    (context as OsActionContext & { resultType?: string }).resultType = resultType;
  }

  executeOsAction(action, context);
}

// ============================================================================
// Component
// ============================================================================

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
  resultType,
}) => {
  // Track details element open state for expand/collapse trace
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const copyToClipboard = useCallback(
    (text: string) => {
      // Emit trace for user interaction
      emitResultPanelTrace('result_panel_copy_correlation_id', resultType);
      navigator.clipboard.writeText(text).catch(console.error);
    },
    [resultType]
  );

  const handleDismiss = useCallback(() => {
    // Emit trace for user interaction
    emitResultPanelTrace('result_panel_dismiss_error', resultType);
    onDismiss?.();
  }, [onDismiss, resultType]);

  const handleDevInfoToggle = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      // Determine if we're expanding or collapsing based on current state
      const details = detailsRef.current;
      const isCurrentlyOpen = details?.open ?? false;

      // Emit appropriate trace (details.open is the state BEFORE the toggle)
      const actionId = isCurrentlyOpen
        ? 'result_panel_dev_info_collapse'
        : 'result_panel_dev_info_expand';

      emitResultPanelTrace(actionId, resultType);
    },
    [resultType]
  );

  const isDev = getEnv('MODE') === 'development';

  // Loading State
  if (status === 'loading') {
    return (
      <LiquidPanel variant='infrastructure' radius='lg' className={`py-12 ${className}`}>
        <div role='status' className='flex flex-col items-center justify-center gap-3'>
          <div className='animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-blue-500' />
          <span className='text-white/60'>{loadingMessage}</span>
        </div>
      </LiquidPanel>
    );
  }

  // Idle State
  if (status === 'idle') {
    return (
      <LiquidPanel variant='infrastructure' radius='lg' className={`py-12 ${className}`}>
        <div className='flex flex-col items-center justify-center text-center'>
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
      </LiquidPanel>
    );
  }

  // Error State
  if (status === 'error' && error) {
    return (
      <LiquidPanel variant='signal' radius='lg' className={`p-5 ${className}`}>
        {onDismiss && (
          <div className='flex justify-end mb-2'>
            <button
              onClick={handleDismiss}
              className='px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20'
              aria-label='Dismiss error'
            >
              Dismiss
            </button>
          </div>
        )}
        <ErrorDisplay error={error} />
      </LiquidPanel>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <LiquidPanel variant='interactive' radius='lg' className={`p-5 ${className}`}>
        <div className='space-y-4'>
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
              <details ref={detailsRef}>
                <summary
                  className='cursor-pointer hover:text-white/60'
                  onClick={handleDevInfoToggle}
                >
                  Developer Info
                </summary>
                <pre className='mt-2 bg-black/30 rounded p-2 overflow-x-auto'>
                  pnpm run trace:query --correlation {correlationId}
                </pre>
              </details>
            </div>
          )}
        </div>
      </LiquidPanel>
    );
  }

  // Fallback
  return null;
};

export default ResultPanel;

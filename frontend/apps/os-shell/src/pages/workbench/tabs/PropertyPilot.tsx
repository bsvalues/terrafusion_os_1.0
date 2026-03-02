/**
 * PropertyPilot.tsx
 *
 * Phase 5: Property Workbench Pilot Tab - Real MWUX Slice
 * First tab to go fully real with parcel-context tool invocation.
 *
 * Architecture: UI → pilotApi.invokeTool(parcelId) → correlationId-first UX
 * Uses ToolInvokePanel pattern with parcel context.
 *
 * Phase 6.2: Migrated to shared workbench primitives
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';

/** Available parcel-context tools for quick invocation */
const PARCEL_TOOLS = [
  {
    toolId: 'registry.list_tools',
    label: 'List Tools',
    description: 'List all available tools (read-only)',
    icon: '📋',
  },
  {
    toolId: 'dossier.summarize',
    label: 'Summarize Dossier',
    description: 'Generate parcel dossier summary',
    icon: '📄',
  },
] as const;

interface InvocationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  currentTool?: string;
  result?: { toolId: string; output: string };
  correlationId?: string;
  error?: ErrorInfo;
}

export const PropertyPilot: React.FC = () => {
  const { parcelId } = useWorkbenchTab();

  const [invocationState, setInvocationState] = useState<InvocationState>({
    status: 'idle',
  });
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  const handleInvokeTool = useCallback(
    async (toolId: string) => {
      setInvocationState({ status: 'loading', currentTool: toolId });

      try {
        const response = await invokeTool({
          toolId,
          params: {},
          parcelId, // Pass parcel context
        });

        const record: InvocationRecord = {
          id: `inv-${Date.now()}`,
          toolId,
          status: response.success ? 'success' : 'error',
          correlationId: response.correlationId,
          timestamp: new Date(),
          errorCode: response.error?.code,
        };

        setInvocationHistory((prev) => [record, ...prev]);

        if (response.success && response.result) {
          setInvocationState({
            status: 'success',
            currentTool: toolId,
            result: response.result,
            correlationId: response.correlationId,
          });
        } else if (response.error) {
          setInvocationState({
            status: 'error',
            currentTool: toolId,
            correlationId: response.correlationId,
            error: {
              message: response.error.message,
              code: response.error.code,
              correlationId: response.correlationId,
              severity: response.error.severity || 'error',
            },
          });
        }
      } catch (err) {
        const correlationId = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const errorInfo: ErrorInfo = {
          message: err instanceof Error ? err.message : 'Network error occurred',
          code: 'NETWORK_ERROR',
          correlationId,
          severity: 'error',
        };

        const record: InvocationRecord = {
          id: `inv-${Date.now()}`,
          toolId,
          status: 'error',
          correlationId,
          timestamp: new Date(),
          errorCode: 'NETWORK_ERROR',
        };

        setInvocationHistory((prev) => [record, ...prev]);
        setInvocationState({
          status: 'error',
          currentTool: toolId,
          correlationId,
          error: errorInfo,
        });
      }
    },
    [parcelId]
  );

  const clearState = useCallback(() => {
    setInvocationState({ status: 'idle' });
  }, []);

  return (
    <div className='tf-suite-pilot space-y-6' data-testid='property-pilot-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='🎮'
        title='Pilot'
        parcelId={parcelId}
        subtitle={`Tool execution for parcel ${parcelId}`}
        actions={
          <button
            onClick={() => window.open(`/property/${encodeURIComponent(parcelId)}/pilot`, '_blank')}
            className='px-3 py-1.5 text-sm tf-hover-surface rounded-lg transition-colors'
          >
            Full Console →
          </button>
        }
      />

      {/* Tool Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {PARCEL_TOOLS.map((tool) => (
          <div
            key={tool.toolId}
            className='tf-suite-card rounded-xl p-5'
          >
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <span className='text-2xl'>{tool.icon}</span>
                <div>
                  <h3 className='tf-text font-semibold'>{tool.label}</h3>
                  <code className='text-xs tf-text-muted'>{tool.toolId}</code>
                </div>
              </div>
              <span className='px-2 py-0.5 text-xs tf-status-success rounded'>
                Read-Only
              </span>
            </div>
            <p className='tf-text-secondary text-sm mb-4'>{tool.description}</p>
            <button
              onClick={() => handleInvokeTool(tool.toolId)}
              disabled={invocationState.status === 'loading'}
              className='tf-suite-pilot-cta w-full px-4 py-2 rounded-lg transition-colors'
            >
              {invocationState.status === 'loading' && invocationState.currentTool === tool.toolId
                ? 'Running...'
                : 'Run Tool'}
            </button>
          </div>
        ))}
      </div>

      {/* Current Invocation Result */}
      {invocationState.status === 'loading' && (
        <div className='tf-status-info rounded-xl p-4' role='status'>
          <div className='flex items-center gap-3'>
            <div className='w-5 h-5 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(var(--tf-text) / 0.3)', borderTopColor: 'hsl(var(--tf-text))' }} />
            <span className='tf-text'>Invoking {invocationState.currentTool}...</span>
          </div>
        </div>
      )}

      {invocationState.status === 'success' && invocationState.result && (
        <div className='tf-status-success rounded-xl p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold flex items-center gap-2' style={{ color: 'hsl(var(--tf-success))' }}>
              <span>✅</span> Tool Execution Successful
            </h3>
            <div className='flex items-center gap-2'>
              <span className='tf-text-muted text-sm'>Correlation ID:</span>
              <code className='tf-overlay px-2 py-1 rounded text-sm tf-text-secondary'>
                {invocationState.correlationId}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(invocationState.correlationId || '')}
                className='px-2 py-1 text-xs tf-hover-surface rounded'
                title='Copy correlation ID'
              >
                Copy
              </button>
              <button
                onClick={clearState}
                className='px-2 py-1 text-xs tf-hover-surface rounded'
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className='tf-overlay rounded-lg p-4 overflow-x-auto'>
            <pre className='text-sm tf-text-secondary font-mono whitespace-pre-wrap'>
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(invocationState.result.output), null, 2);
                } catch {
                  return invocationState.result.output;
                }
              })()}
            </pre>
          </div>

          {getEnv().DEV && (
            <details className='mt-4'>
              <summary className='tf-text-muted text-sm cursor-pointer hover:text-[hsl(var(--tf-text)/0.7)]'>
                🔍 Developer Info
              </summary>
              <div className='mt-2 tf-overlay rounded p-3'>
                <code className='text-xs tf-text-tertiary block'>
                  pnpm run trace:query --correlation {invocationState.correlationId}
                </code>
              </div>
            </details>
          )}
        </div>
      )}

      {invocationState.status === 'error' && invocationState.error && (
        <div className='tf-status-error rounded-xl p-5'>
          <div className='flex justify-end mb-2'>
            <button
              onClick={clearState}
              className='px-2 py-1 text-xs tf-hover-surface rounded'
            >
              Dismiss
            </button>
          </div>
          <ErrorDisplay error={invocationState.error} />
        </div>
      )}

      {/* Invocation History */}
      <InvocationHistory
        records={invocationHistory}
        title='Invocation History'
        emptyMessage='No tool invocations for this parcel yet.'
      />
    </div>
  );
};

export default PropertyPilot;

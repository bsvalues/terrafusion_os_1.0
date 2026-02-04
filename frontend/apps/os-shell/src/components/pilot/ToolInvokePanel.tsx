/**
 * ToolInvokePanel.tsx
 *
 * Phase 2: TerraPilot Read-Only Tool Invocation UI
 * Minimal vertical slice: one hardcoded read-only tool → correlationId-first UX
 */

import React, { useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import type { ErrorInfo } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from '../errors/ErrorDisplay';

interface InvocationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: {
    toolId: string;
    output: string;
  };
  correlationId?: string;
  error?: ErrorInfo;
}

/**
 * ToolInvokePanel Component
 *
 * Phase 2 MVP: Single read-only tool invocation with correlationId display
 * Architecture: UI → pilotApi.invokeTool() → normalized response → correlationId surface
 */
export const ToolInvokePanel: React.FC = () => {
  const [invocationState, setInvocationState] = useState<InvocationState>({
    status: 'idle',
  });

  const handleInvokeTool = async () => {
    setInvocationState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'registry.list_tools',
        params: {},
      });

      if (response.success && response.result) {
        setInvocationState({
          status: 'success',
          result: response.result,
          correlationId: response.correlationId,
        });
      } else if (response.error) {
        // Backend error: Use ErrorDisplay with backend-generated correlationId
        setInvocationState({
          status: 'error',
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
      // Network error: Generate correlationId (net-* prefix)
      const correlationId = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      setInvocationState({
        status: 'error',
        correlationId,
        error: {
          message: err instanceof Error ? err.message : 'Network error occurred',
          code: 'NETWORK_ERROR',
          correlationId,
          severity: 'error',
        },
      });
    }
  };

  return (
    <div className='tool-invoke-panel' data-testid='tool-invoke-panel'>
      <div className='panel-header'>
        <h2>TerraPilot Tool Invocation</h2>
        <p className='subtitle'>Phase 2 MVP: Read-only tool execution</p>
      </div>

      <div className='tool-info'>
        <div className='tool-card'>
          <h3>registry.list_tools</h3>
          <p className='tool-description'>Lists all available tools in the registry</p>
          <span className='badge read-only'>Read-Only</span>
        </div>
      </div>

      <div className='invocation-controls'>
        <button
          onClick={handleInvokeTool}
          disabled={invocationState.status === 'loading'}
          className='btn-primary'
        >
          {invocationState.status === 'loading' ? 'Invoking...' : 'Run Tool'}
        </button>
      </div>

      {invocationState.status === 'loading' && (
        <div className='loading-state' role='status'>
          <span className='spinner' aria-label='Loading'></span>
          <span>Invoking tool...</span>
        </div>
      )}

      {invocationState.status === 'success' && invocationState.result && (
        <div className='success-state'>
          <div className='result-header'>
            <h3>✅ Tool Execution Successful</h3>
            <div className='correlation-id-badge'>
              <span className='label'>Correlation ID:</span>
              <code>{invocationState.correlationId}</code>
              <button
                className='btn-copy'
                onClick={() => navigator.clipboard.writeText(invocationState.correlationId || '')}
                title='Copy correlation ID'
              >
                Copy
              </button>
            </div>
          </div>

          <div className='result-content'>
            <h4>Result:</h4>
            <pre className='result-output'>
              {JSON.stringify(JSON.parse(invocationState.result.output), null, 2)}
            </pre>
          </div>

          {import.meta.env.DEV && (
            <details className='dev-trace-hint'>
              <summary>🔍 Developer Info</summary>
              <div className='hint-content'>
                <p>Trace query command:</p>
                <code className='trace-command'>
                  pnpm run trace:query --correlation {invocationState.correlationId}
                </code>
              </div>
            </details>
          )}
        </div>
      )}

      {invocationState.status === 'error' && invocationState.error && (
        <ErrorDisplay error={invocationState.error} />
      )}

      <style>{`
        .tool-invoke-panel {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          background: var(--surface-color, #ffffff);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          margin-bottom: 2rem;
        }

        .panel-header h2 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary, #1a1a1a);
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary, #666);
          font-size: 0.9rem;
        }

        .tool-card {
          padding: 1.5rem;
          background: var(--surface-secondary, #f5f5f5);
          border-radius: 6px;
          border: 1px solid var(--border-color, #e0e0e0);
          margin-bottom: 1.5rem;
        }

        .tool-card h3 {
          margin: 0 0 0.5rem 0;
          font-family: 'Courier New', monospace;
          color: var(--text-primary, #1a1a1a);
        }

        .tool-description {
          margin: 0.5rem 0;
          color: var(--text-secondary, #666);
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .badge.read-only {
          background: var(--success-light, #d4edda);
          color: var(--success-dark, #155724);
        }

        .invocation-controls {
          margin: 1.5rem 0;
        }

        .btn-primary {
          padding: 0.75rem 2rem;
          background: var(--primary-color, #007bff);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #0056b3);
        }

        .btn-primary:disabled {
          background: var(--disabled-color, #cccccc);
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--info-light, #d1ecf1);
          border-radius: 6px;
          margin-top: 1rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid var(--border-color, #e0e0e0);
          border-top-color: var(--primary-color, #007bff);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-state {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: var(--success-light, #d4edda);
          border-radius: 6px;
          border: 1px solid var(--success-border, #c3e6cb);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .result-header h3 {
          margin: 0;
          color: var(--success-dark, #155724);
        }

        .correlation-id-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 4px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .correlation-id-badge .label {
          font-size: 0.85rem;
          color: var(--text-secondary, #666);
        }

        .correlation-id-badge code {
          font-family: 'Courier New', monospace;
          color: var(--text-primary, #1a1a1a);
          font-size: 0.9rem;
        }

        .btn-copy {
          padding: 0.25rem 0.75rem;
          background: var(--primary-color, #007bff);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-copy:hover {
          background: var(--primary-hover, #0056b3);
        }

        .result-content h4 {
          margin: 1rem 0 0.5rem 0;
          color: var(--success-dark, #155724);
        }

        .result-output {
          background: white;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid var(--border-color, #e0e0e0);
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .dev-trace-hint {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--info-light, #d1ecf1);
          border-radius: 4px;
        }

        .dev-trace-hint summary {
          cursor: pointer;
          font-weight: 600;
          color: var(--info-dark, #0c5460);
        }

        .hint-content {
          margin-top: 0.5rem;
        }

        .hint-content p {
          margin: 0.5rem 0;
          color: var(--text-secondary, #666);
        }

        .trace-command {
          display: block;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

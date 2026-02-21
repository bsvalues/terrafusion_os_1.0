/**
 * ToolInvokePanel.tsx
 *
 * Phase 2: TerraPilot Read-Only Tool Invocation UI
 * Minimal vertical slice: one hardcoded read-only tool → correlationId-first UX
 */

import React, { useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import type { ErrorInfo } from '../../hooks/useErrorHandler';
import { getEnv } from '../../runtime/env';
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

          {getEnv().DEV && (
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
          background: var(--surface-color, hsl(var(--tf-text)));
          border-radius: 8px;
          box-shadow: 0 2px 8px hsl(var(--tf-black) / 0.1);
        }

        .panel-header {
          margin-bottom: 2rem;
        }

        .panel-header h2 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary, hsl(var(--tf-black)));
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary, hsl(var(--tf-light-muted)));
          font-size: 0.9rem;
        }

        .tool-card {
          padding: 1.5rem;
          background: var(--surface-secondary, hsl(var(--tf-light-surface)));
          border-radius: 6px;
          border: 1px solid var(--border-color, hsl(var(--tf-light-border)));
          margin-bottom: 1.5rem;
        }

        .tool-card h3 {
          margin: 0 0 0.5rem 0;
          font-family: 'Courier New', monospace;
          color: var(--text-primary, hsl(var(--tf-black)));
        }

        .tool-description {
          margin: 0.5rem 0;
          color: var(--text-secondary, hsl(var(--tf-light-muted)));
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
          background: var(--success-light, hsl(var(--tf-green-hs) 88%));
          color: var(--success-dark, hsl(var(--tf-green-hs) 22%));
        }

        .invocation-controls {
          margin: 1.5rem 0;
        }

        .btn-primary {
          padding: 0.75rem 2rem;
          background: var(--primary-color, hsl(var(--tf-accent-2)));
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, hsl(var(--tf-blue-hs) 35%));
        }

        .btn-primary:disabled {
          background: var(--disabled-color, hsl(var(--tf-slate-300)));
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--info-light, hsl(var(--tf-blue-hs) 88%));
          border-radius: 6px;
          margin-top: 1rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid var(--border-color, hsl(var(--tf-light-border)));
          border-top-color: var(--primary-color, hsl(var(--tf-accent-2)));
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-state {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: var(--success-light, hsl(var(--tf-green-hs) 88%));
          border-radius: 6px;
          border: 1px solid var(--success-border, hsl(var(--tf-green-hs) 83%));
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .result-header h3 {
          margin: 0;
          color: var(--success-dark, hsl(var(--tf-green-hs) 22%));
        }

        .correlation-id-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 4px;
          border: 1px solid var(--border-color, hsl(var(--tf-light-border)));
        }

        .correlation-id-badge .label {
          font-size: 0.85rem;
          color: var(--text-secondary, hsl(var(--tf-light-muted)));
        }

        .correlation-id-badge code {
          font-family: 'Courier New', monospace;
          color: var(--text-primary, hsl(var(--tf-black)));
          font-size: 0.9rem;
        }

        .btn-copy {
          padding: 0.25rem 0.75rem;
          background: var(--primary-color, hsl(var(--tf-accent-2)));
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-copy:hover {
          background: var(--primary-hover, hsl(var(--tf-blue-hs) 35%));
        }

        .result-content h4 {
          margin: 1rem 0 0.5rem 0;
          color: var(--success-dark, hsl(var(--tf-green-hs) 22%));
        }

        .result-output {
          background: white;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid var(--border-color, hsl(var(--tf-light-border)));
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .dev-trace-hint {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--info-light, hsl(var(--tf-blue-hs) 88%));
          border-radius: 4px;
        }

        .dev-trace-hint summary {
          cursor: pointer;
          font-weight: 600;
          color: var(--info-dark, hsl(var(--tf-blue-hs) 21%));
        }

        .hint-content {
          margin-top: 0.5rem;
        }

        .hint-content p {
          margin: 0.5rem 0;
          color: var(--text-secondary, hsl(var(--tf-light-muted)));
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

/**
 * PropertyDais.tsx
 *
 * Phase 5.5: Property Dais Tab - Workflow MWUX Slice
 * Real MWUX with workflow status and check_cert_status tool invocation.
 *
 * Architecture: UI → select workflow type → check_cert_status tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { ParcelContextHeader } from '../../../components/workbench';

/** Workflow type options */
const WORKFLOW_TYPES = [
  { value: 'certification', label: 'Certification', description: 'Annual certification workflow' },
  { value: 'appeal', label: 'Appeal', description: 'Property value appeal' },
  { value: 'exemption', label: 'Exemption', description: 'Exemption application' },
  { value: 'review', label: 'Review', description: 'Property review request' },
] as const;

type WorkflowType = (typeof WORKFLOW_TYPES)[number]['value'];

interface WorkflowStep {
  name: string;
  status: 'completed' | 'current' | 'pending';
}

interface StatusResult {
  parcelId: string;
  certificationStatus?: string;
  lastUpdated?: string;
  currentStep?: string;
  completedSteps?: string[];
  pendingSteps?: string[];
  assignedTo?: string;
  dueDate?: string;
  workflowType?: string;
}

interface InvocationRecord {
  id: string;
  toolId: string;
  status: 'success' | 'error';
  correlationId: string;
  timestamp: Date;
  workflowType: WorkflowType;
  output?: StatusResult;
  error?: ErrorInfo;
}

interface StatusState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: StatusResult;
  correlationId?: string;
  error?: ErrorInfo;
}

export const PropertyDais: React.FC = () => {
  const { parcelId } = useOutletContext<{ parcelId: string }>();

  const [workflowType, setWorkflowType] = useState<WorkflowType>('certification');
  const [statusState, setStatusState] = useState<StatusState>({ status: 'idle' });
  const [history, setHistory] = useState<InvocationRecord[]>([]);

  const handleCheckStatus = useCallback(async () => {
    setStatusState({ status: 'loading' });

    const params: Record<string, unknown> = {
      parcelId,
      workflowType,
    };

    try {
      const response = await invokeTool({
        toolId: 'check_cert_status',
        params,
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: StatusResult;
        try {
          parsed =
            typeof response.result.output === 'string'
              ? JSON.parse(response.result.output)
              : response.result.output;
        } catch {
          parsed = { parcelId };
        }

        setStatusState({
          status: 'success',
          result: parsed,
          correlationId: response.correlationId,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'check_cert_status',
            status: 'success',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            workflowType,
            output: parsed,
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        const errorInfo: ErrorInfo = {
          code: response.error?.code || 'STATUS_CHECK_FAILED',
          message: response.error?.message || 'Failed to check workflow status',
          severity: 'error' as const,
          correlationId: response.correlationId,
        };

        setStatusState({
          status: 'error',
          correlationId: response.correlationId,
          error: errorInfo,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'check_cert_status',
            status: 'error',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            workflowType,
            error: errorInfo,
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      const clientCorrelationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred',
        severity: 'error' as const,
        correlationId: clientCorrelationId,
      };

      setStatusState({
        status: 'error',
        correlationId: clientCorrelationId,
        error: networkError,
      });

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          toolId: 'check_cert_status',
          status: 'error',
          correlationId: clientCorrelationId,
          timestamp: new Date(),
          workflowType,
          error: networkError,
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [parcelId, workflowType]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStepIcon = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🔄';
      case 'pending':
        return '⏳';
    }
  };

  const buildWorkflowSteps = (result: StatusResult): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];

    if (result.completedSteps) {
      result.completedSteps.forEach((step) => {
        steps.push({ name: step, status: 'completed' });
      });
    }

    if (result.currentStep) {
      steps.push({ name: result.currentStep, status: 'current' });
    }

    if (result.pendingSteps) {
      result.pendingSteps.forEach((step) => {
        steps.push({ name: step, status: 'pending' });
      });
    }

    return steps;
  };

  const isDev = getEnv('MODE') === 'development';

  return (
    <div className='space-y-6' data-testid='property-dais-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon="📊"
        title="TerraDais"
        parcelId={parcelId}
        subtitle={`Workflow orchestration for ${parcelId}`}
      />

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Controls Panel */}
        <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
          <h3 className='text-white font-semibold mb-4 flex items-center gap-2'>
            <span>⚙️</span> Workflow Parameters
          </h3>

          {/* Workflow Type Selector */}
          <div className='mb-4'>
            <label htmlFor='workflow-type' className='block text-white/70 text-sm mb-2'>
              Workflow Type
            </label>
            <select
              id='workflow-type'
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
              className='w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50'
            >
              {WORKFLOW_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value} className='bg-gray-800'>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className='text-white/40 text-xs mt-1'>
              {WORKFLOW_TYPES.find((t) => t.value === workflowType)?.description}
            </p>
          </div>

          {/* Check Status Button */}
          <button
            onClick={handleCheckStatus}
            disabled={statusState.status === 'loading'}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
              statusState.status === 'loading'
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {statusState.status === 'loading' ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        {/* Results Panel */}
        <div className='lg:col-span-2 bg-white/5 rounded-xl border border-white/10 p-4'>
          {statusState.status === 'loading' ? (
            <div role='status' className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-purple-500' />
              <span className='text-white/60'>Checking workflow status...</span>
            </div>
          ) : statusState.status === 'success' && statusState.result ? (
            <div className='space-y-4'>
              {/* Status Summary */}
              <div className='flex items-center justify-between mb-3'>
                <h4 className='text-purple-400 font-semibold flex items-center gap-2'>
                  <span>✅</span> Workflow Status
                </h4>
                {statusState.correlationId && (
                  <div className='flex items-center gap-2 text-xs'>
                    <span className='text-white/50'>ID:</span>
                    <code className='text-purple-400 font-mono'>
                      {statusState.correlationId.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(statusState.correlationId!)}
                      className='text-white/60 hover:text-white'
                      aria-label='Copy correlation ID'
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>

              {/* Status Cards */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-white/5 rounded-lg p-4'>
                  <div className='text-white/60 text-sm'>Status</div>
                  <div className='text-xl font-bold text-white'>
                    {statusState.result.certificationStatus || 'Unknown'}
                  </div>
                </div>
                <div className='bg-white/5 rounded-lg p-4'>
                  <div className='text-white/60 text-sm'>Current Step</div>
                  <div className='text-xl font-bold text-white'>
                    {statusState.result.currentStep || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              {(statusState.result.completedSteps?.length ||
                statusState.result.pendingSteps?.length ||
                statusState.result.currentStep) && (
                <div className='bg-white/5 rounded-lg p-4'>
                  <h5 className='text-white/80 font-medium mb-3'>📋 Workflow Steps</h5>
                  <div className='space-y-2'>
                    {buildWorkflowSteps(statusState.result).map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 py-2 px-3 rounded ${
                          step.status === 'current'
                            ? 'bg-purple-500/20 border border-purple-500/30'
                            : step.status === 'completed'
                            ? 'bg-green-500/10'
                            : 'bg-white/5'
                        }`}
                      >
                        <span>{getStepIcon(step.status)}</span>
                        <span
                          className={
                            step.status === 'current'
                              ? 'text-white font-medium'
                              : step.status === 'completed'
                              ? 'text-green-400'
                              : 'text-white/50'
                          }
                        >
                          {step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Info */}
              {(statusState.result.assignedTo || statusState.result.dueDate) && (
                <div className='grid grid-cols-2 gap-4'>
                  {statusState.result.assignedTo && (
                    <div className='bg-white/5 rounded-lg p-3'>
                      <div className='text-white/60 text-sm'>Assigned To</div>
                      <div className='text-white font-medium'>{statusState.result.assignedTo}</div>
                    </div>
                  )}
                  {statusState.result.dueDate && (
                    <div className='bg-white/5 rounded-lg p-3'>
                      <div className='text-white/60 text-sm'>Due Date</div>
                      <div className='text-white font-medium'>
                        {formatDate(statusState.result.dueDate)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Updated */}
              {statusState.result.lastUpdated && (
                <div className='text-xs text-white/40'>
                  Last updated: {formatDate(statusState.result.lastUpdated)}
                </div>
              )}

              {/* Dev Info */}
              {isDev && statusState.correlationId && (
                <div className='text-xs text-white/40 border-t border-white/10 pt-3'>
                  <details>
                    <summary className='cursor-pointer hover:text-white/60'>Developer Info</summary>
                    <pre className='mt-2 bg-black/30 rounded p-2 overflow-x-auto'>
                      pnpm run trace:query --correlation {statusState.correlationId}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : statusState.status === 'idle' ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='text-4xl mb-2'>📊</div>
              <p className='text-white/60'>Select workflow type and check status</p>
              <p className='text-white/40 text-sm mt-1'>
                View certification status, workflow steps, and assignments
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Error Display */}
      {statusState.status === 'error' && statusState.error && (
        <ErrorDisplay
          error={{
            message: statusState.error.message,
            errorCode: statusState.error.code,
            correlationId: statusState.correlationId,
          }}
        />
      )}

      {/* History */}
      {history.length > 0 && (
        <div className='bg-white/5 rounded-xl p-4 border border-white/10'>
          <h3 className='text-white font-semibold mb-3 flex items-center gap-2'>
            <span>📜</span> History
          </h3>

          <div className='space-y-2'>
            {history.map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  record.status === 'success'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <span className={record.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {record.status === 'success' ? '✅' : '❌'}
                  </span>
                  <div>
                    <div className='text-white/80 text-sm font-mono'>{record.toolId}</div>
                    <div className='text-white/50 text-xs'>
                      {record.workflowType} • {record.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <code className='text-white/40 text-xs font-mono'>
                    {record.correlationId.slice(0, 12)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(record.correlationId)}
                    className='text-white/40 hover:text-white text-sm'
                    aria-label='Copy correlation ID'
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDais;

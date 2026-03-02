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
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

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
            meta: { workflow: workflowType },
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
            errorCode: response.error?.code || 'STATUS_CHECK_FAILED',
            meta: { workflow: workflowType },
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
          errorCode: 'NETWORK_ERROR',
          meta: { workflow: workflowType },
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
    <div className='tf-suite-dais space-y-6' data-testid='property-dais-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='📊'
        title='TerraDais'
        parcelId={parcelId}
        subtitle={`Workflow orchestration for ${parcelId}`}
      />

      {/* Main Content Grid */}
      <BentoGrid columns={3} gap={1.5} padding={0}>
        {/* Controls Panel */}
        <BentoCard variant="form" title="Workflow Parameters" actions={<span>⚙️</span>}>

          {/* Workflow Type Selector */}
          <div className='mb-4'>
            <label htmlFor='workflow-type' className='block tf-text-secondary text-sm mb-2'>
              Workflow Type
            </label>
            <select
              id='workflow-type'
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
              className='tf-input'
            >
              {WORKFLOW_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className='tf-text-dim text-xs mt-1'>
              {WORKFLOW_TYPES.find((t) => t.value === workflowType)?.description}
            </p>
          </div>

          {/* Check Status Button */}
          <button
            onClick={handleCheckStatus}
            disabled={statusState.status === 'loading'}
            className='tf-suite-dais-cta w-full py-2 px-4 rounded-lg font-semibold transition-all'
          >
            {statusState.status === 'loading' ? 'Checking...' : 'Check Status'}
          </button>
        </BentoCard>

        {/* Results Panel */}
        <BentoCard span="2x1">
          {statusState.status === 'loading' ? (
            <div role='status' className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='tf-spinner h-10 w-10' />
              <span className='tf-text-tertiary'>Checking workflow status...</span>
            </div>
          ) : statusState.status === 'success' && statusState.result ? (
            <div className='space-y-4'>
              {/* Status Summary */}
              <div className='flex items-center justify-between mb-3'>
                <h4 className='tf-suite-accent-text font-semibold flex items-center gap-2'>
                  <span>✅</span> Workflow Status
                </h4>
                {statusState.correlationId && (
                  <div className='flex items-center gap-2 text-xs'>
                    <span className='tf-text-muted'>ID:</span>
                    <code className='tf-suite-accent-text font-mono'>
                      {statusState.correlationId.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(statusState.correlationId!)}
                      className='tf-text-tertiary hover:text-[hsl(var(--tf-text))]'
                      aria-label='Copy correlation ID'
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>

              {/* Status Cards */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='tf-panel p-4'>
                  <div className='tf-text-tertiary text-sm'>Status</div>
                  <div className='text-xl font-bold tf-text'>
                    {statusState.result.certificationStatus || 'Unknown'}
                  </div>
                </div>
                <div className='tf-panel p-4'>
                  <div className='tf-text-tertiary text-sm'>Current Step</div>
                  <div className='text-xl font-bold tf-text'>
                    {statusState.result.currentStep || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              {(statusState.result.completedSteps?.length ||
                statusState.result.pendingSteps?.length ||
                statusState.result.currentStep) && (
                <div className='tf-panel p-4'>
                  <h5 className='tf-text-secondary font-medium mb-3'>📋 Workflow Steps</h5>
                  <div className='space-y-2'>
                    {buildWorkflowSteps(statusState.result).map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 py-2 px-3 rounded ${
                          step.status === 'current'
                            ? 'tf-suite-active'
                            : step.status === 'completed'
                              ? 'tf-status-success'
                              : 'tf-panel'
                        }`}
                      >
                        <span>{getStepIcon(step.status)}</span>
                        <span
                          className={
                            step.status === 'current'
                              ? 'tf-text font-medium'
                              : step.status === 'completed'
                                ? ''
                                : 'tf-text-muted'
                          }
                          style={
                            step.status === 'completed'
                              ? { color: 'hsl(var(--tf-success))' }
                              : undefined
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
                    <div className='tf-panel p-3'>
                      <div className='tf-text-tertiary text-sm'>Assigned To</div>
                      <div className='tf-text font-medium'>{statusState.result.assignedTo}</div>
                    </div>
                  )}
                  {statusState.result.dueDate && (
                    <div className='tf-panel p-3'>
                      <div className='tf-text-tertiary text-sm'>Due Date</div>
                      <div className='tf-text font-medium'>
                        {formatDate(statusState.result.dueDate)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Updated */}
              {statusState.result.lastUpdated && (
                <div className='text-xs tf-text-dim'>
                  Last updated: {formatDate(statusState.result.lastUpdated)}
                </div>
              )}

              {/* Dev Info */}
              {isDev && statusState.correlationId && (
                <div className='text-xs tf-text-dim border-t tf-border pt-3'>
                  <details>
                    <summary className='cursor-pointer hover:text-[hsl(var(--tf-text)/0.6)]'>Developer Info</summary>
                    <pre className='mt-2 tf-overlay rounded p-2 overflow-x-auto'>
                      pnpm run trace:query --correlation {statusState.correlationId}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : statusState.status === 'idle' ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='text-4xl mb-2'>📊</div>
              <p className='tf-text-tertiary'>Select workflow type and check status</p>
              <p className='tf-text-dim text-sm mt-1'>
                View certification status, workflow steps, and assignments
              </p>
            </div>
          ) : null}
        </BentoCard>
      </BentoGrid>

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
      <InvocationHistory
        records={history}
        title='Status History'
        emptyMessage='No workflow status checks yet.'
      />
    </div>
  );
};

export default PropertyDais;

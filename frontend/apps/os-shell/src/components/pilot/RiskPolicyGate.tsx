/**
 * RiskPolicyGate.tsx
 *
 * Phase 3 + Phase 4: Risk Policy Gate Component
 * Orchestrates the write-risk confirmation workflow:
 * 1. Validate tool via preflight check
 * 2. Show confirmation modal if required
 * 3. Execute tool with confirmation flags
 *
 * Policy Enforcement:
 * - read_only: Execute immediately
 * - write_low: Require confirmation
 * - write_high: Require confirmation + reason code
 * - irreversible: Require confirmation + reason code + approval token (Phase 4)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    invokeTool,
    requestApprovalToken,
    validatePilotTool,
    type ApprovalToken,
    type PilotValidateResponse,
    type Risk,
} from '../../api/pilotApi';
import type { ErrorInfo } from '../../hooks/useErrorHandler';
import { ErrorDisplay } from '../errors/ErrorDisplay';
import { RiskConfirmationModal } from './RiskConfirmationModal';

export interface RiskPolicyGateProps {
  toolId: string;
  params: Record<string, unknown>;
  onComplete: (result: {
    success: boolean;
    correlationId: string;
    result?: { toolId: string; output: string };
    error?: { code: string; message: string; severity: string };
  }) => void;
  onCancel: () => void;
}

type GateState =
  | { phase: 'validating' }
  | { phase: 'executing'; reason?: string }
  | { phase: 'confirming'; validation: PilotValidateResponse }
  | { phase: 'error'; error: ErrorInfo }
  | { phase: 'complete' };

/** Phase 4: Approval token state for irreversible tools */
interface ApprovalTokenState {
  token: ApprovalToken | null;
  error: string | null;
  correlationId: string | null;
  isGenerating: boolean;
}

/**
 * RiskPolicyGate Component
 *
 * Orchestrates the policy-gated tool invocation flow.
 * Handles preflight validation, confirmation dialogs, and execution.
 */
export const RiskPolicyGate: React.FC<RiskPolicyGateProps> = ({
  toolId,
  params,
  onComplete,
  onCancel,
}) => {
  const [state, setState] = useState<GateState>({ phase: 'validating' });

  // Phase 4: Approval token state
  const [tokenState, setTokenState] = useState<ApprovalTokenState>({
    token: null,
    error: null,
    correlationId: null,
    isGenerating: false,
  });

  // Preflight validation
  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      try {
        const validation = await validatePilotTool({
          toolId,
          params,
        });

        if (!isMounted) return;

        // Check if confirmation is required
        if (validation.preflight?.confirmationRequired) {
          setState({ phase: 'confirming', validation });
        } else {
          // No confirmation needed - execute immediately
          await executeToolDirect();
        }
      } catch (err) {
        if (!isMounted) return;
        const correlationId = `gate-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        setState({
          phase: 'error',
          error: {
            message: err instanceof Error ? err.message : 'Validation failed',
            code: 'VALIDATION_ERROR',
            correlationId,
            severity: 'error',
          },
        });
      }
    };

    const executeToolDirect = async () => {
      setState({ phase: 'executing' });

      try {
        const result = await invokeTool({
          toolId,
          params,
        });

        if (!isMounted) return;

        onComplete(result);
        setState({ phase: 'complete' });
      } catch (err) {
        if (!isMounted) return;
        const correlationId = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        setState({
          phase: 'error',
          error: {
            message: err instanceof Error ? err.message : 'Execution failed',
            code: 'NETWORK_ERROR',
            correlationId,
            severity: 'error',
          },
        });
      }
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, [toolId, params, onComplete]);

  // Phase 4: Request approval token for irreversible tools
  const handleRequestApprovalToken = useCallback(
    async (reasonCode: string) => {
      setTokenState((prev) => ({
        ...prev,
        isGenerating: true,
        error: null,
        correlationId: null,
      }));

      try {
        const response = await requestApprovalToken({
          toolId,
          params,
          reasonCode,
        });

        if (response.success && response.token) {
          setTokenState({
            token: response.token,
            error: null,
            correlationId: response.correlationId,
            isGenerating: false,
          });
        } else {
          setTokenState({
            token: null,
            error: response.error || 'Failed to generate approval token',
            correlationId: response.correlationId,
            isGenerating: false,
          });
        }
      } catch (err) {
        setTokenState({
          token: null,
          error: err instanceof Error ? err.message : 'Failed to generate approval token',
          correlationId: null,
          isGenerating: false,
        });
      }
    },
    [toolId, params]
  );

  // Handle confirmation
  const handleConfirm = useCallback(
    async (options?: { reasonCode?: string; approvalToken?: string }) => {
      if (state.phase !== 'confirming') return;

      setState({ phase: 'executing', reason: options?.reasonCode });

      try {
        const result = await invokeTool({
          toolId,
          params,
          confirmation: true,
          reasonCode: options?.reasonCode,
          approvalToken: options?.approvalToken,
        });

        if (!result.success && result.error) {
          // Show error with correlationId
          setState({
            phase: 'error',
            error: {
              message: result.error.message,
              code: result.error.code,
              correlationId: result.correlationId,
              severity: result.error.severity,
            },
          });
        } else {
          onComplete(result);
          setState({ phase: 'complete' });
        }
      } catch (err) {
        const correlationId = `net-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        setState({
          phase: 'error',
          error: {
            message: err instanceof Error ? err.message : 'Execution failed',
            code: 'NETWORK_ERROR',
            correlationId,
            severity: 'error',
          },
        });
      }
    },
    [state.phase, toolId, params, onComplete]
  );

  // Render based on state
  if (state.phase === 'validating' || state.phase === 'executing') {
    return (
      <div className='policy-gate-loading' role='status' aria-label='Loading'>
        <span className='spinner'></span>
        <span>{state.phase === 'validating' ? 'Validating...' : 'Executing...'}</span>
        <style>{`
          .policy-gate-loading {
            --tf-rpg-gray-hs: 220 12%;
            --tf-rpg-blue-hs: 217 91%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            color: hsl(var(--tf-rpg-gray-hs) 46%);
          }
          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid hsl(var(--tf-rpg-gray-hs) 91%);
            border-top-color: hsl(var(--tf-rpg-blue-hs) 60%);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className='policy-gate-error'>
        <ErrorDisplay error={state.error} />
        <div className='error-actions'>
          <button onClick={onCancel} className='btn-back'>
            Back
          </button>
        </div>
        <style>{`
          .policy-gate-error {
            --tf-rpg-gray-hs: 220 12%;
            padding: 1rem;
          }
          .error-actions {
            margin-top: 1rem;
            display: flex;
            justify-content: flex-end;
          }
          .btn-back {
            padding: 0.5rem 1rem;
            border: 1px solid hsl(var(--tf-rpg-gray-hs) 84%);
            border-radius: 6px;
            background: white;
            cursor: pointer;
          }
          .btn-back:hover {
            background: hsl(var(--tf-rpg-gray-hs) 96%);
          }
        `}</style>
      </div>
    );
  }

  if (state.phase === 'confirming') {
    const { validation } = state;
    const tool = validation.tool;
    const preflight = validation.preflight;

    // Check for validation violations
    if (validation.violations.length > 0) {
      return (
        <div className='policy-gate-violations' role='dialog'>
          <div className='violations-header'>
            <span className='icon'>⚠️</span>
            <h3>Validation Failed</h3>
          </div>
          <ul className='violations-list'>
            {validation.violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
          <div className='violations-footer'>
            <button onClick={onCancel} className='btn-cancel'>
              Cancel
            </button>
            <button disabled className='btn-confirm' title='Cannot proceed with violations'>
              Confirm
            </button>
          </div>
          <style>{`
            .policy-gate-violations {
              --tf-rpg-gray-hs: 220 12%;
              --tf-rpg-amber-hs: 43 96%;
              --tf-rpg-amber-deep-hs: 26 90%;
              --tf-rpg-amber-dark-hs: 23 83%;
              padding: 1.5rem;
              background: white;
              border-radius: 8px;
              border: 1px solid hsl(var(--tf-rpg-amber-hs) 56%);
              max-width: 500px;
              margin: 1rem auto;
            }
            .violations-header {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 1rem;
            }
            .violations-header h3 {
              margin: 0;
              color: hsl(var(--tf-rpg-amber-deep-hs) 37%);
            }
            .violations-list {
              margin: 0 0 1.5rem 0;
              padding-left: 1.5rem;
              color: hsl(var(--tf-rpg-amber-dark-hs) 31%);
            }
            .violations-list li {
              margin: 0.5rem 0;
            }
            .violations-footer {
              display: flex;
              justify-content: flex-end;
              gap: 0.75rem;
            }
            .btn-cancel {
              padding: 0.5rem 1rem;
              border: 1px solid hsl(var(--tf-rpg-gray-hs) 84%);
              border-radius: 6px;
              background: white;
              cursor: pointer;
            }
            .btn-confirm {
              padding: 0.5rem 1rem;
              border: none;
              border-radius: 6px;
              background: hsl(var(--tf-rpg-gray-hs) 65%);
              color: white;
              cursor: not-allowed;
              opacity: 0.5;
            }
          `}</style>
        </div>
      );
    }

    return (
      <RiskConfirmationModal
        isOpen={true}
        toolId={toolId}
        toolDescription={tool?.toolId}
        risk={(tool?.risk as Risk) || 'write_low'}
        reasonCodes={tool?.reasonCodes}
        requiresReasonCode={preflight?.reasonCodeRequired}
        requiresSupervisorApproval={preflight?.supervisorRequired}
        supervisorRoles={tool?.supervisorRoles}
        approvalToken={tokenState.token}
        approvalTokenError={tokenState.error || undefined}
        approvalTokenCorrelationId={tokenState.correlationId || undefined}
        isGeneratingToken={tokenState.isGenerating}
        onRequestApprovalToken={handleRequestApprovalToken}
        onConfirm={handleConfirm}
        onCancel={onCancel}
      />
    );
  }

  // Complete state - nothing to render
  return null;
};

/**
 * useToolInvocation Hook
 *
 * PR-UI1: Governed tool invocation lifecycle state machine.
 * Manages the full invoke → preflight → confirm → execute → trace flow.
 *
 * States: idle → preflight → confirming → executing → succeeded → failed
 * correlationId is surfaced at every post-execute stage.
 *
 * @module hooks/useToolInvocation
 */

import { useCallback, useReducer } from 'react';
import {
  invokePilotTool,
  validatePilotTool,
  type PilotInvokeResponse,
  type PilotValidateResponse,
  type Risk,
} from '../api/pilotApi';

// ============================================================================
// Types
// ============================================================================

export type InvocationPhase =
  | 'idle'
  | 'preflight'
  | 'confirming'
  | 'executing'
  | 'succeeded'
  | 'failed';

export interface ConfirmationRequirements {
  confirmationRequired: boolean;
  reasonCodeRequired: boolean;
  reasonCodes: string[];
  supervisorRequired: boolean;
  supervisorRoles: string[];
  risk: Risk;
  toolId: string;
  toolDescription?: string;
}

export interface InvocationState {
  phase: InvocationPhase;
  toolId: string | null;
  params: Record<string, unknown> | null;
  /** Preflight validation result */
  validation: PilotValidateResponse | null;
  /** Confirmation requirements extracted from preflight */
  confirmation: ConfirmationRequirements | null;
  /** Invoke response (success or failure) */
  response: PilotInvokeResponse | null;
  /** correlationId from response */
  correlationId: string | null;
  /** Human-readable error message */
  error: string | null;
  /** Machine-readable error code */
  errorCode: string | null;
}

// ============================================================================
// Reducer
// ============================================================================

type Action =
  | { type: 'START_PREFLIGHT'; toolId: string; params: Record<string, unknown> }
  | { type: 'PREFLIGHT_PASS'; validation: PilotValidateResponse }
  | { type: 'PREFLIGHT_NEEDS_CONFIRMATION'; validation: PilotValidateResponse; requirements: ConfirmationRequirements }
  | { type: 'PREFLIGHT_FAIL'; error: string }
  | { type: 'START_EXECUTE' }
  | { type: 'EXECUTE_SUCCESS'; response: PilotInvokeResponse }
  | { type: 'EXECUTE_FAIL'; response?: PilotInvokeResponse; error: string; errorCode?: string }
  | { type: 'RESET' };

const initialState: InvocationState = {
  phase: 'idle',
  toolId: null,
  params: null,
  validation: null,
  confirmation: null,
  response: null,
  correlationId: null,
  error: null,
  errorCode: null,
};

function reducer(state: InvocationState, action: Action): InvocationState {
  switch (action.type) {
    case 'START_PREFLIGHT':
      return {
        ...initialState,
        phase: 'preflight',
        toolId: action.toolId,
        params: action.params,
      };
    case 'PREFLIGHT_PASS':
      return {
        ...state,
        phase: 'executing',
        validation: action.validation,
      };
    case 'PREFLIGHT_NEEDS_CONFIRMATION':
      return {
        ...state,
        phase: 'confirming',
        validation: action.validation,
        confirmation: action.requirements,
      };
    case 'PREFLIGHT_FAIL':
      return {
        ...state,
        phase: 'failed',
        error: action.error,
        errorCode: 'PREFLIGHT_FAILED',
      };
    case 'START_EXECUTE':
      return {
        ...state,
        phase: 'executing',
      };
    case 'EXECUTE_SUCCESS':
      return {
        ...state,
        phase: 'succeeded',
        response: action.response,
        correlationId: action.response.correlationId,
      };
    case 'EXECUTE_FAIL':
      return {
        ...state,
        phase: 'failed',
        response: action.response ?? null,
        correlationId: action.response?.correlationId ?? null,
        error: action.error,
        errorCode: action.errorCode ?? action.response?.errorCode ?? 'EXECUTION_FAILED',
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export interface UseToolInvocationResult {
  state: InvocationState;
  /** Start a tool invocation (preflight → confirm? → execute) */
  invoke: (toolId: string, params: Record<string, unknown>) => Promise<void>;
  /** Confirm and execute after confirmation gate (with reason code, supervisor, etc.) */
  confirm: (options: {
    confirmation: boolean;
    reasonCode?: string;
    supervisorApproval?: { approvedBy: string; role: string };
  }) => Promise<void>;
  /** Cancel a pending confirmation */
  cancel: () => void;
  /** Reset to idle */
  reset: () => void;
}

export function useToolInvocation(): UseToolInvocationResult {
  const [state, dispatch] = useReducer(reducer, initialState);

  const invoke = useCallback(async (toolId: string, params: Record<string, unknown>) => {
    dispatch({ type: 'START_PREFLIGHT', toolId, params });

    try {
      const validation = await validatePilotTool({ toolId, params });

      // Check if confirmation is needed
      const pf = validation.preflight;
      const needsConfirmation = pf?.confirmationRequired && !pf?.confirmationProvided;
      const needsReason = pf?.reasonCodeRequired && !pf?.reasonCodeProvided;
      const needsSupervisor = pf?.supervisorRequired && !pf?.supervisorProvided;

      if (needsConfirmation || needsReason || needsSupervisor) {
        dispatch({
          type: 'PREFLIGHT_NEEDS_CONFIRMATION',
          validation,
          requirements: {
            confirmationRequired: pf?.confirmationRequired ?? false,
            reasonCodeRequired: pf?.reasonCodeRequired ?? false,
            reasonCodes: validation.tool?.reasonCodes ?? [],
            supervisorRequired: pf?.supervisorRequired ?? false,
            supervisorRoles: validation.tool?.supervisorRoles ?? [],
            risk: (validation.tool?.risk as Risk) ?? 'read_only',
            toolId,
            toolDescription: undefined,
          },
        });
        return;
      }

      // No confirmation needed — execute directly
      if (!validation.valid) {
        dispatch({
          type: 'PREFLIGHT_FAIL',
          error: validation.violations.join('; '),
        });
        return;
      }

      // Execute
      dispatch({ type: 'PREFLIGHT_PASS', validation });

      const response = await invokePilotTool({ toolId, params });

      if (response.ok) {
        dispatch({ type: 'EXECUTE_SUCCESS', response });
      } else {
        dispatch({
          type: 'EXECUTE_FAIL',
          response,
          error: response.error ?? 'Tool execution failed',
          errorCode: response.errorCode,
        });
      }
    } catch (err) {
      dispatch({
        type: 'EXECUTE_FAIL',
        error: err instanceof Error ? err.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
      });
    }
  }, []);

  const confirm = useCallback(
    async (options: {
      confirmation: boolean;
      reasonCode?: string;
      supervisorApproval?: { approvedBy: string; role: string };
    }) => {
      if (state.phase !== 'confirming' || !state.toolId || !state.params) return;

      dispatch({ type: 'START_EXECUTE' });

      try {
        const response = await invokePilotTool({
          toolId: state.toolId,
          params: state.params,
          confirmation: {
            confirmed: options.confirmation,
            reasonCode: options.reasonCode,
            supervisorApproval: options.supervisorApproval,
          },
        });

        if (response.ok) {
          dispatch({ type: 'EXECUTE_SUCCESS', response });
        } else {
          dispatch({
            type: 'EXECUTE_FAIL',
            response,
            error: response.error ?? 'Tool execution failed',
            errorCode: response.errorCode,
          });
        }
      } catch (err) {
        dispatch({
          type: 'EXECUTE_FAIL',
          error: err instanceof Error ? err.message : 'Network error',
          errorCode: 'NETWORK_ERROR',
        });
      }
    },
    [state.phase, state.toolId, state.params]
  );

  const cancel = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return { state, invoke, confirm, cancel, reset };
}

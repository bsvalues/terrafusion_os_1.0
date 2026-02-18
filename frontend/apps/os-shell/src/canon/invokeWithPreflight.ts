import {
  invokeTool,
  validatePilotTool,
  type Mode,
  type PilotInvokeRequest,
  type PilotValidateResponse,
} from '../api/pilotApi';

export interface CanonInvokeRequest {
  toolId: string;
  params: Record<string, unknown>;
  mode?: Mode;
}

export type CanonInvokeResult =
  | { status: 'denied'; reason: string; correlationId: string }
  | { status: 'ok'; correlationId: string; result?: { toolId: string; output: string } };

interface InvokeDeps {
  validate: (request: {
    toolId: string;
    params?: Record<string, unknown>;
    mode?: Mode;
  }) => Promise<PilotValidateResponse>;
  invoke: (request: PilotInvokeRequest) => Promise<{
    success: boolean;
    correlationId: string;
    result?: { toolId: string; output: string };
    error?: { code: string; message: string };
  }>;
  createCorrelationId: () => string;
}

const defaultDeps: InvokeDeps = {
  validate: validatePilotTool,
  invoke: invokeTool,
  createCorrelationId: () =>
    `canon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
};

function normalizeReason(reason: unknown): string {
  if (typeof reason === 'string' && reason.trim().length > 0) return reason.trim();
  return 'Policy denied';
}

export async function invokeWithPreflight(
  request: CanonInvokeRequest,
  deps: InvokeDeps = defaultDeps
): Promise<CanonInvokeResult> {
  const clientCorrelationId = deps.createCorrelationId();

  try {
    const validation = await deps.validate({
      toolId: request.toolId,
      params: request.params,
      mode: request.mode,
    });

    if (!validation.valid) {
      return {
        status: 'denied',
        reason: normalizeReason(validation.violations?.[0]),
        correlationId: clientCorrelationId,
      };
    }

    const invokeResponse = await deps.invoke({
      toolId: request.toolId,
      params: {
        ...request.params,
        correlationId: clientCorrelationId,
      },
      mode: request.mode,
    });

    if (!invokeResponse.success) {
      return {
        status: 'denied',
        reason: normalizeReason(invokeResponse.error?.message),
        correlationId: invokeResponse.correlationId || clientCorrelationId,
      };
    }

    return {
      status: 'ok',
      correlationId: invokeResponse.correlationId || clientCorrelationId,
      result: invokeResponse.result,
    };
  } catch (error) {
    return {
      status: 'denied',
      reason: normalizeReason(error instanceof Error ? error.message : error),
      correlationId: clientCorrelationId,
    };
  }
}


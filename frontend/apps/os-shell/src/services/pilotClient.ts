import type { Session } from '../auth/session';
import { sessionToPilotHeaders } from './pilotContext';

export type PilotMode = 'pilot' | 'muse';

export type PilotApiHeaders = {
  userId: string;
  countyId: string;
  role?: string;
  permissions?: string | string[];
  mode?: PilotMode;
  parcelId?: string;
};

export type PilotContextInput =
  | PilotApiHeaders
  | {
      headers?: PilotApiHeaders;
      session?: Session | null;
    };

export type PilotApiTool = {
  id: string;
  suite: string;
  risk: string;
  requiredPermissions: string[];
};

export type ListToolsResponse = {
  tools: PilotApiTool[];
  count: number;
};

export type ExecuteToolResponse = {
  ok: boolean;
  correlationId?: string;
  result?: unknown;
  error?: string;
};

export type PilotHealth = { ok: true } | { ok: false; error: string };

const DEFAULT_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PILOT_API_URL) ||
  (typeof process !== 'undefined' && process.env?.PILOT_API_URL) ||
  'http://localhost:3333';

const buildHeaders = (ctx: PilotApiHeaders): Record<string, string> => {
  const headers: Record<string, string> = {
    'x-user-id': ctx.userId,
    'x-county-id': ctx.countyId,
  };

  if (ctx.role) headers['x-role'] = ctx.role;
  if (ctx.permissions) {
    headers['x-permissions'] = Array.isArray(ctx.permissions)
      ? ctx.permissions.join(',')
      : ctx.permissions;
  }
  if (ctx.mode) headers['x-mode'] = ctx.mode;
  if (ctx.parcelId) headers['x-parcel-id'] = ctx.parcelId;

  return headers;
};

const isPilotHeaders = (value: PilotContextInput): value is PilotApiHeaders =>
  typeof (value as PilotApiHeaders).userId === 'string' &&
  typeof (value as PilotApiHeaders).countyId === 'string';

const resolveHeaders = (input: PilotContextInput): Record<string, string> => {
  if (isPilotHeaders(input)) {
    return buildHeaders(input);
  }

  if (input.headers) {
    return buildHeaders(input.headers);
  }

  if (input.session) {
    return sessionToPilotHeaders(input.session);
  }

  throw new Error('Pilot context is missing userId/countyId');
};

export const listTools = async (
  ctx: PilotContextInput,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ListToolsResponse> => {
  const response = await fetch(`${baseUrl}/api/tools`, {
    headers: resolveHeaders(ctx),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as ListToolsResponse;
};

export const executeTool = async (
  toolId: string,
  params: Record<string, unknown>,
  ctx: PilotContextInput,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ExecuteToolResponse> => {
  const response = await fetch(`${baseUrl}/api/tools/execute`, {
    method: 'POST',
    headers: {
      ...resolveHeaders(ctx),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ toolName: toolId, input: params }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      correlationId: data?.correlationId,
      error: data?.error || `HTTP ${response.status}`,
    };
  }

  return data as ExecuteToolResponse;
};

export const checkHealth = async (
  baseUrl: string = DEFAULT_BASE_URL,
  timeoutMs: number = 1800
): Promise<PilotHealth> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    if (response.status === 200) {
      return { ok: true };
    }
    const errorText = await response.text().catch(() => 'Unhealthy');
    return { ok: false, error: errorText || `HTTP ${response.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Health check failed';
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeoutId);
  }
};

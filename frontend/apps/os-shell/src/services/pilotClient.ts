export type PilotMode = 'pilot' | 'muse';

export type PilotApiHeaders = {
  userId: string;
  countyId: string;
  role?: string;
  permissions?: string | string[];
  mode?: PilotMode;
  parcelId?: string;
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

export const listTools = async (
  ctx: PilotApiHeaders,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ListToolsResponse> => {
  const response = await fetch(`${baseUrl}/api/tools`, {
    headers: buildHeaders(ctx),
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
  ctx: PilotApiHeaders,
  baseUrl: string = DEFAULT_BASE_URL
): Promise<ExecuteToolResponse> => {
  const response = await fetch(`${baseUrl}/api/tools/execute`, {
    method: 'POST',
    headers: {
      ...buildHeaders(ctx),
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

import { appendLocalAgentEvent } from './eventLog.js';

export interface LocalAgentModelPlanDraft {
  taskSummary: string | null;
  riskNotes: string[];
  candidateFiles: string[];
  strippedUnsafeContent: boolean;
}

export interface LocalAgentModelPlanContext {
  allowedFiles: string[];
  forbiddenFiles: string[];
  proofGates: string[];
  successCriteria: string[];
  risks: string[];
}

export interface LocalAgentModelGatewayOptions {
  repoRoot?: string | null;
  endpoint?: string | null;
  model?: string | null;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface LocalAgentModelDescriptor {
  id: string;
  ownedBy: string | null;
  created: number | null;
}

export interface LocalAgentModelHealthResult {
  ok: boolean;
  available: boolean;
  status: string;
  model: string | null;
  endpoint: string | null;
  checkedPath: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
}

export interface LocalAgentModelListResult {
  ok: boolean;
  available: boolean;
  supported: boolean;
  status: string;
  endpoint: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  models: LocalAgentModelDescriptor[];
}

export interface LocalAgentModelChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LocalAgentModelChatResponse {
  role: 'assistant';
  text: string;
  advisoryOnly: true;
  toolCallsDetected: boolean;
}

export interface LocalAgentModelChatResult {
  ok: boolean;
  available: boolean;
  status: string;
  model: string | null;
  endpoint: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  finishReason: string | null;
  response: LocalAgentModelChatResponse;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
}

export interface LocalAgentModelGatewayResult {
  requested: boolean;
  available: boolean;
  status: string;
  model: string | null;
  endpoint: string | null;
  draft: LocalAgentModelPlanDraft | null;
}

interface LocalAgentModelEndpointConfig {
  baseEndpoint: string;
  healthUrl: URL;
  modelsUrl: URL;
  chatUrl: URL;
}

interface LocalAgentGatewayFailure {
  model: string | null;
  endpoint: string | null;
  status: string;
}

export class LocalAgentModelGateway {
  constructor(private readonly options: LocalAgentModelGatewayOptions = {}) {}

  async draftPlan(task: string, context: LocalAgentModelPlanContext): Promise<LocalAgentModelGatewayResult> {
    const resolved = this.resolveEndpoint('Model assistance requested but no local endpoint was configured.');
    if ('status' in resolved) {
      return {
        requested: true,
        available: false,
        status: resolved.status,
        model: resolved.model,
        endpoint: resolved.endpoint,
        draft: null,
      };
    }

    const response = await this.requestJson(resolved.config.chatUrl, {
      method: 'POST',
      body: JSON.stringify({
        model: resolved.model,
        tools: [],
        tool_choice: 'none',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'Return JSON only.',
              'Allowed keys: taskSummary, riskNotes, candidateFiles.',
              'Do not call tools.',
              'Do not include patch, apply, proof, command, or lock authority.',
              'Never expand allowed or forbidden files.',
            ].join(' '),
          },
          {
            role: 'user',
            content: JSON.stringify({
              task,
              context,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        requested: true,
        available: response.available,
        status: response.status,
        model: resolved.model,
        endpoint: resolved.config.baseEndpoint,
        draft: null,
      };
    }

    const draft = extractPlanDraft(response.payload);
    return {
      requested: true,
      available: true,
      status: draft ? 'Validated model draft received.' : 'Model returned no usable plan draft.',
      model: resolved.model,
      endpoint: resolved.config.baseEndpoint,
      draft,
    };
  }

  async checkHealth(): Promise<LocalAgentModelHealthResult> {
    const resolved = this.resolveEndpoint('No local model endpoint configured for health check.');
    if ('status' in resolved) {
      const result = {
        ok: false,
        available: false,
        status: resolved.status,
        model: resolved.model,
        endpoint: resolved.endpoint,
        checkedPath: null,
        httpStatus: null,
        latencyMs: null,
      } satisfies LocalAgentModelHealthResult;
      this.logEvent('model_gateway_health_checked', {
        ok: result.ok,
        available: result.available,
        endpoint: result.endpoint,
        checkedPath: result.checkedPath,
        httpStatus: result.httpStatus,
        latencyMs: result.latencyMs,
        status: result.status,
      });
      return result;
    }

    const health = await this.requestJson(resolved.config.healthUrl, { method: 'GET' });
    let result: LocalAgentModelHealthResult;
    if (health.ok) {
      result = {
        ok: true,
        available: true,
        status: 'Local model health check succeeded.',
        model: resolved.model,
        endpoint: resolved.config.baseEndpoint,
        checkedPath: resolved.config.healthUrl.pathname,
        httpStatus: health.httpStatus,
        latencyMs: health.latencyMs,
      };
    } else if (health.httpStatus === 404 || health.httpStatus === 405) {
      const fallback = await this.requestJson(resolved.config.modelsUrl, { method: 'GET' });
      result = fallback.ok
        ? {
            ok: true,
            available: true,
            status: 'Local model endpoint responded through model listing fallback.',
            model: resolved.model,
            endpoint: resolved.config.baseEndpoint,
            checkedPath: resolved.config.modelsUrl.pathname,
            httpStatus: fallback.httpStatus,
            latencyMs: fallback.latencyMs,
          }
        : {
            ok: false,
            available: fallback.available,
            status: fallback.status,
            model: resolved.model,
            endpoint: resolved.config.baseEndpoint,
            checkedPath: resolved.config.healthUrl.pathname,
            httpStatus: fallback.httpStatus,
            latencyMs: fallback.latencyMs,
          };
    } else {
      result = {
        ok: false,
        available: health.available,
        status: health.status,
        model: resolved.model,
        endpoint: resolved.config.baseEndpoint,
        checkedPath: resolved.config.healthUrl.pathname,
        httpStatus: health.httpStatus,
        latencyMs: health.latencyMs,
      };
    }

    this.logEvent('model_gateway_health_checked', {
      ok: result.ok,
      available: result.available,
      endpoint: result.endpoint,
      checkedPath: result.checkedPath,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      status: result.status,
    });
    return result;
  }

  async listModels(): Promise<LocalAgentModelListResult> {
    const resolved = this.resolveEndpoint('No local model endpoint configured for model listing.');
    if ('status' in resolved) {
      const result = {
        ok: false,
        available: false,
        supported: false,
        status: resolved.status,
        endpoint: resolved.endpoint,
        httpStatus: null,
        latencyMs: null,
        models: [],
      } satisfies LocalAgentModelListResult;
      this.logEvent('model_gateway_models_listed', {
        ok: result.ok,
        available: result.available,
        supported: result.supported,
        endpoint: result.endpoint,
        httpStatus: result.httpStatus,
        latencyMs: result.latencyMs,
        modelCount: 0,
        models: [],
        status: result.status,
      });
      return result;
    }

    const response = await this.requestJson(resolved.config.modelsUrl, { method: 'GET' });
    const models = response.ok ? extractModels(response.payload) : [];
    const result: LocalAgentModelListResult = response.ok
      ? {
          ok: true,
          available: true,
          supported: true,
          status: 'Local model endpoint returned model metadata.',
          endpoint: resolved.config.baseEndpoint,
          httpStatus: response.httpStatus,
          latencyMs: response.latencyMs,
          models,
        }
      : {
          ok: false,
          available: response.available,
          supported: !(response.httpStatus === 404 || response.httpStatus === 405),
          status: response.httpStatus === 404 || response.httpStatus === 405
            ? 'Local model endpoint does not expose model listing.'
            : response.status,
          endpoint: resolved.config.baseEndpoint,
          httpStatus: response.httpStatus,
          latencyMs: response.latencyMs,
          models: [],
        };

    this.logEvent('model_gateway_models_listed', {
      ok: result.ok,
      available: result.available,
      supported: result.supported,
      endpoint: result.endpoint,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      modelCount: result.models.length,
      models: result.models.map(model => model.id),
      status: result.status,
    });
    return result;
  }

  async chat(messages: LocalAgentModelChatMessage[]): Promise<LocalAgentModelChatResult> {
    const resolved = this.resolveEndpoint('No local model endpoint configured for chat.');
    if ('status' in resolved) {
      const result = this.failedChatResult(resolved.model, resolved.endpoint, resolved.status);
      this.logChatEvent(result, messages);
      return result;
    }

    const sanitizedMessages = messages
      .filter(message => message.content.trim().length > 0)
      .map(message => ({
        role: message.role,
        content: message.content,
      }));

    const response = await this.requestJson(resolved.config.chatUrl, {
        method: 'POST',
        body: JSON.stringify({
          model: resolved.model,
          tools: [],
          tool_choice: 'none',
          temperature: 0.1,
          messages: sanitizedMessages,
        }),
      });

    const result = response.ok
      ? extractChatResult(response.payload, resolved.model, resolved.config.baseEndpoint, response.httpStatus, response.latencyMs)
      : this.failedChatResult(resolved.model, resolved.config.baseEndpoint, response.status, response.httpStatus, response.latencyMs, response.available);

    this.logChatEvent(result, sanitizedMessages);
    return result;
  }

  private resolveEndpoint(missingStatus: string): { config: LocalAgentModelEndpointConfig; model: string } | LocalAgentGatewayFailure {
    const endpoint = this.options.endpoint?.trim() || process.env.TF_LOCAL_MODEL_ENDPOINT?.trim() || '';
    const model = this.options.model?.trim() || process.env.TF_LOCAL_MODEL_NAME?.trim() || 'local-plan-assist';
    if (!endpoint) {
      return {
        status: missingStatus,
        model,
        endpoint: null,
      };
    }

    try {
      return {
        config: normalizeLoopbackEndpoint(endpoint),
        model,
      };
    } catch (error) {
      return {
        status: (error as Error).message,
        model,
        endpoint: safeEndpointText(endpoint),
      };
    }
  }

  private async requestJson(
    url: URL,
    init: {
      method: 'GET' | 'POST';
      body?: string;
    },
  ): Promise<{
    ok: boolean;
    available: boolean;
    status: string;
    httpStatus: number | null;
    latencyMs: number | null;
    payload: Record<string, unknown>;
  }> {
    const abortController = new AbortController();
    const timeoutMs = Math.max(250, this.options.timeoutMs ?? 1500);
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await (this.options.fetchImpl ?? fetch)(url, {
        method: init.method,
        headers: {
          'content-type': 'application/json',
        },
        body: init.body,
        signal: abortController.signal,
      });

      const payload = await tryParseJson(response);
      return {
        ok: response.ok,
        available: true,
        status: response.ok ? 'Local model endpoint request succeeded.' : `Local model endpoint returned HTTP ${response.status}.`,
        httpStatus: response.status,
        latencyMs: Date.now() - startedAt,
        payload,
      };
    } catch (error) {
      return {
        ok: false,
        available: false,
        status: error instanceof Error && error.name === 'AbortError'
          ? `Local model endpoint timed out after ${timeoutMs}ms.`
          : `Local model endpoint unavailable: ${(error as Error).message}`,
        httpStatus: null,
        latencyMs: Date.now() - startedAt,
        payload: {},
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private failedChatResult(
    model: string | null,
    endpoint: string | null,
    status: string,
    httpStatus: number | null = null,
    latencyMs: number | null = null,
    available = false,
  ): LocalAgentModelChatResult {
    return {
      ok: false,
      available,
      status,
      model,
      endpoint,
      httpStatus,
      latencyMs,
      finishReason: null,
      response: {
        role: 'assistant',
        text: 'No advisory response was produced.',
        advisoryOnly: true,
        toolCallsDetected: false,
      },
      usage: {
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
      },
    };
  }

  private logEvent(type: string, payload: Record<string, unknown>): void {
    if (!this.options.repoRoot) {
      return;
    }

    appendLocalAgentEvent(this.options.repoRoot, type, payload);
  }

  private logChatEvent(result: LocalAgentModelChatResult, messages: LocalAgentModelChatMessage[]): void {
    this.logEvent('model_gateway_chat_completed', {
      ok: result.ok,
      available: result.available,
      endpoint: result.endpoint,
      model: result.model,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      finishReason: result.finishReason,
      advisoryOnly: result.response.advisoryOnly,
      toolCallsDetected: result.response.toolCallsDetected,
      messageCount: messages.length,
      promptChars: messages.reduce((total, message) => total + redactSensitiveText(message.content).length, 0),
      assistantChars: redactSensitiveText(result.response.text).length,
      status: result.status,
    });
  }
}

function normalizeLoopbackEndpoint(rawEndpoint: string): LocalAgentModelEndpointConfig {
  const normalized = rawEndpoint.includes('://') ? rawEndpoint : `http://${rawEndpoint}`;
  const url = new URL(normalized);
  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1').toLowerCase();

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported model endpoint protocol: ${url.protocol}`);
  }

  if (url.username || url.password) {
    throw new Error('Model gateway endpoints must not embed credentials.');
  }

  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Model gateway only allows explicit loopback endpoints by default.');
  }

  const origin = url.origin;
  const normalizedPath = normalizeBasePath(url.pathname);
  return {
    baseEndpoint: `${origin}${normalizedPath}`,
    healthUrl: new URL('/health', origin),
    modelsUrl: new URL(`${normalizedPath}/models`, origin),
    chatUrl: new URL(`${normalizedPath}/chat/completions`, origin),
  };
}

function extractPlanDraft(payload: Record<string, unknown>): LocalAgentModelPlanDraft | null {
  const topLevel = toPlanShape(payload);
  if (topLevel) {
    return topLevel;
  }

  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  const message = choice && typeof choice === 'object'
    ? (choice as Record<string, unknown>).message
    : null;

  if (!message || typeof message !== 'object') {
    return null;
  }

  const messageRecord = message as Record<string, unknown>;
  const content = messageRecord.content;
  const direct = typeof content === 'string'
    ? parseJsonObject(content)
    : (content && typeof content === 'object' ? content as Record<string, unknown> : null);
  const toolCalls = Array.isArray(messageRecord.tool_calls) && messageRecord.tool_calls.length > 0;

  const draft = direct ? toPlanShape(direct) : null;
  if (!draft) {
    return null;
  }

  if (toolCalls) {
    draft.strippedUnsafeContent = true;
  }

  return draft;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function toPlanShape(candidate: Record<string, unknown>): LocalAgentModelPlanDraft | null {
  const taskSummary = asNullableTrimmedText(candidate.taskSummary ?? candidate.summary);
  const riskNotes = toTextList(candidate.riskNotes ?? candidate.risks);
  const candidateFiles = toTextList(candidate.candidateFiles ?? candidate.files);
  const strippedUnsafeContent = hasUnsafeAuthorityFields(candidate);

  if (!taskSummary && riskNotes.length === 0 && candidateFiles.length === 0) {
    return null;
  }

  return {
    taskSummary,
    riskNotes,
    candidateFiles,
    strippedUnsafeContent,
  };
}

function hasUnsafeAuthorityFields(candidate: Record<string, unknown>): boolean {
  return ['tool_calls', 'tools', 'patch', 'applyPatch', 'proofGates', 'lockCard', 'commands'].some(field => field in candidate);
}

function extractModels(payload: Record<string, unknown>): LocalAgentModelDescriptor[] {
  const entries = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.models)
      ? payload.models
      : [];

  return entries
    .filter(entry => entry && typeof entry === 'object')
    .map(entry => {
      const record = entry as Record<string, unknown>;
      return {
        id: asNullableTrimmedText(record.id) ?? 'unknown-model',
        ownedBy: asNullableTrimmedText(record.owned_by ?? record.ownedBy),
        created: typeof record.created === 'number' ? record.created : null,
      } satisfies LocalAgentModelDescriptor;
    });
}

function extractChatResult(
  payload: Record<string, unknown>,
  model: string | null,
  endpoint: string,
  httpStatus: number | null,
  latencyMs: number | null,
): LocalAgentModelChatResult {
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  const choiceRecord = choice && typeof choice === 'object' ? choice as Record<string, unknown> : {};
  const message = choiceRecord.message && typeof choiceRecord.message === 'object'
    ? choiceRecord.message as Record<string, unknown>
    : {};
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const content = extractAssistantContent(message.content);
  const toolNames = toolCalls
    .map(item => item && typeof item === 'object' ? item as Record<string, unknown> : {})
    .map(item => {
      const fn = item.function;
      return fn && typeof fn === 'object' ? asNullableTrimmedText((fn as Record<string, unknown>).name) : null;
    })
    .filter((value): value is string => Boolean(value));
  const toolCallsDetected = toolCalls.length > 0;
  const advisoryText = content
    ? content
    : toolCallsDetected
      ? `Assistant returned tool-like suggestions (${toolNames.join(', ') || 'unknown'}); treated as advisory text only.`
      : 'Assistant returned no text content.';
  const usage = payload.usage && typeof payload.usage === 'object'
    ? payload.usage as Record<string, unknown>
    : {};

  return {
    ok: true,
    available: true,
    status: 'Local model chat completed.',
    model: asNullableTrimmedText(payload.model) ?? model,
    endpoint,
    httpStatus,
    latencyMs,
    finishReason: asNullableTrimmedText(choiceRecord.finish_reason ?? choiceRecord.finishReason),
    response: {
      role: 'assistant',
      text: advisoryText,
      advisoryOnly: true,
      toolCallsDetected,
    },
    usage: {
      promptTokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : typeof usage.promptTokens === 'number' ? usage.promptTokens : null,
      completionTokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : typeof usage.completionTokens === 'number' ? usage.completionTokens : null,
      totalTokens: typeof usage.total_tokens === 'number' ? usage.total_tokens : typeof usage.totalTokens === 'number' ? usage.totalTokens : null,
    },
  };
}

function extractAssistantContent(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      const record = item as Record<string, unknown>;
      if (typeof record.text === 'string') {
        return record.text;
      }

      return record.type === 'text' && typeof record.value === 'string' ? record.value : '';
    })
    .join('')
    .trim();
}

async function tryParseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const text = await response.text();
    if (!text.trim()) {
      return {};
    }

    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function normalizeBasePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  if (!trimmed || trimmed === '/') {
    return '/v1';
  }

  if (trimmed.endsWith('/chat/completions')) {
    return trimmed.slice(0, -'/chat/completions'.length) || '/v1';
  }

  if (trimmed.endsWith('/models')) {
    return trimmed.slice(0, -'/models'.length) || '/v1';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function safeEndpointText(rawEndpoint: string): string {
  try {
    const url = new URL(rawEndpoint.includes('://') ? rawEndpoint : `http://${rawEndpoint}`);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return rawEndpoint.replace(/:[^:@/]+@/, ':***@');
  }
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]')
    .replace(/api[_-]?key\s*[:=]\s*[^\s,;]+/gi, 'api_key=[REDACTED]')
    .replace(/secret\s*[:=]\s*[^\s,;]+/gi, 'secret=[REDACTED]');
}

function asNullableTrimmedText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}
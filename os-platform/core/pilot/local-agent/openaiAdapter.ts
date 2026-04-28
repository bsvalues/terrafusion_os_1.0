import {
  aggregateChatStream,
  approximateTokenCount,
  type ModelAdapter,
  type ModelCapabilities,
  type ModelChatRequest,
  type ModelChunk,
  type ModelCompletion,
} from './modelAdapter.js';
import {
  assertApiKey,
  assertRemoteEnabled,
  iterateSseEvents,
  type RemoteTransport,
} from './remoteAdapter.js';

export interface OpenAIAdapterOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  transport?: RemoteTransport;
  capabilities?: Partial<ModelCapabilities>;
  env?: NodeJS.ProcessEnv;
  organization?: string;
}

const DEFAULT_BASE = 'https://api.openai.com';

export class OpenAIAdapter implements ModelAdapter {
  readonly name = 'openai';
  readonly capabilities: ModelCapabilities;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly transport: RemoteTransport;
  private readonly organization?: string;
  private closed = false;

  constructor(options: OpenAIAdapterOptions) {
    assertRemoteEnabled(options.env);
    assertApiKey(options.apiKey, 'openai');
    if (!options.model) throw new Error('OpenAIAdapter requires a model name');
    if (!options.transport) throw new Error('OpenAIAdapter requires an explicit transport');
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
    this.transport = options.transport;
    this.organization = options.organization;
    this.capabilities = {
      streaming: true,
      tools: true,
      vision: true,
      local: false,
      maxContextTokens: 128_000,
      ...options.capabilities,
    };
  }

  async *chat(request: ModelChatRequest, signal?: AbortSignal): AsyncIterable<ModelChunk> {
    if (this.closed) {
      yield { kind: 'error', text: 'openai adapter is closed' };
      return;
    }
    const messages = request.system
      ? [{ role: 'system', content: request.system }, ...request.messages]
      : request.messages;

    const payload: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    };
    if (typeof request.temperature === 'number') payload.temperature = request.temperature;
    if (typeof request.maxTokens === 'number') payload.max_tokens = request.maxTokens;
    if (request.stop && request.stop.length > 0) payload.stop = request.stop;

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      authorization: `Bearer ${this.apiKey}`,
    };
    if (this.organization) headers['openai-organization'] = this.organization;

    let response;
    try {
      response = await this.transport(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      yield { kind: 'error', text: `transport failed: ${(err as Error).message}` };
      return;
    }

    if (!response.ok || !response.body) {
      yield { kind: 'error', text: `openai http ${response.status}: ${response.errorText ?? ''}`.trim() };
      return;
    }

    for await (const evt of iterateSseEvents(response.body, signal)) {
      if (signal?.aborted) {
        yield { kind: 'error', text: 'aborted' };
        return;
      }
      const data = evt.data;
      if (!data) continue;
      if (data === '[DONE]') break;
      let parsed: { choices?: Array<{ delta?: { content?: string } }>; error?: { message?: string } };
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      if (parsed.error) {
        yield { kind: 'error', text: parsed.error.message ?? 'openai error' };
        return;
      }
      const text = parsed.choices?.[0]?.delta?.content;
      if (typeof text === 'string' && text.length > 0) {
        yield { kind: 'text', text };
      }
    }
    if (signal?.aborted) {
      yield { kind: 'error', text: 'aborted' };
      return;
    }
    yield { kind: 'done' };
  }

  async complete(request: ModelChatRequest, signal?: AbortSignal): Promise<ModelCompletion> {
    const promptTokens = request.messages.reduce(
      (sum, m) => sum + approximateTokenCount(m.content),
      0,
    );
    return aggregateChatStream(this.chat(request, signal), promptTokens);
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

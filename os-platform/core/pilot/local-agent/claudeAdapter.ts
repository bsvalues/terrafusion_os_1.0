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

export interface ClaudeAdapterOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  transport?: RemoteTransport;
  capabilities?: Partial<ModelCapabilities>;
  env?: NodeJS.ProcessEnv;
  apiVersion?: string;
}

const DEFAULT_BASE = 'https://api.anthropic.com';
const DEFAULT_VERSION = '2023-06-01';

export class ClaudeAdapter implements ModelAdapter {
  readonly name = 'claude';
  readonly capabilities: ModelCapabilities;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly transport: RemoteTransport;
  private readonly apiVersion: string;
  private closed = false;

  constructor(options: ClaudeAdapterOptions) {
    assertRemoteEnabled(options.env);
    assertApiKey(options.apiKey, 'claude');
    if (!options.model) throw new Error('ClaudeAdapter requires a model name');
    if (!options.transport) throw new Error('ClaudeAdapter requires an explicit transport');
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '');
    this.transport = options.transport;
    this.apiVersion = options.apiVersion ?? DEFAULT_VERSION;
    this.capabilities = {
      streaming: true,
      tools: true,
      vision: true,
      local: false,
      maxContextTokens: 200_000,
      ...options.capabilities,
    };
  }

  async *chat(request: ModelChatRequest, signal?: AbortSignal): AsyncIterable<ModelChunk> {
    if (this.closed) {
      yield { kind: 'error', text: 'claude adapter is closed' };
      return;
    }
    const system = request.system ?? request.messages.find(m => m.role === 'system')?.content;
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const payload: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: request.maxTokens ?? 1024,
      stream: true,
    };
    if (system) payload.system = system;
    if (typeof request.temperature === 'number') payload.temperature = request.temperature;
    if (request.stop && request.stop.length > 0) payload.stop_sequences = request.stop;

    let response;
    try {
      response = await this.transport(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      yield { kind: 'error', text: `transport failed: ${(err as Error).message}` };
      return;
    }

    if (!response.ok || !response.body) {
      yield { kind: 'error', text: `claude http ${response.status}: ${response.errorText ?? ''}`.trim() };
      return;
    }

    for await (const evt of iterateSseEvents(response.body, signal)) {
      if (signal?.aborted) {
        yield { kind: 'error', text: 'aborted' };
        return;
      }
      if (!evt.data) continue;
      let parsed: { type?: string; delta?: { type?: string; text?: string }; error?: { message?: string } };
      try {
        parsed = JSON.parse(evt.data);
      } catch {
        continue;
      }
      if (parsed.error) {
        yield { kind: 'error', text: parsed.error.message ?? 'claude error' };
        return;
      }
      if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta' && typeof parsed.delta.text === 'string') {
        yield { kind: 'text', text: parsed.delta.text };
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

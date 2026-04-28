import {
  aggregateChatStream,
  approximateTokenCount,
  type ModelAdapter,
  type ModelCapabilities,
  type ModelChatRequest,
  type ModelChunk,
  type ModelCompletion,
  type ModelMessage,
} from './modelAdapter.js';

export interface OllamaTransportResponse {
  ok: boolean;
  status: number;
  /** NDJSON line-yielding async iterable. Implementations MAY yield partial lines; the adapter buffers. */
  body: AsyncIterable<string> | null;
  /** Optional non-streaming text body for error responses. */
  errorText?: string;
}

export type OllamaTransport = (
  url: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<OllamaTransportResponse>;

export interface OllamaAdapterOptions {
  /** Loopback URL: must start with http://127.0.0.1: or http://localhost: */
  baseUrl?: string;
  /** Default model name (e.g., 'llama3'). */
  model: string;
  /** Optional override for tests. */
  transport?: OllamaTransport;
  /** Static capability override (e.g., to advertise tool support per model). */
  capabilities?: Partial<ModelCapabilities>;
}

const LOOPBACK_PREFIXES = ['http://127.0.0.1:', 'http://localhost:'];
const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';

function assertLoopback(baseUrl: string): void {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (!LOOPBACK_PREFIXES.some(p => trimmed.startsWith(p))) {
    throw new Error(
      `OllamaAdapter base URL must be loopback (got: ${baseUrl}). Allowed prefixes: ${LOOPBACK_PREFIXES.join(', ')}`,
    );
  }
}

function defaultFetchTransport(): OllamaTransport {
  return async (url, init) => {
    const fetchFn = (globalThis as { fetch?: typeof fetch }).fetch;
    if (typeof fetchFn !== 'function') {
      throw new Error('global fetch is not available; provide a transport explicitly');
    }
    const res = await fetchFn(url, init);
    if (!res.ok || !res.body) {
      const errorText = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, body: null, errorText };
    }
    const decoder = new TextDecoder();
    const stream = res.body;
    async function* iter() {
      const reader = (stream as ReadableStream<Uint8Array>).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          if (value) yield decoder.decode(value, { stream: true });
        }
      } finally {
        reader.releaseLock();
      }
    }
    return { ok: true, status: res.status, body: iter() };
  };
}

export class OllamaAdapter implements ModelAdapter {
  readonly name = 'ollama';
  readonly capabilities: ModelCapabilities;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly transport: OllamaTransport;
  private closed = false;

  constructor(options: OllamaAdapterOptions) {
    if (!options.model) throw new Error('OllamaAdapter requires a model name');
    const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    assertLoopback(baseUrl);
    this.baseUrl = baseUrl;
    this.model = options.model;
    this.transport = options.transport ?? defaultFetchTransport();
    this.capabilities = {
      streaming: true,
      tools: false,
      vision: false,
      local: true,
      maxContextTokens: 4096,
      ...options.capabilities,
    };
  }

  async *chat(request: ModelChatRequest, signal?: AbortSignal): AsyncIterable<ModelChunk> {
    if (this.closed) {
      yield { kind: 'error', text: 'ollama adapter is closed' };
      return;
    }

    const messages: ModelMessage[] = request.system
      ? [{ role: 'system', content: request.system }, ...request.messages]
      : request.messages;

    const payload = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
        stop: request.stop,
      },
    };

    let response: OllamaTransportResponse;
    try {
      response = await this.transport(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      yield { kind: 'error', text: `transport failed: ${(err as Error).message}` };
      return;
    }

    if (!response.ok || !response.body) {
      yield {
        kind: 'error',
        text: `ollama http ${response.status}: ${response.errorText ?? ''}`.trim(),
      };
      return;
    }

    let buffer = '';
    for await (const piece of response.body) {
      if (signal?.aborted) {
        yield { kind: 'error', text: 'aborted' };
        return;
      }
      buffer += piece;
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf('\n');
        if (!line) continue;
        const chunk = parseOllamaLine(line);
        if (chunk) yield chunk;
      }
    }
    if (signal?.aborted) {
      yield { kind: 'error', text: 'aborted' };
      return;
    }
    const tail = buffer.trim();
    if (tail) {
      const chunk = parseOllamaLine(tail);
      if (chunk) yield chunk;
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

function parseOllamaLine(line: string): ModelChunk | null {
  let parsed: { message?: { content?: string }; done?: boolean; error?: string };
  try {
    parsed = JSON.parse(line);
  } catch {
    return null; // malformed line — skip
  }
  if (parsed.error) {
    return { kind: 'error', text: parsed.error };
  }
  const text = parsed.message?.content;
  if (typeof text === 'string' && text.length > 0) {
    return { kind: 'text', text };
  }
  return null;
}

import {
  aggregateChatStream,
  approximateTokenCount,
  type ModelAdapter,
  type ModelCapabilities,
  type ModelChatRequest,
  type ModelChunk,
  type ModelCompletion,
} from './modelAdapter.js';

/**
 * Deterministic in-memory model adapter for tests.
 *
 * Configure responses with `respondTo(prompt, response)`. The adapter matches
 * the *last* user message text exactly. Unmatched prompts produce a fallback
 * response so streams never hang.
 */
export class FakeModelAdapter implements ModelAdapter {
  readonly name = 'fake';
  readonly capabilities: ModelCapabilities = {
    streaming: true,
    tools: false,
    vision: false,
    local: true,
    maxContextTokens: 4096,
  };

  private readonly scripted = new Map<string, string>();
  private fallback = '(fake) no scripted response';
  private closed = false;

  respondTo(prompt: string, response: string): this {
    this.scripted.set(prompt, response);
    return this;
  }

  setFallback(text: string): this {
    this.fallback = text;
    return this;
  }

  async *chat(request: ModelChatRequest, signal?: AbortSignal): AsyncIterable<ModelChunk> {
    if (this.closed) {
      yield { kind: 'error', text: 'fake adapter is closed' };
      return;
    }
    const lastUser = [...request.messages].reverse().find(m => m.role === 'user');
    const prompt = lastUser?.content ?? '';
    const response = this.scripted.get(prompt) ?? this.fallback;

    const words = response.split(/(\s+)/).filter(Boolean);
    for (const word of words) {
      if (signal?.aborted) {
        yield { kind: 'error', text: 'aborted' };
        return;
      }
      yield { kind: 'text', text: word };
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

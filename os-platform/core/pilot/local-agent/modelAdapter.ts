/**
 * Model adapter contract for the TerraFusion local agent.
 *
 * Every model backend (Ollama, Claude, OpenAI, …) implements this interface.
 * The contract is intentionally small and streaming-first.
 */

export interface ModelCapabilities {
  /** Adapter can stream tokens via `chat()`. */
  streaming: boolean;
  /** Adapter supports tool/function calling. */
  tools: boolean;
  /** Adapter accepts image inputs. */
  vision: boolean;
  /** Adapter runs entirely on the local machine (no remote network calls). */
  local: boolean;
  /** Maximum context window in tokens. */
  maxContextTokens: number;
}

export type ModelRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ModelMessage {
  role: ModelRole;
  content: string;
  /** Optional tool name when role = 'tool'. */
  toolName?: string;
}

export interface ModelChatRequest {
  messages: ModelMessage[];
  /** Optional system prompt prepended if not already present in messages. */
  system?: string;
  /** Sampling temperature, 0..2. Adapters may clamp. */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Stop sequences. */
  stop?: string[];
}

export type ModelChunkKind = 'text' | 'tool_call' | 'done' | 'error';

export interface ModelChunk {
  kind: ModelChunkKind;
  /** Text payload for kind='text'; error message for kind='error'. */
  text?: string;
  /** Tool call payload for kind='tool_call'. */
  toolCall?: { name: string; arguments: string };
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ModelCompletion {
  text: string;
  usage: ModelUsage;
}

export interface ModelAdapter {
  /** Stable adapter name (e.g., 'fake', 'ollama', 'claude'). */
  readonly name: string;
  /** Static capability flags. */
  readonly capabilities: ModelCapabilities;
  /** Streaming chat completion. */
  chat(request: ModelChatRequest, signal?: AbortSignal): AsyncIterable<ModelChunk>;
  /** Single-shot completion. Default impl can aggregate `chat`. */
  complete(request: ModelChatRequest, signal?: AbortSignal): Promise<ModelCompletion>;
  /** Release any resources. Idempotent. */
  close(): Promise<void>;
}

/** Approximate token count used by the fake adapter and as a default fallback. */
export function approximateTokenCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Aggregate an async chat stream into a single `ModelCompletion`. */
export async function aggregateChatStream(
  stream: AsyncIterable<ModelChunk>,
  promptTokens: number,
): Promise<ModelCompletion> {
  let text = '';
  let completionTokens = 0;
  for await (const chunk of stream) {
    if (chunk.kind === 'text' && chunk.text) {
      text += chunk.text;
      completionTokens += approximateTokenCount(chunk.text);
    } else if (chunk.kind === 'error') {
      throw new Error(chunk.text || 'model adapter error');
    }
  }
  return { text, usage: { promptTokens, completionTokens } };
}

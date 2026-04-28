import type { ModelCapabilities, ModelChatRequest, ModelChunk, ModelCompletion } from './modelAdapter.js';

/**
 * Newline-delimited JSON-RPC envelopes spoken by the local-agent daemon.
 *
 * Transport is path-based (Unix domain socket / Windows named pipe). No TCP.
 */

export interface DaemonRequest<P = unknown> {
  id: string;
  method: string;
  params?: P;
}

export interface DaemonResultFrame<R = unknown> {
  id: string;
  result: R;
}

export interface DaemonErrorFrame {
  id: string;
  error: { code: string; message: string };
}

export interface DaemonChunkFrame {
  id: string;
  chunk: ModelChunk;
}

export interface DaemonDoneFrame {
  id: string;
  done: true;
}

export type DaemonFrame =
  | DaemonResultFrame
  | DaemonErrorFrame
  | DaemonChunkFrame
  | DaemonDoneFrame;

export interface AdapterDescriptor {
  name: string;
  capabilities: ModelCapabilities;
}

export interface AdapterListResult {
  adapters: AdapterDescriptor[];
}

export interface AdapterCompleteParams {
  adapter: string;
  request: ModelChatRequest;
}

export interface AdapterCompleteResult {
  completion: ModelCompletion;
}

export interface AdapterChatParams {
  adapter: string;
  request: ModelChatRequest;
}

export interface AdapterCancelParams {
  /** id of the in-flight request to cancel. */
  id: string;
}

export interface AdapterCancelResult {
  cancelled: boolean;
}

export interface DaemonShutdownResult {
  ok: true;
}

export const DAEMON_METHODS = {
  ADAPTER_LIST: 'adapter.list',
  ADAPTER_COMPLETE: 'adapter.complete',
  ADAPTER_CHAT: 'adapter.chat',
  ADAPTER_CANCEL: 'adapter.cancel',
  DAEMON_SHUTDOWN: 'daemon.shutdown',
} as const;

export type DaemonMethod = typeof DAEMON_METHODS[keyof typeof DAEMON_METHODS];

export const DAEMON_ERROR_CODES = {
  UNKNOWN_METHOD: 'unknown_method',
  UNKNOWN_ADAPTER: 'unknown_adapter',
  INVALID_PARAMS: 'invalid_params',
  ADAPTER_ERROR: 'adapter_error',
  REQUEST_FAILED: 'request_failed',
  CONNECTION_CLOSED: 'connection_closed',
} as const;

export type DaemonErrorCode = typeof DAEMON_ERROR_CODES[keyof typeof DAEMON_ERROR_CODES];

/** Encode a frame as one newline-terminated JSON line. */
export function encodeFrame(frame: unknown): string {
  return `${JSON.stringify(frame)}\n`;
}

/** Stateful line splitter for the wire protocol. */
export function createLineSplitter(): {
  push(chunk: string): string[];
} {
  let buf = '';
  return {
    push(chunk: string): string[] {
      buf += chunk;
      const out: string[] = [];
      let idx: number;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.trim().length > 0) out.push(line);
      }
      return out;
    },
  };
}

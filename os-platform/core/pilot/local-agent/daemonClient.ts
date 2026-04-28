import * as net from 'node:net';

import {
  DAEMON_ERROR_CODES,
  DAEMON_METHODS,
  createLineSplitter,
  encodeFrame,
  type AdapterCancelResult,
  type AdapterChatParams,
  type AdapterCompleteParams,
  type AdapterCompleteResult,
  type AdapterListResult,
  type DaemonShutdownResult,
} from './daemonProtocol.js';
import type { ModelChunk } from './modelAdapter.js';

/**
 * Typed JSON-RPC client for the local-agent daemon.
 *
 * Connects over a path-based IPC socket. Multiplexes requests by id; matches
 * inbound frames to pending callers. Streams `chat` chunks via async iterator.
 */

interface PendingFinal {
  kind: 'final';
  resolve: (frame: unknown) => void;
  reject: (err: Error) => void;
}

interface PendingStream {
  kind: 'stream';
  push: (chunk: ModelChunk) => void;
  end: () => void;
  fail: (err: Error) => void;
}

type Pending = PendingFinal | PendingStream;

export class LocalAgentDaemonClient {
  private socket: net.Socket | null = null;
  private readonly pending = new Map<string, Pending>();
  private connectPromise: Promise<void> | null = null;
  private nextId = 0;

  /** Connect to the daemon at the given socket path. */
  async connect(socketPath: string): Promise<void> {
    if (this.socket) return;
    this.connectPromise = new Promise<void>((resolve, reject) => {
      const splitter = createLineSplitter();
      const socket = net.createConnection(socketPath);
      socket.setEncoding('utf8');
      socket.once('connect', () => {
        this.socket = socket;
        resolve();
      });
      socket.once('error', err => {
        if (!this.socket) reject(err);
      });
      socket.on('data', (chunk: string) => {
        for (const line of splitter.push(chunk)) this.onLine(line);
      });
      socket.on('close', () => {
        this.socket = null;
        const closed = new Error('daemon connection closed');
        for (const p of this.pending.values()) {
          if (p.kind === 'final') p.reject(closed);
          else p.fail(closed);
        }
        this.pending.clear();
      });
    });
    return this.connectPromise;
  }

  /** Close the IPC socket. Pending requests reject with a connection error. */
  async close(): Promise<void> {
    const socket = this.socket;
    if (!socket) return;
    this.socket = null;
    await new Promise<void>(resolve => {
      socket.end(() => resolve());
    });
  }

  isConnected(): boolean {
    return this.socket !== null;
  }

  async listAdapters(): Promise<AdapterListResult> {
    return this.sendFinal<AdapterListResult>(DAEMON_METHODS.ADAPTER_LIST, undefined);
  }

  async complete(params: AdapterCompleteParams): Promise<AdapterCompleteResult> {
    return this.sendFinal<AdapterCompleteResult>(DAEMON_METHODS.ADAPTER_COMPLETE, params);
  }

  /** Streaming chat. The returned object exposes `id` for cancellation. */
  chat(params: AdapterChatParams): { id: string; stream: AsyncIterable<ModelChunk> } {
    const id = this.allocateId();
    const queue: ModelChunk[] = [];
    let ended = false;
    let failure: Error | null = null;
    let waiter: { resolve: (v: IteratorResult<ModelChunk>) => void; reject: (e: Error) => void } | null = null;

    const drain = (): void => {
      if (!waiter) return;
      const w = waiter;
      if (queue.length > 0) {
        const chunk = queue.shift()!;
        waiter = null;
        w.resolve({ value: chunk, done: false });
      } else if (failure) {
        waiter = null;
        w.reject(failure);
      } else if (ended) {
        waiter = null;
        w.resolve({ value: undefined, done: true });
      }
    };

    this.pending.set(id, {
      kind: 'stream',
      push(chunk) { queue.push(chunk); drain(); },
      end() { ended = true; drain(); },
      fail(err) { failure = err; drain(); },
    });

    this.writeFrame({ id, method: DAEMON_METHODS.ADAPTER_CHAT, params });

    const stream: AsyncIterable<ModelChunk> = {
      [Symbol.asyncIterator]: () => ({
        next: (): Promise<IteratorResult<ModelChunk>> =>
          new Promise<IteratorResult<ModelChunk>>((resolve, reject) => {
            waiter = { resolve, reject };
            drain();
          }),
      }),
    };

    return { id, stream };
  }

  async cancel(targetId: string): Promise<AdapterCancelResult> {
    return this.sendFinal<AdapterCancelResult>(DAEMON_METHODS.ADAPTER_CANCEL, { id: targetId });
  }

  async shutdown(): Promise<DaemonShutdownResult> {
    return this.sendFinal<DaemonShutdownResult>(DAEMON_METHODS.DAEMON_SHUTDOWN, undefined);
  }

  private allocateId(): string {
    this.nextId += 1;
    return `req-${this.nextId}`;
  }

  private writeFrame(frame: unknown): void {
    const socket = this.socket;
    if (!socket || socket.destroyed) {
      throw new Error('daemon client not connected');
    }
    socket.write(encodeFrame(frame));
  }

  private sendFinal<R>(method: string, params: unknown): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const id = this.allocateId();
      this.pending.set(id, {
        kind: 'final',
        resolve: frame => {
          const f = frame as { result?: R; error?: { code: string; message: string } };
          if (f.error) {
            reject(new Error(`${f.error.code}: ${f.error.message}`));
          } else {
            resolve(f.result as R);
          }
        },
        reject,
      });
      try {
        this.writeFrame({ id, method, params });
      } catch (err) {
        this.pending.delete(id);
        reject(err as Error);
      }
    });
  }

  private onLine(line: string): void {
    let frame: { id?: string; result?: unknown; error?: { code: string; message: string }; chunk?: ModelChunk; done?: true };
    try {
      frame = JSON.parse(line);
    } catch {
      return;
    }
    if (!frame || typeof frame.id !== 'string') return;
    const pending = this.pending.get(frame.id);
    if (!pending) return;
    if (pending.kind === 'final') {
      this.pending.delete(frame.id);
      pending.resolve(frame);
      return;
    }
    // stream
    if (frame.error) {
      this.pending.delete(frame.id);
      pending.fail(new Error(`${frame.error.code}: ${frame.error.message}`));
      return;
    }
    if (frame.done) {
      this.pending.delete(frame.id);
      pending.end();
      return;
    }
    if (frame.chunk) {
      pending.push(frame.chunk);
    }
  }
}

export { DAEMON_ERROR_CODES };

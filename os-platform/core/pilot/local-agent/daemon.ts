import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';

import type { AdapterRegistry } from './adapterRegistry.js';
import {
  DAEMON_ERROR_CODES,
  DAEMON_METHODS,
  createLineSplitter,
  encodeFrame,
  type AdapterCancelParams,
  type AdapterChatParams,
  type AdapterCompleteParams,
  type DaemonRequest,
} from './daemonProtocol.js';

/**
 * Local-agent daemon.
 *
 * Owns an `AdapterRegistry` and exposes it over a path-based IPC channel
 * (Unix domain socket / Windows named pipe). Speaks newline-delimited
 * JSON-RPC. No TCP listener is ever created — by construction this daemon
 * is unreachable from off-host.
 */

export interface LocalAgentDaemonOptions {
  registry: AdapterRegistry;
}

interface InFlight {
  controller: AbortController;
  socket: net.Socket;
}

export class LocalAgentDaemon {
  private readonly registry: AdapterRegistry;
  private server: net.Server | null = null;
  private readonly inFlight = new Map<string, InFlight>();

  constructor(options: LocalAgentDaemonOptions) {
    this.registry = options.registry;
  }

  /** Bind the IPC socket. Resolves once the server is listening. */
  async start(socketPath: string): Promise<void> {
    if (this.server) {
      throw new Error('daemon already started');
    }
    const server = net.createServer(socket => this.handleSocket(socket));
    this.server = server;
    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error): void => {
        server.off('listening', onListening);
        this.server = null;
        reject(err);
      };
      const onListening = (): void => {
        server.off('error', onError);
        resolve();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(socketPath);
    });
  }

  /** Close the IPC socket and cancel every in-flight request. */
  async stop(): Promise<void> {
    const server = this.server;
    if (!server) return;
    this.server = null;
    for (const entry of this.inFlight.values()) {
      entry.controller.abort();
      entry.socket.destroy();
    }
    this.inFlight.clear();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  private handleSocket(socket: net.Socket): void {
    socket.setEncoding('utf8');
    const splitter = createLineSplitter();
    socket.on('data', (chunk: string) => {
      for (const line of splitter.push(chunk)) {
        let req: DaemonRequest | null = null;
        try {
          req = JSON.parse(line) as DaemonRequest;
        } catch {
          continue;
        }
        if (!req || typeof req.id !== 'string' || typeof req.method !== 'string') continue;
        void this.dispatch(socket, req);
      }
    });
    socket.on('error', () => {
      /* socket errors are surfaced through abort of in-flight requests */
    });
    socket.on('close', () => {
      for (const [id, entry] of this.inFlight) {
        if (entry.socket === socket) {
          entry.controller.abort();
          this.inFlight.delete(id);
        }
      }
    });
  }

  private send(socket: net.Socket, frame: unknown): void {
    if (socket.destroyed || !socket.writable) return;
    socket.write(encodeFrame(frame));
  }

  private async dispatch(socket: net.Socket, req: DaemonRequest): Promise<void> {
    const { id, method, params } = req;
    try {
      switch (method) {
        case DAEMON_METHODS.ADAPTER_LIST: {
          const adapters = this.registry.list().map(a => ({
            name: a.name,
            capabilities: a.capabilities,
          }));
          this.send(socket, { id, result: { adapters } });
          return;
        }

        case DAEMON_METHODS.ADAPTER_COMPLETE: {
          const p = params as AdapterCompleteParams | undefined;
          if (!p || typeof p.adapter !== 'string' || !p.request) {
            this.sendError(socket, id, DAEMON_ERROR_CODES.INVALID_PARAMS, 'invalid params');
            return;
          }
          const adapter = this.registry.get(p.adapter);
          if (!adapter) {
            this.sendError(socket, id, DAEMON_ERROR_CODES.UNKNOWN_ADAPTER, `unknown adapter: ${p.adapter}`);
            return;
          }
          const controller = new AbortController();
          this.inFlight.set(id, { controller, socket });
          try {
            const completion = await adapter.complete(p.request, controller.signal);
            this.send(socket, { id, result: { completion } });
          } finally {
            this.inFlight.delete(id);
          }
          return;
        }

        case DAEMON_METHODS.ADAPTER_CHAT: {
          const p = params as AdapterChatParams | undefined;
          if (!p || typeof p.adapter !== 'string' || !p.request) {
            this.sendError(socket, id, DAEMON_ERROR_CODES.INVALID_PARAMS, 'invalid params');
            return;
          }
          const adapter = this.registry.get(p.adapter);
          if (!adapter) {
            this.sendError(socket, id, DAEMON_ERROR_CODES.UNKNOWN_ADAPTER, `unknown adapter: ${p.adapter}`);
            return;
          }
          const controller = new AbortController();
          this.inFlight.set(id, { controller, socket });
          try {
            for await (const chunk of adapter.chat(p.request, controller.signal)) {
              if (chunk.kind === 'error') {
                this.sendError(
                  socket,
                  id,
                  DAEMON_ERROR_CODES.ADAPTER_ERROR,
                  chunk.text ?? 'adapter error',
                );
                return;
              }
              if (chunk.kind === 'done') break;
              this.send(socket, { id, chunk });
            }
            this.send(socket, { id, done: true });
          } finally {
            this.inFlight.delete(id);
          }
          return;
        }

        case DAEMON_METHODS.ADAPTER_CANCEL: {
          const p = params as AdapterCancelParams | undefined;
          const targetId = p?.id;
          let cancelled = false;
          if (typeof targetId === 'string') {
            const entry = this.inFlight.get(targetId);
            if (entry) {
              entry.controller.abort();
              cancelled = true;
            }
          }
          this.send(socket, { id, result: { cancelled } });
          return;
        }

        case DAEMON_METHODS.DAEMON_SHUTDOWN: {
          this.send(socket, { id, result: { ok: true } });
          setImmediate(() => {
            void this.stop();
          });
          return;
        }

        default:
          this.sendError(socket, id, DAEMON_ERROR_CODES.UNKNOWN_METHOD, `unknown method: ${method}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.sendError(socket, id, DAEMON_ERROR_CODES.REQUEST_FAILED, message);
      this.inFlight.delete(id);
    }
  }

  private sendError(socket: net.Socket, id: string, code: string, message: string): void {
    this.send(socket, { id, error: { code, message } });
  }
}

/** Default IPC socket path. Path-based on POSIX, named pipe on Windows. */
export function defaultDaemonSocketPath(pid: number = process.pid): string {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\terrafusion-local-agent-${pid}`;
  }
  return path.join(os.tmpdir(), `terrafusion-local-agent-${pid}.sock`);
}

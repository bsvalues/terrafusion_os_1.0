// GENERATED - DO NOT EDIT
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAgentDaemon = void 0;
exports.defaultDaemonSocketPath = defaultDaemonSocketPath;
const net = __importStar(require("node:net"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const daemonProtocol_js_1 = require("./daemonProtocol.js");
class LocalAgentDaemon {
    constructor(options) {
        this.server = null;
        this.inFlight = new Map();
        this.registry = options.registry;
    }
    /** Bind the IPC socket. Resolves once the server is listening. */
    async start(socketPath) {
        if (this.server) {
            throw new Error('daemon already started');
        }
        const server = net.createServer(socket => this.handleSocket(socket));
        this.server = server;
        await new Promise((resolve, reject) => {
            const onError = (err) => {
                server.off('listening', onListening);
                this.server = null;
                reject(err);
            };
            const onListening = () => {
                server.off('error', onError);
                resolve();
            };
            server.once('error', onError);
            server.once('listening', onListening);
            server.listen(socketPath);
        });
    }
    /** Close the IPC socket and cancel every in-flight request. */
    async stop() {
        const server = this.server;
        if (!server)
            return;
        this.server = null;
        for (const entry of this.inFlight.values()) {
            entry.controller.abort();
            entry.socket.destroy();
        }
        this.inFlight.clear();
        await new Promise(resolve => server.close(() => resolve()));
    }
    isRunning() {
        return this.server !== null;
    }
    handleSocket(socket) {
        socket.setEncoding('utf8');
        const splitter = (0, daemonProtocol_js_1.createLineSplitter)();
        socket.on('data', (chunk) => {
            for (const line of splitter.push(chunk)) {
                let req = null;
                try {
                    req = JSON.parse(line);
                }
                catch {
                    continue;
                }
                if (!req || typeof req.id !== 'string' || typeof req.method !== 'string')
                    continue;
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
    send(socket, frame) {
        if (socket.destroyed || !socket.writable)
            return;
        socket.write((0, daemonProtocol_js_1.encodeFrame)(frame));
    }
    async dispatch(socket, req) {
        const { id, method, params } = req;
        try {
            switch (method) {
                case daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_LIST: {
                    const adapters = this.registry.list().map(a => ({
                        name: a.name,
                        capabilities: a.capabilities,
                    }));
                    this.send(socket, { id, result: { adapters } });
                    return;
                }
                case daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_COMPLETE: {
                    const p = params;
                    if (!p || typeof p.adapter !== 'string' || !p.request) {
                        this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.INVALID_PARAMS, 'invalid params');
                        return;
                    }
                    const adapter = this.registry.get(p.adapter);
                    if (!adapter) {
                        this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.UNKNOWN_ADAPTER, `unknown adapter: ${p.adapter}`);
                        return;
                    }
                    const controller = new AbortController();
                    this.inFlight.set(id, { controller, socket });
                    try {
                        const completion = await adapter.complete(p.request, controller.signal);
                        this.send(socket, { id, result: { completion } });
                    }
                    finally {
                        this.inFlight.delete(id);
                    }
                    return;
                }
                case daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_CHAT: {
                    const p = params;
                    if (!p || typeof p.adapter !== 'string' || !p.request) {
                        this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.INVALID_PARAMS, 'invalid params');
                        return;
                    }
                    const adapter = this.registry.get(p.adapter);
                    if (!adapter) {
                        this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.UNKNOWN_ADAPTER, `unknown adapter: ${p.adapter}`);
                        return;
                    }
                    const controller = new AbortController();
                    this.inFlight.set(id, { controller, socket });
                    try {
                        for await (const chunk of adapter.chat(p.request, controller.signal)) {
                            if (chunk.kind === 'error') {
                                this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.ADAPTER_ERROR, chunk.text ?? 'adapter error');
                                return;
                            }
                            if (chunk.kind === 'done')
                                break;
                            this.send(socket, { id, chunk });
                        }
                        this.send(socket, { id, done: true });
                    }
                    finally {
                        this.inFlight.delete(id);
                    }
                    return;
                }
                case daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_CANCEL: {
                    const p = params;
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
                case daemonProtocol_js_1.DAEMON_METHODS.DAEMON_SHUTDOWN: {
                    this.send(socket, { id, result: { ok: true } });
                    setImmediate(() => {
                        void this.stop();
                    });
                    return;
                }
                default:
                    this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.UNKNOWN_METHOD, `unknown method: ${method}`);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.sendError(socket, id, daemonProtocol_js_1.DAEMON_ERROR_CODES.REQUEST_FAILED, message);
            this.inFlight.delete(id);
        }
    }
    sendError(socket, id, code, message) {
        this.send(socket, { id, error: { code, message } });
    }
}
exports.LocalAgentDaemon = LocalAgentDaemon;
/** Default IPC socket path. Path-based on POSIX, named pipe on Windows. */
function defaultDaemonSocketPath(pid = process.pid) {
    if (process.platform === 'win32') {
        return `\\\\.\\pipe\\terrafusion-local-agent-${pid}`;
    }
    return path.join(os.tmpdir(), `terrafusion-local-agent-${pid}.sock`);
}

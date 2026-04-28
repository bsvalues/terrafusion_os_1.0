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
exports.DAEMON_ERROR_CODES = exports.LocalAgentDaemonClient = void 0;
const net = __importStar(require("node:net"));
const daemonProtocol_js_1 = require("./daemonProtocol.js");
Object.defineProperty(exports, "DAEMON_ERROR_CODES", { enumerable: true, get: function () { return daemonProtocol_js_1.DAEMON_ERROR_CODES; } });
class LocalAgentDaemonClient {
    constructor() {
        this.socket = null;
        this.pending = new Map();
        this.connectPromise = null;
        this.nextId = 0;
    }
    /** Connect to the daemon at the given socket path. */
    async connect(socketPath) {
        if (this.socket)
            return;
        this.connectPromise = new Promise((resolve, reject) => {
            const splitter = (0, daemonProtocol_js_1.createLineSplitter)();
            const socket = net.createConnection(socketPath);
            socket.setEncoding('utf8');
            socket.once('connect', () => {
                this.socket = socket;
                resolve();
            });
            socket.once('error', err => {
                if (!this.socket)
                    reject(err);
            });
            socket.on('data', (chunk) => {
                for (const line of splitter.push(chunk))
                    this.onLine(line);
            });
            socket.on('close', () => {
                this.socket = null;
                const closed = new Error('daemon connection closed');
                for (const p of this.pending.values()) {
                    if (p.kind === 'final')
                        p.reject(closed);
                    else
                        p.fail(closed);
                }
                this.pending.clear();
            });
        });
        return this.connectPromise;
    }
    /** Close the IPC socket. Pending requests reject with a connection error. */
    async close() {
        const socket = this.socket;
        if (!socket)
            return;
        this.socket = null;
        await new Promise(resolve => {
            socket.end(() => resolve());
        });
    }
    isConnected() {
        return this.socket !== null;
    }
    async listAdapters() {
        return this.sendFinal(daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_LIST, undefined);
    }
    async complete(params) {
        return this.sendFinal(daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_COMPLETE, params);
    }
    /** Streaming chat. The returned object exposes `id` for cancellation. */
    chat(params) {
        const id = this.allocateId();
        const queue = [];
        let ended = false;
        let failure = null;
        let waiter = null;
        const drain = () => {
            if (!waiter)
                return;
            const w = waiter;
            if (queue.length > 0) {
                const chunk = queue.shift();
                waiter = null;
                w.resolve({ value: chunk, done: false });
            }
            else if (failure) {
                waiter = null;
                w.reject(failure);
            }
            else if (ended) {
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
        this.writeFrame({ id, method: daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_CHAT, params });
        const stream = {
            [Symbol.asyncIterator]: () => ({
                next: () => new Promise((resolve, reject) => {
                    waiter = { resolve, reject };
                    drain();
                }),
            }),
        };
        return { id, stream };
    }
    async cancel(targetId) {
        return this.sendFinal(daemonProtocol_js_1.DAEMON_METHODS.ADAPTER_CANCEL, { id: targetId });
    }
    async shutdown() {
        return this.sendFinal(daemonProtocol_js_1.DAEMON_METHODS.DAEMON_SHUTDOWN, undefined);
    }
    allocateId() {
        this.nextId += 1;
        return `req-${this.nextId}`;
    }
    writeFrame(frame) {
        const socket = this.socket;
        if (!socket || socket.destroyed) {
            throw new Error('daemon client not connected');
        }
        socket.write((0, daemonProtocol_js_1.encodeFrame)(frame));
    }
    sendFinal(method, params) {
        return new Promise((resolve, reject) => {
            const id = this.allocateId();
            this.pending.set(id, {
                kind: 'final',
                resolve: frame => {
                    const f = frame;
                    if (f.error) {
                        reject(new Error(`${f.error.code}: ${f.error.message}`));
                    }
                    else {
                        resolve(f.result);
                    }
                },
                reject,
            });
            try {
                this.writeFrame({ id, method, params });
            }
            catch (err) {
                this.pending.delete(id);
                reject(err);
            }
        });
    }
    onLine(line) {
        let frame;
        try {
            frame = JSON.parse(line);
        }
        catch {
            return;
        }
        if (!frame || typeof frame.id !== 'string')
            return;
        const pending = this.pending.get(frame.id);
        if (!pending)
            return;
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
exports.LocalAgentDaemonClient = LocalAgentDaemonClient;

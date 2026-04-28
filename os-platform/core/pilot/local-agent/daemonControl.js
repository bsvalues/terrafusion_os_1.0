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
exports.DAEMON_RECORD_VERSION = void 0;
exports.daemonStatus = daemonStatus;
exports.daemonStop = daemonStop;
exports.daemonStart = daemonStart;
exports.renderDaemonStartResult = renderDaemonStartResult;
exports.renderDaemonStopResult = renderDaemonStopResult;
exports.renderDaemonStatusResult = renderDaemonStatusResult;
exports.defaultDaemonRecordPath = defaultDaemonRecordPath;
const node_fs_1 = require("node:fs");
const net = __importStar(require("node:net"));
const node_path_1 = require("node:path");
const adapterRegistry_js_1 = require("./adapterRegistry.js");
const daemon_js_1 = require("./daemon.js");
const daemonClient_js_1 = require("./daemonClient.js");
const eventLog_js_1 = require("./eventLog.js");
exports.DAEMON_RECORD_VERSION = 1;
function defaultRecordPath(repoRoot) {
    return (0, eventLog_js_1.terrafusionPath)(repoRoot, 'local-agent', 'daemon.json');
}
function readRecord(recordPath) {
    if (!(0, node_fs_1.existsSync)(recordPath))
        return null;
    try {
        const raw = (0, node_fs_1.readFileSync)(recordPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (typeof parsed.pid === 'number' &&
            typeof parsed.socketPath === 'string' &&
            typeof parsed.startedAt === 'number' &&
            parsed.version === exports.DAEMON_RECORD_VERSION) {
            return parsed;
        }
        return null;
    }
    catch {
        return null;
    }
}
function writeRecord(recordPath, record) {
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(recordPath), { recursive: true });
    (0, node_fs_1.writeFileSync)(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}
function removeRecord(recordPath) {
    if ((0, node_fs_1.existsSync)(recordPath))
        (0, node_fs_1.rmSync)(recordPath, { force: true });
}
/** Quick reachability probe — connect to the socket, immediately disconnect. */
async function probeSocket(socketPath, timeoutMs = 500) {
    return new Promise(resolveProbe => {
        let settled = false;
        const sock = net.createConnection(socketPath);
        const finish = (ok) => {
            if (settled)
                return;
            settled = true;
            sock.removeAllListeners();
            sock.destroy();
            resolveProbe(ok);
        };
        const timer = setTimeout(() => finish(false), timeoutMs);
        sock.once('connect', () => {
            clearTimeout(timer);
            finish(true);
        });
        sock.once('error', () => {
            clearTimeout(timer);
            finish(false);
        });
    });
}
/**
 * Check status from a record file alone — no in-process daemon required.
 */
async function daemonStatus(paths) {
    const recordPath = paths.recordPath ?? defaultRecordPath(paths.repoRoot);
    const record = readRecord(recordPath);
    if (!record)
        return { running: false, recordPath };
    const reachable = await probeSocket(record.socketPath);
    if (!reachable) {
        return { running: false, pid: record.pid, socketPath: record.socketPath, recordPath };
    }
    return {
        running: true,
        pid: record.pid,
        socketPath: record.socketPath,
        recordPath,
    };
}
/**
 * Send `daemon.shutdown` to the recorded daemon and remove the record.
 * Idempotent: if no record exists, returns `{ status: 'not-running' }`.
 */
async function daemonStop(paths) {
    const recordPath = paths.recordPath ?? defaultRecordPath(paths.repoRoot);
    const record = readRecord(recordPath);
    if (!record)
        return { status: 'not-running', recordPath };
    const reachable = await probeSocket(record.socketPath);
    if (reachable) {
        const client = new daemonClient_js_1.LocalAgentDaemonClient();
        try {
            await client.connect(record.socketPath);
            await client.shutdown().catch(() => undefined);
        }
        finally {
            await client.close().catch(() => undefined);
        }
    }
    removeRecord(recordPath);
    (0, eventLog_js_1.appendLocalAgentEvent)(paths.repoRoot, 'local_agent_daemon_stopped', {
        pid: record.pid,
        socketPath: record.socketPath,
    });
    return { status: 'stopped', recordPath };
}
/**
 * Start an in-process daemon. The caller owns the returned daemon instance.
 *
 * If a record exists and is reachable, returns `already-running` without
 * starting a second daemon. If a record exists but is stale, it is removed
 * before starting fresh.
 */
async function daemonStart(paths) {
    const recordPath = paths.recordPath ?? defaultRecordPath(paths.repoRoot);
    const existing = readRecord(recordPath);
    if (existing) {
        const reachable = await probeSocket(existing.socketPath);
        if (reachable) {
            return {
                result: {
                    status: 'already-running',
                    pid: existing.pid,
                    socketPath: existing.socketPath,
                    recordPath,
                },
                daemon: null,
            };
        }
        removeRecord(recordPath);
    }
    const registry = new adapterRegistry_js_1.AdapterRegistry();
    const daemon = new daemon_js_1.LocalAgentDaemon({ registry });
    const socketPath = paths.socketPath ?? (0, daemon_js_1.defaultDaemonSocketPath)(process.pid);
    await daemon.start(socketPath);
    const record = {
        pid: process.pid,
        socketPath,
        startedAt: Math.floor(Date.now() / 1000),
        version: exports.DAEMON_RECORD_VERSION,
    };
    writeRecord(recordPath, record);
    (0, eventLog_js_1.appendLocalAgentEvent)(paths.repoRoot, 'local_agent_daemon_started', {
        pid: record.pid,
        socketPath: record.socketPath,
    });
    return {
        result: { status: 'started', pid: record.pid, socketPath, recordPath },
        daemon,
    };
}
/** Render helpers for the CLI. */
function renderDaemonStartResult(r) {
    const lines = [
        'TerraFusion Local Agent Daemon',
        '',
        `Status:      ${r.status}`,
        `PID:         ${r.pid}`,
        `Socket:      ${r.socketPath}`,
        `Record:      ${r.recordPath}`,
    ];
    return lines.join('\n');
}
function renderDaemonStopResult(r) {
    return [
        'TerraFusion Local Agent Daemon',
        '',
        `Status:      ${r.status}`,
        `Record:      ${r.recordPath}`,
    ].join('\n');
}
function renderDaemonStatusResult(r) {
    const lines = [
        'TerraFusion Local Agent Daemon',
        '',
        `Running:     ${r.running ? 'yes' : 'no'}`,
    ];
    if (r.pid !== undefined)
        lines.push(`PID:         ${r.pid}`);
    if (r.socketPath)
        lines.push(`Socket:      ${r.socketPath}`);
    lines.push(`Record:      ${r.recordPath}`);
    return lines.join('\n');
}
function defaultDaemonRecordPath(repoRoot) {
    return defaultRecordPath((0, node_path_1.resolve)(repoRoot));
}

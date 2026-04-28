import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import * as net from 'node:net';
import { dirname, resolve } from 'node:path';

import { AdapterRegistry } from './adapterRegistry.js';
import {
  LocalAgentDaemon,
  defaultDaemonSocketPath,
} from './daemon.js';
import { LocalAgentDaemonClient } from './daemonClient.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

/**
 * Founder-facing control plane for the local-agent daemon.
 *
 * Persists a single record under `.terrafusion/local-agent/daemon.json`
 * with `{ pid, socketPath, startedAt, version }`. The record is the only
 * way `tf agent daemon stop|status` find a running daemon.
 */

export interface DaemonRecord {
  pid: number;
  socketPath: string;
  startedAt: number;
  version: 1;
}

export interface DaemonControlPaths {
  /** Repo root used to locate `.terrafusion/`. */
  repoRoot: string;
  /** Override the daemon record path. Tests use this. */
  recordPath?: string;
  /** Override the IPC socket path. Tests use this. */
  socketPath?: string;
}

export interface DaemonStartResult {
  status: 'started' | 'already-running';
  pid: number;
  socketPath: string;
  recordPath: string;
}

export interface DaemonStopResult {
  status: 'stopped' | 'not-running';
  recordPath: string;
}

export interface DaemonStatusResult {
  running: boolean;
  pid?: number;
  socketPath?: string;
  recordPath: string;
}

export const DAEMON_RECORD_VERSION = 1;

function defaultRecordPath(repoRoot: string): string {
  return terrafusionPath(repoRoot, 'local-agent', 'daemon.json');
}

function readRecord(recordPath: string): DaemonRecord | null {
  if (!existsSync(recordPath)) return null;
  try {
    const raw = readFileSync(recordPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DaemonRecord>;
    if (
      typeof parsed.pid === 'number' &&
      typeof parsed.socketPath === 'string' &&
      typeof parsed.startedAt === 'number' &&
      parsed.version === DAEMON_RECORD_VERSION
    ) {
      return parsed as DaemonRecord;
    }
    return null;
  } catch {
    return null;
  }
}

function writeRecord(recordPath: string, record: DaemonRecord): void {
  mkdirSync(dirname(recordPath), { recursive: true });
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

function removeRecord(recordPath: string): void {
  if (existsSync(recordPath)) rmSync(recordPath, { force: true });
}

/** Quick reachability probe — connect to the socket, immediately disconnect. */
async function probeSocket(socketPath: string, timeoutMs = 500): Promise<boolean> {
  return new Promise<boolean>(resolveProbe => {
    let settled = false;
    const sock = net.createConnection(socketPath);
    const finish = (ok: boolean): void => {
      if (settled) return;
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
export async function daemonStatus(paths: DaemonControlPaths): Promise<DaemonStatusResult> {
  const recordPath = paths.recordPath ?? defaultRecordPath(paths.repoRoot);
  const record = readRecord(recordPath);
  if (!record) return { running: false, recordPath };
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
export async function daemonStop(paths: DaemonControlPaths): Promise<DaemonStopResult> {
  const recordPath = paths.recordPath ?? defaultRecordPath(paths.repoRoot);
  const record = readRecord(recordPath);
  if (!record) return { status: 'not-running', recordPath };

  const reachable = await probeSocket(record.socketPath);
  if (reachable) {
    const client = new LocalAgentDaemonClient();
    try {
      await client.connect(record.socketPath);
      await client.shutdown().catch(() => undefined);
    } finally {
      await client.close().catch(() => undefined);
    }
  }
  removeRecord(recordPath);
  appendLocalAgentEvent(paths.repoRoot, 'local_agent_daemon_stopped', {
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
export async function daemonStart(
  paths: DaemonControlPaths,
): Promise<{ result: DaemonStartResult; daemon: LocalAgentDaemon | null }> {
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

  const registry = new AdapterRegistry();

  const daemon = new LocalAgentDaemon({ registry });
  const socketPath = paths.socketPath ?? defaultDaemonSocketPath(process.pid);
  await daemon.start(socketPath);

  const record: DaemonRecord = {
    pid: process.pid,
    socketPath,
    startedAt: Math.floor(Date.now() / 1000),
    version: DAEMON_RECORD_VERSION,
  };
  writeRecord(recordPath, record);
  appendLocalAgentEvent(paths.repoRoot, 'local_agent_daemon_started', {
    pid: record.pid,
    socketPath: record.socketPath,
  });

  return {
    result: { status: 'started', pid: record.pid, socketPath, recordPath },
    daemon,
  };
}

/** Render helpers for the CLI. */
export function renderDaemonStartResult(r: DaemonStartResult): string {
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

export function renderDaemonStopResult(r: DaemonStopResult): string {
  return [
    'TerraFusion Local Agent Daemon',
    '',
    `Status:      ${r.status}`,
    `Record:      ${r.recordPath}`,
  ].join('\n');
}

export function renderDaemonStatusResult(r: DaemonStatusResult): string {
  const lines = [
    'TerraFusion Local Agent Daemon',
    '',
    `Running:     ${r.running ? 'yes' : 'no'}`,
  ];
  if (r.pid !== undefined) lines.push(`PID:         ${r.pid}`);
  if (r.socketPath) lines.push(`Socket:      ${r.socketPath}`);
  lines.push(`Record:      ${r.recordPath}`);
  return lines.join('\n');
}

export function defaultDaemonRecordPath(repoRoot: string): string {
  return defaultRecordPath(resolve(repoRoot));
}

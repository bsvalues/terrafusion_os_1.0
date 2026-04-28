import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';

const mod = await import('../pilot/local-agent/index.js');
const {
  daemonStart,
  daemonStop,
  daemonStatus,
  defaultDaemonRecordPath,
  DAEMON_RECORD_VERSION,
  LocalAgentDaemonClient,
} = mod;

function makeSocketPath() {
  const tag = `tf-daemon-ctrl-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (process.platform === 'win32') return `\\\\.\\pipe\\${tag}`;
  return path.join(os.tmpdir(), `${tag}.sock`);
}

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-daemon-ctrl-'));
  return {
    repoRoot: dir,
    cleanup() { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} },
  };
}

test('defaultDaemonRecordPath places the record under .terrafusion/local-agent', () => {
  const p = defaultDaemonRecordPath('/tmp/repo');
  assert.ok(p.endsWith(path.join('.terrafusion', 'local-agent', 'daemon.json')), p);
});

test('start writes a versioned record with pid + socketPath, status reports running', async () => {
  const repo = makeRepo();
  const socketPath = makeSocketPath();
  try {
    const { result, daemon } = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    assert.equal(result.status, 'started');
    assert.equal(result.socketPath, socketPath);
    assert.equal(typeof result.pid, 'number');
    assert.ok(daemon, 'daemon instance should be returned on fresh start');

    const raw = fs.readFileSync(result.recordPath, 'utf8');
    const record = JSON.parse(raw);
    assert.equal(record.version, DAEMON_RECORD_VERSION);
    assert.equal(record.socketPath, socketPath);
    assert.equal(record.pid, process.pid);
    assert.equal(typeof record.startedAt, 'number');

    const status = await daemonStatus({ repoRoot: repo.repoRoot });
    assert.equal(status.running, true);
    assert.equal(status.socketPath, socketPath);
    assert.equal(status.pid, process.pid);

    await daemon.stop();
  } finally {
    await daemonStop({ repoRoot: repo.repoRoot }).catch(() => {});
    repo.cleanup();
  }
});

test('fresh daemon start exposes no adapters until one is explicitly registered', async () => {
  const repo = makeRepo();
  const socketPath = makeSocketPath();
  const client = new LocalAgentDaemonClient();
  try {
    const { daemon } = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    await client.connect(socketPath);

    const result = await client.listAdapters();
    assert.deepEqual(result.adapters, []);

    await client.close();
    await daemon?.stop();
  } finally {
    await client.close().catch(() => {});
    await daemonStop({ repoRoot: repo.repoRoot }).catch(() => {});
    repo.cleanup();
  }
});

test('start when a reachable record already exists returns already-running and does NOT bind twice', async () => {
  const repo = makeRepo();
  const socketPath = makeSocketPath();
  try {
    const first = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    assert.equal(first.result.status, 'started');
    assert.ok(first.daemon);

    const second = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    assert.equal(second.result.status, 'already-running');
    assert.equal(second.daemon, null);
    assert.equal(second.result.socketPath, socketPath);

    await first.daemon.stop();
  } finally {
    await daemonStop({ repoRoot: repo.repoRoot }).catch(() => {});
    repo.cleanup();
  }
});

test('start when a stale record exists removes the stale record and starts fresh', async () => {
  const repo = makeRepo();
  const recordPath = defaultDaemonRecordPath(repo.repoRoot);
  // Hand-write a stale record pointing at an unreachable socket.
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  const staleSocket = makeSocketPath();
  fs.writeFileSync(recordPath, JSON.stringify({
    pid: 999999,
    socketPath: staleSocket,
    startedAt: 0,
    version: DAEMON_RECORD_VERSION,
  }));

  const freshSocket = makeSocketPath();
  try {
    const { result, daemon } = await daemonStart({ repoRoot: repo.repoRoot, socketPath: freshSocket });
    assert.equal(result.status, 'started');
    assert.equal(result.socketPath, freshSocket);
    assert.ok(daemon);

    const updated = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(updated.socketPath, freshSocket);
    assert.equal(updated.pid, process.pid);

    await daemon.stop();
  } finally {
    await daemonStop({ repoRoot: repo.repoRoot }).catch(() => {});
    repo.cleanup();
  }
});

test('stop sends shutdown, removes the record, returns stopped', async () => {
  const repo = makeRepo();
  const socketPath = makeSocketPath();
  try {
    const { daemon } = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    const recordPath = defaultDaemonRecordPath(repo.repoRoot);
    assert.equal(fs.existsSync(recordPath), true);

    const stopResult = await daemonStop({ repoRoot: repo.repoRoot });
    assert.equal(stopResult.status, 'stopped');
    assert.equal(fs.existsSync(recordPath), false);

    // Daemon's own shutdown ran; ensure isRunning is false.
    await new Promise(r => setTimeout(r, 50));
    assert.equal(daemon.isRunning(), false);
  } finally {
    repo.cleanup();
  }
});

test('stop is idempotent when no record exists', async () => {
  const repo = makeRepo();
  try {
    const r = await daemonStop({ repoRoot: repo.repoRoot });
    assert.equal(r.status, 'not-running');
  } finally {
    repo.cleanup();
  }
});

test('status returns running:false when record points at an unreachable socket', async () => {
  const repo = makeRepo();
  const recordPath = defaultDaemonRecordPath(repo.repoRoot);
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, JSON.stringify({
    pid: 999999,
    socketPath: makeSocketPath(),
    startedAt: 0,
    version: DAEMON_RECORD_VERSION,
  }));
  try {
    const status = await daemonStatus({ repoRoot: repo.repoRoot });
    assert.equal(status.running, false);
    // record fields still surface for diagnostics
    assert.equal(status.pid, 999999);
    assert.equal(typeof status.socketPath, 'string');
  } finally {
    repo.cleanup();
  }
});

test('status returns running:false when no record exists', async () => {
  const repo = makeRepo();
  try {
    const status = await daemonStatus({ repoRoot: repo.repoRoot });
    assert.equal(status.running, false);
    assert.equal(status.pid, undefined);
    assert.equal(status.socketPath, undefined);
  } finally {
    repo.cleanup();
  }
});

test('start logs a local_agent_daemon_started event', async () => {
  const repo = makeRepo();
  const socketPath = makeSocketPath();
  try {
    const { daemon } = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    const events = fs.readFileSync(path.join(repo.repoRoot, '.terrafusion', 'agent-events.jsonl'), 'utf8');
    assert.ok(events.includes('local_agent_daemon_started'), events);
    await daemon.stop();
  } finally {
    await daemonStop({ repoRoot: repo.repoRoot }).catch(() => {});
    repo.cleanup();
  }
});

test('stop logs a local_agent_daemon_stopped event when a record was present', async () => {
  const repo = makeRepo();
  const socketPath = makeSocketPath();
  try {
    const { daemon } = await daemonStart({ repoRoot: repo.repoRoot, socketPath });
    await daemonStop({ repoRoot: repo.repoRoot });
    const events = fs.readFileSync(path.join(repo.repoRoot, '.terrafusion', 'agent-events.jsonl'), 'utf8');
    assert.ok(events.includes('local_agent_daemon_stopped'), events);
    assert.equal(daemon.isRunning(), false);
  } finally {
    repo.cleanup();
  }
});

test('record path resolves under the given repoRoot, not the cwd', () => {
  const repo = makeRepo();
  try {
    const p = defaultDaemonRecordPath(repo.repoRoot);
    assert.ok(p.startsWith(repo.repoRoot), `${p} should start with ${repo.repoRoot}`);
  } finally {
    repo.cleanup();
  }
});

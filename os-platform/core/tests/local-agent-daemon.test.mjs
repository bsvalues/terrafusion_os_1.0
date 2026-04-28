import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';

const mod = await import('../pilot/local-agent/index.js');
const {
  AdapterRegistry,
  FakeModelAdapter,
  LocalAgentDaemon,
  LocalAgentDaemonClient,
  defaultDaemonSocketPath,
  DAEMON_ERROR_CODES,
} = mod;

function makeSocketPath() {
  const tag = `tf-daemon-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (process.platform === 'win32') return `\\\\.\\pipe\\${tag}`;
  return path.join(os.tmpdir(), `${tag}.sock`);
}

class SlowAdapter {
  constructor() {
    this.name = 'slow';
    this.capabilities = { streaming: true, tools: false, vision: false, local: true, maxContextTokens: 1024 };
  }
  async *chat(_request, signal) {
    for (let i = 0; i < 50; i++) {
      if (signal?.aborted) { yield { kind: 'error', text: 'aborted' }; return; }
      yield { kind: 'text', text: `chunk-${i}` };
      await new Promise(r => setTimeout(r, 20));
    }
    yield { kind: 'done' };
  }
  async complete() { return { text: '', usage: { promptTokens: 0, completionTokens: 0 } }; }
  async close() {}
}

async function withDaemon(setup) {
  const registry = new AdapterRegistry();
  setup(registry);
  const daemon = new LocalAgentDaemon({ registry });
  const socketPath = makeSocketPath();
  await daemon.start(socketPath);
  const client = new LocalAgentDaemonClient();
  await client.connect(socketPath);
  return {
    registry, daemon, client, socketPath,
    async dispose() {
      await client.close().catch(() => {});
      await daemon.stop().catch(() => {});
    },
  };
}

test('defaultDaemonSocketPath returns a path-based address (no TCP)', () => {
  const p = defaultDaemonSocketPath(12345);
  assert.equal(typeof p, 'string');
  assert.ok(p.length > 0);
  if (process.platform === 'win32') {
    assert.ok(p.startsWith('\\\\.\\pipe\\'), `expected named pipe, got ${p}`);
  } else {
    assert.ok(p.endsWith('.sock'), `expected .sock path, got ${p}`);
  }
  // Never a TCP-style host:port.
  assert.ok(!/^\d+\.\d+\.\d+\.\d+:\d+$/.test(p));
  assert.ok(!/^localhost:\d+$/.test(p));
});

test('start/stop lifecycle is idempotent and stop releases the socket', async () => {
  const registry = new AdapterRegistry();
  registry.register(new FakeModelAdapter());
  const daemon = new LocalAgentDaemon({ registry });
  const socketPath = makeSocketPath();
  assert.equal(daemon.isRunning(), false);
  await daemon.start(socketPath);
  assert.equal(daemon.isRunning(), true);
  await assert.rejects(() => daemon.start(socketPath), /already started/);
  await daemon.stop();
  assert.equal(daemon.isRunning(), false);
  // safe to stop again
  await daemon.stop();
  // socket released — restart succeeds (use a fresh path to avoid Windows pipe reuse delay)
  await daemon.start(makeSocketPath());
  await daemon.stop();
});

test('adapter.list round trips with capabilities', async () => {
  const ctx = await withDaemon(r => r.register(new FakeModelAdapter()));
  try {
    const result = await ctx.client.listAdapters();
    assert.equal(result.adapters.length, 1);
    assert.equal(result.adapters[0].name, 'fake');
    assert.equal(result.adapters[0].capabilities.local, true);
    assert.equal(result.adapters[0].capabilities.streaming, true);
  } finally {
    await ctx.dispose();
  }
});

test('adapter.complete round trips against FakeModelAdapter', async () => {
  const fake = new FakeModelAdapter().respondTo('hi', 'hello world');
  const ctx = await withDaemon(r => r.register(fake));
  try {
    const { completion } = await ctx.client.complete({
      adapter: 'fake',
      request: { messages: [{ role: 'user', content: 'hi' }] },
    });
    assert.equal(completion.text, 'hello world');
    assert.ok(completion.usage.promptTokens > 0);
    assert.ok(completion.usage.completionTokens > 0);
  } finally {
    await ctx.dispose();
  }
});

test('adapter.chat streams ordered chunks then ends', async () => {
  const fake = new FakeModelAdapter().respondTo('greet', 'one two three');
  const ctx = await withDaemon(r => r.register(fake));
  try {
    const { stream } = ctx.client.chat({
      adapter: 'fake',
      request: { messages: [{ role: 'user', content: 'greet' }] },
    });
    const texts = [];
    for await (const chunk of stream) {
      if (chunk.kind === 'text' && chunk.text) texts.push(chunk.text);
    }
    assert.equal(texts.join(''), 'one two three');
  } finally {
    await ctx.dispose();
  }
});

test('adapter.cancel aborts an in-flight chat stream', async () => {
  const ctx = await withDaemon(r => r.register(new SlowAdapter()));
  try {
    const { id, stream } = ctx.client.chat({
      adapter: 'slow',
      request: { messages: [{ role: 'user', content: 'go' }] },
    });
    const iter = stream[Symbol.asyncIterator]();
    const first = await iter.next();
    assert.equal(first.done, false);
    assert.equal(first.value.kind, 'text');
    const cancelResult = await ctx.client.cancel(id);
    assert.equal(cancelResult.cancelled, true);
    // The next iteration must surface an error (adapter yields { kind: 'error' } on abort,
    // daemon translates that to an error frame, client rejects the iterator).
    await assert.rejects(() => iter.next(), /adapter_error|aborted/);
  } finally {
    await ctx.dispose();
  }
});

test('unknown method returns a structured error frame', async () => {
  const ctx = await withDaemon(r => r.register(new FakeModelAdapter()));
  try {
    // bypass typed surface — write a raw frame
    const raw = JSON.stringify({ id: 'r-1', method: 'does.not.exist' }) + '\n';
    const net = await import('node:net');
    const sock = net.createConnection(ctx.socketPath);
    sock.setEncoding('utf8');
    const got = await new Promise((resolve, reject) => {
      sock.once('connect', () => sock.write(raw));
      sock.once('data', resolve);
      sock.once('error', reject);
    });
    sock.end();
    const frame = JSON.parse(String(got).trim());
    assert.equal(frame.id, 'r-1');
    assert.equal(frame.error?.code, DAEMON_ERROR_CODES.UNKNOWN_METHOD);
  } finally {
    await ctx.dispose();
  }
});

test('unknown adapter returns a structured error frame', async () => {
  const ctx = await withDaemon(() => {});
  try {
    await assert.rejects(
      () => ctx.client.complete({ adapter: 'nope', request: { messages: [] } }),
      new RegExp(DAEMON_ERROR_CODES.UNKNOWN_ADAPTER),
    );
  } finally {
    await ctx.dispose();
  }
});

test('invalid params on adapter.complete return invalid_params error', async () => {
  const ctx = await withDaemon(r => r.register(new FakeModelAdapter()));
  try {
    await assert.rejects(
      () => ctx.client.complete({ adapter: '', request: undefined }),
      new RegExp(DAEMON_ERROR_CODES.INVALID_PARAMS),
    );
  } finally {
    await ctx.dispose();
  }
});

test('daemon.shutdown closes the server after responding', async () => {
  const ctx = await withDaemon(r => r.register(new FakeModelAdapter()));
  try {
    const result = await ctx.client.shutdown();
    assert.equal(result.ok, true);
    // Give the daemon's setImmediate a tick to actually close.
    await new Promise(r => setTimeout(r, 50));
    assert.equal(ctx.daemon.isRunning(), false);
  } finally {
    await ctx.dispose();
  }
});

test('client requests reject when the daemon stops mid-flight', async () => {
  const ctx = await withDaemon(r => r.register(new SlowAdapter()));
  try {
    const { stream } = ctx.client.chat({
      adapter: 'slow',
      request: { messages: [{ role: 'user', content: 'go' }] },
    });
    const iter = stream[Symbol.asyncIterator]();
    await iter.next(); // consume one chunk
    await ctx.daemon.stop();
    await assert.rejects(() => iter.next(), /closed|aborted|adapter_error/);
  } finally {
    await ctx.dispose();
  }
});

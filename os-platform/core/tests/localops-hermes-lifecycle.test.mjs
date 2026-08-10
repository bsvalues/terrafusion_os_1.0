import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { createServer } from 'node:http';
import net from 'node:net';
import { PassThrough } from 'node:stream';
import { describe, it } from 'node:test';

const {
  buildHermesSshArguments,
  runLocalOpsHermesLifecycle,
  validateHermesSshConfiguration,
  waitForSshForwardReady,
} = await import('../pilot/localops-hermes-lifecycle.mjs');

const MODEL = 'llama3.2:3b';

async function reservePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

async function canConnect(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(250);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    const unavailable = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once('error', unavailable);
    socket.once('timeout', unavailable);
  });
}

function tunnelFixture({ models = [MODEL], releaseOnKill = true, onHealth, onChat } = {}) {
  let server;
  let serverClosed = Promise.resolve();
  const sockets = new Set();
  const child = new EventEmitter();
  child.pid = 4242;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = () => {
    if (!releaseOnKill) return true;
    server.close(() => {
      child.exitCode = 0;
      child.emit('close', 0, null);
    });
    return true;
  };

  return {
    child,
    async start({ localPort }) {
      server = createServer(async (request, response) => {
        if (request.method === 'POST' && request.url === '/api/chat' && onChat) {
          await onChat(request, response);
          return;
        }
        if (request.method !== 'GET' || request.url !== '/api/tags') {
          response.writeHead(404).end();
          return;
        }
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ models: models.map(name => ({ name })) }));
        onHealth?.(child);
      });
      server.on('connection', socket => {
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
      });
      serverClosed = once(server, 'close');
      server.listen(localPort, '127.0.0.1');
      await once(server, 'listening');
      return child;
    },
    async forceClose() {
      if (!server) return;
      if (server.listening) server.close();
      for (const socket of sockets) socket.destroy();
      await Promise.race([
        serverClosed,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('fixture server did not close')), 500)
        ),
      ]);
    },
  };
}

function lifecycleOptions(localPort) {
  return {
    localPort,
    healthTimeoutMs: 1_000,
    proofTimeoutMs: 1_000,
    cleanupTimeoutMs: 1_000,
  };
}

describe('LocalOps Hermes tunnel lifecycle', () => {
  it('starts, health-checks, uses LocalOps with shell disabled, and releases its listener', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture();
    let proofCalls = 0;

    const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
      startTunnel: options => tunnel.start(options),
      runProof: async options => {
        proofCalls += 1;
        assert.strictEqual(options.env.AI_BASE_URL, `http://127.0.0.1:${localPort}`);
        assert.strictEqual(options.env.AI_MODEL, MODEL);
        assert.strictEqual(
          options.prompt,
          'Return one short, read-only LocalOps lifecycle proof response.'
        );
        assert.strictEqual(options.env.AI_ALLOW_SHELL, 'false');
        assert.strictEqual(options.env.AI_EXTERNAL_CALLS, 'false');
        assert.strictEqual(options.env.AI_ALLOW_MUTATION, 'false');
        return {
          ok: true,
          status: 'success',
          provider: 'ollama',
          response: { sha256: 'abc123', length: 7 },
        };
      },
    });

    assert.strictEqual(proofCalls, 1);
    assert.deepStrictEqual(result, {
      ok: true,
      status: 'success',
      boundary: 'hermes-ssh-tunnel',
      model: MODEL,
      health: 'ready',
      proof: {
        provider: 'ollama',
        response: { sha256: 'abc123', length: 7 },
      },
      cleanup: 'released',
    });
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('fails closed before use when the required model is absent and still releases the listener', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture({ models: ['another-model'] });
    let proofCalls = 0;

    const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
      startTunnel: options => tunnel.start(options),
      runProof: async () => {
        proofCalls += 1;
        throw new Error('proof must not run');
      },
    });

    assert.strictEqual(proofCalls, 0);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'LOCALOPS_REQUIRED_MODEL_UNAVAILABLE');
    assert.strictEqual(result.cleanup, 'released');
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('cleans up when LocalOps use fails', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture();

    const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
      startTunnel: options => tunnel.start(options),
      runProof: async () => ({
        ok: false,
        status: 'failed',
        reasonCode: 'LOCAL_PROVIDER_FAILED',
        message: 'provider unavailable',
      }),
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'LOCAL_PROVIDER_FAILED');
    assert.strictEqual(result.cleanup, 'released');
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('classifies an unexpected LocalOps use exception without skipping cleanup', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture();

    const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
      startTunnel: options => tunnel.start(options),
      runProof: async () => {
        throw new Error('fixture use failure');
      },
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'LOCALOPS_USE_FAILED');
    assert.strictEqual(result.cleanup, 'released');
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('fails closed when interrupted during LocalOps use and still releases the listener', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture();
    const interrupted = new AbortController();

    const result = await runLocalOpsHermesLifecycle(
      { ...lifecycleOptions(localPort), signal: interrupted.signal },
      {
        startTunnel: options => tunnel.start(options),
        runProof: async options => {
          assert.strictEqual(options.signal, interrupted.signal);
          interrupted.abort();
          return {
            ok: true,
            status: 'success',
            provider: 'ollama',
            response: { sha256: 'must-not-succeed', length: 16 },
          };
        },
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'LOCALOPS_LIFECYCLE_INTERRUPTED');
    assert.strictEqual(result.cleanup, 'released');
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('aborts a real in-flight Ollama request and releases the lifecycle-owned listener', async () => {
    const localPort = await reservePort();
    const interrupted = new AbortController();
    let markRequestStarted;
    const requestStarted = new Promise(resolve => {
      markRequestStarted = resolve;
    });
    let markResponseClosed;
    const responseClosed = new Promise(resolve => {
      markResponseClosed = resolve;
    });
    const tunnel = tunnelFixture({
      onChat: async (request, response) => {
        for await (const _chunk of request) {
          // Consume the complete request before holding the response open.
        }
        response.once('close', markResponseClosed);
        response.writeHead(200, { 'content-type': 'application/x-ndjson' });
        response.flushHeaders();
        markRequestStarted();
      },
    });

    let lifecycle;
    try {
      lifecycle = runLocalOpsHermesLifecycle(
        { ...lifecycleOptions(localPort), signal: interrupted.signal },
        { startTunnel: options => tunnel.start(options) }
      );
      await Promise.race([
        requestStarted,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('in-flight Ollama request did not begin')), 500)
        ),
      ]);
      interrupted.abort();

      const result = await lifecycle;
      await Promise.race([
        responseClosed,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('aborted Ollama response did not close')), 500)
        ),
      ]);
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.reasonCode, 'LOCALOPS_LIFECYCLE_INTERRUPTED');
      assert.strictEqual(result.cleanup, 'released');
      assert.strictEqual(await canConnect(localPort), false);
    } finally {
      interrupted.abort();
      await lifecycle?.catch(() => undefined);
      await tunnel.forceClose();
    }
  });

  it('reports cleanup failure instead of success when its listener remains open', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture({ releaseOnKill: false });
    try {
      const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
        startTunnel: options => tunnel.start(options),
        runProof: async () => ({
          ok: true,
          status: 'success',
          provider: 'ollama',
          response: { sha256: 'abc123', length: 7 },
        }),
      });

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.reasonCode, 'LOCALOPS_TUNNEL_CLEANUP_FAILED');
      assert.strictEqual(result.cleanup, 'listener-still-open');
    } finally {
      await tunnel.forceClose();
    }
  });

  it('never starts LocalOps use after the owned SSH child exits during health', async () => {
    const localPort = await reservePort();
    const tunnel = tunnelFixture({
      releaseOnKill: false,
      onHealth(child) {
        child.exitCode = 255;
        child.emit('close', 255, null);
      },
    });
    let proofCalls = 0;
    try {
      const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
        startTunnel: options => tunnel.start(options),
        runProof: async () => {
          proofCalls += 1;
          return { ok: true, status: 'success', provider: 'ollama', response: {} };
        },
      });
      assert.strictEqual(proofCalls, 0);
      assert.strictEqual(result.ok, false);
    } finally {
      await tunnel.forceClose();
    }
  });

  it('preserves a specific SSH configuration rejection without inventing cleanup ownership', async () => {
    const localPort = await reservePort();
    const configProblem = {
      ok: false,
      status: 'failed',
      reasonCode: 'LOCALOPS_SSH_CONFIG_UNSAFE',
      message: 'The hermes SSH alias contains inherited forwarding directives.',
      cleanup: 'not-started',
    };
    const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
      startTunnel: async () => {
        throw new Error(configProblem.message, { cause: configProblem });
      },
    });

    assert.deepStrictEqual(result, configProblem);
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('reports a generic SSH start failure with no cleanup ownership when no child exists', async () => {
    const localPort = await reservePort();
    const result = await runLocalOpsHermesLifecycle(lifecycleOptions(localPort), {
      startTunnel: async () => {
        throw new Error('spawn failed');
      },
    });

    assert.deepStrictEqual(result, {
      ok: false,
      status: 'failed',
      reasonCode: 'LOCALOPS_TUNNEL_START_FAILED',
      message: 'Hermes SSH tunnel could not be started.',
      cleanup: 'not-started',
    });
    assert.strictEqual(await canConnect(localPort), false);
  });

  it('retains child ownership when SSH readiness fails and cleanup cannot stop it', async () => {
    const localPort = await reservePort();
    const child = new EventEmitter();
    child.exitCode = null;
    child.signalCode = null;
    child.kill = () => true;
    const readinessProblem = {
      ok: false,
      status: 'failed',
      reasonCode: 'LOCALOPS_TUNNEL_NOT_READY',
      message: 'Hermes SSH exited or timed out before confirming the owned loopback forward.',
      cleanup: 'not-started',
    };
    const startupError = new Error('SSH tunnel readiness timed out.', {
      cause: readinessProblem,
    });
    startupError.ownedChild = child;

    const result = await runLocalOpsHermesLifecycle(
      { ...lifecycleOptions(localPort), cleanupTimeoutMs: 10 },
      {
        startTunnel: async () => {
          throw startupError;
        },
      }
    );

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.reasonCode, 'LOCALOPS_TUNNEL_CLEANUP_FAILED');
    assert.strictEqual(result.cleanup, 'listener-still-open');
  });

  it('refuses to start when the requested loopback port is already owned', async () => {
    const listener = net.createServer();
    listener.listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const { port } = listener.address();
    let starts = 0;
    try {
      const result = await runLocalOpsHermesLifecycle(lifecycleOptions(port), {
        startTunnel: async () => {
          starts += 1;
          throw new Error('must not start');
        },
        runProof: async () => {
          throw new Error('must not use');
        },
      });
      assert.strictEqual(starts, 0);
      assert.deepStrictEqual(result, {
        ok: false,
        status: 'failed',
        reasonCode: 'LOCALOPS_LOCAL_PORT_IN_USE',
        message: `Loopback port ${port} is already in use; refusing to touch an unowned listener.`,
        cleanup: 'not-started',
      });
    } finally {
      listener.close();
      await once(listener, 'close');
    }
  });

  it('honors cancellation before starting SSH', async () => {
    const localPort = await reservePort();
    const interrupted = new AbortController();
    interrupted.abort();
    let starts = 0;
    const result = await runLocalOpsHermesLifecycle(
      { ...lifecycleOptions(localPort), signal: interrupted.signal },
      {
        startTunnel: async () => {
          starts += 1;
          throw new Error('must not start');
        },
      }
    );

    assert.strictEqual(starts, 0);
    assert.deepStrictEqual(result, {
      ok: false,
      status: 'failed',
      reasonCode: 'LOCALOPS_LIFECYCLE_INTERRUPTED',
      message: 'Lifecycle interrupted before Hermes SSH startup.',
      cleanup: 'not-started',
    });
  });

  it('rejects attempts to override the fixed host, model, or synthetic prompt boundary', async () => {
    const localPort = await reservePort();
    let starts = 0;
    const result = await runLocalOpsHermesLifecycle(
      {
        ...lifecycleOptions(localPort),
        sshHost: 'another-host',
        model: 'another-model',
        prompt: 'arbitrary prompt',
      },
      {
        startTunnel: async () => {
          starts += 1;
          throw new Error('must not start');
        },
      }
    );
    assert.strictEqual(starts, 0);
    assert.strictEqual(result.reasonCode, 'INVALID_LIFECYCLE_INPUT');
  });

  it('rejects a proof timeout above the underlying proof contract before starting SSH', async () => {
    const localPort = await reservePort();
    let starts = 0;
    const result = await runLocalOpsHermesLifecycle(
      { ...lifecycleOptions(localPort), proofTimeoutMs: 30_001 },
      {
        startTunnel: async () => {
          starts += 1;
          throw new Error('must not start');
        },
      }
    );

    assert.strictEqual(starts, 0);
    assert.deepStrictEqual(result, {
      ok: false,
      status: 'failed',
      reasonCode: 'INVALID_LIFECYCLE_INPUT',
      message: 'proofTimeoutMs must be an integer from 1 through 30000.',
      cleanup: 'not-started',
    });
  });

  it('builds one exact foreground SSH forward and neutralizes ownership-affecting config', () => {
    assert.deepStrictEqual(buildHermesSshArguments(11455), [
      '-v',
      '-N',
      '-T',
      '-o',
      'BatchMode=yes',
      '-o',
      'ExitOnForwardFailure=yes',
      '-o',
      'ControlMaster=no',
      '-o',
      'ControlPersist=no',
      '-o',
      'ForkAfterAuthentication=no',
      '-o',
      'ForwardAgent=no',
      '-o',
      'PermitLocalCommand=no',
      '-L',
      '127.0.0.1:11455:127.0.0.1:11434',
      '-o',
      'ServerAliveInterval=15',
      '-o',
      'ServerAliveCountMax=2',
      'hermes',
    ]);
  });

  it('does not acknowledge tunnel readiness until OpenSSH confirms the owned forward', async () => {
    const child = new EventEmitter();
    child.stderr = new PassThrough();
    child.exitCode = null;
    child.signalCode = null;
    let settled = false;
    const ready = waitForSshForwardReady(child, 11455, 500).then(() => {
      settled = true;
    });

    child.stderr.write('debug1: Authentication succeeded (publickey).\n');
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(settled, false);
    child.stderr.write('debug1: Local forwarding listening on 127.0.0.1 port 11455.\n');
    await ready;
    assert.strictEqual(settled, true);
  });

  it('fails tunnel readiness when SSH exits before confirming the owned forward', async () => {
    const child = new EventEmitter();
    child.stderr = new PassThrough();
    child.exitCode = null;
    child.signalCode = null;
    const ready = waitForSshForwardReady(child, 11455, 500);
    child.exitCode = 255;
    child.emit('close', 255, null);

    await assert.rejects(ready, error => {
      assert.strictEqual(error.cause.reasonCode, 'LOCALOPS_TUNNEL_NOT_READY');
      return true;
    });
  });

  it('cancels tunnel readiness without waiting for its timeout', async () => {
    const child = new EventEmitter();
    child.stderr = new PassThrough();
    child.exitCode = null;
    child.signalCode = null;
    const interrupted = new AbortController();
    const ready = waitForSshForwardReady(child, 11455, 5_000, interrupted.signal);
    interrupted.abort();

    await assert.rejects(ready, error => {
      assert.strictEqual(error.cause.reasonCode, 'LOCALOPS_LIFECYCLE_INTERRUPTED');
      return true;
    });
  });

  it('refuses inherited SSH forwards before starting the owned tunnel', () => {
    assert.strictEqual(
      validateHermesSshConfiguration('hostname 192.168.1.154\ncontrolmaster false\n'),
      null
    );
    assert.deepStrictEqual(
      validateHermesSshConfiguration(
        'hostname 192.168.1.154\nlocalforward 127.0.0.1:9999 [127.0.0.1]:9999\n'
      ),
      {
        ok: false,
        status: 'failed',
        reasonCode: 'LOCALOPS_SSH_CONFIG_UNSAFE',
        message: 'The hermes SSH alias contains inherited forwarding directives.',
        cleanup: 'not-started',
      }
    );
  });
});

import assert from 'node:assert';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const { runLocalOpsOllamaLiveProof } = await import('../pilot/localops-ollama-live-proof.mjs');

const PROOF_PATH = new URL('../pilot/localops-ollama-live-proof.mjs', import.meta.url);
const FIXTURE_MODEL = 'ollama-loopback-fixture';
const FIXTURE_PROMPT = 'Return the LocalOps loopback proof.';
const FIXTURE_TEXT = 'LocalOps loopback proof';
const FIXTURE_DIGEST = '4734b232221b374f8bbb27f39458e1e7fbeb0ce7d8fdd43b9b6b742d794129eb';

function proofEnv(baseUrl) {
  return {
    AI_PROFILE: 'localops',
    AI_PROVIDER: 'ollama',
    AI_MODEL: FIXTURE_MODEL,
    AI_BASE_URL: baseUrl,
  };
}

async function withLoopbackServer(handler, run) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    server.closeAllConnections();
    await once(server, 'close');
  }
}

async function closedLoopbackUrl() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return `http://127.0.0.1:${port}`;
}

function runCli(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(PROOF_PATH)], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', code => resolve({ code, stdout, stderr }));
  });
}

async function withFetchMonitor(run) {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    throw new Error('unexpected network request');
  };
  try {
    return await run(() => requests);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

describe('disposable LocalOps Ollama live proof entrypoint (WO-LOCALOPS-009)', () => {
  it('posts the explicit model and prompt to loopback Ollama and projects the literal response digest and length', async () => {
    let requests = 0;
    await withLoopbackServer(async (request, response) => {
      requests += 1;
      assert.strictEqual(request.method, 'POST');
      assert.strictEqual(request.url, '/api/chat');
      let body = '';
      for await (const chunk of request) body += chunk;
      const payload = JSON.parse(body);
      assert.strictEqual(payload.model, FIXTURE_MODEL);
      assert.deepStrictEqual(payload.messages, [{ role: 'user', content: FIXTURE_PROMPT }]);
      assert.strictEqual(payload.stream, true);
      response.writeHead(200, { 'content-type': 'application/x-ndjson' });
      response.end('{"message":{"content":"LocalOps loopback "}}\n{"message":{"content":"proof"},"done":true}\n');
    }, async baseUrl => {
      const result = await runLocalOpsOllamaLiveProof({
        env: proofEnv(baseUrl),
        prompt: FIXTURE_PROMPT,
        timeoutMs: 1_000,
      });
      assert.deepStrictEqual(result, {
        ok: true,
        status: 'success',
        provider: 'ollama',
        response: {
          sha256: FIXTURE_DIGEST,
          length: 23,
        },
      });
    });
    assert.strictEqual(requests, 1);
  });

  it('rejects ordinary remote and userinfo-host bypass URLs before any request', async () => {
    for (const baseUrl of [
      'http://models.example.test:11434',
      'http://127.0.0.1:11434@attacker.example:11434',
    ]) {
      await withFetchMonitor(async requestCount => {
        const result = await runLocalOpsOllamaLiveProof({
          env: proofEnv(baseUrl),
          prompt: FIXTURE_PROMPT,
          timeoutMs: 1_000,
        });
        assert.deepStrictEqual(result, {
          ok: false,
          status: 'misconfigured',
          reasonCode: 'INVALID_PROOF_INPUT',
          message: 'AI_BASE_URL must be an explicit HTTP loopback URL without userinfo',
        });
        assert.strictEqual(requestCount(), 0, `${baseUrl} must not reach fetch`);
      });
    }
  });

  it('requires an explicit loopback URL instead of falling back to TF_LOCAL_MODEL_PORT', async () => {
    await withFetchMonitor(async requestCount => {
      const result = await runLocalOpsOllamaLiveProof({
        env: {
          ...proofEnv(''),
          TF_LOCAL_MODEL_PORT: '11434',
        },
        prompt: FIXTURE_PROMPT,
        timeoutMs: 1_000,
      });
      assert.strictEqual(result.reasonCode, 'INVALID_PROOF_INPUT');
      assert.match(result.message, /AI_BASE_URL/);
      assert.strictEqual(requestCount(), 0);
    });
  });

  it('pins the proof to the localops Ollama profile and rejects loosening overrides before fetch', async () => {
    const unsafeEnvs = [
      { ...proofEnv('http://127.0.0.1:11434'), AI_PROFILE: 'hybrid-approved' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_PROFILE: 'cloud-dev' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_PROVIDER: 'openai' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_EXTERNAL_CALLS: 'true' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_ALLOW_WEB: 'true' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_ALLOW_SHELL: 'true' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_ALLOW_MUTATION: 'true' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_REQUIRE_TRACE: 'false' },
      { ...proofEnv('http://127.0.0.1:11434'), AI_REQUIRE_SOURCES: 'false' },
    ];
    for (const env of unsafeEnvs) {
      await withFetchMonitor(async requestCount => {
        const result = await runLocalOpsOllamaLiveProof({ env, prompt: FIXTURE_PROMPT, timeoutMs: 1_000 });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.status, 'misconfigured');
        assert.strictEqual(result.reasonCode, 'INVALID_PROOF_INPUT');
        assert.strictEqual(requestCount(), 0);
      });
    }
  });

  it('returns a structured failure for an unavailable loopback port and exits the CLI nonzero', async () => {
    const baseUrl = await closedLoopbackUrl();
    const result = await runLocalOpsOllamaLiveProof({
      env: proofEnv(baseUrl),
      prompt: FIXTURE_PROMPT,
      timeoutMs: 1_000,
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.reasonCode, 'LOCAL_PROVIDER_FAILED');

    const cli = await runCli({ ...proofEnv(baseUrl), LOCALOPS_OLLAMA_PROOF_PROMPT: FIXTURE_PROMPT });
    assert.strictEqual(cli.code, 1);
    assert.strictEqual(cli.stderr, '');
    assert.strictEqual(cli.stdout.trim().split('\n').length, 1);
    assert.strictEqual(JSON.parse(cli.stdout).ok, false);
  });

  it('returns a structured abort timeout and exits the CLI nonzero', async () => {
    await withLoopbackServer(() => {
      // Intentionally leave the request open until the proof's bounded abort fires.
    }, async baseUrl => {
      const result = await runLocalOpsOllamaLiveProof({
        env: proofEnv(baseUrl),
        prompt: FIXTURE_PROMPT,
        timeoutMs: 10,
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 'failed');
      assert.strictEqual(result.reasonCode, 'LOCAL_PROVIDER_FAILED');
      assert.match(result.message, /abort/i);

      const cli = await runCli({
        ...proofEnv(baseUrl),
        LOCALOPS_OLLAMA_PROOF_PROMPT: FIXTURE_PROMPT,
        LOCALOPS_OLLAMA_PROOF_TIMEOUT_MS: '10',
      });
      assert.strictEqual(cli.code, 1);
      assert.strictEqual(cli.stderr, '');
      assert.strictEqual(cli.stdout.trim().split('\n').length, 1);
      assert.strictEqual(JSON.parse(cli.stdout).ok, false);
    });
  });
});

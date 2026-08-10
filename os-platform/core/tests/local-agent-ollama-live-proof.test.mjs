import assert from 'node:assert';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const { runLocalOpsOllamaLiveProof, validateTerminalCompletion } =
  await import('../pilot/localops-ollama-live-proof.mjs');

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
    AI_EXTERNAL_CALLS: 'false',
    AI_ALLOW_WEB: 'false',
    AI_ALLOW_SHELL: 'false',
    AI_ALLOW_MUTATION: 'false',
    AI_REQUIRE_TRACE: 'true',
    AI_REQUIRE_SOURCES: 'true',
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
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await once(server, 'close');
  }
}

async function withRedirectTarget(run) {
  let targetRequests = 0;
  const target = createServer((_request, response) => {
    targetRequests += 1;
    response.writeHead(200, { 'content-type': 'application/x-ndjson' });
    response.end('{"message":{"content":"redirected"},"done":true}\n');
  });
  target.listen(0, '127.0.0.1');
  await once(target, 'listening');
  const { port } = target.address();
  try {
    return await run(`http://127.0.0.1:${port}`, () => targetRequests);
  } finally {
    target.close();
    if (typeof target.closeAllConnections === 'function') target.closeAllConnections();
    await once(target, 'close');
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
    child.stdout.on('data', chunk => {
      stdout += chunk;
    });
    child.stderr.on('data', chunk => {
      stderr += chunk;
    });
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

async function assertIncompleteOllamaResponse(body) {
  await withLoopbackServer(
    (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/x-ndjson' });
      response.end(body);
    },
    async baseUrl => {
      const result = await runLocalOpsOllamaLiveProof({
        env: proofEnv(baseUrl),
        prompt: FIXTURE_PROMPT,
        timeoutMs: 1_000,
      });
      assert.deepStrictEqual(result, {
        ok: false,
        status: 'failed',
        reasonCode: 'INCOMPLETE_OLLAMA_RESPONSE',
        message: 'Ollama response did not contain a non-empty terminal completion.',
      });

      const cli = await runCli({
        ...proofEnv(baseUrl),
        LOCALOPS_OLLAMA_PROOF_PROMPT: FIXTURE_PROMPT,
      });
      assert.strictEqual(cli.code, 1);
      assert.strictEqual(cli.stderr, '');
      assert.strictEqual(cli.stdout.trim().split('\n').length, 1);
      assert.deepStrictEqual(JSON.parse(cli.stdout), result);
    }
  );
}

describe('disposable LocalOps Ollama live proof entrypoint (WO-LOCALOPS-009)', () => {
  it('fails closed when an owning lifecycle interrupts the active proof', async () => {
    const interrupted = new AbortController();
    let markRequestStarted;
    const requestStarted = new Promise(resolve => {
      markRequestStarted = resolve;
    });
    await withLoopbackServer(
      async (request, response) => {
        for await (const _chunk of request) {
          // Consume the complete request before holding the response open.
        }
        response.writeHead(200, { 'content-type': 'application/x-ndjson' });
        response.flushHeaders();
        markRequestStarted();
      },
      async baseUrl => {
        const proof = runLocalOpsOllamaLiveProof({
          env: proofEnv(baseUrl),
          prompt: FIXTURE_PROMPT,
          timeoutMs: 1_000,
          signal: interrupted.signal,
        });
        await requestStarted;
        interrupted.abort();
        assert.deepStrictEqual(await proof, {
          ok: false,
          status: 'failed',
          reasonCode: 'LOCALOPS_PROOF_INTERRUPTED',
          message: 'LocalOps proof was interrupted by its owning lifecycle.',
        });
      }
    );
  });

  it('fails closed when cancellation arrives while terminal validation is pending', async () => {
    const interrupted = new AbortController();
    let markValidationStarted;
    const validationStarted = new Promise(resolve => {
      markValidationStarted = resolve;
    });
    let releaseValidation;
    const validationReleased = new Promise(resolve => {
      releaseValidation = resolve;
    });
    const validation = validateTerminalCompletion(
      FIXTURE_TEXT,
      async () => {
        markValidationStarted();
        await validationReleased;
        return true;
      },
      interrupted.signal
    );
    await validationStarted;
    interrupted.abort();
    releaseValidation();

    assert.deepStrictEqual(await validation, {
      ok: false,
      status: 'failed',
      reasonCode: 'LOCALOPS_PROOF_INTERRUPTED',
      message: 'LocalOps proof was interrupted by its owning lifecycle.',
    });
  });

  it('posts the explicit model and prompt to loopback Ollama and projects the literal response digest and length', async () => {
    let requests = 0;
    await withLoopbackServer(
      async (request, response) => {
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
        response.end(
          '{"message":{"content":"LocalOps loopback "}}\n{"message":{"content":"proof"},"done":true}\n'
        );
      },
      async baseUrl => {
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
      }
    );
    assert.strictEqual(requests, 1);
  });

  it('projects response length as UTF-8 byte length', async () => {
    const text = '✓';
    await withLoopbackServer(
      (_request, response) => {
        response.writeHead(200, { 'content-type': 'application/x-ndjson' });
        response.end(`{"message":{"content":"${text}"},"done":true}\n`);
      },
      async baseUrl => {
        const result = await runLocalOpsOllamaLiveProof({
          env: proofEnv(baseUrl),
          prompt: FIXTURE_PROMPT,
          timeoutMs: 1_000,
        });
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.response.length, Buffer.byteLength(text, 'utf8'));
      }
    );
  });

  it('fails closed for malformed-only Ollama NDJSON', async () => {
    await assertIncompleteOllamaResponse('{not-json}\n');
  });

  it('fails closed for an Ollama response without terminal done:true', async () => {
    await assertIncompleteOllamaResponse('{"message":{"content":"partial"}}\n');
  });

  it('fails closed for an empty terminal Ollama response', async () => {
    await assertIncompleteOllamaResponse('{"message":{"content":""},"done":true}\n');
  });

  it('fails closed when terminal done:true is followed by malformed Ollama NDJSON', async () => {
    await assertIncompleteOllamaResponse(
      '{"message":{"content":"complete"},"done":true}\n{not-json}\n'
    );
  });

  it('fails closed when terminal done:true is followed by another Ollama response line', async () => {
    await assertIncompleteOllamaResponse(
      '{"message":{"content":"complete"},"done":true}\n{"message":{"content":"trailing"}}\n'
    );
  });

  it('accepts a permitted loopback base URL with a trailing slash', async () => {
    await withLoopbackServer(
      (_request, response) => {
        response.writeHead(200, { 'content-type': 'application/x-ndjson' });
        response.end('{"message":{"content":"complete"},"done":true}\n');
      },
      async baseUrl => {
        const result = await runLocalOpsOllamaLiveProof({
          env: proofEnv(`${baseUrl}/`),
          prompt: FIXTURE_PROMPT,
          timeoutMs: 1_000,
        });
        assert.strictEqual(result.ok, true);
        assert.strictEqual(result.status, 'success');
      }
    );
  });

  it('fails closed without following a loopback proof redirect to another target', async () => {
    await withRedirectTarget(async (targetUrl, requestCount) => {
      await withLoopbackServer(
        (_request, response) => {
          response.writeHead(302, { location: `${targetUrl}/redirected` });
          response.end();
        },
        async baseUrl => {
          const result = await runLocalOpsOllamaLiveProof({
            env: proofEnv(baseUrl),
            prompt: FIXTURE_PROMPT,
            timeoutMs: 1_000,
          });
          assert.strictEqual(result.ok, false);
          assert.strictEqual(result.status, 'failed');
          assert.strictEqual(result.reasonCode, 'LOCAL_PROVIDER_FAILED');
          assert.strictEqual(requestCount(), 0);
        }
      );
    });
  });

  it('requires every LocalOps safety flag to be explicitly present', async () => {
    for (const key of [
      'AI_EXTERNAL_CALLS',
      'AI_ALLOW_WEB',
      'AI_ALLOW_SHELL',
      'AI_ALLOW_MUTATION',
      'AI_REQUIRE_TRACE',
      'AI_REQUIRE_SOURCES',
    ]) {
      const env = proofEnv('http://127.0.0.1:11434');
      delete env[key];
      await withFetchMonitor(async requestCount => {
        const result = await runLocalOpsOllamaLiveProof({
          env,
          prompt: FIXTURE_PROMPT,
          timeoutMs: 1_000,
        });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.status, 'misconfigured');
        assert.strictEqual(result.reasonCode, 'INVALID_PROOF_INPUT');
        assert.match(result.message, new RegExp(`${key} must be explicitly set`));
        assert.strictEqual(requestCount(), 0);
      });
    }
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
        const result = await runLocalOpsOllamaLiveProof({
          env,
          prompt: FIXTURE_PROMPT,
          timeoutMs: 1_000,
        });
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

    const cli = await runCli({
      ...proofEnv(baseUrl),
      LOCALOPS_OLLAMA_PROOF_PROMPT: FIXTURE_PROMPT,
    });
    assert.strictEqual(cli.code, 1);
    assert.strictEqual(cli.stderr, '');
    assert.strictEqual(cli.stdout.trim().split('\n').length, 1);
    const cliResult = JSON.parse(cli.stdout);
    assert.strictEqual(cliResult.ok, false);
    assert.strictEqual(cliResult.status, 'failed');
    assert.strictEqual(cliResult.reasonCode, 'LOCAL_PROVIDER_FAILED');
  });

  it('returns a structured abort timeout and exits the CLI nonzero', async () => {
    await withLoopbackServer(
      () => {
        // Intentionally leave the request open until the proof's bounded abort fires.
      },
      async baseUrl => {
        const result = await runLocalOpsOllamaLiveProof({
          env: proofEnv(baseUrl),
          prompt: FIXTURE_PROMPT,
          timeoutMs: 10,
        });
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.status, 'unavailable');
        assert.strictEqual(result.reasonCode, 'LOCAL_PROVIDER_TIMEOUT');
        assert.match(result.message, /timed out/i);

        const cli = await runCli({
          ...proofEnv(baseUrl),
          LOCALOPS_OLLAMA_PROOF_PROMPT: FIXTURE_PROMPT,
          LOCALOPS_OLLAMA_PROOF_TIMEOUT_MS: '10',
        });
        assert.strictEqual(cli.code, 1);
        assert.strictEqual(cli.stderr, '');
        assert.strictEqual(cli.stdout.trim().split('\n').length, 1);
        const cliResult = JSON.parse(cli.stdout);
        assert.strictEqual(cliResult.ok, false);
        assert.strictEqual(cliResult.status, 'unavailable');
        assert.strictEqual(cliResult.reasonCode, 'LOCAL_PROVIDER_TIMEOUT');
      }
    );
  });
});

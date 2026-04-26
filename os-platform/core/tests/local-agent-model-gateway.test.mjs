import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentModelGateway;

before(async () => {
  const gatewayModule = await import('../pilot/local-agent/modelGateway.js');
  LocalAgentModelGateway = gatewayModule.LocalAgentModelGateway;
});

async function withFakeGatewayServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolvePromise, rejectPromise) => {
    server.listen(0, '127.0.0.1', error => (error ? rejectPromise(error) : resolvePromise()));
  });

  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    return await run(port);
  } finally {
    await new Promise((resolvePromise, rejectPromise) => {
      server.close(error => (error ? rejectPromise(error) : resolvePromise()));
    });
  }
}

function readEvents(root) {
  return readFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

describe('Local agent model gateway runtime', () => {
  it('accepts localhost endpoints', async () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-model-gateway-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      await withFakeGatewayServer((request, response) => {
        if (request.url === '/health') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ ok: true }));
          return;
        }

        response.writeHead(404).end();
      }, async port => {
        const gateway = new LocalAgentModelGateway({
          repoRoot: root,
          endpoint: `http://localhost:${port}/v1`,
          model: 'local-coder',
        });

        const result = await gateway.checkHealth();
        assert.equal(result.ok, true);
        assert.match(result.endpoint, /localhost/);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('denies non-local endpoints by default', async () => {
    const gateway = new LocalAgentModelGateway({ endpoint: 'http://example.com/v1' });
    const result = await gateway.checkHealth();
    assert.equal(result.ok, false);
    assert.equal(result.available, false);
    assert.match(result.status, /loopback endpoints by default/i);
  });

  it('succeeds on health checks against a fake local server', async () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-model-gateway-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      await withFakeGatewayServer((request, response) => {
        if (request.url === '/health') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (request.url === '/v1/models') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ data: [{ id: 'local-coder', owned_by: 'county-it' }] }));
          return;
        }

        if (request.url === '/v1/chat/completions' && request.method === 'POST') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({
            model: 'local-coder',
            choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Advisory response only.' } }],
            usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
          }));
          return;
        }

        response.writeHead(404).end();
      }, async port => {
        const gateway = new LocalAgentModelGateway({
          repoRoot: root,
          endpoint: `http://127.0.0.1:${port}/v1`,
          model: 'local-coder',
        });

        const health = await gateway.checkHealth();
        const models = await gateway.listModels();
        const chat = await gateway.chat([{ role: 'user', content: 'Explain readiness.' }]);

        assert.equal(health.ok, true);
        assert.equal(models.ok, true);
        assert.deepEqual(models.models.map(model => model.id), ['local-coder']);
        assert.equal(chat.ok, true);
        assert.equal(chat.response.advisoryOnly, true);
        assert.equal(chat.response.text, 'Advisory response only.');
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails health checks cleanly when unavailable', async () => {
    const gateway = new LocalAgentModelGateway({ endpoint: 'http://127.0.0.1:9/v1' });
    const result = await gateway.checkHealth();
    assert.equal(result.ok, false);
    assert.equal(result.available, false);
    assert.match(result.status, /unavailable|timed out/i);
  });

  it('returns structured model metadata where supported', async () => {
    await withFakeGatewayServer((request, response) => {
      if (request.url === '/v1/models') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          data: [
            { id: 'local-coder', owned_by: 'county-it', created: 123 },
            { id: 'local-analyst', owned_by: 'county-it', created: 456 },
          ],
        }));
        return;
      }

      response.writeHead(404).end();
    }, async port => {
      const gateway = new LocalAgentModelGateway({ endpoint: `http://127.0.0.1:${port}/v1` });
      const result = await gateway.listModels();
      assert.equal(result.ok, true);
      assert.equal(result.supported, true);
      assert.deepEqual(result.models.map(model => model.id), ['local-coder', 'local-analyst']);
    });
  });

  it('returns structured assistant output for chat', async () => {
    await withFakeGatewayServer((request, response) => {
      if (request.url === '/v1/chat/completions' && request.method === 'POST') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          model: 'local-coder',
          choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'County-safe advisory response.' } }],
          usage: { prompt_tokens: 6, completion_tokens: 4, total_tokens: 10 },
        }));
        return;
      }

      response.writeHead(404).end();
    }, async port => {
      const gateway = new LocalAgentModelGateway({ endpoint: `http://127.0.0.1:${port}/v1`, model: 'local-coder' });
      const result = await gateway.chat([{ role: 'user', content: 'Summarize this slice.' }]);
      assert.equal(result.ok, true);
      assert.equal(result.response.role, 'assistant');
      assert.equal(result.response.advisoryOnly, true);
      assert.equal(result.response.text, 'County-safe advisory response.');
      assert.equal(result.finishReason, 'stop');
      assert.equal(result.usage.totalTokens, 10);
    });
  });

  it('treats tool-call-like output as advisory text only', async () => {
    await withFakeGatewayServer((request, response) => {
      if (request.url === '/v1/chat/completions' && request.method === 'POST') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          choices: [{
            finish_reason: 'tool_calls',
            message: {
              role: 'assistant',
              tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'apply_patch', arguments: '{}' } }],
            },
          }],
        }));
        return;
      }

      response.writeHead(404).end();
    }, async port => {
      const gateway = new LocalAgentModelGateway({ endpoint: `http://127.0.0.1:${port}/v1` });
      const result = await gateway.chat([{ role: 'user', content: 'Do the thing.' }]);
      assert.equal(result.ok, true);
      assert.equal(result.response.advisoryOnly, true);
      assert.equal(result.response.toolCallsDetected, true);
      assert.match(result.response.text, /advisory text only/i);
    });
  });

  it('writes gateway events and redacts sensitive values from logs', async () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-model-gateway-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      await withFakeGatewayServer((request, response) => {
        if (request.url === '/health') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (request.url === '/v1/models') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ data: [{ id: 'local-coder', owned_by: 'county-it' }] }));
          return;
        }

        if (request.url === '/v1/chat/completions' && request.method === 'POST') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({
            choices: [{
              finish_reason: 'stop',
              message: { role: 'assistant', content: 'Bearer secret-token sk-super-secret advisory text.' },
            }],
          }));
          return;
        }

        response.writeHead(404).end();
      }, async port => {
        const gateway = new LocalAgentModelGateway({
          repoRoot: root,
          endpoint: `http://127.0.0.1:${port}/v1`,
          model: 'local-coder',
        });

        await gateway.checkHealth();
        await gateway.listModels();
        await gateway.chat([{ role: 'user', content: 'my sk-top-secret token and Bearer abc.def.ghi' }]);

        const events = readEvents(root);
        assert.ok(events.some(event => event.type === 'model_gateway_health_checked'));
        assert.ok(events.some(event => event.type === 'model_gateway_models_listed'));
        assert.ok(events.some(event => event.type === 'model_gateway_chat_completed'));

        const raw = readFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), 'utf8');
        assert.ok(!raw.includes('sk-top-secret'));
        assert.ok(!raw.includes('Bearer abc.def.ghi'));
        assert.ok(!raw.includes('sk-super-secret'));
        assert.ok(!raw.includes('secret-token'));
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
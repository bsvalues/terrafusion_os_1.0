import assert from 'node:assert';
import { describe, it } from 'node:test';

const { OllamaAdapter } = await import('../pilot/local-agent/index.js');

function scriptedTransport(lines, opts = {}) {
  const captured = { url: null, init: null };
  const transport = async (url, init) => {
    captured.url = url;
    captured.init = init;
    if (opts.fail) {
      return { ok: false, status: opts.status ?? 500, body: null, errorText: opts.errorText ?? 'fail' };
    }
    if (opts.throw) {
      throw new Error(opts.throw);
    }
    async function* body() {
      for (const piece of lines) {
        if (init.signal?.aborted) return;
        yield piece;
      }
    }
    return { ok: true, status: 200, body: body() };
  };
  return { transport, captured };
}

function userReq(content) {
  return { messages: [{ role: 'user', content }] };
}

describe('OllamaAdapter', () => {
  it('rejects non-loopback base URLs', () => {
    assert.throws(
      () => new OllamaAdapter({ model: 'llama3', baseUrl: 'http://example.com:11434' }),
      /loopback/,
    );
    assert.throws(
      () => new OllamaAdapter({ model: 'llama3', baseUrl: 'https://127.0.0.1:11434' }),
      /loopback/,
    );
  });

  it('accepts 127.0.0.1 and localhost loopback URLs', () => {
    new OllamaAdapter({ model: 'llama3', baseUrl: 'http://127.0.0.1:11434', transport: async () => ({ ok: true, status: 200, body: null }) });
    new OllamaAdapter({ model: 'llama3', baseUrl: 'http://localhost:11434/', transport: async () => ({ ok: true, status: 200, body: null }) });
  });

  it('streams content from NDJSON lines and emits done', async () => {
    const { transport, captured } = scriptedTransport([
      '{"message":{"content":"Hel"}}\n',
      '{"message":{"content":"lo "}}\n',
      '{"message":{"content":"world"},"done":false}\n',
      '{"message":{"content":""},"done":true}\n',
    ]);
    const adapter = new OllamaAdapter({ model: 'llama3', transport });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    const text = out.filter(c => c.kind === 'text').map(c => c.text).join('');
    assert.equal(text, 'Hello world');
    assert.equal(out[out.length - 1].kind, 'done');
    assert.equal(captured.url, 'http://127.0.0.1:11434/api/chat');
    const payload = JSON.parse(captured.init.body);
    assert.equal(payload.model, 'llama3');
    assert.equal(payload.stream, true);
  });

  it('skips malformed JSON lines without throwing', async () => {
    const { transport } = scriptedTransport([
      'not-json\n',
      '{"message":{"content":"ok"}}\n',
      '{bad json\n',
    ]);
    const adapter = new OllamaAdapter({ model: 'llama3', transport });
    const result = await adapter.complete(userReq('hi'));
    assert.equal(result.text, 'ok');
  });

  it('emits error chunk on HTTP failure', async () => {
    const { transport } = scriptedTransport([], { fail: true, status: 503, errorText: 'boom' });
    const adapter = new OllamaAdapter({ model: 'llama3', transport });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    assert.equal(out.length, 1);
    assert.equal(out[0].kind, 'error');
    assert.match(out[0].text, /503/);
    assert.match(out[0].text, /boom/);
  });

  it('emits error chunk when transport throws', async () => {
    const { transport } = scriptedTransport([], { throw: 'ECONNREFUSED' });
    const adapter = new OllamaAdapter({ model: 'llama3', transport });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    assert.equal(out[0].kind, 'error');
    assert.match(out[0].text, /transport failed/);
    assert.match(out[0].text, /ECONNREFUSED/);
  });

  it('honors AbortSignal mid-stream', async () => {
    const { transport } = scriptedTransport([
      '{"message":{"content":"a"}}\n',
      '{"message":{"content":"b"}}\n',
      '{"message":{"content":"c"}}\n',
    ]);
    const adapter = new OllamaAdapter({ model: 'llama3', transport });
    const ac = new AbortController();
    const out = [];
    for await (const c of adapter.chat(userReq('hi'), ac.signal)) {
      out.push(c);
      if (out.length === 2) ac.abort();
    }
    assert.equal(out[out.length - 1].kind, 'error');
    assert.equal(out[out.length - 1].text, 'aborted');
  });

  it('surfaces ollama-side error field as error chunk', async () => {
    const { transport } = scriptedTransport(['{"error":"model not found"}\n']);
    const adapter = new OllamaAdapter({ model: 'llama3', transport });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    const errChunk = out.find(c => c.kind === 'error');
    assert.ok(errChunk);
    assert.match(errChunk.text, /model not found/);
  });

  it('exposes local capability flag', () => {
    const adapter = new OllamaAdapter({
      model: 'llama3',
      transport: async () => ({ ok: true, status: 200, body: null }),
    });
    assert.equal(adapter.capabilities.local, true);
    assert.equal(adapter.name, 'ollama');
  });

  it('after close emits error chunk', async () => {
    const adapter = new OllamaAdapter({
      model: 'llama3',
      transport: async () => ({ ok: true, status: 200, body: null }),
    });
    await adapter.close();
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    assert.equal(out[0].kind, 'error');
    assert.match(out[0].text, /closed/);
  });
});

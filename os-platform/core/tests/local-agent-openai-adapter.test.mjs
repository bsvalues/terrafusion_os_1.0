import assert from 'node:assert';
import { describe, it } from 'node:test';

const { OpenAIAdapter } = await import('../pilot/local-agent/index.js');

const ENABLED = { TF_LOCAL_AGENT_ALLOW_REMOTE: '1' };

function scriptedTransport(lines, opts = {}) {
  const captured = { url: null, init: null };
  const transport = async (url, init) => {
    captured.url = url;
    captured.init = init;
    if (opts.fail) return { ok: false, status: opts.status ?? 500, body: null, errorText: opts.errorText ?? 'fail' };
    if (opts.throw) throw new Error(opts.throw);
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

const sseData = (objs) => objs.map(o => `data: ${typeof o === 'string' ? o : JSON.stringify(o)}\n\n`).join('');

function userReq(content) {
  return { messages: [{ role: 'user', content }] };
}

describe('OpenAIAdapter', () => {
  it('throws when remote not enabled', () => {
    assert.throws(
      () => new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport: async () => ({ ok: true, status: 200, body: null }), env: {} }),
      /TF_LOCAL_AGENT_ALLOW_REMOTE/,
    );
  });

  it('throws on empty apiKey', () => {
    assert.throws(
      () => new OpenAIAdapter({ apiKey: '   ', model: 'gpt-x', transport: async () => ({ ok: true, status: 200, body: null }), env: ENABLED }),
      /apiKey/,
    );
  });

  it('streams delta content from SSE data lines and stops on [DONE]', async () => {
    const { transport, captured } = scriptedTransport([
      sseData([
        { choices: [{ delta: { content: 'Hel' } }] },
        { choices: [{ delta: { content: 'lo' } }] },
        '[DONE]',
        { choices: [{ delta: { content: 'never' } }] },
      ]),
    ]);
    const adapter = new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport, env: ENABLED });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    const text = out.filter(c => c.kind === 'text').map(c => c.text).join('');
    assert.equal(text, 'Hello');
    assert.equal(out[out.length - 1].kind, 'done');
    assert.match(captured.url, /\/v1\/chat\/completions$/);
    assert.equal(captured.init.headers.authorization, 'Bearer k');
  });

  it('emits error chunk on HTTP failure', async () => {
    const { transport } = scriptedTransport([], { fail: true, status: 429, errorText: 'rate' });
    const adapter = new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport, env: ENABLED });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    assert.equal(out[0].kind, 'error');
    assert.match(out[0].text, /429/);
    assert.match(out[0].text, /rate/);
  });

  it('emits error chunk for transport throw', async () => {
    const { transport } = scriptedTransport([], { throw: 'EAI_AGAIN' });
    const adapter = new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport, env: ENABLED });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    assert.match(out[0].text, /transport failed/);
  });

  it('honors AbortSignal', async () => {
    const { transport } = scriptedTransport([
      sseData([
        { choices: [{ delta: { content: 'a' } }] },
        { choices: [{ delta: { content: 'b' } }] },
        { choices: [{ delta: { content: 'c' } }] },
      ]),
    ]);
    const adapter = new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport, env: ENABLED });
    const ac = new AbortController();
    const out = [];
    for await (const c of adapter.chat(userReq('hi'), ac.signal)) {
      out.push(c);
      if (out.length === 1) ac.abort();
    }
    assert.equal(out[out.length - 1].kind, 'error');
    assert.equal(out[out.length - 1].text, 'aborted');
  });

  it('surfaces openai error object as error chunk', async () => {
    const { transport } = scriptedTransport([
      sseData([{ error: { message: 'invalid model' } }]),
    ]);
    const adapter = new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport, env: ENABLED });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    const err = out.find(c => c.kind === 'error');
    assert.ok(err);
    assert.match(err.text, /invalid model/);
  });

  it('flags local: false', () => {
    const adapter = new OpenAIAdapter({ apiKey: 'k', model: 'gpt-x', transport: async () => ({ ok: true, status: 200, body: null }), env: ENABLED });
    assert.equal(adapter.capabilities.local, false);
    assert.equal(adapter.name, 'openai');
  });
});

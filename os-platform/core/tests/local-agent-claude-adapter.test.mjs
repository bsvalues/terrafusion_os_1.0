import assert from 'node:assert';
import { describe, it } from 'node:test';

const { ClaudeAdapter } = await import('../pilot/local-agent/index.js');

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

const sse = (events) => events.map(e => `event: ${e.event}\ndata: ${e.data}\n\n`).join('');

function userReq(content) {
  return { messages: [{ role: 'user', content }] };
}

describe('ClaudeAdapter', () => {
  it('throws when remote not enabled', () => {
    assert.throws(
      () => new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', transport: async () => ({ ok: true, status: 200, body: null }), env: {} }),
      /TF_LOCAL_AGENT_ALLOW_REMOTE/,
    );
  });

  it('throws on empty apiKey', () => {
    assert.throws(
      () => new ClaudeAdapter({ apiKey: '', model: 'claude-x', transport: async () => ({ ok: true, status: 200, body: null }), env: ENABLED }),
      /apiKey/,
    );
  });

  it('throws when no transport supplied', () => {
    assert.throws(
      () => new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', env: ENABLED }),
      /transport/,
    );
  });

  it('streams text deltas from SSE content_block_delta events', async () => {
    const { transport, captured } = scriptedTransport([
      sse([
        { event: 'content_block_delta', data: JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hel' } }) },
        { event: 'content_block_delta', data: JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'lo' } }) },
        { event: 'message_stop', data: '{}' },
      ]),
    ]);
    const adapter = new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', transport, env: ENABLED });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    const text = out.filter(c => c.kind === 'text').map(c => c.text).join('');
    assert.equal(text, 'Hello');
    assert.equal(out[out.length - 1].kind, 'done');
    assert.match(captured.url, /\/v1\/messages$/);
    assert.equal(captured.init.headers['x-api-key'], 'k');
    assert.ok(captured.init.headers['anthropic-version']);
  });

  it('emits error chunk on HTTP failure', async () => {
    const { transport } = scriptedTransport([], { fail: true, status: 401, errorText: 'unauth' });
    const adapter = new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', transport, env: ENABLED });
    const out = [];
    for await (const c of adapter.chat(userReq('hi'))) out.push(c);
    assert.equal(out[0].kind, 'error');
    assert.match(out[0].text, /401/);
  });

  it('honors AbortSignal', async () => {
    const { transport } = scriptedTransport([
      sse([
        { event: 'content_block_delta', data: JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'a' } }) },
        { event: 'content_block_delta', data: JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'b' } }) },
        { event: 'content_block_delta', data: JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'c' } }) },
      ]),
    ]);
    const adapter = new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', transport, env: ENABLED });
    const ac = new AbortController();
    const out = [];
    for await (const c of adapter.chat(userReq('hi'), ac.signal)) {
      out.push(c);
      if (out.length === 1) ac.abort();
    }
    assert.equal(out[out.length - 1].kind, 'error');
    assert.equal(out[out.length - 1].text, 'aborted');
  });

  it('skips malformed SSE data lines', async () => {
    const { transport } = scriptedTransport([
      'event: content_block_delta\ndata: not-json\n\n' +
      'event: content_block_delta\ndata: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'ok' } }) + '\n\n',
    ]);
    const adapter = new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', transport, env: ENABLED });
    const result = await adapter.complete(userReq('hi'));
    assert.equal(result.text, 'ok');
  });

  it('flags local: false', () => {
    const adapter = new ClaudeAdapter({ apiKey: 'k', model: 'claude-x', transport: async () => ({ ok: true, status: 200, body: null }), env: ENABLED });
    assert.equal(adapter.capabilities.local, false);
    assert.equal(adapter.name, 'claude');
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';

const {
  FakeModelAdapter,
  AdapterRegistry,
  aggregateChatStream,
  approximateTokenCount,
} = await import('../pilot/local-agent/index.js');

function userReq(content) {
  return { messages: [{ role: 'user', content }] };
}

describe('Local agent model adapter contract', () => {
  it('FakeModelAdapter streams scripted response in word order', async () => {
    const adapter = new FakeModelAdapter();
    adapter.respondTo('hello', 'one two three');
    const chunks = [];
    for await (const chunk of adapter.chat(userReq('hello'))) {
      chunks.push(chunk);
    }
    const text = chunks.filter(c => c.kind === 'text').map(c => c.text).join('');
    assert.equal(text, 'one two three');
    assert.equal(chunks[chunks.length - 1].kind, 'done');
  });

  it('complete() aggregates the chat stream with usage', async () => {
    const adapter = new FakeModelAdapter();
    adapter.respondTo('sum', 'alpha beta gamma');
    const result = await adapter.complete(userReq('sum'));
    assert.equal(result.text, 'alpha beta gamma');
    assert.equal(result.usage.completionTokens, 3);
    assert.equal(result.usage.promptTokens, 1);
  });

  it('falls back to default text for unscripted prompts', async () => {
    const adapter = new FakeModelAdapter().setFallback('fallback ok');
    const result = await adapter.complete(userReq('unknown'));
    assert.equal(result.text, 'fallback ok');
  });

  it('honors AbortSignal mid-stream', async () => {
    const adapter = new FakeModelAdapter();
    adapter.respondTo('long', 'a b c d e f g h i j');
    const ac = new AbortController();
    const chunks = [];
    for await (const chunk of adapter.chat(userReq('long'), ac.signal)) {
      chunks.push(chunk);
      if (chunks.length === 3) ac.abort();
    }
    const last = chunks[chunks.length - 1];
    assert.equal(last.kind, 'error');
    assert.equal(last.text, 'aborted');
  });

  it('emits error chunk after close()', async () => {
    const adapter = new FakeModelAdapter();
    await adapter.close();
    const chunks = [];
    for await (const chunk of adapter.chat(userReq('x'))) {
      chunks.push(chunk);
    }
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].kind, 'error');
  });

  it('exposes capability flags', () => {
    const adapter = new FakeModelAdapter();
    assert.equal(adapter.name, 'fake');
    assert.equal(adapter.capabilities.streaming, true);
    assert.equal(adapter.capabilities.local, true);
    assert.equal(adapter.capabilities.tools, false);
    assert.equal(typeof adapter.capabilities.maxContextTokens, 'number');
  });

  it('AdapterRegistry register/get/list round-trip', () => {
    const registry = new AdapterRegistry();
    const a = new FakeModelAdapter();
    registry.register(a);
    assert.equal(registry.get('fake'), a);
    assert.equal(registry.has('fake'), true);
    assert.deepEqual(registry.list().map(x => x.name), ['fake']);
  });

  it('AdapterRegistry rejects duplicate name', () => {
    const registry = new AdapterRegistry();
    registry.register(new FakeModelAdapter());
    assert.throws(() => registry.register(new FakeModelAdapter()), /already registered/);
  });

  it('AdapterRegistry.require throws for missing name', () => {
    const registry = new AdapterRegistry();
    assert.throws(() => registry.require('missing'), /not registered/);
  });

  it('approximateTokenCount counts whitespace-delimited words', () => {
    assert.equal(approximateTokenCount(''), 0);
    assert.equal(approximateTokenCount('one'), 1);
    assert.equal(approximateTokenCount('  one  two\tthree\n'), 3);
  });

  it('aggregateChatStream surfaces error chunks as thrown errors', async () => {
    async function* errorStream() {
      yield { kind: 'text', text: 'partial ' };
      yield { kind: 'error', text: 'boom' };
    }
    await assert.rejects(aggregateChatStream(errorStream(), 0), /boom/);
  });
});

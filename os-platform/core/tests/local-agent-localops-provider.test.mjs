import assert from 'node:assert';
import { describe, it } from 'node:test';

const {
  createLocalOpsProvider,
  isLocalOpsProblem,
  isLocalOpsSuccess,
  resolveAiProfile,
  FakeModelAdapter,
} = await import('../pilot/local-agent/index.js');

const userReq = content => ({ messages: [{ role: 'user', content }] });

/** Minimal local adapter that always throws on complete(). */
function throwingLocalAdapter() {
  return {
    name: 'boom',
    capabilities: {
      streaming: true,
      tools: false,
      vision: false,
      local: true,
      maxContextTokens: 4096,
    },
    // eslint-disable-next-line require-yield
    async *chat() {
      throw new Error('local model socket refused');
    },
    async complete() {
      throw new Error('local model socket refused');
    },
    async close() {},
  };
}

describe('LocalOps provider abstraction (WO-LOCALOPS-002)', () => {
  it('localops + local provider (ollama) is allowed and status is success', () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'llama3' },
    });
    assert.strictEqual(provider.kind, 'local');
    const status = provider.status();
    assert.strictEqual(status.ok, true);
    assert.strictEqual(status.status, 'success');
    assert.strictEqual(status.adapter, 'ollama');
    assert.strictEqual(status.config.profile, 'localops');
    assert.strictEqual(status.config.externalCalls, false);
    assert.strictEqual(status.problem, undefined);
  });

  it('localops + external provider is refused (status=refused) with AX fields', async () => {
    for (const external of ['openai', 'claude', 'anthropic']) {
      const provider = createLocalOpsProvider({
        env: { AI_PROFILE: 'localops', AI_PROVIDER: external, AI_MODEL: 'gpt' },
      });
      assert.strictEqual(provider.kind, 'refusing');
      const result = await provider.complete(userReq('hello'));
      assert.ok(isLocalOpsProblem(result));
      assert.strictEqual(result.status, 'refused');
      assert.strictEqual(result.reasonCode, 'EXTERNAL_PROVIDER_REFUSED');
      assert.strictEqual(result.profile, 'localops');
      assert.strictEqual(result.provider, external);
      assert.strictEqual(result.violatedConstraint, 'no_external_calls');
      assert.ok(Array.isArray(result.safeAlternatives) && result.safeAlternatives.length > 0);
      assert.match(result.message, /forbids/);
    }
  });

  it('disabled profile refuses all AI calls (status=disabled; also the unset default)', async () => {
    for (const env of [{ AI_PROFILE: 'disabled' }, {}]) {
      const provider = createLocalOpsProvider({ env });
      assert.strictEqual(provider.kind, 'disabled');
      const result = await provider.complete(userReq('anything'));
      assert.ok(isLocalOpsProblem(result));
      assert.strictEqual(result.status, 'disabled');
      assert.strictEqual(result.reasonCode, 'AI_DISABLED');
      assert.strictEqual(result.violatedConstraint, 'ai_disabled');
      const status = provider.status();
      assert.strictEqual(status.ok, false);
      assert.strictEqual(status.status, 'disabled');
    }
  });

  it('missing provider is misconfigured (distinct from unavailable)', async () => {
    const provider = createLocalOpsProvider({ env: { AI_PROFILE: 'localops' } });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.strictEqual(result.status, 'misconfigured');
    assert.strictEqual(result.reasonCode, 'PROVIDER_NOT_CONFIGURED');
  });

  it('unknown provider is misconfigured', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'mystery-cloud', AI_MODEL: 'm' },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.strictEqual(result.status, 'misconfigured');
    assert.strictEqual(result.reasonCode, 'UNKNOWN_PROVIDER_REFUSED');
  });

  it('non-loopback base URL is unavailable (loopback_only), not success', async () => {
    const provider = createLocalOpsProvider({
      env: {
        AI_PROFILE: 'localops',
        AI_PROVIDER: 'ollama',
        AI_MODEL: 'llama3',
        AI_BASE_URL: 'http://models.example.com:11434',
      },
    });
    assert.strictEqual(provider.kind, 'refusing');
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.strictEqual(result.status, 'unavailable');
    assert.strictEqual(result.reasonCode, 'PROVIDER_UNAVAILABLE');
    assert.strictEqual(result.violatedConstraint, 'loopback_only');
    assert.match(result.message, /loopback/);
  });

  it('missing model is unavailable', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama' },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.strictEqual(result.status, 'unavailable');
    assert.strictEqual(result.reasonCode, 'PROVIDER_UNAVAILABLE');
  });

  it('injected non-local adapter is refused under localops (local_only)', async () => {
    const fake = new FakeModelAdapter();
    Object.defineProperty(fake, 'capabilities', { value: { ...fake.capabilities, local: false } });
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' },
      adapter: fake,
    });
    assert.strictEqual(provider.kind, 'refusing');
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.strictEqual(result.status, 'refused');
    assert.strictEqual(result.reasonCode, 'NON_LOCAL_ADAPTER_REFUSED');
    assert.strictEqual(result.violatedConstraint, 'local_only');
  });

  it('localops + injected local adapter completes (status=success) without network', async () => {
    const fake = new FakeModelAdapter();
    fake.respondTo('ping', 'pong from local model');
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' },
      adapter: fake,
    });
    assert.strictEqual(provider.kind, 'local');
    const result = await provider.complete(userReq('ping'));
    assert.ok(isLocalOpsSuccess(result));
    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.completion.text, 'pong from local model');
    await provider.close();
  });

  it('local provider failure at call time is `failed`, NOT silent fallback success', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' },
      adapter: throwingLocalAdapter(),
    });
    assert.strictEqual(provider.kind, 'local'); // ready until the call actually fails
    const result = await provider.complete(userReq('x'));
    assert.ok(
      isLocalOpsProblem(result),
      'must be a structured problem, not a thrown error or a success'
    );
    assert.strictEqual(isLocalOpsSuccess(result), false);
    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.reasonCode, 'LOCAL_PROVIDER_FAILED');
    // failed is distinct from refused/disabled/unavailable/misconfigured
    assert.notStrictEqual(result.status, 'refused');
  });

  it('hybrid-approved + external is unavailable (not implemented), distinct from refused', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'hybrid-approved', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.strictEqual(result.status, 'unavailable');
    assert.strictEqual(result.reasonCode, 'EXTERNAL_NOT_IMPLEMENTED');
  });

  it('the six outcome statuses are all reachable and distinct', async () => {
    const seen = new Set();
    const cases = [
      { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm', __adapter: 'ok' }, // success
      { AI_PROFILE: 'localops', AI_PROVIDER: 'openai', AI_MODEL: 'm' }, // refused
      { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm', __adapter: 'throw' }, // failed
      { AI_PROFILE: 'disabled' }, // disabled
      { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama' }, // unavailable (no model)
      { AI_PROFILE: 'localops', AI_PROVIDER: 'nope', AI_MODEL: 'm' }, // misconfigured
    ];
    for (const { __adapter, ...env } of cases) {
      let adapter;
      if (__adapter === 'ok') {
        adapter = new FakeModelAdapter();
        adapter.respondTo('hi', 'ok');
      } else if (__adapter === 'throw') {
        adapter = throwingLocalAdapter();
      }
      const provider = createLocalOpsProvider({ env, ...(adapter ? { adapter } : {}) });
      const result = await provider.complete(userReq('hi'));
      seen.add(result.status);
    }
    for (const s of ['success', 'refused', 'failed', 'disabled', 'unavailable', 'misconfigured']) {
      assert.ok(seen.has(s), `outcome status '${s}' must be reachable`);
    }
  });

  it('status output redacts sensitive values', () => {
    const config = resolveAiProfile({
      AI_PROFILE: 'localops',
      AI_PROVIDER: 'ollama',
      AI_MODEL: 'sk-abcdefghijklmnopqrstuvwxyz123456',
      AI_BASE_URL: 'http://user:hunter2@127.0.0.1:11434',
    });
    const provider = createLocalOpsProvider({ config });
    const flat = JSON.stringify(provider.status());
    assert.ok(!flat.includes('hunter2'), 'URL password must not appear in status');
    assert.ok(
      !flat.includes('sk-abcdefghijklmnopqrstuvwxyz123456'),
      'api-key-shaped model must be redacted'
    );
  });

  it('problem messages are redaction-safe', async () => {
    const provider = createLocalOpsProvider({
      env: {
        AI_PROFILE: 'localops',
        AI_PROVIDER: 'mystery sk-abcdefghijklmnopqrstuvwxyz123456',
        AI_MODEL: 'm',
      },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsProblem(result));
    assert.ok(!result.message.includes('sk-abcdefghijklmnopqrstuvwxyz123456'));
  });
});

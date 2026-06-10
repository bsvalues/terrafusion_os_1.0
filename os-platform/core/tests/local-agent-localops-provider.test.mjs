import assert from 'node:assert';
import { describe, it } from 'node:test';

const { createLocalOpsProvider, isLocalOpsRefusal, resolveAiProfile, FakeModelAdapter } =
  await import('../pilot/local-agent/index.js');

const userReq = content => ({ messages: [{ role: 'user', content }] });

describe('LocalOps provider abstraction (WO-LOCALOPS-002)', () => {
  it('localops + local provider (ollama) is allowed and reports status', () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'llama3' },
    });
    assert.strictEqual(provider.kind, 'local');
    const status = provider.status();
    assert.strictEqual(status.ok, true);
    assert.strictEqual(status.adapter, 'ollama');
    assert.strictEqual(status.config.profile, 'localops');
    assert.strictEqual(status.config.provider, 'ollama');
    assert.strictEqual(status.config.externalCalls, false);
  });

  it('localops + external provider is refused with structured reason', async () => {
    for (const external of ['openai', 'claude', 'anthropic']) {
      const provider = createLocalOpsProvider({
        env: { AI_PROFILE: 'localops', AI_PROVIDER: external, AI_MODEL: 'gpt' },
      });
      assert.strictEqual(provider.kind, 'refusing');
      const result = await provider.complete(userReq('hello'));
      assert.ok(isLocalOpsRefusal(result));
      assert.strictEqual(result.code, 'EXTERNAL_PROVIDER_REFUSED');
      assert.strictEqual(result.profile, 'localops');
      assert.match(result.reason, /forbids/);
    }
  });

  it('disabled profile refuses all AI calls (and is the unset default)', async () => {
    for (const env of [{ AI_PROFILE: 'disabled' }, {}]) {
      const provider = createLocalOpsProvider({ env });
      assert.strictEqual(provider.kind, 'disabled');
      const result = await provider.complete(userReq('anything'));
      assert.ok(isLocalOpsRefusal(result));
      assert.strictEqual(result.code, 'AI_DISABLED');
      assert.strictEqual(provider.status().ok, false);
    }
  });

  it('missing provider fails closed', async () => {
    const provider = createLocalOpsProvider({ env: { AI_PROFILE: 'localops' } });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsRefusal(result));
    assert.strictEqual(result.code, 'PROVIDER_NOT_CONFIGURED');
  });

  it('unknown provider fails closed', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'mystery-cloud', AI_MODEL: 'm' },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsRefusal(result));
    assert.strictEqual(result.code, 'UNKNOWN_PROVIDER_REFUSED');
  });

  it('non-loopback base URL for the local provider fails closed', async () => {
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
    assert.ok(isLocalOpsRefusal(result));
    assert.strictEqual(result.code, 'PROVIDER_UNAVAILABLE');
    assert.match(result.reason, /loopback/);
  });

  it('missing model for the local provider fails closed', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama' },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsRefusal(result));
    assert.strictEqual(result.code, 'PROVIDER_UNAVAILABLE');
  });

  it('injected adapter without local capability is refused under localops', async () => {
    const fake = new FakeModelAdapter();
    Object.defineProperty(fake, 'capabilities', {
      value: { ...fake.capabilities, local: false },
    });
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' },
      adapter: fake,
    });
    assert.strictEqual(provider.kind, 'refusing');
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsRefusal(result));
    assert.strictEqual(result.code, 'NON_LOCAL_ADAPTER_REFUSED');
  });

  it('localops + injected local adapter completes end-to-end without network', async () => {
    const fake = new FakeModelAdapter();
    fake.respondTo('ping', 'pong from local model');
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' },
      adapter: fake,
    });
    assert.strictEqual(provider.kind, 'local');
    const result = await provider.complete(userReq('ping'));
    assert.ok(!isLocalOpsRefusal(result));
    assert.strictEqual(result.text, 'pong from local model');
    await provider.close();
  });

  it('hybrid-approved + external provider returns honest not-implemented refusal', async () => {
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'hybrid-approved', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsRefusal(result));
    assert.strictEqual(result.code, 'EXTERNAL_NOT_IMPLEMENTED');
  });

  it('status output redacts sensitive values', () => {
    const config = resolveAiProfile({
      AI_PROFILE: 'localops',
      AI_PROVIDER: 'ollama',
      AI_MODEL: 'sk-abcdefghijklmnopqrstuvwxyz123456',
      AI_BASE_URL: 'http://user:hunter2@127.0.0.1:11434',
    });
    const provider = createLocalOpsProvider({ config });
    const status = provider.status();
    const flat = JSON.stringify(status);
    assert.ok(!flat.includes('hunter2'), 'URL password must not appear in status');
    assert.ok(
      !flat.includes('sk-abcdefghijklmnopqrstuvwxyz123456'),
      'api-key-shaped model must be redacted'
    );
  });

  it('refusal reasons are redaction-safe', async () => {
    const provider = createLocalOpsProvider({
      env: {
        AI_PROFILE: 'localops',
        AI_PROVIDER: 'mystery sk-abcdefghijklmnopqrstuvwxyz123456',
        AI_MODEL: 'm',
      },
    });
    const result = await provider.complete(userReq('x'));
    assert.ok(isLocalOpsRefusal(result));
    assert.ok(!result.reason.includes('sk-abcdefghijklmnopqrstuvwxyz123456'));
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';

const {
  AI_PROFILES,
  DEFAULT_AI_PROFILE,
  DEFAULT_LOCAL_KB_PATH,
  DEFAULT_RUNBOOK_PATH,
  AiProfileError,
  isAiProfileName,
  resolveAiProfile,
  redactedAiProfileSummary,
} = await import('../pilot/local-agent/index.js');

describe('AI profile contract (WO-LOCALOPS-001)', () => {
  it('exposes the four canonical profiles', () => {
    assert.deepStrictEqual([...AI_PROFILES], ['cloud-dev', 'hybrid-approved', 'localops', 'disabled']);
    for (const name of AI_PROFILES) assert.ok(isAiProfileName(name));
    assert.strictEqual(isAiProfileName('odysseus'), false);
  });

  it('defaults to disabled when AI_PROFILE is unset (AI is opt-in)', () => {
    const config = resolveAiProfile({});
    assert.strictEqual(config.profile, DEFAULT_AI_PROFILE);
    assert.strictEqual(config.profile, 'disabled');
    assert.strictEqual(config.externalCalls, false);
    assert.strictEqual(config.allowWeb, false);
    assert.strictEqual(config.allowShell, false);
    assert.strictEqual(config.allowMutation, false);
  });

  it('rejects unknown AI_PROFILE values instead of coercing', () => {
    assert.throws(() => resolveAiProfile({ AI_PROFILE: 'localop' }), AiProfileError);
    assert.throws(() => resolveAiProfile({ AI_PROFILE: 'cloud' }), AiProfileError);
  });

  it('localops resolves to safe defaults', () => {
    const config = resolveAiProfile({ AI_PROFILE: 'localops' });
    assert.strictEqual(config.externalCalls, false);
    assert.strictEqual(config.allowWeb, false);
    assert.strictEqual(config.allowShell, false);
    assert.strictEqual(config.allowMutation, false);
    assert.strictEqual(config.requireTrace, true);
    assert.strictEqual(config.requireSources, true);
    assert.strictEqual(config.localKbPath, DEFAULT_LOCAL_KB_PATH);
    assert.strictEqual(config.runbookPath, DEFAULT_RUNBOOK_PATH);
  });

  it('disabled resolves to all AI action disabled', () => {
    const config = resolveAiProfile({ AI_PROFILE: 'disabled' });
    assert.strictEqual(config.externalCalls, false);
    assert.strictEqual(config.allowWeb, false);
    assert.strictEqual(config.allowShell, false);
    assert.strictEqual(config.allowMutation, false);
  });

  it('localops cannot be loosened — granting external calls is rejected', () => {
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'localops', AI_EXTERNAL_CALLS: 'true' }),
      AiProfileError,
    );
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'localops', AI_ALLOW_SHELL: '1' }),
      AiProfileError,
    );
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'localops', AI_ALLOW_MUTATION: 'true' }),
      AiProfileError,
    );
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'disabled', AI_ALLOW_WEB: 'true' }),
      AiProfileError,
    );
  });

  it('localops cannot drop safety requirements (trace/sources)', () => {
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'localops', AI_REQUIRE_TRACE: 'false' }),
      AiProfileError,
    );
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'localops', AI_REQUIRE_SOURCES: '0' }),
      AiProfileError,
    );
  });

  it('tightening localops further is allowed', () => {
    const config = resolveAiProfile({
      AI_PROFILE: 'localops',
      AI_EXTERNAL_CALLS: 'false',
      AI_REQUIRE_TRACE: 'true',
    });
    assert.strictEqual(config.externalCalls, false);
    assert.strictEqual(config.requireTrace, true);
  });

  it('cloud-dev permits external calls; hybrid-approved requires sources', () => {
    const cloudDev = resolveAiProfile({ AI_PROFILE: 'cloud-dev' });
    assert.strictEqual(cloudDev.externalCalls, true);
    assert.strictEqual(cloudDev.allowMutation, false);
    const hybrid = resolveAiProfile({ AI_PROFILE: 'hybrid-approved' });
    assert.strictEqual(hybrid.externalCalls, true);
    assert.strictEqual(hybrid.requireSources, true);
    // Non-tighten-only profiles accept explicit overrides in both directions.
    const tightened = resolveAiProfile({ AI_PROFILE: 'cloud-dev', AI_EXTERNAL_CALLS: 'false' });
    assert.strictEqual(tightened.externalCalls, false);
  });

  it('rejects malformed boolean flag values', () => {
    assert.throws(
      () => resolveAiProfile({ AI_PROFILE: 'cloud-dev', AI_ALLOW_WEB: 'yes' }),
      AiProfileError,
    );
  });

  it('carries provider/baseUrl/model/paths from env without inventing ports', () => {
    const config = resolveAiProfile({
      AI_PROFILE: 'localops',
      AI_PROVIDER: 'ollama',
      AI_BASE_URL: 'http://127.0.0.1:11434',
      AI_MODEL: 'llama3',
      AI_LOCAL_KB_PATH: 'docs/localops',
      AI_RUNBOOK_PATH: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
    });
    assert.strictEqual(config.provider, 'ollama');
    assert.strictEqual(config.baseUrl, 'http://127.0.0.1:11434');
    assert.strictEqual(config.model, 'llama3');
    const bare = resolveAiProfile({ AI_PROFILE: 'localops' });
    assert.strictEqual(bare.baseUrl, '');
  });

  it('redacted summary strips URL credentials and secret-shaped values', () => {
    const config = resolveAiProfile({
      AI_PROFILE: 'hybrid-approved',
      AI_PROVIDER: 'openai',
      AI_BASE_URL: 'https://user:hunter2@api.example.com/v1',
      AI_MODEL: 'sk-abcdefghijklmnopqrstuvwxyz123456',
    });
    const summary = redactedAiProfileSummary(config);
    assert.ok(!JSON.stringify(summary).includes('hunter2'), 'URL password must not survive');
    assert.ok(!JSON.stringify(summary).includes('sk-abcdefghijklmnopqrstuvwxyz123456'), 'api-key-shaped value must be redacted');
    assert.strictEqual(summary.profile, 'hybrid-approved');
    assert.strictEqual(summary.externalCalls, true);
  });
});

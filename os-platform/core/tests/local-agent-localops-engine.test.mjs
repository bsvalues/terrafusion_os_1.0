// WO-AI-CONSOLIDATION-001 — LocalOps engine proof.
//
// Proves the LocalOps engine (provider/engine layer) turns the local brain into
// a governed answer path: local-only (no egress / no silent fallback),
// source-grounded, trace-emitting, read-only — and emits the in-shell panel's
// LocalOpsViewModel shape. Offline; no network; no .NET Muse dependency.

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const { createLocalOpsEngine, FakeModelAdapter } = await import(
  '../pilot/local-agent/index.js'
);

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const localopsEnv = { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' };

/** A local adapter that counts how many times the model is actually invoked. */
function countingLocalAdapter() {
  const state = { calls: 0 };
  return {
    adapter: {
      name: 'counting',
      capabilities: { streaming: true, tools: false, vision: false, local: true, maxContextTokens: 4096 },
      // eslint-disable-next-line require-yield
      async *chat() {
        state.calls += 1;
      },
      async complete() {
        state.calls += 1;
        return { text: 'should not be reached' };
      },
      async close() {},
    },
    state,
  };
}

describe('LocalOps engine (WO-AI-CONSOLIDATION-001)', () => {
  it('answers locally, source-grounded, and emits trace (success path)', async () => {
    const fake = new FakeModelAdapter();
    fake.respondTo('provider status', 'Local grounded answer about provider status.');
    const engine = createLocalOpsEngine({ env: localopsEnv, repoRoot: REPO_ROOT, adapter: fake });

    const ans = await engine.ask('provider status');
    assert.strictEqual(ans.answered, true);
    assert.ok(ans.text && ans.text.includes('Local grounded answer'));
    assert.strictEqual(ans.grounded, true);
    assert.ok(ans.sources.length > 0);
    assert.ok(ans.sources[0].sourceFile.startsWith('docs/'));

    const vm = engine.viewModel();
    assert.strictEqual(vm.profile, 'localops');
    assert.strictEqual(vm.flags.externalCalls, false);
    assert.strictEqual(vm.flags.allowMutation, false);
    assert.strictEqual(vm.providerStatus.ok, true);
    const types = vm.traceEvents.map(e => e.type);
    assert.ok(types.includes('localops.ai.requested'));
    assert.ok(types.includes('localops.ai.responded'));
    assert.ok(types.includes('localops.rag.retrieved'));
    assert.ok(vm.diagnostics.length >= 1);
    await engine.close();
  });

  it('makes zero external calls and never silently falls back (external profile refused)', async () => {
    const calls = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (...args) => {
      calls.push(args);
      throw new Error('egress blocked by proof');
    };
    try {
      const engine = createLocalOpsEngine({
        env: { AI_PROFILE: 'localops', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
        repoRoot: REPO_ROOT,
      });
      const ans = await engine.ask('help me');
      assert.strictEqual(ans.answered, false);
      assert.strictEqual(ans.text, null);
      assert.ok(ans.refusal && ans.refusal.status === 'refused');
      const vm = engine.viewModel();
      assert.strictEqual(vm.providerStatus.ok, false);
      assert.ok(vm.refusal, 'refusal surfaced in the view model');
    } finally {
      globalThis.fetch = realFetch;
    }
    assert.strictEqual(calls.length, 0, 'no external network call may be attempted');
  });

  it('refuses ungrounded answers WITHOUT calling the model when sources are required', async () => {
    const counting = countingLocalAdapter();
    const engine = createLocalOpsEngine({
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
      repoRoot: REPO_ROOT,
      adapter: counting.adapter,
    });
    const ans = await engine.ask('zxqwvkplm qbvqwxz fghjkvmn');
    assert.strictEqual(ans.answered, false);
    assert.ok(ans.refusal);
    assert.strictEqual(ans.refusal.reasonCode, 'NO_GROUNDING');
    assert.strictEqual(counting.state.calls, 0, 'the model must not be called for an ungrounded ask');
    const types = engine.viewModel().traceEvents.map(e => e.type);
    assert.ok(types.includes('localops.policy.refused'));
    await engine.close();
  });

  it('is read-only and emits the panel LocalOpsViewModel shape', () => {
    const engine = createLocalOpsEngine({ env: localopsEnv, repoRoot: REPO_ROOT });
    const vm = engine.viewModel();
    for (const key of [
      'profile',
      'provider',
      'flags',
      'providerStatus',
      'diagnostics',
      'grounded',
      'sources',
      'traceEvents',
    ]) {
      assert.ok(key in vm, `view model must expose ${key}`);
    }
    for (const flag of [
      'externalCalls',
      'allowWeb',
      'allowShell',
      'allowMutation',
      'requireTrace',
      'requireSources',
    ]) {
      assert.ok(flag in vm.flags, `flags must expose ${flag}`);
    }
    assert.strictEqual(vm.flags.allowMutation, false);
    assert.strictEqual(vm.flags.allowShell, false);
    assert.strictEqual(typeof engine.ask, 'function');
    assert.strictEqual(engine.write, undefined, 'engine exposes no mutation surface');
    assert.strictEqual(engine.exec, undefined, 'engine exposes no exec surface');
  });
});

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

const { createLocalOpsEngine } = await import(
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

function firstGroundingSource(system) {
  const match = system.match(/\[1\]\s+([^\s—\r\n]+)/);
  assert.ok(match, 'grounding system must contain a first source filename');
  return match[1];
}

function sourceCitingAdapter(answerText = 'Local grounded answer about provider status.') {
  return {
    name: 'source-citing',
    capabilities: { streaming: true, tools: false, vision: false, local: true, maxContextTokens: 4096 },
    async *chat() {},
    async complete(request) {
      return { text: `${answerText} [source: ${firstGroundingSource(request.system)}]` };
    },
    async close() {},
  };
}

describe('LocalOps engine (WO-AI-CONSOLIDATION-001)', () => {
  it('answers locally, source-grounded, and emits trace (success path)', async () => {
    const engine = createLocalOpsEngine({
      env: localopsEnv,
      repoRoot: REPO_ROOT,
      adapter: sourceCitingAdapter(),
    });

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

  it('supplies bounded retrieved evidence to the model as the grounding contract', async () => {
    let captured;
    const adapter = {
      name: 'capturing',
      capabilities: { streaming: true, tools: false, vision: false, local: true, maxContextTokens: 4096 },
      async *chat() {},
      async complete(request) {
        captured = request;
        return {
          text: `A bounded answer. [source: ${firstGroundingSource(request.system)}]`,
          usage: { promptTokens: 1, completionTokens: 3 },
        };
      },
      async close() {},
    };
    const engine = createLocalOpsEngine({
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
      repoRoot: REPO_ROOT,
      adapter,
    });

    const answer = await engine.ask('provider status');
    assert.equal(answer.answered, true);
    assert.ok(captured.system.includes('Use only the bounded local evidence below'));
    assert.ok(captured.system.includes('docs/'));
    assert.ok(captured.system.length < 2500, 'grounding context must stay bounded');
    assert.equal(captured.messages.at(-1).content, 'provider status');
    await engine.close();
  });

  it('refuses a completion that does not cite a retrieved source', async () => {
    const adapter = {
      ...sourceCitingAdapter(),
      async complete() {
        return { text: 'A plausible but uncited answer.' };
      },
    };
    const engine = createLocalOpsEngine({
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
      repoRoot: REPO_ROOT,
      adapter,
    });

    const answer = await engine.ask('provider status');
    assert.equal(answer.answered, false);
    assert.equal(answer.grounded, false);
    assert.equal(answer.refusal.reasonCode, 'UNVERIFIED_SOURCE_CITATION');
    assert.equal(engine.viewModel().grounded, false);
    await engine.close();
  });

  it('accepts a numbered citation only when it maps to retrieved evidence', async () => {
    const adapter = {
      ...sourceCitingAdapter(),
      async complete() {
        return { text: 'A bounded answer supported by the first retrieved excerpt [1].' };
      },
    };
    const engine = createLocalOpsEngine({
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
      repoRoot: REPO_ROOT,
      adapter,
    });

    const answer = await engine.ask('provider status');
    assert.equal(answer.answered, true);
    assert.equal(answer.grounded, true);
    assert.equal(answer.sources.length, 1);
    await engine.close();
  });

  it('refuses a completion that invents a source citation', async () => {
    const adapter = {
      ...sourceCitingAdapter(),
      async complete(request) {
        return {
          text: `Supported [source: ${firstGroundingSource(request.system)}] and invented [99]`,
        };
      },
    };
    const engine = createLocalOpsEngine({
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
      repoRoot: REPO_ROOT,
      adapter,
    });

    const answer = await engine.ask('provider status');
    assert.equal(answer.answered, false);
    assert.equal(answer.refusal.reasonCode, 'UNVERIFIED_SOURCE_CITATION');
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

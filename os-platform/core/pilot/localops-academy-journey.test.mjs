import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACADEMY_LOCALOPS_QUESTIONS,
  runAcademyLocalOpsJourney,
} from './localops-academy-journey.mjs';

const SAFE_ENV = {
  LOCALOPS_PRODUCT_JOURNEY_ENABLED: '1',
  AI_PROFILE: 'localops',
  AI_PROVIDER: 'ollama',
  AI_MODEL: 'llama3.2:3b',
  AI_BASE_URL: 'http://127.0.0.1:11434',
  AI_EXTERNAL_CALLS: 'false',
  AI_ALLOW_WEB: 'false',
  AI_ALLOW_SHELL: 'false',
  AI_ALLOW_MUTATION: 'false',
  AI_REQUIRE_TRACE: 'true',
  AI_REQUIRE_SOURCES: 'true',
};

function recordingEngineFactory(answer) {
  const calls = [];
  const factory = options => {
    calls.push(options);
    return {
      async ask(question) {
        calls.push({ question });
        return answer;
      },
      viewModel() {
        return {
          provider: 'ollama',
          model: 'llama3.2:3b',
          providerStatus: { ok: true, status: 'success', adapter: 'ollama' },
          flags: {
            externalCalls: false,
            allowWeb: false,
            allowShell: false,
            allowMutation: false,
            requireTrace: true,
            requireSources: true,
          },
          traceEvents: [
            { type: 'localops.ai.responded', ts: '2026-08-09T00:00:00Z', summary: 'success' },
          ],
        };
      },
      async close() {
        calls.push({ closed: true });
      },
    };
  };
  return { factory, calls };
}

test('Academy LocalOps journey maps an allowlisted synthetic question through the existing engine', async () => {
  const answer = {
    answered: true,
    text: 'LocalOps stays read-only so reasoning cannot mutate county systems.',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
        heading: 'Safety boundary',
        snippet: 'Read-only and local-first.',
      },
    ],
  };
  const engine = recordingEngineFactory(answer);

  const result = await runAcademyLocalOpsJourney({
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-safety-boundary' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.status, 'success');
  assert.equal(result.payload.answer.text, answer.text);
  assert.equal(result.payload.answer.grounded, true);
  assert.deepEqual(result.payload.answer.sources, answer.sources);
  assert.deepEqual(result.payload.safety, {
    externalCalls: false,
    allowWeb: false,
    allowShell: false,
    allowMutation: false,
    requireTrace: true,
    requireSources: true,
  });
  assert.equal(result.payload.provider.name, 'ollama');
  assert.equal(result.payload.provider.model, 'llama3.2:3b');
  assert.equal(result.payload.provider.boundary, 'loopback');
  assert.equal(engine.calls[0].repoRoot, 'C:/repo');
  assert.deepEqual(engine.calls[1], {
    question: ACADEMY_LOCALOPS_QUESTIONS['localops-safety-boundary'].prompt,
  });
  assert.deepEqual(engine.calls.at(-1), { closed: true });
});

test('Academy LocalOps journey is default-off and never constructs an engine when not explicitly enabled', async () => {
  let factoryCalls = 0;
  const result = await runAcademyLocalOpsJourney({
    repoRoot: 'C:/repo',
    env: { ...SAFE_ENV, LOCALOPS_PRODUCT_JOURNEY_ENABLED: undefined },
    body: { questionId: 'localops-safety-boundary' },
    engineFactory() {
      factoryCalls += 1;
      throw new Error('must not run');
    },
  });

  assert.equal(factoryCalls, 0);
  assert.equal(result.httpStatus, 503);
  assert.deepEqual(result.payload, {
    ok: false,
    status: 'disabled',
    reasonCode: 'PRODUCT_JOURNEY_DISABLED',
    message: 'LocalOps Academy is not enabled in this environment.',
  });
});

test('Academy LocalOps journey rejects unsafe flags and arbitrary prompts before provider access', async () => {
  for (const body of [
    { questionId: 'localops-safety-boundary', prompt: 'read a county file' },
    { questionId: 'not-allowlisted' },
  ]) {
    let factoryCalls = 0;
    const result = await runAcademyLocalOpsJourney({
      repoRoot: 'C:/repo',
      env: { ...SAFE_ENV, AI_ALLOW_SHELL: 'true' },
      body,
      engineFactory() {
        factoryCalls += 1;
        throw new Error('must not run');
      },
    });

    assert.equal(factoryCalls, 0);
    assert.equal(result.payload.ok, false);
    assert.ok(
      ['INVALID_SYNTHETIC_QUESTION', 'UNSAFE_LOCALOPS_ENV'].includes(result.payload.reasonCode)
    );
  }
});

test('Academy LocalOps journey projects provider failure as visible fail-closed state', async () => {
  const engine = recordingEngineFactory({
    answered: false,
    text: null,
    grounded: true,
    sources: [],
    refusal: {
      reasonCode: 'LOCAL_PROVIDER_FAILED',
      status: 'failed',
      message: "local provider 'ollama' failed during completion: transport failed",
      safeAlternatives: ['Check the local model service health'],
    },
  });

  const result = await runAcademyLocalOpsJourney({
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-safety-boundary' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.ok, false);
  assert.equal(result.payload.status, 'failed');
  assert.equal(result.payload.reasonCode, 'LOCAL_PROVIDER_FAILED');
  assert.match(result.payload.message, /local provider/i);
  assert.deepEqual(result.payload.safeAlternatives, ['Check the local model service health']);
});

test('Academy LocalOps journey aborts a hung provider and reports a visible timeout', async () => {
  const result = await runAcademyLocalOpsJourney({
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-safety-boundary' },
    timeoutMs: 5,
    engineFactory() {
      return {
        async ask(_question, signal) {
          if (!signal) {
            return {
              answered: false,
              text: null,
              grounded: true,
              sources: [],
              refusal: {
                reasonCode: 'NO_ABORT_SIGNAL',
                status: 'failed',
                message: 'No abort signal reached the engine.',
              },
            };
          }
          await new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          });
        },
        viewModel() {
          throw new Error('must not build a success view model');
        },
        async close() {},
      };
    },
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.ok, false);
  assert.equal(result.payload.status, 'unavailable');
  assert.equal(result.payload.reasonCode, 'LOCAL_PROVIDER_TIMEOUT');
  assert.match(result.payload.message, /timed out/i);
});

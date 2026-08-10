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
  AI_BASE_URL: 'http://127.0.0.1:11455',
  LOCALOPS_HERMES_TUNNEL_PORT: '11455',
  LOCALOPS_TRANSPORT_BOUNDARY: 'hermes-ssh-tunnel',
  AI_EXTERNAL_CALLS: 'false',
  AI_ALLOW_WEB: 'false',
  AI_ALLOW_SHELL: 'false',
  AI_ALLOW_MUTATION: 'false',
  AI_REQUIRE_TRACE: 'true',
  AI_REQUIRE_SOURCES: 'true',
};
const TRACE_EVENTS = [];
const TRACE_OPTIONS = {
  traceEmitter: { emit: event => TRACE_EVENTS.push(event) },
  traceContext: {
    countyId: '19190019-1919-1919-1919-191919191919',
    userId: 'academy-user',
    roles: [],
    mode: 'pilot',
  },
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
          ...(answer.answered && answer.text
            ? { insight: { text: answer.text, grounded: true } }
            : {}),
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
  TRACE_EVENTS.length = 0;
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
    ...TRACE_OPTIONS,
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
  assert.equal(result.payload.provider.boundary, 'hermes-ssh-tunnel');
  assert.equal(engine.calls[0].repoRoot, 'C:/repo');
  assert.equal(engine.calls[0].sink.name, 'terratrace-bridge');
  engine.calls[0].sink.emit({
    type: 'localops.ai.requested',
    ts: '2026-08-09T00:00:00Z',
    correlationId: 'corr-academy-test',
    schemaVersion: '1.0.0',
    summary: 'Academy LocalOps request',
    data: { profile: 'localops', provider: 'ollama' },
  });
  assert.equal(TRACE_EVENTS.length, 1);
  assert.equal(TRACE_EVENTS[0].context.countyId, TRACE_OPTIONS.traceContext.countyId);
  assert.equal(TRACE_EVENTS[0].context.userId, TRACE_OPTIONS.traceContext.userId);
  assert.deepEqual(TRACE_EVENTS[0].context.roles, []);
  assert.deepEqual(engine.calls[1], {
    question: ACADEMY_LOCALOPS_QUESTIONS['localops-safety-boundary'].prompt,
  });
  assert.deepEqual(engine.calls.at(-1), { closed: true });
});

test('LocalOps panel diagnostic journey returns the engine view model for the existing in-shell surface', async () => {
  const answer = {
    answered: true,
    text: 'LocalOps is ready for grounded, read-only diagnostic explanation. [1]',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/README.md',
        heading: 'Read-only diagnostics',
        snippet: 'Diagnostics observe and explain only.',
      },
    ],
  };
  const engine = recordingEngineFactory(answer);

  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-panel-diagnostic' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.journey, 'localops-diagnostic-panel');
  assert.deepEqual(result.payload.viewModel.insight, {
    text: answer.text,
    grounded: true,
  });
  assert.equal(result.payload.viewModel.flags.externalCalls, false);
  assert.equal(result.payload.viewModel.flags.allowShell, false);
  assert.equal(result.payload.viewModel.flags.allowMutation, false);
  assert.deepEqual(engine.calls[1], {
    question: ACADEMY_LOCALOPS_QUESTIONS['localops-panel-diagnostic'].prompt,
  });
});

test('LocalOps runbook guidance returns the engine view model only when grounded in the canonical Benton runbook', async () => {
  const answer = {
    answered: true,
    text: 'The diagnostic is read-only. The operator performs the documented check and escalates if it fails. [1]',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
        heading: 'R0 — LocalOps self-readiness diagnostic',
        snippet: 'LocalOps proposes the next documented step but never executes it.',
      },
    ],
  };
  const engine = recordingEngineFactory(answer);

  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-runbook-guidance' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.journey, 'localops-runbook-guidance');
  assert.deepEqual(result.payload.viewModel.insight, {
    text: answer.text,
    grounded: true,
  });
  assert.deepEqual(result.payload.answer.sources, answer.sources);
  assert.deepEqual(engine.calls[0].sourceFileAllowlist, ['docs/localops/BENTON_SERVER_RUNBOOK.md']);
  assert.deepEqual(engine.calls[0].sourceSection, {
    sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
    heading: 'R0 — Is LocalOps itself available? (LocalOps-automatable)',
  });
  assert.deepEqual(engine.calls[1], {
    question: ACADEMY_LOCALOPS_QUESTIONS['localops-runbook-guidance'].prompt,
  });
});

test('LocalOps runbook guidance fails closed without the canonical Benton runbook source', async () => {
  const engine = recordingEngineFactory({
    answered: true,
    text: 'Generic operational advice. [1]',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/README.md',
        heading: 'Overview',
        snippet: 'LocalOps is read-only.',
      },
    ],
  });

  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-runbook-guidance' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.ok, false);
  assert.equal(result.payload.status, 'refused');
  assert.equal(result.payload.reasonCode, 'RUNBOOK_SOURCE_REQUIRED');
  assert.match(result.payload.message, /Benton server runbook/i);
});

test('LocalOps runbook guidance refuses mixed sources instead of broadening beyond the canonical runbook', async () => {
  const engine = recordingEngineFactory({
    answered: true,
    text: 'Runbook guidance with an unrelated operational source. [1] [2]',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/BENTON_SERVER_RUNBOOK.md',
        heading: 'R0 — LocalOps self-readiness diagnostic',
        snippet: 'The operator performs the documented step.',
      },
      {
        sourceFile: 'docs/operations/UNRELATED_RUNBOOK.md',
        heading: 'Unrelated procedure',
        snippet: 'This source is outside the fixed LocalOps runbook contract.',
      },
    ],
  });

  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-runbook-guidance' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.reasonCode, 'RUNBOOK_SOURCE_REQUIRED');
});

test('LocalOps runbook guidance asks for documented procedure, not an unsupplied current finding', () => {
  const prompt = ACADEMY_LOCALOPS_QUESTIONS['localops-runbook-guidance'].prompt;
  assert.match(prompt, /documented R0 self-readiness procedure/i);
  assert.doesNotMatch(prompt, /current LocalOps self-readiness finding/i);
});

test('LocalOps Explain grounds the fixed operator question only in the canonical doctrine section', async () => {
  const engine = recordingEngineFactory({
    answered: true,
    text: 'LocalOps observes and explains, cites approved local evidence, and never mutates records. [1]',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
        heading: '2. What LocalOps IS',
        snippet: 'LocalOps v1 is source-grounded and read-only diagnostic.',
      },
    ],
  });

  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-source-grounded-explain' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.payload.journey, 'localops-source-grounded-explain');
  assert.equal(result.payload.viewModel.insightKind, 'source-grounded-explain');
  assert.deepEqual(engine.calls[0].sourceFileAllowlist, ['docs/localops/LOCALOPS_DOCTRINE.md']);
  assert.deepEqual(engine.calls[0].sourceSection, {
    sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
    heading: '2. What LocalOps IS',
  });
});

test('LocalOps Explain refuses mixed sources instead of broadening beyond the canonical doctrine', async () => {
  const engine = recordingEngineFactory({
    answered: true,
    text: 'An explanation assembled from mixed evidence. [1] [2]',
    grounded: true,
    sources: [
      {
        sourceFile: 'docs/localops/LOCALOPS_DOCTRINE.md',
        heading: '2. What LocalOps IS',
        snippet: 'LocalOps v1 is source-grounded and read-only diagnostic.',
      },
      {
        sourceFile: 'docs/operations/UNRELATED.md',
        heading: 'Unrelated',
        snippet: 'Outside the fixed Explain contract.',
      },
    ],
  });

  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-source-grounded-explain' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.reasonCode, 'EXPLAIN_SOURCE_REQUIRED');
});

test('Academy LocalOps journey is default-off and never constructs an engine when not explicitly enabled', async () => {
  let factoryCalls = 0;
  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
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
      ...TRACE_OPTIONS,
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

test('Academy LocalOps journey refuses any endpoint other than the approved Hermes tunnel', async () => {
  for (const env of [
    { ...SAFE_ENV, AI_BASE_URL: 'http://127.0.0.1:11434' },
    { ...SAFE_ENV, LOCALOPS_HERMES_TUNNEL_PORT: undefined },
    { ...SAFE_ENV, LOCALOPS_HERMES_TUNNEL_PORT: '70000' },
    { ...SAFE_ENV, LOCALOPS_TRANSPORT_BOUNDARY: 'loopback' },
  ]) {
    let factoryCalls = 0;
    const result = await runAcademyLocalOpsJourney({
      ...TRACE_OPTIONS,
      repoRoot: 'C:/repo',
      env,
      body: { questionId: 'localops-safety-boundary' },
      engineFactory() {
        factoryCalls += 1;
        throw new Error('must not run');
      },
    });

    assert.equal(factoryCalls, 0);
    assert.equal(result.httpStatus, 503);
    assert.equal(result.payload.reasonCode, 'UNSAFE_LOCALOPS_ENV');
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
    ...TRACE_OPTIONS,
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

test('Academy LocalOps journey reports timeout through the real engine/provider/adapter seam', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        'abort',
        () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        { once: true }
      );
    });
  try {
    const result = await runAcademyLocalOpsJourney({
      ...TRACE_OPTIONS,
      repoRoot: process.cwd(),
      env: SAFE_ENV,
      body: { questionId: 'localops-safety-boundary' },
      timeoutMs: 5,
    });

    assert.equal(result.httpStatus, 503);
    assert.equal(result.payload.ok, false);
    assert.equal(result.payload.status, 'unavailable');
    assert.equal(result.payload.reasonCode, 'LOCAL_PROVIDER_TIMEOUT');
    assert.match(result.payload.message, /timed out/i);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('Academy LocalOps journey refuses an empty model completion', async () => {
  const engine = recordingEngineFactory({
    answered: true,
    text: '   ',
    grounded: true,
    sources: [{ sourceFile: 'docs/localops.md', snippet: 'read-only' }],
  });
  const result = await runAcademyLocalOpsJourney({
    ...TRACE_OPTIONS,
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-safety-boundary' },
    engineFactory: engine.factory,
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.ok, false);
  assert.equal(result.payload.reasonCode, 'EMPTY_LOCAL_RESPONSE');
});

test('Academy LocalOps journey fails closed without canonical authenticated trace context', async () => {
  let factoryCalls = 0;
  const result = await runAcademyLocalOpsJourney({
    repoRoot: 'C:/repo',
    env: SAFE_ENV,
    body: { questionId: 'localops-safety-boundary' },
    engineFactory() {
      factoryCalls += 1;
      throw new Error('must not run');
    },
  });

  assert.equal(factoryCalls, 0);
  assert.equal(result.httpStatus, 503);
  assert.equal(result.payload.reasonCode, 'LOCALOPS_TRACE_CONTEXT_REQUIRED');
});

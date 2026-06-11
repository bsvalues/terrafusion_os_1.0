// WO-AI-CONSOLIDATION-002 — LocalOps → TerraTrace bridge proof.
//
// Proves the governed on-server AI operator path (the LocalOps engine) emits
// onto the CANONICAL TerraTrace spine: a real TraceService (in-memory MVP)
// receives 1:1-mapped events for engine asks, refusals, retrieval, and
// diagnostics — with county context, correlation linkage, and the original
// localops type preserved. Offline; no network; no DB.

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const {
  createLocalOpsEngine,
  createTerraTraceBridgeSink,
  composeLocalOpsTraceSinks,
  mapLocalOpsEventToTraceInput,
  createLocalOpsTrace,
  createRecordingLocalOpsTraceSink,
  createLocalOpsDiagnostics,
  FakeModelAdapter,
} = await import('../pilot/local-agent/index.js');
const { TraceService } = await import('../trace/index.js');

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const localopsEnv = { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' };
const CONTEXT = { countyId: 'benton-wa', userId: 'operator-1' };

describe('LocalOps → TerraTrace bridge (WO-AI-CONSOLIDATION-002)', () => {
  it('maps all eight localops event types onto the canonical closed union', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording, correlationId: 'map-1' });
    trace.aiRequested({ profile: 'localops', provider: 'ollama' });
    trace.aiResponded({ status: 'success' });
    trace.aiResponded({ status: 'failed' });
    trace.providerStatusChecked({ ok: true, kind: 'local', status: 'success', config: {} });
    trace.emit('localops.policy.refused', 'refused', { reasonCode: 'EXTERNAL_PROVIDER_REFUSED' });
    trace.approvalRequired({ reasonCode: 'WRITE_HIGH' });
    trace.ragRetrieved({ grounded: true, sourceCount: 1 });
    trace.diagnosticStarted({ name: 'provider.status' });
    trace.diagnosticCompleted({ name: 'provider.status', ok: false });

    const mapped = recording.events.map((e) => mapLocalOpsEventToTraceInput(e, CONTEXT));
    assert.deepStrictEqual(
      mapped.map((m) => m.type),
      [
        'tool_invoked', // ai.requested
        'tool_completed', // ai.responded success
        'tool_failed', // ai.responded failed
        'tool_completed', // provider.status_checked
        'permission_denied', // policy.refused
        'approval_requested', // approval.required
        'tool_completed', // rag.retrieved
        'tool_invoked', // diagnostic.started
        'tool_failed', // diagnostic.completed ok=false
      ]
    );
    for (const m of mapped) {
      assert.strictEqual(m.correlationId, 'map-1');
      assert.strictEqual(m.context.countyId, 'benton-wa');
      assert.strictEqual(m.context.mode, 'pilot');
      assert.match(m.summary, /^\[localops\./, 'original type preserved as summary prefix');
    }
    const refused = mapped[4];
    assert.strictEqual(refused.errorCode, 'EXTERNAL_PROVIDER_REFUSED');
    assert.strictEqual(refused.toolId, 'localops.policy');
  });

  it('engine ask flows end-to-end onto a REAL TraceService (grounded local answer)', async () => {
    const service = new TraceService();
    const fake = new FakeModelAdapter();
    fake.respondTo('provider status', 'local grounded answer');
    const engine = createLocalOpsEngine({
      env: localopsEnv,
      repoRoot: REPO_ROOT,
      adapter: fake,
      sink: createTerraTraceBridgeSink({ trace: service, context: CONTEXT }),
    });

    const ans = await engine.ask('provider status');
    assert.strictEqual(ans.answered, true);

    const events = service.query({ limit: 100 });
    assert.ok(events.length >= 3, 'requested + rag + responded must land on the spine');
    const types = events.map((e) => e.type);
    assert.ok(types.includes('tool_invoked'));
    assert.ok(types.includes('tool_completed'));
    // Correlation linkage: every bridged event shares the engine's correlationId.
    const corr = new Set(events.map((e) => e.correlationId));
    assert.strictEqual(corr.size, 1, 'one correlation chain for the ask');
    // The engine's own view model still has its recorded stream (tee works).
    assert.ok(engine.viewModel().traceEvents.length >= 3);
    await engine.close();
  });

  it('a refused ask lands as permission_denied on the spine, with zero egress', async () => {
    const calls = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (...a) => {
      calls.push(a);
      throw new Error('egress blocked');
    };
    try {
      const service = new TraceService();
      const engine = createLocalOpsEngine({
        env: { AI_PROFILE: 'localops', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
        repoRoot: REPO_ROOT,
        sink: createTerraTraceBridgeSink({ trace: service, context: CONTEXT }),
      });
      const ans = await engine.ask('help');
      assert.strictEqual(ans.answered, false);
      const denied = service.query({ type: 'permission_denied' });
      assert.ok(denied.length >= 1, 'refusal must land as permission_denied');
      assert.strictEqual(denied[0].errorCode, 'EXTERNAL_PROVIDER_REFUSED');
      assert.match(denied[0].summary, /^\[localops\.policy\.refused\]/);
    } finally {
      globalThis.fetch = realFetch;
    }
    assert.strictEqual(calls.length, 0);
  });

  it('diagnostics emit invoked/completed pairs onto the spine', () => {
    const service = new TraceService();
    const bridge = createTerraTraceBridgeSink({ trace: service, context: CONTEXT });
    const trace = createLocalOpsTrace({ sink: bridge });
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv, trace });
    diag.request('provider.status');

    // Assert the causal PAIR, not the array order returned by query():
    // TraceService.query() is newest-first by contract, so the display order
    // can legitimately surface `tool_completed` before `tool_invoked` whenever
    // the two emits land in different milliseconds (the case on CI). The spine
    // stores them causally; correctness is "one invoked + one completed for the
    // same correlation, invoked not after completed" — never display order.
    const events = service.query({ toolId: 'localops.diagnostics' });
    const invoked = events.filter((e) => e.type === 'tool_invoked');
    const completed = events.filter((e) => e.type === 'tool_completed');
    assert.strictEqual(invoked.length, 1, 'exactly one tool_invoked emitted');
    assert.strictEqual(completed.length, 1, 'exactly one tool_completed emitted');
    assert.strictEqual(
      invoked[0].correlationId,
      completed[0].correlationId,
      'invoked and completed must share a correlationId (a genuine pair)'
    );
    assert.ok(
      new Date(invoked[0].timestamp).getTime() <= new Date(completed[0].timestamp).getTime(),
      'tool_invoked must causally precede tool_completed'
    );
  });

  it('summaries on the spine carry no raw PII (redaction upstream holds)', () => {
    const service = new TraceService();
    const bridge = createTerraTraceBridgeSink({ trace: service, context: CONTEXT });
    const trace = createLocalOpsTrace({ sink: bridge });
    trace.emit(
      'localops.ai.requested',
      'owner 123-45-6789 phone 509-555-0000 email owner@county.gov',
      {}
    );
    const [e] = service.query({ limit: 10 });
    for (const pii of ['123-45-6789', '509-555-0000', 'owner@county.gov']) {
      assert.strictEqual(e.summary.includes(pii), false, `${pii} must not reach the spine`);
    }
  });

  it('a broken TerraTrace service never breaks the operator path', async () => {
    const broken = {
      emit() {
        throw new Error('spine down');
      },
    };
    const fake = new FakeModelAdapter();
    fake.respondTo('provider status', 'still answers');
    const engine = createLocalOpsEngine({
      env: localopsEnv,
      repoRoot: REPO_ROOT,
      adapter: fake,
      sink: createTerraTraceBridgeSink({ trace: broken, context: CONTEXT }),
    });
    const ans = await engine.ask('provider status');
    assert.strictEqual(ans.answered, true, 'spine failure must not break the ask');
    await engine.close();
  });

  it('composeLocalOpsTraceSinks isolates a failing sink from its siblings', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const failing = {
      name: 'boom',
      emit() {
        throw new Error('x');
      },
    };
    const composed = composeLocalOpsTraceSinks(failing, recording);
    const trace = createLocalOpsTrace({ sink: composed });
    assert.doesNotThrow(() => trace.aiRequested({ profile: 'localops' }));
    assert.strictEqual(recording.events.length, 1);
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';

const {
  LOCALOPS_EVENT_TYPES,
  LOCALOPS_TRACE_SCHEMA_VERSION,
  createLocalOpsTrace,
  noopLocalOpsTraceSink,
  createRecordingLocalOpsTraceSink,
  createLocalOpsProvider,
  isLocalOpsProblem,
} = await import('../pilot/local-agent/index.js');

describe('LocalOps trace event adapter (WO-LOCALOPS-003)', () => {
  it('exposes the eight canonical event types', () => {
    assert.deepStrictEqual(
      [...LOCALOPS_EVENT_TYPES],
      [
        'localops.ai.requested',
        'localops.ai.responded',
        'localops.provider.status_checked',
        'localops.policy.refused',
        'localops.approval.required',
        'localops.rag.retrieved',
        'localops.tool.diagnostic.started',
        'localops.tool.diagnostic.completed',
      ]
    );
  });

  it('default sink is a safe no-op (emit never throws, returns the event)', () => {
    const trace = createLocalOpsTrace();
    const event = trace.aiRequested({ profile: 'localops', provider: 'ollama' });
    assert.strictEqual(event.type, 'localops.ai.requested');
    assert.strictEqual(event.schemaVersion, LOCALOPS_TRACE_SCHEMA_VERSION);
    assert.ok(event.correlationId);
  });

  it('a failing sink never breaks the caller', () => {
    const trace = createLocalOpsTrace({
      sink: {
        name: 'broken',
        emit() {
          throw new Error('sink down');
        },
      },
    });
    assert.doesNotThrow(() => trace.aiResponded({ status: 'success' }));
  });

  it('recording sink captures emitted events with correlation + schema', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording, correlationId: 'corr-123' });
    trace.aiRequested({ profile: 'localops', provider: 'ollama' });
    trace.aiResponded({ status: 'success' });
    assert.strictEqual(recording.events.length, 2);
    for (const e of recording.events) {
      assert.strictEqual(e.correlationId, 'corr-123');
      assert.strictEqual(e.schemaVersion, LOCALOPS_TRACE_SCHEMA_VERSION);
      assert.ok(typeof e.ts === 'string' && e.ts.includes('T'));
    }
    assert.strictEqual(recording.events[0].type, 'localops.ai.requested');
    assert.strictEqual(recording.events[1].type, 'localops.ai.responded');
  });

  it('carries session/user context when supplied', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording, session: 's1', user: 'operator' });
    trace.approvalRequired({ reasonCode: 'WRITE_HIGH' });
    const [e] = recording.events;
    assert.strictEqual(e.type, 'localops.approval.required');
    assert.strictEqual(e.session, 's1');
    assert.strictEqual(e.user, 'operator');
  });

  it('redacts secrets in event data and summary', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    trace.emit('localops.ai.requested', 'token sk-abcdefghijklmnopqrstuvwxyz123456', {
      apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
      email: 'operator@example.com',
    });
    const flat = JSON.stringify(recording.events[0]);
    assert.ok(!flat.includes('sk-abcdefghijklmnopqrstuvwxyz123456'), 'api key must be redacted');
    assert.ok(!flat.includes('operator@example.com'), 'email must be redacted');
  });

  it('provider.status_checked projects a refusing provider status (redacted)', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    const provider = createLocalOpsProvider({
      env: {
        AI_PROFILE: 'localops',
        AI_PROVIDER: 'ollama',
        AI_MODEL: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        AI_BASE_URL: 'http://127.0.0.1:11434',
      },
    });
    trace.providerStatusChecked(provider.status());
    const [e] = recording.events;
    assert.strictEqual(e.type, 'localops.provider.status_checked');
    assert.strictEqual(e.data.status, 'success');
    const flat = JSON.stringify(e);
    assert.ok(
      !flat.includes('sk-abcdefghijklmnopqrstuvwxyz123456'),
      'api-key-shaped model must be redacted in projected config'
    );
  });

  it('policy.refused projects a LocalOpsProblem from the provider', async () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    const provider = createLocalOpsProvider({
      env: { AI_PROFILE: 'localops', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
    });
    const result = await provider.complete({ messages: [{ role: 'user', content: 'x' }] });
    assert.ok(isLocalOpsProblem(result));
    trace.policyRefused(result);
    const [e] = recording.events;
    assert.strictEqual(e.type, 'localops.policy.refused');
    assert.strictEqual(e.data.reasonCode, 'EXTERNAL_PROVIDER_REFUSED');
    assert.strictEqual(e.data.profile, 'localops');
    assert.strictEqual(e.data.violatedConstraint, 'no_external_calls');
  });

  it('rag/diagnostic contract methods emit the right types (no impl, just events)', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    trace.ragRetrieved({ source: 'docs/localops/README.md' });
    trace.diagnosticStarted({ name: 'provider-status' });
    trace.diagnosticCompleted({ name: 'provider-status', ok: true });
    assert.deepStrictEqual(
      recording.events.map(e => e.type),
      [
        'localops.rag.retrieved',
        'localops.tool.diagnostic.started',
        'localops.tool.diagnostic.completed',
      ]
    );
  });

  it('noop sink is exported and inert', () => {
    assert.strictEqual(noopLocalOpsTraceSink.name, 'noop');
    assert.doesNotThrow(() =>
      noopLocalOpsTraceSink.emit({
        type: 'localops.ai.requested',
        ts: new Date().toISOString(),
        correlationId: 'c',
        schemaVersion: LOCALOPS_TRACE_SCHEMA_VERSION,
        summary: 's',
        data: {},
      })
    );
  });
});

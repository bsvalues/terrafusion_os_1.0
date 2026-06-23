import assert from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const {
  READONLY_DIAGNOSTICS,
  createLocalOpsDiagnostics,
  isDiagnosticRefusal,
  createLocalOpsTrace,
  createRecordingLocalOpsTraceSink,
} = await import('../pilot/local-agent/index.js');

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const localopsEnv = { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' };

describe('LocalOps read-only diagnostics (WO-LOCALOPS-005)', () => {
  it('exposes the read-only diagnostics allowlist', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    assert.deepStrictEqual(diag.list(), [
      'ai.profile',
      'config.summary',
      'provider.status',
      'kb.status',
      'health.summary',
    ]);
    assert.deepStrictEqual([...READONLY_DIAGNOSTICS], diag.list());
  });

  it('every diagnostic result is read-only', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    for (const r of diag.runAll()) {
      assert.strictEqual(r.readonly, true);
      assert.ok(['ok', 'warn', 'error'].includes(r.status));
      assert.ok(typeof r.summary === 'string');
    }
  });

  it('ai.profile reports active profile/provider', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    const r = diag.request('ai.profile');
    assert.ok(!isDiagnosticRefusal(r));
    assert.strictEqual(r.data.profile, 'localops');
    assert.strictEqual(r.data.provider, 'ollama');
    assert.strictEqual(r.data.externalCalls, false);
  });

  it('config.summary redacts secrets', () => {
    const diag = createLocalOpsDiagnostics({
      repoRoot: REPO_ROOT,
      env: {
        ...localopsEnv,
        AI_MODEL: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        AI_BASE_URL: 'http://127.0.0.1:11434',
      },
    });
    const r = diag.request('config.summary');
    assert.ok(!isDiagnosticRefusal(r));
    const flat = JSON.stringify(r);
    assert.ok(
      !flat.includes('sk-abcdefghijklmnopqrstuvwxyz123456'),
      'api-key-shaped model must be redacted'
    );
  });

  it('provider.status reflects provider readiness (non-ready is warn, not error)', () => {
    const ready = createLocalOpsDiagnostics({
      repoRoot: REPO_ROOT,
      env: { ...localopsEnv, AI_BASE_URL: 'http://127.0.0.1:11434' },
    }).request('provider.status');
    assert.ok(!isDiagnosticRefusal(ready));
    assert.strictEqual(ready.status, 'ok');
    assert.strictEqual(ready.data.status, 'success');

    const disabled = createLocalOpsDiagnostics({
      repoRoot: REPO_ROOT,
      env: { AI_PROFILE: 'disabled' },
    }).request('provider.status');
    assert.strictEqual(disabled.status, 'warn');
    assert.strictEqual(disabled.data.status, 'disabled');
  });

  it('kb.status reports local KB health', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    const r = diag.request('kb.status');
    assert.ok(!isDiagnosticRefusal(r));
    assert.strictEqual(r.status, 'ok');
    assert.ok(Number(r.data.fileCount) >= 1);
  });

  it('health.summary rolls up local signals (read-only) and marks swarm/forecast unavailable', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    const r = diag.request('health.summary');
    assert.ok(!isDiagnosticRefusal(r));
    assert.strictEqual(r.readonly, true);
    assert.ok(['ok', 'warn', 'error'].includes(r.status));
    assert.strictEqual(r.data.overall, r.status);
    assert.deepStrictEqual(r.data.evaluated, ['ai.profile', 'provider.status', 'kb.status']);
    assert.ok(Array.isArray(r.data.warnings));
    // Swarm-dependent advisory is shown unavailable, never inferred.
    const advisories = r.data.unavailable.map(u => u.advisory);
    assert.ok(advisories.includes('systemgpt.forecast'));
    assert.ok(advisories.includes('swarm.health'));
  });

  it('health.summary does not report healthy for a disabled profile / unready provider', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: { AI_PROFILE: 'disabled' } });
    const r = diag.request('health.summary');
    assert.ok(!isDiagnosticRefusal(r));
    assert.notStrictEqual(r.status, 'ok', 'a disabled profile must not report healthy');
    assert.ok(r.data.warnings.length >= 1);
  });

  it('refuses unsafe (mutating/operational) diagnostic requests', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    for (const unsafe of [
      'restart.api',
      'db.migrate',
      'shell.exec',
      'service.stop',
      'repair.now',
      'config.write',
    ]) {
      const r = diag.request(unsafe);
      assert.ok(isDiagnosticRefusal(r), `${unsafe} must be refused`);
      assert.strictEqual(r.reasonCode, 'UNSAFE_DIAGNOSTIC');
      assert.ok(Array.isArray(r.safeAlternatives));
    }
  });

  it('refuses unknown diagnostics distinctly from unsafe ones', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    const r = diag.request('something.else');
    assert.ok(isDiagnosticRefusal(r));
    assert.strictEqual(r.reasonCode, 'UNKNOWN_DIAGNOSTIC');
  });

  it('emits diagnostic started/completed events through the trace adapter', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv, trace });
    diag.request('provider.status');
    const types = recording.events.map(e => e.type);
    assert.deepStrictEqual(types, [
      'localops.tool.diagnostic.started',
      'localops.tool.diagnostic.completed',
    ]);
  });

  it('emits localops.policy.refused for a refused request', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv, trace });
    diag.request('db.migrate');
    assert.strictEqual(recording.events.length, 1);
    assert.strictEqual(recording.events[0].type, 'localops.policy.refused');
    assert.strictEqual(recording.events[0].data.reasonCode, 'UNSAFE_DIAGNOSTIC');
  });

  it('works without a trace sink (no throw)', () => {
    const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
    assert.doesNotThrow(() => diag.runAll());
  });
});

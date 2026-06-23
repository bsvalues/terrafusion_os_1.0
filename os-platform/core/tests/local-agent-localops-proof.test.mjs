// WO-LOCALOPS-008 — Runtime Proof Harness.
//
// Proves the LocalOps v1 invariants (I1–I8) end-to-end against the SHIPPED
// modules from WO-LOCALOPS-001..006.1 — no mocks of the units under test, no
// network. Each scenario from docs/localops/LOCALOPS_ACCEPTANCE_TEST.md (S1–S6)
// is asserted here and FAILS LOUDLY if a prohibition can occur.
//
// Honesty (the harness proves only what it exercises):
//   • S1–S5 (I1–I7) are proven here in-process against real module behavior.
//   • S6 (I8, in-shell rendering) is asserted STATICALLY here (no route escape,
//     z-index authority, mounted as shell chrome). The live RENDER proof is the
//     frontend vitest shell-contract suite (shellAntiDrift / shellChrome /
//     shellRoutedContent) + the Tier-1 UI Harness, which run in CI — this Node
//     harness cannot execute vitest, and does not claim to.
//   • I4 covers email + SSN + phone. Phone redaction landed in
//     WO-SEC-LOCALOPS-001; before that this scenario could not be honestly
//     proven and must not be claimed.

import assert from 'node:assert';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const {
  createLocalOpsProvider,
  isLocalOpsProblem,
  isLocalOpsSuccess,
  createLocalOpsDiagnostics,
  isDiagnosticRefusal,
  createLocalOpsKb,
  createLocalOpsTrace,
  createRecordingLocalOpsTraceSink,
  LOCALOPS_EVENT_TYPES,
} = await import('../pilot/local-agent/index.js');

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const localopsEnv = { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' };
const userReq = content => ({ messages: [{ role: 'user', content }] });

const FRONTEND = `${REPO_ROOT}/frontend/apps/os-shell/src`;
const readSrc = rel => fs.readFileSync(`${FRONTEND}/${rel}`, 'utf8');

/** Run fn with global fetch replaced by a spy that records + blocks any call. */
async function withEgressBlocked(fn) {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (...args) => {
    calls.push(args);
    throw new Error('egress blocked by proof harness');
  };
  try {
    await fn();
  } finally {
    globalThis.fetch = realFetch;
  }
  return calls;
}

describe('WO-LOCALOPS-008 runtime proof', () => {
  // ==========================================================================
  // S1 — Local unavailable, cloud prohibited. Asserts I1 (no silent cloud
  // fallback / zero egress) and I3 (trace emitted, append-only).
  // ==========================================================================
  describe('S1 — local unavailable, cloud prohibited (I1, I3)', () => {
    it('external provider under localops is refused, not silently fulfilled, with zero egress', async () => {
      const calls = await withEgressBlocked(async () => {
        const provider = createLocalOpsProvider({
          env: { AI_PROFILE: 'localops', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
        });
        const result = await provider.complete(userReq('help me'));
        assert.ok(isLocalOpsProblem(result), 'must be a structured problem');
        assert.strictEqual(isLocalOpsSuccess(result), false, 'must NOT be a success');
        assert.strictEqual(result.status, 'refused');
        assert.strictEqual(result.violatedConstraint, 'no_external_calls');
      });
      assert.strictEqual(calls.length, 0, 'no external network call may be attempted');
    });

    it('local-only with no reachable model is unavailable, with zero egress', async () => {
      const calls = await withEgressBlocked(async () => {
        const provider = createLocalOpsProvider({
          env: { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama' }, // no model
        });
        const result = await provider.complete(userReq('status'));
        assert.ok(isLocalOpsProblem(result));
        assert.strictEqual(result.status, 'unavailable');
        assert.strictEqual(isLocalOpsSuccess(result), false);
      });
      assert.strictEqual(calls.length, 0, 'unavailable path must not reach the network');
    });

    it('the action emits an append-only trace event carrying a correlationId', async () => {
      const recording = createRecordingLocalOpsTraceSink();
      const trace = createLocalOpsTrace({ sink: recording, correlationId: 'proof-s1' });
      const provider = createLocalOpsProvider({
        env: { AI_PROFILE: 'localops', AI_PROVIDER: 'openai', AI_MODEL: 'gpt' },
      });
      const result = await provider.complete(userReq('x'));
      trace.policyRefused(result);

      assert.strictEqual(recording.events.length, 1);
      const [e] = recording.events;
      assert.strictEqual(e.type, 'localops.policy.refused');
      assert.strictEqual(e.correlationId, 'proof-s1');
      assert.ok(typeof e.ts === 'string' && e.ts.includes('T'));

      // Append-only: prior events are never mutated or removed by later emits.
      const snapshot = JSON.stringify(recording.events[0]);
      trace.providerStatusChecked(provider.status());
      assert.strictEqual(recording.events.length, 2, 'events only grow');
      assert.strictEqual(JSON.stringify(recording.events[0]), snapshot, 'first event unchanged');
    });
  });

  // ==========================================================================
  // S2 — Diagnostic is read-only. Asserts I2 (no mutation) and I6 (grounding).
  // ==========================================================================
  describe('S2 — diagnostic is read-only (I2, I6)', () => {
    it('every diagnostic result is read-only and changes nothing', () => {
      const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
      const results = diag.runAll();
      assert.ok(results.length >= 1);
      for (const r of results) {
        assert.strictEqual(r.readonly, true, `${r.name} must be readonly`);
        assert.ok(['ok', 'warn', 'error'].includes(r.status));
      }
    });

    it('a mutating diagnostic is refused (cannot execute)', () => {
      const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv });
      const r = diag.request('config.write');
      assert.ok(isDiagnosticRefusal(r));
      assert.strictEqual(r.reasonCode, 'UNSAFE_DIAGNOSTIC');
    });

    it('operational findings require a grounding source (I6)', () => {
      const requireSources = { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' };
      const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: requireSources });
      const grounded = kb.retrieve('provider status');
      assert.strictEqual(grounded.grounded, true);
      assert.strictEqual(grounded.canAnswer, true);
      const ungrounded = kb.retrieve('zxqwvkplm qbvqwxz fghjkvmn');
      assert.strictEqual(ungrounded.grounded, false);
      assert.strictEqual(ungrounded.canAnswer, false, 'no confident answer without a source');
    });
  });

  // ==========================================================================
  // S3 — PII never hits the trail. Asserts I4 (SSN/phone/email redacted).
  // Phone coverage relies on WO-SEC-LOCALOPS-001.
  // ==========================================================================
  describe('S3 — PII never hits the trail (I4: SSN + phone + email)', () => {
    it('SSN, phone, and email are absent from emitted trace payloads', () => {
      const recording = createRecordingLocalOpsTraceSink();
      const trace = createLocalOpsTrace({ sink: recording });
      const pii = {
        ssn: '123-45-6789',
        phone: '509-555-0000',
        email: 'owner@county.gov',
      };
      trace.emit(
        'localops.ai.requested',
        `owner ssn ${pii.ssn} phone ${pii.phone} email ${pii.email}`,
        pii
      );
      const flat = JSON.stringify(recording.events[0]);
      for (const [kind, raw] of Object.entries(pii)) {
        assert.strictEqual(flat.includes(raw), false, `${kind} must be redacted from the trail`);
      }
    });
  });

  // ==========================================================================
  // S4 — Approval gate enforced. Asserts I5 (nothing above read-only executes
  // without confirmation; v1 ships none above read-only, gate still enforced).
  // ==========================================================================
  describe('S4 — approval gate enforced (I5)', () => {
    it('the trace vocabulary includes an approval-required event for above-read-only tools', () => {
      assert.ok([...LOCALOPS_EVENT_TYPES].includes('localops.approval.required'));
    });

    it('write/exec/restart requests are refused and do NOT execute', () => {
      const recording = createRecordingLocalOpsTraceSink();
      const trace = createLocalOpsTrace({ sink: recording });
      const diag = createLocalOpsDiagnostics({ repoRoot: REPO_ROOT, env: localopsEnv, trace });
      for (const tool of ['shell.exec', 'service.restart', 'db.migrate', 'config.write']) {
        const r = diag.request(tool);
        assert.ok(isDiagnosticRefusal(r), `${tool} must be refused`);
        assert.strictEqual(r.reasonCode, 'UNSAFE_DIAGNOSTIC');
      }
      // A refusal emits policy.refused — NEVER a diagnostic.started/completed
      // pair, i.e. the tool never ran.
      const types = new Set(recording.events.map(e => e.type));
      assert.ok(types.has('localops.policy.refused'));
      assert.strictEqual(types.has('localops.tool.diagnostic.started'), false);
      assert.strictEqual(types.has('localops.tool.diagnostic.completed'), false);
    });
  });

  // ==========================================================================
  // S5 — Indexing approval gate. Asserts I7 (county boundary; no unapproved
  // source indexed).
  // ==========================================================================
  describe('S5 — indexing approval gate (I7)', () => {
    it('roots outside the docs/ allowlist are excluded, never indexed', () => {
      const kb = createLocalOpsKb({
        repoRoot: REPO_ROOT,
        env: localopsEnv,
        roots: ['docs/localops', 'backend', 'os-platform/core/pilot/local-agent', '/etc', '../escape'],
      });
      assert.deepStrictEqual(kb.roots, ['docs/localops']);
      for (const excluded of ['backend', 'os-platform/core/pilot/local-agent']) {
        assert.ok(kb.rootsExcluded.includes(excluded), `${excluded} must be excluded`);
      }
      // A county/source query can only ever surface docs/ material.
      const result = kb.retrieve('property valuation parcel owner');
      for (const s of result.sources) {
        assert.ok(s.sourceFile.startsWith('docs/'), `only docs/ may be indexed: ${s.sourceFile}`);
      }
    });
  });

  // ==========================================================================
  // S6 — In-shell rendering. Asserts I8 (no route escape, no hardcoded
  // z-index, mounted as shell chrome). Static structural proof; the live render
  // proof is the CI vitest shell-contract suite + Tier-1 UI Harness.
  // ==========================================================================
  describe('S6 — in-shell only (I8, static structural proof)', () => {
    it('the localops OS feature declares no route (no Router / full-page escape)', () => {
      const reg = readSrc('config/suiteRegistry.ts');
      const block = reg.match(/id:\s*'localops'[\s\S]*?\n\s{2}\},/);
      assert.ok(block, 'localops OS_FEATURES entry must exist');
      assert.strictEqual(/route\s*:/.test(block[0]), false, 'localops must not declare a route');
      assert.strictEqual(/homeMeta\s*:/.test(block[0]), false, 'localops must not declare homeMeta');
    });

    it('the panel + surface use the shell z-index authority, never a hardcoded z-index', () => {
      for (const rel of [
        'components/localops/LocalOpsPanel.tsx',
        'components/localops/LocalOpsSurface.tsx',
      ]) {
        const src = readSrc(rel);
        assert.ok(src.includes('Z.companionPanel'), `${rel} must use Z.companionPanel`);
        assert.strictEqual(/zIndex:\s*\d/.test(src), false, `${rel} must not hardcode a numeric z-index`);
        assert.strictEqual(/z-\[\d/.test(src), false, `${rel} must not use an arbitrary z-[] class`);
      }
    });

    it('the panel is shell chrome (fixed, complementary) and is mounted in the live Desktop', () => {
      const panel = readSrc('components/localops/LocalOpsPanel.tsx');
      assert.ok(panel.includes("position: 'fixed'"), 'panel is fixed shell chrome');
      assert.ok(panel.includes("role='complementary'"), 'panel is a complementary landmark');
      const desktop = readSrc('shell/desktop/Desktop.tsx');
      assert.ok(desktop.includes('<LocalOpsSurface'), 'Desktop must mount LocalOpsSurface');
    });
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const { createLocalOpsKb, createLocalOpsTrace, createRecordingLocalOpsTraceSink } =
  await import('../pilot/local-agent/index.js');

// repoRoot = three levels up from os-platform/core/tests/
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const localopsEnv = { AI_PROFILE: 'localops', AI_PROVIDER: 'ollama', AI_MODEL: 'm' };

describe('LocalOps local KB/RAG interface (WO-LOCALOPS-004)', () => {
  it('retrieves source-grounded references from docs/localops', () => {
    const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: localopsEnv });
    const result = kb.retrieve('local provider status refused');
    assert.strictEqual(result.grounded, true);
    assert.ok(result.sources.length > 0);
    const top = result.sources[0];
    assert.ok(
      top.sourceFile.startsWith('docs/localops/'),
      `source under docs/localops: ${top.sourceFile}`
    );
    assert.ok(typeof top.snippet === 'string' && top.snippet.length > 0);
    assert.ok(top.score > 0 && top.score <= 1);
    assert.match(top.matchReason, /matched terms:/);
  });

  it('returns source references with file/heading/snippet/score', () => {
    const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: localopsEnv });
    const result = kb.retrieve('TerraTrace event adapter');
    assert.ok(result.grounded);
    for (const s of result.sources) {
      assert.ok(s.sourceFile.endsWith('.md'));
      assert.ok('score' in s && 'snippet' in s);
      // heading is optional but when present is a non-empty string
      if (s.heading !== undefined) assert.ok(s.heading.length > 0);
    }
  });

  it('honest no-source result for an unmatched query', () => {
    const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: localopsEnv });
    const result = kb.retrieve('zxqwvkplm qbvqwxz fghjkvmn');
    assert.strictEqual(result.grounded, false);
    assert.strictEqual(result.sources.length, 0);
    assert.strictEqual(result.message, 'no local source found');
  });

  it('source-required mode does not allow a confident answer without sources', () => {
    const kb = createLocalOpsKb({
      repoRoot: REPO_ROOT,
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
    });
    const missing = kb.retrieve('zxqwvkplm qbvqwxz fghjkvmn');
    assert.strictEqual(missing.requireSources, true);
    assert.strictEqual(missing.grounded, false);
    assert.strictEqual(missing.canAnswer, false); // the honest guard

    const found = kb.retrieve('provider status');
    assert.strictEqual(found.grounded, true);
    assert.strictEqual(found.canAnswer, true);
  });

  it('emits localops.rag.retrieved through the trace adapter', () => {
    const recording = createRecordingLocalOpsTraceSink();
    const trace = createLocalOpsTrace({ sink: recording });
    const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: localopsEnv, trace });
    kb.retrieve('provider status');
    assert.strictEqual(recording.events.length, 1);
    const [e] = recording.events;
    assert.strictEqual(e.type, 'localops.rag.retrieved');
    assert.strictEqual(e.data.grounded, true);
    assert.ok(Number(e.data.sourceCount) >= 1);
  });

  it('trace is optional — retrieval works with no sink (no throw)', () => {
    const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: localopsEnv });
    assert.doesNotThrow(() => kb.retrieve('provider status'));
  });

  it('fails closed: roots outside the docs/ allowlist are excluded, never indexed', () => {
    const kb = createLocalOpsKb({
      repoRoot: REPO_ROOT,
      env: localopsEnv,
      roots: [
        'docs/localops',
        'backend',
        'os-platform/core/pilot/local-agent',
        '/etc',
        '../escape',
      ],
    });
    assert.deepStrictEqual(kb.roots, ['docs/localops']);
    for (const excluded of ['backend', 'os-platform/core/pilot/local-agent']) {
      assert.ok(kb.rootsExcluded.includes(excluded), `${excluded} must be excluded`);
    }
    // a county/source tree could never be scanned
    const result = kb.retrieve('property valuation parcel');
    for (const s of result.sources) {
      assert.ok(s.sourceFile.startsWith('docs/'), `only docs/ may appear: ${s.sourceFile}`);
    }
  });

  it('status() reports roots, file count, and require-sources flag', () => {
    const kb = createLocalOpsKb({
      repoRoot: REPO_ROOT,
      env: { ...localopsEnv, AI_REQUIRE_SOURCES: 'true' },
    });
    const status = kb.status();
    assert.ok(status.roots.includes('docs/localops'));
    assert.ok(status.fileCount >= 1);
    assert.strictEqual(status.requireSources, true);
    assert.strictEqual(status.kbPath, 'docs/localops');
  });

  it('redacts secrets that appear in a query echo', () => {
    const kb = createLocalOpsKb({ repoRoot: REPO_ROOT, env: localopsEnv });
    const result = kb.retrieve('provider sk-abcdefghijklmnopqrstuvwxyz123456');
    assert.ok(!result.query.includes('sk-abcdefghijklmnopqrstuvwxyz123456'));
  });
});

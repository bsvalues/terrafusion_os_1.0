import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentDocsIndexBuilder;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentDocsIndexBuilder = pilot.LocalAgentDocsIndexBuilder;
});

describe('Local agent docs index', () => {
  it('includes release freeze, release approval, tag command, and runbook artifacts', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-docs-index-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const index = new LocalAgentDocsIndexBuilder(root).build();
      const entryIds = new Set(index.entries.map(entry => entry.id));
      assert.ok(entryIds.has('release-freeze'));
      assert.ok(entryIds.has('tag-gate'));
      assert.ok(entryIds.has('release-approval'));
      assert.ok(entryIds.has('tag-command'));
      assert.ok(entryIds.has('release-runbook'));

      const releasePath = index.readingPaths.find(path => path.id === 'release-review');
      assert.ok(releasePath);
      assert.ok(releasePath.entries.includes('release-freeze'));
      assert.ok(releasePath.entries.includes('release-approval'));
      assert.ok(releasePath.entries.includes('tag-command'));
      assert.ok(releasePath.entries.includes('release-runbook'));

      const releaseNotes = index.entries.find(entry => entry.id === 'release-notes');
      assert.ok(releaseNotes);
      assert.match(releaseNotes.summary, /Prometheus codename/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
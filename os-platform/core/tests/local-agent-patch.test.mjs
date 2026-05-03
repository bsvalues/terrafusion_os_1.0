import assert from 'node:assert';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { before, describe, it } from 'node:test';

let LocalAgentCardLockStore;
let LocalAgentPatchPreview;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;

  LocalAgentCardLockStore = pilot.LocalAgentCardLockStore;
  LocalAgentPatchPreview = pilot.LocalAgentPatchPreview;
});

function setupLocalAgentRepo() {
  const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-patch-'));
  writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
  mkdirSync(resolve(root, 'os-platform/core/tests'), { recursive: true });
  writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-policy.test.mjs'), '', 'utf8');
  writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-runtime.test.mjs'), '', 'utf8');
  mkdirSync(resolve(root, 'os-platform/core/pilot/local-agent'), { recursive: true });
  return root;
}

function readEvents(root) {
  const logPath = resolve(root, '.terrafusion/agent-events.jsonl');
  return readFileSync(logPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Local agent patch preview mode', () => {
  it('requires a locked work card before previewing a patch', () => {
    const root = setupLocalAgentRepo();
    writeFileSync(resolve(root, 'os-platform/core/pilot/local-agent/example.ts'), 'old\n', 'utf8');

    try {
      const patcher = new LocalAgentPatchPreview(root);
      assert.throws(() => patcher.previewReplacement('os-platform/core/pilot/local-agent/example.ts', 'new\n'), /locked work card/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('creates a stored unified diff for allowed files', () => {
    const root = setupLocalAgentRepo();
    writeFileSync(resolve(root, 'os-platform/core/pilot/local-agent/example.ts'), 'old\n', 'utf8');

    try {
      new LocalAgentCardLockStore(root).lockFromTask('Build the local agent permission harness');
      const patcher = new LocalAgentPatchPreview(root);
      const proposal = patcher.previewReplacement('os-platform/core/pilot/local-agent/example.ts', 'new\n');

      assert.equal(proposal.path, 'os-platform/core/pilot/local-agent/example.ts');
      assert.ok(proposal.diff.includes('@@ -1,'));
      assert.ok(proposal.diff.includes('-old'));
      assert.ok(proposal.diff.includes('+new'));
      assert.ok(readFileSync(resolve(root, `.terrafusion/patches/${proposal.id}.diff`), 'utf8').includes('@@ -1,'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('blocks forbidden backend and docs paths', () => {
    const root = setupLocalAgentRepo();
    mkdirSync(resolve(root, 'backend'), { recursive: true });
    mkdirSync(resolve(root, 'docs/superpowers'), { recursive: true });
    writeFileSync(resolve(root, 'backend/blocked.cs'), 'old\n', 'utf8');
    writeFileSync(resolve(root, 'docs/superpowers/blocked.md'), 'old\n', 'utf8');

    try {
      new LocalAgentCardLockStore(root).lockFromTask('Build the local agent permission harness');
      const patcher = new LocalAgentPatchPreview(root);

      assert.throws(() => patcher.previewReplacement('backend/blocked.cs', 'new\n'), /forbidden|allowedFiles/i);
      assert.throws(() => patcher.previewReplacement('docs/superpowers/blocked.md', 'new\n'), /forbidden/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('requires explicit approval and rejects stale preimages', () => {
    const root = setupLocalAgentRepo();
    const target = resolve(root, 'os-platform/core/pilot/local-agent/example.ts');
    writeFileSync(target, 'old\n', 'utf8');

    try {
      new LocalAgentCardLockStore(root).lockFromTask('Build the local agent permission harness');
      const patcher = new LocalAgentPatchPreview(root);
      const proposal = patcher.previewReplacement('os-platform/core/pilot/local-agent/example.ts', 'new\n');

      assert.throws(() => patcher.applyPatch(proposal.id, false), /explicit approval/i);

      writeFileSync(target, 'changed elsewhere\n', 'utf8');
      assert.throws(() => patcher.applyPatch(proposal.id, true), /changed since preview/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('logs preview, deny, and apply events', () => {
    const root = setupLocalAgentRepo();
    const target = resolve(root, 'os-platform/core/pilot/local-agent/example.ts');
    writeFileSync(target, 'old\n', 'utf8');

    try {
      new LocalAgentCardLockStore(root).lockFromTask('Build the local agent permission harness');
      const patcher = new LocalAgentPatchPreview(root);
      const proposal = patcher.previewReplacement('os-platform/core/pilot/local-agent/example.ts', 'new\n');
      assert.throws(() => patcher.applyPatch(proposal.id, false), /explicit approval/i);
      patcher.applyPatch(proposal.id, true);

      const eventTypes = readEvents(root).map(event => event.type);
      assert.ok(eventTypes.includes('patch_preview_created'));
      assert.ok(eventTypes.includes('patch_apply_denied'));
      assert.ok(eventTypes.includes('patch_applied'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('blocks path escape attempts', () => {
    const root = setupLocalAgentRepo();

    try {
      new LocalAgentCardLockStore(root).lockFromTask('Build the local agent permission harness');
      const patcher = new LocalAgentPatchPreview(root);
      assert.throws(() => patcher.previewReplacement('../escape.ts', 'bad\n'), /Path escapes workspace/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the founder CLI flow for preview, show, and apply', () => {
    const root = setupLocalAgentRepo();
    const target = resolve(root, 'os-platform/core/pilot/local-agent/example.ts');
    writeFileSync(target, 'old\n', 'utf8');
    writeFileSync(resolve(root, 'new-content.txt'), 'new\n', 'utf8');

    try {
      const lock = runCli(root, 'lock-card', 'Build the local agent permission harness');
      assert.equal(lock.status, 0);

      const preview = runCli(root, 'preview-patch', 'os-platform/core/pilot/local-agent/example.ts', '--content-file', 'new-content.txt');
      assert.equal(preview.status, 0);
      assert.match(preview.stdout, /Patch ID: (patch_[a-f0-9]+)/i);
      assert.match(preview.stdout, /@@ -1,/);

      const patchId = preview.stdout.match(/Patch ID: (patch_[a-f0-9]+)/i)?.[1];
      assert.ok(patchId);

      const show = runCli(root, 'show-patch', patchId);
      assert.equal(show.status, 0);
      assert.match(show.stdout, /\+new/);

      const apply = runCli(root, 'apply-patch', patchId, '--approve');
      assert.equal(apply.status, 0);
      assert.equal(readFileSync(target, 'utf8'), 'new\n');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
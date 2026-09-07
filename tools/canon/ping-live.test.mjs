import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('live read-only Canon ping normalizes actual tool inputs rather than treating domain payload as ping metadata', () => {
  const result = spawnSync(
    process.execPath,
    ['tools/canon/canon.mjs', 'ping', '--json', '--echo', 'conference-local-check'],
    {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      encoding: 'utf8',
      timeout: 30000,
    }
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.overallOk, true);
  assert.equal(receipt.dryRun, false);
  assert.equal(receipt.normalized.echo, 'conference-local-check');
  assert.equal(receipt.normalized.toolId, 'explain_model_inputs');
  assert.equal(receipt.raw.ok, true);
  assert.ok(Array.isArray(receipt.raw.result.inputs));
  assert.equal(receipt.normalized.inputCount, receipt.raw.result.inputs.length);
  assert.ok(receipt.normalized.inputCount > 0);
});

test('a rejected real ToolRunner invocation cannot become a successful ping receipt', () => {
  const cwd = fileURLToPath(new URL('../../', import.meta.url));
  const directory = mkdtempSync(path.join(tmpdir(), 'canon-ping-deny-'));
  try {
    const manifest = JSON.parse(
      readFileSync(path.join(cwd, 'tools/registry/terrapilot.tools.json'), 'utf8')
    );
    const tool = manifest.tools.find(tool => tool.toolId === 'explain_model_inputs');
    tool.risk = 'write_high';
    tool.writeLane = 'forge';
    tool.requiresConfirmation = true;
    const file = path.join(directory, 'manifest.json');
    writeFileSync(file, JSON.stringify(manifest));
    const result = spawnSync(
      process.execPath,
      ['tools/canon/canon.mjs', 'ping', '--json', '--manifest', file],
      { cwd, encoding: 'utf8', timeout: 30000 }
    );
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(JSON.parse(result.stdout).overallOk, false);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

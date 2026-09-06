import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifestPath = path.join(repoRoot, 'config', 'counties', 'benton-pii-manifest.json');

test('Benton WACO-E step 1 manifest uses the shipped C51-PII-B wire shape', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  assert.equal(manifest.manifestVersion, '1.0.0');
  assert.equal(manifest.manifestEvent, 'Benton-WACO-E-step-1-PII-readiness');
  assert.deepEqual(manifest.tableExhaustive, [], 'UNKNOWN_DENY requires no false exhaustive claim');
  assert.ok(Array.isArray(manifest.tables));
  assert.ok(Array.isArray(manifest.columns));

  const allowed = new Set(['None', 'Indirect', 'Direct']);
  for (const entry of manifest.tables) {
    assert.equal(typeof entry.name, 'string');
    assert.ok(allowed.has(entry.classification));
    assert.equal(typeof entry.reason, 'string');
    assert.ok(entry.reason.trim().length > 0);
  }
  for (const entry of manifest.columns) {
    assert.equal(typeof entry.table, 'string');
    assert.equal(typeof entry.column, 'string');
    assert.ok(allowed.has(entry.classification));
    assert.equal(typeof entry.reason, 'string');
    assert.ok(entry.reason.trim().length > 0);
  }

  assert.deepEqual(
    manifest.tables.map((entry) => entry.name),
    ['account', 'address', 'owner'],
    'only repository-supported Benton PII-bearing tables are classified in this bounded slice',
  );
  assert.deepEqual(manifest.columns, [], 'no unverified Benton column names may be fabricated');
});

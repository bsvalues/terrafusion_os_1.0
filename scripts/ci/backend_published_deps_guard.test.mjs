import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { guardPublishedDependencies } from './backend_published_deps_guard.mjs';

function writeDeps(root, name, libraries) {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, `${name}.deps.json`), JSON.stringify({ libraries }), 'utf8');
}

test('accepts exact package identities across all emitted manifests', () => {
  const directory = join(tmpdir(), `tf-deps-guard-pass-${process.pid}-${Date.now()}`);
  writeDeps(directory, 'TerraFusion.API', {
    'Microsoft.Kiota.Abstractions/1.22.0': {},
    'Npgsql/8.0.5': {},
    'SQLitePCLRaw.lib.e_sqlite3/2.1.13': {},
  });
  assert.deepEqual(guardPublishedDependencies(directory).packageOccurrences, {
    'Microsoft.Kiota.Abstractions': 1,
    Npgsql: 1,
    'SQLitePCLRaw.lib.e_sqlite3': 1,
  });
});

for (const [name, stale] of [
  ['Microsoft.Kiota.Abstractions', '1.9.1'],
  ['Npgsql', '8.0.0'],
  ['SQLitePCLRaw.lib.e_sqlite3', '2.1.6'],
]) {
  test(`rejects stale ${name} in any emitted manifest`, () => {
    const directory = join(
      tmpdir(),
      `tf-deps-guard-stale-${name}-${process.pid}-${Date.now()}`
    );
    writeDeps(directory, 'TerraFusion.API', {
      'Microsoft.Kiota.Abstractions/1.22.0': {},
      'Npgsql/8.0.5': {},
      'SQLitePCLRaw.lib.e_sqlite3/2.1.13': {},
    });
    writeDeps(join(directory, 'tools'), 'Owner', { [`${name}/${stale}`]: {} });
    assert.throws(() => guardPublishedDependencies(directory), /exact release floor/);
  });
}

test('fails closed for malformed or incomplete published evidence', () => {
  const directory = join(tmpdir(), `tf-deps-guard-malformed-${process.pid}-${Date.now()}`);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'bad.deps.json'), '{', 'utf8');
  assert.throws(() => guardPublishedDependencies(directory), /malformed dependency manifest/);
});

test('fails closed when an expected runtime package disappears', () => {
  const directory = join(tmpdir(), `tf-deps-guard-missing-${process.pid}-${Date.now()}`);
  writeDeps(directory, 'TerraFusion.API', { 'Npgsql/8.0.5': {} });
  assert.throws(() => guardPublishedDependencies(directory), /expected runtime package/);
});

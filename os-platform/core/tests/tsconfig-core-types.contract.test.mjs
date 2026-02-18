import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('tsconfig.core.json keeps types allowlist exactly [\'node\']', () => {
  const repoRoot = process.cwd();
  const tsconfigPath = path.join(repoRoot, 'tsconfig.core.json');

  assert.ok(fs.existsSync(tsconfigPath), `Missing ${tsconfigPath}`);

  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    assert.fail(`tsconfig.core.json is not valid JSON: ${msg}`);
  }

  const types = json?.compilerOptions?.types;
  assert.ok(Array.isArray(types), 'compilerOptions.types must be an array');
  assert.deepEqual(
    types,
    ['node'],
    `compilerOptions.types must be exactly ["node"], got: ${JSON.stringify(types)}`
  );
});

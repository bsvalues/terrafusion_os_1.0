import * as assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
    EXTERNAL_MUTATOR_PATHS,
    MUTATION_BOUNDARY_BINS,
    NON_MUTATION_BINS,
} from '../src/security/rbac/action-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');

function listBinFiles(): string[] {
  const binDir = join(packageRoot, 'bin');
  return readdirSync(binDir)
    .filter(entry => entry.endsWith('.mjs'))
    .sort();
}

describe('Phase IIIa – Mutation Boundary Inventory', () => {
  it('bin entrypoints match canonical boundary list', () => {
    const actual = listBinFiles();
    const expected = [...MUTATION_BOUNDARY_BINS, ...NON_MUTATION_BINS].sort();

    assert.deepEqual(actual, expected);
  });

  it('external mutators are flagged but not in bin list', () => {
    const actualBins = listBinFiles();

    for (const externalPath of EXTERNAL_MUTATOR_PATHS) {
      const fullPath = resolve(packageRoot, '..', '..', '..', externalPath);
      assert.ok(existsSync(fullPath), `Expected external mutator to exist: ${externalPath}`);
      assert.ok(
        !actualBins.includes(externalPath),
        `External path should not be a bin: ${externalPath}`
      );
    }
  });
});

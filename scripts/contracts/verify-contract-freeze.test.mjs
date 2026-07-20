import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { verifyContractFreeze } from './verify-contract-freeze.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = path.join(
  repoRoot,
  'backend/src/TerraFusion.Abstractions/contracts.freeze.json'
);

function withManifest(mutator) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  mutator(manifest);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-contract-freeze-'));
  const tempManifest = path.join(tempDir, 'contracts.freeze.json');
  fs.writeFileSync(tempManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  return tempManifest;
}

test('current shared-contract freeze is complete and hash-pinned', () => {
  assert.deepEqual(verifyContractFreeze({ repoRoot }), {
    groups: 2,
    frozenFiles: 5,
    deferredFiles: 10,
    osInternalFiles: 5,
  });
});

test('a modified frozen hash fails closed', () => {
  const altered = withManifest(manifest => {
    manifest.frozen[0].files[0].sha256 = '0'.repeat(64);
  });
  assert.throws(() => verifyContractFreeze({ repoRoot, manifestPath: altered }), /hash mismatch/);
});

test('duplicate classification fails closed', () => {
  const altered = withManifest(manifest => {
    manifest.deferred.push({
      path: manifest.frozen[0].files[0].path,
      reason: 'intentional overlap fixture',
    });
  });
  assert.throws(
    () => verifyContractFreeze({ repoRoot, manifestPath: altered }),
    /classified more than once/
  );
});

test('publication cannot be claimed by the freeze', () => {
  const altered = withManifest(manifest => {
    manifest.publicationStatus = 'published';
  });
  assert.throws(
    () => verifyContractFreeze({ repoRoot, manifestPath: altered }),
    /planned_not_published/
  );
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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

function withChangedContractAndManifest(addTransition = false) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-contract-repo-'));
  const relativeRoot = 'backend/src/TerraFusion.Abstractions';
  const sourceRoot = path.join(repoRoot, relativeRoot);
  const targetRoot = path.join(tempRoot, relativeRoot);
  fs.mkdirSync(path.dirname(targetRoot), { recursive: true });
  fs.cpSync(sourceRoot, targetRoot, {
    recursive: true,
    filter: source => !source.split(path.sep).some(part => part === 'bin' || part === 'obj'),
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const frozen = manifest.frozen[0];
  const target = path.join(targetRoot, frozen.files[0].path);
  fs.appendFileSync(target, '\n// compatibility fixture\n');
  frozen.files[0].sha256 = createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  frozen.version = '1.1.0';
  if (addTransition) {
    manifest.transitions = [
      {
        group: frozen.group,
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        classification: 'minor',
        workOrder: 'WO-SR-TEST',
        evidence: 'synthetic additive compatibility proof',
      },
    ];
  }
  const currentManifest = path.join(targetRoot, 'contracts.freeze.json');
  fs.writeFileSync(currentManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  return { tempRoot, currentManifest };
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

test('same-change manifest hash rewrite fails without an explicit transition', () => {
  const fixture = withChangedContractAndManifest();
  assert.throws(
    () =>
      verifyContractFreeze({
        repoRoot: fixture.tempRoot,
        manifestPath: fixture.currentManifest,
        baselineManifestPath: manifestPath,
      }),
    /explicit transition record/
  );
});

test('versioned transition with Work Order and evidence passes baseline comparison', () => {
  const fixture = withChangedContractAndManifest(true);
  assert.deepEqual(
    verifyContractFreeze({
      repoRoot: fixture.tempRoot,
      manifestPath: fixture.currentManifest,
      baselineManifestPath: manifestPath,
    }),
    {
      groups: 2,
      frozenFiles: 5,
      deferredFiles: 10,
      osInternalFiles: 5,
    }
  );
});

// Overwrite the first frozen contract file with degraded content and re-pin its hash, so the
// hash check passes but the content check must fail closed. Proves a validly-pinned placeholder
// (the CostForgeStatsDto zero-byte scenario) cannot masquerade as a frozen contract.
function withDegradedFrozenFile(content) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-contract-degraded-'));
  const relativeRoot = 'backend/src/TerraFusion.Abstractions';
  const targetRoot = path.join(tempRoot, relativeRoot);
  fs.mkdirSync(path.dirname(targetRoot), { recursive: true });
  fs.cpSync(path.join(repoRoot, relativeRoot), targetRoot, {
    recursive: true,
    filter: source => !source.split(path.sep).some(part => part === 'bin' || part === 'obj'),
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const target = path.join(targetRoot, manifest.frozen[0].files[0].path);
  fs.writeFileSync(target, content);
  manifest.frozen[0].files[0].sha256 = createHash('sha256')
    .update(fs.readFileSync(target))
    .digest('hex');

  const currentManifest = path.join(targetRoot, 'contracts.freeze.json');
  fs.writeFileSync(currentManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  return { tempRoot, currentManifest };
}

test('a zero-byte frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('');
  assert.throws(
    () => verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /no meaningful content/
  );
});

test('a whitespace-only frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('   \n\t  \r\n');
  assert.throws(
    () => verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /no meaningful content/
  );
});

test('a comment-only frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('// only a line comment\n/* and a\n   block comment */\n');
  assert.throws(
    () => verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /no meaningful content/
  );
});

test('a typeless namespace-only frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('namespace TerraFusion.Abstractions.DTOs;\n');
  assert.throws(
    () => verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /declares no C# type/
  );
});

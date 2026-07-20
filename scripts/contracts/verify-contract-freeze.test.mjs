import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { verifyContractFreeze } from './verify-contract-freeze.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = path.join(
  repoRoot,
  'backend/src/TerraFusion.Abstractions/contracts.freeze.json'
);
const atlasContractRoot = path.join(repoRoot, 'backend/src/TerraFusion.Abstractions/contracts');
const atlasSchemaPath = path.join(atlasContractRoot, 'atlas.spatial-read.v1.schema.json');
const atlasFixtureRoot = path.join(atlasContractRoot, 'fixtures');

function atlasFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(atlasFixtureRoot, `atlas.spatial-read.v1.${name}.synthetic.json`),
      'utf8'
    )
  );
}

function validateAtlasSemantics(exchange) {
  const errors = [];
  if (exchange.request?.countyId !== exchange.result?.countyId) {
    errors.push('response countyId must match request countyId');
  }
  if (exchange.request?.parcelId !== exchange.result?.parcelId) {
    errors.push('response parcelId must match request parcelId');
  }
  const ring = exchange.result?.boundary?.outerRing;
  if (Array.isArray(ring) && ring.length > 0) {
    const first = ring[0];
    const last = ring.at(-1);
    if (first.longitude !== last.longitude || first.latitude !== last.latitude) {
      errors.push('outerRing must be closed');
    }
  }
  return errors;
}

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
    groups: 3,
    frozenFiles: 14,
    deferredFiles: 10,
    osInternalFiles: 5,
  });
});

test('Atlas spatial read positive fixtures satisfy schema and county semantics', () => {
  const schema = JSON.parse(fs.readFileSync(atlasSchemaPath, 'utf8'));
  const validate = new Ajv({ allErrors: true, strict: true, strictRequired: false }).compile(
    schema
  );

  for (const name of [
    'canonical-polygon',
    'provider-polygon',
    'fallback-centroid',
    'unavailable',
  ]) {
    const fixture = atlasFixture(name);
    assert.equal(validate(fixture), true, `${name}: ${JSON.stringify(validate.errors)}`);
    assert.deepEqual(validateAtlasSemantics(fixture), [], name);
  }
});

test('Atlas spatial read negative fixtures fail closed', () => {
  const schema = JSON.parse(fs.readFileSync(atlasSchemaPath, 'utf8'));
  const validate = new Ajv({ allErrors: true, strict: true, strictRequired: false }).compile(
    schema
  );

  const countyMismatch = atlasFixture('county-mismatch');
  assert.equal(validate(countyMismatch), true);
  assert.deepEqual(validateAtlasSemantics(countyMismatch), [
    'response countyId must match request countyId',
  ]);

  for (const name of ['invalid-ring', 'cross-lane-fields']) {
    const fixture = atlasFixture(name);
    assert.equal(validate(fixture), false, `${name} must be rejected`);
  }
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
      groups: 3,
      frozenFiles: 14,
      deferredFiles: 10,
      osInternalFiles: 5,
    }
  );
});

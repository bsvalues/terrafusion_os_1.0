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
const atlasContractRoot = path.join(repoRoot, 'backend/src/TerraFusion.Abstractions/contracts');
const atlasSchemaPath = path.join(atlasContractRoot, 'atlas.spatial-read.v1.schema.json');
const atlasFixtureRoot = path.join(atlasContractRoot, 'fixtures');
const daisSchemaPath = path.join(atlasContractRoot, 'dais.appeal-workflow.v1.schema.json');

function atlasFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(atlasFixtureRoot, `atlas.spatial-read.v1.${name}.synthetic.json`),
      'utf8'
    )
  );
}

function daisFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(atlasFixtureRoot, `dais.appeal-workflow.v1.${name}.synthetic.json`),
      'utf8'
    )
  );
}

function resolveRef(root, reference) {
  assert.match(reference, /^#\//, `only local schema references are supported: ${reference}`);
  return reference
    .slice(2)
    .split('/')
    .map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((current, segment) => current[segment], root);
}

function matchesType(type, value) {
  if (type === 'object')
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}

function validateDaisSemantics(exchange) {
  const errors = [];
  if (exchange.request?.countyId !== exchange.result?.countyId) {
    errors.push('response countyId must match request countyId');
  }

  const selector = exchange.request?.selector ?? {};
  const selected = ['appealId', 'parcelId', 'taxYear'].filter(key => Object.hasOwn(selector, key));
  if (selected.length !== 1) errors.push('selector must contain exactly one identity');

  for (const appeal of exchange.result?.appeals ?? []) {
    const key = selected[0];
    if (key && appeal[key] !== selector[key]) {
      errors.push(`appeal ${appeal.appealId ?? '<unknown>'} must match selector ${key}`);
    }
    for (const timestamp of ['filedAt', 'hearingAt', 'decisionAt']) {
      if (
        appeal[timestamp] &&
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(appeal[timestamp])
      ) {
        errors.push(`${timestamp} must be RFC 3339 UTC`);
      }
    }
    if (appeal.hearingAt && Date.parse(appeal.hearingAt) < Date.parse(appeal.filedAt)) {
      errors.push('hearingAt must not precede filedAt');
    }
    if (appeal.decisionAt && Date.parse(appeal.decisionAt) < Date.parse(appeal.filedAt)) {
      errors.push('decisionAt must not precede filedAt');
    }
  }
  return errors;
}

// The governed-spine job intentionally runs this test without installing workspace dependencies.
// Keep the evaluator limited to the Draft-07 keywords used by the frozen Atlas schema.
function validateJsonSchema(root, schema, value, location = '$') {
  if (schema === true) return [];
  if (schema === false) return [`${location}: schema is false`];
  if (schema.$ref) return validateJsonSchema(root, resolveRef(root, schema.$ref), value, location);

  const errors = [];
  if (schema.type && !matchesType(schema.type, value)) {
    return [`${location}: expected ${schema.type}`];
  }
  if (Object.hasOwn(schema, 'const') && value !== schema.const) {
    errors.push(`${location}: value does not match const`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location}: value is outside enum`);
  }
  if (typeof value === 'string' && schema.minLength && value.length < schema.minLength) {
    errors.push(`${location}: string is shorter than ${schema.minLength}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${location}: number is below minimum`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${location}: number is above maximum`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${location}: array has fewer than ${schema.minItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateJsonSchema(root, schema.items, item, `${location}[${index}]`));
      });
    }
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${location}: missing ${required}`);
    }
    for (const [name, child] of Object.entries(properties)) {
      if (Object.hasOwn(value, name)) {
        errors.push(...validateJsonSchema(root, child, value[name], `${location}.${name}`));
      }
    }
    if (schema.additionalProperties === false) {
      for (const name of Object.keys(value)) {
        if (!Object.hasOwn(properties, name)) errors.push(`${location}: unexpected ${name}`);
      }
    }
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) {
      errors.push(`${location}: object has fewer than ${schema.minProperties} properties`);
    }
  }
  for (const child of schema.allOf ?? []) {
    errors.push(...validateJsonSchema(root, child, value, location));
  }
  if (
    schema.if &&
    validateJsonSchema(root, schema.if, value, location).length === 0 &&
    schema.then
  ) {
    errors.push(...validateJsonSchema(root, schema.then, value, location));
  }
  if (schema.anyOf) {
    const alternatives = schema.anyOf.map(child =>
      validateJsonSchema(root, child, value, location)
    );
    if (!alternatives.some(result => result.length === 0)) {
      errors.push(`${location}: no anyOf alternative matched`);
    }
  }
  if (schema.not && validateJsonSchema(root, schema.not, value, location).length === 0) {
    errors.push(`${location}: forbidden schema matched`);
  }
  return errors;
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
    groups: 4,
    frozenFiles: 25,
    deferredFiles: 10,
    osInternalFiles: 5,
  });
});

test('Atlas spatial read positive fixtures satisfy schema and county semantics', () => {
  const schema = JSON.parse(fs.readFileSync(atlasSchemaPath, 'utf8'));

  for (const name of [
    'canonical-polygon',
    'provider-polygon',
    'fallback-centroid',
    'unavailable',
  ]) {
    const fixture = atlasFixture(name);
    assert.deepEqual(validateJsonSchema(schema, schema, fixture), [], name);
    assert.deepEqual(validateAtlasSemantics(fixture), [], name);
  }
});

test('Atlas spatial read negative fixtures fail closed', () => {
  const schema = JSON.parse(fs.readFileSync(atlasSchemaPath, 'utf8'));

  const countyMismatch = atlasFixture('county-mismatch');
  assert.deepEqual(validateJsonSchema(schema, schema, countyMismatch), []);
  assert.deepEqual(validateAtlasSemantics(countyMismatch), [
    'response countyId must match request countyId',
  ]);

  const invalidRing = atlasFixture('invalid-ring');
  assert.deepEqual(validateJsonSchema(schema, schema, invalidRing), []);
  assert.deepEqual(validateAtlasSemantics(invalidRing), ['outerRing must be closed']);

  const crossLaneFields = atlasFixture('cross-lane-fields');
  assert.notDeepEqual(
    validateJsonSchema(schema, schema, crossLaneFields),
    [],
    'cross-lane fields must be rejected'
  );
});

test('Dais appeal workflow positive fixtures satisfy schema and lifecycle semantics', () => {
  const schema = JSON.parse(fs.readFileSync(daisSchemaPath, 'utf8'));
  for (const name of ['filed-by-parcel', 'decided-by-id', 'empty-by-tax-year']) {
    const fixture = daisFixture(name);
    assert.deepEqual(validateJsonSchema(schema, schema, fixture), [], name);
    assert.deepEqual(validateDaisSemantics(fixture), [], name);
  }
});

test('Dais appeal workflow negative fixtures fail closed', () => {
  const schema = JSON.parse(fs.readFileSync(daisSchemaPath, 'utf8'));
  for (const name of [
    'missing-county',
    'invalid-status',
    'cross-lane-fields',
    'ambiguous-selector',
  ]) {
    assert.notDeepEqual(validateJsonSchema(schema, schema, daisFixture(name)), [], name);
  }
  for (const name of ['county-mismatch', 'selector-mismatch']) {
    const fixture = daisFixture(name);
    assert.notDeepEqual(validateDaisSemantics(fixture), [], name);
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
      groups: 4,
      frozenFiles: 25,
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
    () =>
      verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /no meaningful content/
  );
});

test('a whitespace-only frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('   \n\t  \r\n');
  assert.throws(
    () =>
      verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /no meaningful content/
  );
});

test('a comment-only frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('// only a line comment\n/* and a\n   block comment */\n');
  assert.throws(
    () =>
      verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /no meaningful content/
  );
});

test('a typeless namespace-only frozen contract fails closed', () => {
  const fixture = withDegradedFrozenFile('namespace TerraFusion.Abstractions.DTOs;\n');
  assert.throws(
    () =>
      verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /declares no C# type/
  );
});

test('a typeless file with a construct keyword only inside a string literal fails closed', () => {
  // The keyword appears solely as an attribute string value and a char literal — no type is
  // declared. A bare-keyword check would be fooled; declaration-syntax matching must not be.
  const fixture = withDegradedFrozenFile(
    'namespace TerraFusion.Abstractions.DTOs;\n' +
      '[assembly: System.Reflection.AssemblyMetadata("kind", "public class Fake")]\n' +
      "// grouping = 'e'; // enum-ish\n"
  );
  assert.throws(
    () =>
      verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    /declares no C# type/
  );
});

test('a genuine type declaration still passes the content check', () => {
  // Positive control: declaration-syntax matching must not reject a real, re-pinned contract.
  const fixture = withDegradedFrozenFile(
    'namespace TerraFusion.Abstractions.DTOs;\n\npublic sealed class RealContract\n{\n    public string Name { get; set; } = "class struct enum";\n}\n'
  );
  assert.deepEqual(
    verifyContractFreeze({ repoRoot: fixture.tempRoot, manifestPath: fixture.currentManifest }),
    {
      groups: 4,
      frozenFiles: 25,
      deferredFiles: 10,
      osInternalFiles: 5,
    }
  );
});

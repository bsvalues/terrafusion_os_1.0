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
const daisMutationSchemaPath = path.join(
  atlasContractRoot,
  'dais.appeal-mutation.v1.schema.json'
);
const dossierSchemaPath = path.join(
  atlasContractRoot,
  'dossier.evidence-registry-read.v1.schema.json'
);
const gptSchemaPath = path.join(atlasContractRoot, 'gpt.grounded-context.v1.schema.json');

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

function daisMutationFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(atlasFixtureRoot, `dais.appeal-mutation.v1.${name}.synthetic.json`),
      'utf8'
    )
  );
}

function dossierFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(atlasFixtureRoot, `dossier.evidence-registry-read.v1.${name}.synthetic.json`),
      'utf8'
    )
  );
}

function gptFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(atlasFixtureRoot, `gpt.grounded-context.v1.${name}.synthetic.json`),
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

const daisGrounds = new Set([
  'MARKET_VALUE',
  'UNIFORMITY',
  'CLASSIFICATION',
  'EXEMPTION_DENIAL',
  'CLERICAL_ERROR',
]);
const daisStatuses = new Set(['filed', 'scheduled', 'heard', 'decided', 'withdrawn']);
const daisTransitions = new Map([
  ['filed', new Set(['scheduled', 'heard', 'decided', 'withdrawn'])],
  ['scheduled', new Set(['heard', 'decided', 'withdrawn'])],
  ['heard', new Set(['decided', 'withdrawn'])],
  ['decided', new Set()],
  ['withdrawn', new Set()],
]);
const mutationUtcTimestamp =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/;
const mutationLeapSecondDates = new Set([
  '1972-06-30', '1972-12-31', '1973-12-31', '1974-12-31', '1975-12-31',
  '1976-12-31', '1977-12-31', '1978-12-31', '1979-12-31', '1981-06-30',
  '1982-06-30', '1983-06-30', '1985-06-30', '1987-12-31', '1989-12-31',
  '1990-12-31', '1992-06-30', '1993-06-30', '1994-06-30', '1995-12-31',
  '1997-06-30', '1998-12-31', '2005-12-31', '2008-12-31', '2012-06-30',
  '2015-06-30', '2016-12-31',
]);

function parseMutationUtcTimestamp(value) {
  if (typeof value !== 'string') return null;
  const match = mutationUtcTimestamp.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = ''] = match;
  const [year, month, day, hour, minute, second] = [
    yearText, monthText, dayText, hourText, minuteText, secondText,
  ].map(Number);
  const date = `${yearText}-${monthText}-${dayText}`;
  const leapSecond = second === 60;
  if (leapSecond && (hour !== 23 || minute !== 59 || !mutationLeapSecondDates.has(date))) return null;
  const instant = new Date(0);
  instant.setUTCFullYear(year, month - 1, day);
  instant.setUTCHours(hour, minute, leapSecond ? 59 : second, 0);
  if (
    Number.isNaN(instant.getTime()) || instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 || instant.getUTCDate() !== day ||
    instant.getUTCHours() !== hour || instant.getUTCMinutes() !== minute ||
    instant.getUTCSeconds() !== (leapSecond ? 59 : second)
  ) return null;
  return { year, dateTime: `${date}T${hourText}:${minuteText}:${secondText}`, fraction };
}

function compareMutationInstants(left, right) {
  if (left.dateTime !== right.dateTime) return left.dateTime.localeCompare(right.dateTime);
  const width = Math.max(left.fraction.length, right.fraction.length);
  return left.fraction.padEnd(width, '0').localeCompare(right.fraction.padEnd(width, '0'));
}

function mutationIdentity(request, decision, violations, mutation) {
  const result = {
    schemaVersion: request.schemaVersion,
    operation: request.operation,
    commandId: request.commandId,
    countyId: request.countyId,
  };
  if (request.traceId !== undefined) result.traceId = request.traceId;
  result.decision = decision;
  if (mutation !== undefined) result.mutation = mutation;
  result.violations = violations;
  return result;
}

function rejectedMutation(request, code, message) {
  return mutationIdentity(request, 'rejected', [{ code, message }]);
}

function expectedDaisMutationResult(request) {
  const effectiveAt = parseMutationUtcTimestamp(request.effectiveAt);
  if (!effectiveAt) {
    return rejectedMutation(
      request,
      'INVALID_LIFECYCLE',
      'lifecycle timestamps must be valid RFC 3339 UTC instants'
    );
  }
  if (request.operation === 'create') {
    const ground = request.command.ground ?? 'MARKET_VALUE';
    if (!daisGrounds.has(ground)) {
      return rejectedMutation(
        request,
        'INVALID_GROUND',
        'ground is outside the closed Dais vocabulary'
      );
    }
    const taxYear = request.command.taxYear ?? effectiveAt.year;
    if (!Number.isInteger(taxYear) || taxYear < 1900 || taxYear > 2200) {
      return rejectedMutation(
        request,
        'INVALID_TAX_YEAR',
        'taxYear must be between 1900 and 2200'
      );
    }
    return mutationIdentity(request, 'accepted', [], {
      ground,
      status: 'filed',
      taxYear,
      filedAt: request.effectiveAt,
      updatedAt: request.effectiveAt,
    });
  }

  const current = request.command.current;
  const requested = request.command.requested;
  if (!daisStatuses.has(current.status)) {
    return rejectedMutation(request, 'INVALID_LIFECYCLE', 'current status is invalid');
  }
  if (
    (current.status === 'filed' && (current.hearingAt || current.decisionAt)) ||
    (current.status !== 'decided' && current.decisionAt)
  ) {
    return rejectedMutation(
      request,
      'INVALID_LIFECYCLE',
      'current lifecycle timestamps conflict with status'
    );
  }
  const lifecycleInstants = [current.filedAt, current.hearingAt, current.decisionAt, request.effectiveAt]
    .filter(Boolean)
    .map(parseMutationUtcTimestamp);
  if (lifecycleInstants.some(instant => instant === null)) {
    return rejectedMutation(
      request,
      'INVALID_LIFECYCLE',
      'lifecycle timestamps must be valid RFC 3339 UTC instants'
    );
  }
  if (lifecycleInstants.some(
    (instant, index) => index > 0 && compareMutationInstants(instant, lifecycleInstants[index - 1]) < 0
  )) {
    return rejectedMutation(
      request,
      'INVALID_LIFECYCLE',
      'lifecycle timestamps must be ordered and effectiveAt must not move backward'
    );
  }
  if (!daisStatuses.has(requested.status)) {
    return rejectedMutation(
      request,
      'INVALID_STATUS',
      'requested status is outside the closed Dais vocabulary'
    );
  }
  if (requested.status !== 'decided' && requested.hasDecidedValue) {
    return rejectedMutation(
      request,
      'INVALID_LIFECYCLE',
      'hasDecidedValue is allowed only when requested status is decided'
    );
  }
  if (!daisTransitions.get(current.status).has(requested.status)) {
    const message = ['decided', 'withdrawn'].includes(current.status)
      ? `${current.status} is terminal`
      : `${current.status} cannot transition to ${requested.status}`;
    return rejectedMutation(request, 'INVALID_TRANSITION', message);
  }
  const mutation = { status: requested.status, updatedAt: request.effectiveAt };
  if (requested.status === 'decided' && requested.hasDecidedValue) {
    mutation.decisionAt = request.effectiveAt;
  }
  return mutationIdentity(request, 'accepted', [], mutation);
}

function validateDaisMutationSemantics(exchange) {
  const expected = expectedDaisMutationResult(exchange.request);
  return JSON.stringify(expected) === JSON.stringify(exchange.result)
    ? []
    : ['result must exactly match the suite-owned mutation decision'];
}

function validateDossierSemantics(exchange) {
  const errors = [];
  const { request, result } = exchange;
  if (request?.countyId !== result?.countyId)
    errors.push('response countyId must match request countyId');
  if (request?.parcelId !== result?.parcelId)
    errors.push('response parcelId must match request parcelId');
  if (request?.limit !== result?.limit || request?.offset !== result?.offset)
    errors.push('response pagination must match request');
  const records = result?.results ?? [];
  if (new Set(records.map(record => record.evidenceId)).size !== records.length)
    errors.push('evidenceId values must be unique');
  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1];
    const current = records[index];
    const previousInstant = Date.parse(previous.createdAt);
    const currentInstant = Date.parse(current.createdAt);
    if (
      previousInstant < currentInstant ||
      (previousInstant === currentInstant && previous.evidenceId > current.evidenceId)
    ) {
      errors.push('results must sort by createdAt descending then evidenceId ascending');
    }
  }
  if (result && result.hasMore !== result.offset + records.length < result.total)
    errors.push('hasMore is inconsistent with page bounds');
  if (result && result.offset + records.length > result.total)
    errors.push('page rows exceed total');
  if (result && records.length > result.limit) errors.push('result count exceeds limit');
  return errors;
}

function validateGptSemantics(exchange) {
  const errors = [];
  const { request, result } = exchange;
  if (request?.countyId !== result?.countyId)
    errors.push('response countyId must match request countyId');
  if (request?.datasetKey !== result?.datasetKey)
    errors.push('response datasetKey must match request datasetKey');
  if (request?.traceId !== result?.traceId)
    errors.push('response traceId must match request traceId');
  const queryText = request?.queryText ?? '';
  const rawPiiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?:\+?1[.\s-]?)?(?:\(\d{3}\)|\d{3})[.\s-]?\d{3}[.\s-]?\d{4}\b/,
  ];
  if (rawPiiPatterns.some(pattern => pattern.test(queryText)))
    errors.push('queryText must not contain raw SSN, email, or phone PII');

  const citations = result?.citations ?? [];
  if (result?.status === 'GROUNDED' && citations.length === 0)
    errors.push('GROUNDED requires at least one citation');
  if (['NO_RELEVANT_CONTEXT', 'DENIED'].includes(result?.status) && citations.length !== 0)
    errors.push(`${result.status} requires empty citations`);
  if (citations.length > (request?.topK ?? 0)) errors.push('citation count exceeds topK');

  const identities = citations.map(citation => `${citation.sourceId}\0${citation.chunkId}`);
  if (new Set(identities).size !== identities.length)
    errors.push('citation sourceId/chunkId identities must be unique');
  for (const citation of citations) {
    if (rawPiiPatterns.some(pattern => pattern.test(citation.excerpt ?? '')))
      errors.push('citation excerpt must not contain raw SSN, email, or phone PII');
    if (citation.score < request.scoreThreshold)
      errors.push('citation score must meet scoreThreshold');
  }
  for (let index = 1; index < citations.length; index += 1) {
    const previous = citations[index - 1];
    const current = citations[index];
    if (
      previous.score < current.score ||
      (previous.score === current.score && previous.sourceId > current.sourceId) ||
      (previous.score === current.score &&
        previous.sourceId === current.sourceId &&
        previous.chunkIndex > current.chunkIndex) ||
      (previous.score === current.score &&
        previous.sourceId === current.sourceId &&
        previous.chunkIndex === current.chunkIndex &&
        previous.chunkId > current.chunkId)
    ) {
      errors.push(
        'citations must sort by score descending, sourceId ascending, chunkIndex ascending, chunkId ascending'
      );
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
  if (typeof value === 'string' && schema.maxLength && value.length > schema.maxLength) {
    errors.push(`${location}: string is longer than ${schema.maxLength}`);
  }
  if (typeof value === 'string' && schema.pattern && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${location}: string does not match pattern`);
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
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${location}: array has more than ${schema.maxItems} items`);
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
    groups: 7,
    frozenFiles: 67,
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

  const invalidTimestamp = daisFixture('filed-by-parcel');
  invalidTimestamp.result.appeals[0].filedAt = '2026-01-10 18:30:00 local';
  assert.notDeepEqual(
    validateJsonSchema(schema, schema, invalidTimestamp),
    [],
    'non-UTC timestamp must be rejected by the schema'
  );
});

test('Dais appeal mutation accepted fixtures satisfy schema and exact decision semantics', () => {
  const schema = JSON.parse(fs.readFileSync(daisMutationSchemaPath, 'utf8'));
  for (const name of ['create-defaults', 'filed-to-heard', 'heard-to-decided']) {
    const fixture = daisMutationFixture(name);
    assert.deepEqual(validateJsonSchema(schema, schema, fixture), [], name);
    assert.deepEqual(validateDaisMutationSemantics(fixture), [], name);
  }
});

test('Dais appeal mutation rejected commands return exact typed decisions', () => {
  const schema = JSON.parse(fs.readFileSync(daisMutationSchemaPath, 'utf8'));
  for (const name of [
    'invalid-ground',
    'invalid-tax-year',
    'invalid-status',
    'invalid-transition',
    'invalid-lifecycle',
    'invalid-calendar',
    'invalid-current-shape',
    'invalid-decided-value-shape',
  ]) {
    const fixture = daisMutationFixture(name);
    assert.deepEqual(validateJsonSchema(schema, schema, fixture), [], name);
    assert.equal(fixture.result.decision, 'rejected', name);
    assert.deepEqual(validateDaisMutationSemantics(fixture), [], name);
  }
});

test('Dais appeal mutation identity and cross-lane violations fail closed', () => {
  const schema = JSON.parse(fs.readFileSync(daisMutationSchemaPath, 'utf8'));
  const countyMismatch = daisMutationFixture('county-mismatch');
  assert.deepEqual(validateJsonSchema(schema, schema, countyMismatch), []);
  assert.notDeepEqual(validateDaisMutationSemantics(countyMismatch), []);

  assert.notDeepEqual(
    validateJsonSchema(schema, schema, daisMutationFixture('cross-lane-fields')),
    [],
    'PII and monetary fields must not cross the mutation decision boundary'
  );
});

test('Dossier evidence registry positive fixtures satisfy schema and list semantics', () => {
  const schema = JSON.parse(fs.readFileSync(dossierSchemaPath, 'utf8'));
  for (const name of ['two-record-page', 'empty-page', 'next-page']) {
    const fixture = dossierFixture(name);
    assert.deepEqual(validateJsonSchema(schema, schema, fixture), [], name);
    assert.deepEqual(validateDossierSemantics(fixture), [], name);
  }
});

test('Dossier evidence registry negative fixtures fail closed', () => {
  const schema = JSON.parse(fs.readFileSync(dossierSchemaPath, 'utf8'));
  for (const name of ['unknown-evidence-type', 'unknown-integrity', 'cross-lane-fields']) {
    assert.notDeepEqual(validateJsonSchema(schema, schema, dossierFixture(name)), [], name);
  }
  for (const name of [
    'county-mismatch',
    'parcel-mismatch',
    'duplicate-evidence-id',
    'unstable-tie-order',
    'pagination-inconsistent',
  ]) {
    assert.notDeepEqual(validateDossierSemantics(dossierFixture(name)), [], name);
  }

  const rowsExceedTotal = dossierFixture('next-page');
  rowsExceedTotal.result.total = 1;
  rowsExceedTotal.result.hasMore = false;
  assert.notDeepEqual(validateDossierSemantics(rowsExceedTotal), [], 'rows cannot exceed total');

  const fractionalOutOfOrder = dossierFixture('two-record-page');
  fractionalOutOfOrder.result.results[0].createdAt = '2026-01-01T00:00:00Z';
  fractionalOutOfOrder.result.results[1].createdAt = '2026-01-01T00:00:00.001Z';
  assert.notDeepEqual(
    validateDossierSemantics(fractionalOutOfOrder),
    [],
    'timestamp ordering compares instants'
  );
});

test('GPT grounded context positive fixtures satisfy schema and grounding semantics', () => {
  const schema = JSON.parse(fs.readFileSync(gptSchemaPath, 'utf8'));
  for (const name of ['grounded-two-citations', 'no-relevant-context', 'denied-dataset']) {
    const fixture = gptFixture(name);
    assert.deepEqual(validateJsonSchema(schema, schema, fixture), [], name);
    assert.deepEqual(validateGptSemantics(fixture), [], name);
  }
});

test('GPT grounded context negative fixtures fail closed', () => {
  const schema = JSON.parse(fs.readFileSync(gptSchemaPath, 'utf8'));
  for (const name of ['unknown-status', 'citation-without-source', 'full-text-or-provider-leak']) {
    assert.notDeepEqual(validateJsonSchema(schema, schema, gptFixture(name)), [], name);
  }
  for (const name of [
    'county-mismatch',
    'dataset-mismatch',
    'trace-mismatch',
    'raw-pii-query',
    'duplicate-citation',
    'unstable-order',
  ]) {
    assert.notDeepEqual(validateGptSemantics(gptFixture(name)), [], name);
  }

  for (const queryText of [
    'Contact jane@example.gov',
    'Call 509-555-1212',
    'Call 5095551212',
    'Call (509)555-1212',
    'Call +15095551212',
  ]) {
    const fixture = gptFixture('denied-dataset');
    fixture.request.queryText = queryText;
    assert.notDeepEqual(validateGptSemantics(fixture), [], queryText);
  }

  const belowThreshold = gptFixture('grounded-two-citations');
  belowThreshold.result.citations[1].score = belowThreshold.request.scoreThreshold - 0.01;
  assert.notDeepEqual(
    validateGptSemantics(belowThreshold),
    [],
    'citations below scoreThreshold must fail closed'
  );

  const excerptPii = gptFixture('grounded-two-citations');
  excerptPii.result.citations[0].excerpt = 'Contact jane@example.gov';
  assert.notDeepEqual(validateGptSemantics(excerptPii), [], 'citation PII must fail closed');

  const groundedWithoutCitations = gptFixture('grounded-two-citations');
  groundedWithoutCitations.result.citations = [];
  assert.notDeepEqual(
    validateJsonSchema(schema, schema, groundedWithoutCitations),
    [],
    'GROUNDED requires at least one citation in the schema'
  );

  for (const name of ['no-relevant-context', 'denied-dataset']) {
    const terminalWithCitation = gptFixture(name);
    terminalWithCitation.result.citations = [
      gptFixture('grounded-two-citations').result.citations[0],
    ];
    assert.notDeepEqual(
      validateJsonSchema(schema, schema, terminalWithCitation),
      [],
      `${name} forbids citations in the schema`
    );
  }

  const unresolvedTie = gptFixture('grounded-two-citations');
  Object.assign(unresolvedTie.result.citations[0], {
    sourceId: 'source-a',
    chunkId: 'chunk-z',
    chunkIndex: 1,
    score: 0.9,
  });
  Object.assign(unresolvedTie.result.citations[1], {
    sourceId: 'source-a',
    chunkId: 'chunk-a',
    chunkIndex: 1,
    score: 0.9,
  });
  assert.notDeepEqual(validateGptSemantics(unresolvedTie), [], 'chunkId tie-breaker');
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
      groups: 7,
      frozenFiles: 67,
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
      groups: 7,
      frozenFiles: 67,
      deferredFiles: 10,
      osInternalFiles: 5,
    }
  );
});

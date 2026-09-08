import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const implementation = require('../pilot/atlasSpatialAnomalyHandler.js');
const county = '11111111-1111-1111-1111-111111111111';
const hash = value => createHash('sha256').update(value).digest('hex');
function harness(responseOverride) {
  assert.equal(typeof implementation.createAtlasSpatialAnomalyHandler, 'function', 'real anomaly handler must exist');
  const context = { countyId: county, correlationId: 'atlas-test-cid' };
  const params = { county, taxYear: 2026, geographyType: 'county', geographyId: county, metric: 'residual_cluster' };
  const response = responseOverride ?? { taxYear: 2026, hood: null, totalPool: 6, usedForFit: 5, excludedCount: 1,
    insufficientData: false, singularMatrix: false, model: { n: 5, beta: [1, 2, 3, 4] },
    residuals: [30, 20, 0, 1, -2].map((percentResidual, index) => ({
      parcelId: `synthetic-${index}`, saleDate: '2025-01-01', residual: percentResidual * 10,
      percentResidual, hood: index < 3 ? 'north' : 'south',
    })) };
  const body = JSON.stringify(response);
  const reads = []; const exchanges = [];
  const handler = implementation.createAtlasSpatialAnomalyHandler({
    readRegression: async (query, options) => { reads.push({ query: query.toString(), options }); return { ok: true, status: 200, data: { body } }; },
    invokeCanonical: async exchange => {
      exchanges.push(exchange);
      return { judgment: { contract: exchange.contract, version: exchange.version, request: exchange.request,
        status: 'INSUFFICIENT_DATA', reason: 'SOURCE_INSUFFICIENT', sourceRefs: exchange.materialized.sourceRefs },
        provenance: { sourceCommit: 'synthetic-candidate-only' } };
    },
  });
  const bind = () => implementation.bindAtlasSpatialAnomalyAuthorization(context, 'Bearer synthetic-token');
  return { context, params, handler, bind, reads, exchanges, body };
}

test('real source observations are passed unchanged with exact response digest and caller authorization', async () => {
  const h = harness(); h.bind();
  const result = await h.handler(h.params, h.context);
  assert.equal(h.reads[0].query, `countyId=${county}&taxYear=2026`);
  assert.equal(h.reads[0].options.token, 'synthetic-token');
  assert.equal(h.reads[0].options.callerAuthorization, true);
  assert.equal(h.exchanges[0].materialized.observations[0].percentResidual, 30);
  assert.equal(h.exchanges[0].materialized.observations[0].clusterId, 'north');
  assert.equal(h.exchanges[0].materialized.sourceRefs[0].responseSha256, hash(h.body));
  assert.equal(h.exchanges[0].materialized.observations[0].observationId, `${hash(h.body)}:0`);
  assert.equal(result.sourceEvidence.responseBody, h.body);
  assert.equal(JSON.stringify(result).includes('synthetic-token'), false);
  assert.equal(JSON.stringify(h.context).includes('synthetic-token'), false);
});

test('missing caller token and mismatched county fail before reads', async () => {
  const h = harness();
  await assert.rejects(h.handler(h.params, h.context), /authorization/i);
  h.bind();
  await assert.rejects(h.handler({ ...h.params, county: '22222222-2222-2222-2222-222222222222' }, h.context), /county/i);
  assert.equal(h.reads.length, 0);
});

test('missing explicit geography or invalid year never defaults to a cluster', async () => {
  const h = harness(); h.bind();
  for (const params of [{ ...h.params, geographyId: '' }, { ...h.params, geographyType: undefined }, { ...h.params, taxYear: 0 }])
    await assert.rejects(h.handler(params, h.context), /scope|year|geography/i);
  assert.equal(h.reads.length, 0);
});

test('neighborhood query is encoded and source scope drift fails before canonical invocation', async () => {
  const h = harness(); h.bind();
  await assert.rejects(h.handler({ ...h.params, geographyType: 'neighborhood', geographyId: 'north' }, h.context), /scope/i);
  assert.equal(h.reads[0].query, `countyId=${county}&taxYear=2026&hood=north`);
  assert.equal(h.exchanges.length, 0);
});

test('source insufficiency preserves no-model evidence without manufacturing residual records', async () => {
  const h = harness({ taxYear: 2026, hood: null, totalPool: 3, usedForFit: 3, excludedCount: 0,
    insufficientData: true, model: null, residuals: [] }); h.bind();
  await h.handler(h.params, h.context);
  assert.equal(h.exchanges[0].materialized.sourceState, 'INSUFFICIENT_DATA');
  assert.deepEqual(h.exchanges[0].materialized.observations, []);
  assert.deepEqual(h.exchanges[0].materialized.sample, { total: 3, used: 0, excluded: 3 });
});

test('malformed sample accounting and wrong returned year never reach judgment', async () => {
  for (const change of [r => { r.taxYear = 2025; }, r => { r.usedForFit = 9; }, r => { r.residuals[0].parcelId = null; }]) {
    const base = harness(); const r = JSON.parse(base.body); change(r);
    const h = harness(r); h.bind();
    await assert.rejects(h.handler(h.params, h.context), /source|scope/i);
    assert.equal(h.exchanges.length, 0);
  }
});

test('backing failure cannot substitute a canned result', async () => {
  const h = harness(); h.bind();
  const handler = implementation.createAtlasSpatialAnomalyHandler({
    readRegression: async () => ({ ok: false, status: 503, error: 'source offline' }),
    invokeCanonical: async () => assert.fail('Unavailable backend must not invoke synthetic judgment'),
  });
  await assert.rejects(handler(h.params, h.context), /unavailable/i);
});

test('regression transport retains exact response bytes and refuses non-loopback authorization', async () => {
  const backend = require('../pilot/backendClient.js');
  assert.equal(typeof backend.backendGetAtlasRegression, 'function');
  const oldFetch = globalThis.fetch;
  const oldBase = process.env.TF_API_BASE_URL;
  const requests = [];
  globalThis.fetch = async (url, options) => { requests.push({ url, options }); return new Response('{ "exact": 1 }\n'); };
  try {
    process.env.TF_API_BASE_URL = 'http://127.0.0.1:5046';
    const result = await backend.backendGetAtlasRegression(new URLSearchParams({ countyId: county, taxYear: '2026' }), { token: 'synthetic-token', correlationId: 'atlas-test-cid' });
    assert.equal(result.data.body, '{ "exact": 1 }\n');
    assert.equal(requests[0].options.redirect, 'error');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer synthetic-token');
    process.env.TF_API_BASE_URL = 'https://external.invalid';
    assert.equal((await backend.backendGetAtlasRegression(new URLSearchParams(), { token: 'synthetic-token' })).ok, false);
    assert.equal(requests.length, 1);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldBase === undefined) delete process.env.TF_API_BASE_URL; else process.env.TF_API_BASE_URL = oldBase;
  }
});

test('real registration replaces the retired spatial stub and denies missing caller credentials', async () => {
  const { registerR1Handlers } = require('../pilot/handlers.real.js');
  const { explainSpatialAnomalyHandler } = require('../pilot/handlers.js');
  const handlers = new Map();
  registerR1Handlers({ registerHandler: (id, handler) => handlers.set(id, handler) }, {});
  assert.equal(typeof handlers.get('explain_spatial_anomaly'), 'function');
  await assert.rejects(handlers.get('explain_spatial_anomaly')({}, { countyId: county }), /authorization/i);
  await assert.rejects(explainSpatialAnomalyHandler({ county, taxYear: 2026, metric: 'cod' }, { countyId: county }), /unavailable|canonical/i);
});

test('actual bearer ingress and registry enforce muse before reaching the spatial source handler', async () => {
  // Load only existing ingress functions: importing the runtime itself would start a server.
  const source = readFileSync(new URL('../pilot/dev-pilot-runtime.mjs', import.meta.url), 'utf8');
  const functions = ['firstHeaderValue', 'optionalHeaderValue', 'normalizeToolParams', 'buildPilotExecutionContext']
    .map(name => { const match = source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));
      assert.ok(match, `Existing ingress function ${name} must be available`); return match[0]; }).join('\n');
  const ingress = runInNewContext(`${functions}\nbuildPilotExecutionContext`, {
    randomUUID, bindAtlasSpatialAnomalyAuthorization: implementation.bindAtlasSpatialAnomalyAuthorization,
    bindCountyWorkflowAuthorization: require('../pilot/countyWorkflowHandlers.js').bindCountyWorkflowAuthorization,
  });
  const { ToolRunner } = require('../pilot/ToolRunner.js');
  const { ToolRegistry } = require('../pilot/ToolRegistry.js');
  const registry = new ToolRegistry();
  await registry.initialize(fileURLToPath(new URL('../../../tools/registry/terrapilot.tools.json', import.meta.url)));
  const runner = new ToolRunner({ registry }); // Actual registry, mode/auth/scope gate and handler dispatch.
  const h = harness();
  runner.registerHandler('explain_spatial_anomaly', h.handler);
  const req = { headers: { authorization: 'Bearer synthetic-unit-caller', 'x-county-id': county,
    'x-user-id': 'synthetic-user', 'x-role': 'appraiser' } };
  const body = { toolId: 'explain_spatial_anomaly', params: h.params };
  const denied = await runner.execute({ ...body, context: ingress(req, body) });
  assert.equal(denied.errorCode, 'MODE_MISMATCH');
  assert.equal(h.reads.length, 0);
  const explicit = { ...body, mode: 'muse' };
  const allowed = await runner.execute({ ...explicit, context: ingress(req, explicit) });
  assert.equal(allowed.ok, true, JSON.stringify(allowed));
  assert.equal(h.reads.length, 1);
  assert.equal(h.reads[0].options.token, 'synthetic-unit-caller');
  assert.equal(h.exchanges[0].request.countyId, county);
});

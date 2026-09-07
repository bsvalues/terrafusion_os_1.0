import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { registerR1Handlers } = require('../pilot/handlers.real.js');

test('active real registration excludes the 18 preserved forward-staged office tools', () => {
  const ids = new Set();
  registerR1Handlers({ registerHandler: id => ids.add(id) }, {});
  const staged = ['search_recorded_documents', 'get_title_chain', 'explain_recording_fees', 'record_document',
    'release_lien', 'summarize_parcel_recordings', 'get_tax_statement', 'explain_tax_breakdown',
    'record_payment', 'check_delinquency_status', 'create_installment_plan', 'summarize_collection_stats',
    'initiate_tax_sale', 'audit_roll_summary', 'check_levy_compliance', 'submit_audit_finding',
    'reconcile_cross_office', 'generate_compliance_report'];
  assert.deepEqual(staged.filter(id => ids.has(id)), []);
});

test('caller-auth workflows reject remote destinations and never follow redirects', async () => {
  const { bindCountyWorkflowAuthorization } = require('../pilot/countyWorkflowHandlers.js');
  const handlers = new Map();
  registerR1Handlers({ registerHandler: (id, handler) => handlers.set(id, handler) }, {});
  const county = '11111111-1111-1111-1111-111111111111';
  const context = { countyId: county, userId: 'controlled-operator', roles: ['assessor'], mode: 'pilot' };
  bindCountyWorkflowAuthorization(context, 'Bearer controlled-test-token');
  const params = { county, taxYear: 2026, role: 'assessor' };
  const handler = handlers.get('generate_morning_brief');
  const previous = process.env.TF_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => {
    fetches++;
    return new Response(JSON.stringify({ countyId: county, taxYear: 2026 }));
  };
  try {
    process.env.TF_API_BASE_URL = 'https://unapproved.example';
    await assert.rejects(() => handler(params, context, {}), /loopback|destination/i);
    assert.equal(fetches, 0, 'reject destination before sending credentials');
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.TF_API_BASE_URL; else process.env.TF_API_BASE_URL = previous;
  }
  const paths = [];
  const server = createServer((req, res) => {
    paths.push(req.url);
    if (req.url === '/credential-sink') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ countyId: county, taxYear: 2026 }));
    } else {
      res.writeHead(307, { Location: '/credential-sink' });
      res.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  process.env.TF_API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(() => handler(params, context, {}), /unreachable|redirect/i);
    assert.equal(paths.length, 1, 'credential-bearing redirect must not be followed');
  } finally {
    if (previous === undefined) delete process.env.TF_API_BASE_URL; else process.env.TF_API_BASE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('all four registered workflows preserve scope and propagate real backend failures', async () => {
  const handlers = new Map();
  registerR1Handlers({ registerHandler: (id, handler) => handlers.set(id, handler) }, {});
  const { bindCountyWorkflowAuthorization } = require('../pilot/countyWorkflowHandlers.js');
  const county = '11111111-1111-1111-1111-111111111111';
  const seen = [];
  let response = { countyId: county, taxYear: 2026, observedRecordIds: ['controlled-record'] };
  let status = 200;
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    seen.push({ method: req.method, url: new URL(req.url, 'http://localhost'), body: body ? JSON.parse(body) : null });
    assert.equal(req.headers.authorization, 'Bearer controlled-test-token');
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.TF_API_BASE_URL;
  process.env.TF_API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  const common = { county, taxYear: 2026, requestId: '44444444-4444-4444-4444-444444444444' };
  const cases = [
    ['generate_morning_brief', { role: 'assessor' }, 'GET', '/api/dossier/workflows/morning-brief'],
    ['open_appeal_packet', { appealId: '33333333-3333-3333-3333-333333333333', parcelId: 'controlled-parcel' }, 'GET', '/api/dossier/workflows/appeals/33333333-3333-3333-3333-333333333333/packet'],
    ['export_equalization_package', { draftVersion: '33333333-3333-3333-3333-333333333333', revision: 'a'.repeat(64) }, 'POST', '/api/dossier/workflows/exports/equalization'],
    ['export_audit_bundle', { bundleScope: 'parcel', subjectId: 'controlled-parcel' }, 'POST', '/api/dossier/workflows/exports/audit'],
  ];
  try {
    for (const [id, extra, method, path] of cases) {
      const handler = handlers.get(id);
      assert.equal(typeof handler, 'function', `${id} must have a real registration`);
      const params = { ...common, ...extra };
      const context = { countyId: county, userId: 'controlled-operator', roles: ['assessor'], mode: 'pilot', confirmation: true, reasonCode: 'annual_certification' };
      bindCountyWorkflowAuthorization(context, 'Bearer controlled-test-token');
      response = { countyId: county, taxYear: 2026, observedRecordIds: ['controlled-record'] };
      status = 200;
      assert.deepEqual(await handler(params, context, {}), response);
      assert.equal(seen.at(-1).method, method);
      assert.equal(seen.at(-1).url.pathname, path);
      if (method === 'GET') {
        assert.equal(seen.at(-1).url.searchParams.get('county'), county);
        assert.equal(seen.at(-1).url.searchParams.get('taxYear'), '2026');
      } else {
        assert.equal(seen.at(-1).body.county, county);
        assert.equal(seen.at(-1).body.requestId, common.requestId);
      }
      response = { countyId: '22222222-2222-2222-2222-222222222222', taxYear: 2026 };
      await assert.rejects(() => handler(params, context, {}), /context mismatch/);
      response = { countyId: county, taxYear: 2025 };
      await assert.rejects(() => handler(params, context, {}), /context mismatch/);
      for (const failure of [403, 404, 409, 503]) {
        status = failure;
        response = { error: 'controlled backend refusal' };
        await assert.rejects(() => handler(params, context, {}), new RegExp(String(failure)));
      }
      const count = seen.length;
      await assert.rejects(() => handler({ ...params, taxYear: 0 }, context, {}), /assessment year/);
      await assert.rejects(() => handler(params, { ...context }, {}), /authorization/);
      assert.equal(seen.length, count);
    }
  } finally {
    if (previous === undefined) delete process.env.TF_API_BASE_URL; else process.env.TF_API_BASE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('real equalization handler forwards caller authorization and rejects nonexistent drafts', async () => {
  const handlers = new Map();
  registerR1Handlers({ registerHandler: (id, handler) => handlers.set(id, handler) }, {});
  const handler = handlers.get('export_equalization_package');
  assert.equal(typeof handler, 'function', 'real handler must be registered');
  const { bindCountyWorkflowAuthorization } = require('../pilot/countyWorkflowHandlers.js');
  const county = '11111111-1111-1111-1111-111111111111';
  const params = { county, draftVersion: '33333333-3333-3333-3333-333333333333', revision: 'a'.repeat(64), taxYear: 2026, requestId: '44444444-4444-4444-4444-444444444444' };
  const seen = [];
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    seen.push({ authorization: req.headers.authorization, path: req.url, body: JSON.parse(body) });
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Draft not found' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.TF_API_BASE_URL;
  process.env.TF_API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    const context = { countyId: county, userId: 'synthetic-operator', roles: ['assessor'], mode: 'pilot', confirmation: true, reasonCode: 'annual_certification' };
    bindCountyWorkflowAuthorization(context, 'Bearer controlled-test-token');
    await assert.rejects(() => handler(params, context, {}), /404/);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].authorization, 'Bearer controlled-test-token');
    assert.equal(seen[0].path, '/api/dossier/workflows/exports/equalization');
    assert.equal(seen[0].body.draftId, params.draftVersion);
    assert.equal(seen[0].body.revision, 'a'.repeat(64));
    assert.equal(seen[0].body.confirmed, true);
    assert.equal(seen[0].body.county, county);
    assert.equal(JSON.stringify(context).includes('controlled-test-token'), false, 'bearer must never be serialized into trace context');
    await assert.rejects(() => handler(params, { ...context }, {}), /authorization/i);
    const unconfirmed = { ...context, confirmation: false };
    bindCountyWorkflowAuthorization(unconfirmed, 'Bearer controlled-test-token');
    await assert.rejects(() => handler(params, unconfirmed, {}), /confirmation/i);
    await assert.rejects(() => handler({ ...params, county: '22222222-2222-2222-2222-222222222222' }, context, {}), /county/i);
    assert.equal(seen.length, 1, 'denied requests must not reach the backend');
  } finally {
    if (previous === undefined) delete process.env.TF_API_BASE_URL; else process.env.TF_API_BASE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

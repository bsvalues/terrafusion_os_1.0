import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { registerR1Handlers } = require('../pilot/handlers.real.js');

test('live workflow ingress rejects schema violations before tracing or backend dispatch', { timeout: 30000 }, async () => {
  const county = '11111111-1111-1111-1111-111111111111';
  let dispatches = 0;
  const downstreamCids = [];
  const backend = createServer((req, res) => {
    if (req.url.startsWith('/api/dossier/workflows/context?')) {
      req.resume();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ countyId: county }));
      return;
    }
    dispatches++;
    downstreamCids.push(req.headers['x-correlation-id']);
    req.resume();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ countyId: county, taxYear: 2024 }));
  });
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const portProbe = createServer();
  await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'HOME'])
    if (process.env[key]) env[key] = process.env[key];
  const child = spawn(process.execPath, [fileURLToPath(new URL('../pilot/dev-pilot-runtime.mjs', import.meta.url))], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...env, TF_PILOT_PORT: String(port), TF_API_BASE_URL: `http://127.0.0.1:${backend.address().port}` },
  });
  let logs = '';
  child.stdout.on('data', value => { logs = (logs + value).slice(-8000); });
  child.stderr.on('data', value => { logs = (logs + value).slice(-8000); });
  const base = `http://127.0.0.1:${port}`;
  let roleHeader = 'Developer,Assessor,GovernmentUser,appraiser';
  const post = async (path, body) => {
    // Parser fixture only. The real browser proof obtains its JWT from the actual API issuer.
    const token = `e30.${Buffer.from(JSON.stringify({ sub: 'synthetic-operator', countyId: county, roles: roleHeader?.split(',') ?? [] })).toString('base64url')}.signature`;
    const response = await fetch(base + path, { method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Correlation-ID': 'tf-controlled-live-ingress', 'x-county-id': county, 'x-user-id': 'forged-header-operator', 'x-role': 'administrator', 'x-roles': 'administrator' },
      body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    return response.json();
  };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100 && !ready; attempt++) {
      if (child.exitCode !== null) throw new Error(`Owned Pilot exited: ${logs}`);
      try { ready = (await fetch(base + '/pilot/health', { signal: AbortSignal.timeout(200) })).ok; } catch { /* owned startup */ }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(ready, true, logs);
    const cases = [
      { toolId: 'generate_morning_brief', mode: 'muse', params: { county, taxYear: 2024, role: 'chief_appraiser' } },
      { toolId: 'open_appeal_packet', mode: 'pilot', params: { county, taxYear: 2024, appealId: '33333333-3333-3333-3333-333333333333' } },
      { toolId: 'export_equalization_package', mode: 'pilot', confirmation: true, reasonCode: 'annual_certification', params: { county, taxYear: 2024, draftVersion: '33333333-3333-3333-3333-333333333333', revision: 'a'.repeat(64), requestId: '44444444-4444-4444-4444-444444444444' } },
      { toolId: 'export_audit_bundle', mode: 'pilot', confirmation: true, reasonCode: 'legal_compliance', params: { county, taxYear: 2024, bundleScope: 'county', requestId: '44444444-4444-4444-4444-444444444444' } },
    ];
    const initialTrace = await (await fetch(base + `/pilot/trace?countyId=${county}`)).json();
    for (const request of cases) {
      const invalids = [
        { ...request.params, sourceRecords: ['synthetic-do-not-trace'] },
        { ...request.params, sourcePrivacy: 'none' },
        { ...request.params, taxYear: '2024' },
        { ...request.params, taxYear: 2024.5 },
        ...(request.params.requestId ? [{ ...request.params, requestId: '00000000-0000-0000-0000-000000000000' }] : []),
      ];
      for (const params of invalids) {
        const validation = await post('/pilot/validate', { ...request, params });
        assert.equal(validation.valid, false, `${request.toolId} must reject malformed input at validation ingress`);
        assert.ok(validation.violations.some(value => value.includes('PARAMS_SCHEMA_INVALID')));
        const invocation = await post('/pilot/invoke', { ...request, params });
        assert.equal(invocation.ok, false);
        assert.equal(invocation.errorCode, 'PARAMS_SCHEMA_INVALID');
        assert.equal(invocation.metrics.operation, request.toolId);
        assert.equal(invocation.metrics.ok, false);
        assert.equal(invocation.metrics.errorCode, 'PARAMS_SCHEMA_INVALID');
        assert.equal(invocation.result, null);
        assert.equal(dispatches, 0, 'invalid input must never dispatch to backend');
      }
    }
    assert.deepEqual(await (await fetch(base + `/pilot/trace?countyId=${county}`)).json(), initialTrace, 'invalid input must not enter invocation tracing');
    assert.equal(logs.includes('synthetic-do-not-trace'), false);
    for (const request of cases) {
      const validation = await post('/pilot/validate', request);
      assert.equal(validation.valid, true, JSON.stringify({ toolId: request.toolId, validation }));
      const invocation = await post('/pilot/invoke', request);
      assert.equal(invocation.ok, true, JSON.stringify({ toolId: request.toolId, invocation }));
      assert.equal(invocation.correlationId, 'tf-controlled-live-ingress');
      assert.equal(invocation.metrics.operation, request.toolId);
      assert.equal(invocation.metrics.ok, true);
      assert.ok(Number.isFinite(invocation.metrics.durationMs) && invocation.metrics.durationMs >= 0);
    }
    assert.equal(dispatches, 4, 'valid schemas must still reach the four actual registered adapters');
    assert.deepEqual(downstreamCids, Array(4).fill('tf-controlled-live-ingress'));
    for (const deniedRoles of [undefined, 'Developer', 'GovernmentUser', 'Developer,Assessor,GovernmentUser', 'Developer,Treasurer']) {
      roleHeader = deniedRoles;
      assert.equal((await post('/pilot/validate', cases[0])).valid, false, 'bearer without assessor role is not an appraiser');
      assert.equal((await post('/pilot/invoke', cases[0])).ok, false);
      assert.equal(dispatches, 4);
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Owned Pilot cleanup timed out.')), 5000);
        child.once('exit', () => { clearTimeout(timer); resolve(); });
        child.kill();
      });
    }
    await new Promise(resolve => backend.close(resolve));
  }
});

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

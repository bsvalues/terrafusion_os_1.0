// Regression continuation of the two recorded RED diagnostics. Exercise the
// registered real path, never enable demonstration handlers to turn this green.
// The controlled 404 responder proves failure propagation, not DB acceptance.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createServer } from 'node:http';

const require = createRequire(import.meta.url);
const canned = require('../../../../os-platform/core/pilot/handlers.js');
const real = require('../../../../os-platform/core/pilot/handlers.real.js');
const { bindCountyWorkflowAuthorization } = require('../../../../os-platform/core/pilot/countyWorkflowHandlers.js');

function realEqualization() {
  const registrations = new Map();
  real.registerR1Handlers({ registerHandler: (id, handler) => registrations.set(id, handler) }, {});
  return registrations.get('export_equalization_package');
}

const county = '11111111-1111-1111-1111-111111111111';
const params = {
  county, taxYear: 2026,
  draftVersion: '33333333-3333-3333-3333-333333333333',
  revision: 'a'.repeat(64), requestId: '44444444-4444-4444-4444-444444444444',
};
function context(countyId = county) {
  const result = { countyId, userId: 'controlled-operator', roles: ['assessor'], mode: 'pilot', confirmation: true, reasonCode: 'annual_certification' };
  bindCountyWorkflowAuthorization(result, 'Bearer controlled-diagnostic-token');
  return result;
}

test('development registration supplies the four requested workflow handlers', () => {
  // Same registration functions and order as getCompareRunner in
  // dev-pilot-runtime.mjs, including the backend-enabled branch.
  const registrations = new Map();
  const registrar = { registerHandler: (id, handler) => registrations.set(id, handler) };
  canned.registerPhase84Handlers(registrar);
  real.registerR1Handlers(registrar, {});
  const requested = [
    'generate_morning_brief', 'open_appeal_packet',
    'export_equalization_package', 'export_audit_bundle',
  ];
  assert.deepEqual(requested.filter(id => !registrations.has(id)), []);
});

test('equalization rejects a nonexistent persisted draft rather than returning an artifact count', async () => {
  let requests = 0;
  const server = createServer((req, res) => {
    requests++;
    assert.equal(req.url, '/api/dossier/workflows/exports/equalization');
    req.resume();
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Draft not found' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.TF_API_BASE_URL;
  process.env.TF_API_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(() => realEqualization()(params, context(), {}), /404/);
    assert.equal(requests, 1, 'the registered handler must resolve the draft through the backend');
  } finally {
    if (previous === undefined) delete process.env.TF_API_BASE_URL; else process.env.TF_API_BASE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('the existing equalization county mismatch check remains enforced', async () => {
  await assert.rejects(() => realEqualization()(params,
    context('22222222-2222-2222-2222-222222222222'), {}), /County context mismatch/);
});

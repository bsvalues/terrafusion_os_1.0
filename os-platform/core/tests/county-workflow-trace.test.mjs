import assert from 'node:assert/strict';
import { test } from 'node:test';
import { traceService } from '../trace/TraceService.js';
import { createCountyWorkflowTrace } from '../pilot/countyWorkflowTrace.mjs';
import { createHmac, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const COUNTY = '11111111-1111-1111-1111-111111111111';
const FOREIGN = '22222222-2222-2222-2222-222222222222';
const NAME_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const TOOL_IDS = [
  'generate_morning_brief', 'open_appeal_packet',
  'export_equalization_package', 'export_audit_bundle',
];

// HTTP boundary double, NOT proof of ASP.NET JWT validation. The adapter must
// cross HTTP and receive validation before trusting even a well-formed JWT.
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'county-workflow-trace-'));
  const secret = randomBytes(32);
  const priorBase = process.env.TF_API_BASE_URL;
  const requests = [];
  const response = {};
  const server = createServer((req, res) => {
    requests.push({ url: req.url, headers: req.headers });
    if (response.redirect) {
      res.writeHead(302, { Location: response.redirect }); res.end(); return;
    }
    let status = 401;
    let body = {};
    try {
      const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
      const [header, payload, signature] = token.split('.');
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
      const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
      if (signature === expected && claims.exp > Date.now() / 1000) {
        const url = new URL(req.url, 'http://localhost');
        const actor = claims[NAME_ID] ?? claims.sub ?? claims.nameid;
        status = req.method === 'GET' && url.pathname === '/api/dossier/workflows/context' &&
          url.searchParams.size === 1 && url.searchParams.get('county') === claims.countyId &&
          typeof actor === 'string' && actor.trim() &&
          claims.perm?.includes('read:dossier') && claims.perm?.includes('read:dais') ? 200 : 403;
        body = { countyId: claims.countyId, taxYears: [], studies: [], drafts: [], exports: [] };
      }
    } catch { /* Invalid credentials are denied by this boundary responder. */ }
    res.writeHead(response.status ?? status, { 'Content-Type': 'application/json' });
    res.end(response.raw ?? JSON.stringify(response.body ?? body));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.TF_API_BASE_URL = base;
  t.after(async () => {
    if (priorBase === undefined) delete process.env.TF_API_BASE_URL;
    else process.env.TF_API_BASE_URL = priorBase;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    // Only the unique directory allocated by this test is removed.
    await rm(root, { recursive: true, force: true });
  });
  const jwt = (overrides = {}, signingSecret = secret) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: 'alice', countyId: COUNTY, roles: [], perm: ['read:dossier', 'read:dais'],
      exp: Math.floor(Date.now() / 1000) + 60, ...overrides,
    })).toString('base64url');
    return `${header}.${payload}.${createHmac('sha256', signingSecret).update(`${header}.${payload}`).digest('base64url')}`;
  };
  return {
    root, path: join(root, 'trace.jsonl'), requests, response, base, jwt,
    req: (claims = {}, headers = {}) => ({ headers: { authorization: `Bearer ${jwt(claims)}`, ...headers } }),
  };
}

function emit(trace, overrides = {}) {
  return trace.service.emit({
    type: 'tool_completed', toolId: 'generate_morning_brief', correlationId: 'tf-real-cid',
    context: { countyId: COUNTY, userId: 'alice', mode: 'muse', parcelId: 'PRIVATE-PARCEL' },
    summary: 'PRIVATE-SUMMARY', payloadRef: 'PRIVATE-REF', payload: { secret: 'PRIVATE-PAYLOAD' },
    sources: ['PRIVATE-SOURCE'], ...overrides,
  });
}

test('without an explicit file path, preserves the legacy service and refuses durable queries', async () => {
  const adapter = await import('../pilot/countyWorkflowTrace.mjs').catch(error => {
    assert.fail(`County workflow trace adapter is required: ${error.code}`);
  });
  const trace = adapter.createCountyWorkflowTrace();
  assert.equal(trace.service, traceService);
  assert.equal((await trace.queryAuthenticated({ headers: {} })).status, 503);
  await assert.rejects(trace.flush(), { status: 503 });
});

test('real FileTraceStore restart preserves original event identity with metadata only', async t => {
  const f = await fixture(t);
  const first = createCountyWorkflowTrace(f.path);
  const events = TOOL_IDS.map((toolId, index) => emit(first, {
    toolId, type: ['tool_invoked', 'tool_completed', 'tool_failed', 'tool_completed'][index],
  }));
  emit(first, { toolId: 'search_parcels', correlationId: 'non-workflow' });
  await first.flush();
  const disk = await readFile(f.path, 'utf8');
  assert.doesNotMatch(disk, /PRIVATE-|search_parcels|payloadRef|sources|summary/);
  assert.equal(disk.trim().split('\n').length, 4);
  const restarted = createCountyWorkflowTrace(f.path);
  assert.notEqual(restarted.service, first.service);
  const result = await restarted.queryAuthenticated(f.req(), 'tf-real-cid');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.events.map(e => [e.eventId, e.timestamp, e.type, e.correlationId]),
    events.map(e => [e.eventId, e.timestamp, e.type, e.correlationId]));
  for (const event of result.body.events) {
    assert.deepEqual(Object.keys(event).sort(),
      ['context', 'correlationId', 'eventId', 'schemaVersion', 'timestamp', 'toolId', 'type']);
    assert.deepEqual(event.context, { countyId: COUNTY, userId: 'alice', mode: 'muse' });
  }
  assert.equal(f.requests[0].url, `/api/dossier/workflows/context?county=${COUNTY}`);
  assert.deepEqual((await restarted.queryAuthenticated(f.req(), 'non-workflow')).body.events, []);
});

test('retains shared payload-reference emit semantics but never persists or returns references', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  const event = trace.service.emitWithPiiHandling({
    toolId: 'open_appeal_packet', type: 'tool_completed', correlationId: 'tf-payload',
    context: { countyId: COUNTY, userId: 'alice', mode: 'pilot' }, summary: 'PRIVATE-SUMMARY',
  }, 'payload_ref', { secret: 'PRIVATE-RAW' }, 'dossier');
  assert.ok(event.payloadRef);
  await trace.flush();
  const result = await trace.queryAuthenticated(f.req(), 'tf-payload');
  assert.equal(result.status, 200);
  assert.equal(result.body.events[0].eventId, event.eventId);
  assert.doesNotMatch(await readFile(f.path, 'utf8'), /PRIVATE-|payloadRef|payloadStore/);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE-|payloadRef|payloadStore/);
});

test('list and CID reads enforce county plus actor policy despite spoofed identity headers', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  const own = emit(trace);
  emit(trace, { context: { countyId: COUNTY, userId: 'bob' } });
  emit(trace, { context: { countyId: FOREIGN, userId: 'alice' } });
  await trace.flush();
  const spoofed = f.req({}, { 'x-user-id': 'bob', 'x-county-id': FOREIGN, 'x-roles': 'admin' });
  for (const cid of [undefined, 'tf-real-cid']) {
    const result = await trace.queryAuthenticated(spoofed, cid);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.events.map(e => e.eventId), [own.eventId]);
  }
  assert.equal(f.requests[0].headers['x-user-id'], undefined);
  assert.equal(f.requests[0].headers['x-county-id'], undefined);
  const absent = await trace.queryAuthenticated(f.req({ sub: 'nobody' }), 'missing');
  const denied = await trace.queryAuthenticated(f.req({ sub: 'nobody' }), 'tf-real-cid');
  assert.deepEqual(denied, absent);
});

test('validated elevated roles grant same-county visibility only, including mapped JWT claims', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  const own = emit(trace);
  const other = emit(trace, { context: { countyId: COUNTY, userId: 'bob' } });
  emit(trace, { context: { countyId: FOREIGN, userId: 'bob' } });
  await trace.flush();
  for (const claims of [{ role: 'auditor' }, { roles: ['ADMIN'] }, { [ROLE]: 'supervisor' }]) {
    const result = await trace.queryAuthenticated(f.req(claims), 'tf-real-cid');
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.events.map(e => e.eventId), [own.eventId, other.eventId]);
  }
  const mapped = await trace.queryAuthenticated(f.req({ sub: undefined, [NAME_ID]: 'bob' }));
  assert.equal(mapped.status, 200);
  assert.deepEqual(mapped.body.events.map(e => e.eventId), [other.eventId]);
});

test('filters before the list limit so foreign or other-actor traffic cannot hide visible events', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  const own = emit(trace, { correlationId: 'z-visible' });
  for (let i = 0; i < 105; i++) emit(trace, {
    correlationId: `a-hidden-${i}`, context: { countyId: FOREIGN, userId: 'other' },
  });
  await trace.flush();
  const result = await trace.queryAuthenticated(f.req());
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.events.map(e => e.eventId), [own.eventId]);
});

test('missing, malformed, array, and identity-less credentials fail closed without backend or disk access', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  const requests = [
    {}, { headers: { 'x-user-id': 'alice', 'x-county-id': COUNTY } },
    { headers: { authorization: 'Basic abc' } }, { headers: { authorization: 'Bearer invalid' } },
    { headers: { authorization: [`Bearer ${f.jwt()}`] } },
    f.req({ countyId: undefined }), f.req({ countyId: [COUNTY] }),
    f.req({ countyId: '00000000-0000-0000-0000-000000000000' }),
    f.req({ sub: undefined }), f.req({ sub: ' ' }),
  ];
  for (const req of requests) assert.equal((await trace.queryAuthenticated(req)).status, 401);
  assert.equal(f.requests.length, 0);
  await assert.rejects(readFile(f.path), { code: 'ENOENT' });
});

test('parseable forged or expired JWTs and insufficient permissions are denied by HTTP validation', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  emit(trace); await trace.flush();
  for (const [token, status] of [
    [f.jwt({}, randomBytes(32)), 401], [f.jwt({ exp: 1 }), 401], [f.jwt({ perm: ['read:dossier'] }), 403],
  ]) {
    const result = await trace.queryAuthenticated({ headers: { authorization: `Bearer ${token}` } });
    assert.equal(result.status, status);
    assert.equal(result.body.events, undefined);
    assert.doesNotMatch(JSON.stringify(result), /alice|tf-real-cid/);
  }
  assert.equal(f.requests.length, 3);
});

test('backend failures, malformed success, and county mismatch never become clean empty results', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  assert.equal((await trace.queryAuthenticated(f.req())).status, 200);
  for (const status of [500, 503]) {
    f.response.status = status;
    assert.equal((await trace.queryAuthenticated(f.req())).status, 503);
  }
  f.response.status = 200;
  for (const body of [{}, { countyId: FOREIGN }]) {
    f.response.body = body;
    assert.equal((await trace.queryAuthenticated(f.req())).status, 503);
  }
  f.response.raw = 'not-json';
  assert.equal((await trace.queryAuthenticated(f.req())).status, 503);
});

test('caller bearer validation rejects non-loopback-shaped URLs, credentials, paths, queries and fragments', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  assert.equal((await trace.queryAuthenticated(f.req())).status, 200);
  const before = f.requests.length;
  for (const base of [
    'ftp://127.0.0.1', 'not-a-url', 'http://backend.invalid',
    f.base.replace('127.0.0.1', 'localhost.evil.invalid'),
    f.base.replace('http://', 'http://user:pass@'),
    `${f.base}/nested`, `${f.base}?scope=all`, `${f.base}#fragment`,
  ]) {
    process.env.TF_API_BASE_URL = base;
    assert.equal((await trace.queryAuthenticated(f.req())).status, 503, base);
  }
  assert.equal(f.requests.length, before, 'disallowed destinations must not receive bearer requests');
});

test('caller bearer validation refuses redirects even to another loopback endpoint', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  assert.equal((await trace.queryAuthenticated(f.req())).status, 200);
  const received = [];
  const destination = createServer((req, res) => {
    received.push(req.headers);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ countyId: COUNTY }));
  });
  await new Promise(resolve => destination.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    destination.closeAllConnections();
    await new Promise(resolve => destination.close(resolve));
  });
  f.response.redirect = `http://127.0.0.1:${destination.address().port}/redirected`;
  assert.equal((await trace.queryAuthenticated(f.req())).status, 503);
  assert.equal(received.length, 0);
});

test('append failure is observable through flush and remains 503 on subsequent authenticated reads', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  emit(trace); await trace.flush();
  await rm(f.path);
  await mkdir(f.path); // A real filesystem append failure, not a mocked store.
  emit(trace, { type: 'tool_failed' });
  await assert.rejects(trace.flush(), { status: 503 });
  for (let i = 0; i < 2; i++) {
    const result = await trace.queryAuthenticated(f.req());
    assert.equal(result.status, 503);
    assert.equal(result.body.events, undefined);
    assert.ok(!JSON.stringify(result).includes(f.root));
  }
});

test('cold read failures and corrupt persisted lines stay unavailable rather than silently clean', async t => {
  const f = await fixture(t);
  assert.equal((await createCountyWorkflowTrace(f.path).queryAuthenticated(f.req())).status, 200);
  for (const mode of ['directory', 'malformed-json', 'malformed-event']) {
    const path = join(f.root, mode);
    if (mode === 'directory') await mkdir(path);
    else await writeFile(path, mode === 'malformed-json' ? '{broken\n' : '{}\n');
    for (const cid of ['tf-real-cid', undefined]) {
      const trace = createCountyWorkflowTrace(path);
      for (let i = 0; i < 2; i++) assert.equal((await trace.queryAuthenticated(f.req(), cid)).status, 503, mode);
    }
  }
});

test('pre-existing non-workflow rows and legacy private fields cannot leak through queries', async t => {
  const f = await fixture(t);
  const first = createCountyWorkflowTrace(f.path);
  const event = emit(first); await first.flush();
  await writeFile(f.path, [event, { ...event, toolId: 'search_parcels', eventId: 'other' }]
    .map(e => JSON.stringify(e)).join('\n') + '\n');
  const trace = createCountyWorkflowTrace(f.path);
  const result = await trace.queryAuthenticated(f.req());
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.events.map(e => e.eventId), [event.eventId]);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE-|search_parcels|payloadRef|summary|sources/);
});

test('authenticate works in both modes and ignores forged identity headers without appending events', async t => {
  const f = await fixture(t);
  const req = f.req({ roles: ['Assessor', 'appraiser'] }, {
    'x-user-id': 'bob', 'x-county-id': FOREIGN, 'x-role': 'admin', 'x-roles': 'supervisor',
  });
  const originalHeaders = { ...req.headers };
  for (const path of [undefined, f.path]) {
    const trace = createCountyWorkflowTrace(path);
    assert.equal(typeof trace.authenticate, 'function', 'authentication must be available before runner execution');
    const before = trace.service.getEventCount();
    assert.deepEqual(await trace.authenticate(req), {
      status: 200, principal: { countyId: COUNTY, userId: 'alice', roles: ['Assessor', 'appraiser'] },
    });
    assert.equal(trace.service.getEventCount(), before);
    assert.deepEqual(req.headers, originalHeaders, 'the helper must not mutate caller headers');
    await assert.rejects(readFile(f.path), { code: 'ENOENT' });
  }
  assert.equal(f.requests.length, 2, 'both modes must cross the real HTTP validation boundary');
  for (const request of f.requests) {
    assert.equal(request.url, `/api/dossier/workflows/context?county=${COUNTY}`);
    assert.equal(request.headers['x-user-id'], undefined);
    assert.equal(request.headers['x-role'], undefined);
  }
});

test('authenticate denies invalid JWTs and missing permissions in both modes without creating a trace file', async t => {
  const f = await fixture(t);
  for (const path of [undefined, f.path]) {
    const trace = createCountyWorkflowTrace(path);
    assert.equal(typeof trace.authenticate, 'function', 'authenticate must reject before trace emission');
    const before = trace.service.getEventCount();
    for (const [req, status] of [
      [{ headers: { 'x-user-id': 'alice', 'x-county-id': COUNTY, 'x-role': 'admin' } }, 401],
      [{ headers: { authorization: 'Bearer malformed' } }, 401],
      [{ headers: { authorization: `Bearer ${f.jwt({}, randomBytes(32))}` } }, 401],
      [f.req({ exp: 1 }), 401], [f.req({ perm: ['read:dossier'] }), 403],
      [f.req({ [NAME_ID]: 'bob' }), 401],
    ]) {
      const result = await trace.authenticate(req);
      assert.equal(result.status, status);
      assert.equal(result.principal, undefined);
      assert.equal(typeof result.body.error, 'string');
    }
    assert.equal(trace.service.getEventCount(), before);
    await assert.rejects(readFile(f.path), { code: 'ENOENT' });
  }
  assert.equal(f.requests.length, 6, 'forged, expired, and under-permissioned JWTs must reach validation in both modes');
});

test('authenticate uses backend validation on every call and never changes existing persisted events', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  assert.equal(typeof trace.authenticate, 'function', 'authentication is independent of storage');
  emit(trace); await trace.flush();
  const beforeDisk = await readFile(f.path, 'utf8');
  const beforeCount = trace.service.getEventCount();
  const req = f.req();
  assert.equal((await trace.authenticate(req)).status, 200);
  for (const status of [401, 403, 503]) {
    f.response.status = status;
    const result = await trace.authenticate(req);
    assert.equal(result.status, status);
    assert.equal(result.principal, undefined);
    assert.equal((await trace.queryAuthenticated(req)).status, status);
  }
  assert.equal(f.requests.length, 7);
  assert.equal(await readFile(f.path, 'utf8'), beforeDisk);
  assert.equal(trace.service.getEventCount(), beforeCount);
});

test('actual issuer-shaped nameid and role-array fixture authenticates in both modes and reads its own trace', async t => {
  const f = await fixture(t);
  // Mirrors JwtSecurityTokenHandler outbound claim names, not a live credential.
  const req = f.req({
    sub: undefined, nameid: 'dev-user-001', roles: undefined,
    role: ['Developer', 'Assessor', 'GovernmentUser', 'appraiser'],
  }, { 'x-user-id': 'forged-actor', 'x-county-id': FOREIGN, 'x-role': 'admin' });
  for (const path of [undefined, f.path]) {
    const trace = createCountyWorkflowTrace(path);
    assert.deepEqual(await trace.authenticate(req), {
      status: 200, principal: { countyId: COUNTY, userId: 'dev-user-001',
        roles: ['Developer', 'Assessor', 'GovernmentUser', 'appraiser'] },
    });
    await assert.rejects(readFile(f.path), { code: 'ENOENT' });
  }
  const trace = createCountyWorkflowTrace(f.path);
  const event = emit(trace, { context: { countyId: COUNTY, userId: 'dev-user-001', mode: 'muse' } });
  await trace.flush();
  const result = await trace.queryAuthenticated(req, 'tf-real-cid');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.events.map(e => e.eventId), [event.eventId]);
  assert.equal(f.requests.length, 3, 'issuer-shaped identity must still pass backend validation each time');
});

test('nameid, sub and URI subject aliases must agree; equal aliases remain valid', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  const aliases = ['nameid', 'sub', NAME_ID];
  for (let mask = 1; mask < 8; mask++) {
    const claims = { sub: undefined };
    aliases.forEach((key, index) => { if (mask & (1 << index)) claims[key] = 'alice'; });
    assert.deepEqual(await trace.authenticate(f.req(claims)), {
      status: 200, principal: { countyId: COUNTY, userId: 'alice', roles: [] },
    });
  }
  const before = f.requests.length;
  for (const first of aliases) {
    for (const second of aliases.filter(key => key !== first)) {
      const result = await trace.authenticate(f.req({ sub: undefined, [first]: 'alice', [second]: 'bob' }));
      assert.equal(result.status, 401, `${first} conflicts with ${second}`);
      assert.equal(result.principal, undefined);
    }
  }
  assert.equal(f.requests.length, before, 'contradictory subjects are rejected before backend dispatch');
  await assert.rejects(readFile(f.path), { code: 'ENOENT' });
});

test('a malformed supplied subject alias cannot be ignored in favor of another valid alias', async t => {
  const f = await fixture(t);
  const trace = createCountyWorkflowTrace(f.path);
  for (const key of ['nameid', 'sub', NAME_ID]) {
    for (const invalid of [null, '', ' ', 42, true, ['alice'], {}, 'a'.repeat(201)]) {
      const result = await trace.authenticate(f.req({ nameid: 'alice', sub: 'alice', [NAME_ID]: 'alice', [key]: invalid }));
      assert.equal(result.status, 401, `invalid ${key}`);
      assert.equal(result.principal, undefined);
    }
  }
  assert.equal(f.requests.length, 0);
  await assert.rejects(readFile(f.path), { code: 'ENOENT' });
});

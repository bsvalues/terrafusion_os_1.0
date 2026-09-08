import { expect, test, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baseURL = 'http://127.0.0.1:5191';
const county = '11111111-1111-4111-8111-111111111111';
const packetId = '22222222-2222-4222-8222-222222222222';
const incompleteId = '33333333-3333-4333-8333-333333333333';
const documentId = '44444444-4444-4444-8444-444444444444';
const parcel = 'SYNTHETIC-DOSSIER';
const run = resolve(root, '.tmp/dossier-packet-browser', 'run-' + randomUUID().replaceAll('-', ''));
const database = resolve(run, 'packet.db');
const apiDll = resolve(root, 'backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll');
const fixtureDll = resolve(
  root,
  'backend/tests/TerraFusion.Unit.Tests/bin/Debug/net8.0/TerraFusion.Unit.Tests.dll'
);
const uiIndex = resolve(root, 'native-shell/ui/dist/index.html');
const stageManifest = resolve(root, '.terrafusion/runtime/dossier/packet-workflow/manifest.json');
const dotnet =
  process.env.DOSSIER_BROWSER_DOTNET ??
  (process.platform === 'win32' ? 'C:/Program Files/dotnet/dotnet.exe' : 'dotnet');
const signingKey = randomBytes(64).toString('hex');
const children = new Set<ChildProcess>();
let api: ChildProcess | undefined;
let token = '';
let osCommit = '';
const actionEvidence: Array<{
  cid: string;
  operation: string;
  environment: string;
  outcome: string;
  httpStatus: number;
  durationMs: number;
  errorCode: string | null;
  responseBody: 'parsed' | 'not-read-status-first-conflict';
}> = [];
const serviceEvidence: Array<Record<string, string | number>> = [];
function collectServiceEvidence(line: string) {
  // Read actual JSON ILogger output only. No raw log, body, headers, narrative or evidence export.
  let entry: { Category?: string; State?: Record<string, unknown> };
  try {
    entry = JSON.parse(line);
  } catch {
    return;
  }
  if (
    entry.Category !== 'TerraFusion.API.Controllers.DossierPacketWorkflowController' ||
    !entry.State
  )
    return;
  const state = entry.State;
  if (
    typeof state.CorrelationId !== 'string' ||
    !/^[A-Za-z0-9._-]{1,128}$/.test(state.CorrelationId) ||
    typeof state.Operation !== 'string' ||
    !['finalize', 'prepare', 'narrative', 'revise'].includes(state.Operation) ||
    !['success', 'failure'].includes(String(state.Outcome)) ||
    typeof state.ElapsedMs !== 'number' ||
    !Number.isFinite(state.ElapsedMs) ||
    state.ElapsedMs < 0
  )
    return;
  const safe: Record<string, string | number> = {
    source: 'actual-service-ILogger',
    cid: state.CorrelationId,
    operation: state.Operation,
    outcome: String(state.Outcome),
    durationMs: state.ElapsedMs,
  };
  for (const key of ['ActorId', 'Environment', 'ErrorCategory', 'CanonicalOutcome'])
    if (typeof state[key] === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(state[key]))
      safe[key] = state[key];
  if (typeof state.CanonicalElapsedMs === 'number' && Number.isFinite(state.CanonicalElapsedMs))
    safe.CanonicalElapsedMs = state.CanonicalElapsedMs;
  if (serviceEvidence.length < 100) serviceEvidence.push(safe);
}
const sha = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');

function ownedPath(path: string) {
  for (let current = path; ; current = dirname(current)) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error('Reparse acceptance paths are refused.');
    if (dirname(current) === current) break;
  }
}
function environment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};
  // One canonical PATH key; never inherit provider/production connection strings or NODE_OPTIONS.
  const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
  result[pathKey] = process.env.Path ?? process.env.PATH;
  for (const key of [
    'SystemRoot',
    'WINDIR',
    'ComSpec',
    'PATHEXT',
    'USERPROFILE',
    'HOME',
    'DOTNET_ROOT',
  ])
    if (process.env[key]) result[key] = process.env[key];
  return {
    ...result,
    TEMP: run,
    TMP: run,
    DOTNET_NOLOGO: '1',
    MSBUILDDISABLENODEREUSE: '1',
    UseSharedCompilation: 'false',
    ...extra,
  };
}
function redacted(value: string) {
  return value
    .replaceAll(signingKey, '[redacted signing key]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted bearer]')
    .replace(/Authorization[^\r\n]*/gi, 'Authorization [redacted]');
}
function launch(
  executable: string,
  args: string[],
  env = environment(),
  cwd = root,
  serviceLogs = false
) {
  const child = spawn(executable, args, {
    cwd,
    env,
    windowsHide: true,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  let output = '';
  const collect = (chunk: Buffer) => {
    output = (output + chunk.toString('utf8')).slice(-12_000);
  };
  child.stdout?.on('data', collect);
  child.stderr?.on('data', collect);
  if (serviceLogs)
    for (const stream of [child.stdout, child.stderr]) {
      let pending = '';
      stream?.on('data', (chunk: Buffer) => {
        pending += chunk.toString('utf8');
        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? '';
        for (const line of lines) collectServiceEvidence(line);
        if (pending.length > 64_000) pending = ''; // Refuse an oversized non-structured log line.
      });
    }
  let error: Error | undefined;
  child.on('error', value => {
    error = value;
  });
  return { child, output: () => redacted(output), error: () => error };
}
async function exited(child: ChildProcess, timeout: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise(resolveDone => {
    const finish = (value: boolean) => {
      clearTimeout(timer);
      child.off('exit', done);
      child.off('error', failed);
      resolveDone(value);
    };
    const done = () => finish(true);
    const failed = () => finish(false);
    const timer = setTimeout(() => finish(false), timeout);
    child.once('exit', done);
    child.once('error', failed);
  });
}
async function stop(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) {
    if (child) children.delete(child);
    return;
  }
  if (!children.has(child))
    throw new Error('Refusing to stop a process not launched by this harness.');
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      env: environment(),
      stdio: 'ignore',
    });
    const done = await exited(killer, 10_000);
    // This helper is also our own child. Bound it without touching any unrelated process.
    if (!done && killer.pid && killer.exitCode === null && killer.signalCode === null) {
      killer.kill();
      if (!(await exited(killer, 5000))) throw new Error('Owned shutdown helper did not exit.');
    }
    if (!done && child.exitCode === null && child.signalCode === null)
      throw new Error('Owned API process-tree shutdown failed.');
  } else {
    process.kill(-child.pid, 'SIGTERM');
    if (!(await exited(child, 5000))) process.kill(-child.pid, 'SIGKILL');
  }
  if (!(await exited(child, 10_000))) throw new Error('Owned process did not exit.');
  children.delete(child);
}
async function command(executable: string, args: string[], env = environment(), timeout = 60_000) {
  const running = launch(executable, args, env);
  try {
    if (!(await exited(running.child, timeout)) || running.error() || running.child.exitCode !== 0)
      throw new Error('Owned prerequisite failed: ' + running.output());
    return running.output();
  } finally {
    await stop(running.child);
  }
}
async function fixture(mode: 'seed' | 'verify') {
  const trx = 'fixture-' + mode + '.trx';
  await command(
    dotnet,
    [
      'test',
      'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj',
      '--no-build',
      '--no-restore',
      '--filter',
      'FullyQualifiedName~DossierPacketWorkflowBrowserFixture.PrepareOrVerifyOwnedBrowserDatabase',
      '-m:1',
      '-p:UseSharedCompilation=false',
      '-nodeReuse:false',
      '--logger',
      'trx;LogFileName=' + trx,
      '--results-directory',
      run,
      '--verbosity',
      'quiet',
    ],
    environment({ DOSSIER_BROWSER_DATABASE_PATH: database, DOSSIER_BROWSER_FIXTURE_MODE: mode }),
    90_000
  );
  const text = readFileSync(resolve(run, trx), 'utf8');
  const counters = text.match(/<Counters\s[^>]+>/)?.[0] ?? '';
  for (const [field, value] of [
    ['total', '1'],
    ['executed', '1'],
    ['passed', '1'],
    ['failed', '0'],
    ['notExecuted', '0'],
  ])
    if (!new RegExp('\\b' + field + '="' + value + '"').test(counters))
      throw new Error('Mandatory fixture was not exactly one executed passing test: ' + field);
}
async function startApi(defaultCounty = county) {
  const defaultCountyCode = new Map([
    [county, 'wa-benton'],
    ['99999999-9999-4999-8999-999999999999', 'wa-franklin'],
  ]).get(defaultCounty);
  if (!defaultCountyCode) throw new Error('No canonical code for this isolated fixture county.');
  const running = launch(
    dotnet,
    [apiDll, '--skip-dev-seeders'],
    environment({
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: baseURL,
      DatabaseProvider: 'SQLite',
      ConnectionStrings__DefaultConnection: 'Data Source=' + database,
      ConnectionStrings__LevyDatabase: 'Data Source=' + resolve(run, 'levy.db'),
      TF_SKIP_DEV_SEEDERS: '1',
      TF_DISABLE_DEV_PIPELINE: '1',
      TF_SKIP_DOCTRINE_SEEDERS: '1',
      TF_SKIP_AUTO_MIGRATE: 'true',
      HarrisPACS__BackgroundSync__Enabled: 'false',
      TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC: 'false',
      LegacyArcGisSync__Enabled: 'false',
      TF_ENABLE_LEGACY_ARCGIS_SYNC: 'false',
      TERRAFUSION_UI_DIST_PATH: resolve(root, 'native-shell/ui/dist'),
      DossierMutation__Mode: 'LocalExact',
      DossierEvidenceRegistryRead__Mode: 'LocalExact',
      DossierPacketWorkflow__Mode: 'LocalExact',
      DefaultCounty__Id: defaultCounty,
      DefaultCounty__Code: defaultCountyCode,
      JwtSettings__SecretKey: signingKey,
      PilotRuntime__BaseUrl: 'http://127.0.0.1:1',
      Logging__Console__FormatterName: 'json',
    }),
    resolve(root, 'backend/src/TerraFusion.API'),
    true
  );
  api = running.child;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (running.error() || api.exitCode !== null)
      throw new Error('Actual API failed to start: ' + running.output());
    try {
      const response = await fetch(baseURL + '/api/auth/dev-token', {
        signal: AbortSignal.timeout(1500),
        redirect: 'error',
      });
      if (response.ok) {
        const value = await response.json();
        if (typeof value.token !== 'string')
          throw new Error('Development issuer did not return a token.');
        token = value.token;
        const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        expect(
          claims.countyId === defaultCounty,
          'Real issuer uses the reserved synthetic county'
        ).toBe(true);
        expect(
          claims.countyCode === defaultCountyCode,
          'Real issuer county code matches the registry-consistent fixture identity'
        ).toBe(true);
        return;
      }
    } catch {
      /* Only poll this reserved process; no fallback or replacement handler. */
    }
    await new Promise(resolveDone => setTimeout(resolveDone, 200));
  }
  throw new Error('Actual API readiness timed out: ' + running.output());
}
const query = (year = 2026, selectedParcel = parcel, selectedCounty = county) =>
  new URLSearchParams({
    county: selectedCounty,
    taxYear: String(year),
    parcelId: selectedParcel,
  }).toString();
async function http(
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
  bearer = token
) {
  const response = await fetch(baseURL + path, {
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(35_000),
    headers: {
      ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, text: await response.text() };
}
async function open(page: Page) {
  const started = performance.now();
  const property = await http('/api/properties/parcel/' + encodeURIComponent(parcel));
  const value = property.status === 200 ? JSON.parse(property.text) : null;
  // Keep the actual authenticated feed status/identity, never headers, bearer, or a mock response.
  writeFileSync(
    resolve(run, 'property-feed-read-' + randomUUID() + '.json'),
    JSON.stringify({
      source: 'actual-authenticated-property-feed',
      httpStatus: property.status,
      durationMs: performance.now() - started,
      id: value?.id ?? null,
      countyId: value?.countyId ?? null,
      parcelNumber: value?.parcelNumber ?? null,
      taxYear: value?.taxYear ?? null,
    }),
    { flag: 'wx' }
  );
  expect(property.status, 'Actual canonical PropertyWorkbench prerequisite feed').toBe(200);
  expect(value.countyId).toBe(county);
  expect(value.parcelNumber).toBe(parcel);
  expect(value.taxYear).toBe(2026);
  const contextStarted = performance.now();
  const contextResponse = await http(
    '/api/dossier/workflows/context?' + new URLSearchParams({ county, parcelId: parcel })
  );
  const workflow = contextResponse.status === 200 ? JSON.parse(contextResponse.text) : null;
  writeFileSync(
    resolve(run, 'workflow-context-read-' + randomUUID() + '.json'),
    JSON.stringify({
      source: 'actual-authenticated-workflow-context',
      httpStatus: contextResponse.status,
      durationMs: performance.now() - contextStarted,
      countyId: workflow?.countyId ?? null,
      taxYears: workflow?.taxYears ?? null,
      studyCount: Array.isArray(workflow?.studies) ? workflow.studies.length : null,
    }),
    { flag: 'wx' }
  );
  // Capture every source-backed mounted-screen read before asserting any one result.
  // These POSTs are existing search reads, never workflow mutations. Do not retain
  // response bodies, request headers, narrative/evidence content, or bearer tokens.
  const parcelRead = '/api/dossier/parcels/' + encodeURIComponent(parcel);
  const screenReads: Array<{ path: string; body?: unknown }> = [
    { path: parcelRead + '/details' },
    { path: '/api/dossier/documents/search', body: { parcelId: parcel, limit: 5 } },
    { path: '/api/dossier/evidence/search', body: { parcelId: parcel, limit: 5 } },
    { path: '/api/dossier/stats' },
    { path: parcelRead + '/evidence/registry?limit=25&offset=0' },
    { path: parcelRead + '/documents' },
    { path: parcelRead + '/evidence' },
    { path: parcelRead + '/packets' },
  ];
  const readResults: Array<{
    path: string;
    httpStatus: number | null;
    durationMs: number;
    transportFailed: boolean;
  }> = [];
  for (const read of screenReads) {
    const readStarted = performance.now();
    let status: number | null = null;
    try {
      status = (await http(read.path, read.body)).status;
    } catch {
      // Record the transport failure without retaining potentially sensitive error text.
    }
    readResults.push({
      path: read.path,
      httpStatus: status,
      durationMs: performance.now() - readStarted,
      transportFailed: status === null,
    });
    writeFileSync(
      resolve(run, 'screen-read-' + randomUUID() + '.json'),
      JSON.stringify({
        source: 'actual-authenticated-screen-prerequisite-read',
        ...readResults.at(-1),
      }),
      { flag: 'wx' }
    );
  }
  expect(contextResponse.status, 'Actual persisted workflow context prerequisite').toBe(200);
  for (const result of readResults)
    expect(result.httpStatus, 'Actual mounted-screen prerequisite ' + result.path).toBe(200);
  expect(workflow.countyId).toBe(county);
  expect(workflow.taxYears).toContain(2026);
  expect(workflow.studies.some((study: { taxYear: number }) => study.taxYear === 2026)).toBe(true);
  await page.addInitScript(value => localStorage.setItem('authToken', value), token);
  await page.goto(baseURL + '/property/' + parcel + '/dossier');
  await expect(page.getByRole('region', { name: 'Durable packet workflow' })).toBeVisible();
}
async function clickResponse(
  page: Page,
  operation: string,
  click: () => Promise<unknown>,
  expectedStatus = 200
) {
  const pending = page.waitForResponse(
    response =>
      new URL(response.url()).pathname ===
        '/api/dossier/packet-workflow/packets/' + packetId + '/' + operation &&
      response.request().method() === 'POST'
  );
  const started = performance.now();
  await click();
  const result = await pending;
  const status = result.status();
  expect(status, 'Actual ' + operation + ' API response').toBe(expectedStatus);
  const command = result.request().postDataJSON();
  expect(typeof command.requestId).toBe('string');
  expect(
    await result.headerValue('X-Correlation-ID'),
    'Existing middleware CID follows the actual action'
  ).toBe(command.requestId);
  // The client deliberately cancels 409 bodies to retire eligibility from headers.
  // Do not invent error JSON or make browser evidence depend on a cancelled body.
  // Successful durable receipts must still be parsed and compared below.
  const responseBody = status === 409 ? 'not-read-status-first-conflict' : 'parsed';
  const value = status === 409 ? null : await result.json();
  const durationMs = Math.round((performance.now() - started) * 100) / 100;
  // Allowlist only synthetic operation evidence. Never retain request headers, token or browser traces.
  actionEvidence.push({
    cid: command.requestId,
    operation,
    environment: 'Development',
    outcome: result.ok() ? 'success' : 'failure',
    httpStatus: status,
    durationMs,
    errorCode: typeof value?.code === 'string' ? value.code : null,
    responseBody,
  });
  writeFileSync(
    resolve(run, 'action-' + actionEvidence.length + '.json'),
    JSON.stringify({
      source:
        status === 409
          ? 'actual-browser-click-to-API-response-headers'
          : 'actual-browser-click-to-API-response-body',
      ...actionEvidence.at(-1),
    }),
    { flag: 'wx' }
  );
  expect(command).not.toHaveProperty('provenance');
  expect(command).not.toHaveProperty('effectiveAt');
  expect(command).not.toHaveProperty('finalizationId');
  expect(command).not.toHaveProperty('handoffId');
  return { value, command, responseBody };
}

test.beforeAll(async () => {
  const expectedCommit = process.env.DOSSIER_BROWSER_EXPECTED_OS_COMMIT;
  if (!expectedCommit || !/^[a-f0-9]{40}$/.test(expectedCommit))
    throw new Error('Coordinator-selected exact OS commit is required.');
  if (existsSync(run)) throw new Error('Refusing an existing browser run directory.');
  ownedPath(run);
  mkdirSync(run, { recursive: true });
  osCommit = (await command('git', ['rev-parse', 'HEAD'])).trim();
  if (osCommit !== expectedCommit)
    throw new Error('OS HEAD differs from requested acceptance identity.');
  for (const path of [apiDll, fixtureDll, uiIndex, stageManifest]) {
    if (!existsSync(path))
      throw new Error('Build/stage prerequisites separately before browser acceptance: ' + path);
    ownedPath(path);
  }
  if (
    sha(readFileSync(stageManifest)) !==
    '25f1a91faef5ad1867c058fc57795016ba20fdd090fb596c43255fa637bd159c'
  )
    throw new Error('Protected Dossier staging manifest identity mismatch.');
  for (const slot of ['mutation-decision', 'evidence-registry-read'])
    if (!existsSync(resolve(root, '.terrafusion/runtime/dossier', slot, 'manifest.json')))
      throw new Error('Stage unchanged protected Dossier ' + slot + ' first.');
  // Refuse a foreign listener instead of adopting or stopping it.
  const probe = createServer();
  await new Promise<void>((done, reject) => {
    probe.once('error', reject);
    probe.listen(5191, '127.0.0.1', done);
  });
  await new Promise<void>((done, reject) => probe.close(error => (error ? reject(error) : done())));
  writeFileSync(
    resolve(run, 'identity.json'),
    JSON.stringify({
      osCommit,
      protectedSuiteCommit: '8f58a6b989641a6fde063afa3dda68bd18062c63',
      apiAssemblySha256: sha(readFileSync(apiDll)),
      fixtureAssemblySha256: sha(readFileSync(fixtureDll)),
      builtIndexSha256: sha(readFileSync(uiIndex)),
      specificationManifestSha256: sha(readFileSync(stageManifest)),
      harnessSha256: sha(readFileSync(fileURLToPath(import.meta.url))),
    }),
    { flag: 'wx' }
  );
  await fixture('seed');
  await startApi();
});

test.afterAll(async () => {
  const outcomes = await Promise.allSettled([...children].map(stop));
  if (outcomes.some(result => result.status === 'rejected'))
    throw new Error('Owned acceptance child cleanup did not complete.');
  // Preserve fresh synthetic databases and redacted evidence. No recursive workspace cleanup.
});

test('actual packet narrative, seal and handoff survive reload and restart; stale/scope/revise paths refuse writes', async ({
  page,
}) => {
  // Refuse external browser requests, not substitute their responses. The application/API remain real.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === baseURL || ['data:', 'blob:'].includes(url.protocol)
      ? route.continue()
      : route.abort('blockedbyclient');
  });
  await open(page);
  await page.getByRole('combobox', { name: 'Packet', exact: true }).selectOption(incompleteId);
  await expect(page.getByTestId('finalization-status')).toHaveText('draft');
  await expect(page.getByRole('button', { name: 'Finalize this revision' })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Packet', exact: true }).selectOption(packetId);
  await expect(page.getByRole('textbox', { name: 'Packet narrative' })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Finalize this revision' })).toHaveCount(0);
  await page
    .getByRole('textbox', { name: 'Packet narrative' })
    .fill('Synthetic narrative grounded in the stored appraisal evidence.');
  await clickResponse(page, 'narrative', () =>
    page.getByRole('button', { name: 'Save narrative' }).click()
  );
  const seal = await clickResponse(page, 'finalize', () =>
    page.getByRole('button', { name: 'Finalize this revision' }).click()
  );
  expect(seal.value.status).toBe('sealed');
  expect(seal.value.currentDocuments[0].documentId).toBe(documentId);
  expect(seal.value.provenance.suiteCommit).toBe('8f58a6b989641a6fde063afa3dda68bd18062c63');
  expect(seal.value.provenance.traceId).toBe(seal.command.requestId);
  await expect(page.getByTestId('finalization-status')).toHaveText('sealed');
  await page.screenshot({
    path: test.info().outputPath('synthetic-sealed-packet.png'),
    fullPage: false,
  });
  const prepared = await clickResponse(page, 'prepare', () =>
    page.getByRole('button', { name: 'Prepare appeal handoff' }).click()
  );
  expect(prepared.value.packetRevision).toBe(seal.value.packetRevision);
  expect(prepared.value.finalizationId).toBe(seal.value.finalizationId);
  expect(prepared.value.provenance.traceId).toBe(prepared.command.requestId);
  const link =
    '/property/' +
    parcel +
    '/dais?handoffId=' +
    prepared.value.handoffId +
    '&packetRevision=' +
    seal.value.packetRevision +
    '&taxYear=2026';
  await expect(page.getByRole('link', { name: 'Continue in Dais' })).toHaveAttribute('href', link);
  // Tier1 acceptance must fail if the real UI does not expose the actual persisted receipt CID.
  // No DOM injection or harness-created receipt view is an acceptable substitute.
  await expect(page.getByRole('region', { name: 'Durable packet workflow' })).toContainText(
    prepared.command.requestId
  );
  await page.getByRole('region', { name: 'Handoff receipt', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath('synthetic-prepared-receipt-cid.png'),
    fullPage: false,
  });
  writeFileSync(
    resolve(run, 'observed-receipts.json'),
    JSON.stringify({ seal: seal.value, handoff: prepared.value }),
    { flag: 'wx' }
  );

  // Exact retry uses the actual browser command, not reconstructed authoritative fields.
  const retry = await http(
    '/api/dossier/packet-workflow/packets/' + packetId + '/finalize',
    seal.command
  );
  expect(retry.status).toBe(200);
  expect(JSON.parse(retry.text)).toEqual(seal.value);
  await page.reload();
  await page.getByRole('combobox', { name: 'Packet', exact: true }).selectOption(packetId);
  await expect(page.getByRole('link', { name: 'Continue in Dais' })).toHaveAttribute('href', link);
  await stop(api);
  await startApi();
  await open(page);
  await page.getByRole('combobox', { name: 'Packet', exact: true }).selectOption(packetId);
  await expect(page.getByRole('link', { name: 'Continue in Dais' })).toHaveAttribute('href', link);
  const reopened = await http('/api/dossier/packet-workflow/packets/' + packetId + '?' + query());
  expect(reopened.status).toBe(200);
  expect(JSON.parse(reopened.text).finalization).toEqual(seal.value);
  expect(JSON.parse(reopened.text).handoff).toEqual(prepared.value);
  await page.screenshot({
    path: test.info().outputPath('synthetic-reopened-packet.png'),
    fullPage: false,
  });

  const baseCommand = {
    county,
    taxYear: 2026,
    parcelId: parcel,
    expectedRevision: seal.value.packetRevision,
    requestId: 'browser-negative-' + randomUUID(),
  };
  for (const bad of [
    { ...baseCommand, county: '99999999-9999-4999-8999-999999999999' },
    { ...baseCommand, taxYear: 2025 },
    { ...baseCommand, parcelId: 'OTHER-SYNTHETIC' },
  ]) {
    const result = await http('/api/dossier/packet-workflow/packets/' + packetId + '/prepare', bad);
    expect([403, 404]).toContain(result.status);
  }
  expect(
    (await http('/api/dossier/packet-workflow/packets?' + query(), undefined, 'GET', '')).status
  ).toBe(401);
  const changed = await http(
    '/api/dossier/documents/persistent/' + documentId + '/status',
    { status: 'sealed', reason: 'Synthetic source state change after packet seal' },
    'PATCH'
  );
  expect(changed.status).toBe(200);
  // A real source change races the still-visible sealed revision: API refuses the actual UI action.
  await page
    .getByRole('textbox', { name: 'Revision reason' })
    .fill('Synthetic stale revision attempt');
  const failed = await clickResponse(
    page,
    'revise',
    () => page.getByRole('button', { name: 'Reopen for revision' }).click(),
    409
  );
  expect(failed.value).toBeNull();
  expect(failed.responseBody).toBe('not-read-status-first-conflict');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Durable packet workflow' })).toContainText(
    failed.command.requestId
  );
  // The authoritative conflict retires eligibility immediately, BEFORE a manual reload.
  await expect(page.getByRole('link', { name: 'Continue in Dais' })).toHaveCount(0);
  await expect(
    page.getByText('Prepared handoff ' + prepared.value.handoffId, { exact: true })
  ).toHaveCount(0);
  await expect(page.getByTestId('finalization-status')).toContainText('stale');
  for (const name of [
    'Save narrative',
    'Finalize this revision',
    'Prepare appeal handoff',
    'Reopen for revision',
  ]) {
    const control = page.getByRole('button', { name, exact: true });
    if (await control.count()) await expect(control).toBeDisabled();
  }
  const history = page.getByRole('region', { name: 'Historical receipts (not current)' });
  await expect(history).toContainText(prepared.value.handoffId);
  await expect(history).toContainText(seal.value.finalizationId);
  await expect(history).toContainText(failed.command.requestId);
  await page.getByRole('alert').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: test.info().outputPath('synthetic-failed-action-cid.png'),
    fullPage: false,
  });
  const stale = await http('/api/dossier/packet-workflow/packets/' + packetId + '/prepare', {
    ...baseCommand,
    requestId: 'stale-' + randomUUID(),
  });
  expect(stale.status).toBe(409);
  expect(JSON.parse(stale.text).code).toBe('REVISION_CONFLICT');
  await page.getByRole('button', { name: 'Reload packet' }).click();
  await expect(page.getByTestId('finalization-status')).toHaveText('stale');
  await expect(page.getByRole('link', { name: 'Continue in Dais' })).toHaveCount(0);
  await page
    .getByRole('textbox', { name: 'Revision reason' })
    .fill('Review the changed source evidence');
  await clickResponse(page, 'revise', () =>
    page.getByRole('button', { name: 'Reopen for revision' }).click()
  );
  await expect(page.getByRole('textbox', { name: 'Packet narrative' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Continue in Dais' })).toHaveCount(0);
  const revisionView = await http(
    '/api/dossier/packet-workflow/packets/' + packetId + '?' + query()
  );
  const after = JSON.parse(revisionView.text);
  expect(after.packetStatus).toBe('draft');
  const nonfinalized = await http('/api/dossier/packet-workflow/packets/' + packetId + '/prepare', {
    ...baseCommand,
    expectedRevision: after.revision,
    requestId: 'nonfinalized-' + randomUUID(),
  });
  expect(nonfinalized.status).toBe(409);
  expect(JSON.parse(nonfinalized.text).code).toBe('NONFINALIZED');

  writeFileSync(
    resolve(run, 'expected.json'),
    JSON.stringify({
      seal: seal.value,
      handoff: prepared.value,
      packetRevision: seal.value.packetRevision,
    }),
    { flag: 'wx' }
  );
  await stop(api);
  await fixture('verify');
  const persisted = JSON.parse(readFileSync(resolve(run, 'persisted-evidence.json'), 'utf8'));
  expect(persisted.storedHandoff).toEqual(prepared.value);
  expect(persisted.receiptCount).toBe(4);
  expect(persisted.auditCount).toBe(4);
  for (const receipt of [seal, prepared]) {
    const audit = persisted.serviceAuditEvents.find(
      (event: { cid: string }) => event.cid === receipt.command.requestId
    );
    expect(audit, 'Actual stored service audit is searchable by browser action CID').toBeTruthy();
    expect(audit.result).toBe('committed');
  }
  for (const action of [seal, prepared, failed]) {
    const emitted = serviceEvidence.find(event => event.cid === action.command.requestId);
    expect(emitted, 'Actual service trace/log exists for this UI CID').toBeTruthy();
    expect(emitted!.outcome).toBe(action === failed ? 'failure' : 'success');
    expect(emitted!.ActorId).toBeTruthy();
    if (action !== failed) {
      expect(emitted!.CanonicalOutcome).toBe('accepted');
      expect(Number(emitted!.CanonicalElapsedMs)).toBeGreaterThanOrEqual(0);
    }
  }
  writeFileSync(resolve(run, 'sanitized-service-trace.json'), JSON.stringify(serviceEvidence), {
    flag: 'wx',
  });
  await test.info().attach('sanitized-actual-service-trace', {
    body: JSON.stringify(serviceEvidence),
    contentType: 'application/json',
  });
  await test.info().attach('actual-action-latency-and-outcomes', {
    body: JSON.stringify(actionEvidence),
    contentType: 'application/json',
  });
  await test.info().attach('persisted-dossier-evidence', {
    body: JSON.stringify({ ...persisted, osCommit }),
    contentType: 'application/json',
  });
});

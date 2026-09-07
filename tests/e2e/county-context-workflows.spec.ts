import { expect, test, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// All records are explicitly synthetic. Drafts/exports are created by the UI,
// never seeded. These are real application processes, not replacement handlers.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const county = '11111111-1111-1111-1111-111111111111';
const foreignCounty = '22222222-2222-2222-2222-222222222222';
const appeal = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const parcel = 'SYNTHETIC-WORKFLOW';
const directory = resolve(root, '.tmp/county-context');
const database = resolve(directory, `workflow-${process.pid}-${randomUUID()}.db`);
const tracePath = database.replace(/\.db$/, '-trace.jsonl');
const dotnet = process.env.OS_COUNTY_CONTEXT_DOTNET ?? 'dotnet';
const signingKey = randomBytes(64).toString('hex');
let baseURL: string;
let apiPort: number;
let pilotPort: number;
let api: ChildProcess | undefined;
let pilot: ChildProcess | undefined;
const fixtureProcesses = new Set<ChildProcess>();

function environment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};
  for (const key of [
    'PATH',
    'Path',
    'SystemRoot',
    'WINDIR',
    'ComSpec',
    'PATHEXT',
    'TEMP',
    'TMP',
    'USERPROFILE',
    'HOME',
    'DOTNET_ROOT',
  ]) {
    if (process.env[key]) result[key] = process.env[key];
  }
  return { ...result, DOTNET_NOLOGO: '1', ...extra };
}

async function freePort(): Promise<number> {
  const socket = createServer();
  await new Promise<void>((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const address = socket.address();
  if (!address || typeof address === 'string')
    throw new Error('No isolated loopback port available.');
  await new Promise<void>((resolve, reject) =>
    socket.close(error => (error ? reject(error) : resolve()))
  );
  return address.port;
}

async function run(executable: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  const child = spawn(executable, args, {
    cwd: root,
    env,
    windowsHide: true,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  fixtureProcesses.add(child);
  let output = '';
  child.stdout?.on('data', value => {
    output = (output + value).slice(-12_000);
  });
  child.stderr?.on('data', value => {
    output = (output + value).slice(-12_000);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Controlled fixture exceeded 90 seconds.')),
        90_000
      );
      child.once('error', error => {
        clearTimeout(timer);
        reject(error);
      });
      child.once('exit', code => {
        clearTimeout(timer);
        code === 0
          ? resolve()
          : reject(new Error(`Controlled fixture failed (${code}): ${output}`));
      });
    });
  } finally {
    await stop(child);
    fixtureProcesses.delete(child);
  }
}

async function ready(child: ChildProcess, url: string): Promise<void> {
  let output = '';
  child.stdout?.on('data', value => {
    output = (output + value).slice(-8_000);
  });
  child.stderr?.on('data', value => {
    output = (output + value).slice(-8_000);
  });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Isolated application exited: ${output}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500), redirect: 'error' });
      if (response.ok) return;
    } catch {
      /* Wait only for this owned process's readiness. */
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Isolated application did not become ready: ${output}`);
}

async function stop(child: ChildProcess | undefined): Promise<void> {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const waitForExit = (timeout: number) =>
    new Promise<boolean>(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve(true);
      const done = () => {
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        child.off('exit', done);
        resolve(false);
      }, timeout);
      child.once('exit', done);
    });
  if (process.platform === 'win32') {
    // Exact owned PID and its descendants only, including the testhost spawned by dotnet test.
    await new Promise<void>((resolve, reject) => {
      const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
        env: environment(),
      });
      const timer = setTimeout(() => {
        killer.kill();
        reject(new Error('Owned process-tree shutdown timed out.'));
      }, 10_000);
      killer.once('error', error => {
        clearTimeout(timer);
        reject(error);
      });
      killer.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  } else {
    process.kill(-child.pid, 'SIGTERM');
    if (!(await waitForExit(5_000))) process.kill(-child.pid, 'SIGKILL');
  }
  if (!(await waitForExit(5_000)))
    throw new Error('Owned application did not exit after shutdown.');
}

async function startApi(defaultCounty = county, frontendPort?: number): Promise<void> {
  api = spawn(
    dotnet,
    [
      resolve(root, 'backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll'),
      '--skip-dev-seeders',
    ],
    {
      cwd: resolve(root, 'backend/src/TerraFusion.API'),
      windowsHide: true,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: environment({
        ...(frontendPort === undefined ? {} : { TF_FRONTEND_PORT: String(frontendPort) }),
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: baseURL,
        DatabaseProvider: 'SQLite',
        ConnectionStrings__DefaultConnection: `Data Source=${database}`,
        ConnectionStrings__LevyDatabase: `Data Source=${database.replace(/\.db$/, '-levy.db')}`,
        TF_SKIP_DEV_SEEDERS: '1',
        TF_DISABLE_DEV_PIPELINE: '1',
        TF_SKIP_DOCTRINE_SEEDERS: '1',
        TF_SKIP_AUTO_MIGRATE: 'true',
        HarrisPACS__BackgroundSync__Enabled: 'false',
        TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC: 'false',
        LegacyArcGisSync__Enabled: 'false',
        TF_ENABLE_LEGACY_ARCGIS_SYNC: 'false',
        TERRAFUSION_UI_DIST_PATH: resolve(root, 'native-shell/ui/dist'),
        PilotRuntime__BaseUrl: `http://127.0.0.1:${pilotPort}`,
        DossierMutation__Mode: 'LocalExact',
        DossierEvidenceRegistryRead__Mode: 'LocalExact',
        DefaultCounty__Id: defaultCounty,
        DefaultCounty__Code: 'controlled-workflow',
        JwtSettings__SecretKey: signingKey,
      }),
    }
  );
  await ready(api, `${baseURL}/api/auth/dev-token`);
}

async function devToken(): Promise<string> {
  const response = await fetch(`${baseURL}/api/auth/dev-token`);
  expect(response.status).toBe(200);
  const { token } = await response.json();
  expect(typeof token).toBe('string');
  // Inspect the real issuer response, without logging or synthesizing a credential.
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  expect(claims.roles ?? claims.role).toEqual([
    'Developer',
    'Assessor',
    'GovernmentUser',
    'appraiser',
  ]);
  expect(claims.perm).toContain('read:dais');
  return token;
}

async function startPilot(): Promise<void> {
  pilot = spawn(process.execPath, ['os-platform/core/pilot/dev-pilot-runtime.mjs'], {
    cwd: root,
    windowsHide: true,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: environment({
      TF_PILOT_PORT: String(pilotPort),
      TF_API_BASE_URL: baseURL,
      TF_COUNTY_WORKFLOW_TRACE_PATH: tracePath,
      NODE_ENV: 'development',
    }),
  });
  await ready(pilot, `http://127.0.0.1:${pilotPort}/pilot/health`);
}

async function open(page: Page, path: string, token: string): Promise<void> {
  await page.addInitScript(value => localStorage.setItem('authToken', value), token);
  const contextResponse = page.waitForResponse(
    response => new URL(response.url()).pathname === '/api/dossier/workflows/context'
  );
  await page.goto(`${baseURL}${path}`);
  expect((await contextResponse).status(), 'Actual browser workflow context request').toBe(200);
  await expect(
    page.getByRole('region', { name: 'Persisted workflow context' }).first()
  ).toBeVisible();
}

async function invokeFromUI(
  page: Page,
  toolId: string,
  action: () => Promise<unknown>,
  expectedSuccess = true
) {
  const pending = page.waitForResponse(
    response =>
      response.url() === `${baseURL}/api/pilot/invoke` &&
      response.request().method() === 'POST' &&
      response.request().postDataJSON()?.toolId === toolId
  );
  await action();
  const response = await pending;
  expect(response.status()).toBe(200);
  const headers = await response.request().allHeaders();
  const browserToken = await page.evaluate(() => localStorage.getItem('authToken'));
  // Assert identity without retaining the bearer value in an assertion diff.
  expect(!!browserToken && headers.authorization === `Bearer ${browserToken}`).toBe(true);
  expect(headers['x-county-id']).toBe(county);
  expect(headers['x-role']).toBe('Developer,Assessor,GovernmentUser,appraiser');
  expect(headers['x-office-id']).toBeUndefined();
  expect(!!headers['x-user-id']).toBe(true);
  const envelope = await response.json();
  expect(envelope.ok, envelope.error ?? 'Actual Pilot invocation failed').toBe(expectedSuccess);
  expect(envelope.correlationId).toBe(headers['x-correlation-id']);
  expect(response.headers()['x-correlation-id']).toBe(envelope.correlationId);
  expect(envelope.metrics).toMatchObject({
    operation: toolId,
    correlationId: envelope.correlationId,
    measurement: 'pilot-request-to-response',
    environment: 'development',
    ok: expectedSuccess,
    errorCode: expectedSuccess ? null : envelope.errorCode,
  });
  expect(Number.isFinite(envelope.metrics.durationMs) && envelope.metrics.durationMs >= 0).toBe(
    true
  );
  if (expectedSuccess && toolId.startsWith('export_')) {
    expect(envelope.result.receipt).toMatchObject({
      correlationId: envelope.correlationId,
      operation: toolId,
      countyId: county,
      schemaVersion: '1.0',
    });
  }
  const trace = await request(`/api/pilot/trace/${envelope.correlationId}`, browserToken!);
  expect(trace.status).toBe(200);
  expect(trace.value.events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'tool_invoked',
        toolId,
        correlationId: envelope.correlationId,
      }),
      expect.objectContaining({
        type: expectedSuccess ? 'tool_completed' : 'tool_failed',
        toolId,
        correlationId: envelope.correlationId,
      }),
    ])
  );
  await test.info().attach(`measured-${toolId}-${envelope.correlationId}`, {
    body: JSON.stringify({
      metrics: envelope.metrics,
      trace: trace.value,
      receiptId: envelope.result?.receipt?.receiptId,
    }),
    contentType: 'application/json',
  });
  return {
    output: envelope.result,
    wire: response.request().postDataJSON(),
    correlationId: envelope.correlationId,
  };
}

async function pilotFailureCount(token: string, operation: string) {
  const response = await fetch(`${baseURL}/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'error',
  });
  expect(response.status).toBe(200);
  const lines = (await response.text())
    .split('\n')
    .filter(
      line =>
        line.startsWith('pilot_workflow_errors_total{') &&
        line.includes(`operation="${operation}"`) &&
        line.includes('environment="Development"')
    );
  return lines.reduce((total, line) => total + Number(line.slice(line.lastIndexOf(' ') + 1)), 0);
}

async function request(path: string, token: string, body?: unknown) {
  const response = await fetch(`${baseURL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, text, value: text ? JSON.parse(text) : null };
}

test.beforeAll(async () => {
  test.setTimeout(360_000);
  if (existsSync(database)) throw new Error('Refusing to replace any existing workflow database.');
  if (!existsSync(resolve(root, 'native-shell/ui/dist/index.html')))
    throw new Error('Build the actual OS frontend before acceptance.');
  for (const slot of ['mutation-decision', 'evidence-registry-read']) {
    if (!existsSync(resolve(root, '.terrafusion/runtime/dossier', slot, 'manifest.json')))
      throw new Error(`Stage the existing exact Dossier ${slot} artifact first.`);
  }
  mkdirSync(directory, { recursive: true });
  apiPort = await freePort();
  pilotPort = await freePort();
  if (apiPort === pilotPort) pilotPort = await freePort();
  baseURL = `http://127.0.0.1:${apiPort}`;
  await run(
    dotnet,
    [
      'test',
      'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj',
      '--no-build',
      '--no-restore',
      '--filter',
      'FullyQualifiedName~BootstrapDisposableCountyWorkflowJourney_CreatesControlledRecordsOnlyInFreshDatabase',
      '--verbosity',
      'quiet',
    ],
    environment({ OS_COUNTY_CONTEXT_DATABASE_PATH: database })
  );
  await startPilot();
  await startApi();
});

test.afterAll(async () => {
  const cleanup = await Promise.allSettled([...fixtureProcesses, api, pilot].map(stop));
  const failures = cleanup.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  if (failures.length)
    throw new AggregateError(
      failures.map(result => result.reason),
      'Owned acceptance process cleanup failed.'
    );
  // Preserve the isolated synthetic DB for inspection. Never clean broad paths.
});

test('owner saves, exports, retrieves, retries and reopens exact persisted work after restart', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const token = await devToken();
  // The direct loopback route also derives trace ownership from the validated bearer.
  const directCid = randomUUID();
  const directBody = {
    toolId: 'generate_morning_brief',
    mode: 'muse',
    params: { county, taxYear: 2024, role: 'chief_appraiser' },
  };
  const direct = await fetch(`http://127.0.0.1:${pilotPort}/pilot/invoke`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Correlation-ID': directCid,
      'x-county-id': foreignCounty,
      'x-user-id': 'forged-actor',
      'x-role': 'administrator',
    },
    body: JSON.stringify(directBody),
  });
  if (direct.status !== 200) {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const context = await request(`/api/dossier/workflows/context?county=${county}`, token);
    throw new Error(
      JSON.stringify({
        directStatus: direct.status,
        backendContextStatus: context.status,
        claimShapes: Object.fromEntries(
          Object.entries(claims).map(([key, value]) => [
            key,
            Array.isArray(value) ? 'array' : typeof value,
          ])
        ),
      })
    );
  }
  expect(direct.status).toBe(200);
  expect((await direct.json()).ok).toBe(true);
  const directTrace = await request(`/api/pilot/trace/${directCid}`, token);
  expect(directTrace.status).toBe(200);
  expect(directTrace.value.events).toHaveLength(2);
  expect(
    directTrace.value.events.every(
      (event: { context: { countyId: string; userId: string } }) =>
        event.context.countyId === county && event.context.userId !== 'forged-actor'
    )
  ).toBe(true);
  const traceBeforeUnauthorized = readFileSync(tracePath, 'utf8');
  const unauthorized = await fetch(`http://127.0.0.1:${pilotPort}/pilot/invoke`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer invalid',
      'Content-Type': 'application/json',
      'x-county-id': county,
      'x-user-id': 'forged-actor',
      'x-role': 'administrator',
    },
    body: JSON.stringify(directBody),
  });
  expect(unauthorized.status).toBe(401);
  expect(readFileSync(tracePath, 'utf8')).toBe(traceBeforeUnauthorized);
  // Default CORS admits only configured/current dev frontends, not legacy ports.
  for (const [port, allowed] of [
    [3102, true],
    [5173, true],
    [3000, false],
  ] as const) {
    const origin = `http://localhost:${port}`;
    const preflight = await fetch(`${baseURL}/api/dossier/workflows/context`, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
    });
    expect(preflight.headers.get('access-control-allow-origin')).toBe(allowed ? origin : null);
  }
  // The real legacy command now honors the same configured origin as the API.
  const previewPort = await freePort();
  const previewOrigin = `http://localhost:${previewPort}`;
  const previewEnv = environment({ TF_FRONTEND_PORT: String(previewPort) });
  const previewArgs = [resolve(root, 'scripts/utilities/serve-test-frontend.mjs')];
  const preview = spawn(process.execPath, previewArgs, {
    cwd: root,
    env: previewEnv,
    windowsHide: true,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  fixtureProcesses.add(preview);
  const previewPage = await page.context().newPage();
  try {
    await ready(preview, previewOrigin);
    await expect(run(process.execPath, previewArgs, previewEnv)).rejects.toThrow(/already in use/);
    await stop(api);
    await startApi(county, previewPort);
    await previewPage.goto(previewOrigin);
    const previewResult = await previewPage.evaluate(
      async ({ apiUrl, bearer, countyId }) => {
        const response = await fetch(`${apiUrl}/api/dossier/workflows/context?county=${countyId}`, {
          headers: { Authorization: `Bearer ${bearer}` },
        });
        const body = await response.json();
        return { status: response.status, countyId: body.countyId };
      },
      { apiUrl: baseURL, bearer: token, countyId: county }
    );
    expect(previewResult).toEqual({ status: 200, countyId: county });
  } finally {
    await previewPage.close();
    await stop(preview);
    fixtureProcesses.delete(preview);
    await stop(api);
    await startApi();
  }
  await open(page, '/dossier', token);
  await page.getByRole('combobox', { name: 'Assessment year', exact: true }).selectOption('2024');
  await expect(page.getByRole('combobox', { name: 'Saved draft', exact: true })).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Equalization Package', exact: true })
  ).toBeDisabled();
  const saved = page.waitForResponse(
    response =>
      response.url().endsWith('/api/dossier/workflows/drafts') &&
      response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Save study snapshot', exact: true }).click();
  const savedResponse = await saved;
  expect(savedResponse.status()).toBe(200);
  const draft = await savedResponse.json();
  expect(draft).toMatchObject({ countyId: county, taxYear: 2024 });
  expect(draft.receipt).toMatchObject({
    receiptId: draft.draftId,
    operation: 'assessment_draft.create',
    countyId: county,
    taxYear: 2024,
    correlationId: savedResponse.headers()['x-correlation-id'],
  });
  await expect(page.getByRole('combobox', { name: 'Saved draft', exact: true })).toHaveValue(
    draft.draftId
  );
  await page.getByRole('checkbox', { name: 'Confirm equalization export', exact: true }).check();
  const { output, wire } = await invokeFromUI(page, 'export_equalization_package', () =>
    page.getByRole('button', { name: 'Equalization Package', exact: true }).click()
  );
  expect(output).toMatchObject({
    countyId: county,
    taxYear: 2024,
    draftId: draft.draftId,
    revision: draft.revision,
    status: 'complete',
    certification: false,
  });
  expect(output.artifactCount).toBe(output.artifacts.length);
  expect(output.artifactCount).toBeGreaterThan(0);
  const completed = page.getByRole('region', { name: 'Completed export', exact: true }).last();
  await completed.getByRole('button', { name: 'Inspect output', exact: true }).click();
  await expect(completed.getByLabel('Export JSON', { exact: true })).toContainText(
    'Actual synthetic persisted valuation'
  );
  const content = await request(
    `/api/dossier/workflows/exports/${output.packageRef}/content?county=${county}`,
    token
  );
  expect(content.status).toBe(200);
  expect(createHash('sha256').update(content.text).digest('hex')).toBe(output.contentHash);
  // Actual browser headers are tested above; direct backend retry uses the same persisted request identity.
  const replay = await request('/api/dossier/workflows/exports/equalization', token, {
    county,
    draftId: draft.draftId,
    revision: draft.revision,
    taxYear: 2024,
    requestId: wire.params.requestId,
    confirmed: true,
    reasonCode: wire.reasonCode,
  });
  expect(replay.status).toBe(200);
  expect(replay.value.packageRef).toBe(output.packageRef);
  expect(replay.value.receipt).toEqual(output.receipt);
  const beforeRefusals = await request(
    `/api/dossier/workflows/context?county=${county}&taxYear=2024`,
    token
  );
  expect(beforeRefusals.status).toBe(200);
  for (const invalid of [
    { draftId: randomUUID() },
    { revision: '0'.repeat(64) },
    { taxYear: 2025 },
    { confirmed: false },
    { reasonCode: 'unsupported_reason' },
    { county: foreignCounty },
  ]) {
    const rejected = await request('/api/dossier/workflows/exports/equalization', token, {
      county,
      draftId: draft.draftId,
      revision: draft.revision,
      taxYear: 2024,
      requestId: randomUUID(),
      confirmed: true,
      reasonCode: 'annual_certification',
      ...invalid,
    });
    expect([400, 403, 404, 409, 422]).toContain(rejected.status);
  }
  const afterRefusals = await request(
    `/api/dossier/workflows/context?county=${county}&taxYear=2024`,
    token
  );
  expect(afterRefusals.status).toBe(200);
  expect(afterRefusals.value.exports).toEqual(beforeRefusals.value.exports);
  await stop(api);
  await stop(pilot);
  await startPilot();
  await startApi();
  for (const record of [draft, output]) {
    const evidence = await request(record.receipt.executionEvidence.payloadRef, token);
    expect(evidence.status).toBe(200);
    expect(evidence.value.receipt).toEqual(record.receipt);
    expect(evidence.value.executionEvidence.data.recordId).toBe(record.receipt.receiptId);
  }
  const persistedTrace = await request(`/api/pilot/trace/${output.receipt.correlationId}`, token);
  expect(persistedTrace.status).toBe(200);
  expect(persistedTrace.value.events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'tool_completed',
        correlationId: output.receipt.correlationId,
      }),
    ])
  );
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Saved draft', exact: true })).toHaveValue(
    draft.draftId
  );
  await page.getByRole('button', { name: 'Reopen saved export', exact: true }).click();
  await page
    .getByRole('region', { name: 'Completed export' })
    .getByRole('button', { name: 'Inspect output' })
    .click();
  await expect(page.getByLabel('Export JSON')).toContainText(
    'Actual synthetic persisted valuation'
  );
  const reopened = await request(
    `/api/dossier/workflows/exports/${output.packageRef}/content?county=${county}`,
    token
  );
  expect(reopened.text).toBe(content.text);
  const draftReceipt = page.getByRole('region', { name: 'Saved draft receipt', exact: true });
  await draftReceipt
    .getByRole('button', { name: 'Inspect persisted receipt', exact: true })
    .click();
  await expect(draftReceipt.getByLabel('Persisted receipt JSON', { exact: true })).toContainText(
    draft.receipt.executionEvidence.auditLogId
  );
  const exportReceipt = page.getByRole('region', { name: 'Saved export receipt', exact: true });
  await exportReceipt
    .getByRole('button', { name: 'Inspect persisted receipt', exact: true })
    .click();
  await expect(exportReceipt.getByLabel('Persisted receipt JSON', { exact: true })).toContainText(
    output.receipt.executionEvidence.auditLogId
  );
  await exportReceipt.getByRole('button', { name: 'View action evidence', exact: true }).click();
  await exportReceipt.getByText('Trace metadata JSON', { exact: true }).click();
  await expect(exportReceipt.getByLabel('Trace metadata JSON', { exact: true })).toContainText(
    output.receipt.correlationId
  );
  await page.screenshot({
    path: resolve(root, 'output/playwright/county-context/persisted-receipt-trace-reopened.png'),
  });
  await page.screenshot({
    path: resolve(root, 'output/playwright/county-context/persisted-export-reopened.png'),
  });

  // The second stored year has different real input records, not a constant artifact count.
  await page.getByRole('combobox', { name: 'Assessment year', exact: true }).selectOption('2025');
  await expect(
    page.getByRole('checkbox', { name: 'Confirm equalization export', exact: true })
  ).not.toBeChecked();
  await expect(page.getByRole('region', { name: 'Completed export' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save study snapshot', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Saved draft', exact: true })).not.toHaveValue(
    ''
  );
  await page.getByRole('checkbox', { name: 'Confirm equalization export', exact: true }).check();
  const second = await invokeFromUI(page, 'export_equalization_package', () =>
    page.getByRole('button', { name: 'Equalization Package', exact: true }).click()
  );
  expect(second.output.taxYear).toBe(2025);
  expect(second.output.artifactCount).toBe(second.output.artifacts.length);
  expect(second.output.artifactCount).not.toBe(output.artifactCount);

  await page.getByRole('combobox', { name: 'Assessment year', exact: true }).selectOption('2024');
  await page.getByRole('textbox', { name: 'Appeal ID', exact: true }).fill(appeal);
  const packet = await invokeFromUI(page, 'open_appeal_packet', () =>
    page.getByRole('button', { name: 'Open Packet', exact: true }).click()
  );
  expect(packet.output).toMatchObject({ countyId: county, taxYear: 2024, parcelId: parcel });
  expect(packet.output.packetRef).toBe('dddddddd-dddd-dddd-dddd-dddddddddddd');
  const packetRecords = page.getByRole('region', { name: 'Appeal packet records', exact: true });
  await packetRecords.getByRole('button', { name: 'Inspect packet content', exact: true }).click();
  await expect(packetRecords.getByLabel('Appeal packet JSON', { exact: true })).toContainText(
    'Synthetic recorded evidence'
  );
  const packetRead = await request(
    `/api/dossier/workflows/appeals/${appeal}/packet?county=${county}&taxYear=2024&parcelId=${parcel}`,
    token
  );
  expect(packetRead.status).toBe(200);
  const downloading = page.waitForEvent('download');
  await packetRecords.getByRole('button', { name: 'Download packet JSON', exact: true }).click();
  const download = await downloading;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  expect(readFileSync(downloadPath!, 'utf8')).toBe(packetRead.text);
  // Real missing-record failure: no replacement handler or fabricated response.
  const failuresBefore = await pilotFailureCount(token, 'open_appeal_packet');
  await page.getByRole('textbox', { name: 'Appeal ID', exact: true }).fill(randomUUID());
  const failedPacket = await invokeFromUI(
    page,
    'open_appeal_packet',
    () => page.getByRole('button', { name: 'Open Packet', exact: true }).click(),
    false
  );
  const failuresAfter = await pilotFailureCount(token, 'open_appeal_packet');
  expect(failuresAfter).toBe(failuresBefore + 1);
  await expect(page.getByText(failedPacket.correlationId, { exact: false }).first()).toBeVisible();
  const failureEvidence = page.getByRole('region', {
    name: 'Action evidence: open_appeal_packet',
    exact: true,
  });
  await expect(failureEvidence).toContainText('Server duration:');
  await expect(failureEvidence).toContainText('EXECUTION_FAILED');
  await failureEvidence.getByRole('button', { name: 'View action evidence', exact: true }).click();
  await failureEvidence.getByText('Trace metadata JSON', { exact: true }).click();
  await expect(failureEvidence.getByLabel('Trace metadata JSON', { exact: true })).toContainText(
    'tool_failed'
  );
  await failureEvidence.screenshot({
    path: resolve(root, 'output/playwright/county-context/actual-failure-trace-metric.png'),
  });
  await test.info().attach('actual-pilot-error-counter-delta', {
    body: JSON.stringify({
      operation: 'open_appeal_packet',
      correlationId: failedPacket.correlationId,
      before: failuresBefore,
      after: failuresAfter,
      environment: 'Development',
      source: 'authenticated /metrics scrape',
    }),
    contentType: 'application/json',
  });
  await page.getByRole('textbox', { name: 'Appeal ID', exact: true }).fill(appeal);
  await page.getByRole('checkbox', { name: 'Confirm audit export', exact: true }).check();
  const audit = await invokeFromUI(page, 'export_audit_bundle', () =>
    page.getByRole('button', { name: 'Audit Bundle', exact: true }).click()
  );
  expect(audit.output.artifactCount).toBe(audit.output.artifacts.length);
  await page
    .getByRole('region', { name: 'Completed export' })
    .last()
    .getByRole('button', { name: 'Inspect output' })
    .click();
  await expect(page.getByLabel('Export JSON').last()).toContainText('Synthetic recorded evidence');

  await page.goto(`${baseURL}/property/${parcel}/dossier`);
  await page.getByRole('combobox', { name: 'Assessment year', exact: true }).selectOption('2024');
  await page.getByRole('textbox', { name: 'Appeal ID', exact: true }).fill(appeal);
  const workbenchPacket = await invokeFromUI(page, 'open_appeal_packet', () =>
    page.getByRole('button', { name: 'Open Appeal Packet', exact: true }).click()
  );
  expect(workbenchPacket.output).toMatchObject({
    countyId: county,
    taxYear: 2024,
    parcelId: parcel,
    packetRef: packet.output.packetRef,
  });
  await page
    .getByRole('region', { name: 'Appeal packet records', exact: true })
    .getByRole('button', { name: 'Inspect packet content', exact: true })
    .click();
  await expect(page.getByLabel('Appeal packet JSON', { exact: true })).toContainText(
    'Synthetic recorded evidence'
  );

  for (const exportCase of [
    {
      tool: 'export_equalization_package',
      confirm: 'Confirm equalization export',
      button: 'Export Equalization Package',
      marker: 'Actual synthetic persisted valuation',
    },
    {
      tool: 'export_audit_bundle',
      confirm: 'Confirm audit export',
      button: 'Export Audit Bundle',
      marker: 'Synthetic recorded evidence',
    },
  ]) {
    await page.getByRole('checkbox', { name: exportCase.confirm, exact: true }).check();
    const exported = await invokeFromUI(page, exportCase.tool, () =>
      page.getByRole('button', { name: exportCase.button, exact: true }).click()
    );
    expect(exported.output).toMatchObject({
      countyId: county,
      taxYear: 2024,
      status: 'complete',
      certification: false,
    });
    expect(exported.output.artifactCount).toBe(exported.output.artifacts.length);
    if (exportCase.tool === 'export_equalization_package')
      expect(exported.output).toMatchObject({ draftId: draft.draftId, revision: draft.revision });
    else expect(exported.wire.params.bundleScope).toBe('county');
    const result = page
      .getByRole('region', { name: 'Completed export', exact: true })
      .filter({ has: page.getByText(exported.output.packageRef, { exact: true }) });
    await result.getByRole('button', { name: 'Inspect output', exact: true }).click();
    await expect(result.getByLabel('Export JSON', { exact: true })).toContainText(
      exportCase.marker
    );
    const stored = await request(
      `/api/dossier/workflows/exports/${exported.output.packageRef}/content?county=${county}`,
      token
    );
    expect(stored.status).toBe(200);
    expect(createHash('sha256').update(stored.text).digest('hex')).toBe(
      exported.output.contentHash
    );
    const downloadingExport = page.waitForEvent('download');
    await result.getByRole('button', { name: 'Download JSON', exact: true }).click();
    const exportedPath = await (await downloadingExport).path();
    expect(exportedPath).not.toBeNull();
    expect(readFileSync(exportedPath!, 'utf8')).toBe(stored.text);
  }

  await page.goto(`${baseURL}/dais`);
  await page
    .getByRole('combobox', { name: 'Assessment year', exact: true })
    .first()
    .selectOption('2024');
  const brief = await invokeFromUI(page, 'generate_morning_brief', () =>
    page.getByRole('button', { name: 'Refresh Brief', exact: true }).click()
  );
  expect(brief.output).toMatchObject({ countyId: county, taxYear: 2024 });
  expect(brief.output.brief).toMatchObject({ role: 'chief_appraiser', readyToAct: true });
  expect(brief.output.findings).toEqual([
    expect.objectContaining({
      findingId: 'CountyStudySessions:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      countyId: county,
      taxYear: 2024,
      evidenceLineage: [
        expect.objectContaining({
          source: 'CountyStudySessions',
          recordCount: 1,
          citation: 'CountyStudySessions/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        }),
      ],
      recommendedAction: 'Review the existing study in County Studio.',
    }),
  ]);
  expect(JSON.stringify(brief.output)).not.toContain('benton-2026-working');
  await expect(page.getByTestId('county-morning-brief-result')).toBeVisible();
  await expect(page.getByTestId('county-morning-brief-result')).toContainText(
    brief.output.brief.queueType.replaceAll('_', ' ')
  );
  await expect(page.getByTestId('county-morning-brief-result')).toContainText(
    'Review the existing study in County Studio.'
  );
  await page
    .getByRole('combobox', { name: 'Assessment year', exact: true })
    .first()
    .selectOption('2025');
  await expect(page.getByTestId('county-morning-brief-result')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Assessment year', exact: true })
    .first()
    .selectOption('2024');
  await page.getByRole('button', { name: 'Roll readiness', exact: true }).click();
  const readiness = page.getByTestId('roll-readiness');
  await expect(
    readiness.getByRole('combobox', { name: 'Assessment year', exact: true })
  ).toHaveValue('2024');
  await readiness
    .getByRole('checkbox', { name: 'Confirm equalization export', exact: true })
    .check();
  const certification = await invokeFromUI(page, 'export_equalization_package', () =>
    readiness.getByRole('button', { name: 'Export Certification Package', exact: true }).click()
  );
  expect(certification.output).toMatchObject({
    countyId: county,
    taxYear: 2024,
    draftId: draft.draftId,
    revision: draft.revision,
    certification: false,
  });
  await readiness.getByRole('button', { name: 'Inspect output', exact: true }).click();
  await expect(readiness.getByLabel('Export JSON', { exact: true })).toContainText(
    'Actual synthetic persisted valuation'
  );

  // Delay the actual completed backend response, not a fabricated response body.
  for (const switchedYears of [['2025'], ['2025', '2024']]) {
    await page
      .getByRole('combobox', { name: 'Assessment year', exact: true })
      .first()
      .selectOption('2024');
    await expect(page.getByRole('button', { name: 'Refresh Brief', exact: true })).toBeEnabled();
    const finalYear = switchedYears[switchedYears.length - 1];
    let release!: () => void;
    let received!: () => void;
    let failed!: (error: unknown) => void;
    const handlers: Promise<void>[] = [];
    const handlerErrors: unknown[] = [];
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    const reachedBackend = new Promise<void>((resolve, reject) => {
      received = resolve;
      failed = reject;
    });
    // Attach immediately: route failure can precede completion of the click.
    void reachedBackend.catch(() => {});
    const deadline = setTimeout(
      () => failed(new Error('Actual morning-brief response did not arrive within 30 seconds.')),
      30_000
    );
    const routePattern = '**/api/pilot/invoke';
    await page.route(routePattern, route => {
      if (route.request().postDataJSON()?.toolId !== 'generate_morning_brief')
        return route.continue();
      const handler = (async () => {
        const actual = await route.fetch({ timeout: 25_000 });
        expect(actual.status()).toBe(200);
        expect((await actual.json()).ok).toBe(true);
        received();
        await held;
        await route.fulfill({ response: actual });
      })().catch(error => {
        handlerErrors.push(error);
        failed(error);
      });
      handlers.push(handler);
      return handler;
    });
    try {
      await page.getByRole('button', { name: 'Refresh Brief', exact: true }).click();
      await reachedBackend;
      for (const year of switchedYears) {
        await page
          .getByRole('combobox', { name: 'Assessment year', exact: true })
          .first()
          .selectOption(year);
        await expect(
          readiness.getByRole('combobox', { name: 'Assessment year', exact: true })
        ).toHaveValue(year);
      }
      await expect(page.getByTestId('county-morning-brief-result')).toHaveCount(0);
      const delivered = page.waitForResponse(
        response => response.url() === `${baseURL}/api/pilot/invoke`
      );
      release();
      await (await delivered).finished();
      await page.evaluate(
        () =>
          new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );
      await expect(page.getByTestId('county-morning-brief-result')).toHaveCount(0);
      await expect(
        page.getByRole('combobox', { name: 'Assessment year', exact: true }).first()
      ).toHaveValue(finalYear);
      await expect(
        readiness.getByRole('combobox', { name: 'Assessment year', exact: true })
      ).toHaveValue(finalYear);
      await expect(
        readiness.getByRole('checkbox', { name: 'Confirm equalization export', exact: true })
      ).not.toBeChecked();
      await expect(
        readiness.getByRole('region', { name: 'Completed export', exact: true })
      ).toHaveCount(0);
    } finally {
      clearTimeout(deadline);
      release();
      // Unroute alone does not settle a handler already fetching/fulfilling.
      await page.unrouteAll({ behavior: 'wait' });
      await Promise.all(handlers);
      if (handlerErrors.length) throw handlerErrors[0];
    }
  }

  // Obtain the second county through the real development issuer, not a forged header.
  await stop(api);
  await startApi(foreignCounty);
  const foreignToken = await devToken();
  const denied = await request(
    `/api/dossier/workflows/exports/${output.packageRef}/content?county=${foreignCounty}`,
    foreignToken
  );
  expect(denied.status).toBe(404);
  expect(denied.text).not.toContain('Actual synthetic persisted valuation');
  const deniedReceipt = await request(
    `/api/dossier/workflows/receipts/${output.receipt.receiptId}?county=${foreignCounty}`,
    foreignToken
  );
  expect(deniedReceipt.status).toBe(404);
  const foreignTrace = await request(
    `/api/pilot/trace/${output.receipt.correlationId}`,
    foreignToken
  );
  expect(foreignTrace.status).toBe(200);
  expect(foreignTrace.value.events).toEqual([]);
  const foreignPage = await page.context().newPage();
  await open(foreignPage, '/dossier', foreignToken);
  await expect(
    foreignPage.getByText('No persisted study for this scope.', { exact: false })
  ).toBeVisible();
  await expect(
    foreignPage.getByRole('button', { name: 'Equalization Package', exact: true })
  ).toBeDisabled();
  await foreignPage.close();
});

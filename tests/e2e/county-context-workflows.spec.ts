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
const dotnet = process.env.OS_COUNTY_CONTEXT_DOTNET ?? 'dotnet';
const signingKey = randomBytes(64).toString('hex');
let baseURL: string;
let apiPort: number;
let pilotPort: number;
let api: ChildProcess | undefined;
let pilot: ChildProcess | undefined;

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
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout?.on('data', value => {
    output = (output + value).slice(-12_000);
  });
  child.stderr?.on('data', value => {
    output = (output + value).slice(-12_000);
  });
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code =>
      code === 0 ? resolve() : reject(new Error(`Controlled fixture failed (${code}): ${output}`))
    );
  });
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
  if (!child || child.exitCode !== null) return;
  const exited = new Promise<void>(resolve => child.once('exit', () => resolve()));
  child.kill();
  await exited;
}

async function startApi(defaultCounty = county): Promise<void> {
  api = spawn(
    dotnet,
    [
      resolve(root, 'backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll'),
      '--skip-dev-seeders',
    ],
    {
      cwd: resolve(root, 'backend/src/TerraFusion.API'),
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: environment({
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
  return token;
}

async function open(page: Page, path: string, token: string): Promise<void> {
  await page.addInitScript(value => localStorage.setItem('authToken', value), token);
  await page.goto(`${baseURL}${path}`);
  await expect(
    page.getByRole('region', { name: 'Persisted workflow context' }).first()
  ).toBeVisible();
}

async function invokeFromUI(page: Page, toolId: string, action: () => Promise<unknown>) {
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
  expect(!!headers['x-user-id']).toBe(true);
  const envelope = await response.json();
  expect(envelope.ok, envelope.error ?? 'Actual Pilot invocation failed').toBe(true);
  return { output: envelope.result, wire: response.request().postDataJSON() };
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
  test.setTimeout(180_000);
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
  pilot = spawn(process.execPath, ['os-platform/core/pilot/dev-pilot-runtime.mjs'], {
    cwd: root,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: environment({ TF_PILOT_PORT: String(pilotPort), TF_API_BASE_URL: baseURL }),
  });
  await ready(pilot, `http://127.0.0.1:${pilotPort}/pilot/health`);
  await startApi();
});

test.afterAll(async () => {
  await stop(api);
  await stop(pilot);
  // Preserve the isolated synthetic DB for inspection. Never clean broad paths.
});

test('owner saves, exports, retrieves, retries and reopens exact persisted work after restart', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const token = await devToken();
  await open(page, '/dossier', token);
  await page.getByLabel('Assessment year', { exact: true }).selectOption('2024');
  await expect(page.getByLabel('Saved draft', { exact: true })).toHaveValue('');
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
  await expect(page.getByLabel('Saved draft', { exact: true })).toHaveValue(draft.draftId);
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
  for (const invalid of [
    { draftId: randomUUID() },
    { revision: '0'.repeat(64) },
    { taxYear: 2025 },
    { confirmed: false },
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
  await stop(api);
  await startApi();
  await page.reload();
  await expect(page.getByLabel('Saved draft', { exact: true })).toHaveValue(draft.draftId);
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
  await page.screenshot({
    path: resolve(root, 'output/playwright/county-context/persisted-export-reopened.png'),
  });

  // The second stored year has different real input records, not a constant artifact count.
  await page.getByLabel('Assessment year', { exact: true }).selectOption('2025');
  await expect(
    page.getByRole('checkbox', { name: 'Confirm equalization export', exact: true })
  ).not.toBeChecked();
  await expect(page.getByRole('region', { name: 'Completed export' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save study snapshot', exact: true }).click();
  await expect(page.getByLabel('Saved draft', { exact: true })).not.toHaveValue('');
  await page.getByRole('checkbox', { name: 'Confirm equalization export', exact: true }).check();
  const second = await invokeFromUI(page, 'export_equalization_package', () =>
    page.getByRole('button', { name: 'Equalization Package', exact: true }).click()
  );
  expect(second.output.taxYear).toBe(2025);
  expect(second.output.artifactCount).toBe(second.output.artifacts.length);
  expect(second.output.artifactCount).not.toBe(output.artifactCount);

  await page.getByLabel('Assessment year', { exact: true }).selectOption('2024');
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
  await page.getByLabel('Assessment year', { exact: true }).selectOption('2024');
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

  await page.goto(`${baseURL}/dais`);
  await page.getByLabel('Assessment year', { exact: true }).first().selectOption('2024');
  const brief = await invokeFromUI(page, 'generate_morning_brief', () =>
    page.getByRole('button', { name: 'Refresh Brief', exact: true }).click()
  );
  expect(brief.output).toMatchObject({ countyId: county, taxYear: 2024 });
  expect(JSON.stringify(brief.output)).not.toContain('benton-2026-working');
  await expect(page.getByTestId('county-morning-brief-result')).toBeVisible();
  await expect(page.getByTestId('county-morning-brief-result')).toContainText(
    brief.output.brief.queueType.replaceAll('_', ' ')
  );
  await page.getByLabel('Assessment year', { exact: true }).first().selectOption('2025');
  await expect(page.getByTestId('county-morning-brief-result')).toHaveCount(0);
  await page.getByLabel('Assessment year', { exact: true }).first().selectOption('2024');
  await page.getByRole('button', { name: 'Roll readiness', exact: true }).click();
  const readiness = page.getByTestId('roll-readiness');
  await expect(readiness.getByLabel('Assessment year', { exact: true })).toHaveValue('2024');
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
  let release!: () => void;
  let received!: () => void;
  const held = new Promise<void>(resolve => {
    release = resolve;
  });
  const reachedBackend = new Promise<void>(resolve => {
    received = resolve;
  });
  const routePattern = '**/api/pilot/invoke';
  await page.route(routePattern, async route => {
    if (route.request().postDataJSON()?.toolId !== 'generate_morning_brief')
      return route.continue();
    const actual = await route.fetch();
    expect(actual.status()).toBe(200);
    expect((await actual.json()).ok).toBe(true);
    received();
    await held;
    await route.fulfill({ response: actual });
  });
  try {
    await page.getByRole('button', { name: 'Refresh Brief', exact: true }).click();
    await reachedBackend;
    await page.getByLabel('Assessment year', { exact: true }).first().selectOption('2025');
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
    await expect(page.getByLabel('Assessment year', { exact: true }).first()).toHaveValue('2025');
    await expect(readiness.getByLabel('Assessment year', { exact: true })).toHaveValue('2025');
    await expect(
      readiness.getByRole('checkbox', { name: 'Confirm equalization export', exact: true })
    ).not.toBeChecked();
    await expect(
      readiness.getByRole('region', { name: 'Completed export', exact: true })
    ).toHaveCount(0);
  } finally {
    release();
    await page.unroute(routePattern);
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

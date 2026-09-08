import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, lstatSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const protectedCommit = '65f47b97bba93639ffc730662178bee6ec389097';
const moduleSha256 = '7083977211bab354053181402112fa4b304eca1e9596be0d98cd0b571c288fe6';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baseURL = 'http://127.0.0.1:5013';
const pilotURL = 'http://127.0.0.1:8783';
const countyA = '11111111-1111-1111-1111-111111111111';
const countyB = '22222222-2222-2222-2222-222222222222';
const runDirectory = resolve(root, 'artifacts/atlas-browser', `run-${randomUUID()}`);
const database = resolve(runDirectory, 'atlas.db');
const signingKey = randomBytes(64).toString('hex');
let api: ChildProcess | undefined;
let pilot: ChildProcess | undefined;
let tokenA = '';
let tokenB = '';
const children = new Set<ChildProcess>();
const dotnet = process.env.ATLAS_TEST_DOTNET || 'dotnet';
let actionSequence = 0;

async function captureAction(page: Page, envelope: any, clickStarted: number, httpStatus: number) {
  const cid = envelope.correlationId;
  expect(cid).toMatch(/^[A-Za-z0-9._-]{1,128}$/);
  await expect(page.getByText(cid, { exact: true })).toBeVisible();
  const visibleResultMs = Math.round((performance.now() - clickStarted) * 100) / 100;
  const actionId = `action-${++actionSequence}-${envelope.ok ? 'success' : 'failure'}`;
  await page
    .getByTestId('atlas-spatial-anomaly-panel')
    .screenshot({ path: resolve(runDirectory, `${actionId}.png`) });
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  const trace = await page.request.get(`${baseURL}/api/pilot/trace/${encodeURIComponent(cid)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const traceBody = await trace.json().catch(() => ({}));
  // Whitelist returned service metadata; never persist request headers, JWTs, payloads or HAR.
  const events = (Array.isArray(traceBody.events) ? traceBody.events : []).map((event: any) => ({
    eventId: event.eventId,
    timestamp: event.timestamp,
    type: event.type,
    toolId: event.toolId,
    correlationId: event.correlationId,
    countyId: event.context?.countyId,
    actor: event.context?.userId,
  }));
  const metrics = await page.request.get(`${baseURL}/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metricLines = (await metrics.text())
    .split(/\r?\n/)
    .filter(line => line.startsWith('pilot_workflow_') && line.includes('explain_spatial_anomaly'));
  const logLines = ['api-a.log', 'api-b.log'].flatMap(name => {
    const path = resolve(runDirectory, name);
    return existsSync(path)
      ? readFileSync(path, 'utf8')
          .split(/\r?\n/)
          .filter(
            line => line.includes(cid) && line.includes('Pilot workflow explain_spatial_anomaly')
          )
      : [];
  });
  appendFileSync(
    resolve(runDirectory, 'actions.jsonl'),
    JSON.stringify({
      actionId,
      operation: 'explain_spatial_anomaly',
      correlationId: cid,
      ok: envelope.ok,
      httpStatus,
      visibleResultMs,
      latencyMeaning: 'click to result CID visible',
      errorCode: envelope.errorCode ?? null,
      judgmentStatus: envelope.result?.status ?? null,
      sourceSha256: envelope.result?.sourceEvidence?.responseSha256 ?? null,
      screenshot: `${actionId}.png`,
      traceHttpStatus: trace.status(),
      events,
      apiOutcomeLines: logLines,
      metricsHttpStatus: metrics.status(),
      metricLines,
      optionalCountyWorkflowTraceFileExists: existsSync(resolve(runDirectory, 'pilot-trace.jsonl')),
    }) + '\n'
  );
  expect(metricLines.length).toBeGreaterThan(0);
  expect(logLines.length).toBeGreaterThan(0);
  if (httpStatus === 200) {
    expect(trace.status()).toBe(200);
    expect(
      events.some((event: any) => event.correlationId === cid && event.type === 'tool_invoked')
    ).toBe(true);
    expect(
      events.some(
        (event: any) =>
          event.correlationId === cid &&
          event.type === (envelope.ok ? 'tool_completed' : 'tool_failed')
      )
    ).toBe(true);
  }
}

function childEnvironment(extra: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of [
    'SystemRoot',
    'WINDIR',
    'ComSpec',
    'PATHEXT',
    'TEMP',
    'TMP',
    'USERPROFILE',
    'HOME',
    'DOTNET_ROOT',
  ])
    if (process.env[key]) env[key] = process.env[key];
  env.Path = process.env.Path || process.env.PATH;
  return { ...env, DOTNET_NOLOGO: '1', ...extra };
}

async function available(port: number) {
  const socket = createServer();
  await new Promise<void>((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(port, '127.0.0.1', resolve);
  });
  await new Promise<void>((resolve, reject) =>
    socket.close(error => (error ? reject(error) : resolve()))
  );
}

function launch(
  executable: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  name: string,
  cwd = root
) {
  const child = spawn(executable, args, {
    cwd,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  const log = (value: Buffer) => {
    if (existsSync(runDirectory)) appendFileSync(resolve(runDirectory, `${name}.log`), value);
  };
  child.stdout?.on('data', log);
  child.stderr?.on('data', log);
  // Keep errors in this owned child; no discovery or termination of unrelated processes.
  child.on('error', () => {});
  return child;
}

async function exited(child: ChildProcess, timeoutMs: number) {
  if (child.exitCode !== null) return child.exitCode;
  return new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Owned Atlas child exceeded its bounded wait.')),
      timeoutMs
    );
    child.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', code => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

async function stop(child: ChildProcess | undefined) {
  if (!child) return;
  if (child.pid && child.exitCode === null && child.signalCode === null) {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
        env: childEnvironment({}),
      });
      await exited(killer, 10000);
    } else child.kill('SIGTERM');
    if (child.exitCode === null && child.signalCode === null) await exited(child, 10000);
  }
  children.delete(child);
}

async function ready(child: ChildProcess, url: string) {
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null)
      throw new Error(`Owned Atlas application exited; inspect ${runDirectory}.`);
    try {
      if ((await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(1500) })).ok) return;
    } catch {
      /* Wait only on the explicitly reserved process. */
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Atlas application readiness failed; inspect ${runDirectory}.`);
}

async function startApi(county: string) {
  api = launch(
    dotnet,
    [
      resolve(root, 'backend/src/TerraFusion.API/bin/Release/net8.0/TerraFusion.API.dll'),
      '--skip-dev-seeders',
    ],
    childEnvironment({
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: baseURL,
      DatabaseProvider: 'SQLite',
      ConnectionStrings__DefaultConnection: `Data Source=${database}`,
      ConnectionStrings__LevyDatabase: `Data Source=${resolve(runDirectory, 'atlas-levy.db')}`,
      TF_SKIP_DEV_SEEDERS: '1',
      TF_DISABLE_DEV_PIPELINE: '1',
      TF_SKIP_DOCTRINE_SEEDERS: '1',
      TF_SKIP_AUTO_MIGRATE: 'true',
      HarrisPACS__BackgroundSync__Enabled: 'false',
      TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC: 'false',
      LegacyArcGisSync__Enabled: 'false',
      TF_ENABLE_LEGACY_ARCGIS_SYNC: 'false',
      TERRAFUSION_UI_DIST_PATH: resolve(root, 'native-shell/ui/dist'),
      PilotRuntime__BaseUrl: pilotURL,
      DefaultCounty__Id: county,
      DefaultCounty__Code: county === countyA ? 'wa-benton' : 'wa-yakima',
      JwtSettings__SecretKey: signingKey,
    }),
    `api-${county === countyA ? 'a' : 'b'}`,
    resolve(root, 'backend/src/TerraFusion.API')
  );
  await ready(api, `${baseURL}/api/auth/dev-token`);
}

async function issuedToken(county: string) {
  const response = await fetch(`${baseURL}/api/auth/dev-token`);
  expect(response.status).toBe(200);
  const value = await response.json();
  const claims = JSON.parse(Buffer.from(value.token.split('.')[1], 'base64url').toString('utf8'));
  expect(claims.countyId).toBe(county);
  expect(claims.countyCode).toBe(county === countyA ? 'wa-benton' : 'wa-yakima');
  expect(claims.roles ?? claims.role).toContain('Assessor');
  return value.token as string; // Real development issuer, never synthesize a JWT.
}

async function startPilot(source = baseURL) {
  pilot = launch(
    process.execPath,
    ['os-platform/core/pilot/dev-pilot-runtime.mjs'],
    childEnvironment({
      NODE_ENV: 'development',
      TF_PILOT_PORT: '8783',
      TF_API_BASE_URL: source,
      // Atlas uses the existing ordinary trace service, read only through the authenticated,
      // principal/county/CID-filtered .NET proxy. The optional four-workflow file store is unrelated.
    }),
    source === baseURL ? 'pilot' : 'pilot-source-unavailable'
  );
  await ready(pilot, `${pilotURL}/pilot/health`);
}

async function assertDirectCanonical(page: Page, judgment: any, wire: any) {
  const params = wire.params;
  const geography = { kind: params.geographyType, id: params.geographyId };
  const query = new URLSearchParams({ countyId: params.county, taxYear: String(params.taxYear) });
  if (params.geographyType === 'neighborhood') query.set('hood', params.geographyId);
  expect(judgment.sourceEvidence.requestQuery).toBe(query.toString());
  const token = await page.evaluate(() => localStorage.getItem('authToken'));
  expect(Boolean(token)).toBe(true);
  const response = await page.request.get(
    `${required('ATLAS_BASE_URL')}/api/terraforge/regression?${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  expect(response.status()).toBe(200);
  const body = await response.text();
  const responseSha256 = sha256(body);
  expect(judgment.sourceEvidence.responseBody).toBe(body);
  expect(judgment.sourceEvidence.responseSha256).toBe(responseSha256);
  const source = JSON.parse(body);
  const sourceId = `regression:${responseSha256}`;
  // Independent transport reconstruction from the actual persisted-source response. No spatial rules.
  const input = {
    contract: 'atlas.spatial-anomaly',
    version: '1.0.0',
    request: { countyId: params.county, taxYear: params.taxYear, geography, metric: params.metric },
    materialized: {
      countyId: params.county,
      taxYear: params.taxYear,
      geography,
      sourceState: source.singularMatrix
        ? 'UNAVAILABLE'
        : source.insufficientData
          ? 'INSUFFICIENT_DATA'
          : 'AVAILABLE',
      sample: {
        total: source.totalPool,
        used: source.residuals.length,
        excluded: source.totalPool - source.residuals.length,
      },
      observations: source.residuals.map((row: any, index: number) => ({
        observationId: `${responseSha256}:${index}`,
        parcelId: row.parcelId,
        countyId: params.county,
        taxYear: params.taxYear,
        clusterId: row.hood,
        residual: row.residual,
        percentResidual: row.percentResidual,
        sourceRef: sourceId,
      })),
      sourceRefs: [
        {
          id: sourceId,
          countyId: params.county,
          taxYear: params.taxYear,
          geography,
          endpoint: '/api/terraforge/regression',
          responseSha256,
          modelId: `model:${sha256(JSON.stringify(source.model ?? null))}`,
        },
      ],
    },
  };
  const bytes = readFileSync(
    resolve(
      root,
      '.terrafusion/runtime/atlas/spatial-anomaly/src/spatial-anomaly/judge-spatial-anomaly.mjs'
    )
  );
  expect(sha256(bytes)).toBe(moduleSha256);
  const canonical = await import(`data:text/javascript;base64,${bytes.toString('base64')}`);
  const { canonicalProvenance, sourceEvidence, correlationId, ...actualJudgment } = judgment;
  expect(canonicalProvenance.sourceCommit).toBe(protectedCommit);
  expect(canonicalProvenance.moduleSha256).toBe(moduleSha256);
  expect(canonicalProvenance.specificationSha256).toBe(
    '06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f'
  );
  const directJudgment = canonical.judgeSpatialAnomaly(input);
  appendFileSync(
    resolve(runDirectory, 'canonical-checks.jsonl'),
    JSON.stringify({
      correlationId,
      protectedCommit,
      moduleSha256,
      request: input.request,
      sourceSha256: responseSha256,
      sourceResponseBody: body,
      actualJudgment,
      directJudgment,
    }) + '\n'
  );
  expect(actualJudgment).toEqual(directJudgment);
}

function required(name: string): string {
  const value: string | undefined = (
    {
      ATLAS_BASE_URL: baseURL,
      ATLAS_VALID_YEAR: '2026',
      ATLAS_EMPTY_YEAR: '2027',
      ATLAS_PROTECTED_COMMIT: protectedCommit,
      ATLAS_NEIGHBORHOOD: 'north',
    } as Record<string, string>
  )[name];
  if (!value) throw new Error(`Actual Atlas candidate acceptance requires ${name}.`);
  return value;
}
async function openReview(page: Page, base = required('ATLAS_BASE_URL')) {
  await page.goto(`${base.replace(/\/$/, '')}/atlas`);
  await expect(page.getByTestId('atlas-spatial-anomaly-panel')).toBeVisible();
}
async function runReview(page: Page, year: string) {
  await page.getByLabel('Assessment year').fill(year);
  const response = page.waitForResponse(
    r =>
      r.url().includes('/pilot/invoke') &&
      r.request().method() === 'POST' &&
      r.request().postDataJSON()?.toolId === 'explain_spatial_anomaly'
  );
  const clickStarted = performance.now();
  await page.getByRole('button', { name: 'Run spatial review' }).click();
  const received = await response;
  const envelope = await received.json();
  const output = envelope.result;
  await captureAction(page, envelope, clickStarted, received.status());
  return {
    envelope,
    wire: received.request().postDataJSON(),
    judgment: typeof output === 'string' ? JSON.parse(output) : output,
  };
}

test.beforeAll(async () => {
  test.setTimeout(240000);
  if (process.env.ATLAS_RUN_BROWSER !== '1')
    throw new Error('Explicit coordinator Atlas runtime slot is required.');
  if (existsSync(runDirectory)) throw new Error('Refusing to overwrite an Atlas run.');
  for (let parent = resolve(root, 'artifacts/atlas-browser'); ; parent = resolve(parent, '..')) {
    if (existsSync(parent) && lstatSync(parent).isSymbolicLink())
      throw new Error('Atlas run cannot traverse directory links.');
    if (parent === resolve(parent, '..')) break;
  }
  if (!existsSync(resolve(root, 'native-shell/ui/dist/index.html')))
    throw new Error('Actual frontend build is required.');
  const slot = resolve(root, '.terrafusion/runtime/atlas/spatial-anomaly');
  const manifest = JSON.parse(readFileSync(resolve(slot, 'manifest.json'), 'utf8'));
  expect(manifest.source.commit).toBe(protectedCommit);
  expect(sha256(readFileSync(resolve(slot, manifest.entrypoint)))).toBe(moduleSha256);
  expect(sha256(readFileSync(resolve(slot, manifest.specification.path)))).toBe(
    '06b68ac64f159215f2ea620740e3eae9fda58a38604b3ea833a18691adbcfa9f'
  );
  expect(manifest.transitiveDependencies).toEqual([]);
  await available(5013);
  await available(8783);
  const seed = launch(
    dotnet,
    [
      'test',
      'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj',
      '--no-build',
      '--no-restore',
      '--configuration',
      'Release',
      '--filter',
      'FullyQualifiedName~BootstrapAtlasSpatialAnomaly_CreatesOnlyFreshOwnedPersistedSource',
      '--verbosity',
      'quiet',
    ],
    childEnvironment({ ATLAS_BROWSER_DATABASE_PATH: database }),
    'seed'
  );
  try {
    expect(await exited(seed, 120000)).toBe(0);
  } finally {
    await stop(seed);
  }
  expect(existsSync(resolve(runDirectory, 'seed-receipt.json'))).toBe(true);
  appendFileSync(
    resolve(runDirectory, 'candidate.json'),
    JSON.stringify({
      candidate: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      protectedSuiteCommit: protectedCommit,
      moduleSha256,
      specificationSha256: manifest.specification.sha256,
      apiDllSha256: sha256(
        readFileSync(
          resolve(root, 'backend/src/TerraFusion.API/bin/Release/net8.0/TerraFusion.API.dll')
        )
      ),
      uiIndexSha256: sha256(readFileSync(resolve(root, 'native-shell/ui/dist/index.html'))),
      playwrightTrace: 'off',
      receipt: 'N/A: read-only spatial review',
    }) + '\n',
    { flag: 'wx' }
  );
  await startPilot();
  await startApi(countyA);
  tokenA = await issuedToken(countyA);
  await stop(api);
  await startApi(countyB);
  tokenB = await issuedToken(countyB);
  await stop(api);
  await startApi(countyA);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(token => localStorage.setItem('authToken', token), tokenA);
});

test.afterAll(async () => {
  const results = await Promise.allSettled([...children].map(stop));
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(0);
  tokenA = '';
  tokenB = '';
});

test('actual source produces protected canonical judgment, inspectable provenance and repeat after reload', async ({
  page,
}) => {
  await openReview(page);
  // Native option disablement: this Playwright build's control actionability matcher ignores option.
  await expect(page.getByRole('option', { name: 'PRD — unavailable' })).toHaveAttribute(
    'disabled',
    ''
  );
  await expect(page.getByRole('option', { name: 'PRD — unavailable' })).toHaveJSProperty(
    'disabled',
    true
  );
  const enabledMetrics = await page
    .getByRole('option', { name: 'PRD — unavailable' })
    .evaluate((option: HTMLOptionElement) =>
      Array.from((option.parentElement as HTMLSelectElement).options)
        .filter(item => !item.disabled)
        .map(item => item.value)
    );
  expect(enabledMetrics).toEqual(['residual_cluster']);
  const first = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(first.envelope.ok).toBe(true);
  expect(first.judgment.status).toBe('OK');
  expect(first.judgment.hotspotCount).toBeGreaterThan(0);
  expect(first.judgment.canonicalProvenance.sourceCommit).toBe(required('ATLAS_PROTECTED_COMMIT'));
  expect(first.judgment.sourceEvidence.responseSha256).toBe(
    createHash('sha256').update(first.judgment.sourceEvidence.responseBody).digest('hex')
  );
  await expect(page.getByText(first.envelope.correlationId, { exact: true })).toBeVisible();
  await page.getByText('Inspect source observations', { exact: true }).click();
  await expect(
    page.getByTestId('atlas-spatial-anomaly-result').locator('pre').first()
  ).toContainText(first.judgment.sourceEvidence.responseBody);
  await assertDirectCanonical(page, first.judgment, first.wire);
  await page.reload();
  await expect(page.getByText(first.envelope.correlationId, { exact: true })).toHaveCount(0);
  const reloaded = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(reloaded.judgment.request).toEqual(first.judgment.request);
  expect(reloaded.judgment.finding).toEqual(first.judgment.finding);
  await assertDirectCanonical(page, reloaded.judgment, reloaded.wire);
});

test('geography switching clears old evidence and restores the original county result', async ({
  page,
}) => {
  await openReview(page);
  const county = await runReview(page, required('ATLAS_VALID_YEAR'));
  await page.getByLabel('Geography', { exact: true }).selectOption('neighborhood');
  await expect(page.getByTestId('atlas-spatial-anomaly-result')).toHaveCount(0);
  await expect(page.getByText(county.envelope.correlationId, { exact: true })).toHaveCount(0);
  await page.getByLabel('Neighborhood ID').fill(required('ATLAS_NEIGHBORHOOD'));
  const neighborhood = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(neighborhood.envelope.ok).toBe(true);
  expect(neighborhood.judgment.request.geography).toEqual({
    kind: 'neighborhood',
    id: required('ATLAS_NEIGHBORHOOD'),
  });
  await assertDirectCanonical(page, neighborhood.judgment, neighborhood.wire);
  for (const row of JSON.parse(neighborhood.judgment.sourceEvidence.responseBody).residuals)
    expect(row.hood).toBe(required('ATLAS_NEIGHBORHOOD'));
  await page.getByLabel('Geography', { exact: true }).selectOption('county');
  await expect(page.getByTestId('atlas-spatial-anomaly-result')).toHaveCount(0);
  const restored = await runReview(page, required('ATLAS_VALID_YEAR'));
  expect(restored.judgment.request).toEqual(county.judgment.request);
  expect(restored.judgment.finding).toEqual(county.judgment.finding);
  await assertDirectCanonical(page, restored.judgment, restored.wire);
});

test('empty actual backing scope produces insufficient data without a finding', async ({
  page,
}) => {
  await openReview(page);
  const { judgment, wire } = await runReview(page, required('ATLAS_EMPTY_YEAR'));
  expect(judgment.status).toBe('INSUFFICIENT_DATA');
  expect(judgment.finding).toBeNull();
  expect(judgment.hotspotCount).toBe(0);
  await expect(page.getByText(judgment.reason, { exact: true })).toBeVisible();
  await assertDirectCanonical(page, judgment, wire);
});

test('another authorized county remains isolated through the actual source', async ({
  browser,
  page,
}) => {
  await openReview(page);
  const first = await runReview(page, required('ATLAS_VALID_YEAR'));
  const otherContext = await browser.newContext();
  try {
    await otherContext.addInitScript(token => localStorage.setItem('authToken', token), tokenB);
    const other = await otherContext.newPage();
    await openReview(other);
    const second = await runReview(other, required('ATLAS_VALID_YEAR'));
    expect(second.envelope.ok).toBe(true);
    expect(second.judgment.request.countyId).not.toBe(first.judgment.request.countyId);
    for (const source of second.judgment.sourceRefs)
      expect(source.countyId).toBe(second.judgment.request.countyId);
    expect(second.judgment.sourceEvidence.requestQuery).not.toContain(
      first.judgment.request.countyId
    );
    await assertDirectCanonical(other, second.judgment, second.wire);
  } finally {
    await otherContext.close();
  }
});

for (const outage of ['transport', 'regression-source'] as const) {
  test(`actual ${outage} outage fails closed and restores the same source judgment`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await openReview(page);
    const before = await runReview(page, required('ATLAS_VALID_YEAR'));
    expect(before.envelope.ok).toBe(true);
    await stop(pilot);
    try {
      // Port zero cannot host a listening API; the actual UI/API remains up on 5013.
      // The source-outage case keeps the real Pilot alive with an unreachable source destination.
      if (outage === 'regression-source') await startPilot('http://127.0.0.1:0');
      const { envelope } = await runReview(page, required('ATLAS_VALID_YEAR'));
      expect(envelope.ok).toBe(false);
      if (outage === 'regression-source') {
        // ToolRunner intentionally redacts handler diagnostics at the public wire boundary.
        expect(envelope.errorCode).toBe('EXECUTION_FAILED');
        const liveSource = await page.request.get(
          `${baseURL}/api/terraforge/regression?${before.judgment.sourceEvidence.requestQuery}`,
          { headers: { Authorization: `Bearer ${tokenA}` } }
        );
        const liveSourceSha256 = sha256(await liveSource.body());
        appendFileSync(
          resolve(runDirectory, 'outages.jsonl'),
          JSON.stringify({
            correlationId: envelope.correlationId,
            outage,
            pilotSourceBase: 'http://127.0.0.1:0',
            pilotRunning: Boolean(pilot?.pid && pilot.exitCode === null),
            actualApiSourceStatus: liveSource.status(),
            actualApiSourceSha256: liveSourceSha256,
          }) + '\n'
        );
        expect(liveSource.status()).toBe(200);
        expect(liveSourceSha256).toBe(before.judgment.sourceEvidence.responseSha256);
      } else expect(envelope.errorCode).toBe('PILOT_RUNTIME_UNAVAILABLE');
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(envelope.correlationId, { exact: true })).toBeVisible();
      await expect(page.getByTestId('atlas-spatial-anomaly-result')).toHaveCount(0);
    } finally {
      await stop(pilot);
      await startPilot();
    }
    const restored = await runReview(page, required('ATLAS_VALID_YEAR'));
    expect(restored.envelope.ok).toBe(true);
    expect(restored.judgment.finding).toEqual(before.judgment.finding);
    expect(restored.judgment.sourceEvidence.responseSha256).toBe(
      before.judgment.sourceEvidence.responseSha256
    );
    await assertDirectCanonical(page, restored.judgment, restored.wire);
  });
}

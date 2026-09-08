import { expect, test, type Page } from '@playwright/test';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Acceptance, not a demo: a missing registration, stale build, missing admitted
// artifact, missing real audit, or unavailable startup prerequisite MUST fail.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baseURL = 'http://127.0.0.1:5198';
const county = '19190019-1919-1919-1919-191919191919';
const countyCode = 'wa-benton';
const parcel = 'SYNTHETIC-FORGE-P1';
const runId = `run-${randomUUID().replaceAll('-', '')}`;
const runRoot = resolve(root, '.tmp/forge-cost-income-browser', runId);
const evidenceRoot = resolve(root, 'output/playwright/forge-cost-income', runId);
const database = resolve(runRoot, 'forge.db');
const slot = resolve(root, '.terrafusion/runtime/forge/cost-income');
const executable = resolve(slot, 'terraforge-kernel-valuation.exe');
const sourceCommit = '5216af45155954ac27a1acbf04b22085019380c1';
const executableHash = 'dc8a53d2f85a34ae0ddec38e173f83d8c68bd41ba3cea90aba6275363e0ef1be';
const manifestHash = '9ab975d946f03862159fff95a57e68d3c0fde5767a9af5003b1a549d002c82f7';
const receiptHash = '440715247fb5cd083a55460e68fc652cc756c3517ef363c3c1b1bc151a0d159d';
const signingKey = randomBytes(64).toString('hex');
const children = new Set<ChildProcess>();
let api: ChildProcess | undefined;
let token: string;
let actor: string;
let session: {
  userId: string;
  countyId: string;
  role: string;
  permissions: string[];
  parcelId: string;
};
let osCommit: string;
let apiDllSha256: string;
let uiIndexSha256: string;
type Metric = {
  operation: string;
  correlationId: string;
  actor: string;
  outcome: string;
  errorCategory: string | null;
  errorCount: number;
  environment: string;
  measurement: string;
  durationMs: number;
};
const metrics: Metric[] = [];
const lineage: { correlationId: string; details: string }[] = [];

function hash(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function noReparse(path: string) {
  for (let current = resolve(path); ; current = dirname(current)) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error('Owned browser path has a reparse/symlink ancestor.');
    if (dirname(current) === current) break;
  }
}

function environment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of [
    'SystemRoot',
    'WINDIR',
    'ComSpec',
    'PATHEXT',
    'TEMP',
    'TMP',
    'USERPROFILE',
    'DOTNET_ROOT',
  ])
    if (process.env[key]) env[key] = process.env[key];
  // One canonical child Path; real own bins, no shims or inherited provider credentials.
  env.Path = [
    dirname(process.execPath),
    resolve(root, 'frontend/node_modules/.bin'),
    resolve(root, 'node_modules/.bin'),
    'C:/Users/bsval/bin',
    'C:/Program Files/Git/cmd',
    'C:/Windows/System32',
    'C:/Windows',
    'C:/Windows/System32/WindowsPowerShell/v1.0',
    'C:/Program Files/dotnet',
    'C:/Users/bsval/AppData/Roaming/npm',
  ].join(';');
  return { ...env, DOTNET_NOLOGO: '1', ...extra };
}

async function stop(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const ended = new Promise<void>((resolveExit, reject) => {
    const timer = setTimeout(() => reject(new Error('Owned process did not exit.')), 10_000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolveExit();
    });
  });
  // Only this harness's actual PID tree. Never enumerate or stop another worker.
  const killed = spawnSync(
    'C:/Windows/System32/taskkill.exe',
    ['/PID', String(child.pid), '/T', '/F'],
    { windowsHide: true, stdio: 'ignore', timeout: 8_000, env: environment() }
  );
  if (killed.error) child.kill();
  await ended;
  children.delete(child);
}

async function fixture(name: string) {
  const child = spawn(
    'C:/Program Files/dotnet/dotnet.exe',
    [
      'test',
      'backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj',
      '--no-build',
      '--no-restore',
      '--filter',
      `FullyQualifiedName~ForgeCostIncomeBrowserFixtureTests.${name}`,
      '-m:1',
      '-p:UseSharedCompilation=false',
      '-nodeReuse:false',
      '--logger',
      'trx;LogFileName=fixture.trx',
      '--results-directory',
      resolve(runRoot, name),
    ],
    {
      cwd: root,
      windowsHide: true,
      env: environment({ TF_FORGE_BROWSER_DATABASE: database }),
      stdio: 'ignore',
    }
  );
  children.add(child);
  try {
    await new Promise<void>((resolveExit, reject) => {
      const timer = setTimeout(() => reject(new Error('Own fixture exceeded 90 seconds.')), 90_000);
      child.once('error', () => {
        clearTimeout(timer);
        reject(new Error('Own fixture could not start.'));
      });
      child.once('exit', code => {
        clearTimeout(timer);
        code === 0
          ? resolveExit()
          : reject(new Error(`Own fixture failed (${code}); not browser proof.`));
      });
    });
    const trx = readFileSync(resolve(runRoot, name, 'fixture.trx'), 'utf8');
    expect(trx).toMatch(/<Counters\b[^>]*executed="1"/);
    expect(trx).toMatch(/<Counters\b[^>]*passed="1"/);
  } finally {
    await stop(child);
  }
}

function captureAudit(child: ChildProcess) {
  let pending = '';
  child.stdout?.on('data', bytes => {
    pending = (pending + bytes.toString('utf8')).slice(-65_536);
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? '';
    for (const line of lines) {
      const marker = line.indexOf('AUDIT: {');
      if (marker < 0) continue;
      try {
        const record = JSON.parse(line.slice(marker + 7));
        if (!/^[A-Za-z0-9._-]{1,128}$/.test(record.CorrelationId)) continue;
        const details = JSON.parse(record.Data).Details;
        if (/^CostForge:Canonical:(cost|income):Metric$/.test(record.Type)) {
          const metric = JSON.parse(details);
          // Only explicit non-secret telemetry fields, never raw logs/headers/tokens.
          metrics.push({
            operation: metric.operation,
            correlationId: record.CorrelationId,
            actor: metric.actor,
            outcome: metric.outcome,
            errorCategory: metric.errorCategory,
            errorCount: metric.errorCount,
            environment: metric.environment,
            measurement: metric.measurement,
            durationMs: metric.durationMs,
          });
        } else if (
          typeof details === 'string' &&
          details.startsWith(`CountyId=${county};ParcelId=SYNTHETIC-FORGE-`)
        ) {
          lineage.push({ correlationId: record.CorrelationId, details });
        }
      } catch {
        /* Unrelated/non-JSON console output is neither retained nor evidence. */
      }
    }
  });
  child.stderr?.resume();
}

async function startApi(unavailable = false) {
  const socket = createServer();
  await new Promise<void>((resolveListen, reject) => {
    socket.once('error', reject);
    socket.listen(5198, '127.0.0.1', resolveListen);
  });
  await new Promise<void>((resolveClose, reject) =>
    socket.close(error => (error ? reject(error) : resolveClose()))
  );
  api = spawn(
    'C:/Program Files/dotnet/dotnet.exe',
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
        ConnectionStrings__LevyDatabase: `Data Source=${resolve(runRoot, 'levy.db')}`,
        TF_SKIP_DEV_SEEDERS: '1',
        TF_DISABLE_DEV_PIPELINE: '1',
        TF_SKIP_DOCTRINE_SEEDERS: '1',
        TF_SKIP_AUTO_MIGRATE: 'true',
        HarrisPACS__BackgroundSync__Enabled: 'false',
        TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC: 'false',
        LegacyArcGisSync__Enabled: 'false',
        TF_ENABLE_LEGACY_ARCGIS_SYNC: 'false',
        TERRAFUSION_UI_DIST_PATH: resolve(root, 'native-shell/ui/dist'),
        DefaultCounty__Id: county,
        DefaultCounty__Code: countyCode,
        JwtSettings__SecretKey: signingKey,
        AuditLogging__Enabled: 'true',
        AuditLogging__LogToDatabase: 'true',
        AuditLogging__LogToFile: 'true',
        'Logging__LogLevel__TerraFusion.API.Services.AuditLogger': 'Information',
        RustKernels__CostIncomeKernelPath: unavailable
          ? resolve(runRoot, 'intentionally-absent.exe')
          : executable,
        RustKernels__CostIncomeKernelManifestPath: resolve(slot, 'manifest.json'),
        RustKernels__CostIncomeKernelReceiptPath: resolve(slot, 'receipt.json'),
      }),
    }
  );
  children.add(api);
  captureAudit(api);
  for (const deadline = Date.now() + 120_000; Date.now() < deadline; ) {
    if (api.exitCode !== null)
      throw new Error(`Own API startup exited ${api.exitCode}; no server reused.`);
    try {
      const response = await fetch(`${baseURL}/api/auth/dev-token`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) return;
    } catch {
      /* Wait for own PID only. */
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
  }
  throw new Error('Own API startup not ready; no fallback runtime permitted.');
}

async function open(page: Page, approach: 'cost' | 'income') {
  await page.addInitScript(
    value => {
      localStorage.setItem('authToken', value.token);
      localStorage.setItem('tf.session.dev', JSON.stringify(value.session));
    },
    { token, session }
  );
  await page.goto(`${baseURL}/m/${approach === 'cost' ? 'costforge' : 'income-forge'}`);
  const controls =
    approach === 'cost' ? page.getByRole('tablist', { name: 'CostForge tabs', exact: true }) : page;
  await controls
    .getByRole(approach === 'cost' ? 'tab' : 'button', {
      name: approach === 'cost' ? 'Single-parcel RCNLD with certified BIV display' : 'Calculate',
      exact: true,
    })
    .click();
  await expect(page.locator(`#canonical-${approach}-parcelId`)).toBeVisible();
}

async function fillCost(page: Page) {
  for (const [field, value] of Object.entries({
    parcelId: parcel,
    yearBuilt: '2000',
    squareFeet: '1000',
    revalArea: 'Reval 1',
  }))
    await page.locator(`#canonical-cost-${field}`).fill(value);
}

async function fillIncome(page: Page) {
  for (const [field, value] of Object.entries({
    parcelId: parcel,
    annualRentalIncome: '120000',
    vacancyRate: '5',
    otherIncome: '6000',
    capRate: '6',
    location: 'Richland',
    propertyType: 'commercial',
    propertyTaxes: '10000',
    insurance: '2000',
    utilities: '3000',
    maintenance: '4000',
    managementFees: '5000',
    replacementReserves: '5000',
    otherExpenses: '1000',
  }))
    await page.locator(`#canonical-income-${field}`).fill(value);
}

async function invoke(page: Page, action: 'cost' | 'income', expectedStatus = 200) {
  const path =
    action === 'cost'
      ? '/api/costforge/calculate'
      : '/api/costforge/income-approach/calculate-valuation';
  const pending = page.waitForResponse(
    response => new URL(response.url()).pathname === path && response.request().method() === 'POST'
  );
  const started = performance.now();
  await page
    .getByRole('button', {
      name: action === 'cost' ? 'Run RCNLD' : 'Calculate Income',
      exact: true,
    })
    .click();
  const response = await pending;
  const body = await response.json();
  expect(response.status()).toBe(expectedStatus);
  const cid = response.headers()['x-correlation-id'];
  expect(cid).toMatch(/^[A-Za-z0-9._-]{1,128}$/);
  expect(expectedStatus === 200 ? body.provenance.requestId : body.correlationId).toBe(cid);
  await expect(page.getByText(`Trace: ${cid}`, { exact: false }).first()).toBeVisible();
  const browserDurationMs = performance.now() - started;
  await expect.poll(() => metrics.some(metric => metric.correlationId === cid)).toBe(true);
  const metric = metrics.find(value => value.correlationId === cid)!;
  expect(metric).toMatchObject({
    operation: action,
    actor,
    outcome: expectedStatus === 200 ? 'success' : 'failure',
    errorCount: expectedStatus === 200 ? 0 : 1,
    environment: 'Development',
    measurement: 'api-action-to-canonical-result',
  });
  expect(Number.isFinite(metric.durationMs) && metric.durationMs >= 0).toBe(true);
  if (expectedStatus !== 200) expect(metric.errorCategory).toBe(body.code);
  else {
    expect(body.provenance).toMatchObject({
      sourceCommit,
      executableSha256: executableHash,
      countyId: county,
    });
    await expect(
      page.getByText(`Canonical source: ${sourceCommit}`, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(`Artifact SHA-256: ${executableHash}`, { exact: true })
    ).toBeVisible();
    await expect
      .poll(() =>
        lineage.some(
          record =>
            record.correlationId === cid &&
            record.details.includes(
              `Input=${body.provenance.inputHash};Event=${body.provenance.auditEventId}`
            )
        )
      )
      .toBe(true);
  }
  await test.info().attach(`${action}-${cid}`, {
    contentType: 'application/json',
    body: JSON.stringify({
      osCommit,
      apiDllSha256,
      uiIndexSha256,
      sourceCommit,
      executableHash,
      metric,
      browserDurationMs,
      browserMeasurement: 'click-to-visible-result',
      environment: 'Development',
      outcomeStatus: expectedStatus,
      provenance: expectedStatus === 200 ? body.provenance : undefined,
      audit: lineage.filter(record => record.correlationId === cid),
    }),
  });
  await page.screenshot({ path: resolve(evidenceRoot, `${action}-${expectedStatus}-${cid}.png`) });
  return { body, wire: response.request().postDataJSON() };
}

type BootDiagnostics = {
  pageErrors: { name: string; message: string }[];
  resources: {
    path: string;
    resourceType: string;
    status: number | null;
    failure: string | null;
  }[];
};
const bootDiagnostics = new WeakMap<Page, BootDiagnostics>();

function redact(value: string): string {
  return value
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]');
}

function diagnosticText(value: string, limit: number): string {
  return redact(value)
    .replace(/(?:[A-Za-z][A-Za-z0-9+.-]*:)?\/\/[^\s"'<>]+/g, '[URL]')
    .replace(/\b(?:data|blob):[^\s"'<>]+/gi, '[URL]')
    .replace(/[?#][^\s"'<>]*/g, '')
    .slice(0, limit);
}

function capturePageError(capture: BootDiagnostics, error: { name: string; message: string }) {
  if (capture.pageErrors.length >= 10) return;
  capture.pageErrors.push({
    name: diagnosticText(error.name, 80),
    message: diagnosticText(error.message, 1024),
  });
}

function captureBootResource(
  capture: BootDiagnostics,
  rawUrl: string,
  resourceType: string,
  status: number | null
) {
  if (
    capture.resources.length >= 40 ||
    !['document', 'script', 'stylesheet'].includes(resourceType)
  )
    return;
  try {
    const url = new URL(rawUrl);
    if (
      url.origin !== baseURL ||
      url.username ||
      url.password ||
      /^\/(api|hubs)(\/|$)/i.test(url.pathname)
    )
      return;
    capture.resources.push({
      path: diagnosticText(url.pathname, 2048),
      resourceType,
      status,
      failure: status === null ? 'request-failed' : null,
    });
  } catch {
    // Malformed/non-URL locations are outside this same-origin diagnostic scope.
  }
}

type FailurePage = {
  osCommit: string;
  apiDllSha256: string;
  uiIndexSha256: string;
  path: string;
  visibleText: string;
  controls: { role: string; name: string; id: string }[];
  boot?: BootDiagnostics;
};

function serializeFailurePage(page: FailurePage): string {
  // Redact complete raw fields before bounds, then serialize exactly once.
  // Rewriting JSON syntax or clipping a token before detection is unsafe.
  return JSON.stringify({
    osCommit: redact(page.osCommit),
    apiDllSha256: redact(page.apiDllSha256),
    uiIndexSha256: redact(page.uiIndexSha256),
    path: redact(page.path),
    visibleText: redact(page.visibleText).slice(0, 16000),
    controls: page.controls.slice(0, 80).map(control => ({
      role: redact(control.role),
      name: redact(control.name).slice(0, 240),
      id: redact(control.id),
    })),
    boot: page.boot ?? { pageErrors: [], resources: [] },
  });
}

test.describe('Forge failure diagnostics', () => {
  const fixture: FailurePage = {
    osCommit: 'synthetic-commit',
    apiDllSha256: 'synthetic-api',
    uiIndexSha256: 'synthetic-ui',
    path: '/m/costforge',
    visibleText: '',
    controls: [],
  };
  const syntheticJwt = 'eyJzeW50aGV0aWM.eyJub3RSZWFs.c3ludGhldGlj';

  test('Bearer text remains redacted inside parseable JSON', () => {
    const captured = JSON.parse(
      serializeFailurePage({
        ...fixture,
        visibleText: 'Synthetic Bearer not-a-real-credential',
      })
    );
    expect(captured.visibleText).toBe('Synthetic Bearer [REDACTED]');
    expect(captured.controls).toEqual([]);
    expect(captured.path).toBe('/m/costforge');
  });

  test('a JWT crossing the body limit leaves no token prefix', () => {
    const captured = JSON.parse(
      serializeFailurePage({
        ...fixture,
        visibleText: 'x'.repeat(15980) + ' ' + syntheticJwt,
      })
    );
    expect(captured.visibleText.slice(15980)).toBe(' [REDACTED]');
    expect(captured.visibleText).toHaveLength(15991);
  });

  test('a JWT crossing the control-name limit leaves no token prefix', () => {
    const captured = JSON.parse(
      serializeFailurePage({
        ...fixture,
        controls: [{ role: 'tab', name: 'x'.repeat(220) + ' ' + syntheticJwt, id: 'synthetic' }],
      })
    );
    expect(captured.controls[0].name.slice(220)).toBe(' [REDACTED]');
    expect(captured.controls[0].name).toHaveLength(231);
  });

  test('Bearer control labels preserve parseable JSON and sibling fields', () => {
    const captured = JSON.parse(
      serializeFailurePage({
        ...fixture,
        controls: [
          { role: 'tab', name: 'Synthetic Bearer not-a-real-credential', id: 'synthetic' },
        ],
      })
    );
    expect(captured.controls).toEqual([
      { role: 'tab', name: 'Synthetic Bearer [REDACTED]', id: 'synthetic' },
    ]);
  });

  test('ordinary rendered text retains bounded controls and escaped punctuation', () => {
    const captured = JSON.parse(
      serializeFailurePage({
        ...fixture,
        visibleText: 'x'.repeat(16001),
        controls: Array.from({ length: 81 }, () => ({
          role: 'tab',
          name: '"Synthetic"\n'.repeat(30),
          id: 'synthetic',
        })),
      })
    );
    expect(captured.visibleText).toHaveLength(16000);
    expect(captured.controls).toHaveLength(80);
    expect(captured.controls[0].name).toHaveLength(240);
    expect(captured.controls[0].name.startsWith('"Synthetic"\n')).toBe(true);
  });

  test('boot errors redact complete raw messages before caps and exclude URL details', () => {
    const capture: BootDiagnostics = { pageErrors: [], resources: [] };
    capturePageError(capture, {
      name: 'TypeError',
      message:
        'x'.repeat(1000) +
        ' ' +
        syntheticJwt +
        ' https://external.invalid/asset.js?synthetic=private#fragment',
    });
    const saved = JSON.parse(serializeFailurePage({ ...fixture, boot: capture }));
    expect(saved.boot.pageErrors).toHaveLength(1);
    expect(saved.boot.pageErrors[0].name).toBe('TypeError');
    expect(saved.boot.pageErrors[0].message.slice(1000)).toBe(' [REDACTED] [URL]');
    expect(saved.boot.pageErrors[0].message.length).toBeLessThanOrEqual(1024);
  });

  test('boot resources retain only same-origin static delivery metadata without queries', () => {
    const capture: BootDiagnostics = { pageErrors: [], resources: [] };
    captureBootResource(
      capture,
      `${baseURL}/assets/app.js?synthetic=private#fragment`,
      'script',
      200
    );
    captureBootResource(capture, `${baseURL}/assets/app.css`, 'stylesheet', null);
    captureBootResource(capture, 'https://external.invalid/app.js', 'script', 500);
    captureBootResource(capture, `${baseURL}/api/auth/dev-token`, 'document', 200);
    captureBootResource(capture, `${baseURL}/hubs/test`, 'document', 200);
    captureBootResource(capture, `${baseURL}/assets/app.js`, 'fetch', 200);
    expect(capture.resources).toEqual([
      { path: '/assets/app.js', resourceType: 'script', status: 200, failure: null },
      {
        path: '/assets/app.css',
        resourceType: 'stylesheet',
        status: null,
        failure: 'request-failed',
      },
    ]);
  });

  test('boot event capture bounds both arrays and each raw error field', () => {
    const capture: BootDiagnostics = { pageErrors: [], resources: [] };
    for (let index = 0; index < 50; index++) {
      capturePageError(capture, { name: 'n'.repeat(100), message: 'm'.repeat(1100) });
      captureBootResource(capture, `${baseURL}/assets/${index}.js`, 'script', 200);
    }
    expect(capture.pageErrors).toHaveLength(10);
    expect(capture.resources).toHaveLength(40);
    expect(capture.pageErrors[0].name).toHaveLength(80);
    expect(capture.pageErrors[0].message).toHaveLength(1024);
  });
});

function canonical(action: string, payload: unknown) {
  expect(hash(executable)).toBe(executableHash);
  const result = spawnSync(executable, [], {
    cwd: slot,
    windowsHide: true,
    env: environment(),
    input:
      JSON.stringify({
        contractPackVersion: '1.0.0',
        moduleApiVersion: '1.0.0',
        requestId: `direct-${randomUUID()}`,
        action,
        payload,
      }) + '\n',
    encoding: 'utf8',
    maxBuffer: 65_536,
    timeout: 5_000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  const response = JSON.parse(result.stdout);
  expect(response.success).toBe(true);
  expect(response.auditEvent.hash).toBe(`git:${sourceCommit}`);
  return response.data;
}

test.describe.serial('real Forge protected-artifact Cost/Income acceptance', () => {
  test.beforeAll(async () => {
    test.setTimeout(240_000);
    if (process.env.TF_FORGE_BROWSER_ACCEPTANCE !== '1')
      throw new Error('Explicit owned runtime-slot opt-in required.');
    if (process.platform !== 'win32')
      throw new Error('This acceptance is native Windows only, not Linux adoption.');
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    expect(status.status).toBe(0);
    expect(status.stdout.trim()).toBe('');
    osCommit = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).stdout.trim();
    expect(osCommit).toMatch(/^[a-f0-9]{40}$/);
    apiDllSha256 = hash(
      resolve(root, 'backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll')
    );
    uiIndexSha256 = hash(resolve(root, 'native-shell/ui/dist/index.html'));
    for (const path of [runRoot, evidenceRoot, executable]) noReparse(path);
    expect(existsSync(runRoot)).toBe(false);
    expect(hash(executable)).toBe(executableHash);
    expect(hash(resolve(slot, 'manifest.json'))).toBe(manifestHash);
    expect(hash(resolve(slot, 'receipt.json'))).toBe(receiptHash);
    mkdirSync(evidenceRoot, { recursive: true });
    await fixture('BootstrapFreshForgeCostIncomeBrowserPrerequisites');
    expect(existsSync(database)).toBe(true);
    await startApi();
    const issuer = await fetch(`${baseURL}/api/auth/dev-token`);
    expect(issuer.status).toBe(200);
    token = (await issuer.json()).token;
    // Validate actual issuer claims in memory; never attach or print bearer values.
    expect(typeof token === 'string' && token.split('.').length === 3).toBe(true);
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    expect(claims.countyId).toBe(county);
    expect(claims.countyCode).toBe(countyCode);
    expect(claims.perm).toContain('calculate:property-cost');
    actor =
      claims.sub ??
      claims.nameid ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    expect(typeof actor === 'string' && actor.length > 0).toBe(true);
    session = {
      userId: actor,
      countyId: county,
      role: (claims.roles ?? claims.role).join(','),
      permissions: claims.perm,
      parcelId: parcel,
    };
  });

  test.beforeEach(async ({ page }) => {
    const capture: BootDiagnostics = { pageErrors: [], resources: [] };
    bootDiagnostics.set(page, capture);
    page.on('pageerror', error => capturePageError(capture, error));
    page.on('response', response =>
      captureBootResource(
        capture,
        response.url(),
        response.request().resourceType(),
        response.status()
      )
    );
    page.on('requestfailed', request =>
      captureBootResource(capture, request.url(), request.resourceType(), null)
    );
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus || page.isClosed()) return;
    // Capture only this owned synthetic page. Never inspect headers, storage or tokens.
    const url = new URL(page.url());
    if (url.origin !== baseURL) return;
    try {
      const visibleText = await page.locator('body').innerText({ timeout: 3000 });
      const controls = await page
        .locator('button, [role="tab"], [role="alert"], input, select')
        .evaluateAll(elements =>
          elements
            .filter(
              element =>
                element instanceof HTMLElement &&
                element.getClientRects().length > 0 &&
                getComputedStyle(element).visibility !== 'hidden'
            )
            .slice(0, 80)
            .map(element => ({
              role: element.getAttribute('role') ?? element.tagName.toLowerCase(),
              name: element.getAttribute('aria-label') ?? (element as HTMLElement).innerText ?? '',
              id: element.id,
            }))
        );
      const failurePath = resolve(evidenceRoot, `failure-${testInfo.testId}.json`);
      writeFileSync(
        failurePath,
        serializeFailurePage({
          osCommit,
          apiDllSha256,
          uiIndexSha256,
          path: url.pathname,
          visibleText,
          controls,
          boot: bootDiagnostics.get(page),
        }),
        { flag: 'wx' }
      );
      await testInfo.attach('failure-rendered-page', {
        contentType: 'application/json',
        path: failurePath,
      });
      await page.screenshot({
        path: resolve(evidenceRoot, `failure-${testInfo.testId}.png`),
        timeout: 5000,
        mask: [page.locator('input[type="password"], input[name*="token" i], [data-sensitive]')],
      });
    } catch {
      await testInfo.attach('failure-capture-unavailable', {
        contentType: 'text/plain',
        body: 'Bounded visible-page capture was unavailable; original failure retained.',
      });
    }
  });

  test.afterAll(async () => {
    for (const child of children) await stop(child);
    // Preserve own DB, manifests, and screenshots; no recursive cleanup or foreign state.
  });

  test('Cost uses protected runtime numbers, rejects invalid area, clears changed parcel and reopens', async ({
    page,
  }) => {
    await open(page, 'cost');
    await fillCost(page);
    const result = await invoke(page, 'cost');
    const references = await fetch(`${baseURL}/api/costforge/cost-estimate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-County-Id': county,
      },
      body: JSON.stringify({
        parcelId: parcel,
        buildingType: 'residential',
        region: 'Reval 1',
        squareFeet: 1000,
        yearBuilt: 2000,
        qualityGrade: 'STANDARD',
        conditionGrade: 'GOOD',
        complexityGrade: 'STANDARD',
      }),
    });
    expect(references.status).toBe(200);
    const factors = await references.json();
    // Read existing resolved reference factors; no second Cost formula in this harness.
    const expected = canonical('cost', {
      schemaVersion: '1.0.0',
      parcelId: parcel,
      squareFeet: 1000,
      baseCostPerSqft: factors.baseCostPerSqft,
      revalAreaFactor: factors.revalAreaFactor,
      qualityFactor: factors.qualityFactor,
      complexityFactor: factors.complexityFactor,
      depreciationFactor: factors.depreciationFactor,
      conditionFactor: factors.conditionFactor,
      landValue: 25000,
    });
    expect(result.body.canonical).toEqual(expected);
    await expect(
      page.getByText(
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          expected.totalValue
        ),
        { exact: true }
      )
    ).toBeVisible();
    await page.locator('#canonical-cost-parcelId').fill('SYNTHETIC-FORGE-P2');
    await expect(page.getByText('Canonical Cost Result', { exact: true })).toHaveCount(0);
    await page.locator('#canonical-cost-parcelId').fill(parcel);
    await page.locator('#canonical-cost-squareFeet').fill('0');
    const rejected = await invoke(page, 'cost', 422);
    expect(rejected.body.code).toBe('CANONICAL_INPUT_REJECTED');
    await expect(page.getByText('Canonical Cost Result', { exact: true })).toHaveCount(0);
    await page.reload();
    await page.getByRole('button', { name: 'Parcel', exact: true }).click();
    await expect(page.getByText('Canonical Cost Result', { exact: true })).toHaveCount(0);
    await fillCost(page);
    expect((await invoke(page, 'cost')).body.canonical).toEqual(expected);
  });

  test('Income uses protected runtime numbers and exposes invalid cap-rate failure without stale success', async ({
    page,
  }) => {
    await open(page, 'income');
    await fillIncome(page);
    const result = await invoke(page, 'income');
    const expected = canonical('income', {
      schemaVersion: '1.0.0',
      parcelId: parcel,
      annualRentalIncome: 120000,
      vacancyRate: 5,
      otherIncome: 6000,
      capRate: 6,
      locationMultiplier: result.body.locationMultiplier,
      expenses: {
        propertyTaxes: 10000,
        insurance: 2000,
        utilities: 3000,
        maintenance: 4000,
        managementFees: 5000,
        replacementReserves: 5000,
        otherExpenses: 1000,
      },
    });
    expect(result.body.canonical).toEqual(expected);
    const displayed = page.getByRole('region', { name: 'Canonical Income Result' });
    await expect(displayed).toContainText(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(expected.adjustedValuation)
    );
    await page.locator('#canonical-income-capRate').fill('0');
    expect((await invoke(page, 'income', 422)).body.code).toBe('CANONICAL_INPUT_REJECTED');
    await expect(displayed).toHaveCount(0);
    await page.reload();
    await page.getByRole('button', { name: 'Calculate', exact: true }).click();
    await expect(displayed).toHaveCount(0);
    await fillIncome(page);
    expect((await invoke(page, 'income')).body.canonical).toEqual(expected);
  });

  test('a real in-flight response cannot restore results after parcel or county context changes', async ({
    page,
  }) => {
    for (const action of ['cost', 'income'] as const) {
      await open(page, action);
      await (action === 'cost' ? fillCost(page) : fillIncome(page));
      const path =
        action === 'cost'
          ? '/api/costforge/calculate'
          : '/api/costforge/income-approach/calculate-valuation';
      let release!: () => void;
      let reached!: () => void;
      let rejectReached!: (error: unknown) => void;
      const held = new Promise<void>(resolveHeld => {
        release = resolveHeld;
      });
      const actualReached = new Promise<void>((resolveReached, reject) => {
        reached = resolveReached;
        rejectReached = reject;
      });
      void actualReached.catch(() => {});
      const deadline = setTimeout(
        () => rejectReached(new Error('Real held response not received.')),
        30_000
      );
      let actualCid = '';
      const handlers: Promise<void>[] = [];
      const errors: unknown[] = [];
      await page.route(`**${path}`, route => {
        const handler = (async () => {
          // Hold delivery of a REAL backend response, never substitute a body/service.
          const actual = await route.fetch({ timeout: 25_000 });
          expect(actual.status()).toBe(200);
          const body = await actual.json();
          expect(body.provenance.sourceCommit).toBe(sourceCommit);
          actualCid = actual.headers()['x-correlation-id'];
          expect(body.provenance.requestId).toBe(actualCid);
          reached();
          await held;
          // Browser cancellation is an allowed result of invalidating this request.
          try {
            await route.fulfill({ response: actual });
          } catch (error) {
            if (!/aborted|cancelled|canceled|invalid interception/i.test(String(error)))
              throw error;
          }
        })().catch(error => {
          errors.push(error);
          rejectReached(error);
        });
        handlers.push(handler);
        return handler;
      });
      try {
        await page
          .getByRole('button', {
            name: action === 'cost' ? 'Run RCNLD' : 'Calculate Income',
            exact: true,
          })
          .click();
        await expect(
          page.getByRole('button', { name: 'Calculating...', exact: true })
        ).toBeDisabled();
        await actualReached;
        await page.evaluate(() => {
          const current = JSON.parse(localStorage.getItem('tf.session.dev')!);
          localStorage.setItem(
            'tf.session.dev',
            JSON.stringify({
              ...current,
              countyId: '22222222-2222-2222-2222-222222222222',
              parcelId: 'SYNTHETIC-FORGE-P2',
            })
          );
        });
        await page.locator(`#canonical-${action}-parcelId`).fill('SYNTHETIC-FORGE-P2');
        release();
        await Promise.all(handlers);
        if (errors.length) throw errors[0];
        await page.evaluate(
          () =>
            new Promise<void>(done =>
              requestAnimationFrame(() => requestAnimationFrame(() => done()))
            )
        );
        await expect(
          page.getByText(`Canonical ${action === 'cost' ? 'Cost' : 'Income'} Result`, {
            exact: true,
          })
        ).toHaveCount(0);
        await expect(page.getByText(`Trace: ${actualCid}`, { exact: false })).toHaveCount(0);
        await page.screenshot({ path: resolve(evidenceRoot, `${action}-context-invalidated.png`) });
      } finally {
        clearTimeout(deadline);
        release();
        await page.unrouteAll({ behavior: 'wait' });
        await Promise.all(handlers);
      }
    }
  });

  test('real missing runtime fails closed for both actions and exact artifact recovery succeeds', async ({
    page,
  }) => {
    await stop(api);
    await startApi(true);
    for (const action of ['cost', 'income'] as const) {
      await open(page, action);
      await (action === 'cost' ? fillCost(page) : fillIncome(page));
      expect((await invoke(page, action, 503)).body.code).toBe('CANONICAL_RUNTIME_UNAVAILABLE');
      await expect(
        page.getByText(`Canonical ${action === 'cost' ? 'Cost' : 'Income'} Result`, { exact: true })
      ).toHaveCount(0);
    }
    await stop(api);
    await startApi();
    await open(page, 'income');
    await fillIncome(page);
    await invoke(page, 'income');
    const foreign = await fetch(`${baseURL}/api/costforge/income-approach/calculate-valuation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-County-Id': county,
      },
      body: JSON.stringify({
        parcelId: 'SYNTHETIC-FORGE-FOREIGN',
        annualRentalIncome: 120000,
        vacancyRate: 5,
        capRate: 6,
      }),
    });
    expect([403, 404, 422]).toContain(foreign.status);
    const anonymous = await fetch(`${baseURL}/api/costforge/income-approach/calculate-valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect([401, 403]).toContain(anonymous.status);
    await stop(api);
    await fixture('VerifyForgeBrowserCalculationsDidNotSaveValues');
  });
});

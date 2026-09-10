import { expect, test, type Page } from '@playwright/test';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { connect } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertFixtureResult,
  assertNegativeProviderEnvironment,
  guardExecutionProfile,
  guardNegativeContentPath,
  guardNegativeSettingsIdentity,
  guardRunPath,
  negativeDevelopmentJson,
  negativeLocalJson,
  negativeSettingsJson,
  readLaunchIdentity,
} from '../playwright.gpt-grounded-answer.config';

// No response stubs, invented JWTs, model answers or source vectors. This suite fails rather
// than skips when real admitted runtimes/data are absent. It never starts/stops a shared provider.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const admission = Object.freeze(guardExecutionProfile(process.env));
const negativeOnly = admission.profile === 'negative-only';
const run = guardRunPath(root, process.env.GPT_EO_RUN_DIR ?? '');
const database = resolve(run, 'gpt.db');
const output = resolve(run, 'output/playwright');
const dotnet = 'C:/Program Files/dotnet/dotnet.exe';
const apiDll = resolve(root, 'backend/src/TerraFusion.API/bin/Release/net8.0/TerraFusion.API.dll');
const fixtureDll = resolve(
  root,
  'backend/tests/TerraFusion.Unit.Tests/bin/Debug/net8.0/TerraFusion.Unit.Tests.dll'
);
// Capture original admitted values once; later phases never adopt a changed disk hash or env value.
const admittedBinaryHashes = Object.freeze({
  api: process.env.GPT_EO_API_SHA256 ?? '',
  fixture: process.env.GPT_EO_FIXTURE_SHA256 ?? '',
});
const approvedSettings = negativeOnly ? guardNegativeSettingsIdentity(process.env) : undefined;
const apiContent = resolve(run, 'runtime/api-content');
const ownedAppData = resolve(run, 'appdata');
type RegistryOutput = {
  path: string;
  sha256: string;
  length: number;
  apiPid: number;
  port: number;
  fileIdentity: string;
};
type NegativeLease = {
  phase: string;
  stop: string;
  ready: string;
  exit: string;
  trx: string;
  apiPid?: number;
  port?: number;
  registry?: RegistryOutput;
};
const leases = new Map<ChildProcess, NegativeLease>();
let previousLease: { phase: string; registry: RegistryOutput } | undefined;
const uiIndex = resolve(root, 'native-shell/ui/dist/index.html');
const signingKey = randomBytes(64).toString('hex'); // Only the actual Development issuer signs JWTs.
const children = new Set<ChildProcess>();
const observed: Array<{ id: number; conversationId: number; exchange: unknown }> = [];
const negativeConversations = new Map<
  number,
  { id: number; configId: number; countyId: number; userId: string }
>();
const events: Array<Record<string, unknown>> = [];
const pending = new Set<Promise<void>>();
const runtimeValues: Record<string, string> = {
  GPT_EO_BASE_URL: 'http://127.0.0.1:5193',
  GPT_EO_FOREIGN_BASE_URL: 'http://127.0.0.1:5194',
  GPT_EO_UNAVAILABLE_BASE_URL: 'http://127.0.0.1:5195',
};
let api: ChildProcess | undefined;
let phases = 0;
let completedTests = 0;
const completedCaseNames: string[] = [];
let selectedMatrixVerified = false;
const sha = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');

function noLinks(path: string) {
  for (let current = path; ; current = dirname(current)) {
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (
      stat &&
      (stat.isSymbolicLink() ||
        realpathSync(current).toLowerCase() !== resolve(current).toLowerCase())
    )
      throw new Error('Linked runtime path refused.');
    if (current === dirname(current)) break;
  }
}
function binaryIdentity(kind: keyof typeof admittedBinaryHashes): string {
  const path = kind === 'api' ? apiDll : fixtureDll;
  noLinks(path);
  return readLaunchIdentity(admittedBinaryHashes[kind], () => readFileSync(path));
}
function writeNew(path: string, value: unknown) {
  noLinks(path);
  writeFileSync(path, JSON.stringify(value, null, 2), { flag: 'wx' });
}
function requireNegativeOriginalIdentity() {
  if (!negativeOnly || !approvedSettings) throw new Error('Original negative admission required.');
  verifyProtectedIdentity(admission.commit);
  expect(execFileSync('git', ['status', '--porcelain'], {
    cwd: root, encoding: 'utf8', windowsHide: true,
  }).trim()).toBe('');
  binaryIdentity('api');
  binaryIdentity('fixture');
  guardNegativeSettingsIdentity({
    GPT_EO_APPROVED_SETTINGS_SHA256: approvedSettings.settings,
    GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256: approvedSettings.development,
  });
}
function prepareNegativeContent() {
  if (!negativeOnly || !approvedSettings)
    throw new Error('Only the explicit negative profile can materialize negative content.');
  requireNegativeOriginalIdentity();
  guardNegativeContentPath(root, run, apiContent);
  for (const path of [
    resolve(run, 'runtime'),
    apiContent,
    ownedAppData,
    resolve(run, 'service-registry.json'),
    resolve(run, 'platform.json'),
  ]) {
    noLinks(path);
    if (existsSync(path)) throw new Error('Prior negative content/AppData must not be reused.');
  }
  // Fixed synthetic bytes only. Never read canonical settings, source-root .local.json
  // or real user secrets. External approvals remain fixed across all launches/restarts.
  const settings = Buffer.from(negativeSettingsJson, 'utf8');
  const development = Buffer.from(negativeDevelopmentJson, 'utf8');
  const marker = readFileSync(apiDll);
  readLaunchIdentity(admittedBinaryHashes.api, () => marker);
  mkdirSync(resolve(run, 'runtime')); // Explicit fresh parent; no recursive adoption.
  guardNegativeContentPath(root, run, apiContent);
  mkdirSync(apiContent);
  guardNegativeContentPath(root, run, apiContent);
  for (const [name, bytes] of [
    ['TerraFusion.API.dll', marker],
    ['appsettings.json', settings],
    ['appsettings.Development.json', development],
    ['appsettings.Development.local.json', negativeLocalJson],
  ] as const)
    writeFileSync(resolve(apiContent, name), bytes, { flag: 'wx' });
  const secretDirectory = resolve(ownedAppData, 'Microsoft/UserSecrets/terrafusion-api-secrets');
  mkdirSync(secretDirectory, { recursive: true });
  writeFileSync(resolve(secretDirectory, 'secrets.json'), '{}\n', { flag: 'wx' });
  events.push({
    operation: 'owned-negative-content-materialized',
    root: apiContent,
    settingsSha256: approvedSettings.settings,
    developmentSha256: approvedSettings.development,
    markerSha256: admittedBinaryHashes.api,
    lateSha256: sha(negativeLocalJson),
    emptySecretSha256: sha('{}\n'),
    settingsProfile: 'synthetic-negative-only',
    auditDatabaseLoggingChange: 'canonical-Development-false-to-owned-profile-true',
    realProviderAcceptance: 'NOT_RUN',
  });
}
function environment(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ['SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'USERPROFILE', 'DOTNET_ROOT'])
    if (process.env[key]) env[key] = process.env[key];
  env[process.platform === 'win32' ? 'Path' : 'PATH'] = [
    'C:/Users/bsval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin',
    'C:/Windows/System32',
    'C:/Windows',
    'C:/Program Files/Git/cmd',
    'C:/Program Files/Git/bin',
    'C:/Program Files/dotnet',
  ].join(process.platform === 'win32' ? ';' : ':');
  return {
    ...env,
    TEMP: run,
    TMP: run,
    DOTNET_NOLOGO: '1',
    DOTNET_CLI_USE_MSBUILD_SERVER: '0',
    MSBUILDDISABLENODEREUSE: '1',
    UseSharedCompilation: 'false',
    ...extra,
  };
}

function registryOutput(apiPid: number, port: number): RegistryOutput {
  guardNegativeContentPath(root, run, apiContent);
  const path = resolve(run, 'service-registry.json');
  const platform = resolve(run, 'platform.json');
  noLinks(platform);
  if (existsSync(platform)) throw new Error('Owned platform input must remain absent.');
  noLinks(path);
  const stat = lstatSync(path, { bigint: true });
  if (
    !stat.isFile() ||
    stat.size <= 0n ||
    stat.size > 65536n ||
    realpathSync(path).toLowerCase() !== path.toLowerCase()
  )
    throw new Error('Bounded regular owned registry output required.');
  const bytes = readFileSync(path);
  const registry = JSON.parse(bytes.toString('utf8'));
  const backend = registry.Services?.backend;
  if (
    !Number.isSafeInteger(apiPid) ||
    apiPid <= 0 ||
    ![5193, 5194, 5195].includes(port) ||
    Object.keys(registry.Services ?? {}).join(',') !== 'backend' ||
    backend?.Name !== 'backend' ||
    backend.Pid !== apiPid ||
    backend.Port !== port ||
    backend.Status !== 'running' ||
    backend.Url !== 'http://localhost:' + port
  )
    throw new Error('Actual backend registry PID/port does not match the owned API.');
  return {
    path,
    sha256: sha(bytes),
    length: bytes.length,
    apiPid,
    port,
    fileIdentity: `${stat.dev}:${stat.ino}:${stat.birthtimeNs}`,
  };
}

function requireRegistryBeforeLaunch() {
  guardNegativeContentPath(root, run, apiContent);
  for (const path of [resolve(run, 'platform.json'), resolve(run, 'service-registry.json')])
    noLinks(path);
  if (existsSync(resolve(run, 'platform.json'))) throw new Error('Owned platform input refused.');
  if (!previousLease) {
    if (existsSync(resolve(run, 'service-registry.json')))
      throw new Error('First launch registry must be absent.');
  } else {
    expect(registryOutput(previousLease.registry.apiPid, previousLease.registry.port)).toEqual(
      previousLease.registry
    );
  }
}

async function observeNegativeRegistry(child: ChildProcess) {
  const lease = leases.get(child);
  if (!lease || lease.apiPid === undefined || lease.port === undefined)
    throw new Error('Actual admitted API PID and port required before registry observation.');
  // Startup registers asynchronously. Poll only while the output is absent, being written,
  // or still the exact previous receipt; unrelated/invalid semantic output fails closed.
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null)
      throw new Error('Lease exited before registry observation.');
    const path = resolve(run, 'service-registry.json');
    guardNegativeContentPath(root, run, apiContent);
    noLinks(path);
    if (existsSync(path)) {
      try {
        const stat = lstatSync(path);
        if (!stat.isFile() || stat.size > 65536)
          throw new Error('Bounded regular registry output required.');
        const bytes = readFileSync(path);
        if (bytes.length > 0 && (!previousLease || sha(bytes) !== previousLease.registry.sha256)) {
          lease.registry = registryOutput(lease.apiPid, lease.port);
          events.push({
            operation: 'actual-negative-registry-output',
            phase: lease.phase,
            ...lease.registry,
          });
          return;
        }
      } catch (error) {
        if (
          !(error instanceof SyntaxError) &&
          !['EBUSY', 'EACCES', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '')
        )
          throw error;
      }
    }
    await new Promise(resolveDone => setTimeout(resolveDone, 100));
  }
  throw new Error(
    'Actual owned registry registration was not observed; readiness alone is insufficient.'
  );
}
function launch(executable: string, args: string[], env = environment(), cwd = root) {
  const child = spawn(executable, args, {
    cwd,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  let text = '';
  let failed = false;
  for (const stream of [child.stdout, child.stderr])
    stream?.on('data', (bytes: Buffer) => {
      text = (text + bytes.toString('utf8')).slice(-16000);
    });
  child.on('error', () => {
    failed = true;
  });
  return {
    child,
    failed: () => failed,
    output: () =>
      text
        .replaceAll(signingKey, '[redacted]')
        .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted bearer]')
        .replace(/Authorization[^\r\n]*/gi, 'Authorization [redacted]'),
  };
}
async function waitExit(child: ChildProcess, milliseconds: number): Promise<boolean> {
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
    const timer = setTimeout(() => finish(false), milliseconds);
    child.once('exit', done);
    child.once('error', failed);
  });
}
async function stopApi(child = api) {
  if (!child) return;
  if (!children.has(child)) throw new Error('Refusing an unowned process stop.');
  const lease = leases.get(child);
  if (lease && !existsSync(lease.stop)) writeNew(lease.stop, { reason: 'owned-harness-shutdown' });
  const leaseExited = lease ? await waitExit(child, 25000) : false;
  if (child.pid && child.exitCode === null && child.signalCode === null) {
    if (process.platform === 'win32') {
      const killer = spawn(
        'C:/Windows/System32/taskkill.exe',
        ['/PID', String(child.pid), '/T', '/F'],
        { windowsHide: true, env: environment(), stdio: 'ignore' }
      );
      if (!(await waitExit(killer, 10000))) {
        killer.kill();
        await waitExit(killer, 5000);
        throw new Error('Owned shutdown helper timed out.');
      }
      if (killer.exitCode !== 0 && child.exitCode === null && child.signalCode === null)
        throw new Error('Owned process shutdown failed.');
    } else child.kill('SIGTERM');
    if (!(await waitExit(child, 10000))) throw new Error('Owned process did not exit.');
  }
  events.push({
    operation: 'owned-process-exit',
    pid: child.pid,
    exitCode: child.exitCode,
    signal: child.signalCode,
  });
  children.delete(child);
  if (child === api) api = undefined;
  if (lease) {
    leases.delete(child);
    if (!leaseExited || !existsSync(lease.exit))
      throw new Error('Lease shutdown failed; negative matrix is invalid.');
    noLinks(lease.exit);
    noLinks(lease.trx);
    const receipt = JSON.parse(readFileSync(lease.exit, 'utf8'));
    if (receipt.allJobProcessesExited !== true || receipt.jobExitedBeforeLeaseRelease !== true)
      throw new Error('Owned job exit was not verified before lease release.');
    if (!lease.registry || receipt.apiPid !== lease.apiPid)
      throw new Error('Actual live registry observation and API identity required for closure.');
    const actualRegistry = registryOutput(lease.registry.apiPid, lease.registry.port);
    expect(actualRegistry).toEqual(lease.registry);
    const { fileIdentity, ...fixtureRegistry } = actualRegistry;
    expect(receipt.registry).toMatchObject(fixtureRegistry);
    expect(fileIdentity).toBe(lease.registry.fileIdentity);
    assertFixtureResult(
      child.exitCode,
      existsSync(lease.trx) ? readFileSync(lease.trx, 'utf8') : ''
    );
    events.push({
      operation: 'negative-lease-exit',
      ...receipt,
      trxSha256: sha(readFileSync(lease.trx)),
    });
    // The retained file says "running", but this receipt proves its process exited. It is
    // stale output custody for the next same-run restart, never a live-service assertion.
    previousLease = { phase: lease.phase, registry: actualRegistry };
  }
}

async function launchNegativeApi(port: number) {
  if (!negativeOnly || !approvedSettings || ![5193, 5194, 5195].includes(port))
    throw new Error('Owned negative launch required.');
  requireNegativeOriginalIdentity();
  requireRegistryBeforeLaunch();
  const phase = 'lease-' + randomBytes(16).toString('hex');
  const receipt: NegativeLease = {
    phase,
    stop: resolve(run, phase + '-stop.json'),
    ready: resolve(run, phase + '-ready.json'),
    exit: resolve(run, phase + '-exit.json'),
    trx: resolve(run, phase + '.trx'),
  };
  for (const path of [receipt.stop, receipt.ready, receipt.exit, receipt.trx])
    if (existsSync(path)) throw new Error('Prior lease evidence refused.');
  const fixtureSha256 = binaryIdentity('fixture');
  binaryIdentity('api');
  const running = launch(
    dotnet,
    [
      'vstest',
      fixtureDll,
      '/TestCaseFilter:FullyQualifiedName=TerraFusion.Unit.Tests.Gpt.GptGroundedAnswerBrowserFixtureTests.PrepareOrVerifyNegativeOnlyBrowserDatabase',
      '/Logger:trx;LogFileName=' + phase + '.trx',
      '/ResultsDirectory:' + run,
    ],
    environment({
      GPT_EO_RUNTIME: 'owned',
      GPT_EO_PROFILE: 'negative-only',
      GPT_EO_PROVIDER_POLICY: 'forbidden',
      GPT_EO_DATABASE_PATH: database,
      GPT_EO_FIXTURE_MODE: 'launch',
      GPT_EO_FIXTURE_PHASE: phase,
      GPT_EO_API_PORT: String(port),
      GPT_EO_PARENT_PID: String(process.pid),
      ...(previousLease ? { GPT_EO_PREVIOUS_LEASE_PHASE: previousLease.phase } : {}),
      GPT_EO_SIGNING_KEY: signingKey,
      GPT_EO_API_SHA256: admittedBinaryHashes.api,
      GPT_EO_FIXTURE_SHA256: admittedBinaryHashes.fixture,
      GPT_EO_EXPECTED_OS_COMMIT: admission.commit,
      GPT_EO_APPROVED_SETTINGS_SHA256: approvedSettings.settings,
      GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256: approvedSettings.development,
      APPDATA: ownedAppData,
      ASPNETCORE_PREVENTHOSTINGSTARTUP: 'true',
    })
  );
  api = running.child; // Owned wrapper; fixture owns the exact job-bound API process below it.
  leases.set(api, receipt);
  writeNew(resolve(run, phase + '-owner.json'), { wrapperPid: api.pid, harnessPid: process.pid });
  api.once('exit', () => {
    // A runner exit cannot leave its fixture holding an accepted runtime. Mark refusal immediately;
    // fixture also watches this wrapper identity, and kernel job lifetime follows the fixture.
    if (!existsSync(receipt.stop)) writeNew(receipt.stop, { reason: 'wrapper-exit' });
  });
  const deadline = Date.now() + 60000;
  let captured: any;
  while (!captured) {
    if (
      running.failed() ||
      api.exitCode !== null ||
      api.signalCode !== null ||
      Date.now() > deadline
    )
      throw new Error('Negative lease did not admit API creation. No readiness HTTP attempted.');
    if (existsSync(receipt.ready)) {
      noLinks(receipt.ready);
      try {
        captured = JSON.parse(readFileSync(receipt.ready, 'utf8'));
      } catch (error) {
        // FileShare.None holds the receipt during serialization; only a sharing refusal is retryable.
        if (!['EBUSY', 'EACCES', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? ''))
          throw error;
      }
    }
    if (captured) break;
    await new Promise(resolveDone => setTimeout(resolveDone, 100));
  }
  if (
    api.exitCode !== null ||
    api.signalCode !== null ||
    captured.root !== apiContent ||
    captured.database !== database ||
    captured.port !== String(port) ||
    captured.enabled !== false ||
    captured.openTelemetryEnabled !== false ||
    !Number.isSafeInteger(captured.apiPid) ||
    captured.apiPid <= 0 ||
    captured.endpoint !== '' ||
    captured.model !== '' ||
    captured.embeddingModel !== '' ||
    captured.dimensions !== 0 ||
    captured.resolvedSecretPath !==
      resolve(ownedAppData, 'Microsoft/UserSecrets/terrafusion-api-secrets/secrets.json') ||
    captured.emptySecretSha256 !== sha('{}\n') ||
    captured.hashes?.['TerraFusion.API.dll'] !== admittedBinaryHashes.api ||
    captured.hashes?.['appsettings.json'] !== approvedSettings.settings ||
    captured.hashes?.['appsettings.Development.json'] !== approvedSettings.development ||
    captured.hashes?.['appsettings.Development.local.json'] !== sha(negativeLocalJson) ||
    captured.sourceCommit !== admission.commit ||
    captured.fixtureSha256 !== admittedBinaryHashes.fixture ||
    captured.startup?.sovereignRoot !== root ||
    captured.startup?.issuer !== 'TerraFusion.API' ||
    captured.startup?.audience !== 'TerraFusion.Client' ||
    captured.startup?.auditLogToDatabase !== true ||
    captured.startup?.registrationIntentOnly !== true
  )
    throw new Error('Negative lease/captured configuration receipt refused before HTTP.');
  expect(captured.startup).toEqual({
    sovereignRoot: root, issuer: 'TerraFusion.API', audience: 'TerraFusion.Client', expirationMinutes: 120,
    defaultConnection: 'Data Source=' + database,
    levyConnection: 'Data Source=' + resolve(run, 'levy.db'),
    auditEnabled: true, auditLogToDatabase: true, auditLogToFile: true,
    runtimes: Object.fromEntries(['AtlasProjection', 'DaisAppealWorkflow', 'DossierEvidenceRegistryRead',
      'DaisAppealMutation', 'DossierMutation', 'GptGroundedContextRuntime', 'GptGroundedAnswerRuntime']
      .map(name => [name, { mode: 'LocalExact', timeoutSeconds: 30 }])),
    registrationIntentOnly: true,
  });
  receipt.apiPid = captured.apiPid;
  receipt.port = port;
  events.push({ operation: 'negative-lease-admitted', phase, fixtureSha256, ...captured });
  return running;
}
async function unbound(port: number) {
  // No listener is ever created here, including the deliberately unbound failure target5196.
  await new Promise<void>((resolveDone, reject) => {
    const socket = connect({ host: '127.0.0.1', port });
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      reject(new Error('Reserved port occupied: ' + port));
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('Port availability unknown: ' + port));
    });
    socket.once('error', error => {
      socket.destroy();
      if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') resolveDone();
      else reject(new Error('Port availability unknown: ' + port));
    });
  });
}
async function fixture(mode: 'seed' | 'snapshot' | 'verify', name: string) {
  if (negativeOnly) requireNegativeOriginalIdentity();
  const trx = resolve(run, 'fixture-' + name + '.trx');
  if (existsSync(trx)) throw new Error('Existing fixture evidence will not be overwritten.');
  const binarySha256 = binaryIdentity('fixture');
  const running = launch(
    dotnet,
    [
      'vstest',
      fixtureDll,
      '/TestCaseFilter:FullyQualifiedName=TerraFusion.Unit.Tests.Gpt.GptGroundedAnswerBrowserFixtureTests.' +
        (negativeOnly
          ? 'PrepareOrVerifyNegativeOnlyBrowserDatabase'
          : 'PrepareOrVerifyOwnedBrowserDatabase'),
      '/Logger:trx;LogFileName=fixture-' + name + '.trx',
      '/ResultsDirectory:' + run,
    ],
    environment({
      GPT_EO_DATABASE_PATH: database,
      GPT_EO_FIXTURE_MODE: mode,
      GPT_EO_FIXTURE_PHASE: name,
      GPT_EO_RUNTIME: 'owned',
      ...(negativeOnly
        ? {
            GPT_EO_PROFILE: 'negative-only',
            GPT_EO_PROVIDER_POLICY: 'forbidden',
          }
        : {
            GPT_EO_ADMISSION: 'admitted',
            GPT_EO_ENDPOINT: admission.endpoint,
            GPT_EO_ADMITTED_MODEL: admission.model,
            GPT_EO_EMBEDDING_MODEL: admission.embeddingModel,
            GPT_EO_EMBEDDING_DIMENSIONS: String(admission.dimensions),
          }),
    })
  );
  events.push({
    operation: 'actual-fixture-start',
    mode,
    phase: name,
    pid: running.child.pid,
    binarySha256,
  });
  try {
    if (!(await waitExit(running.child, mode === 'seed' ? 180000 : 60000)) || running.failed())
      throw new Error('Owned fixture failed to finish.');
    const result = existsSync(trx) ? readFileSync(trx, 'utf8') : '';
    assertFixtureResult(running.child.exitCode, result);
    events.push({
      operation: 'fixture-' + mode,
      phase: name,
      exitCode: running.child.exitCode,
      trxSha256: sha(result),
      binarySha256,
    });
  } finally {
    await stopApi(running.child);
  }
  if (mode !== 'seed')
    return JSON.parse(readFileSync(resolve(run, 'snapshot-' + name + '.json'), 'utf8'));
}
async function snapshot(label: string) {
  return fixture('snapshot', 'p' + ++phases + '-' + label);
}
function unchangedSuccess(before: any, after: any) {
  expect(after.messageIds).toEqual(before.messageIds);
  expect(after.serviceAuditIds).toEqual(before.serviceAuditIds);
  expect(after.answeredIds).toEqual(before.answeredIds);
  expect(after.usageCount).toBe(0);
  expect(after.vectorSha256).toBe(before.vectorSha256);
  expect(after.prerequisiteAuditCount).toBe(before.prerequisiteAuditCount);
  expect(after.actualAuditCount).toBeGreaterThanOrEqual(before.actualAuditCount);
}
async function startApi(kind: 'primary' | 'foreign' | 'unavailable') {
  if (api) throw new Error('Only one GPT API at a time.');
  const base =
    kind === 'primary'
      ? runtimeValues.GPT_EO_BASE_URL
      : kind === 'foreign'
        ? runtimeValues.GPT_EO_FOREIGN_BASE_URL
        : runtimeValues.GPT_EO_UNAVAILABLE_BASE_URL;
  await unbound(Number(new URL(base).port));
  if (!negativeOnly && kind === 'unavailable') await unbound(5196);
  const localOptions: Record<string, string> = negativeOnly
    ? {
        OpenTelemetry__Enabled: 'false',
        GptLocalInference__Enabled: 'false',
        GptLocalInference__Endpoint: '',
        GptLocalInference__Model: '',
        GptLocalInference__EmbeddingModel: '',
        GptLocalInference__EmbeddingDimensions: '0',
      }
    : {
        GptLocalInference__Enabled: 'true',
        GptLocalInference__Endpoint:
          kind === 'unavailable' ? 'http://127.0.0.1:5196/' : admission.endpoint,
        GptLocalInference__Model: admission.model,
        GptLocalInference__EmbeddingModel: admission.embeddingModel,
        GptLocalInference__EmbeddingDimensions: String(admission.dimensions),
        GptLocalInference__TimeoutSeconds: '120',
      };
  const childEnvironment = environment({
    ASPNETCORE_ENVIRONMENT: 'Development',
    ASPNETCORE_URLS: base,
    DatabaseProvider: 'SQLite',
    ConnectionStrings__DefaultConnection: 'Data Source=' + database,
    ConnectionStrings__LevyDatabase: 'Data Source=' + resolve(run, 'levy.db'),
    TF_SKIP_DEV_SEEDERS: '1',
    TF_SKIP_DOCTRINE_SEEDERS: '1',
    TF_SKIP_AUTO_MIGRATE: 'true',
    TF_DISABLE_DEV_PIPELINE: '1',
    HarrisPACS__BackgroundSync__Enabled: 'false',
    TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC: 'false',
    LegacyArcGisSync__Enabled: 'false',
    TF_ENABLE_LEGACY_ARCGIS_SYNC: 'false',
    TERRAFUSION_UI_DIST_PATH: resolve(root, 'native-shell/ui/dist'),
    GptGroundedContextRuntime__Mode: 'LocalExact',
    GptGroundedAnswerRuntime__Mode: 'LocalExact',
    ...localOptions,
    DefaultCounty__Id: kind === 'foreign' ? '99' : '42',
    DefaultCounty__Code: 'benton',
    JwtSettings__SecretKey: signingKey,
    Logging__Console__FormatterName: 'json',
  });
  if (negativeOnly) assertNegativeProviderEnvironment(childEnvironment);
  const binarySha256 = binaryIdentity('api');
  const running = negativeOnly
    ? await launchNegativeApi(Number(new URL(base).port))
    : launch(
        dotnet,
        [apiDll, '--skip-dev-seeders'],
        childEnvironment,
        resolve(root, 'backend/src/TerraFusion.API')
      );
  api = running.child;
  events.push({
    operation: 'actual-api-start',
    kind,
    profile: admission.profile,
    pid: api.pid,
    binarySha256,
  });
  const deadline = Date.now() + 90000;
  let readyObserved = false;
  while (Date.now() < deadline) {
    if (running.failed() || api.exitCode !== null)
      throw new Error('Actual API startup failed: ' + running.output());
    try {
      const ready = await fetch(base + '/api/auth/dev-token', {
        signal: AbortSignal.timeout(1500),
        redirect: 'error',
      });
      if (ready.ok) {
        // Keep registry verification outside the readiness-only transport catch below.
        readyObserved = true;
        break;
      }
    } catch {
      /* Readiness only; no provider request. */
    }
    await new Promise(resolveDone => setTimeout(resolveDone, 300));
  }
  if (!readyObserved) throw new Error('Actual API readiness timed out: ' + running.output());
  if (negativeOnly) await observeNegativeRegistry(api);
}
function checkIssuedClaims(token: string, county: string) {
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  expect(String(claims.countyId ?? claims.CountyId)).toBe(county);
  expect(
    claims.sub ?? claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
  ).toBe('dev-user-001');
}
async function screenshot(page: Page, name: string) {
  const path = resolve(output, name + '.png');
  if (existsSync(path)) throw new Error('Prior screenshot will not be overwritten.');
  await page.screenshot({ path, fullPage: false }); // Synthetic UI only, no token/devtools panes.
}

test.beforeAll(async () => {
  if (process.env.GPT_EO_SOURCE_GUARDS === '1')
    throw new Error('Source guard mode cannot run acceptance.');
  if (negativeOnly) requireNegativeOriginalIdentity();
  else verifyProtectedIdentity();
  for (const path of [
    database,
    resolve(run, 'fixture-receipt.json'),
    resolve(run, 'run-owner.json'),
    resolve(output, 'evidence.json'),
  ])
    if (existsSync(path)) throw new Error('Existing acceptance data/evidence will not be reused.');
  noLinks(run);
  mkdirSync(output, { recursive: true });
  writeNew(resolve(run, 'run-owner.json'), { pid: process.pid, commit: admission.commit });
  expect(
    execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    }).trim()
  ).toBe('');
  expect(
    execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    }).trim()
  ).toBe(admission.commit);
  for (const [key, path] of [
    ['GPT_EO_API_SHA256', apiDll],
    ['GPT_EO_FIXTURE_SHA256', fixtureDll],
    ['GPT_EO_UI_INDEX_SHA256', uiIndex],
  ]) {
    noLinks(path);
    expect(required(key)).toMatch(/^[a-f0-9]{64}$/);
    expect(sha(readFileSync(path))).toBe(required(key));
  }
  events.push({
    operation: 'actual-identity',
    commit: admission.commit,
    apiSha256: sha(readFileSync(apiDll)),
    fixtureSha256: sha(readFileSync(fixtureDll)),
    uiIndexSha256: sha(readFileSync(uiIndex)),
  });
  // Negative-only never contacts5196 or any provider endpoint, even to check availability.
  if (negativeOnly) prepareNegativeContent();
  for (const port of negativeOnly ? [5193, 5194, 5195] : [5193, 5194, 5195, 5196])
    await unbound(port);
  await fixture('seed', 'seed');
  const receipt = JSON.parse(readFileSync(resolve(run, 'fixture-receipt.json'), 'utf8'));
  if (negativeOnly) {
    expect(receipt.profile).toBe('negative-only');
    expect(receipt.providerPolicy).toBe('forbidden');
    expect(receipt.primaryConfigId).toBe(7101);
    expect(receipt.foreignConfigId).toBe(7103);
    runtimeValues.GPT_EO_GROUNDED_CONFIG_ID = String(receipt.primaryConfigId);
  } else {
    expect(receipt.model).toBe(admission.model);
    expect(receipt.embeddingModel).toBe(admission.embeddingModel);
    expect(receipt.dimensions).toBe(admission.dimensions);
    runtimeValues.GPT_EO_GROUNDED_CONFIG_ID = String(receipt.groundedConfigId);
    runtimeValues.GPT_EO_EMPTY_CONFIG_ID = String(receipt.emptyConfigId);
    runtimeValues.GPT_EO_EXPECTED_SOURCE_TEXT = receipt.sourceText;
    runtimeValues.GPT_EO_EXPECTED_ANSWER_FRAGMENT = receipt.expectedAnswerFragment;
  }
  const initial = await snapshot('initial');
  expect(initial.messageIds).toEqual([]);
  expect(initial.serviceAuditIds).toEqual([]);
  expect(negativeOnly ? initial.conversations : initial.conversationIds).toEqual([]);
  await startApi('foreign');
  const issued = await fetch(runtimeValues.GPT_EO_FOREIGN_BASE_URL + '/api/auth/dev-token');
  expect(issued.status).toBe(200);
  const { token } = await issued.json();
  checkIssuedClaims(token, '99');
  const created = await fetch(runtimeValues.GPT_EO_FOREIGN_BASE_URL + '/api/gpt/conversations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gptConfigId: receipt.foreignConfigId,
      title: 'Synthetic foreign positive control',
    }),
  });
  expect(created.status).toBe(201);
  const foreignConversation = await created.json();
  runtimeValues.GPT_EO_FOREIGN_CONVERSATION_ID = String(foreignConversation.id);
  if (negativeOnly) rememberNegativeConversation(foreignConversation);
  await stopApi();
  await startApi('primary');
});
test.beforeEach(async ({ page }) => {
  page.on('response', response => {
    if (
      negativeOnly &&
      /\/api\/gpt\/conversations$/i.test(response.url()) &&
      response.request().method() === 'POST' &&
      response.status() === 201
    ) {
      const created = response.json().then(rememberNegativeConversation);
      pending.add(created);
      void created.catch(() => {});
      return;
    }
    if (
      !/\/api\/gpt\/conversations\/\d+\/messages$/i.test(response.url()) ||
      response.request().method() !== 'POST'
    )
      return;
    const promise = (async () => {
      events.push({
        operation: 'actual-gpt-http',
        status: response.status(),
        cid: response.headers()['x-correlation-id'] ?? null,
        timing: response.request().timing(),
      });
      if (response.status() !== 200) return;
      const message = await response.json();
      if (message.functionResult && Number.isSafeInteger(message.id))
        observed.push({
          id: message.id,
          conversationId: message.conversationId,
          exchange: JSON.parse(message.functionResult),
        });
    })();
    pending.add(promise);
    // Attach an immediate handler to avoid unhandled-rejection races. afterEach awaits the
    // ORIGINAL promise and fails on the error; this does not turn collection failure green.
    void promise.catch(() => {});
  });
});
test.afterEach(async ({}, info) => {
  await Promise.all(pending);
  pending.clear();
  if (info.status === 'passed') {
    completedTests++;
    completedCaseNames.push(info.title);
  }
});
test.afterAll(async () => {
  try {
    for (const child of [...children]) await stopApi(child);
    if (completedTests === 4) {
      if (negativeOnly) {
        writeNew(
          resolve(run, 'observed-negative-conversations.json'),
          [...negativeConversations.values()].sort((left, right) => left.id - right.id)
        );
      } else {
        writeNew(resolve(run, 'observed-messages.json'), observed);
      }
      await fixture('verify', 'final');
      selectedMatrixVerified = true;
      events.push({
        operation: negativeOnly
          ? 'negative-empty-state-verification'
          : 'actual-persistence-verification',
        status: 'passed',
      });
    }
  } finally {
    if (existsSync(resolve(run, 'run-owner.json')))
      writeNew(resolve(output, 'evidence.json'), {
        commit: admission.commit,
        profile: admission.profile,
        matrix: negativeOnly ? 'negative-only-local-no-provider' : 'mandatory-real-provider',
        realProviderAcceptance: negativeOnly ? 'NOT_RUN' : 'SEE_ACTUAL_CASE_RESULTS',
        fullEoComplete: false,
        selectedMatrixVerified,
        expectedCases: 4,
        completedTests,
        completedCaseNames,
        events,
      });
  }
});
function required(name: string): string {
  const value = runtimeValues[name] ?? process.env[name];
  if (!value)
    throw new Error(
      `Real GPT acceptance requires explicit ${name}; no fixture substitution is permitted.`
    );
  return value;
}
function localUrl(name: string): string {
  const url = new URL(required(name));
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('Acceptance must target an explicitly admitted owned loopback application.');
  }
  return url.origin;
}
function id(name: string): number {
  const value = Number(required(name));
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`Invalid synthetic fixture identity: ${name}`);
  return value;
}

function verifyProtectedIdentity(expected = required('GPT_EO_EXPECTED_OS_COMMIT')) {
  const actual = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
  expect(actual, 'Record the exact candidate/protected OS identity for each acceptance run').toBe(
    expected
  );
  const slot = resolve(root, '.terrafusion/runtime/gpt/grounded-answer');
  noLinks(slot);
  const adoption = JSON.parse(readFileSync(resolve(slot, 'adoption.json'), 'utf8'));
  expect(adoption.sourceCommit).toBe('afbcba88c7606e78d3705010b39bcb0527270134');
  expect(adoption.contract).toBe('gpt.grounded-answer@1.0.0');
  expect(adoption.repository).toBe('bsvalues/terrafusion-gpt');
  const manifestPath = resolve(slot, 'canon/GPT_GROUNDED_ANSWER_EXECUTION_MANIFEST.json');
  noLinks(manifestPath);
  const manifestBytes = readFileSync(manifestPath);
  expect(manifestBytes.length).toBe(1197);
  expect(sha(manifestBytes)).toBe(
    'cd5c413b0141712dfa4011c48fe5f5eb14e927b0cbbbac15f4e017485c50d853'
  );
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  expect(manifest.artifacts.length).toBe(4);
  for (const artifact of manifest.artifacts) {
    const path = resolve(slot, artifact.path);
    noLinks(path);
    const bytes = readFileSync(path);
    expect(bytes.length).toBe(artifact.length);
    expect(sha(bytes)).toBe(artifact.sha256);
  }
  const specification = readFileSync(
    resolve(slot, 'operations/work-orders/EO-TF-GPT-GROUNDED-RUNTIME-001.md')
  );
  expect(createHash('sha256').update(specification).digest('hex')).toBe(
    '880f16bf0722732c46cf2d2dc9d4dbf8cdcb29dbb22cbc11a15700c91d38bd82'
  );
  expect(adoption.specificationSha256).toBe(sha(specification));
}

async function open(page: Page, base: string, configId: number): Promise<void> {
  const response = await page.request.get(`${base}/api/auth/dev-token`);
  expect(
    response.status(),
    'Use the existing Development issuer, never synthesize credentials'
  ).toBe(200);
  const issued = await response.json();
  if (typeof issued.token !== 'string' || issued.token.length < 20)
    throw new Error('Development issuer unavailable.');
  checkIssuedClaims(issued.token, base === runtimeValues.GPT_EO_FOREIGN_BASE_URL ? '99' : '42');
  await page.addInitScript(value => localStorage.setItem('authToken', value), issued.token);
  await page.goto(`${base}/gpt?view=studio&gptId=${configId}`);
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
}

if (!negativeOnly) {
  test('actual local source-grounded answer persists, reopens, and retains exact CID/source trace', async ({
    page,
  }) => {
    await open(page, localUrl('GPT_EO_BASE_URL'), id('GPT_EO_GROUNDED_CONFIG_ID'));
    const reply = page.waitForResponse(
      response =>
        /\/api\/gpt\/conversations\/\d+\/messages$/i.test(response.url()) &&
        response.request().method() === 'POST'
    );
    await page
      .getByPlaceholder(/^Message /)
      .fill(
        'For the synthetic EO reference parcel, what inspection interval does the supplied source specify?'
      );
    await page.getByRole('button', { name: 'Send message' }).click();
    const response = await reply;
    expect(response.status()).toBe(200);
    const message = await response.json();
    const envelope = JSON.parse(message.functionResult);
    expect(envelope.result.status).toBe('ANSWERED');
    expect(response.headers()['x-correlation-id']).toBe(envelope.result.traceId);
    expect(envelope.result.provider).toBe('ollama');
    expect(envelope.result.model).toBe(required('GPT_EO_ADMITTED_MODEL'));
    expect(envelope.result.answer.length).toBeGreaterThan(0);
    expect(envelope.result.answer).toContain(required('GPT_EO_EXPECTED_ANSWER_FRAGMENT'));
    expect(envelope.result.citations.length).toBeGreaterThan(0);
    for (const citation of envelope.result.citations) {
      expect(
        envelope.context.result.citations.some(
          (source: { sourceId: string; chunkId: string }) =>
            source.sourceId === citation.sourceId && source.chunkId === citation.chunkId
        )
      ).toBe(true);
    }
    const card = page
      .getByTestId('gpt-grounded-answer')
      .filter({ hasText: envelope.result.traceId });
    await expect(card).toHaveAttribute('data-status', 'ANSWERED');
    await expect(card).toContainText(required('GPT_EO_EXPECTED_SOURCE_TEXT'));
    await expect(card).toContainText(required('GPT_EO_ADMITTED_MODEL'));
    await expect(page).toHaveURL(/conversationId=\d+/);
    await screenshot(page, 'answer');
    await page.reload();
    await expect(
      page.getByTestId('gpt-grounded-answer').filter({ hasText: envelope.result.traceId })
    ).toContainText(envelope.result.answer);
    const beforeRestart = await snapshot('before-restart');
    await stopApi();
    await startApi('primary');
    await page.reload();
    await expect(
      page.getByTestId('gpt-grounded-answer').filter({ hasText: envelope.result.traceId })
    ).toContainText(envelope.result.answer);
    unchangedSuccess(beforeRestart, await snapshot('after-restart'));
    await screenshot(page, 'restart-retained');
    // Fetch through the real browser's authenticated client context without returning/logging the token.
    const trace = await page.evaluate(async conversationId => {
      const result = await fetch(`/api/gpt/conversations/${conversationId}/trace`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      return { status: result.status, body: await result.json() };
    }, message.conversationId);
    expect(trace.status).toBe(200);
    expect(
      trace.body.messages.find((entry: { id: number }) => entry.id === message.id).groundedExchange
    ).toEqual(envelope);
    // Switch through the actual product selector, not a mocked county/config provider.
    await page.getByTestId('gpt-picker').selectOption(String(id('GPT_EO_EMPTY_CONFIG_ID')));
    await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
    await expect(page.getByText(envelope.result.answer, { exact: true })).toHaveCount(0);
    await expect(page).not.toHaveURL(new RegExp(`conversationId=${message.conversationId}(?:&|$)`));
    await page.getByPlaceholder(/^Message /).fill('What does the new empty dataset say?');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByTestId('gpt-grounded-answer')).toHaveAttribute(
      'data-status',
      'NO_RELEVANT_CONTEXT'
    );
    await expect(page.getByText(envelope.result.answer, { exact: true })).toHaveCount(0);
    await screenshot(page, 'empty-switch');
  });

  test('actual empty admitted dataset yields no context and no model answer', async ({ page }) => {
    await open(page, localUrl('GPT_EO_BASE_URL'), id('GPT_EO_EMPTY_CONFIG_ID'));
    await page
      .getByPlaceholder(/^Message /)
      .fill('What does the synthetic empty reference dataset say about inspection?');
    await page.getByRole('button', { name: 'Send message' }).click();
    const card = page.getByTestId('gpt-grounded-answer');
    await expect(card).toHaveAttribute('data-status', 'NO_RELEVANT_CONTEXT');
    await expect(card).toContainText('No relevant context');
    await expect(card).toContainText('CID:');
    await expect(card.getByRole('region', { name: 'Answer sources' })).toHaveCount(0);
    await screenshot(page, 'empty-dataset');
  });

  test('foreign conversation cannot disclose history or trace', async ({ page }) => {
    const beforeDenied = await snapshot('before-denied');
    await stopApi();
    await startApi('foreign');
    const foreignBase = localUrl('GPT_EO_FOREIGN_BASE_URL');
    const foreignId = id('GPT_EO_FOREIGN_CONVERSATION_ID');
    const issued = await page.request.get(`${foreignBase}/api/auth/dev-token`);
    expect(issued.status()).toBe(200);
    const { token } = await issued.json();
    checkIssuedClaims(token, '99');
    const positive = await page.request.get(`${foreignBase}/api/gpt/conversations/${foreignId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(
      positive.status(),
      'Prove the foreign row exists and is readable by its real issuer scope'
    ).toBe(200);
    await stopApi();
    await startApi('primary');
    await open(page, localUrl('GPT_EO_BASE_URL'), id('GPT_EO_GROUNDED_CONFIG_ID'));
    const statuses = await page.evaluate(async foreignId => {
      const reads = await Promise.all(
        ['history', 'trace'].map(async path => {
          const response = await fetch(`/api/gpt/conversations/${foreignId}/${path}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          });
          return response.status;
        })
      );
      const sent = await fetch(`/api/gpt/conversations/${foreignId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gptConfigId: 7103, message: 'Synthetic unauthorized question' }),
      });
      return [...reads, sent.status];
    }, id('GPT_EO_FOREIGN_CONVERSATION_ID'));
    expect(statuses).toEqual([404, 404, 404]);
    events.push({ operation: 'actual-foreign-read-trace-send', statuses });
    await page.goto(
      localUrl('GPT_EO_BASE_URL') + `/gpt?view=studio&gptId=7101&conversationId=${foreignId}`
    );
    await expect(page.getByText(/Failed to initialize conversation/)).toBeVisible();
    await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
    await screenshot(page, 'foreign-denied');
    unchangedSuccess(beforeDenied, await snapshot('after-denied'));
  });

  test('owned failure configuration fails closed without stopping the shared provider', async ({
    page,
  }) => {
    const beforeUnavailable = await snapshot('before-unavailable');
    await stopApi();
    await startApi('unavailable');
    await open(page, localUrl('GPT_EO_UNAVAILABLE_BASE_URL'), id('GPT_EO_GROUNDED_CONFIG_ID'));
    const failedResponse = page.waitForResponse(
      response =>
        /\/api\/gpt\/conversations\/\d+\/messages$/i.test(response.url()) &&
        response.request().method() === 'POST'
    );
    await page
      .getByPlaceholder(/^Message /)
      .fill('For the synthetic EO reference parcel, what inspection interval is specified?');
    await page.getByRole('button', { name: 'Send message' }).click();
    const failed = await failedResponse;
    expect(failed.ok()).toBe(false);
    const cid = failed.headers()['x-correlation-id'];
    expect(cid).toMatch(/^[A-Za-z0-9._-]{1,128}$/);
    await expect(page.getByText(/Grounded answer unavailable or rejected\..*CID:/)).toContainText(
      cid
    );
    await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
    await screenshot(page, 'unavailable');
    await stopApi();
    unchangedSuccess(beforeUnavailable, await snapshot('after-unavailable'));
    await startApi('primary');
    // Recovery is another real request through the admitted app; the shared provider is untouched.
    await open(page, localUrl('GPT_EO_BASE_URL'), id('GPT_EO_GROUNDED_CONFIG_ID'));
    await page
      .getByPlaceholder(/^Message /)
      .fill(
        'For the synthetic EO reference parcel, what inspection interval does the supplied source specify?'
      );
    await page.getByRole('button', { name: 'Send message' }).click();
    const recovered = page.getByTestId('gpt-grounded-answer');
    await expect(recovered).toHaveAttribute('data-status', 'ANSWERED');
    await expect(recovered).toContainText(required('GPT_EO_ADMITTED_MODEL'));
    await expect(recovered).toContainText(required('GPT_EO_EXPECTED_ANSWER_FRAGMENT'));
    await expect(recovered).toContainText(required('GPT_EO_EXPECTED_SOURCE_TEXT'));
    await screenshot(page, 'recovered');
  });
}

function rememberNegativeConversation(value: {
  id: number;
  gptConfigurationId: number;
  countyId: number;
  userId: string;
}) {
  expect(Number.isSafeInteger(value.id) && value.id > 0).toBe(true);
  expect(value.userId).toBe('dev-user-001');
  expect([42, 99]).toContain(value.countyId);
  expect(value.gptConfigurationId).toBe(value.countyId === 42 ? 7101 : 7103);
  negativeConversations.set(value.id, {
    id: value.id,
    configId: value.gptConfigurationId,
    countyId: value.countyId,
    userId: value.userId,
  });
}

function noNegativeOutputs(state: any) {
  expect(state.profile).toBe('negative-only');
  expect(state.realProviderAcceptance).toBe('NOT_RUN');
  expect(state.messageIds).toEqual([]);
  expect(state.serviceAuditIds).toEqual([]);
  expect(state.usageCount).toBe(0);
  expect(state.documentCount).toBe(0);
  expect(state.vectorCount).toBe(0);
  expect(state.prerequisiteAuditCount).toBe(6);
  expect(state.actualAuditCount).toBeGreaterThanOrEqual(6);
}

async function negativeHistory(page: Page, conversationId: number) {
  const result = await page.evaluate(async conversationId => {
    const response = await fetch(`/api/gpt/conversations/${conversationId}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    });
    return { status: response.status, body: await response.json() };
  }, conversationId);
  expect(result.status).toBe(200);
  expect(result.body).toEqual([]);
}

if (negativeOnly) {
  test.describe('negative-only local product; real-provider matrix NOT RUN', () => {
    test.describe.configure({ mode: 'serial' });

    test('real issuer opens authorized empty history and unauthenticated GPT access is refused', async ({
      page,
    }) => {
      await open(page, localUrl('GPT_EO_BASE_URL'), 7101);
      await expect(page).toHaveURL(/conversationId=\d+/);
      const conversationId = Number(new URL(page.url()).searchParams.get('conversationId'));
      await negativeHistory(page, conversationId);
      const anonymous = await page.request.get(
        localUrl('GPT_EO_BASE_URL') + `/api/gpt/conversations/${conversationId}/history`
      );
      expect(anonymous.status()).toBe(401); // localStorage bearer is not supplied to this request.
      await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
      noNegativeOutputs(await snapshot('negative-auth-empty'));
      events.push({
        operation: 'negative-auth-empty-history',
        anonymousStatus: 401,
        authorizedStatus: 200,
        conversationId,
      });
      await screenshot(page, 'negative-empty-history');
    });

    test('actual context denies scope and returns RetrievalFailed for authorized unconfigured empty data', async ({
      page,
    }) => {
      await open(page, localUrl('GPT_EO_BASE_URL'), 7101);
      const results = await page.evaluate(async () => {
        const results = [];
        for (const input of [
          { countyId: '99', datasetKey: 'rag-dataset:7201', traceId: 'negative-county' },
          { countyId: '42', datasetKey: 'rag-dataset:7299', traceId: 'negative-missing' },
          { countyId: '42', datasetKey: 'rag-dataset:7203', traceId: 'negative-foreign' },
          { countyId: '42', datasetKey: 'rag-dataset:7201', traceId: 'negative-unconfigured' },
        ]) {
          const response = await fetch('/api/gpt/grounded-context', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              schemaVersion: '1.0.0',
              queryText: 'Synthetic negative-only query without source data.',
              topK: 1,
              scoreThreshold: 0.1,
              ...input,
            }),
          });
          results.push({
            status: response.status,
            body: await response.json(),
            traceId: input.traceId,
          });
        }
        return results;
      });
      expect(results.map(value => value.status)).toEqual([200, 200, 200, 503]);
      for (const [index, denialCode] of [
        'COUNTY_MISMATCH',
        'DATASET_NOT_ALLOWED',
        'DATASET_NOT_ALLOWED',
      ].entries()) {
        expect(results[index].body.status).toBe('DENIED');
        expect(results[index].body.denialCode).toBe(denialCode);
        expect(results[index].body.citations).toEqual([]);
        expect(results[index].body.traceId).toBe(results[index].traceId);
        expect(results[index].body.answer).toBeUndefined();
      }
      expect(results[3].body.code).toBe('RetrievalFailed');
      expect(results[3].body.status).toBeUndefined();
      expect(results[3].body.answer).toBeUndefined();
      await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
      noNegativeOutputs(await snapshot('negative-context-refusal'));
      events.push({ operation: 'negative-actual-context-results', results });
    });

    test('real foreign positive control then history trace send and UI reopen deny without outputs', async ({
      page,
    }) => {
      const before = await snapshot('negative-before-denied');
      noNegativeOutputs(before);
      await stopApi();
      await startApi('foreign');
      const foreignBase = localUrl('GPT_EO_FOREIGN_BASE_URL');
      const foreignId = id('GPT_EO_FOREIGN_CONVERSATION_ID');
      const issued = await page.request.get(foreignBase + '/api/auth/dev-token');
      expect(issued.status()).toBe(200);
      const { token } = await issued.json();
      checkIssuedClaims(token, '99');
      const positive = await page.request.get(
        `${foreignBase}/api/gpt/conversations/${foreignId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      expect(positive.status()).toBe(200);
      expect(await positive.json()).toEqual([]);
      await stopApi();
      await startApi('primary');
      await open(page, localUrl('GPT_EO_BASE_URL'), 7101);
      const statuses = await page.evaluate(async foreignId => {
        const headers = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
        const statuses = [];
        for (const suffix of ['history', 'trace'])
          statuses.push(
            (await fetch(`/api/gpt/conversations/${foreignId}/${suffix}`, { headers })).status
          );
        statuses.push(
          (
            await fetch(`/api/gpt/conversations/${foreignId}/messages`, {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gptConfigId: 7103,
                message: 'Synthetic unauthorized question',
              }),
            })
          ).status
        );
        return statuses;
      }, foreignId);
      expect(statuses).toEqual([404, 404, 404]);
      await page.goto(
        localUrl('GPT_EO_BASE_URL') + `/gpt?view=studio&gptId=7101&conversationId=${foreignId}`
      );
      await expect(page.getByText(/Failed to initialize conversation/)).toBeVisible();
      await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
      const after = await snapshot('negative-after-denied');
      noNegativeOutputs(after);
      expect(after.actualAuditCount).toBeGreaterThanOrEqual(before.actualAuditCount);
      events.push({
        operation: 'negative-real-foreign-control-and-denials',
        positiveStatus: 200,
        statuses,
      });
      await screenshot(page, 'negative-foreign-denied');
    });

    test('unconfigured send shows actual503 CID and same-binary restart retains empty history', async ({
      page,
    }) => {
      await stopApi();
      await startApi('unavailable'); // Negative profile is Disabled/blank, never an endpoint5196 attempt.
      const base = localUrl('GPT_EO_UNAVAILABLE_BASE_URL');
      await open(page, base, 7101);
      await expect(page).toHaveURL(/conversationId=\d+/);
      const conversationId = Number(new URL(page.url()).searchParams.get('conversationId'));
      await negativeHistory(page, conversationId);
      const before = await snapshot('negative-before-unconfigured');
      const failedResponse = page.waitForResponse(
        response =>
          /\/api\/gpt\/conversations\/\d+\/messages$/i.test(response.url()) &&
          response.request().method() === 'POST'
      );
      await page
        .getByPlaceholder(/^Message /)
        .fill('Synthetic request with no admitted model or reference data.');
      await page.getByRole('button', { name: 'Send message' }).click();
      const failed = await failedResponse;
      expect(failed.status()).toBe(503);
      const body = await failed.json();
      expect(body.error).toBe('Grounded answer unavailable or rejected.');
      expect(body.status).toBeUndefined();
      expect(body.answer).toBeUndefined();
      const cid = failed.headers()['x-correlation-id'];
      expect(cid).toMatch(/^[A-Za-z0-9._-]{1,128}$/);
      expect(body.traceId).toBe(cid);
      await expect(page.getByText(/Grounded answer unavailable or rejected\..*CID:/)).toContainText(
        cid
      );
      await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
      await negativeHistory(page, conversationId);
      const after = await snapshot('negative-after-unconfigured');
      noNegativeOutputs(before);
      noNegativeOutputs(after);
      expect(after.conversations).toEqual(before.conversations);
      await screenshot(page, 'negative-unconfigured503');
      const reopenUrl = page.url();
      await stopApi();
      await startApi('unavailable'); // Per-launch original binary hash guard remains mandatory.
      await page.goto(reopenUrl);
      await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
      await negativeHistory(page, conversationId);
      const restarted = await snapshot('negative-restarted-empty');
      noNegativeOutputs(restarted);
      expect(restarted.conversations).toEqual(after.conversations);
      await expect(page.getByTestId('gpt-grounded-answer')).toHaveCount(0);
      await screenshot(page, 'negative-restart-empty');
      events.push({
        operation: 'negative-unconfigured503-empty-restart',
        status: 503,
        cid,
        conversationId,
        providerPolicy: 'forbidden',
        modelAnswerAcceptance: 'NOT_RUN',
      });
    });
  });
}

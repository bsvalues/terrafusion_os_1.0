import { defineConfig, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Reviewed synthetic negative-only input, never selected from canonical settings.
// Audit DB logging is intentionally true here (canonical Development used false).
export const negativeSettingsJson = JSON.stringify({
  JwtSettings: { Issuer: 'TerraFusion.API', Audience: 'TerraFusion.Client', ExpirationMinutes: 120 },
  Logging: { LogLevel: { Default: 'Warning', 'TerraFusion.API.Services.AuditLogger': 'Information' } },
  AuditLogging: { Enabled: true, LogToDatabase: true, LogToFile: true },
  AtlasProjection: { Mode: 'LocalExact', TimeoutSeconds: 30 },
  DaisAppealWorkflow: { Mode: 'LocalExact', TimeoutSeconds: 30 },
  DossierEvidenceRegistryRead: { Mode: 'LocalExact', TimeoutSeconds: 30 },
  DaisAppealMutation: { Mode: 'LocalExact', TimeoutSeconds: 30 },
  DossierMutation: { Mode: 'LocalExact', TimeoutSeconds: 30 },
  GptGroundedContextRuntime: { Mode: 'LocalExact', TimeoutSeconds: 30 },
  GptGroundedAnswerRuntime: { Mode: 'LocalExact', TimeoutSeconds: 30 },
}, null, 2) + '\n';
export const negativeDevelopmentJson = '{}\n';

// This is a test-owned late provider, never a copy of a live .local.json.
export const negativeLocalJson =
  '{"GptLocalInference":{"Enabled":false,"Endpoint":"","Model":"","EmbeddingModel":"","EmbeddingDimensions":0},"OpenTelemetry":{"Enabled":false}}\n';
export function guardNegativeSettingsIdentity(env: NodeJS.ProcessEnv) {
  const settings = env.GPT_EO_APPROVED_SETTINGS_SHA256 ?? '';
  const development = env.GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256 ?? '';
  if (![settings, development].every(value => /^[a-f0-9]{64}$/.test(value)))
    throw new Error('Independent approval of both synthetic JSON hashes required.');
  // Compare against the original external approval, never approve a hash read from disk.
  readLaunchIdentity(settings, () => Buffer.from(negativeSettingsJson, 'utf8'));
  readLaunchIdentity(development, () => Buffer.from(negativeDevelopmentJson, 'utf8'));
  return Object.freeze({ settings, development });
}

// Deferred pure guard cases. Importing this file does not execute these assertions or grant a run.
// Each callback exercises the real profile/environment guards; none opens a socket or a fixture.
export const negativeProfileGuardCases = [
  {
    name: 'negative content requires both original approved synthetic hashes',
    run: () => {
      assert.throws(() => guardNegativeSettingsIdentity({}));
      assert.throws(() =>
        guardNegativeSettingsIdentity({ GPT_EO_APPROVED_SETTINGS_SHA256: 'a'.repeat(64) })
      );
      assert.deepEqual(
        guardNegativeSettingsIdentity({
          GPT_EO_APPROVED_SETTINGS_SHA256: '5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf',
          GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256: 'ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356',
        }),
        { settings: '5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf',
          development: 'ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356' }
      );
    },
  },
  {
    name: 'synthetic input rejects old canonical and mismatched approvals before setup',
    run: () => {
      for (const settings of ['', 'a'.repeat(64),
        '95d9551c5eb03ff06b164a071bde15354abeaa278256fc86a87092baa4ebb918'])
        assert.throws(() => guardNegativeSettingsIdentity({
          GPT_EO_APPROVED_SETTINGS_SHA256: settings,
          GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256: 'ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356',
        }));
      assert.throws(() => guardNegativeSettingsIdentity({
        GPT_EO_APPROVED_SETTINGS_SHA256: '5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf',
        GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256: 'd96fbaf306011e7bc1d2b5ce20ca4fb1097ec701b4129817faee3fe31af3b407',
      }));
    },
  },
  {
    name: 'synthetic input rejects extra keys and byte drift against original approval',
    run: () => {
      const original = '5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf';
      assert.equal(Buffer.byteLength(negativeSettingsJson), 944);
      assert.equal(readLaunchIdentity(original, () => Buffer.from(negativeSettingsJson)), original);
      for (const changed of [negativeSettingsJson + '\n', negativeSettingsJson.replaceAll('\n', '\r\n'),
        JSON.stringify({ ...JSON.parse(negativeSettingsJson), Workbench: { Evidence: { HmacKey: 'synthetic-unapproved' } } })])
        assert.throws(() => readLaunchIdentity(original, () => Buffer.from(changed)));
      assert.equal(negativeDevelopmentJson, '{}\n');
    },
  },
  {
    name: 'settings approval snapshot never adopts changed environment or disk bytes',
    run: () => {
      const env = {
        GPT_EO_APPROVED_SETTINGS_SHA256: '5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf',
        GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256: 'ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356',
      };
      const admitted = guardNegativeSettingsIdentity(env);
      env.GPT_EO_APPROVED_SETTINGS_SHA256 = 'a'.repeat(64);
      assert.equal(admitted.settings, '5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf');
      assert.equal(Object.isFrozen(admitted), true);
      assert.throws(() => readLaunchIdentity(admitted.settings, () => Buffer.from('{}\n')));
    },
  },
  {
    name: 'synthetic inventory preserves actual auth audit and seven runtime selections only',
    run: () => {
      const input = JSON.parse(negativeSettingsJson);
      assert.deepEqual(Object.keys(input), ['JwtSettings', 'Logging', 'AuditLogging',
        'AtlasProjection', 'DaisAppealWorkflow', 'DossierEvidenceRegistryRead', 'DaisAppealMutation',
        'DossierMutation', 'GptGroundedContextRuntime', 'GptGroundedAnswerRuntime']);
      assert.deepEqual(input.JwtSettings, { Issuer: 'TerraFusion.API', Audience: 'TerraFusion.Client', ExpirationMinutes: 120 });
      assert.deepEqual(input.Logging, { LogLevel: { Default: 'Warning', 'TerraFusion.API.Services.AuditLogger': 'Information' } });
      assert.deepEqual(input.AuditLogging, { Enabled: true, LogToDatabase: true, LogToFile: true });
      for (const name of Object.keys(input).slice(3))
        assert.deepEqual(input[name], { Mode: 'LocalExact', TimeoutSeconds: 30 });
    },
  },
  {
    name: 'negative late JSON contains exactly five forbidden-provider values and telemetry false',
    run: () => {
      assert.deepEqual(JSON.parse(negativeLocalJson), {
        GptLocalInference: {
          Enabled: false,
          Endpoint: '',
          Model: '',
          EmbeddingModel: '',
          EmbeddingDimensions: 0,
        },
        OpenTelemetry: { Enabled: false },
      });
    },
  },
  {
    name: 'default remains admission-required positive profile',
    run: () => {
      assert.throws(() => guardExecutionProfile({}));
      assert.throws(() =>
        guardExecutionProfile({ ...negativeGuardInput(), GPT_EO_PROFILE: undefined })
      );
    },
  },
  {
    name: 'original admitted positive fields remain accepted',
    run: () => {
      const value = guardExecutionProfile({
        GPT_EO_RUNTIME: 'owned',
        GPT_EO_ADMISSION: 'admitted',
        GPT_EO_EXPECTED_OS_COMMIT: 'a'.repeat(40),
        GPT_EO_ENDPOINT: 'http://127.0.0.1:51199/',
        GPT_EO_ADMITTED_MODEL: 'guard-input-only',
        GPT_EO_EMBEDDING_MODEL: 'guard-input-only',
        GPT_EO_EMBEDDING_DIMENSIONS: '1',
      });
      assert.equal(value.profile, 'real-provider');
    },
  },
  {
    name: 'explicit negative profile does not declare a model',
    run: () => {
      const value = guardExecutionProfile(negativeGuardInput());
      assert.equal(value.profile, 'negative-only');
      assert.equal(value.endpoint, '');
      assert.equal(value.model, '');
      assert.equal(value.embeddingModel, '');
      assert.equal(value.dimensions, 0);
    },
  },
  {
    name: 'negative profile requires owned runtime',
    run: () => {
      assert.throws(() =>
        guardExecutionProfile({ ...negativeGuardInput(), GPT_EO_RUNTIME: undefined })
      );
    },
  },
  {
    name: 'negative profile requires explicit provider prohibition',
    run: () => {
      assert.throws(() =>
        guardExecutionProfile({ ...negativeGuardInput(), GPT_EO_PROVIDER_POLICY: undefined })
      );
    },
  },
  {
    name: 'unknown profile cannot select a weaker path',
    run: () => {
      assert.throws(() =>
        guardExecutionProfile({ ...negativeGuardInput(), GPT_EO_PROFILE: 'other' })
      );
    },
  },
  {
    name: 'negative child binds disabled and unconfigured options',
    run: () => {
      assert.doesNotThrow(() =>
        assertNegativeProviderEnvironment({
          OpenTelemetry__Enabled: 'false',
          GptLocalInference__Enabled: 'false',
          GptLocalInference__Endpoint: '',
          GptLocalInference__Model: '',
          GptLocalInference__EmbeddingModel: '',
          GptLocalInference__EmbeddingDimensions: '0',
        })
      );
    },
  },
  {
    name: 'negative child refuses every activation or model override',
    run: () => {
      for (const key of ['Enabled', 'Endpoint', 'Model', 'EmbeddingModel', 'EmbeddingDimensions']) {
        const child = {
          OpenTelemetry__Enabled: 'false',
          GptLocalInference__Enabled: 'false',
          GptLocalInference__Endpoint: '',
          GptLocalInference__Model: '',
          GptLocalInference__EmbeddingModel: '',
          GptLocalInference__EmbeddingDimensions: '0',
          ['GptLocalInference__' + key]: 'configured',
        };
        assert.throws(() => assertNegativeProviderEnvironment(child));
      }
      assert.throws(() => assertNegativeProviderEnvironment({}));
      assert.throws(() =>
        assertNegativeProviderEnvironment({
          OpenTelemetry__Enabled: 'false',
          GptLocalInference__Enabled: 'false',
          GptLocalInference__Endpoint: '',
          GptLocalInference__Model: '',
          GptLocalInference__EmbeddingModel: '',
          GptLocalInference__EmbeddingDimensions: '0',
          'gptlocalinference:enabled': 'true',
        })
      );
    },
  },
  {
    name: 'negative child refuses missing true malformed or aliased telemetry activation',
    run: () => {
      const child = {
        OpenTelemetry__Enabled: 'false',
        GptLocalInference__Enabled: 'false',
        GptLocalInference__Endpoint: '',
        GptLocalInference__Model: '',
        GptLocalInference__EmbeddingModel: '',
        GptLocalInference__EmbeddingDimensions: '0',
      };
      for (const value of [undefined, 'true', 'malformed'])
        assert.throws(() =>
          assertNegativeProviderEnvironment({ ...child, OpenTelemetry__Enabled: value })
        );
      assert.throws(() =>
        assertNegativeProviderEnvironment({ ...child, 'opentelemetry:enabled': 'true' })
      );
    },
  },
  {
    name: 'negative content accepts only run runtime api-content geometry',
    run: () => {
      const run = resolve(root, '.tmp/gpt-grounded-answer-browser/run-' + 'a'.repeat(32));
      const content = resolve(run, 'runtime/api-content');
      assert.equal(guardNegativeContentPath(root, run, content), content);
      for (const suffix of ['api-content', 'other/api-content', 'runtime/other'])
        assert.throws(() => guardNegativeContentPath(root, run, resolve(run, suffix)));
      assert.throws(() => guardNegativeContentPath(root, run, content + '/../api-content'));
    },
  },
  ...[
    'GPT_EO_ADMISSION',
    'GPT_EO_ENDPOINT',
    'GPT_EO_ADMITTED_MODEL',
    'GPT_EO_EMBEDDING_MODEL',
    'GPT_EO_EMBEDDING_DIMENSIONS',
    'GptLocalInference__Enabled',
    'GptLocalInference__Endpoint',
    'GptLocalInference__Model',
    'GptLocalInference__EmbeddingModel',
    'gptlocalinference:embeddingdimensions',
  ].map(key => ({
    name: 'negative profile refuses supplied ' + key,
    run: () => {
      assert.throws(() => guardExecutionProfile({ ...negativeGuardInput(), [key]: '' }));
    },
  })),
];

function negativeGuardInput(): NodeJS.ProcessEnv {
  return {
    GPT_EO_PROFILE: 'negative-only',
    GPT_EO_RUNTIME: 'owned',
    GPT_EO_PROVIDER_POLICY: 'forbidden',
    GPT_EO_EXPECTED_OS_COMMIT: 'a'.repeat(40),
  };
}

export function readLaunchIdentity(expectedSha256: string, readBytes: () => Uint8Array): string {
  if (!/^[a-f0-9]{64}$/.test(expectedSha256))
    throw new Error('Original admitted artifact hash required.');
  const actual = createHash('sha256').update(readBytes()).digest('hex');
  if (actual !== expectedSha256) throw new Error('Owned launch artifact identity drift refused.');
  return actual;
}

/** Pure/read-only guards are exported for bounded source checks without starting Playwright. */
export function guardRunPath(checkout: string, input: string): string {
  if (!isAbsolute(input) || input.split(/[\\/]/).some(part => part === '..' || part === '.'))
    throw new Error('Absolute, non-traversing owned GPT run required.');
  const run = resolve(input);
  if (
    dirname(run) !== resolve(checkout, '.tmp/gpt-grounded-answer-browser') ||
    !/^run-[a-f0-9]{32}$/.test(basename(run))
  )
    throw new Error('Only an owned GPT run-UUID directory is admitted.');
  for (let current = run; ; current = dirname(current)) {
    if (
      existsSync(current) &&
      (lstatSync(current).isSymbolicLink() ||
        realpathSync(current).toLowerCase() !== resolve(current).toLowerCase())
    )
      throw new Error('Linked/reparse GPT run paths refused.');
    if (dirname(current) === current) break;
  }
  return run;
}

export function guardNegativeContentPath(
  checkout: string,
  runInput: string,
  content: string
): string {
  const run = guardRunPath(checkout, runInput);
  if (
    !isAbsolute(content) ||
    content.split(/[\\/]/).some(part => part === '.' || part === '..') ||
    resolve(content) !== resolve(run, 'runtime/api-content')
  )
    throw new Error('Exact owned run/runtime/api-content required.');
  for (let current = resolve(content); ; current = dirname(current)) {
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (
      stat &&
      (!stat.isDirectory() ||
        stat.isSymbolicLink() ||
        realpathSync(current).toLowerCase() !== resolve(current).toLowerCase())
    )
      throw new Error('Replaced or linked negative content ancestor refused.');
    if (dirname(current) === current) break;
  }
  return resolve(content);
}

export function guardAdmission(env: NodeJS.ProcessEnv) {
  if (env.GPT_EO_RUNTIME !== 'owned' || env.GPT_EO_ADMISSION !== 'admitted')
    throw new Error('Separate explicit runtime and actual embedding/model admission required.');
  const required = (key: string) => {
    const value = env[key];
    if (!value || value.trim() !== value || /[\x00-\x1f\x7f]/.test(value))
      throw new Error('Missing or invalid admitted field: ' + key);
    return value;
  };
  const commit = required('GPT_EO_EXPECTED_OS_COMMIT');
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Exact OS commit required.');
  const endpoint = required('GPT_EO_ENDPOINT');
  const url = new URL(endpoint);
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    [5193, 5194, 5195, 5196].includes(Number(url.port))
  )
    throw new Error('Separately admitted loopback provider endpoint required.');
  const model = required('GPT_EO_ADMITTED_MODEL');
  const embeddingModel = required('GPT_EO_EMBEDDING_MODEL');
  if (model.length > 100 || embeddingModel.length > 100)
    throw new Error('Model identifier too long.');
  const dimensionText = required('GPT_EO_EMBEDDING_DIMENSIONS');
  const dimensions = Number(dimensionText);
  if (
    !/^[1-9][0-9]*$/.test(dimensionText) ||
    !Number.isSafeInteger(dimensions) ||
    dimensions > 16384
  )
    throw new Error('Explicit admitted embedding dimension required.');
  return { commit, endpoint, model, embeddingModel, dimensions };
}

export function guardExecutionProfile(env: NodeJS.ProcessEnv) {
  const profile = env.GPT_EO_PROFILE ?? 'real-provider';
  if (profile === 'real-provider') {
    if (env.GPT_EO_PROVIDER_POLICY === 'forbidden')
      throw new Error('Provider-forbidden input cannot select the real-provider profile.');
    return { ...guardAdmission(env), profile } as const;
  }
  if (
    profile !== 'negative-only' ||
    env.GPT_EO_RUNTIME !== 'owned' ||
    env.GPT_EO_PROVIDER_POLICY !== 'forbidden'
  )
    throw new Error('Explicit owned negative-only profile with providers forbidden required.');
  for (const [key, value] of Object.entries(env)) {
    const normalized = key.replaceAll('__', ':').toLowerCase();
    if (
      value !== undefined &&
      (normalized.startsWith('gptlocalinference:') ||
        [
          'gpt_eo_admission',
          'gpt_eo_endpoint',
          'gpt_eo_admitted_model',
          'gpt_eo_embedding_model',
          'gpt_eo_embedding_dimensions',
        ].includes(normalized))
    )
      throw new Error('Negative-only profile forbids provider admission/configuration inputs.');
  }
  const commit = env.GPT_EO_EXPECTED_OS_COMMIT ?? '';
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Exact OS commit required.');
  return { profile, commit, endpoint: '', model: '', embeddingModel: '', dimensions: 0 } as const;
}

export function assertNegativeProviderEnvironment(env: NodeJS.ProcessEnv): void {
  const expected: Record<string, string> = {
    OpenTelemetry__Enabled: 'false',
    GptLocalInference__Enabled: 'false',
    GptLocalInference__Endpoint: '',
    GptLocalInference__Model: '',
    GptLocalInference__EmbeddingModel: '',
    GptLocalInference__EmbeddingDimensions: '0',
  };
  for (const [key, value] of Object.entries(expected))
    if (env[key] !== value) throw new Error('Negative-only child provider configuration refused.');
  for (const key of Object.keys(env))
    if (
      (key.replaceAll('__', ':').toLowerCase().startsWith('gptlocalinference:') ||
        key.replaceAll('__', ':').toLowerCase().startsWith('opentelemetry:')) &&
      !Object.hasOwn(expected, key)
    )
      throw new Error('Additional/aliased negative-only provider configuration refused.');
}

export function assertFixtureResult(exitCode: number | null, trx: string): void {
  const counters = trx.match(/<Counters\s[^>]+>/g);
  if (exitCode !== 0 || counters?.length !== 1) throw new Error('Mandatory GPT fixture failed.');
  for (const [key, value] of Object.entries({
    total: 1,
    executed: 1,
    passed: 1,
    failed: 0,
    notExecuted: 0,
  }))
    if (!new RegExp('\\b' + key + '="' + value + '"').test(counters[0]))
      throw new Error('Mandatory GPT fixture was not one passing, unskipped case: ' + key);
}

// Import-only guard checks do not run a browser or grant execution. The spec separately
// enforces admission, so this source-check switch cannot turn a runtime test into a skip.
const sourceChecks = process.env.GPT_EO_SOURCE_GUARDS === '1';
const run = sourceChecks ? undefined : guardRunPath(root, process.env.GPT_EO_RUN_DIR ?? '');
if (!sourceChecks) {
  guardExecutionProfile(process.env);
  for (const name of [
    'gpt.db',
    'run-owner.json',
    'fixture-receipt.json',
    'output/playwright/results.json',
    'output/playwright/evidence.json',
  ])
    if (existsSync(resolve(run!, name))) throw new Error('Prior GPT run must not be overwritten.');
}

/** Real application acceptance only. Existing owned runtimes must be separately admitted. */
export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  testMatch: '**/gpt-grounded-answer.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 600_000,
  expect: { timeout: 30_000 },
  outputDir: run ? resolve(run, 'output/playwright/artifacts') : undefined,
  reporter: run
    ? [['list'], ['json', { outputFile: resolve(run, 'output/playwright/results.json') }]]
    : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    // Never retain JWT headers/local storage in automated traces or HAR artifacts.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});

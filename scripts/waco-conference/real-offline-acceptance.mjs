#!/usr/bin/env node

/**
 * WACO Lane B terminal acceptance runner.
 *
 * This is intentionally a target-machine proof runner, not a mock server and
 * not a replacement for the TerraFusion runtime. It must be run against a
 * real conference deployment while the machine is physically disconnected.
 */

import process from 'node:process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const SYNTHETIC_MARKERS = [
  'repository_reference_demo',
  'synthetic_reference',
  'REFERENCE_DEMO',
  'WA-REFERENCE-',
  'mock',
  'demo',
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Login and Muse explain are POST routes, but neither mutates production or
// county data. PilotController documents /api/pilot/explain as read-only.
const SAFE_POST_PATHS = new Set(['/api/auth/login', '/api/pilot/explain']);
// Pilot tool invocation is optional to the conference journey. Abort it at
// the browser boundary so a disconnected run cannot issue a tool mutation or
// depend on the optional Pilot runtime.
const BLOCKED_OPTIONAL_PATHS = new Set(['/api/pilot/invoke']);
const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]']);
const AUTH_LOGIN_PATH = '/api/auth/login';

export class CliUsageError extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.name = 'CliUsageError';
    this.exitCode = exitCode;
  }
}

function usage(message) {
  if (message) console.error(`ERROR: ${message}\n`);
  console.error(`Usage:
  node scripts/waco-conference/real-offline-acceptance.mjs \\
    --base-url http://127.0.0.1:5173 \\
    --operator-email operator@example.gov \\
    --password-env WACO_OPERATOR_PASSWORD \\
    --county "Kitsap" \\
    --sales-sentinel "<known real sale identifier>" \\
    --offline-confirmed [--journey-id 1]

Required:
  --base-url              Loopback URL for the real Shell deployment.
  --operator-email        Provisioned operator email submitted through /login.
  --password-env          Name of the environment variable containing the
                          provisioned operator password; the password itself
                          must never be passed as a command-line argument.
  --county                County to select in the Counties HUB.
  --sales-sentinel        Exact text expected from the governed real sales shard.
  --offline-confirmed     Operator attestation that the target machine is
                          physically disconnected before the run begins.

Optional:
  --journey-id            Evidence label for this one fresh-context journey;
                          defaults to 1. Run this command again only after an
                          external supported TerraFusion restart/reset boundary.
  --timeout-ms            Per-step timeout; defaults to 45000.
  --help                  Show this help.
`);
  throw new CliUsageError(message, message ? 2 : 0);
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help') usage();
    if (token === '--offline-confirmed') {
      args.offlineConfirmed = true;
      continue;
    }
    if (!token.startsWith('--')) usage(`Unknown argument: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) usage(`Missing value for --${key}`);
    args[key] = value;
    index += 1;
  }

  const journeyId = Number(args['journey-id'] ?? 1);
  const timeoutMs = Number(args['timeout-ms'] ?? 45_000);
  if (!Number.isInteger(journeyId) || journeyId < 1) usage('--journey-id must be a positive integer');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 5_000) usage('--timeout-ms must be an integer >= 5000');
  if (!args['base-url']) usage('--base-url is required');
  if (!args['operator-email']) usage('--operator-email is required');
  if (!args['password-env']) usage('--password-env is required');
  if (!args.county) usage('--county is required');
  if (!args['sales-sentinel']) usage('--sales-sentinel is required');
  if (!args.offlineConfirmed) usage('--offline-confirmed is required');

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(args['password-env'])) {
    usage('--password-env must be a valid environment variable name');
  }

  let baseUrl;
  try {
    baseUrl = new URL(args['base-url']);
  } catch {
    usage('--base-url must be a valid URL');
  }
  if (!['http:', 'https:'].includes(baseUrl.protocol)) usage('--base-url must use http or https');
  if (!LOOPBACK_HOSTNAMES.has(baseUrl.hostname.toLowerCase())) {
    usage('--base-url must use loopback hostname 127.0.0.1, localhost, or [::1]');
  }

  return {
    baseUrl,
    operatorEmail: String(args['operator-email']),
    passwordEnv: String(args['password-env']),
    county: String(args.county),
    salesSentinel: String(args['sales-sentinel']),
    journeyId,
    timeoutMs,
  };
}

export function readOperatorPassword(config, environment = process.env) {
  const password = environment[config.passwordEnv];
  if (typeof password !== 'string' || password.length === 0) {
    fail(`required password environment variable ${config.passwordEnv} is absent or empty`);
  }
  return password;
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertNoSyntheticPayload(payload, source) {
  const serialized = JSON.stringify(payload);
  const marker = SYNTHETIC_MARKERS.find((candidate) => serialized.toLowerCase().includes(candidate.toLowerCase()));
  assert(!marker, `${source} contains synthetic/demo marker ${JSON.stringify(marker)}`);
}

function isAllowedOfflineUrl(url, baseOrigin) {
  if (url.origin === baseOrigin) return true;
  return LOOPBACK_HOSTNAMES.has(url.hostname.toLowerCase());
}

async function readJsonResponse(response) {
  const contentType = response.headers()['content-type'] ?? '';
  if (!contentType.toLowerCase().includes('json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function waitForText(page, text, timeoutMs) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: timeoutMs });
}

async function runJourney({ browser, config }) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const observedJson = [];
  const violations = [];
  const blockedOptionalRequests = [];
  const baseOrigin = config.baseUrl.origin;

  await page.route('**/api/pilot/invoke', async (route) => {
    blockedOptionalRequests.push(route.request().url());
    await route.abort();
  });

  page.on('request', (request) => {
    const url = new URL(request.url());
    const method = request.method().toUpperCase();
    const isAllowedReadOnlyPost = method === 'POST' && SAFE_POST_PATHS.has(url.pathname);
    const isBlockedOptionalRequest = method === 'POST' && BLOCKED_OPTIONAL_PATHS.has(url.pathname);
    if (!SAFE_METHODS.has(method) && !isAllowedReadOnlyPost && !isBlockedOptionalRequest) {
      violations.push(`mutation request ${request.method()} ${url.pathname}`);
    }
    if (!isAllowedOfflineUrl(url, baseOrigin)) {
      violations.push(`non-loopback request ${request.method()} ${url.href}`);
    }
  });

  page.on('response', async (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/launch-data/washington/')) return;
    const payload = await readJsonResponse(response);
    if (payload !== null) observedJson.push({ path: url.pathname, payload });
  });

  try {
    await page.goto(new URL('/', config.baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: config.timeoutMs });
    await page.locator('[data-testid="login-page"]').waitFor({
      state: 'visible',
      timeout: config.timeoutMs,
    });
    const password = readOperatorPassword(config);
    await page.locator('#email').fill(config.operatorEmail);
    await page.locator('#password').fill(password);
    await Promise.all([
      page.waitForURL((url) => url.pathname !== '/login', { timeout: config.timeoutMs }),
      page.getByRole('button', { name: 'Sign In', exact: true }).click(),
    ]);
    await waitForText(page, 'TerraFusion', config.timeoutMs);

    await page.goto(new URL('/counties', config.baseUrl).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: config.timeoutMs,
    });
    await page.getByRole('heading', { name: 'Washington Counties Hub' }).waitFor({
      state: 'visible',
      timeout: config.timeoutMs,
    });

    const countyOption = page.getByRole('option', { name: `Select ${config.county} County` });
    await countyOption.waitFor({ state: 'visible', timeout: config.timeoutMs });
    await countyOption.click();
    await countyOption.waitFor({ state: 'attached', timeout: config.timeoutMs });
    await page.getByTestId('selected-county-context').waitFor({ state: 'visible', timeout: config.timeoutMs });
    const contextText = await page.getByTestId('selected-county-context').innerText();
    assert(!/No governed public sales state is available/i.test(contextText), 'selected county has no governed sales state');

    await page.getByRole('button', { name: 'Open TerraForge' }).click();
    await page.getByRole('heading', { name: 'TerraForge', exact: true }).waitFor({
      state: 'visible',
      timeout: config.timeoutMs,
    });
    await page.getByTestId('forge-county-context').waitFor({ state: 'visible', timeout: config.timeoutMs });
    const salesForgeButton = page
      .getByTestId('forge-primary-applications')
      .getByRole('button', { name: /SalesForge/i });
    await salesForgeButton.waitFor({ state: 'visible', timeout: config.timeoutMs });
    await salesForgeButton.click();
    await page.getByRole('heading', { name: 'SalesForge' }).waitFor({ state: 'visible', timeout: config.timeoutMs });
    await page.locator('.sf-workspace').waitFor({ state: 'visible', timeout: config.timeoutMs });
    assert(await page.getByTestId('salesforge-data-unavailable').count() === 0, 'SalesForge reported data unavailable');
    await waitForText(page, config.county, config.timeoutMs);
    const pageText = await page.locator('body').innerText();
    const sentinelVisible = pageText.includes(config.salesSentinel);
    const sentinelObservedInGovernedShard = observedJson.some((item) =>
      JSON.stringify(item.payload).includes(config.salesSentinel),
    );
    assert(
      sentinelVisible || sentinelObservedInGovernedShard,
      `sales sentinel ${config.salesSentinel} was not present in the rendered SalesForge view or observed governed county shard`,
    );

    for (const item of observedJson) assertNoSyntheticPayload(item.payload, item.path);
    assert(observedJson.some((item) => item.path.includes('/sales/by-county/')), 'no governed county sales shard was observed');
    assert(violations.length === 0, violations.join('; '));
    console.log(`PASS one fresh browser-context journey: real county data reached Shell -> Counties HUB -> TerraForge -> SalesForge; blocked optional Pilot requests=${blockedOptionalRequests.length}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (importError) {
    try {
      // Node's ESM resolver ignores NODE_PATH, while the offline runner may
      // provide the preinstalled Playwright package through that local path.
      playwright = require('playwright');
    } catch (requireError) {
      fail(`Playwright is required on the conference machine: ${importError.message}; ${requireError.message}`);
    }
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await runJourney({ browser, config });
  } finally {
    await browser.close();
  }
  console.log(`REAL_OFFLINE_BROWSER_JOURNEY_HARNESS_READY journey=${config.journeyId}`);
}

main().catch((error) => {
  if (error instanceof CliUsageError) {
    process.exitCode = error.exitCode;
    return;
  }
  console.error(`FAIL WACO Lane B terminal acceptance: ${error.message}`);
  process.exitCode = 1;
});

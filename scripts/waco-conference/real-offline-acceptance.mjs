#!/usr/bin/env node

/**
 * WACO Lane B terminal acceptance runner.
 *
 * This is intentionally a target-machine proof runner, not a mock server and
 * not a replacement for the TerraFusion runtime. It must be run against a
 * real conference deployment while the machine is physically disconnected.
 */

import process from 'node:process';

const SYNTHETIC_MARKERS = [
  'repository_reference_demo',
  'synthetic_reference',
  'REFERENCE_DEMO',
  'WA-REFERENCE-',
  'mock',
  'demo',
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]']);

function usage(message) {
  if (message) console.error(`ERROR: ${message}\n`);
  console.error(`Usage:
  node scripts/waco-conference/real-offline-acceptance.mjs \\
    --base-url http://127.0.0.1:5173 \\
    --county "Kitsap" \\
    --sales-sentinel "<known real sale identifier>" \\
    --offline-confirmed [--journey-id 1]

Required:
  --base-url              Loopback URL for the real Shell deployment.
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
  process.exit(message ? 2 : 0);
}

function parseArgs(argv) {
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
  if (!args.county) usage('--county is required');
  if (!args['sales-sentinel']) usage('--sales-sentinel is required');
  if (!args.offlineConfirmed) usage('--offline-confirmed is required');

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
    county: String(args.county),
    salesSentinel: String(args['sales-sentinel']),
    journeyId,
    timeoutMs,
  };
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
  const baseOrigin = config.baseUrl.origin;

  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!SAFE_METHODS.has(request.method().toUpperCase())) {
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
    await page.goto(new URL('/', config.baseUrl), { waitUntil: 'domcontentloaded', timeout: config.timeoutMs });
    await waitForText(page, 'TerraFusion', config.timeoutMs);

    await page.goto(new URL('/counties', config.baseUrl), {
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
    await waitForText(page, config.salesSentinel, config.timeoutMs);

    for (const item of observedJson) assertNoSyntheticPayload(item.payload, item.path);
    assert(observedJson.some((item) => item.path.includes('/sales/by-county/')), 'no governed county sales shard was observed');
    assert(violations.length === 0, violations.join('; '));
    console.log('PASS one fresh browser-context journey: real county data reached Shell -> Counties HUB -> TerraForge -> SalesForge');
  } finally {
    await context.close();
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (error) {
    fail(`Playwright is required on the conference machine: ${error.message}`);
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
  console.error(`FAIL WACO Lane B terminal acceptance: ${error.message}`);
  process.exitCode = 1;
});

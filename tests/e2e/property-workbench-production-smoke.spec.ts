import { expect, request, test, type Page, type APIRequestContext } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type SmokeStep = {
  name: string;
  status: 'pass' | 'fail';
  url: string;
  screenshot?: string;
  notes?: string;
};

type NetworkRecord = {
  method: string;
  url: string;
  status: number;
  ok: boolean;
};

const EVIDENCE_DIR = path.resolve(process.cwd(), '.tmp', 'workbench-smoke');
const steps: SmokeStep[] = [];
const network: NetworkRecord[] = [];
const failedResponses: NetworkRecord[] = [];
const consoleLines: string[] = [];

function baseUrl(): string {
  return process.env.WORKBENCH_SMOKE_BASE_URL ?? process.env.BASE_URL ?? 'http://127.0.0.1:5046';
}

async function ensureEvidenceDir(): Promise<void> {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
}

async function capture(page: Page, name: string, file: string, notes?: string): Promise<void> {
  await ensureEvidenceDir();
  const screenshot = `${file}.png`;
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  steps.push({ name, status: 'pass', url: page.url(), screenshot, notes });
}

async function writeEvidence(summaryNotes: string): Promise<void> {
  await ensureEvidenceDir();
  await fs.writeFile(path.join(EVIDENCE_DIR, 'network.json'), JSON.stringify(network, null, 2));
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'failed-responses.json'),
    JSON.stringify(failedResponses, null, 2)
  );
  await fs.writeFile(path.join(EVIDENCE_DIR, 'console.log'), consoleLines.join('\n'));

  const unauthorized = network.filter(entry => entry.status === 401);
  const failedApi = network.filter(entry => entry.url.includes('/api/') && !entry.ok);
  const markdown = [
    '# Property Workbench Production Smoke',
    '',
    `Base URL: ${baseUrl()}`,
    `Parcel: ${process.env.WORKBENCH_SMOKE_PARCEL_ID ?? 'auto-selected first live parcel'}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Verdict Inputs',
    `- Unauthorized API responses: ${unauthorized.length}`,
    `- Failed API responses: ${failedApi.length}`,
    `- Failed resource responses: ${failedResponses.length}`,
    `- Console errors: ${consoleLines.filter(line => line.startsWith('[error]')).length}`,
    '',
    '## Notes',
    summaryNotes,
    '',
    '## Steps',
    ...steps.map(
      step =>
        `- ${step.status.toUpperCase()} ${step.name} (${step.screenshot ?? 'no screenshot'})${step.notes ? ` — ${step.notes}` : ''}`
    ),
    '',
  ].join('\n');
  await fs.writeFile(path.join(EVIDENCE_DIR, 'smoke-summary.md'), markdown);
}

async function fetchDevToken(
  api: APIRequestContext
): Promise<{ token: string; countyId?: string; countyCode?: string }> {
  const response = await api.get('/api/auth/dev-token');
  expect(
    response.ok(),
    'Development backend must expose /api/auth/dev-token for local smoke auth'
  ).toBe(true);
  const payload = await response.json();
  expect(payload.token, 'dev-token response must include a JWT').toBeTruthy();
  return payload;
}

async function resolveSmokeParcel(api: APIRequestContext, token: string): Promise<string> {
  const explicit = process.env.WORKBENCH_SMOKE_PARCEL_ID?.trim();
  if (explicit) return explicit;

  const response = await api.get('/api/properties?page=1&pageSize=1', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), 'smoke must be able to read at least one live property').toBe(true);
  const payload = await response.json();
  const parcel =
    payload.items?.[0]?.parcelNumber ?? payload.items?.[0]?.parcelId ?? payload.items?.[0]?.geoId;
  expect(parcel, 'properties feed must expose a parcel identifier').toBeTruthy();
  return String(parcel);
}

async function installSmokeSession(
  page: Page,
  auth: { token: string; countyId?: string; countyCode?: string },
  parcelId: string
): Promise<void> {
  await page.addInitScript(
    ({ token, countyId, countyCode, parcelId }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem(
        'tf.session.dev',
        JSON.stringify({
          userId: 'dev-user-001',
          countyId: countyId ?? countyCode ?? 'benton',
          role: 'Assessor',
          permissions: ['read:properties', 'read:parcel', 'read:compsforge', 'read:atlas'],
          mode: 'pilot',
          parcelId,
        })
      );
    },
    { token: auth.token, countyId: auth.countyId, countyCode: auth.countyCode, parcelId }
  );
}

async function assertNoInfiniteLoading(page: Page): Promise<void> {
  await expect(page.getByText(/Loading property/i)).toHaveCount(0, { timeout: 15000 });
}

async function assertNoUnauthorizedNetwork(): Promise<void> {
  const unauthorized = network.filter(entry => entry.status === 401);
  expect(
    unauthorized,
    `No API call should return 401: ${unauthorized.map(entry => entry.url).join(', ')}`
  ).toHaveLength(0);
}

async function assertNoServerErrors(): Promise<void> {
  const serverErrors = network.filter(entry => entry.status >= 500);
  expect(
    serverErrors,
    `No API call should return 5xx: ${serverErrors.map(entry => entry.url).join(', ')}`
  ).toHaveLength(0);
}

test.describe('Property Workbench production runtime smoke', () => {
  test.afterAll(async () => {
    await writeEvidence(
      'Smoke verifies the backend-hosted production bundle with an existing Development-only JWT smoke session.'
    );
  });

  test('boots shell and walks canonical Workbench tabs with authenticated parcel evidence', async ({
    page,
  }) => {
    await ensureEvidenceDir();

    page.on('console', message => {
      const location = message.location();
      const locationSuffix = location.url
        ? ` (${location.url}:${location.lineNumber}:${location.columnNumber})`
        : '';
      consoleLines.push(`[${message.type()}] ${message.text()}${locationSuffix}`);
    });
    page.on('pageerror', error => {
      consoleLines.push(`[pageerror] ${error.message}`);
    });
    page.on('response', response => {
      const url = response.url();
      if (!response.ok()) {
        failedResponses.push({
          method: response.request().method(),
          url,
          status: response.status(),
          ok: response.ok(),
        });
      }
      if (url.includes('/api/') || url.includes('/ops/') || url.includes('/hubs/')) {
        network.push({
          method: response.request().method(),
          url,
          status: response.status(),
          ok: response.ok(),
        });
      }
    });

    const api = await request.newContext({ baseURL: baseUrl() });
    const auth = await fetchDevToken(api);
    const parcelId = await resolveSmokeParcel(api, auth.token);
    await page.setExtraHTTPHeaders({ Authorization: `Bearer ${auth.token}` });
    await installSmokeSession(page, auth, parcelId);

    await page.goto(`/property/${encodeURIComponent(parcelId)}`);
    await expect(page.getByTestId('desktop')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('desktop-top-system-bar')).toBeVisible();
    await expect(page.getByTestId('shell-routed-content')).toBeVisible();
    await expect(page.getByTestId('property-workbench-root')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('context-ribbon')).toContainText(parcelId, { timeout: 30000 });
    await expect(page.getByTestId('workbench-rail')).toBeVisible();
    expect(
      await page.getByRole('navigation').count(),
      'Shell dock and Workbench rail navigation should both be present'
    ).toBeGreaterThanOrEqual(2);
    await assertNoInfiniteLoading(page);
    await capture(page, '00 shell loaded', '00-shell-loaded', `Parcel ${parcelId}`);

    await expect(page.getByText(parcelId).first()).toBeVisible();
    await capture(page, '01 summary tab', '01-summary');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/forge?subTab=cost`);
    await expect(page.getByTestId('property-forge-tab')).toBeVisible({ timeout: 30000 });
    await assertNoInfiniteLoading(page);
    await capture(page, '02 forge cost', '02-forge-cost');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/forge?subTab=sales`);
    await expect(page.getByTestId('property-forge-tab')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('sales-comparison-host')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('comparable-sales-panel')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Loading sales comparison data...')).toHaveCount(0, {
      timeout: 30000,
    });
    expect(
      (await page.getByTestId('sales-comparison-live').count()) +
        (await page.getByTestId('sales-comparison-empty').count()),
      'Sales Summary must settle to live data or an explicit unavailable state'
    ).toBeGreaterThanOrEqual(1);
    await assertNoInfiniteLoading(page);
    await capture(page, '03 forge sales compsforge', '03-forge-sales-compsforge');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/atlas`);
    await expect(page.getByTestId('property-atlas-tab')).toBeVisible({ timeout: 30000 });
    await assertNoInfiniteLoading(page);
    await capture(page, '04 atlas', '04-atlas');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/dais`);
    await expect(page.getByTestId('property-dais-tab')).toBeVisible({ timeout: 30000 });
    await assertNoInfiniteLoading(page);
    await capture(page, '05 dais', '05-dais');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/dossier`);
    await expect(page.getByTestId('property-dossier-tab')).toBeVisible({ timeout: 30000 });
    await assertNoInfiniteLoading(page);
    await capture(page, '06 dossier', '06-dossier');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/pilot`);
    await expect(page.getByTestId('property-pilot-tab')).toBeVisible({ timeout: 30000 });
    await assertNoInfiniteLoading(page);
    await capture(page, '07 pilot', '07-pilot');

    await assertNoUnauthorizedNetwork();
    await assertNoServerErrors();
    await api.dispose();
  });
});

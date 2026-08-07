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
  const apiPort = process.env.TF_API_PORT ?? '5046';
  return (
    process.env.WORKBENCH_SMOKE_BASE_URL ?? process.env.BASE_URL ?? `http://127.0.0.1:${apiPort}`
  );
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

  const unauthorized = network.filter(entry => entry.status === 401 || entry.status === 403);
  const failedApi = network.filter(entry => entry.url.includes('/api/') && entry.status >= 400);
  const markdown = [
    '# Property Workbench Local Synthetic Parcel Journey',
    '',
    `Base URL: ${baseUrl()}`,
    `Parcel: ${process.env.WORKBENCH_SMOKE_PARCEL_ID ?? 'auto-selected synthetic parcel'}`,
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

  const response = await api.get('/api/properties?page=1&pageSize=25', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), 'smoke must be able to read at least one live property').toBe(true);
  const payload = await response.json();
  const candidates = (payload.items ?? [])
    .map((item: Record<string, unknown>) => item.parcelNumber ?? item.parcelId ?? item.geoId)
    .filter(Boolean)
    .map(String);
  expect(
    candidates.length,
    'synthetic properties feed must expose parcel identifiers'
  ).toBeGreaterThan(0);

  for (const parcel of candidates) {
    const parcelResponse = await api.get(`/api/properties/parcel/${encodeURIComponent(parcel)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (parcelResponse.ok()) return parcel;
  }

  throw new Error(
    'smoke could not find a listed parcel that loads from synthetic property evidence'
  );
}

async function assertAuthenticatedParcelApiBoundary(
  api: APIRequestContext,
  auth: { token: string; countyId?: string },
  parcelId: string
): Promise<void> {
  const parcelPath = `/api/properties/parcel/${encodeURIComponent(parcelId)}`;
  const unauthenticated = await api.get(parcelPath);
  expect(unauthenticated.status(), 'parcel detail must reject a missing identity').toBe(401);

  const invalidIdentity = await api.get(parcelPath, {
    headers: { Authorization: 'Bearer invalid-local-smoke-token' },
  });
  expect(invalidIdentity.status(), 'parcel detail must reject an invalid identity').toBe(401);

  const mismatchedCounty = await api.get(
    '/api/properties?page=1&pageSize=1&countyId=00000000-0000-0000-0000-000000000001',
    { headers: { Authorization: `Bearer ${auth.token}` } }
  );
  expect(
    mismatchedCounty.status(),
    'search must reject a county outside the authenticated claim'
  ).toBe(403);

  const unknownParcel = await api.get('/api/properties/parcel/WO-SR-009A-UNKNOWN', {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(unknownParcel.status(), 'unknown synthetic parcels must return not found').toBe(404);

  const detail = await api.get(parcelPath, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(detail.ok(), 'authorized synthetic parcel detail must load').toBe(true);
  const payload = await detail.json();
  expect(payload.countyId, 'parcel detail county must equal the authenticated county').toBe(
    auth.countyId
  );
}

async function assertAuthenticatedDaisAppealBoundary(
  api: APIRequestContext,
  auth: { token: string; countyId?: string },
  parcelId: string
): Promise<void> {
  const path = `/api/dais/appeals/parcel/${encodeURIComponent(parcelId)}/workflow-read`;
  const unauthenticated = await api.get(path);
  expect(unauthenticated.status(), 'Dais appeal read must reject a missing identity').toBe(401);

  const response = await api.get(path, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(response.ok(), 'authorized synthetic Dais appeal read must load').toBe(true);
  const payload = await response.json();
  expect(payload.schemaVersion).toBe('1.0.0');
  expect(payload.countyId).toBe(auth.countyId);
  expect(payload.appeals).toHaveLength(1);
  expect(payload.appeals[0]).toMatchObject({
    appealId: 'be0900a0-0000-0000-0000-0000000000c1',
    parcelId,
    taxYear: 2026,
    ground: 'MARKET_VALUE',
    status: 'filed',
  });
  expect(JSON.stringify(payload)).not.toContain('be0900a0-0000-0000-0000-0000000000c2');
  expect(payload.appeals[0]).not.toHaveProperty('petitionerName');
  expect(payload.appeals[0]).not.toHaveProperty('currentValue');
  expect(payload.appeals[0]).not.toHaveProperty('requestedValue');
}

async function installSmokeSession(
  page: Page,
  auth: { token: string; countyId?: string; countyCode?: string },
  parcelId: string
): Promise<void> {
  await page.addInitScript(
    ({ token, countyId, countyCode, parcelId }) => {
      // Playwright's isolated browser profile is destroyed after the proof.
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
  const unauthorized = network.filter(entry => entry.status === 401 || entry.status === 403);
  expect(
    unauthorized,
    `No API call should return 401/403: ${unauthorized.map(entry => entry.url).join(', ')}`
  ).toHaveLength(0);
}

async function assertNoParcelJourneyServerErrors(): Promise<void> {
  const serverErrors = network.filter(
    entry =>
      entry.status >= 500 &&
      (entry.url.includes('/api/auth/') ||
        entry.url.includes('/api/properties') ||
        entry.url.includes('/api/dais/appeals/'))
  );
  expect(
    serverErrors,
    `The authenticated parcel-acquisition path must not return 5xx: ${serverErrors.map(entry => entry.url).join(', ')}`
  ).toHaveLength(0);
}

test.describe('Property Workbench local synthetic parcel journey', () => {
  test.afterAll(async () => {
    await writeEvidence(
      'Smoke verifies a backend-hosted local bundle with Development-only synthetic data and an ephemeral JWT session.'
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
      const status = response.status();
      if (status >= 400) {
        failedResponses.push({
          method: response.request().method(),
          url,
          status,
          ok: false,
        });
      }
      if (url.includes('/api/') || url.includes('/ops/') || url.includes('/hubs/')) {
        network.push({
          method: response.request().method(),
          url,
          status,
          ok: status < 400,
        });
      }
    });

    const api = await request.newContext({ baseURL: baseUrl() });
    const auth = await fetchDevToken(api);
    if (!auth.countyId) {
      throw new Error('Synthetic auth response did not include a countyId claim.');
    }
    const parcelId = await resolveSmokeParcel(api, auth.token);
    await assertAuthenticatedParcelApiBoundary(api, auth, parcelId);
    await assertAuthenticatedDaisAppealBoundary(api, auth, parcelId);
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
    const unauthenticatedAtlas = await api.get(
      `/api/parcels/${encodeURIComponent(parcelId)}/atlas-projection`
    );
    expect([401, 403]).toContain(unauthenticatedAtlas.status());

    const canonicalAtlas = await api.get(
      `/api/parcels/${encodeURIComponent(parcelId)}/atlas-projection`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    expect(
      canonicalAtlas.status(),
      'the WO-SR-009C journey must run with the exact local Atlas projection enabled'
    ).toBe(200);
    const feature = await canonicalAtlas.json();
    expect(feature, 'a 200 projection response must carry a canonical Feature').not.toBeNull();
    expect(feature).toMatchObject({
      type: 'Feature',
      geometry: { type: 'Polygon' },
      properties: {
        parcelId,
        countyId: auth.countyId,
        evidenceState: 'canonical',
      },
    });
    await expect(page.getByTestId('atlas-projection-polygon')).toHaveCount(1, { timeout: 30000 });
    await expect(page.getByText(/canonical Point/i)).toHaveCount(0);
    await assertNoInfiniteLoading(page);
    await capture(page, '04 atlas', '04-atlas');

    await page.goto(`/property/${encodeURIComponent(parcelId)}/dais`);
    await expect(page.getByTestId('property-dais-tab')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('dais-appeals-loaded')).toContainText('1 appeal', {
      timeout: 30000,
    });
    await expect(page.getByText(/filed - MARKET VALUE/)).toBeVisible();
    await expect(page.getByText(/Tax year 2026/)).toBeVisible();
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
    await assertNoParcelJourneyServerErrors();
    await api.dispose();
  });
});

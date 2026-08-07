import { expect, request, test, type Page, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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
const CANONICAL_TF_PARCEL_ID = 'be0900a0-0000-0000-0000-0000000000a1';
const UNAVAILABLE_TF_PARCEL_ID = 'be0900a0-0000-0000-0000-0000000000a2';
const CROSS_COUNTY_TF_PARCEL_ID = 'be0900a0-0000-0000-0000-0000000000b1';
const UNAVAILABLE_PARCEL_NUMBER = 'SR009C-SYNTHETIC-NO-GEOMETRY';
const CROSS_COUNTY_PARCEL_NUMBER = 'SR009C-SYNTHETIC-CROSS-COUNTY';
const CROSS_COUNTY_ID = '20200020-2020-2020-2020-202020202020';
const CANONICAL_DOSSIER_EVIDENCE_ID = 'de0900d0-0000-0000-0000-0000000000d1';
const FOREIGN_DOSSIER_EVIDENCE_ID = 'de0900d0-0000-0000-0000-0000000000d2';

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

function sqliteExecutable(): string {
  const configured = process.env.SQLITE3_PATH?.trim();
  if (configured) return configured;

  const windowsPath = 'C:\\msys64\\mingw64\\bin\\sqlite3.exe';
  if (process.platform === 'win32' && existsSync(windowsPath)) return windowsPath;
  return 'sqlite3';
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlGuid(value: string): string {
  return sqlLiteral(value.toUpperCase());
}

function addMissingSqliteColumns(
  databasePath: string,
  tableName: string,
  columns: Readonly<Record<string, string>>,
): void {
  const tableInfo = execFileSync(
    sqliteExecutable(),
    [databasePath, `PRAGMA table_info(${sqlLiteral(tableName)});`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (!tableInfo.trim()) return;

  const existing = new Set(
    tableInfo
      .trim()
      .split(/\r?\n/)
      .map(line => line.split('|')[1]),
  );
  const additions = Object.entries(columns)
    .filter(([name]) => !existing.has(name))
    .map(([name, definition]) => `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${definition};`)
    .join('\n');

  if (additions) {
    execFileSync(sqliteExecutable(), [databasePath, additions], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
}

function seedCanonicalAtlasFixture(countyId: string, parcelNumber: string): void {
  const databasePath = process.env.WORKBENCH_SMOKE_DATABASE_PATH?.trim();
  if (!databasePath) {
    throw new Error('WORKBENCH_SMOKE_DATABASE_PATH is required for canonical Atlas smoke proof.');
  }

  const now = '2026-08-05T12:00:00.0000000Z';
  const sql = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS "tf_parcel" (
  "TfParcelId" TEXT NOT NULL PRIMARY KEY,
  "CountyId" TEXT NOT NULL,
  "ParcelNumber" TEXT NULL,
  "SitusAddress" TEXT NULL,
  "LegalDescription" TEXT NULL,
  "ParcelStatus" TEXT NOT NULL,
  "PropertyType" TEXT NULL,
  "CurrentOwnerId" TEXT NULL,
  "CurrentAssessmentId" TEXT NULL,
  "ConversionEra" TEXT NULL,
  "CreatedAt" TEXT NOT NULL,
  "UpdatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "tf_parcel_geom" (
  "TfParcelGeomId" TEXT NOT NULL PRIMARY KEY,
  "TfParcelId" TEXT NULL,
  "CountyId" TEXT NOT NULL,
  "ArcGisObjectId" INTEGER NOT NULL,
  "ArcGisApn" TEXT NULL,
  "GeomWkt" TEXT NOT NULL,
  "CentroidLat" REAL NOT NULL,
  "CentroidLon" REAL NOT NULL,
  "AreaSqFt" REAL NOT NULL,
  "SourceServiceUrl" TEXT NOT NULL,
  "LastSyncedAt" TEXT NOT NULL,
  "IsActive" INTEGER NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  "UpdatedAt" TEXT NOT NULL
);
DELETE FROM "tf_parcel_geom" WHERE "TfParcelId" IN (
  ${sqlGuid(CANONICAL_TF_PARCEL_ID)},
  ${sqlGuid(UNAVAILABLE_TF_PARCEL_ID)},
  ${sqlGuid(CROSS_COUNTY_TF_PARCEL_ID)}
);
DELETE FROM "tf_parcel" WHERE "TfParcelId" IN (
  ${sqlGuid(CANONICAL_TF_PARCEL_ID)},
  ${sqlGuid(UNAVAILABLE_TF_PARCEL_ID)},
  ${sqlGuid(CROSS_COUNTY_TF_PARCEL_ID)}
);
INSERT INTO "tf_parcel" (
  "TfParcelId", "CountyId", "ParcelNumber", "SitusAddress", "LegalDescription",
  "ParcelStatus", "PropertyType", "CurrentOwnerId", "CurrentAssessmentId",
  "ConversionEra", "CreatedAt", "UpdatedAt"
) VALUES
  (${sqlGuid(CANONICAL_TF_PARCEL_ID)}, ${sqlGuid(countyId)}, ${sqlLiteral(parcelNumber)},
   '100 Synthetic Proof Way', NULL, 'ACTIVE', 'R', NULL, NULL, NULL, ${sqlLiteral(now)}, ${sqlLiteral(now)}),
  (${sqlGuid(UNAVAILABLE_TF_PARCEL_ID)}, ${sqlGuid(countyId)}, ${sqlLiteral(UNAVAILABLE_PARCEL_NUMBER)},
   '101 Synthetic Proof Way', NULL, 'ACTIVE', 'R', NULL, NULL, NULL, ${sqlLiteral(now)}, ${sqlLiteral(now)}),
  (${sqlGuid(CROSS_COUNTY_TF_PARCEL_ID)}, ${sqlGuid(CROSS_COUNTY_ID)}, ${sqlLiteral(CROSS_COUNTY_PARCEL_NUMBER)},
   '200 Cross County Sentinel Way', NULL, 'ACTIVE', 'R', NULL, NULL, NULL, ${sqlLiteral(now)}, ${sqlLiteral(now)});
INSERT INTO "tf_parcel_geom" (
  "TfParcelGeomId", "TfParcelId", "CountyId", "ArcGisObjectId", "ArcGisApn",
  "GeomWkt", "CentroidLat", "CentroidLon", "AreaSqFt", "SourceServiceUrl",
  "LastSyncedAt", "IsActive", "CreatedAt", "UpdatedAt"
) VALUES
  (${sqlGuid('be0900a0-0000-0000-0000-0000000000d1')}, ${sqlGuid(CANONICAL_TF_PARCEL_ID)},
   ${sqlGuid(countyId)}, 9001, ${sqlLiteral(parcelNumber)},
   'POLYGON((-119.30 46.20, -119.20 46.20, -119.20 46.30, -119.30 46.30, -119.30 46.20))',
   46.233, -119.250, 125000.0, 'synthetic://wo-sr-009c/same-county',
   ${sqlLiteral(now)}, 1, ${sqlLiteral(now)}, ${sqlLiteral(now)}),
  (${sqlGuid('be0900a0-0000-0000-0000-0000000000d2')}, ${sqlGuid(CROSS_COUNTY_TF_PARCEL_ID)},
   ${sqlGuid(CROSS_COUNTY_ID)}, 9002, ${sqlLiteral(CROSS_COUNTY_PARCEL_NUMBER)},
   'POLYGON((-120.30 47.20, -120.20 47.20, -120.20 47.30, -120.30 47.30, -120.30 47.20))',
   47.233, -120.250, 225000.0, 'synthetic://wo-sr-009c/cross-county-sentinel',
   ${sqlLiteral(now)}, 1, ${sqlLiteral(now)}, ${sqlLiteral(now)});
`;

  execFileSync(sqliteExecutable(), [databasePath, sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function seedCanonicalDossierFixture(countyId: string, parcelNumber: string): void {
  const databasePath = process.env.WORKBENCH_SMOKE_DATABASE_PATH?.trim();
  if (!databasePath) {
    throw new Error('WORKBENCH_SMOKE_DATABASE_PATH is required for canonical Dossier smoke proof.');
  }

  // The local SQLite bootstrap may be pinned to the initial property migration. Add only the
  // current nullable projection columns required by EF; the disposable database is deleted later.
  addMissingSqliteColumns(databasePath, 'Properties', {
    LegalDescription: 'TEXT NULL',
    Neighborhood: 'TEXT NULL',
    PropertyUseCode: 'TEXT NULL',
    TaxDistrictCode: 'TEXT NULL',
    TaxDistrictName: 'TEXT NULL',
    SitusCity: 'TEXT NULL',
    SitusState: 'TEXT NULL',
    SitusZip: 'TEXT NULL',
    Zoning: 'TEXT NULL',
    LotWidthFront: 'TEXT NULL',
    LotDepth: 'TEXT NULL',
  });

  const sql = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS "Counties" (
  "Id" TEXT NOT NULL PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "State" TEXT NOT NULL,
  "FipsCode" TEXT NOT NULL,
  "Population" INTEGER NOT NULL,
  "Area" REAL NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  "UpdatedAt" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "Properties" (
  "Id" TEXT NOT NULL PRIMARY KEY,
  "PropertyId" TEXT NOT NULL,
  "ParcelId" TEXT NOT NULL,
  "ParcelNumber" TEXT NOT NULL,
  "Address" TEXT NOT NULL,
  "OwnerName" TEXT NULL,
  "OwnerSSN" TEXT NULL,
  "PropertyType" TEXT NULL,
  "LegalDescription" TEXT NULL,
  "Neighborhood" TEXT NULL,
  "PropertyUseCode" TEXT NULL,
  "TaxDistrictCode" TEXT NULL,
  "TaxDistrictName" TEXT NULL,
  "SitusCity" TEXT NULL,
  "SitusState" TEXT NULL,
  "SitusZip" TEXT NULL,
  "Zoning" TEXT NULL,
  "YearBuilt" INTEGER NULL,
  "LotWidthFront" TEXT NULL,
  "LotDepth" TEXT NULL,
  "AssessedValue" TEXT NOT NULL,
  "LandValue" TEXT NOT NULL,
  "ImprovementValue" TEXT NOT NULL,
  "MarketValue" TEXT NOT NULL,
  "AssessmentDate" TEXT NOT NULL,
  "LastUpdated" TEXT NOT NULL,
  "TaxYear" INTEGER NOT NULL,
  "CountyId" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  "UpdatedAt" TEXT NOT NULL,
  FOREIGN KEY ("CountyId") REFERENCES "Counties" ("Id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Properties_ParcelId" ON "Properties" ("ParcelId");
CREATE TABLE IF NOT EXISTS "CamaCharacteristics" (
  "Id" TEXT NOT NULL PRIMARY KEY,
  "CountyId" TEXT NOT NULL,
  "ParcelId" TEXT NOT NULL,
  "TaxYear" INTEGER NOT NULL,
  "SquareFeet" REAL NULL,
  "BasementSqft" REAL NULL,
  "GarageSqft" REAL NULL,
  "YearBuilt" INTEGER NULL,
  "Bedrooms" INTEGER NULL,
  "Bathrooms" REAL NULL,
  "LandAreaSqft" REAL NULL
);
CREATE TABLE IF NOT EXISTS "DossierEvidenceItems" (
  "Id" TEXT NOT NULL PRIMARY KEY,
  "ParcelId" TEXT NOT NULL,
  "Title" TEXT NOT NULL,
  "EvidenceType" TEXT NOT NULL,
  "Integrity" TEXT NOT NULL,
  "DocumentId" TEXT NULL,
  "CountyId" TEXT NOT NULL,
  "CreatedBy" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  FOREIGN KEY ("CountyId") REFERENCES "Counties" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_DossierEvidenceItems_CountyId_ParcelId"
  ON "DossierEvidenceItems" ("CountyId", "ParcelId");
INSERT OR IGNORE INTO "Counties" (
  "Id", "Name", "State", "FipsCode", "Population", "Area", "CreatedAt", "UpdatedAt"
) VALUES
  (${sqlGuid(countyId)}, 'SR-009D authenticated synthetic county', 'WA', '019', 0, 0,
   '2026-08-07T00:00:00.0000000Z', '2026-08-07T00:00:00.0000000Z'),
  (${sqlGuid(CROSS_COUNTY_ID)}, 'SR-009D foreign synthetic county', 'WA', '020', 0, 0,
   '2026-08-07T00:00:00.0000000Z', '2026-08-07T00:00:00.0000000Z');
DELETE FROM "Properties" WHERE "ParcelId" = ${sqlLiteral(parcelNumber)};
INSERT INTO "Properties" (
  "Id", "PropertyId", "ParcelId", "ParcelNumber", "Address", "OwnerName", "OwnerSSN",
  "PropertyType", "LegalDescription", "Neighborhood", "PropertyUseCode", "TaxDistrictCode",
  "TaxDistrictName", "SitusCity", "SitusState", "SitusZip", "Zoning", "YearBuilt",
  "LotWidthFront", "LotDepth", "AssessedValue", "LandValue", "ImprovementValue", "MarketValue",
  "AssessmentDate", "LastUpdated", "TaxYear", "CountyId", "CreatedAt", "UpdatedAt"
) VALUES (
  ${sqlGuid('de0900d0-0000-0000-0000-0000000000f1')}, '9001', ${sqlLiteral(parcelNumber)},
  ${sqlLiteral(parcelNumber)}, '100 Synthetic Dossier Proof Way', 'Synthetic Owner', NULL,
  'Residential', 'Synthetic proof parcel', 'SYN', 'R', 'SYN', 'Synthetic District',
  'Prosser', 'WA', '99350', 'R1', 2001, NULL, NULL, 250000, 75000, 175000, 275000,
  '2026-01-01T00:00:00.0000000Z', '2026-08-07T12:00:00.0000000Z', 2026,
  ${sqlGuid(countyId)}, '2026-08-07T12:00:00.0000000Z', '2026-08-07T12:00:00.0000000Z'
);
DELETE FROM "DossierEvidenceItems" WHERE "Id" IN (
  ${sqlGuid(CANONICAL_DOSSIER_EVIDENCE_ID)},
  ${sqlGuid(FOREIGN_DOSSIER_EVIDENCE_ID)}
);
INSERT INTO "DossierEvidenceItems" (
  "Id", "ParcelId", "Title", "EvidenceType", "Integrity", "DocumentId",
  "CountyId", "CreatedBy", "CreatedAt"
) VALUES
  (${sqlGuid(CANONICAL_DOSSIER_EVIDENCE_ID)}, ${sqlLiteral(parcelNumber)},
   'Canonical synthetic field inspection', 'field-inspection', 'verified', NULL,
   ${sqlGuid(countyId)}, 'wo-sr-009d-synthetic', '2026-08-07T12:00:00.0000000Z'),
  (${sqlGuid(FOREIGN_DOSSIER_EVIDENCE_ID)}, ${sqlLiteral(CROSS_COUNTY_PARCEL_NUMBER)},
   'Foreign county sentinel', 'photo', 'verified', NULL,
   ${sqlGuid(CROSS_COUNTY_ID)}, 'wo-sr-009d-synthetic', '2026-08-07T11:00:00.0000000Z');
`;
  execFileSync(sqliteExecutable(), [databasePath, sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function assertCanonicalDossierBoundary(
  api: APIRequestContext,
  token: string,
  parcelNumber: string,
): Promise<void> {
  const headers = { Authorization: `Bearer ${token}`, 'X-Correlation-ID': 'corr-sr009d-smoke' };
  const response = await api.get(
    `/api/dossier/parcels/${encodeURIComponent(parcelNumber)}/evidence/registry?limit=25&offset=0`,
    { headers },
  );
  const responseText = await response.text();
  expect(response.status(), responseText).toBe(200);
  const body = JSON.parse(responseText);
  expect(body).toMatchObject({
    schemaVersion: '1.0.0',
    parcelId: parcelNumber,
    total: 1,
    hasMore: false,
    traceId: 'corr-sr009d-smoke',
  });
  expect(body.results).toEqual([
    expect.objectContaining({
      evidenceId: CANONICAL_DOSSIER_EVIDENCE_ID,
      evidenceType: 'field-inspection',
      integrity: 'verified',
    }),
  ]);

  const foreign = await api.get(
    `/api/dossier/parcels/${encodeURIComponent(CROSS_COUNTY_PARCEL_NUMBER)}/evidence/registry?limit=25&offset=0`,
    { headers },
  );
  expect(foreign.status()).toBe(200);
  expect(await foreign.json()).toMatchObject({ results: [], total: 0, hasMore: false });
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

  test('proves the authenticated canonical Dossier read with disposable SQLite evidence', async ({
    page,
  }) => {
    await ensureEvidenceDir();
    const api = await request.newContext({ baseURL: baseUrl() });
    const auth = await fetchDevToken(api);
    if (!auth.countyId) {
      throw new Error('Synthetic auth response did not include a countyId claim.');
    }

    const parcelId = await resolveSmokeParcel(api, auth.token);
    seedCanonicalDossierFixture(auth.countyId, parcelId);
    await assertCanonicalDossierBoundary(api, auth.token, parcelId);
    await page.setExtraHTTPHeaders({ Authorization: `Bearer ${auth.token}` });
    await installSmokeSession(page, auth, parcelId);

    await page.goto(`/property/${encodeURIComponent(parcelId)}/dossier`);
    await expect(page.getByTestId('property-dossier-tab')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('canonical-evidence-loaded')).toContainText(
      CANONICAL_DOSSIER_EVIDENCE_ID,
      { timeout: 30000 },
    );
    await assertNoInfiniteLoading(page);

    const registryPattern = '**/api/dossier/parcels/*/evidence/registry?*';
    await page.route(registryPattern, route => route.fulfill({
      status: 503,
      contentType: 'application/problem+json',
      headers: { 'X-Correlation-ID': 'corr-dossier-smoke-error' },
      body: JSON.stringify({ title: 'Synthetic registry outage' }),
    }));
    await page.reload();
    await expect(page.getByTestId('canonical-evidence-error')).toContainText(
      'corr-dossier-smoke-error',
      { timeout: 30000 },
    );
    await expect(page.getByRole('button', { name: 'Copy Correlation ID' })).toBeVisible();
    await page.unroute(registryPattern);
    await api.dispose();
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
    seedCanonicalAtlasFixture(auth.countyId, parcelId);
    seedCanonicalDossierFixture(auth.countyId, parcelId);
    await assertAuthenticatedParcelApiBoundary(api, auth, parcelId);
    await assertAuthenticatedDaisAppealBoundary(api, auth, parcelId);
    await assertCanonicalDossierBoundary(api, auth.token, parcelId);
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
        parcelId: CANONICAL_TF_PARCEL_ID,
        countyId: auth.countyId,
        evidenceState: 'canonical',
      },
    });
    const unavailableAtlas = await api.get(
      `/api/parcels/${encodeURIComponent(UNAVAILABLE_PARCEL_NUMBER)}/atlas-projection`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    expect(unavailableAtlas.status()).toBe(200);
    expect(await unavailableAtlas.json()).toBeNull();

    const crossCountyAtlas = await api.get(
      `/api/parcels/${encodeURIComponent(CROSS_COUNTY_PARCEL_NUMBER)}/atlas-projection`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );
    expect(crossCountyAtlas.status()).toBe(404);
    await expect(page.getByTestId('atlas-projection-polygon')).toHaveCount(1, { timeout: 30000 });
    await expect(page.getByText(/canonical Point/i)).toHaveCount(0);
    await assertNoInfiniteLoading(page);
    await capture(page, '04 atlas', '04-atlas');

    const atlasProjectionPath = `**/api/parcels/${encodeURIComponent(parcelId)}/atlas-projection`;
    await page.route(atlasProjectionPath, async route => {
      await route.fulfill({ status: 503, body: '' });
    });
    await page.reload();
    await expect(page.getByTestId('property-atlas-tab')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('atlas-projection-unavailable')).toBeVisible({ timeout: 30000 });
    await page.unroute(atlasProjectionPath);

    const correlationId = 'corr-sr009c-browser-proof';
    await page.route(atlasProjectionPath, async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        headers: { 'x-correlation-id': correlationId },
        body: JSON.stringify({ title: 'Synthetic Atlas failure proof' }),
      });
    });
    await page.reload();
    const atlasError = page.getByTestId('atlas-projection-error');
    await expect(atlasError).toBeVisible({ timeout: 30000 });
    await expect(atlasError).toContainText(correlationId);
    await expect(page.getByRole('button', { name: 'Copy Atlas correlation ID' })).toBeEnabled();
    await page.unroute(atlasProjectionPath);

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
    await expect(page.getByTestId('canonical-evidence-loaded')).toContainText(
      CANONICAL_DOSSIER_EVIDENCE_ID,
      { timeout: 30000 },
    );
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

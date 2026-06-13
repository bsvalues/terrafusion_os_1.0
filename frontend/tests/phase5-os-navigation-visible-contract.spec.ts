import { expect, test, type Page, type Response } from '@playwright/test';

const PARCEL_ID = '101040000000000';
const EXPLICIT_ERROR_TEXT =
  /HTTP 401|HTTP 403|HTTP 500|401 Unauthorized|403 Forbidden|500 Internal Server Error|Internal Server Error|Unauthorized|Forbidden/i;

function collectRuntimeFailures(page: Page): string[] {
  const failures: string[] = [];

  page.on('response', (response: Response) => {
    const url = response.url();
    const status = response.status();

    if (url.includes('/api/') && [401, 403, 500].includes(status)) {
      failures.push(`${status} ${url}`);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText ?? '';

    if (url.includes('/api/') && errorText !== 'net::ERR_ABORTED') {
      failures.push(`requestfailed ${url} ${errorText}`.trim());
    }
  });

  return failures;
}

async function expectNoRuntimeFailures(page: Page, failures: string[]) {
  await page.waitForTimeout(500);
  expect(failures).toEqual([]);
  await expect(page.locator('body')).not.toContainText(EXPLICIT_ERROR_TEXT);
}

test('Phase 5 OS navigation visible contract', async ({ page }) => {
  const runtimeFailures = collectRuntimeFailures(page);

  await page.goto('/');
  await expect(page.getByText('TerraFusion OS Desktop')).toBeVisible();
  await expect(page.getByText('EXECUTIVE COMMAND SURFACE')).toBeVisible();
  await expect(page.getByText('39 Washington counties registered')).toBeVisible();
  await expect(page.getByText('canonicalImportAllowed: false for intake counties')).toBeVisible();
  await expect(page.getByText('Map layer unavailable: Mapbox token not configured')).toBeVisible();
  await expectNoRuntimeFailures(page, runtimeFailures);

  await page.getByRole('button', { name: 'TerraForge' }).click();
  await expect(page.getByText('TERRAFORGE RUNTIME STATUS')).toBeVisible();
  await expect(page.getByText('FULL TERRAFORGE NOT DONE')).toBeVisible();
  await expect(page.getByText(/Metrics app-backed; county rollup (blocked|resolving)/i)).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/LIVE METRICS|128,784|\$469,565|95,758|71\.4%/);
  await expectNoRuntimeFailures(page, runtimeFailures);

  await page.getByTestId('window-controls').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('TERRAFORGE RUNTIME STATUS')).toHaveCount(0);

  await page.getByRole('button', { name: /Open Workbench/i }).click();
  await expect(page.getByTestId('window')).toBeVisible();
  await expect(page.getByTestId('window-titlebar')).toContainText('Property Workbench');
  await expect(page.locator('.window-drag-handle')).toBeVisible();
  await expect(page.locator('.cursor-se-resize')).toBeVisible();
  await expect(page.getByText('No Parcel Selected')).toBeVisible();
  await expect(page.getByPlaceholder('Parcel ID')).toBeVisible();

  await page.getByPlaceholder('Parcel ID').fill(PARCEL_ID);
  await page.getByRole('button', { name: 'Open Parcel' }).click();
  await expect(page.getByText('IDENTITY')).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(PARCEL_ID).first()).toBeVisible();
  await expect(page.getByText('Benton County').first()).toBeVisible();
  for (const tabName of ['Summary', 'Forge', 'Atlas', 'Dais', 'Clerk', 'Treasury', 'Audit', 'Dossier', 'Pilot']) {
    await expect(page.getByText(tabName, { exact: true }).first()).toBeVisible();
  }
  await expectNoRuntimeFailures(page, runtimeFailures);

  await page.getByRole('button', { name: /Search \(Ctrl\+K\)/i }).click();
  await page.getByText('Open Counties Hub').click();
  await expect(page.getByText('Washington County Integration Hub')).toBeVisible();
  await expect(page.getByTestId('county-runtime-posture-summary')).toContainText('Washington counties');
  await expect(page.getByTestId('county-runtime-posture-summary')).toContainText('39');
  await expect(page.getByTestId('county-runtime-posture-summary')).toContainText('Benton County');
  await expect(page.getByTestId('county-runtime-posture-summary')).toContainText('Runtime-enabled');
  await expect(page.getByTestId('county-runtime-posture-boundary')).toContainText('Yakima County');
  await expect(page.getByTestId('county-runtime-posture-boundary')).toContainText('runtimeActionsAllowed: false');
  await expect(page.getByTestId('county-runtime-posture-boundary')).toContainText('canonicalImportAllowed: false');
  await expect(page.getByTestId('county-runtime-posture-boundary')).toContainText('source-provenance-onboarding-intake');
  await expect(page.getByText(/runtime actions are blocked|runtime actions remain blocked/i)).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/TEST-PARCEL-001|sample parcel|random parcel/i);
  await expectNoRuntimeFailures(page, runtimeFailures);
});

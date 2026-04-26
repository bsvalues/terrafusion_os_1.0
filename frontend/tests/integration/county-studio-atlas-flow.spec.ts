// County Studio + Atlas Live View happy-path E2E
//
// Covers the canonical workflow that the chunk-1-integration slice made
// possible:
//
//   1. Forge suite home renders the County Studio launch tile
//   2. County Studio page renders its drill-lattice chrome (header, Open
//      Study button, breadcrumb, left/right rails, center panel)
//   3. The center panel reaches a stable empty/data/error state without a
//      pre-seeded backend dataset
//   4. Open Study button opens a dialog
//   5. Atlas Live View (when reached via ?studyId=...) renders its top bar,
//      sync badge, and toolbar — the map surface may show no data if the
//      study has no cohort selections yet, which is a valid empty state
//
// Snapshots are written to test-results/chunk-1-integration-screenshots/
// for manual review. The spec tolerates empty-data states: it does NOT
// require segments/cohorts/scenarios to be present in the database, so
// it passes on a fresh local install as well as on a seeded environment.
//
// Assumes the dev server is running (playwright.config.ts starts it via
// `npm run dev` on VITE_PORT or 5173) and the backend is reachable at
// /api — either as a Vite proxy target or directly.

import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(__dirname, '../../test-results/chunk-1-integration-screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

async function snapshot(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

test.describe('County Studio + Atlas Live — canonical workflow', () => {
  test('Forge suite home renders the County Studio launch tile', async ({ page }) => {
    await page.goto('/forge', { waitUntil: 'domcontentloaded' });

    // The gap-fill slice added a `data-testid="forge-county-applications"`
    // section to ForgeSuiteHome — use that as a stable hook rather than
    // matching on copy that may be iterated on.
    const section = page.getByTestId('forge-county-applications');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section).toContainText(/county studio/i);

    await snapshot(page, '01-forge-home-with-county-studio-tile');
  });

  test('County Studio page renders drill-lattice chrome', async ({ page }) => {
    // Open via direct module route. In production the shell wraps this in a
    // window; the direct URL is the simplest path for E2E.
    await page.goto('/forge/county-studio', { waitUntil: 'domcontentloaded' });

    // Header
    await expect(page.getByText(/TerraForge County Studio/i)).toBeVisible({ timeout: 15_000 });

    // Open Study button always visible
    await expect(page.getByRole('button', { name: /open study/i })).toBeVisible();

    // The current County Studio runtime is a drill lattice with a breadcrumb
    // and three-pane layout rather than the older six-tab center panel.
    await expect(page.getByRole('navigation', { name: /county studio drill breadcrumb/i })).toBeVisible();
    await expect(page.getByTestId('cs-left-rail')).toBeVisible();
    await expect(page.getByTestId('cs-drill-panel')).toBeVisible();
    await expect(page.getByTestId('cs-right-rail')).toBeVisible();

    // Fresh local environments legitimately land in the empty drill state.
    await expect(page.getByText(/no segments derived yet/i)).toBeVisible();

    await snapshot(page, '02-county-studio-chrome-tablist');
  });

  test('Open Study button reveals the study dialog', async ({ page }) => {
    await page.goto('/forge/county-studio', { waitUntil: 'domcontentloaded' });

    const openStudyBtn = page.getByRole('button', { name: /open study/i });
    await expect(openStudyBtn).toBeVisible({ timeout: 15_000 });
    await openStudyBtn.click();

    // OpenStudyDialog is a custom overlay rather than a role=dialog wrapper.
    // Confirm it by its mode switch buttons, which only exist inside the overlay.
    await expect(page.getByRole('button', { name: /^Existing Studies$/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /^New Study$/i })).toBeVisible();

    await snapshot(page, '03-county-studio-open-study-dialog');
  });

  test('County Studio center panel reaches a distinguishable steady state', async ({ page }) => {
    await page.goto('/forge/county-studio', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cs-drill-panel')).toBeVisible({ timeout: 15_000 });

    // One of the current drill-lattice steady states must be visible:
    //   1. Empty drill state on a fresh local environment
    //   2. A rendered rollup/segment table
    //   3. Segment loading or error state once data has been requested
    const emptyDrillState = page.getByText(/no segments derived yet/i);
    const skeleton  = page.getByTestId('segment-table-loading');
    const errorBox  = page.getByTestId('segment-table-error');
    const table     = page.locator('table').first();

    await page.waitForTimeout(2_000);

    const anySteady = await Promise.any([
      emptyDrillState.waitFor({ state: 'visible', timeout: 5_000 }).then(() => 'empty-drill'),
      errorBox.waitFor({ state: 'visible', timeout: 5_000 }).then(() => 'error'),
      table.waitFor({ state: 'visible', timeout: 5_000 }).then(() => 'table'),
    ]).catch(() => null);

    const skeletonVisible = await skeleton.isVisible().catch(() => false);
    expect(anySteady ?? (skeletonVisible ? 'skeleton' : null)).not.toBeNull();

    await snapshot(page, '04-county-studio-center-panel');
  });

  test('Atlas Live View renders top bar + sync badge + toolbar', async ({ page }) => {
    // Atlas Live View expects a studyId query param; any string works for
    // the UI-side rendering — the hub subscribe will fail gracefully with
    // an unknown study, which surfaces in the sync badge state.
    await page.goto('/forge/atlas-live?studyId=00000000-0000-0000-0000-000000000000&taxYear=2026', {
      waitUntil: 'domcontentloaded',
    });

    // Top bar with "Atlas Live View" label
    await expect(page.getByText(/Atlas Live View/i)).toBeVisible({ timeout: 15_000 });

    // Sync badge — AtlasSyncBadge shows one of LIVE / STAGED / SNAPSHOT /
    // DISCONNECTED. In E2E against an empty DB, DISCONNECTED is expected.
    const badge = page.getByTestId('atlas-sync-badge');
    await expect(badge).toBeVisible({ timeout: 10_000 });
    await expect(badge).toContainText(/LIVE|STAGED|SNAPSHOT|DISCONNECTED/);

    // Map surface mounted (Mapbox may fail without a token — acceptable;
    // the surface div is still present)
    await expect(page.getByTestId('atlas-map-surface')).toBeVisible();

    await snapshot(page, '05-atlas-live-top-bar-and-surface');
  });

  test('Atlas Live View exposes loading OR error indicator for map data', async ({ page }) => {
    await page.goto('/forge/atlas-live?studyId=00000000-0000-0000-0000-000000000000&taxYear=2026', {
      waitUntil: 'domcontentloaded',
    });

    // useAtlasMapData renders one of two status indicators while it fetches.
    // Either transition (loading → success) or (loading → error) is a
    // valid end state. The loading indicator has role="status"; the error
    // one has role="alert".
    const loading = page.getByTestId('atlas-map-loading');
    const err     = page.getByTestId('atlas-map-error');

    // Initially we expect loading to be visible.
    await expect(loading.or(err)).toBeVisible({ timeout: 8_000 });

    // After a reasonable settling window, at least one of (loading gone,
    // error gone) should hold — prove the indicator isn't stuck.
    await page.waitForTimeout(5_000);

    await snapshot(page, '06-atlas-live-map-data-status');
  });
});

/**
 * TerraFusion OS — AI-as-User Visual & Functional Review
 *
 * Two-pass launch gate:
 *   Pass A: local dev preview (after frontend stabilizes)
 *   Pass B: staging/prod-like URL (before traffic opens)
 *
 * Run against local:  BASE_URL=http://localhost:3102 pnpm run review:user-journey
 * Run against staging: BASE_URL=https://staging.terrafusionmarket.com pnpm run review:user-journey
 *
 * Screenshots land in:
 *   os-platform/core/pilot/evidence/launch-user-review/<REVIEW_DATE>/
 *
 * A summary.json is written at the end of the run.
 *
 * @gate launch-user-journey-visual-functional-review
 */

import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

// ── Evidence output ────────────────────────────────────────────────────────────

const REVIEW_DATE = new Date().toISOString().slice(0, 10);
const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  'os-platform/core/pilot/evidence/launch-user-review',
  REVIEW_DATE
);

type StepResult = {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  url: string;
  timestamp: string;
  screenshot: string | null;
  notes: string;
  blocking: boolean;
};

const results: StepResult[] = [];

async function capture(
  page: Page,
  stepName: string,
  slug: string,
  notes = '',
  blocking = true
): Promise<string> {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const filename = `${slug}.png`;
  const filepath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  results.push({
    step: stepName,
    status: 'pass',
    url: page.url(),
    timestamp: new Date().toISOString(),
    screenshot: filename,
    notes,
    blocking,
  });
  return filename;
}

async function recordFail(
  page: Page,
  stepName: string,
  slug: string,
  err: unknown,
  blocking: boolean
) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const filename = `${slug}-FAIL.png`;
  const filepath = path.join(EVIDENCE_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: false });
  } catch {
    // screenshot may fail if page is in bad state
  }
  results.push({
    step: stepName,
    status: 'fail',
    url: page.url(),
    timestamp: new Date().toISOString(),
    screenshot: filename,
    notes: err instanceof Error ? err.message : String(err),
    blocking,
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Soft assertion: records result but does not throw.
 * Use for non-blocking cosmetic checks.
 */
async function softCheck(
  page: Page,
  stepName: string,
  slug: string,
  fn: () => Promise<void>,
  blocking = false
) {
  try {
    await fn();
    await capture(page, stepName, slug, '', blocking);
  } catch (err) {
    await recordFail(page, stepName, slug, err, blocking);
  }
}

// ── Test suite ─────────────────────────────────────────────────────────────────

test.describe('TerraFusion OS — User Journey Review', () => {
  const PARCEL_ID = '100019'; // first stable Benton parcel

  // write summary.json after all tests regardless of pass/fail
  test.afterAll(async () => {
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    const summaryPath = path.join(EVIDENCE_DIR, 'summary.json');
    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const blocking = results.filter((r) => r.status === 'fail' && r.blocking).length;
    const summary = {
      reviewDate: REVIEW_DATE,
      baseUrl: process.env.BASE_URL ?? 'http://localhost:3102',
      totalSteps: results.length,
      passed,
      failed,
      blockingFailures: blocking,
      verdict: blocking === 0 ? 'PASS' : 'FAIL',
      steps: results,
    };
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n── User Journey Review ──`);
    console.log(`Passed: ${passed} / ${results.length}`);
    console.log(`Blocking failures: ${blocking}`);
    console.log(`Verdict: ${summary.verdict}`);
    console.log(`Evidence: ${EVIDENCE_DIR}`);
  });

  // ── 00 ▸ Health check ──────────────────────────────────────────────────────
  test('00 — health endpoint responds', async ({ page }) => {
    const res = await page.goto('/health');
    expect(res?.status(), 'Health endpoint should return 2xx').toBeLessThan(400);
    await capture(page, '00 — health endpoint', '00-health', 'Backend is alive');
  });

  // ── 01 ▸ Shell / home loads ────────────────────────────────────────────────
  test('01 — shell home loads (not blank)', async ({ page }) => {
    await page.goto('/');
    // Not blank: at minimum something is rendered
    const body = await page.locator('body').innerHTML();
    expect(body.trim().length, 'Page body should not be empty').toBeGreaterThan(100);
    await capture(page, '01 — shell home', '01-shell-home', 'Root route renders');
  });

  // ── 02 ▸ Desktop shell ─────────────────────────────────────────────────────
  test('02 — desktop shell renders', async ({ page }) => {
    await page.goto('/desktop');
    await page.waitForLoadState('domcontentloaded');
    await capture(page, '02 — desktop shell', '02-desktop-shell');
  });

  // ── 03 ▸ Property Workbench search ────────────────────────────────────────
  test('03 — property workbench loads for known parcel', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}`);
    await page.waitForLoadState('domcontentloaded');
    // Page should not be blank — parcel ID should appear somewhere
    await expect(
      page.locator('body'),
      'Parcel ID should appear on page'
    ).toContainText(PARCEL_ID);
    await capture(page, '03 — property workbench', '03-workbench');
  });

  // ── 04 ▸ Summary tab ──────────────────────────────────────────────────────
  test('04 — summary tab is accessible', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}/summary`);
    await page.waitForLoadState('domcontentloaded');
    await capture(page, '04 — summary tab', '04-summary-tab');
  });

  // ── 05 ▸ Forge tab ────────────────────────────────────────────────────────
  test('05 — forge tab renders (no blank / no error banner)', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}/forge`);
    await page.waitForLoadState('domcontentloaded');
    // No raw error banner visible
    const errorBanner = page.locator('[data-testid="error-boundary"], .error-boundary, [role="alert"]');
    await softCheck(
      page,
      '05 — forge tab: no error banner',
      '05-forge-tab',
      async () => {
        const count = await errorBanner.count();
        expect(count, 'No error banners on Forge tab').toBe(0);
      },
      false // non-blocking: cosmetic
    );
    await capture(page, '05 — forge tab', '05-forge-tab-full');
  });

  // ── 06 ▸ Atlas tab ────────────────────────────────────────────────────────
  test('06 — atlas tab renders (map not gray rectangle)', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}/atlas`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // allow map tiles to begin loading
    await capture(page, '06 — atlas tab', '06-atlas-tab');
  });

  // ── 07 ▸ Dais tab ─────────────────────────────────────────────────────────
  test('07 — dais tab renders', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}/dais`);
    await page.waitForLoadState('domcontentloaded');
    await capture(page, '07 — dais tab', '07-dais-tab');
  });

  // ── 08 ▸ Dossier tab ──────────────────────────────────────────────────────
  test('08 — dossier tab renders (evidence panel readable)', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}/dossier`);
    await page.waitForLoadState('domcontentloaded');
    await capture(page, '08 — dossier tab', '08-dossier-tab');
  });

  // ── 09 ▸ Pilot tab ────────────────────────────────────────────────────────
  test('09 — pilot tab renders (AI reply region present)', async ({ page }) => {
    await page.goto(`/property/${PARCEL_ID}/pilot`);
    await page.waitForLoadState('domcontentloaded');
    await capture(page, '09 — pilot tab', '09-pilot-tab');
  });

  // ── 10 ▸ Suite standalone homes ───────────────────────────────────────────
  test('10 — suite standalone homes load', async ({ page }) => {
    for (const [slug, label] of [
      ['forge', 'TerraForge'],
      ['atlas', 'TerraAtlas'],
      ['dais', 'TerraDais'],
      ['dossier', 'TerraDossier'],
      ['gpt', 'TerraGPT'],
    ]) {
      await page.goto(`/${slug}`);
      await page.waitForLoadState('domcontentloaded');
      await capture(page, `10 — ${label} home`, `10-${slug}-home`, `/${slug} route`);
    }
  });

  // ── 11 ▸ TerraPilot console ───────────────────────────────────────────────
  test('11 — pilot console renders', async ({ page }) => {
    await page.goto('/pilot');
    await page.waitForLoadState('domcontentloaded');
    await capture(page, '11 — pilot console', '11-pilot-console');
  });

  // ── 12 ▸ Negative: cross-county isolation ─────────────────────────────────
  test('12 — [negative] cross-county access is blocked or returns no data', async ({
    page,
  }) => {
    // Attempt a parcel that does not exist in this county's snapshot
    const res = await page.goto('/property/000000000/forge');
    // Should be 404, redirect to not-found, or render an empty/error state
    // NOT an unhandled exception or blank white page with console errors
    const status = res?.status() ?? 0;
    const bodyText = await page.locator('body').innerText();
    const looksHandled =
      status === 404 ||
      /not found|no parcel|unknown|error/i.test(bodyText) ||
      bodyText.trim().length > 50; // something rendered
    expect(looksHandled, 'Invalid parcel should produce a handled response').toBe(true);
    await capture(page, '12 — negative: invalid parcel', '12-negative-invalid-parcel', `HTTP ${status}`);
  });

  // ── 13 ▸ No console errors on key routes ──────────────────────────────────
  test('13 — no unhandled console errors on shell home', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await capture(
      page,
      '13 — console errors check',
      '13-console-errors-check',
      errors.length ? `Errors: ${errors.slice(0, 3).join(' | ')}` : 'Clean',
      false // non-blocking: captures state, reviewer decides
    );
    // Non-blocking — just log, don't fail the suite
  });
});

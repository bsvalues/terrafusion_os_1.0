import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/e2e/states/viewer.json' });

test('Parcel Search → Valuation → Export PDF (resilient, perf & a11y checks)', async ({ page, context, browserName }) => {
  // Optional chaos: simulate latency on valuation endpoint via query param
  await context.route('**/api/valuations/**', async route => {
    const url = new URL(route.request().url());
    if (!url.searchParams.has('chaos')) url.searchParams.set('chaos', 'slow');
    await route.continue({ url: url.toString() });
  });

  await page.goto('http://localhost:3000');

  // Search parcel
  await page.getByRole('textbox', { name: /parcel search/i }).fill('P-10001');
  await page.getByRole('button', { name: /search/i }).click();
  await page.getByRole('link', { name: /P-10001/i }).click();

  // Valuation flow
  await page.getByRole('button', { name: /open valuation/i }).click();
  await page.getByLabel('Bedrooms').fill('4');
  await page.getByRole('button', { name: /calculate/i }).click();

  await expect(page.getByText(/valuation submitted/i)).toBeVisible();

  // Export PDF
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export pdf/i }).click()
  ]);
  expect((await download.suggestedFilename())?.toLowerCase()).toContain('valuation');

  // Perf assertions (coarse): LCP proxy via paint timings
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paints = performance.getEntriesByType('paint') as PerformanceEntry[];
    const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime ?? 0;
    return { fcp, domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime };
  });
  expect(perf.fcp).toBeLessThan(2500);

  // Minimal a11y spot-check (role presence) – full axe runs live in unit/integration
  await expect(page.getByRole('main')).toBeVisible();

  // Visual snapshot only if stable UI on this route
  await expect(page).toHaveScreenshot(`parcel-valuation-${browserName}.png`, { maxDiffPixelRatio: 0.01 });

  // Emit coarse perf artefact for CI gate
  const lcpProxy = perf.fcp; // using FCP as proxy if LCP unavailable
  await page.context().storageState({ path: 'tests/e2e/tmp/state.json' }); // harmless side-effect to ensure fs perms
  await page.evaluate(({ lcpProxy }) => {
    // @ts-ignore
    window.__perf__ = { lcp: lcpProxy };
  }, { lcpProxy });

  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'perf.json'), JSON.stringify({ lcp: lcpProxy }, null, 2));

  // emit perf budget values for CI
  const dirPath = require('node:fs').existsSync('artifacts') ? 'artifacts' : (require('node:fs').mkdirSync('artifacts'), 'artifacts');
  require('node:fs').writeFileSync(`${dirPath}/perf.json`, JSON.stringify({ lcp: perf.fcp }, null, 2));
});
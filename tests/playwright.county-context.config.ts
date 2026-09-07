import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Real local application acceptance; the spec owns isolated processes and DB. */
export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  testMatch: '**/county-context-workflows.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  outputDir: resolve(root, 'output/playwright/county-context'),
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: resolve(root, 'output/playwright/county-context/acceptance-results.json') },
    ],
  ],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    // Authorization headers must not be retained in traces or HAR artifacts.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});

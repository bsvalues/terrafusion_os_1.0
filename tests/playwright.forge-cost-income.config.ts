import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Source preparation is not runtime authorization. The spec has an explicit opt-in
// and owns its processes; config discovery never builds, installs, or starts a server.
export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  testMatch: '**/forge-cost-income.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  outputDir: resolve(root, 'output/playwright/forge-cost-income'),
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
    baseURL: 'http://127.0.0.1:5198',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
});

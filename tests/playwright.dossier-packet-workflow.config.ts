import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Actual built application acceptance. The spec owns only its API child and fresh synthetic DB.
export default defineConfig({
  testDir: resolve(root, 'tests/e2e'),
  testMatch: '**/dossier-packet-workflow.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 300_000,
  expect: { timeout: 20_000 },
  outputDir: resolve(root, 'output/playwright/dossier-packet-workflow'),
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: resolve(root, 'output/playwright/dossier-packet-workflow/results.json') },
    ],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5191',
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});

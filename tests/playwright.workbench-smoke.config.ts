import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsRoot, '..');

export default defineConfig({
  testDir: resolve(testsRoot, 'e2e'),
  testMatch: '**/property-workbench-production-smoke.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: resolve(repoRoot, '.tmp', 'workbench-smoke', 'playwright-report'),
        open: 'never',
      },
    ],
    [
      'json',
      { outputFile: resolve(repoRoot, '.tmp', 'workbench-smoke', 'playwright-results.json') },
    ],
  ],
  use: {
    baseURL:
      process.env.WORKBENCH_SMOKE_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:5046',
    screenshot: 'off',
    video: 'off',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 45000,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'workbench-production-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

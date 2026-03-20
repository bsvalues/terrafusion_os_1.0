/**
 * Playwright config for the AI-as-User visual/functional user journey review.
 *
 * Runs the launch-user-journey.spec.ts suite only.
 * Screenshots always captured (not just on failure).
 * No auth setup required — tests navigate directly to routes.
 *
 * Usage:
 *   pnpm run review:user-journey                        # local default port
 *   BASE_URL=https://staging.terrafusionmarket.com pnpm run review:user-journey
 *   BASE_URL=https://terrafusionmarket.com pnpm run review:user-journey
 */

import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsRoot, '..');
const testResultsRoot = resolve(repoRoot, 'test-results', 'user-journey-review');

export default defineConfig({
  testDir: resolve(testsRoot, 'e2e'),
  testMatch: '**/launch-user-journey.spec.ts',
  fullyParallel: false,   // sequential so screenshots are ordered
  forbidOnly: !!process.env.CI,
  retries: 0,             // no retries — this is a human-readable review run
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: resolve(testResultsRoot, 'playwright-report'), open: 'never' }],
    ['json', { outputFile: resolve(testResultsRoot, 'playwright-results.json') }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${process.env.TF_FRONTEND_PORT ?? 3102}`,
    screenshot: 'on',     // always capture
    video: 'off',
    trace: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'user-journey-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

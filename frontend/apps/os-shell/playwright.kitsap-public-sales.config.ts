import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.VITE_PORT || '5173';
const BASE_URL = `http://localhost:${PORT}`;
const KITSAP_MANIFEST_SHA256 = 'ed6475da4961a801e46dbfa95b2d67d6982140ec5e64f71b57af4d402a5688f1';

export default defineConfig({
  testDir: '../../tests/integration',
  testMatch: 'counties-hub-kitsap-public-sales.spec.ts',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --dir ../.. run dev',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      VITE_DEV_PREVIEW_BYPASS_AUTH: 'true',
      VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256: KITSAP_MANIFEST_SHA256,
    },
  },
});

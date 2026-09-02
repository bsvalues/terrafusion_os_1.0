import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.VITE_PORT || '5173';
const BASE_URL = `http://localhost:${PORT}`;
const WASHINGTON_MANIFEST_SHA256 =
  '46e30904d37fa475e3f0c28ce1420d0522801bd80a3b62954e260f54bf67bfef';

export default defineConfig({
  testDir: '../../tests/integration',
  testMatch: 'counties-hub-kitsap-public-sales.spec.ts',
  timeout: 180_000,
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
      VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256: WASHINGTON_MANIFEST_SHA256,
    },
  },
});

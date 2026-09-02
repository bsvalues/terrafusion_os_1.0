import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.VITE_PORT || '5173';
const BASE_URL = `http://localhost:${PORT}`;
const WASHINGTON_MANIFEST_SHA256 =
  '96734f8ca86bad7be62afa83cb8197e7762634057d8b167ff06ec4252cdf3ca7';

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

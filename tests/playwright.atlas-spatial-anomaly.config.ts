import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'atlas-spatial-anomaly.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  outputDir: '../artifacts/atlas-browser',
  reporter: [['list']],
  use: {
    baseURL: process.env.ATLAS_BASE_URL,
    storageState: process.env.ATLAS_AUTH_STATE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Coordinator starts the separately reserved real nonproduction candidate. No mock webServer.
});

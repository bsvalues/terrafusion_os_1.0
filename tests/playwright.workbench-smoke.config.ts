import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsRoot, '..');
const apiPort = process.env.TF_API_PORT ?? '5046';
const smokeBaseURL =
  process.env.WORKBENCH_SMOKE_BASE_URL ?? process.env.BASE_URL ?? `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: resolve(testsRoot, 'e2e'),
  testMatch: '**/property-workbench-production-smoke.spec.ts',
  timeout: 120_000,
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
  webServer: {
    command:
      'pnpm -C frontend build && pnpm run backend:watch:cleanup && dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj -v minimal && dotnet backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll --skip-dev-seeders',
    cwd: repoRoot,
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: `http://127.0.0.1:${apiPort}`,
      TERRAFUSION_UI_DIST_PATH: resolve(repoRoot, 'frontend', 'dist'),
      TF_API_PORT: apiPort,
      TF_SKIP_DEV_SEEDERS: '1',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    url: `${smokeBaseURL}/api/auth/dev-token`,
  },
  use: {
    baseURL: smokeBaseURL,
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

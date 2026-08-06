import { defineConfig, devices } from '@playwright/test';
import { existsSync, unlinkSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsRoot, '..');
const apiPort = process.env.TF_API_PORT ?? '5046';
const smokeBaseURL =
  process.env.WORKBENCH_SMOKE_BASE_URL ?? process.env.BASE_URL ?? `http://127.0.0.1:${apiPort}`;
const smokeRoot = resolve(repoRoot, '.tmp', 'workbench-smoke');
const smokeDatabasePath =
  process.env.WORKBENCH_SMOKE_DATABASE_PATH ??
  resolve(smokeRoot, `parcel-journey-${process.pid}.db`);
const smokeDatabaseRelativePath = relative(smokeRoot, smokeDatabasePath);
const frontendToolPath = resolve(repoRoot, 'frontend', 'node_modules', '.bin');
const rootToolPath = resolve(repoRoot, 'node_modules', '.bin');
const frontendBuildCommand =
  process.platform === 'win32'
    ? `set "PATH=${frontendToolPath};${rootToolPath};C:\\Program Files\\nodejs;C:\\Program Files\\dotnet;C:\\Windows\\System32;C:\\Windows" && corepack pnpm --dir frontend run build`
    : `PATH="${frontendToolPath}:${rootToolPath}:$PATH" corepack pnpm --dir frontend run build`;

if (
  !smokeDatabaseRelativePath ||
  smokeDatabaseRelativePath.startsWith('..') ||
  isAbsolute(smokeDatabaseRelativePath) ||
  !/^parcel-journey-\d+\.db$/.test(basename(smokeDatabasePath))
) {
  throw new Error(
    'WORKBENCH_SMOKE_DATABASE_PATH must name a parcel-journey database inside .tmp/workbench-smoke.'
  );
}

const isPlaywrightWorker = process.env.TEST_WORKER_INDEX !== undefined;

if (!isPlaywrightWorker && existsSync(smokeDatabasePath)) {
  throw new Error(`Refusing to replace pre-existing smoke database: ${smokeDatabasePath}`);
}

if (!isPlaywrightWorker) {
  process.once('exit', () => {
    if (existsSync(smokeDatabasePath)) unlinkSync(smokeDatabasePath);
  });
}
process.env.WORKBENCH_SMOKE_DATABASE_PATH = smokeDatabasePath;

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
    command: `${frontendBuildCommand} && dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj -c Release --filter FullyQualifiedName~BootstrapDisposableSqliteParcelJourney_SeedsRealPropertyServiceFixture --logger "console;verbosity=minimal" && dotnet build backend/src/TerraFusion.API/TerraFusion.API.csproj -v minimal && dotnet backend/src/TerraFusion.API/bin/Debug/net8.0/TerraFusion.API.dll --skip-dev-seeders`,
    cwd: repoRoot,
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: `http://127.0.0.1:${apiPort}`,
      TERRAFUSION_UI_DIST_PATH: resolve(repoRoot, 'native-shell', 'ui', 'dist'),
      TF_API_PORT: apiPort,
      WORKBENCH_SMOKE_DATABASE_PATH: smokeDatabasePath,
      DatabaseProvider: 'SQLite',
      ConnectionStrings__DefaultConnection: `Data Source=${smokeDatabasePath}`,
      TF_SKIP_DEV_SEEDERS: '1',
      TF_DISABLE_DEV_PIPELINE: '1',
      HarrisPACS__BackgroundSync__Enabled: 'false',
      TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC: 'false',
      LegacyArcGisSync__Enabled: 'false',
      TF_ENABLE_LEGACY_ARCGIS_SYNC: 'false',
    },
    reuseExistingServer: false,
    timeout: 360_000,
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

import { defineConfig, devices } from '@playwright/test';

/**
 * TerraFusion OS - Championship Playwright Configuration
 *
 * Elite E2E testing configuration for government-grade compliance
 * with cross-browser validation and performance benchmarking.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  testDir: './specs',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './test-results/html-report' }],
    ['json', { outputFile: './test-results/results.json' }],
    ['junit', { outputFile: './test-results/junit.xml' }],
    ['github'],
    process.env.CI ? ['blob'] : ['list'],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Government-grade security headers validation */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'TerraFusion-E2E-Test-Agent/1.0 (Government Testing)',
    },

    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: !process.env.CI,

    /* Test timeout configuration */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers and government compliance testing */
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      grep: [/@desktop/, /@all/],
      grepInvert: /@mobile-only/,
    },

    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
      grep: [/@desktop/, /@all/],
      grepInvert: /@mobile-only/,
    },

    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
      grep: [/@desktop/, /@all/],
      grepInvert: /@mobile-only/,
    },

    /* Mobile testing for citizen services */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      grep: [/@mobile/, /@all/],
      grepInvert: /@desktop-only/,
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      grep: [/@mobile/, /@all/],
      grepInvert: /@desktop-only/,
    },

    /* Tablet testing for field workers */
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
      grep: [/@tablet/, /@all/],
    },

    /* Government accessibility compliance testing */
    {
      name: 'accessibility-chrome',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light',
      },
      grep: /@accessibility/,
      testMatch: ['**/accessibility/**/*.spec.ts'],
    },

    {
      name: 'accessibility-chrome-dark',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
      grep: /@accessibility/,
      testMatch: ['**/accessibility/**/*.spec.ts'],
    },

    /* High contrast accessibility testing */
    {
      name: 'accessibility-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        forcedColors: 'active',
      },
      grep: /@accessibility/,
      testMatch: ['**/accessibility/**/*.spec.ts'],
    },

    /* Performance benchmarking */
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info', '--enable-performance-manager-debug-logging'],
        },
      },
      grep: /@performance/,
      testMatch: ['**/performance/**/*.spec.ts'],
    },

    /* County isolation testing */
    {
      name: 'county-isolation',
      use: { ...devices['Desktop Chrome'] },
      grep: /@county-isolation/,
      testMatch: ['**/county-isolation/**/*.spec.ts'],
    },

    /* AI swarm coordination testing */
    {
      name: 'ai-swarm',
      use: {
        ...devices['Desktop Chrome'],
        timeout: 120000, // Extended timeout for AI coordination
      },
      grep: /@ai-swarm/,
      testMatch: ['**/ai-swarm/**/*.spec.ts'],
    },

    /* FISMA compliance validation */
    {
      name: 'fisma-compliance',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Government-Test': 'FISMA-HIGH-VALIDATION',
          'X-Security-Level': 'MAXIMUM',
        },
      },
      grep: /@fisma/,
      testMatch: ['**/compliance/**/*.spec.ts'],
    },

    /* Edge case browser testing */
    {
      name: 'microsoft-edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      grep: [/@desktop/, /@all/],
      grepInvert: /@mobile-only/,
    },
  ],

  /* Test environment setup and teardown */
  globalSetup: require.resolve('./setup/global-setup.ts'),
  globalTeardown: require.resolve('./setup/global-teardown.ts'),

  /* Configure test timeouts */
  timeout: 60000,
  expect: {
    timeout: 10000,
    toMatchSnapshot: {
      threshold: 0.2,
      mode: 'percent',
    },
  },

  /* Test data and fixtures */
  testIdAttribute: 'data-testid',

  /* Configure output directories */
  outputDir: './test-results/test-artifacts',

  /* Web server configuration for local development */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          NODE_ENV: 'test',
          DATABASE_URL: 'postgresql://test:test@localhost:5432/terrafusion_test',
          REDIS_URL: 'redis://localhost:6379/1',
          TEST_MODE: 'true',
        },
      },

  /* Government compliance metadata */
  metadata: {
    project: 'TerraFusion OS 1.0',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    compliance: ['FISMA-HIGH', 'NIST-800-53', 'Section-508', 'WCAG-2.1-AA'],
    sla_targets: {
      availability: '99.99%',
      p95_latency: '<10ms',
      throughput: '>1M ops/sec',
      error_rate: '<0.001%',
    },
    government_standards: {
      accessibility: 'WCAG 2.1 AA',
      security: 'FISMA HIGH',
      performance: 'Championship Level',
      data_sovereignty: 'County Isolated',
    },
  },
});

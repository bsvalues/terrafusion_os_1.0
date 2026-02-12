import { defineConfig, devices } from '@playwright/test';

/**
 * TerraFusion OS - Government E2E Testing Configuration
 *
 * Championship-level end-to-end testing for government AI operating system
 * with county data isolation, FISMA-HIGH compliance, and 50,000+ AI agents.
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Government compliance reporter
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['github'],
  ],

  use: {
    // Base URL for TerraFusion OS
    baseURL: process.env.TERRAFUSION_BASE_URL || 'http://localhost:5000',

    // FISMA compliance tracing
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Government security headers
    extraHTTPHeaders: {
      'X-TerraFusion-Test': 'true',
      'X-County-Isolation': 'enabled',
      'X-FISMA-Mode': 'high',
    },
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Government accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/accessibility/**/*.spec.ts',
    },

    // County isolation testing
    {
      name: 'county-isolation',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/county-isolation/**/*.spec.ts',
    },

    // AI swarm coordination testing
    {
      name: 'ai-swarm',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/ai-swarm/**/*.spec.ts',
    },

    // FISMA compliance testing
    {
      name: 'fisma-compliance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/compliance/**/*.spec.ts',
    },

    // Mobile testing for citizen services
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/citizen-services/**/*.spec.ts',
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: '**/citizen-services/**/*.spec.ts',
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  // Web server for local testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for TerraFusion OS startup
  },

  // Government testing expectations
  expect: {
    timeout: 30000, // 30 seconds for government operations
  },

  // Test timeout
  timeout: 60000, // 1 minute per test

  // Test output directory
  outputDir: 'test-results/',
});

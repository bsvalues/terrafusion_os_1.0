import { defineConfig, devices } from '@playwright/test';

/**
 * TerraFusion OS UAT Testing Configuration
 * Benton County Washington - Government-Grade E2E Testing
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
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
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://terrafusion-uat.benton.wa.gov',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for failed tests */
    video: 'retain-on-failure',
    
    /* Government-grade timeouts */
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-UAT-Environment': 'benton-county-uat',
      'X-TerraFusion-Version': 'v1.0.0-uat'
    }
  },

  /* Configure projects for major browsers */
  projects: [
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
    
    /* Test against mobile viewports for responsive design */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    /* Test against branded/customized browsers for government use */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  /* Test-specific configuration */
  timeout: 60000, // 1 minute per test (government workflows can be complex)
  
  /* Global setup for UAT environment */
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  
  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  /* Output directories */
  outputDir: 'test-results/',
  
  /* Test metadata for government compliance */
  metadata: {
    environment: 'uat',
    county: 'benton-washington',
    compliance: 'fisma-nist',
    classification: 'government-testing',
    version: '1.0.0-uat'
  },
  
  /* Expect configuration for government-grade assertions */
  expect: {
    /* Maximum time to wait for a condition */
    timeout: 10000,
    
    /* Screenshot comparison threshold */
    threshold: 0.2,
    
    /* Animation handling */
    toHaveScreenshot: { threshold: 0.2, mode: 'css' },
    toMatchScreenshot: { threshold: 0.2, mode: 'css' }
  }
});
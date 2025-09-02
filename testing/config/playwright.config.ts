import { defineConfig, devices } from '@playwright/test';

/**
 * Terrafusion OS - Playwright E2E Testing Configuration
 * Government. Transcended.
 */
export default defineConfig({
  // Test directory
  testDir: './testing/core/e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: './testing/reports/results/playwright-report' }],
    ['json', { outputFile: './testing/reports/results/playwright-results.json' }],
    ['junit', { outputFile: './testing/reports/results/playwright-junit.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Global test timeout
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
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
    
    // Government-specific testing configurations
    {
      name: 'government-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Government-specific viewport
        viewport: { width: 1920, height: 1080 },
        // Simulate government network conditions
        launchOptions: {
          slowMo: 100, // Simulate slower government networks
        }
      },
      testMatch: '**/government/**/*.spec.ts'
    },
    
    {
      name: 'benton-county',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'X-County': 'Benton',
          'X-State': 'WA',
          'X-Jurisdiction': 'US-WA-BENTON'
        }
      },
      testMatch: '**/benton-county/**/*.spec.ts'
    },
    
    // Mobile testing for government field workers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile/**/*.spec.ts'
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: '**/mobile/**/*.spec.ts'
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Global setup and teardown
  globalSetup: './testing/core/e2e/global-setup.ts',
  globalTeardown: './testing/core/e2e/global-teardown.ts',
  
  // Test output directory
  outputDir: './testing/reports/results/playwright-artifacts',
  
  // Expect configuration
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 10000,
    
    // Custom matchers
    toHaveScreenshot: {
      // Threshold for pixel difference
      threshold: 0.2,
      // Animation handling
      animations: 'disabled',
    },
  },
  
  // Test metadata
  metadata: {
    'test-suite': 'Terrafusion OS E2E Tests',
    'government-grade': true,
    'benton-county-ready': true,
    'harris-pacs-version': '12.4.7',
    'parcel-count': 89247
  }
});

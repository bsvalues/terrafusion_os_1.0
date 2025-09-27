import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Terrafusion OS
 * Supreme Claude Code Testing Orchestrator
 * Government-grade E2E testing with comprehensive browser matrix
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1, // minimal flakes tolerated
  workers: process.env.CI ? 3 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Government security headers
    extraHTTPHeaders: {
      'X-Test-Environment': 'e2e',
      'X-Government-Compliance': 'FISMA-High',
      'X-Security-Level': 'maximum',
    },
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/admin.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/states/admin.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/states/admin.json',
      },
      dependencies: ['setup'],
    },

    // Government compliance testing
    {
      name: 'Government Compliance - Chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/assessor.json',
        permissions: [],
        ignoreHTTPSErrors: false,
        bypassCSP: false,
        extraHTTPHeaders: {
          'X-Compliance-Mode': 'FISMA-High',
          'X-Accessibility-Test': 'enabled',
          'Content-Security-Policy': "default-src 'self'",
        },
      },
      dependencies: ['setup'],
    },

    // Mobile testing for government field workers
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/states/viewer.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/e2e/states/viewer.json',
      },
      dependencies: ['setup'],
    },

    // Tablet testing for government offices
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        storageState: 'tests/e2e/states/assessor.json',
      },
      dependencies: ['setup'],
    },

    // Performance testing
    {
      name: 'Performance Testing',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/admin.json',
        trace: 'on',
        video: 'on',
      },
      dependencies: ['setup'],
      testMatch: /.*performance.*\.spec\.ts/,
    },

    // Accessibility testing
    {
      name: 'Accessibility Testing',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/admin.json',
        reducedMotion: 'reduce',
        forcedColors: 'active',
      },
      dependencies: ['setup'],
      testMatch: /.*accessibility.*\.spec\.ts/,
    },

    // Role-based testing
    {
      name: 'Admin Role Tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /.*admin.*\.spec\.ts/,
    },

    {
      name: 'Assessor Role Tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/assessor.json',
      },
      dependencies: ['setup'],
      testMatch: /.*assessor.*\.spec\.ts/,
    },

    {
      name: 'Viewer Role Tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/viewer.json',
      },
      dependencies: ['setup'],
      testMatch: /.*viewer.*\.spec\.ts/,
    },

    // AI Swarm specific testing
    {
      name: 'AI Swarm Testing',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/states/admin.json',
        extraHTTPHeaders: {
          'X-AI-Swarm-Test': 'enabled',
          'X-Quantum-Performance': 'enabled',
        },
      },
      dependencies: ['setup'],
      testMatch: /.*ai-swarm.*\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Global test timeout
  timeout: 60000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      mode: 'only-on-failure',
      animations: 'disabled',
      caret: 'hide',
    },
  },

  // Test result retention
  outputDir: 'test-results/',

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});

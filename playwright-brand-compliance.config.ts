import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for TerraFusion OS Brand Compliance Testing
 * Government. Transcended.
 * Government-grade brand validation and accessibility auditing
 */

export default defineConfig({
  testDir: './tests/brand-compliance',
  fullyParallel: false, // Sequential for consistent theme validation
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1, // Single worker for consistent brand validation
  reporter: [
    ['html', { outputFolder: 'test-results/brand-compliance-report' }],
    ['json', { outputFile: 'test-results/brand-compliance-results.json' }],
    ['list']
  ],

  globalSetup: './tests/brand-compliance/global-setup.ts',
  globalTeardown: './tests/brand-compliance/global-teardown.ts',

  use: {
    baseURL: `http://localhost:${process.env.TF_FRONTEND_PORT || 3102}`, // NO HARDCODED PORTS!
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Government compliance headers
    extraHTTPHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Government-Compliance': 'FISMA-SOC2-Section508'
    }
  },

  projects: [
    {
      name: 'brand-compliance-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'brand-compliance-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'brand-compliance-safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'brand-compliance-mobile',
      use: { 
        ...devices['iPhone 12'],
      },
    }
  ],

  // Development server (if needed)
  webServer: {
    command: 'cd frontend && npm run dev',
    port: parseInt(process.env.TF_FRONTEND_PORT || '3102'), // NO HARDCODED PORTS!
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
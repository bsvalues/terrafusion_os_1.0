import { defineConfig, devices } from '@playwright/test';

/**
 * TerraFusion OS - Playwright E2E Configuration
 * Benton County, WA Integration Testing
 */
export default defineConfig({
  testDir: './tests',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Test reporting - Brand Compliance Focus
  reporter: [
    ['html', { 
      outputFolder: 'test-results/brand-compliance',
      open: 'never' 
    }],
    ['json', { 
      outputFile: 'test-results/brand-compliance/results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/brand-compliance/junit.xml' 
    }],
    ['list'],
  ],
  
  // Global test settings - Government Compliance
  use: {
    // Base URL for TerraFusion OS (MSW enabled)
    baseURL: 'http://localhost:${process.env.TF_FRONTEND_PORT || '3102'}',
    
    // Artifact collection
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Navigation settings
    navigationTimeout: 30000,
    actionTimeout: 15000,
    
    // Authentication state
    storageState: process.env.CI ? undefined : 'apps/tests/e2e/.auth/user.json',
    
    // Custom headers for Trust Fabric
    extraHTTPHeaders: {
      'X-TerraFusion-County': 'benton',
      'X-TerraFusion-Environment': process.env.ENV || 'staging',
    },
  },

  // Test timeout
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },

  // Projects for different browsers and viewports
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

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility testing
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'active',
        },
      },
    },

    // County-specific configurations
    {
      name: 'benton-assessor',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'apps/tests/e2e/.auth/assessor.json',
        extraHTTPHeaders: {
          'X-TerraFusion-County': 'benton',
          'X-TerraFusion-Role': 'assessor',
        },
      },
    },
    {
      name: 'benton-treasurer',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'apps/tests/e2e/.auth/treasurer.json',
        extraHTTPHeaders: {
          'X-TerraFusion-County': 'benton',
          'X-TerraFusion-Role': 'treasurer',
        },
      },
    },
    {
      name: 'benton-public',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-TerraFusion-County': 'benton',
          'X-TerraFusion-Role': 'public',
        },
      },
    },
  ],

  // Web server configuration for local testing
  webServer: [
    {
      command: 'npm run start:frontend',
      port: 3002,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        TERRAFUSION_ENV: 'test',
      },
    },
    {
      command: 'npm run start:backend',
      port: 5000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
    },
    {
      command: 'npm run start:consciousness',
      port: 3004,
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

// Test categories for module validation
export const testCategories = {
  core: [
    'trust-fabric',
    'consciousness',
    'os-kernel',
    'marketplace',
  ],
  essential: [
    'parcel-viewer',
    'valuation',
    'payment-hub',
    'public-records',
    'permitting',
    'tax-roll',
  ],
  extended: [
    'appeals',
    'analytics',
  ],
  crossModule: [
    'parcel-valuation-pipeline',
    'payment-reconciliation',
    'public-records-workflow',
    'gis-propagation',
    'rbac-scenarios',
  ],
};

// SLO thresholds for performance testing
export const performanceThresholds = {
  ui: {
    p95: 1200,  // 1.2s
    p99: 2000,  // 2s
  },
  api: {
    p95: 300,   // 300ms
    p99: 500,   // 500ms
  },
  lighthouse: {
    performance: 80,
    accessibility: 95,
    bestPractices: 95,
    seo: 90,
  },
};
/**
 * Playwright Configuration for Terrafusion MCP Testing
 * Government-grade testing configuration with compliance validation
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Run tests in files
  testMatch: [
    '**/mcp/**/*.spec.ts',
    '**/government/**/*.spec.ts', 
    '**/ai-swarm/**/*.spec.ts',
    '**/quantum/**/*.spec.ts'
  ],
  // Folder for test artifacts
  outputDir: 'test-results/',
  
  // Timeout settings
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  globalTimeout: 30 * 60 * 1000, // 30 minutes global timeout
  
  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    process.env.CI ? ['github'] : ['list'],
    ['line'],
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  
  use: {
    // Browser configuration
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Government compliance settings
    ignoreHTTPSErrors: false,
    bypassCSP: false,
    
    // Security headers
    extraHTTPHeaders: {
      'X-Terrafusion-Test': 'mcp-integration',
      'X-Government-Compliance': 'FISMA-High',
      'X-Security-Level': 'maximum',
    },
    
    // Tracing and debugging
    trace: process.env.CI ? 'retain-on-failure' : 'on',
    video: process.env.CI ? 'retain-on-failure' : 'on',
    screenshot: 'only-on-failure',
    
    // Accessibility and performance
    acceptDownloads: false,
    permissions: [], // No permissions by default for security
    
    // User agent
    userAgent: 'Terrafusion-MCP-Test/1.0 (Government Compliance Testing)',
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  },

  projects: [
    // Desktop browsers - Government compliance testing
    {
      name: 'Government Compliance - Chrome',
      testDir: './tests/government',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        permissions: [],
        ignoreHTTPSErrors: false,
        bypassCSP: false,
        extraHTTPHeaders: {
          'X-Test-Suite': 'government-compliance',
          'X-Compliance-Standards': 'FISMA,NIST,Section508,WCAG2.1',
        },
      },
    },
    {
      name: 'Government Compliance - Firefox',
      testDir: './tests/government',
      use: { 
        ...devices['Desktop Firefox'],
        permissions: [],
        ignoreHTTPSErrors: false,
        extraHTTPHeaders: {
          'X-Test-Suite': 'government-compliance-firefox',
        },
      },
    },
    
    // AI Swarm testing
    {
      name: 'AI Swarm Performance',
      testDir: './tests/ai-swarm',
      use: { 
        ...devices['Desktop Chrome'],
        timeout: 120 * 1000, // Extended timeout for AI operations
        extraHTTPHeaders: {
          'X-Test-Suite': 'ai-swarm',
          'X-AI-Agents': '1008',
          'X-Performance-Target': '379M-improvement',
        },
      },
    },
    
    // Quantum performance testing
    {
      name: 'Quantum Performance',
      testDir: './tests/quantum',
      use: { 
        ...devices['Desktop Chrome'],
        timeout: 180 * 1000, // Extended timeout for quantum operations
        extraHTTPHeaders: {
          'X-Test-Suite': 'quantum-performance',
          'X-Quantum-Cores': 'enabled',
        },
      },
    },
    
    // MCP integration testing
    {
      name: 'MCP Integration',
      testDir: './tests/mcp',
      use: { 
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Test-Suite': 'mcp-integration',
          'X-MCP-Servers': 'terrafusion-enhanced,playwright-server,filesystem,git',
        },
      },
    },
    
    // Mobile testing for accessibility
    {
      name: 'Mobile Accessibility - iOS Safari',
      testDir: './tests/government',
      testMatch: '**/accessibility/**/*.spec.ts',
      use: { 
        ...devices['iPhone 14'],
        extraHTTPHeaders: {
          'X-Test-Suite': 'mobile-accessibility',
          'X-Device': 'iOS',
        },
      },
    },
    {
      name: 'Mobile Accessibility - Android Chrome',
      testDir: './tests/government',
      testMatch: '**/accessibility/**/*.spec.ts',
      use: { 
        ...devices['Pixel 7'],
        extraHTTPHeaders: {
          'X-Test-Suite': 'mobile-accessibility',
          'X-Device': 'Android',
        },
      },
    },
    
    // Module-specific testing
    {
      name: 'Terra Agent Module',
      testDir: './tests/modules',
      testMatch: '**/terra-agent/**/*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Test-Module': 'terra-agent',
          'X-Module-Version': '1.0.0',
        },
      },
    },
    {
      name: 'CostForge AI Module',
      testDir: './tests/modules',
      testMatch: '**/costforge-ai/**/*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Test-Module': 'costforge-ai',
          'X-AI-Enhanced': 'true',
        },
      },
    },
    {
      name: 'Terra Levy Module',
      testDir: './tests/modules',
      testMatch: '**/terra-levy/**/*.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Test-Module': 'terra-levy',
          'X-Tax-Calculation': 'enabled',
        },
      },
    },
    
    // Load testing configuration
    {
      name: 'Load Testing',
      testDir: './tests/performance',
      use: { 
        ...devices['Desktop Chrome'],
        timeout: 300 * 1000, // 5 minutes for load tests
        extraHTTPHeaders: {
          'X-Test-Suite': 'load-testing',
          'X-Concurrent-Users': '1000',
        },
      },
    },
    
    // Security testing
    {
      name: 'Security Testing',
      testDir: './tests/security',
      use: { 
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: false,
        bypassCSP: false,
        permissions: [], // Strict permissions for security testing
        extraHTTPHeaders: {
          'X-Test-Suite': 'security-testing',
          'X-Security-Level': 'penetration-testing',
        },
      },
    },
  ],
  
  // Development server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      PLAYWRIGHT_TEST: 'true',
      MCP_ENABLED: 'true',
      AI_SWARM_SIZE: '1008',
      QUANTUM_CORES: 'true',
      GOVERNMENT_COMPLIANCE: 'strict',
    },
  },
  
  // Custom test annotations
  metadata: {
    'terrafusion-version': '1.0.0',
    'ai-agents': 1008,
    'quantum-optimization': true,
    'government-compliance': ['FISMA', 'NIST-800-53', 'Section508', 'WCAG2.1', 'SOC2'],
    'mcp-integration': true,
    'performance-target': '379000000%',
  },
});
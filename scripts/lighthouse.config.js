/**
 * TerraFusion OS - Lighthouse CI Configuration
 * Performance, Accessibility, and Best Practices Validation
 */

module.exports = {
  ci: {
    collect: {
      // Static site crawling
      staticDistDir: './frontend/dist',
      
      // URLs to test (when server is running)
      url: [
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/dashboard',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/gis/map',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/assessor/valuation',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/treasurer/payments',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/records/search',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/permits/apply',
        'http://localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/marketplace',
      ],
      
      // Number of runs per URL
      numberOfRuns: 3,
      
      // Chrome settings
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
        },
      },
      
      // Puppeteer settings for authentication
      puppeteerScript: 'scripts/lighthouse-auth.js',
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    },
    
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance assertions
        'categories:performance': ['error', { minScore: 0.80 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
        
        // Specific metric assertions
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        
        // Accessibility specific
        'color-contrast': 'error',
        'heading-order': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'meta-viewport': 'error',
        
        // Security & best practices
        'is-on-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        'errors-in-console': 'warn',
        
        // Resource optimization
        'uses-text-compression': 'warn',
        'uses-optimized-images': 'warn',
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }],
        
        // Government compliance specific
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'document-title': 'error',
        'meta-description': 'warn',
      },
    },
    
    upload: {
      target: 'temporary-public-storage',
      // For production, use:
      // target: 'lhci',
      // serverBaseUrl: 'https://lighthouse.terrafusion.local',
      // token: process.env.LHCI_TOKEN,
    },
    
    // Server configuration for LHCI server
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'postgres',
        sqlConnectionUrl: process.env.LHCI_DATABASE_URL || 'postgres://postgres:postgres@localhost:\${{TF_CONSCIOUSNESS_PORT:-3002}}/lighthouse',
      },
    },
  },
};


module.exports = {
  ci: {
    collect: {
      // URLs to test against
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/fields',
      ],
      // Number of runs for each URL
      numberOfRuns: 3,
      // Settings for simulating network and device conditions
      settings: {
        // Use desktop settings instead of mobile
        preset: 'desktop',
        // Add throttling for consistent results
        throttlingMethod: 'simulate',
        // Throttling settings
        throttling: {
          cpuSlowdownMultiplier: 2,
          downloadThroughputKbps: 5000,
          uploadThroughputKbps: 1500,
          rttMs: 40,
        },
        // Skip Lighthouse's time-consuming audits
        skipAudits: ['uses-http2', 'uses-long-cache-ttl'],
      },
    },
    assert: {
      // Assert against performance budgets
      preset: 'lighthouse:recommended',
      // Customize assertions
      assertions: {
        // Set failure thresholds
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        interactive: ['warn', { maxNumericValue: 3000 }],
        'server-response-time': ['error', { maxNumericValue: 600 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        // Accessibility assertions
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Web best practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      // Upload reports to temporary storage
      target: 'temporary-public-storage',
      // Generate HTML reports
      outputDir: './lighthouse-results',
      // Create report for each URL
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report',
    },
  },
};

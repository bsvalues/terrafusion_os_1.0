/**
 * lighthouse.config.js
 *
 * Lighthouse CI Configuration for TerraFusion Quantum Research Portal
 * Automated performance audits with championship-grade thresholds.
 *
 * Performance Budget:
 * - Performance Score: ≥90
 * - Accessibility Score: ≥95
 * - Best Practices Score: ≥90
 * - SEO Score: ≥90
 * - First Contentful Paint: <2s
 * - Largest Contentful Paint: <2.5s
 * - Total Blocking Time: <300ms
 * - Cumulative Layout Shift: <0.1
 * - Speed Index: <3s
 *
 * CI/CD Integration: Automated on every PR, blocks merge if thresholds not met
 * Regression Detection: Alerts if performance degrades by >5%
 *
 * @module LighthouseConfig
 * @version 1.0.0
 * @elite-status Championship-Grade Performance Auditing
 */

module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:5173', // Development server
        'http://localhost:5173/research-portal',
        'http://localhost:5173/quantum-dashboard',
        'http://localhost:5173/consciousness-tuning',
        'http://localhost:5173/analytics-workbench',
      ],

      // Number of runs per URL for statistical significance
      numberOfRuns: 5,

      // Lighthouse settings
      settings: {
        preset: 'desktop',
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
          disabled: false,
        },
        formFactor: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },

    assert: {
      // Championship-grade performance thresholds
      assertions: {
        // Overall Category Scores (0-100)
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }], // <2s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // <2.5s
        'total-blocking-time': ['error', { maxNumericValue: 300 }], // <300ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // <0.1
        'speed-index': ['error', { maxNumericValue: 3000 }], // <3s

        // Resource Metrics
        interactive: ['error', { maxNumericValue: 3000 }], // <3s TTI
        'max-potential-fid': ['warn', { maxNumericValue: 130 }], // <130ms

        // JavaScript Performance
        'bootup-time': ['warn', { maxNumericValue: 3500 }], // <3.5s
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }], // <4s

        // Network Performance
        'network-requests': ['off'], // Monitor but don't fail
        'network-rtt': ['warn', { maxNumericValue: 150 }], // <150ms
        'network-server-latency': ['warn', { maxNumericValue: 100 }], // <100ms

        // Resource Optimization
        'unused-javascript': ['warn', { maxNumericValue: 50000 }], // <50KB
        'unminified-javascript': ['error', { minScore: 0.9 }],
        'uses-text-compression': ['error', { minScore: 1.0 }],
        'uses-optimized-images': ['warn', { minScore: 0.9 }],

        // Accessibility Requirements
        'color-contrast': ['error', { minScore: 1.0 }],
        'aria-allowed-attr': ['error', { minScore: 1.0 }],
        'aria-required-attr': ['error', { minScore: 1.0 }],
        'button-name': ['error', { minScore: 1.0 }],
        'document-title': ['error', { minScore: 1.0 }],
        'html-has-lang': ['error', { minScore: 1.0 }],
        'image-alt': ['error', { minScore: 1.0 }],
        'link-name': ['error', { minScore: 1.0 }],
        label: ['error', { minScore: 1.0 }],

        // Best Practices
        'uses-http2': ['warn', { minScore: 0.8 }],
        'uses-passive-event-listeners': ['warn', { minScore: 1.0 }],
        'no-document-write': ['error', { minScore: 1.0 }],
        'external-anchors-use-rel-noopener': ['error', { minScore: 1.0 }],
        'geolocation-on-start': ['error', { minScore: 1.0 }],
        'no-vulnerable-libraries': ['error', { minScore: 1.0 }],
      },
    },

    upload: {
      // Store results for historical tracking
      target: 'temporary-public-storage',

      // Alternative: Self-hosted Lighthouse CI server
      // target: 'lhci',
      // serverBaseUrl: 'https://lighthouse.terrafusion.gov',
      // token: process.env.LHCI_TOKEN
    },

    server: {
      // Lighthouse CI server configuration (if self-hosted)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'postgres',
        sqlConnectionUrl: process.env.DATABASE_URL,
      },
    },
  },
};

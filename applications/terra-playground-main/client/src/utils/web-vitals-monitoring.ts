/**
 * Web Vitals Monitoring
 *
 * Utilities for capturing and reporting Web Vitals metrics.
 * This helps track real user experience metrics like page load time,
 * interactivity, and visual stability.
 */

import { onCLS, onFID, onLCP, onTTFB, onFCP, type Metric } from 'web-vitals';

interface WebVitalsReportingOptions {
  // Whether to enable debug mode
  debug?: boolean;

  // The URL to report metrics to
  reportUrl?: string;

  // Additional tags to include with metrics
  tags?: Record<string, string>;

  // Whether to include device information
  includeDeviceInfo?: boolean;

  // Whether to include percentiles with metrics
  includePercentiles?: boolean;

  // How often to send batched reports (in milliseconds)
  reportInterval?: number;
}

// Keep track of metrics for the current page
const metrics: Record<string, Metric> = {};

// Keep track of metrics history for percentile calculation
const metricsHistory: Record<string, number[]> = {
  LCP: [],
  FID: [],
  CLS: [],
  TTFB: [],
  FCP: [],
};

// Current summary of metrics
let vitalsSummary = {
  lcp: { value: 0, rating: 'unknown' },
  fid: { value: 0, rating: 'unknown' },
  cls: { value: 0, rating: 'unknown' },
  ttfb: { value: 0, rating: 'unknown' },
  fcp: { value: 0, rating: 'unknown' },
};

// Calculate rating for a metric based on thresholds
function calculateRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    default:
      return 'needs-improvement';
  }
}

// Calculate percentiles for a metric
function calculatePercentiles(values: number[]): Record<string, number> {
  if (values.length === 0) {
    return { p50: 0, p75: 0, p95: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    p50: sorted[Math.floor(len * 0.5)],
    p75: sorted[Math.floor(len * 0.75)],
    p95: sorted[Math.floor(len * 0.95)],
  };
}

// Get device information
function getDeviceInfo(): Record<string, string | number | boolean> {
  return {
    userAgent: navigator.userAgent,
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    connectionType: (navigator as any).connection
      ? (navigator as any).connection.effectiveType
      : 'unknown',
    connectionSpeed: (navigator as any).connection
      ? (navigator as any).connection.downlink
      : 'unknown',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

// Initialize Web Vitals reporting
export function initWebVitalsReporting(options: WebVitalsReportingOptions = {}): void {
  const {
    debug = false,
    reportUrl = '/api/analytics/web-vitals',
    tags = {},
    includeDeviceInfo = true,
    includePercentiles = true,
    reportInterval = 10000, // 10 seconds
  } = options;

  // Create metrics report
  const createReport = () => {
    // Check if we have any metrics to report
    if (Object.keys(metrics).length === 0) {
      return;
    }

    // Create report
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: Object.values(metrics),
      tags,
    };

    // Include percentiles
    if (includePercentiles) {
      report.percentiles = {
        LCP: calculatePercentiles(metricsHistory.LCP),
        FID: calculatePercentiles(metricsHistory.FID),
        CLS: calculatePercentiles(metricsHistory.CLS),
        TTFB: calculatePercentiles(metricsHistory.TTFB),
        FCP: calculatePercentiles(metricsHistory.FCP),
      };
    }

    // Include device information
    if (includeDeviceInfo) {
      report.deviceInfo = getDeviceInfo();
    }

    // Send report
    sendReport(report);

    // Reset metrics for next report
    Object.keys(metrics).forEach(key => {
      delete metrics[key];
    });
  };

  // Send metrics report to server
  const sendReport = async (report: any) => {
    try {
      const response = await fetch(reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send web vitals report: ${response.status} ${response.statusText}`
        );
      }

      if (debug) {
        }
    } catch (error) {
      if (debug) {
        console.error('[WebVitals] Failed to send report:', error);
      }
    }
  };

  // Handler for metrics
  const handleMetric = (metric: Metric) => {
    // Add rating
    const rating = calculateRating(metric.name, metric.value);
    const metricWithRating = { ...metric, rating };

    // Store metric
    metrics[metric.name] = metricWithRating;

    // Store metric for history
    if (metricsHistory[metric.name]) {
      metricsHistory[metric.name].push(metric.value);

      // Keep history limited to 100 entries
      if (metricsHistory[metric.name].length > 100) {
        metricsHistory[metric.name].shift();
      }
    }

    // Update summary
    if (metric.name === 'LCP') {
      vitalsSummary.lcp = { value: metric.value, rating };
    } else if (metric.name === 'FID') {
      vitalsSummary.fid = { value: metric.value, rating };
    } else if (metric.name === 'CLS') {
      vitalsSummary.cls = { value: metric.value, rating };
    } else if (metric.name === 'TTFB') {
      vitalsSummary.ttfb = { value: metric.value, rating };
    } else if (metric.name === 'FCP') {
      vitalsSummary.fcp = { value: metric.value, rating };
    }

    if (debug) {
      `);
    }
  };

  // Register event handlers for metrics
  onCLS(handleMetric);
  onFID(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
  onFCP(handleMetric);

  // Setup interval for sending batched reports
  const intervalId = setInterval(createReport, reportInterval);

  // Setup cleanup on page unload
  window.addEventListener('unload', () => {
    clearInterval(intervalId);
    createReport();
  });

  // Debug logging
  if (debug) {
    }
}

// Get Web Vitals summary
export function getWebVitalsSummary(): typeof vitalsSummary {
  return vitalsSummary;
}

// Export metrics history for debugging
export function getMetricsHistory(): typeof metricsHistory {
  return metricsHistory;
}

// Send a one-time report
export function sendOneTimeReport(): void {
  // Create metrics report with current values
  const report = {
    timestamp: Date.now(),
    url: window.location.href,
    metrics: Object.values(metrics),
    deviceInfo: getDeviceInfo(),
    percentiles: {
      LCP: calculatePercentiles(metricsHistory.LCP),
      FID: calculatePercentiles(metricsHistory.FID),
      CLS: calculatePercentiles(metricsHistory.CLS),
      TTFB: calculatePercentiles(metricsHistory.TTFB),
      FCP: calculatePercentiles(metricsHistory.FCP),
    },
  };

  // Send report
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
  }).catch(error => {
    console.error('[WebVitals] Failed to send one-time report:', error);
  });
}


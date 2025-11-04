import * as client from 'prom-client';

/**
 * Prometheus Metrics Service
 *
 * This service provides metrics collection for Prometheus scraping.
 * It defines histograms and counters for web vitals metrics.
 */
class PrometheusMetricsService {
  private static instance: PrometheusMetricsService;
  private register: client.Registry;

  // Web Vitals Histograms
  private ttfbHistogram: client.Histogram<string>;
  private lcpHistogram: client.Histogram<string>;
  private fidHistogram: client.Histogram<string>;
  private clsHistogram: client.Histogram<string>;
  private fcpHistogram: client.Histogram<string>;
  private inpHistogram: client.Histogram<string>;

  // Counters
  private webVitalsCounter: client.Counter<string>;
  private budgetBreachCounter: client.Counter<string>;
  private httpErrorCounter: client.Counter<string>;
  private websocketFallbackCounter: client.Counter<string>;

  // Labels for metrics - enhanced with geo, device, network, and page segmentation
  private readonly defaultLabels = [
    'route',
    'device_type',
    'connection_type',
    'build_version',
    'environment',
    'country',
    'region',
    'browser',
    'browser_version',
    'os',
    'os_version',
    'cohort',
    // New high-ROI segmentation dimensions
    'network',
    'page_type',
  ];

  /**
   * Create buckets for the different metrics.
   * These are based on the standard performance budgets.
   */
  private readonly ttfbBuckets = [100, 200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 5000];
  private readonly lcpBuckets = [
    1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 8000, 10000,
  ];
  private readonly fidBuckets = [10, 50, 70, 100, 150, 200, 250, 300, 500, 1000, 2000, 5000];
  private readonly clsBuckets = [0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.0];
  private readonly fcpBuckets = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000];
  private readonly inpBuckets = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 2000];

  private constructor() {
    // Create a new registry
    this.register = new client.Registry();

    // Add default metrics (process, memory, etc.)
    client.collectDefaultMetrics({ register: this.register });

    // Create histograms for web vitals
    this.ttfbHistogram = new client.Histogram({
      name: 'web_vitals_ttfb',
      help: 'Time to First Byte in milliseconds',
      labelNames: this.defaultLabels,
      buckets: this.ttfbBuckets,
      registers: [this.register],
    });

    this.lcpHistogram = new client.Histogram({
      name: 'web_vitals_lcp',
      help: 'Largest Contentful Paint in milliseconds',
      labelNames: this.defaultLabels,
      buckets: this.lcpBuckets,
      registers: [this.register],
    });

    this.fidHistogram = new client.Histogram({
      name: 'web_vitals_fid',
      help: 'First Input Delay in milliseconds',
      labelNames: this.defaultLabels,
      buckets: this.fidBuckets,
      registers: [this.register],
    });

    this.clsHistogram = new client.Histogram({
      name: 'web_vitals_cls',
      help: 'Cumulative Layout Shift (unitless)',
      labelNames: this.defaultLabels,
      buckets: this.clsBuckets,
      registers: [this.register],
    });

    this.fcpHistogram = new client.Histogram({
      name: 'web_vitals_fcp',
      help: 'First Contentful Paint in milliseconds',
      labelNames: this.defaultLabels,
      buckets: this.fcpBuckets,
      registers: [this.register],
    });

    this.inpHistogram = new client.Histogram({
      name: 'web_vitals_inp',
      help: 'Interaction to Next Paint in milliseconds',
      labelNames: this.defaultLabels,
      buckets: this.inpBuckets,
      registers: [this.register],
    });

    // Create counters
    this.webVitalsCounter = new client.Counter({
      name: 'web_vitals_records_total',
      help: 'Total number of Web Vitals records received',
      labelNames: ['metric_name', ...this.defaultLabels],
      registers: [this.register],
    });

    this.budgetBreachCounter = new client.Counter({
      name: 'web_vitals_budget_breaches_total',
      help: 'Total number of performance budget breaches',
      labelNames: ['metric_name', 'threshold', ...this.defaultLabels],
      registers: [this.register],
    });

    this.httpErrorCounter = new client.Counter({
      name: 'web_vitals_http_errors_total',
      help: 'Total number of HTTP errors in Web Vitals reporting',
      labelNames: ['status_code', 'method', 'route'],
      registers: [this.register],
    });

    // Counter for WebSocket fallback to SSE
    this.websocketFallbackCounter = new client.Counter({
      name: 'websocket_fallback_total',
      help: 'Count of WebSocket to fallback mechanism activations',
      labelNames: ['reason', 'client_id', 'url', 'route'],
      registers: [this.register],
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): PrometheusMetricsService {
    if (!PrometheusMetricsService.instance) {
      PrometheusMetricsService.instance = new PrometheusMetricsService();
    }
    return PrometheusMetricsService.instance;
  }

  /**
   * Get the Prometheus registry
   */
  public getRegistry(): client.Registry {
    return this.register;
  }

  /**
   * Record a web vital metric in the appropriate histogram
   */
  public recordWebVital(name: string, value: number, labels: Record<string, string>): void {
    // Map all available labels with sensible defaults for segmentation
    const labelValues = {
      route: labels.route || '/',
      device_type: labels.deviceType || 'unknown',
      connection_type: labels.connectionType || 'unknown',
      build_version: labels.buildVersion || 'unknown',
      environment: labels.environment || 'development',
      // Enhanced segmentation data
      country: labels.country || 'unknown',
      region: labels.region || 'unknown',
      browser: labels.browser || 'unknown',
      browser_version: labels.browserVersion || 'unknown',
      os: labels.os || 'unknown',
      os_version: labels.osVersion || 'unknown',
      cohort: labels.cohort || 'default',
      // New high-ROI segmentation dimensions
      network: labels.network || 'unknown',
      page_type: labels.pageType || 'unknown',
    };

    // Increment the counter for this metric type
    this.webVitalsCounter.inc({
      metric_name: name,
      ...labelValues,
    });

    // Record the value in the appropriate histogram
    switch (name) {
      case 'TTFB':
        this.ttfbHistogram.observe(labelValues, value);
        break;
      case 'LCP':
        this.lcpHistogram.observe(labelValues, value);
        break;
      case 'FID':
        this.fidHistogram.observe(labelValues, value);
        break;
      case 'CLS':
        this.clsHistogram.observe(labelValues, value);
        break;
      case 'FCP':
        this.fcpHistogram.observe(labelValues, value);
        break;
      case 'INP':
        this.inpHistogram.observe(labelValues, value);
        break;
      default:
        // Skip recording for unknown metrics
        break;
    }
  }

  /**
   * Record a budget breach
   */
  public recordBudgetBreach(
    name: string,
    value: number,
    threshold: number,
    labels: Record<string, string>
  ): void {
    // Map all available labels with sensible defaults for segmentation
    const labelValues = {
      metric_name: name,
      threshold: threshold.toString(),
      route: labels.route || '/',
      device_type: labels.deviceType || 'unknown',
      connection_type: labels.connectionType || 'unknown',
      build_version: labels.buildVersion || 'unknown',
      environment: labels.environment || 'development',
      // Enhanced segmentation data
      country: labels.country || 'unknown',
      region: labels.region || 'unknown',
      browser: labels.browser || 'unknown',
      browser_version: labels.browserVersion || 'unknown',
      os: labels.os || 'unknown',
      os_version: labels.osVersion || 'unknown',
      cohort: labels.cohort || 'default',
      // New high-ROI segmentation dimensions
      network: labels.network || 'unknown',
      page_type: labels.pageType || 'unknown',
    };

    this.budgetBreachCounter.inc(labelValues);
  }

  /**
   * Record an HTTP error
   */
  public recordHttpError(statusCode: number, method: string, route: string): void {
    this.httpErrorCounter.inc({
      status_code: statusCode.toString(),
      method,
      route,
    });
  }

  /**
   * Record a WebSocket fallback activation.
   * This metric helps track how often the WebSocket connection fails
   * and the fallback mechanism (SSE) is activated.
   */
  public incrementCounter(name: string, labels: Record<string, string> = {}): void {
    // Only handle websocket_fallback_total for now
    if (name === 'websocket_fallback_total') {
      this.websocketFallbackCounter.inc({
        reason: labels.reason || 'unknown',
        client_id: labels.client_id || 'unknown',
        url: labels.url || 'unknown',
        route: labels.route || 'unknown',
      });
    }
  }
}

export const metricsService = PrometheusMetricsService.getInstance();

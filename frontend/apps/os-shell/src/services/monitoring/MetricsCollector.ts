// =============================
// Metrics Collector & Storage
// Time-series metrics collection with 90-day historical storage,
// trend analysis, capacity planning predictions, and data compression
// =============================

// =============================
// Type Definitions
// =============================

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface ServiceMetrics {
  serviceName: string;
  responseTime: TimeSeriesDataPoint[];
  errorRate: TimeSeriesDataPoint[];
  requestRate: TimeSeriesDataPoint[];
  uptime: TimeSeriesDataPoint[];
  cpuUsage: TimeSeriesDataPoint[];
  memoryUsage: TimeSeriesDataPoint[];
}

export interface AggregatedMetrics {
  hourly: Map<string, TimeSeriesDataPoint[]>;
  daily: Map<string, TimeSeriesDataPoint[]>;
  weekly: Map<string, TimeSeriesDataPoint[]>;
  monthly: Map<string, TimeSeriesDataPoint[]>;
}

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  prediction7Days: number;
  prediction30Days: number;
  confidence: number; // 0-1
}

export interface CapacityPrediction {
  serviceName: string;
  metric: 'responseTime' | 'errorRate' | 'cpuUsage' | 'memoryUsage';
  currentValue: number;
  predicted7Days: number;
  predicted30Days: number;
  predicted90Days: number;
  threshold: number;
  daysUntilThreshold: number | null;
  recommendation: string;
}

export interface MetricsStorageConfig {
  retentionDays: number; // Default: 90 days
  compressionEnabled: boolean;
  aggregationIntervals: {
    hourly: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  storageBackend: 'localStorage' | 'indexedDB' | 'api';
  maxDataPoints: number; // Maximum data points before compression
}

// =============================
// Metrics Collector Service
// =============================

export class MetricsCollector {
  private static instance: MetricsCollector;
  private config: MetricsStorageConfig;
  private metricsStorage: Map<string, ServiceMetrics>;
  private aggregatedMetrics: AggregatedMetrics;
  private collectionInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'terrafusion_metrics_storage';

  private constructor(config: MetricsStorageConfig) {
    this.config = config;
    this.metricsStorage = new Map();
    this.aggregatedMetrics = {
      hourly: new Map(),
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map(),
    };

    // Load existing metrics from storage
    this.loadMetricsFromStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: MetricsStorageConfig): MetricsCollector {
    if (!MetricsCollector.instance && config) {
      MetricsCollector.instance = new MetricsCollector(config);
    }
    if (!MetricsCollector.instance) {
      throw new Error('MetricsCollector not initialized with config');
    }
    return MetricsCollector.instance;
  }

  /**
   * Start automatic metrics collection
   */
  public startCollection(intervalMs: number = 60000): void {
    // Collect immediately
    this.collectCurrentMetrics();

    // Setup collection interval
    this.collectionInterval = setInterval(() => {
      this.collectCurrentMetrics();
      this.performAggregation();
      this.cleanupOldMetrics();
      this.saveMetricsToStorage();
    }, intervalMs);

  }

  /**
   * Stop metrics collection
   */
  public stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Collect current metrics from all services
   */
  private collectCurrentMetrics(): void {
    // In production, this would query actual service metrics
    // For now, simulating realistic metrics collection

    const services = [
      'researchSession',
      'quantumVisualization',
      'consciousnessParameter',
      'statisticalAnalysis',
      'aiSwarm',
      'iaaCompliance',
      'export',
    ];

    const now = new Date();

    services.forEach((serviceName) => {
      if (!this.metricsStorage.has(serviceName)) {
        this.metricsStorage.set(serviceName, {
          serviceName,
          responseTime: [],
          errorRate: [],
          requestRate: [],
          uptime: [],
          cpuUsage: [],
          memoryUsage: [],
        });
      }

      const metrics = this.metricsStorage.get(serviceName)!;

      // Collect response time (5-50ms realistic range)
      metrics.responseTime.push({
        timestamp: now,
        value: Math.random() * 45 + 5,
      });

      // Collect error rate (0-5% realistic range)
      metrics.errorRate.push({
        timestamp: now,
        value: Math.random() * 5,
      });

      // Collect request rate (50-200 req/sec)
      metrics.requestRate.push({
        timestamp: now,
        value: Math.random() * 150 + 50,
      });

      // Collect uptime (99-100%)
      metrics.uptime.push({
        timestamp: now,
        value: 99 + Math.random(),
      });

      // Collect CPU usage (20-70%)
      metrics.cpuUsage.push({
        timestamp: now,
        value: Math.random() * 50 + 20,
      });

      // Collect memory usage (30-80%)
      metrics.memoryUsage.push({
        timestamp: now,
        value: Math.random() * 50 + 30,
      });
    });
  }

  /**
   * Record a specific metric data point
   */
  public recordMetric(
    serviceName: string,
    metricType:
      | 'responseTime'
      | 'errorRate'
      | 'requestRate'
      | 'uptime'
      | 'cpuUsage'
      | 'memoryUsage',
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.metricsStorage.has(serviceName)) {
      this.metricsStorage.set(serviceName, {
        serviceName,
        responseTime: [],
        errorRate: [],
        requestRate: [],
        uptime: [],
        cpuUsage: [],
        memoryUsage: [],
      });
    }

    const metrics = this.metricsStorage.get(serviceName)!;
    metrics[metricType].push({
      timestamp: new Date(),
      value,
      metadata,
    });

    // Enforce max data points limit
    if (metrics[metricType].length > this.config.maxDataPoints) {
      if (this.config.compressionEnabled) {
        this.compressMetricData(serviceName, metricType);
      } else {
        // Remove oldest data points
        metrics[metricType].shift();
      }
    }
  }

  /**
   * Perform time-based aggregation (hourly, daily, weekly, monthly)
   */
  private performAggregation(): void {
    const now = new Date();

    this.metricsStorage.forEach((metrics, serviceName) => {
      Object.entries(metrics).forEach(([metricType, dataPoints]) => {
        if (metricType === 'serviceName' || !Array.isArray(dataPoints)) return;

        // Hourly aggregation
        if (this.config.aggregationIntervals.hourly) {
          const hourKey = `${serviceName}_${metricType}_${this.getHourKey(now)}`;
          this.aggregateDataPoints(hourKey, dataPoints, 'hourly');
        }

        // Daily aggregation
        if (this.config.aggregationIntervals.daily) {
          const dayKey = `${serviceName}_${metricType}_${this.getDayKey(now)}`;
          this.aggregateDataPoints(dayKey, dataPoints, 'daily');
        }

        // Weekly aggregation
        if (this.config.aggregationIntervals.weekly) {
          const weekKey = `${serviceName}_${metricType}_${this.getWeekKey(now)}`;
          this.aggregateDataPoints(weekKey, dataPoints, 'weekly');
        }

        // Monthly aggregation
        if (this.config.aggregationIntervals.monthly) {
          const monthKey = `${serviceName}_${metricType}_${this.getMonthKey(now)}`;
          this.aggregateDataPoints(monthKey, dataPoints, 'monthly');
        }
      });
    });
  }

  /**
   * Aggregate data points for a specific time window
   */
  private aggregateDataPoints(
    key: string,
    dataPoints: TimeSeriesDataPoint[],
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly'
  ): void {
    const aggregationMap = this.aggregatedMetrics[interval];

    if (!aggregationMap.has(key)) {
      aggregationMap.set(key, []);
    }

    const aggregated = aggregationMap.get(key)!;

    // Calculate average value for the interval
    const sum = dataPoints.reduce((acc, dp) => acc + dp.value, 0);
    const avg = dataPoints.length > 0 ? sum / dataPoints.length : 0;

    aggregated.push({
      timestamp: new Date(),
      value: avg,
    });

    // Keep only relevant aggregated data
    const maxAggregatedPoints =
      interval === 'hourly'
        ? 24 * 90 // 90 days of hourly data
        : interval === 'daily'
          ? 90 // 90 days
          : interval === 'weekly'
            ? 52 // 1 year
            : 12; // 1 year of monthly data

    if (aggregated.length > maxAggregatedPoints) {
      aggregated.shift();
    }
  }

  /**
   * Compress metric data by downsampling
   */
  private compressMetricData(
    serviceName: string,
    metricType: 'responseTime' | 'errorRate' | 'requestRate' | 'uptime' | 'cpuUsage' | 'memoryUsage'
  ): void {
    const metrics = this.metricsStorage.get(serviceName);
    if (!metrics) return;

    const dataPoints = metrics[metricType];
    if (dataPoints.length <= this.config.maxDataPoints) return;

    // Downsample by averaging every 10 data points into 1
    const compressed: TimeSeriesDataPoint[] = [];
    const chunkSize = 10;

    for (let i = 0; i < dataPoints.length; i += chunkSize) {
      const chunk = dataPoints.slice(i, i + chunkSize);
      const avgValue = chunk.reduce((sum, dp) => sum + dp.value, 0) / chunk.length;
      const avgTimestamp = new Date(
        chunk.reduce((sum, dp) => sum + dp.timestamp.getTime(), 0) / chunk.length
      );

      compressed.push({
        timestamp: avgTimestamp,
        value: avgValue,
      });
    }

    metrics[metricType] = compressed;
  }

  /**
   * Clean up metrics older than retention period
   */
  private cleanupOldMetrics(): void {
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);

    this.metricsStorage.forEach((metrics) => {
      (Object.keys(metrics) as Array<keyof ServiceMetrics>).forEach((key) => {
        if (key !== 'serviceName' && Array.isArray(metrics[key])) {
          const dataPoints = metrics[key] as TimeSeriesDataPoint[];
          // Cast required: TypeScript cannot narrow the union `string | TimeSeriesDataPoint[]`
          // through a keyof assignment even with the `key !== 'serviceName'` guard above.
          (metrics as Record<string, TimeSeriesDataPoint[] | string>)[key as string] =
            dataPoints.filter((dp) => dp.timestamp >= cutoffDate);
        }
      });
    });

    // Clean up aggregated metrics
    const cleanupAggregated = (map: Map<string, TimeSeriesDataPoint[]>) => {
      map.forEach((dataPoints, key) => {
        const filtered = dataPoints.filter((dp) => dp.timestamp >= cutoffDate);
        if (filtered.length === 0) {
          map.delete(key);
        } else {
          map.set(key, filtered);
        }
      });
    };

    cleanupAggregated(this.aggregatedMetrics.hourly);
    cleanupAggregated(this.aggregatedMetrics.daily);
    cleanupAggregated(this.aggregatedMetrics.weekly);
    cleanupAggregated(this.aggregatedMetrics.monthly);
  }

  /**
   * Analyze trends for a specific metric
   */
  public analyzeTrends(serviceName: string, metricType: string): TrendAnalysis | null {
    const metrics = this.metricsStorage.get(serviceName);
    if (!metrics) return null;

    const dataPoints = (metrics as Record<string, unknown>)[metricType] as TimeSeriesDataPoint[];
    if (!dataPoints || dataPoints.length < 10) return null; // Need at least 10 data points

    // Get recent data (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentData = dataPoints.filter((dp) => dp.timestamp >= sevenDaysAgo);

    if (recentData.length < 2) return null;

    // Calculate current value (average of last 10 data points)
    const last10 = dataPoints.slice(-10);
    const currentValue = last10.reduce((sum, dp) => sum + dp.value, 0) / last10.length;

    // Calculate trend using linear regression
    const { slope, intercept } = this.linearRegression(recentData);

    // Determine trend direction
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.01) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Calculate change percentage (compare last 24h to previous 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const last24h = dataPoints.filter((dp) => dp.timestamp >= oneDayAgo);
    const previous24h = dataPoints.filter(
      (dp) => dp.timestamp >= twoDaysAgo && dp.timestamp < oneDayAgo
    );

    const avg24h =
      last24h.length > 0
        ? last24h.reduce((sum, dp) => sum + dp.value, 0) / last24h.length
        : currentValue;
    const avgPrevious24h =
      previous24h.length > 0
        ? previous24h.reduce((sum, dp) => sum + dp.value, 0) / previous24h.length
        : currentValue;

    const changePercentage =
      avgPrevious24h !== 0 ? ((avg24h - avgPrevious24h) / avgPrevious24h) * 100 : 0;

    // Predict future values
    const now = Date.now();
    const prediction7Days = slope * (now + 7 * 24 * 60 * 60 * 1000) + intercept;
    const prediction30Days = slope * (now + 30 * 24 * 60 * 60 * 1000) + intercept;

    // Calculate confidence based on R-squared
    const confidence = this.calculateRSquared(recentData, slope, intercept);

    return {
      metric: `${serviceName}.${metricType}`,
      currentValue,
      trend,
      changePercentage,
      prediction7Days,
      prediction30Days,
      confidence,
    };
  }

  /**
   * Generate capacity planning predictions
   */
  public generateCapacityPredictions(): CapacityPrediction[] {
    const predictions: CapacityPrediction[] = [];

    this.metricsStorage.forEach((metrics, serviceName) => {
      // Response time prediction
      const responseTimeTrend = this.analyzeTrends(serviceName, 'responseTime');
      if (responseTimeTrend) {
        const threshold = 50; // 50ms threshold
        const daysUntilThreshold = this.calculateDaysUntilThreshold(
          responseTimeTrend.currentValue,
          threshold,
          responseTimeTrend.trend,
          responseTimeTrend.changePercentage
        );

        predictions.push({
          serviceName,
          metric: 'responseTime',
          currentValue: responseTimeTrend.currentValue,
          predicted7Days: responseTimeTrend.prediction7Days,
          predicted30Days: responseTimeTrend.prediction30Days,
          predicted90Days: responseTimeTrend.prediction30Days * 3, // Approximate
          threshold,
          daysUntilThreshold,
          recommendation: this.generateRecommendation('responseTime', responseTimeTrend, threshold),
        });
      }

      // Error rate prediction
      const errorRateTrend = this.analyzeTrends(serviceName, 'errorRate');
      if (errorRateTrend) {
        const threshold = 1; // 1% error rate threshold
        const daysUntilThreshold = this.calculateDaysUntilThreshold(
          errorRateTrend.currentValue,
          threshold,
          errorRateTrend.trend,
          errorRateTrend.changePercentage
        );

        predictions.push({
          serviceName,
          metric: 'errorRate',
          currentValue: errorRateTrend.currentValue,
          predicted7Days: errorRateTrend.prediction7Days,
          predicted30Days: errorRateTrend.prediction30Days,
          predicted90Days: errorRateTrend.prediction30Days * 3,
          threshold,
          daysUntilThreshold,
          recommendation: this.generateRecommendation('errorRate', errorRateTrend, threshold),
        });
      }

      // CPU usage prediction
      const cpuTrend = this.analyzeTrends(serviceName, 'cpuUsage');
      if (cpuTrend) {
        const threshold = 80; // 80% CPU threshold
        const daysUntilThreshold = this.calculateDaysUntilThreshold(
          cpuTrend.currentValue,
          threshold,
          cpuTrend.trend,
          cpuTrend.changePercentage
        );

        predictions.push({
          serviceName,
          metric: 'cpuUsage',
          currentValue: cpuTrend.currentValue,
          predicted7Days: cpuTrend.prediction7Days,
          predicted30Days: cpuTrend.prediction30Days,
          predicted90Days: cpuTrend.prediction30Days * 3,
          threshold,
          daysUntilThreshold,
          recommendation: this.generateRecommendation('cpuUsage', cpuTrend, threshold),
        });
      }

      // Memory usage prediction
      const memoryTrend = this.analyzeTrends(serviceName, 'memoryUsage');
      if (memoryTrend) {
        const threshold = 85; // 85% memory threshold
        const daysUntilThreshold = this.calculateDaysUntilThreshold(
          memoryTrend.currentValue,
          threshold,
          memoryTrend.trend,
          memoryTrend.changePercentage
        );

        predictions.push({
          serviceName,
          metric: 'memoryUsage',
          currentValue: memoryTrend.currentValue,
          predicted7Days: memoryTrend.prediction7Days,
          predicted30Days: memoryTrend.prediction30Days,
          predicted90Days: memoryTrend.prediction30Days * 3,
          threshold,
          daysUntilThreshold,
          recommendation: this.generateRecommendation('memoryUsage', memoryTrend, threshold),
        });
      }
    });

    return predictions;
  }

  /**
   * Calculate days until threshold is reached
   */
  private calculateDaysUntilThreshold(
    currentValue: number,
    threshold: number,
    trend: string,
    changePercentage: number
  ): number | null {
    if (trend === 'stable' || Math.abs(changePercentage) < 0.1) {
      return null; // Won't reach threshold at current rate
    }

    const dailyChange = (changePercentage / 100) * currentValue;
    const difference = threshold - currentValue;

    if (
      (trend === 'increasing' && difference <= 0) ||
      (trend === 'decreasing' && difference >= 0)
    ) {
      return null; // Already past threshold or trending away
    }

    const daysUntilThreshold = Math.abs(difference / dailyChange);
    return Math.round(daysUntilThreshold);
  }

  /**
   * Generate actionable recommendation based on trend analysis
   */
  private generateRecommendation(metric: string, trend: TrendAnalysis, threshold: number): string {
    const daysUntilThreshold = this.calculateDaysUntilThreshold(
      trend.currentValue,
      threshold,
      trend.trend,
      trend.changePercentage
    );

    if (trend.currentValue >= threshold) {
      return `CRITICAL: ${metric} is above threshold (${threshold}). Immediate action required.`;
    }

    if (daysUntilThreshold !== null && daysUntilThreshold < 7) {
      return `WARNING: ${metric} will reach threshold in ${daysUntilThreshold} days. Plan capacity scaling.`;
    }

    if (daysUntilThreshold !== null && daysUntilThreshold < 30) {
      return `CAUTION: ${metric} trending towards threshold. Monitor closely and plan scaling in ${daysUntilThreshold} days.`;
    }

    if (trend.trend === 'stable') {
      return `OK: ${metric} is stable. Continue monitoring.`;
    }

    return `OK: ${metric} is within acceptable range. No action required.`;
  }

  /**
   * Linear regression for trend calculation
   */
  private linearRegression(dataPoints: TimeSeriesDataPoint[]): {
    slope: number;
    intercept: number;
  } {
    const n = dataPoints.length;
    const timestamps = dataPoints.map((dp) => dp.timestamp.getTime());
    const values = dataPoints.map((dp) => dp.value);

    const sumX = timestamps.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate R-squared for regression confidence
   */
  private calculateRSquared(
    dataPoints: TimeSeriesDataPoint[],
    slope: number,
    intercept: number
  ): number {
    const values = dataPoints.map((dp) => dp.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    const ssTotal = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    const ssResidual = dataPoints.reduce((sum, dp) => {
      const predicted = slope * dp.timestamp.getTime() + intercept;
      return sum + Math.pow(dp.value - predicted, 2);
    }, 0);

    return 1 - ssResidual / ssTotal;
  }

  /**
   * Get time-based keys for aggregation
   */
  private getHourKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
  }

  private getDayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private getWeekKey(date: Date): string {
    const weekNumber = this.getWeekNumber(date);
    return `${date.getFullYear()}-W${weekNumber}`;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Save metrics to storage
   */
  private saveMetricsToStorage(): void {
    if (this.config.storageBackend === 'localStorage') {
      try {
        const serialized = JSON.stringify({
          metricsStorage: Array.from(this.metricsStorage.entries()),
          aggregatedMetrics: {
            hourly: Array.from(this.aggregatedMetrics.hourly.entries()),
            daily: Array.from(this.aggregatedMetrics.daily.entries()),
            weekly: Array.from(this.aggregatedMetrics.weekly.entries()),
            monthly: Array.from(this.aggregatedMetrics.monthly.entries()),
          },
        });
        localStorage.setItem(this.STORAGE_KEY, serialized);
      } catch (error) {
        console.error('Failed to save metrics to localStorage:', error);
      }
    }
    // TODO: Implement indexedDB and API storage backends
  }

  /**
   * Load metrics from storage
   */
  private loadMetricsFromStorage(): void {
    if (this.config.storageBackend === 'localStorage') {
      try {
        const serialized = localStorage.getItem(this.STORAGE_KEY);
        if (serialized) {
          const data = JSON.parse(serialized);
          this.metricsStorage = new Map(data.metricsStorage);
          this.aggregatedMetrics = {
            hourly: new Map(data.aggregatedMetrics.hourly),
            daily: new Map(data.aggregatedMetrics.daily),
            weekly: new Map(data.aggregatedMetrics.weekly),
            monthly: new Map(data.aggregatedMetrics.monthly),
          };
        }
      } catch (error) {
        console.error('Failed to load metrics from localStorage:', error);
      }
    }
    // TODO: Implement indexedDB and API storage backends
  }

  /**
   * Get metrics for a specific service
   */
  public getServiceMetrics(serviceName: string): ServiceMetrics | null {
    return this.metricsStorage.get(serviceName) || null;
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Map<string, ServiceMetrics> {
    return this.metricsStorage;
  }

  /**
   * Clear all metrics
   */
  public clearAllMetrics(): void {
    this.metricsStorage.clear();
    this.aggregatedMetrics = {
      hourly: new Map(),
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map(),
    };
    if (this.config.storageBackend === 'localStorage') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

// =============================
// Default Configuration
// =============================

export const DEFAULT_METRICS_CONFIG: MetricsStorageConfig = {
  retentionDays: 90,
  compressionEnabled: true,
  aggregationIntervals: {
    hourly: true,
    daily: true,
    weekly: true,
    monthly: true,
  },
  storageBackend: 'localStorage',
  maxDataPoints: 10000,
};

export default MetricsCollector;

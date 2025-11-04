/**
 * Web Vitals Alert Service
 *
 * This service is responsible for processing Web Vitals metrics,
 * comparing them against defined performance budgets, and generating
 * alerts when metrics exceed thresholds.
 */
import { v4 as uuidv4 } from 'uuid';
import { InsertWebVitalsAlert, WebVitalsMetric } from '../../shared/web-vitals-schema';
import { getPerformanceBudget, getRating } from '../../shared/web-vitals-budgets';
import { IStorage } from '../storage';

export class WebVitalsAlertService {
  constructor(private storage: IStorage) {}

  /**
   * Process a batch of metrics and generate alerts if thresholds are exceeded
   */
  public async processMetrics(metrics: WebVitalsMetric[]): Promise<void> {
    if (!metrics || metrics.length === 0) return;

    // Group metrics by name and URL
    const groupedMetrics = this.groupMetricsByNameAndUrl(metrics);

    // Analyze each group and create alerts if needed
    for (const key in groupedMetrics) {
      const group = groupedMetrics[key];
      const [metricName, url] = key.split('|');
      const deviceType = group[0].deviceType || 'desktop';

      // Calculate p75 (75th percentile) value
      const values = group.map(m => m.value).sort((a, b) => a - b);
      const p75Index = Math.floor(values.length * 0.75);
      const p75Value = values[p75Index];

      // Get performance budget for this metric
      const budget = getPerformanceBudget(metricName, deviceType as 'desktop' | 'mobile');
      if (!budget) continue; // Skip if no budget defined

      // Determine if value exceeds budget thresholds
      const rating = getRating(metricName, p75Value, deviceType as 'desktop' | 'mobile');

      if (rating === 'poor') {
        // Create high severity alert
        await this.createAlert({
          metricName,
          value: p75Value,
          threshold: budget.critical,
          url,
          deviceType,
          sampleSize: group.length,
          severity: 'high',
          title: `Critical ${metricName} Performance`,
          description: `${metricName} is significantly above the critical threshold of ${budget.critical} (measured: ${p75Value.toFixed(2)})`,
          alertType: 'threshold',
        });
      } else if (rating === 'needs-improvement') {
        // Create medium severity alert
        await this.createAlert({
          metricName,
          value: p75Value,
          threshold: budget.needsImprovement,
          url,
          deviceType,
          sampleSize: group.length,
          severity: 'medium',
          title: `${metricName} Needs Improvement`,
          description: `${metricName} is above the recommended threshold of ${budget.good} (measured: ${p75Value.toFixed(2)})`,
          alertType: 'threshold',
        });
      }
    }

    // After processing current batch, look for anomalies
    await this.detectAnomalies();
  }

  /**
   * Group metrics by name and URL
   */
  private groupMetricsByNameAndUrl(metrics: WebVitalsMetric[]): Record<string, WebVitalsMetric[]> {
    const grouped: Record<string, WebVitalsMetric[]> = {};

    metrics.forEach(metric => {
      const key = `${metric.name}|${metric.url}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    });

    return grouped;
  }

  /**
   * Create an alert for a performance issue
   */
  private async createAlert({
    metricName,
    value,
    threshold,
    url,
    deviceType,
    sampleSize,
    severity,
    title,
    description,
    alertType = 'threshold',
  }: {
    metricName: string;
    value: number;
    threshold: number;
    url: string;
    deviceType?: string;
    sampleSize: number;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    alertType?: 'threshold' | 'anomaly';
  }): Promise<void> {
    try {
      // Check if a similar active alert already exists
      const existingAlerts = await this.storage.getWebVitalsAlerts({
        acknowledged: false,
      });

      const similarAlert = existingAlerts.find(
        alert =>
          alert.metricName === metricName && alert.url === url && alert.alertType === alertType
      );

      // If a similar alert exists, don't create a duplicate
      if (similarAlert) {
        return;
      }

      // Create a new alert
      const alertData: InsertWebVitalsAlert = {
        id: uuidv4(),
        metricName,
        value,
        threshold,
        url,
        deviceType,
        sampleSize,
        severity,
        title,
        description,
        acknowledged: false,
        alertType,
      };

      // Save the alert to the database
      await this.storage.saveWebVitalsAlert(alertData);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  /**
   * Check for anomalies in metrics trends
   */
  public async detectAnomalies(timeWindow: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // Get date range for analysis
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeWindow);

      // Get metrics within the time window
      const metrics = await this.storage.getWebVitalsMetrics({
        startDate,
        endDate,
      });

      // Group metrics by name and URL
      const groupedMetrics = this.groupMetricsByNameAndUrl(metrics);

      // Analyze each group for anomalies
      for (const key in groupedMetrics) {
        const group = groupedMetrics[key];
        if (group.length < 10) continue; // Skip if not enough data points

        const [metricName, url] = key.split('|');
        const deviceType = group[0].deviceType || 'desktop';

        // Calculate median and percentiles
        const values = group.map(m => m.value).sort((a, b) => a - b);
        const median = this.calculateMedian(values);

        // Calculate standard deviation
        const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Check for sudden increases
        // Use most recent 10 values
        const recentValues = group
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
          .map(m => m.value);

        const recentMedian = this.calculateMedian(recentValues);

        // If recent median is more than 2 standard deviations above the overall median
        if (recentMedian > median + 2 * stdDev) {
          const percentIncrease = ((recentMedian - median) / median) * 100;

          // Only alert if the increase is significant (>25%)
          if (percentIncrease > 25) {
            const alertData: InsertWebVitalsAlert = {
              id: uuidv4(),
              metricName,
              value: recentMedian,
              threshold: median,
              url,
              deviceType,
              sampleSize: recentValues.length,
              severity: percentIncrease > 50 ? 'high' : 'medium',
              title: `Anomaly Detected in ${metricName}`,
              description: `${metricName} has increased by ${percentIncrease.toFixed(0)}% compared to the baseline (${recentMedian.toFixed(2)} vs ${median.toFixed(2)})`,
              acknowledged: false,
              alertType: 'anomaly',
            };

            // Save the anomaly alert
            await this.storage.saveWebVitalsAlert(alertData);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  }

  /**
   * Calculate median value from an array of numbers
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  /**
   * Get all active alerts
   */
  public async getActiveAlerts(): Promise<any[]> {
    try {
      return await this.storage.getWebVitalsAlerts({
        acknowledged: false,
      });
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      await this.storage.updateWebVitalsAlert(alertId, {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }
}

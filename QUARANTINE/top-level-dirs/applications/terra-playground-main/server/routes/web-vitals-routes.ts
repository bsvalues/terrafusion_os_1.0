/**
 * Web Vitals Routes
 *
 * This file implements API endpoints for handling web vitals metrics,
 * including saving metrics, retrieving reports, and managing performance alerts.
 */

import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../storage';
import { WebVitalsAlertService } from '../services/web-vitals-alert-service';
import { metricsService } from '../services/prometheus-metrics-service';
import {
  insertWebVitalsMetricsSchema,
  insertWebVitalsReportsSchema,
} from '../../shared/web-vitals-schema';

export function registerWebVitalsRoutes(router: Router, storage: IStorage) {
  const alertService = new WebVitalsAlertService(storage);

  // Save web vitals metrics (batch)
  router.post('/api/web-vitals/metrics/batch', async (req, res) => {
    try {
      const metricsArray = req.body;

      if (!Array.isArray(metricsArray)) {
        return res.status(400).json({ error: 'Expected an array of metrics' });
      }

      // Create a report to track this batch
      const reportId = uuidv4();
      const now = new Date();

      await storage.saveWebVitalsReport({
        id: reportId,
        timestamp: now,
        batchSize: metricsArray.length,
        source: req.headers['user-agent'] || 'unknown',
        processed: false,
      });

      // Process and save each metric
      const savedMetrics = [];

      for (const metricData of metricsArray) {
        try {
          // Add report ID and timestamp to each metric
          const metricWithReportId = {
            ...metricData,
            reportId,
            timestamp: metricData.timestamp || now.toISOString(),
          };

          // Validate with zod schema before saving
          const validatedMetric = insertWebVitalsMetricsSchema.parse(metricWithReportId);
          await storage.saveWebVitalsMetric(validatedMetric);
          savedMetrics.push(validatedMetric);
        } catch (err) {
          console.error('Error processing metric:', err);
          // Continue with other metrics even if one fails
        }
      }

      // Update the report as processed
      // In a real implementation, this might be done asynchronously
      // or through a background job

      // Trigger anomaly detection
      alertService.detectAnomalies().catch(err => {
        console.error('Error running anomaly detection:', err);
      });

      return res.status(200).json({
        success: true,
        reportId,
        savedCount: savedMetrics.length,
        totalCount: metricsArray.length,
      });
    } catch (error) {
      console.error('Error saving web vitals metrics:', error);
      return res.status(500).json({ error: 'Failed to save metrics' });
    }
  });

  // Get recent metrics with filtering
  router.get('/api/web-vitals/metrics', async (req, res) => {
    try {
      const { startDate, endDate, metricName, url, deviceType, limit = '100' } = req.query;

      // Convert string date parameters to Date objects
      const startDateObj = startDate ? new Date(startDate as string) : undefined;
      const endDateObj = endDate ? new Date(endDate as string) : undefined;

      const metrics = await storage.getWebVitalsMetrics({
        startDate: startDateObj,
        endDate: endDateObj,
        metricName: metricName as string,
        url: url as string,
        deviceType: deviceType as string,
        limit: parseInt(limit as string, 10),
      });

      return res.status(200).json(metrics);
    } catch (error) {
      console.error('Error retrieving web vitals metrics:', error);
      return res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
  });

  // Get active alerts
  router.get('/api/web-vitals/alerts', async (req, res) => {
    try {
      const { acknowledged } = req.query;

      let acknowlegedFilter: boolean | undefined = undefined;
      if (acknowledged === 'true') acknowlegedFilter = true;
      if (acknowledged === 'false') acknowlegedFilter = false;

      const alerts = await storage.getWebVitalsAlerts({
        acknowledged: acknowlegedFilter,
      });

      return res.status(200).json(alerts);
    } catch (error) {
      console.error('Error retrieving web vitals alerts:', error);
      return res.status(500).json({ error: 'Failed to retrieve alerts' });
    }
  });

  // Acknowledge an alert
  router.post('/api/web-vitals/alerts/:alertId/acknowledge', async (req, res) => {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;

      if (!acknowledgedBy) {
        return res.status(400).json({ error: 'acknowledgedBy is required' });
      }

      const success = await alertService.acknowledgeAlert(alertId, acknowledgedBy);

      if (success) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({ error: 'Alert not found or could not be acknowledged' });
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  // Get performance budgets
  router.get('/api/web-vitals/budgets', async (req, res) => {
    try {
      const { metricName, urlPattern, active } = req.query;

      let activeFilter: boolean | undefined = undefined;
      if (active === 'true') activeFilter = true;
      if (active === 'false') activeFilter = false;

      const budgets = await storage.getWebVitalsBudgets({
        metricName: metricName as string,
        urlPattern: urlPattern as string,
        active: activeFilter,
      });

      return res.status(200).json(budgets);
    } catch (error) {
      console.error('Error retrieving web vitals budgets:', error);
      return res.status(500).json({ error: 'Failed to retrieve budgets' });
    }
  });

  // Get web vitals summary by time period
  router.get('/api/web-vitals/summary', async (req, res) => {
    try {
      const { timeRange = '7d', urlPattern, deviceType } = req.query;

      // Convert string date parameters
      const now = new Date();
      const startDate = getStartDateFromTimeRange(timeRange as string, now);

      // Get metrics within the time range
      const metrics = await storage.getWebVitalsMetrics({
        startDate,
        endDate: now,
        url: urlPattern as string,
        deviceType: deviceType as string,
      });

      // Generate summary stats
      const summary = generateMetricsSummary(metrics);

      return res.status(200).json({
        timeRange,
        startDate,
        endDate: now,
        urlPattern: urlPattern || 'all',
        deviceType: deviceType || 'all',
        metricsCount: metrics.length,
        summary,
      });
    } catch (error) {
      console.error('Error generating web vitals summary:', error);
      return res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  // Get web vitals trends (time-series data)
  router.get('/api/web-vitals/trends', async (req, res) => {
    try {
      const { metricName, timeRange = '30d', interval = 'day', urlPattern, deviceType } = req.query;

      // Convert string date parameters
      const now = new Date();
      const startDate = getStartDateFromTimeRange(timeRange as string, now);

      // Get metrics within the time range
      const metrics = await storage.getWebVitalsMetrics({
        startDate,
        endDate: now,
        metricName: metricName as string,
        url: urlPattern as string,
        deviceType: deviceType as string,
      });

      // Generate time-series data
      const trends = generateTimeSeries(
        metrics,
        startDate,
        now,
        interval as string,
        metricName as string
      );

      return res.status(200).json({
        metricName: metricName || 'all',
        timeRange,
        interval,
        urlPattern: urlPattern || 'all',
        deviceType: deviceType || 'all',
        trends,
      });
    } catch (error) {
      console.error('Error generating web vitals trends:', error);
      return res.status(500).json({ error: 'Failed to generate trends' });
    }
  });

  // Endpoint for custom metrics (like WebSocket fallback)
  router.post('/api/web-vitals/custom-event', async (req, res) => {
    try {
      const { metric, labels = {} } = req.body;

      if (!metric) {
        return res.status(400).json({ error: 'Metric name is required' });
      }

      // Record the custom metric using the metrics service
      metricsService.incrementCounter(metric, labels);

      // Log the event for debugging purposes
      return res.status(200).json({
        success: true,
        metric,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording custom metric:', error);
      return res.status(500).json({ error: 'Failed to record custom metric' });
    }
  });

  // Expose Prometheus metrics endpoint
  router.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', metricsService.getRegistry().contentType);
      res.end(await metricsService.getRegistry().metrics());
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).send('Error generating metrics');
    }
  });

  // Handle batch web vitals reporting
  router.post('/api/web-vitals/batch', async (req, res) => {
    try {
      const payload = req.body;

      if (!payload || !payload.metrics || !Array.isArray(payload.metrics)) {
        return res.status(400).json({ error: 'Invalid payload format. Expected metrics array.' });
      }

      // Create a report to track this batch
      const reportId = uuidv4();
      const now = new Date();

      // Save each metric
      const savedMetrics = [];

      for (const metricData of payload.metrics) {
        try {
          // Generate a unique ID if not provided
          const id = metricData.id || uuidv4();

          // Add report ID and ensure timestamp
          const metricWithReportId = {
            ...metricData,
            id,
            reportId,
            timestamp: metricData.timestamp || now.toISOString(),
          };

          // Validate with zod schema before saving
          const validatedMetric = insertWebVitalsMetricsSchema.parse(metricWithReportId);
          await storage.saveWebVitalsMetric(validatedMetric);
          savedMetrics.push(validatedMetric);

          // Record the metric in Prometheus for monitoring with enhanced segmentation
          const labels = {
            route: metricData.url ? new URL(metricData.url).pathname : '/',
            deviceType: metricData.deviceType || payload.deviceInfo?.deviceType || 'unknown',
            connectionType:
              metricData.connectionType || (payload.deviceInfo as any)?.connectionType || 'unknown',
            buildVersion: (payload.tags as any)?.buildVersion || 'unknown',
            environment: (payload.tags as any)?.environment || 'development',
            // Enhanced segmentation data
            country: (payload.tags as any)?.country || 'unknown',
            region: (payload.tags as any)?.region || 'unknown',
            browser: (payload.tags as any)?.browser || 'unknown',
            browser_version: (payload.tags as any)?.browserVersion || 'unknown',
            os: (payload.tags as any)?.os || 'unknown',
            os_version: (payload.tags as any)?.osVersion || 'unknown',
            // New high-ROI segmentation
            network:
              metricData.effectiveConnectionType || (payload.tags as any)?.network || 'unknown',
            cohort: (payload.tags as any)?.cohort || 'default',
            pageType: (payload.tags as any)?.pageType || 'unknown',
          };

          // Record the metric in the appropriate histogram
          metricsService.recordWebVital(metricData.name, metricData.value, labels);

          // Check if this metric breaches any budgets
          // This is a simplified check; in a real implementation,
          // you would use the WebVitalsAlertService to handle this
          const thresholds = {
            TTFB: 500, // Good: < 500ms
            FCP: 1800, // Good: < 1.8s
            LCP: 2500, // Good: < 2.5s
            FID: 100, // Good: < 100ms
            CLS: 0.1, // Good: < 0.1
            INP: 200, // Good: < 200ms
          };

          const threshold = thresholds[metricData.name as keyof typeof thresholds];
          if (threshold && metricData.value > threshold) {
            // Use the same enhanced labels for budget breaches for consistent analysis
            metricsService.recordBudgetBreach(metricData.name, metricData.value, threshold, labels);
          }
        } catch (err) {
          console.error('Error processing metric:', err);
          // Continue with other metrics even if one fails
        }
      }

      // Save the report data
      try {
        const reportData = {
          id: reportId,
          timestamp: now,
          url: payload.metrics[0]?.url || 'unknown',
          batchSize: payload.metrics.length,
          source: req.headers['user-agent'] || 'unknown',
          deviceInfo: payload.deviceInfo || null,
          tags: payload.tags || {},
          processed: true,
        };

        await storage.saveWebVitalsReport(reportData);
      } catch (err) {
        console.error('Error saving report:', err);
      }

      // Trigger anomaly detection
      alertService.detectAnomalies().catch(err => {
        console.error('Error running anomaly detection:', err);
      });

      return res.status(200).json({
        success: true,
        reportId,
        savedCount: savedMetrics.length,
        totalCount: payload.metrics.length,
      });
    } catch (error) {
      console.error('Error saving web vitals batch:', error);
      // Record the HTTP error in Prometheus
      metricsService.recordHttpError(500, 'POST', '/api/web-vitals/batch');
      return res.status(500).json({ error: 'Failed to save metrics batch' });
    }
  });

  // Helper function to get start date from time range string
  function getStartDateFromTimeRange(timeRange: string, now: Date): Date {
    const startDate = new Date(now);

    if (timeRange.endsWith('d')) {
      const days = parseInt(timeRange.slice(0, -1), 10);
      startDate.setDate(startDate.getDate() - days);
    } else if (timeRange.endsWith('h')) {
      const hours = parseInt(timeRange.slice(0, -1), 10);
      startDate.setHours(startDate.getHours() - hours);
    } else if (timeRange.endsWith('m')) {
      const minutes = parseInt(timeRange.slice(0, -1), 10);
      startDate.setMinutes(startDate.getMinutes() - minutes);
    } else if (timeRange.endsWith('w')) {
      const weeks = parseInt(timeRange.slice(0, -1), 10);
      startDate.setDate(startDate.getDate() - weeks * 7);
    } else {
      // Default to 7 days if invalid format
      startDate.setDate(startDate.getDate() - 7);
    }

    return startDate;
  }

  // Helper function to generate metrics summary
  function generateMetricsSummary(metrics: WebVitalsMetric[]): Record<string, any> {
    const metricTypes = ['LCP', 'FID', 'CLS', 'TTFB', 'FCP', 'INP'];
    const summary: Record<string, any> = {};

    // Group metrics by type
    const metricsByType: Record<string, WebVitalsMetric[]> = {};

    metrics.forEach(metric => {
      const name = metric.name.toUpperCase();
      if (!metricsByType[name]) {
        metricsByType[name] = [];
      }
      metricsByType[name].push(metric);
    });

    // Calculate summary statistics for each metric type
    metricTypes.forEach(type => {
      const typeMetrics = metricsByType[type] || [];

      if (typeMetrics.length === 0) {
        summary[type.toLowerCase()] = null;
        return;
      }

      // Get values for percentile calculations
      const values = typeMetrics.map(m => m.value).sort((a, b) => a - b);

      // Calculate rating distributions
      const ratings = typeMetrics.reduce(
        (acc, m) => {
          const rating = m.rating || 'unknown';
          acc[rating] = (acc[rating] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Calculate percentile values
      summary[type.toLowerCase()] = {
        count: typeMetrics.length,
        min: values[0],
        max: values[values.length - 1],
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
        median: getPercentile(values, 50),
        p75: getPercentile(values, 75),
        p95: getPercentile(values, 95),
        ratings: {
          good: ratings.good || 0,
          'needs-improvement': ratings['needs-improvement'] || 0,
          poor: ratings.poor || 0,
          unknown: ratings.unknown || 0,
        },
        goodPercentage: ((ratings.good || 0) / typeMetrics.length) * 100,
        satisfiesCoreCWV: type === 'LCP' || type === 'FID' || type === 'CLS',
      };
    });

    return summary;
  }

  // Helper function to calculate percentile
  function getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  // Helper function to generate time series data
  function generateTimeSeries(
    metrics: WebVitalsMetric[],
    startDate: Date,
    endDate: Date,
    interval: string,
    metricName?: string
  ): any[] {
    // Sort metrics by timestamp
    metrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Define interval duration in milliseconds
    let intervalMs: number;
    switch (interval) {
      case 'hour':
        intervalMs = 60 * 60 * 1000;
        break;
      case 'day':
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case 'week':
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        intervalMs = 24 * 60 * 60 * 1000; // Default to day
    }

    // Generate time slots
    const timeSlots: Array<{
      startTime: Date;
      endTime: Date;
      metrics: WebVitalsMetric[];
    }> = [];

    let currentStart = new Date(startDate);
    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart.getTime() + intervalMs);

      timeSlots.push({
        startTime: currentStart,
        endTime: currentEnd,
        metrics: [],
      });

      currentStart = currentEnd;
    }

    // Group metrics into time slots
    metrics.forEach(metric => {
      // Skip if filtering by metric name and this doesn't match
      if (metricName && metric.name.toUpperCase() !== metricName.toUpperCase()) {
        return;
      }

      const metricTime = new Date(metric.timestamp);

      for (const slot of timeSlots) {
        if (metricTime >= slot.startTime && metricTime < slot.endTime) {
          slot.metrics.push(metric);
          break;
        }
      }
    });

    // Calculate stats for each slot
    return timeSlots.map(slot => {
      const stats = calculateSlotStats(slot.metrics);

      return {
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        sampleSize: slot.metrics.length,
        ...stats,
      };
    });
  }

  // Helper function to calculate stats for a time slot
  function calculateSlotStats(slotMetrics: WebVitalsMetric[]): Record<string, any> {
    if (slotMetrics.length === 0) {
      return {
        value: null,
        p75: null,
        goodPercentage: null,
      };
    }

    // Group by metric type
    const metricsByType: Record<string, WebVitalsMetric[]> = {};

    slotMetrics.forEach(metric => {
      const name = metric.name.toUpperCase();
      if (!metricsByType[name]) {
        metricsByType[name] = [];
      }
      metricsByType[name].push(metric);
    });

    // Calculate stats for each metric type
    const result: Record<string, any> = {};

    Object.entries(metricsByType).forEach(([type, typeMetrics]) => {
      const values = typeMetrics.map(m => m.value).sort((a, b) => a - b);
      const goodCount = typeMetrics.filter(m => m.rating === 'good').length;

      result[type.toLowerCase()] = {
        count: typeMetrics.length,
        median: getPercentile(values, 50),
        p75: getPercentile(values, 75),
        goodPercentage: (goodCount / typeMetrics.length) * 100,
      };
    });

    return result;
  }

  return router;
}

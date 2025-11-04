/**
 * Analytics API Routes
 *
 * Endpoints for collecting and retrieving analytics data, including Web Vitals
 * performance metrics from real users.
 */

import express from 'express';
import { z } from 'zod';
import { Storage } from '../storage';

// Create router
const router = express.Router();

// Storage instance
const storage = Storage.getInstance();

// Web Vitals metric schema
const webVitalsMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
  timestamp: z.number(),
  navigationType: z.string().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
});

// Web Vitals percentiles schema
const webVitalsPercentilesSchema = z.record(
  z.object({
    p50: z.number(),
    p75: z.number(),
    p95: z.number(),
    p99: z.number(),
  })
);

// Device info schema
const deviceInfoSchema = z
  .object({
    userAgent: z.string().optional(),
    deviceType: z.string().optional(),
    screenSize: z.string().optional(),
    viewport: z.string().optional(),
    connection: z.string().optional(),
    browser: z.string().optional(),
  })
  .optional();

// Web Vitals report schema
const webVitalsReportSchema = z.object({
  timestamp: z.number(),
  url: z.string(),
  metrics: z.array(webVitalsMetricSchema),
  percentiles: webVitalsPercentilesSchema.optional(),
  deviceInfo: deviceInfoSchema,
  tags: z.record(z.string()).optional(),
});

/**
 * POST /api/analytics/web-vitals
 *
 * Collect Web Vitals metrics from client.
 */
router.post('/web-vitals', async (req, res) => {
  try {
    // Validate request body
    const report = webVitalsReportSchema.parse(req.body);

    // Store metrics
    await storage.storeWebVitalsReport(report);

    // Respond with success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error collecting Web Vitals metrics:', error);

    // Respond with error
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/web-vitals
 *
 * Get Web Vitals metrics.
 */
router.get('/web-vitals', async (req, res) => {
  try {
    // Parse query parameters
    const timeRange = (req.query.timeRange as string) || '24h';
    const metric = (req.query.metric as string) || 'all';
    const limit = parseInt((req.query.limit as string) || '100', 10);

    // Get metrics
    const metrics = await storage.getWebVitalsMetrics(timeRange, metric, limit);

    // Respond with metrics
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error retrieving Web Vitals metrics:', error);

    // Respond with error
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/analytics/web-vitals/summary
 *
 * Get Web Vitals summary.
 */
router.get('/web-vitals/summary', async (req, res) => {
  try {
    // Parse query parameters
    const timeRange = (req.query.timeRange as string) || '24h';

    // Get summary
    const summary = await storage.getWebVitalsSummary(timeRange);

    // Respond with summary
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error retrieving Web Vitals summary:', error);

    // Respond with error
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

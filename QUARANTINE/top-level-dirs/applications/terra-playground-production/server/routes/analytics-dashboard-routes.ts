/**
 * Analytics Dashboard Routes
 *
 * Provides API endpoints for comprehensive analytics and visualization:
 * - Model performance metrics
 * - Version comparison
 * - Predictive metrics
 * - KPI tracking
 */

import express from 'express';
import { z } from 'zod';
import { getAnalyticsDashboard } from '../services/development/analytics-dashboard';

const router = express.Router();

/**
 * Get model performance metrics
 */
router.get('/performance/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    // Get performance metrics
    const analyticsDashboard = getAnalyticsDashboard();
    const metrics = await analyticsDashboard.getModelPerformanceMetrics(modelId);

    return res.json(metrics);
  } catch (error) {
    console.error('Error getting model performance metrics:', error);
    return res.status(500).json({ error: 'Failed to get model performance metrics' });
  }
});

/**
 * Compare model versions
 */
router.get('/version-comparison/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const currentVersionId = parseInt(req.query.currentVersionId as string);
    const previousVersionId = req.query.previousVersionId
      ? parseInt(req.query.previousVersionId as string)
      : undefined;

    if (!currentVersionId) {
      return res.status(400).json({ error: 'currentVersionId is required' });
    }

    // Compare versions
    const analyticsDashboard = getAnalyticsDashboard();
    const comparison = await analyticsDashboard.compareModelVersions(
      modelId,
      currentVersionId,
      previousVersionId
    );

    return res.json(comparison);
  } catch (error) {
    console.error('Error comparing model versions:', error);
    return res.status(500).json({ error: 'Failed to compare model versions' });
  }
});

/**
 * Get predictive metrics
 */
router.get('/predictive/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    // Get predictive metrics
    const analyticsDashboard = getAnalyticsDashboard();
    const metrics = await analyticsDashboard.getPredictiveMetrics(modelId);

    return res.json(metrics);
  } catch (error) {
    console.error('Error getting predictive metrics:', error);
    return res.status(500).json({ error: 'Failed to get predictive metrics' });
  }
});

/**
 * Get assessment KPIs
 */
router.get('/kpis/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    // Get KPIs
    const analyticsDashboard = getAnalyticsDashboard();
    const kpis = await analyticsDashboard.getAssessmentKPIs(modelId);

    return res.json(kpis);
  } catch (error) {
    console.error('Error getting assessment KPIs:', error);
    return res.status(500).json({ error: 'Failed to get assessment KPIs' });
  }
});

export default router;

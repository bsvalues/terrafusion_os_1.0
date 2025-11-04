/**
 * Productivity Routes
 *
 * API endpoints for productivity tracking
 */
import { Router } from 'express';
import { productivityTrackingService } from '../services/productivity-tracking-service';
import { DeveloperEnergyLevel, FocusLevel, ProductivityMetricType } from '@shared/schema';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get today's productivity metrics for the current user
 * GET /api/productivity/today
 */
router.get('/today', async (req, res) => {
  try {
    // In a real app, this would be req.user.id from authentication
    // For demo, we'll use a sample userId = 1
    const userId = req.user?.id || 1;

    const metric = await productivityTrackingService.getTodayProductivityMetric(userId);

    if (!metric) {
      return res.status(404).json({ error: 'Productivity metric not found' });
    }

    res.json(metric);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting today productivity metrics',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch productivity metrics' });
  }
});

/**
 * Get productivity metrics for the current user
 * GET /api/productivity/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // In a real app, this would be req.user.id from authentication
    const userId = req.user?.id || 1;

    const { startDate, endDate } = req.query;
    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;

    if (startDate) {
      startDateObj = new Date(startDate as string);
    }

    if (endDate) {
      endDateObj = new Date(endDate as string);
    }

    const metrics = await productivityTrackingService.getProductivityMetrics(
      userId,
      startDateObj,
      endDateObj
    );

    res.json(metrics);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting productivity metrics',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch productivity metrics' });
  }
});

/**
 * Update today's productivity metrics
 * PATCH /api/productivity/today
 */
router.patch('/today', async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    // Get today's metric first
    const metric = await productivityTrackingService.getTodayProductivityMetric(userId);

    if (!metric) {
      return res.status(404).json({ error: 'Productivity metric not found' });
    }

    // Update the metric with the request body
    const updatedMetric = await productivityTrackingService.updateProductivityMetric(
      metric.id,
      req.body
    );

    if (!updatedMetric) {
      return res.status(500).json({ error: 'Failed to update productivity metric' });
    }

    res.json(updatedMetric);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error updating today productivity metrics',
      error,
    });
    res.status(500).json({ error: 'Failed to update productivity metrics' });
  }
});

/**
 * Start a new activity session
 * POST /api/productivity/sessions/start
 */
router.post('/sessions/start', async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    // Get today's metric first for the metricId
    const metric = await productivityTrackingService.getTodayProductivityMetric(userId);

    if (!metric) {
      return res.status(404).json({ error: 'Productivity metric not found' });
    }

    const session = await productivityTrackingService.startActivitySession({
      userId,
      metricId: metric.id,
      activityType: req.body.activityType || ProductivityMetricType.OTHER,
      description: req.body.description || '',
      projectId: req.body.projectId,
      codeLines: req.body.codeLines || 0,
      details: req.body.details || {},
      startTime: new Date(),
    });

    if (!session) {
      return res.status(500).json({ error: 'Failed to start activity session' });
    }

    res.status(201).json(session);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error starting activity session',
      error,
    });
    res.status(500).json({ error: 'Failed to start activity session' });
  }
});

/**
 * End an activity session
 * PATCH /api/productivity/sessions/:id/end
 */
router.patch('/sessions/:id/end', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await productivityTrackingService.endActivitySession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Activity session not found' });
    }

    res.json(session);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: `Error ending activity session`,
      error,
    });
    res.status(500).json({ error: 'Failed to end activity session' });
  }
});

/**
 * Get active (unfinished) activity sessions
 * GET /api/productivity/sessions/active
 */
router.get('/sessions/active', async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    const sessions = await productivityTrackingService.getActiveActivitySessions(userId);

    res.json(sessions);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting active activity sessions',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch active activity sessions' });
  }
});

/**
 * Get recent activity sessions
 * GET /api/productivity/sessions/recent
 */
router.get('/sessions/recent', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const sessions = await productivityTrackingService.getRecentActivitySessions(userId, limit);

    res.json(sessions);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting recent activity sessions',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch recent activity sessions' });
  }
});

/**
 * Get recommendations for a specific energy level
 * GET /api/productivity/recommendations/:energyLevel
 */
router.get('/recommendations/:energyLevel', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const energyLevel = req.params.energyLevel as DeveloperEnergyLevel;

    if (!Object.values(DeveloperEnergyLevel).includes(energyLevel)) {
      return res.status(400).json({ error: 'Invalid energy level' });
    }

    const recommendations = await productivityTrackingService.getEnergyLevelRecommendations(
      userId,
      energyLevel
    );

    if (!recommendations) {
      return res.status(404).json({ error: 'Recommendations not found' });
    }

    res.json(recommendations);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting energy level recommendations',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch energy level recommendations' });
  }
});

/**
 * Get productivity statistics
 * GET /api/productivity/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;

    const statistics = await productivityTrackingService.getProductivityStatistics(userId, days);

    res.json(statistics);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting productivity statistics',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch productivity statistics' });
  }
});

/**
 * Get productivity trend data for charts
 * GET /api/productivity/trends
 */
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const trendData = await productivityTrackingService.getProductivityTrendData(userId, days);

    res.json(trendData);
  } catch (error) {
    logger.error({
      component: 'ProductivityRoutes',
      message: 'Error getting productivity trend data',
      error,
    });
    res.status(500).json({ error: 'Failed to fetch productivity trend data' });
  }
});

/**
 * Get enum values (for frontend reference)
 * GET /api/productivity/enums
 */
router.get('/enums', (req, res) => {
  res.json({
    energyLevels: Object.values(DeveloperEnergyLevel),
    focusLevels: Object.values(FocusLevel),
    activityTypes: Object.values(ProductivityMetricType),
  });
});

export default router;

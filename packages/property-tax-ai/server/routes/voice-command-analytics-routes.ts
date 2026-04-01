/**
 * Voice Command Analytics Routes
 * 
 * API endpoints for voice command analytics, including:
 * - User analytics
 * - Global analytics
 * - Command logs
 * - Analytics reports
 */

import { Router } from 'express';
import { z } from 'zod';
import { voiceCommandAnalyticsService } from '../services/voice-command/voice-command-analytics-service';

const router = Router();

// Date range schema for analytics queries
const dateRangeSchema = z.object({
  start: z.string().transform(val => new Date(val)),
  end: z.string().transform(val => new Date(val))
});

/**
 * Get user voice command analytics
 * 
 * GET /api/voice-command/analytics/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get date range from query parameters
    const start = req.query.start ? new Date(req.query.start as string) : new Date();
    const end = req.query.end ? new Date(req.query.end as string) : new Date();
    
    // Default to last 30 days if no date range specified
    if (!req.query.start) {
      start.setDate(start.getDate() - 30);
    }
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    const analytics = await voiceCommandAnalyticsService.getUserAnalytics(userId, { start, end });
    
    return res.json(analytics);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return res.status(500).json({ error: 'Failed to retrieve user analytics' });
  }
});

/**
 * Get global voice command analytics
 * 
 * GET /api/voice-command/analytics/global
 */
router.get('/global', async (req, res) => {
  try {
    // Get date range from query parameters
    const start = req.query.start ? new Date(req.query.start as string) : new Date();
    const end = req.query.end ? new Date(req.query.end as string) : new Date();
    
    // Default to last 30 days if no date range specified
    if (!req.query.start) {
      start.setDate(start.getDate() - 30);
    }
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    const analytics = await voiceCommandAnalyticsService.getGlobalAnalytics({ start, end });
    
    return res.json(analytics);
  } catch (error) {
    console.error('Error getting global analytics:', error);
    return res.status(500).json({ error: 'Failed to retrieve global analytics' });
  }
});

/**
 * Get recent voice command logs for a user
 * 
 * GET /api/voice-command/analytics/logs/:userId
 */
router.get('/logs/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get limit from query parameter or default to 100
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return res.status(400).json({ error: 'Invalid limit (must be between 1 and 1000)' });
    }
    
    const logs = await voiceCommandAnalyticsService.getRecentLogs(userId, limit);
    
    return res.json(logs);
  } catch (error) {
    console.error('Error getting command logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve command logs' });
  }
});

/**
 * Generate a full analytics report
 * 
 * GET /api/voice-command/analytics/report
 */
router.get('/report', async (req, res) => {
  try {
    // Get date range from query parameters
    const start = req.query.start ? new Date(req.query.start as string) : new Date();
    const end = req.query.end ? new Date(req.query.end as string) : new Date();
    
    // Default to last 30 days if no date range specified
    if (!req.query.start) {
      start.setDate(start.getDate() - 30);
    }
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    const report = await voiceCommandAnalyticsService.generateAnalyticsReport({ start, end });
    
    return res.json(report);
  } catch (error) {
    console.error('Error generating analytics report:', error);
    return res.status(500).json({ error: 'Failed to generate analytics report' });
  }
});

export default router;
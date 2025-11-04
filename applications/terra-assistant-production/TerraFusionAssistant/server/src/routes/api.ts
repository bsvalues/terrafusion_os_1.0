/**
 * Main API routes
 */
import { Router, Request, Response } from 'express';
import { ApiResponse } from '../models/levy';

const router = Router();

/**
 * @route   GET /api/status
 * @desc    Get API status information
 * @access  Public
 */
router.get('/status', function(req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      service: 'Terrafusion API',
      status: 'operational',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date()
    },
    timestamp: new Date()
  });
});

export default router;
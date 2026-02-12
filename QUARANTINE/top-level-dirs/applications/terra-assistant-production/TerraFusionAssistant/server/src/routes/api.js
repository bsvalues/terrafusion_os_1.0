/**
 * Main API routes
 */
const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/status
 * @desc    Get API status information
 * @access  Public
 */
router.get('/status', (req, res) => {
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

module.exports = router;
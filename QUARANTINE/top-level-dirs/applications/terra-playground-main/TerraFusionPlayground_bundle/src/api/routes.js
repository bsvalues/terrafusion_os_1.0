const express = require('express');
const { AIModel } = require('../core/ai/model');
const { SecurityManager } = require('../core/engine/securityManager');
const { PerformanceMonitor } = require('../core/engine/performanceMonitor');

const router = express.Router();
const aiModel = new AIModel();
const securityManager = new SecurityManager();
const performanceMonitor = new PerformanceMonitor();

router.use(async (req, res, next) => {
  try {
    await securityManager.validateRequest(req);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/process', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await aiModel.process(req.body);
    const processingTime = Date.now() - startTime;

    await performanceMonitor.recordMetric('api_processing_time', processingTime);
    res.json(result);
  } catch (error) {
    await performanceMonitor.recordMetric('api_error', 1);
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = {
      model: aiModel.isInitialized ? 'ready' : 'not_initialized',
      performance: await performanceMonitor.getMetrics(),
      security: await securityManager.getStatus()
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/initialize', async (req, res) => {
  try {
    await aiModel.initialize();
    res.json({ status: 'initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    await aiModel.cleanup();
    res.json({ status: 'cleaned_up' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
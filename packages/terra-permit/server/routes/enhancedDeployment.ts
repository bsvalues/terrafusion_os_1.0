import { Router } from 'express';
import { multiSiteManager } from '../services/multiSiteManager';
import { threatDetectionService } from '../services/threatDetection';
import { credentialRotationService } from '../services/credentialRotation';
import { batchProcessor } from '../services/batchProcessor';
import { cacheService } from '../services/cacheService';

const router = Router();

// Multi-Site Management Routes
router.get('/enhanced-deployment/sites', async (req, res) => {
  try {
    const sites = await multiSiteManager.getAllSites();
    res.json({
      success: true,
      sites,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sites',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/sites', async (req, res) => {
  try {
    const newSite = await multiSiteManager.addSite(req.body);
    res.json({
      success: true,
      site: newSite,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add site',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/sync-policy', async (req, res) => {
  try {
    const { policyName, targetSiteIds } = req.body;
    const syncId = await multiSiteManager.syncPolicyToSites(policyName, targetSiteIds);
    
    res.json({
      success: true,
      syncId,
      message: `Policy sync initiated for ${targetSiteIds.length} sites`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start policy sync',
      error: (error as Error).message
    });
  }
});

router.get('/enhanced-deployment/aggregated-metrics', async (req, res) => {
  try {
    const metrics = await multiSiteManager.getAggregatedMetrics();
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get aggregated metrics',
      error: (error as Error).message
    });
  }
});

// Advanced Security Routes
router.get('/enhanced-deployment/security/threats', async (req, res) => {
  try {
    const summary = await threatDetectionService.getThreatSummary();
    const recentThreats = threatDetectionService.getRecentThreats(10);
    
    res.json({
      success: true,
      summary,
      recentThreats,
      monitoring: threatDetectionService.isMonitoring(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get threat information',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/security/start-monitoring', async (req, res) => {
  try {
    threatDetectionService.startMonitoring();
    res.json({
      success: true,
      message: 'Threat monitoring activated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start threat monitoring',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/security/stop-monitoring', async (req, res) => {
  try {
    threatDetectionService.stopMonitoring();
    res.json({
      success: true,
      message: 'Threat monitoring deactivated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop threat monitoring',
      error: (error as Error).message
    });
  }
});

// Credential Management Routes
router.get('/enhanced-deployment/credentials', async (req, res) => {
  try {
    const credentials = credentialRotationService.getAllCredentials();
    const summary = credentialRotationService.getRotationSummary();
    
    res.json({
      success: true,
      credentials,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get credentials',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/credentials/:id/rotate', async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleId = await credentialRotationService.scheduleRotation(id, 'manual');
    
    res.json({
      success: true,
      scheduleId,
      message: 'Credential rotation scheduled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule credential rotation',
      error: (error as Error).message
    });
  }
});

// Performance Optimization Routes
router.get('/enhanced-deployment/performance/batch-status', async (req, res) => {
  try {
    const queueStatus = batchProcessor.getQueueStatus();
    
    res.json({
      success: true,
      queue: queueStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get batch status',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/performance/batch-process', async (req, res) => {
  try {
    const { type, items, priority } = req.body;
    const batchId = await batchProcessor.addToBatch(type, items, priority);
    
    res.json({
      success: true,
      batchId,
      message: `Batch job created with ${items.length} items`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create batch job',
      error: (error as Error).message
    });
  }
});

router.get('/enhanced-deployment/performance/cache-stats', async (req, res) => {
  try {
    const stats = cacheService.getStats();
    
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: (error as Error).message
    });
  }
});

router.post('/enhanced-deployment/performance/warm-cache', async (req, res) => {
  try {
    await cacheService.warmCache();
    
    res.json({
      success: true,
      message: 'Cache warming completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to warm cache',
      error: (error as Error).message
    });
  }
});

// System Health and Analytics
router.get('/enhanced-deployment/analytics/overview', async (req, res) => {
  try {
    const [
      siteMetrics,
      threatSummary,
      credentialSummary,
      batchStatus,
      cacheStats
    ] = await Promise.all([
      multiSiteManager.getAggregatedMetrics(),
      threatDetectionService.getThreatSummary(),
      credentialRotationService.getRotationSummary(),
      batchProcessor.getQueueStatus(),
      cacheService.getStats()
    ]);

    const overview = {
      sites: siteMetrics,
      security: threatSummary,
      credentials: credentialSummary,
      performance: {
        batch: batchStatus,
        cache: cacheStats
      },
      systemHealth: {
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    };

    res.json({
      success: true,
      overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get system overview',
      error: (error as Error).message
    });
  }
});

export default router;
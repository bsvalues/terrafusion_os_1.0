import { Router } from 'express';
import { neuralPermitNetwork } from '../services/neuralPermitNetwork.js';
import { quantumDecisionEngine } from '../services/quantumDecisionEngine.js';

const router = Router();

router.post('/neural/decision', async (req, res) => {
  try {
    const { permitData, countyId } = req.body;
    
    if (!permitData || !countyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Permit data and county ID are required' 
      });
    }

    const result = await quantumDecisionEngine.processPermitWithQuantumSpeed(permitData, countyId);
    
    res.json({
      success: true,
      decision: result.decision,
      automationLevel: result.automationLevel,
      processingPath: result.processingPath,
      efficiency: result.efficiency,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Decision processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Neural decision processing failed' 
    });
  }
});

router.post('/neural/learn', async (req, res) => {
  try {
    const { permitData, decisionVector, actualOutcome, countyId } = req.body;
    
    if (!permitData || !decisionVector || !actualOutcome || !countyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'All learning parameters are required' 
      });
    }

    await neuralPermitNetwork.learnFromDecision(permitData, decisionVector, actualOutcome, countyId);
    
    res.json({
      success: true,
      message: 'Neural network learning completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Learning error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Neural network learning failed' 
    });
  }
});

router.get('/neural/insights/:countyId', async (req, res) => {
  try {
    const { countyId } = req.params;
    
    const insights = await neuralPermitNetwork.generateInsights(countyId);
    
    res.json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Insights generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate neural insights' 
    });
  }
});

router.get('/neural/status', async (req, res) => {
  try {
    const networkStatus = neuralPermitNetwork.getNetworkStatus();
    const engineStatus = quantumDecisionEngine.getEngineStatus();
    
    res.json({
      success: true,
      network: networkStatus,
      engine: engineStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve neural system status' 
    });
  }
});

router.get('/quantum/infrastructure/:countyId', async (req, res) => {
  try {
    const { countyId } = req.params;
    
    const infrastructure = await quantumDecisionEngine.generatePredictiveInfrastructure(countyId);
    
    res.json({
      success: true,
      infrastructure,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Infrastructure prediction error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate infrastructure predictions' 
    });
  }
});

router.get('/quantum/automation/:countyId', async (req, res) => {
  try {
    const { countyId } = req.params;
    
    const automation = await quantumDecisionEngine.enableTeslaLevelAutomation(countyId);
    
    res.json({
      success: true,
      automation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Automation setup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to configure automation system' 
    });
  }
});

router.post('/quantum/deployment', async (req, res) => {
  try {
    const { countyIds } = req.body;
    
    if (!Array.isArray(countyIds) || countyIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'County IDs array is required' 
      });
    }

    const deployment = await quantumDecisionEngine.executeMuskScaleDeployment(countyIds);
    
    res.json({
      success: true,
      deployment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NeuralPermitRoutes] Deployment planning error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create deployment plan' 
    });
  }
});

export default router;
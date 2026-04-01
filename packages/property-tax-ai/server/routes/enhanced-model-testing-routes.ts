/**
 * Enhanced Model Testing Routes
 * 
 * Provides API endpoints for comprehensive testing capabilities:
 * - Automated test case generation
 * - Test execution
 * - Regression testing
 * - Historical simulation
 */

import express from 'express';
import { z } from 'zod';
import { getEnhancedModelTesting } from '../services/development/enhanced-model-testing';

const router = express.Router();

/**
 * Generate test cases
 */
router.post('/generate-tests', async (req, res) => {
  try {
    const requestSchema = z.object({
      modelId: z.string()
    });
    
    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const { modelId } = validationResult.data;
    
    // Generate test cases
    const enhancedModelTesting = getEnhancedModelTesting();
    const testCases = await enhancedModelTesting.generateTestCases(modelId);
    
    return res.json({ testCases });
  } catch (error) {
    console.error('Error generating test cases:', error);
    return res.status(500).json({ error: 'Failed to generate test cases' });
  }
});

/**
 * Run tests
 */
router.post('/run-tests', async (req, res) => {
  try {
    const requestSchema = z.object({
      modelId: z.string(),
      testCaseIds: z.array(z.number()).optional()
    });
    
    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const { modelId, testCaseIds } = validationResult.data;
    
    // Run tests
    const enhancedModelTesting = getEnhancedModelTesting();
    const testResults = await enhancedModelTesting.runModelTests(modelId, testCaseIds);
    
    return res.json(testResults);
  } catch (error) {
    console.error('Error running tests:', error);
    return res.status(500).json({ error: 'Failed to run tests' });
  }
});

/**
 * Run regression tests
 */
router.post('/regression-tests', async (req, res) => {
  try {
    const requestSchema = z.object({
      modelId: z.string(),
      currentVersionId: z.number(),
      previousVersionId: z.number().optional()
    });
    
    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const { modelId, currentVersionId, previousVersionId } = validationResult.data;
    
    // Run regression tests
    const enhancedModelTesting = getEnhancedModelTesting();
    const regressionResults = await enhancedModelTesting.runRegressionTests(
      modelId,
      currentVersionId,
      previousVersionId
    );
    
    return res.json(regressionResults);
  } catch (error) {
    console.error('Error running regression tests:', error);
    return res.status(500).json({ error: 'Failed to run regression tests' });
  }
});

/**
 * Run historical simulation
 */
router.post('/historical-simulation', async (req, res) => {
  try {
    const requestSchema = z.object({
      modelId: z.string(),
      config: z.object({
        startDate: z.string(),
        endDate: z.string(),
        intervalType: z.enum(['month', 'quarter', 'year']),
        scenarioType: z.enum(['historical', 'projected', 'stress-test']),
        variables: z.array(z.object({
          name: z.string(),
          values: z.array(z.any()).nullable(),
          trend: z.object({
            type: z.enum(['linear', 'exponential', 'cyclical']),
            parameters: z.record(z.string(), z.number())
          }).optional()
        }))
      })
    });
    
    const validationResult = requestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const { modelId, config } = validationResult.data;
    
    // Run historical simulation
    const enhancedModelTesting = getEnhancedModelTesting();
    const simulationResults = await enhancedModelTesting.runHistoricalSimulation(modelId, config);
    
    return res.json(simulationResults);
  } catch (error) {
    console.error('Error running historical simulation:', error);
    return res.status(500).json({ error: 'Failed to run historical simulation' });
  }
});

export default router;
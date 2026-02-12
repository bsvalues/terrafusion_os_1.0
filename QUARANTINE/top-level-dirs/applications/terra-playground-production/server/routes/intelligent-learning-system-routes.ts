/**
 * Intelligent Learning System Routes
 *
 * Provides API endpoints for continuous learning and improvement:
 * - Knowledge repository management
 * - Best practice recommendations
 * - Continuous improvement suggestions
 * - Learning pattern detection
 */

import express from 'express';
import { z } from 'zod';
import { getIntelligentLearningSystem } from '../services/development/intelligent-learning-system';

const router = express.Router();

/**
 * Extract knowledge from a component
 */
router.post('/extract-component-knowledge', async (req, res) => {
  try {
    const requestSchema = z.object({
      componentId: z.number(),
      modelId: z.string(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { componentId, modelId } = validationResult.data;

    // Get component and model
    const intelligentLearningSystem = getIntelligentLearningSystem();
    const storage = intelligentLearningSystem.storage;

    const component = await storage.getModelComponent(componentId);
    const model = await storage.getAssessmentModelByModelId(modelId);

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Extract knowledge
    const knowledgeItem = await intelligentLearningSystem.extractKnowledgeFromComponent(
      component,
      model
    );

    return res.json({ knowledgeItem });
  } catch (error) {
    console.error('Error extracting component knowledge:', error);
    return res.status(500).json({ error: 'Failed to extract component knowledge' });
  }
});

/**
 * Extract knowledge from a calculation
 */
router.post('/extract-calculation-knowledge', async (req, res) => {
  try {
    const requestSchema = z.object({
      calculationId: z.number(),
      modelId: z.string(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { calculationId, modelId } = validationResult.data;

    // Get calculation and model
    const intelligentLearningSystem = getIntelligentLearningSystem();
    const storage = intelligentLearningSystem.storage;

    const calculation = await storage.getModelCalculation(calculationId);
    const model = await storage.getAssessmentModelByModelId(modelId);

    if (!calculation) {
      return res.status(404).json({ error: 'Calculation not found' });
    }

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Extract knowledge
    const knowledgeItem = await intelligentLearningSystem.extractKnowledgeFromCalculation(
      calculation,
      model
    );

    return res.json({ knowledgeItem });
  } catch (error) {
    console.error('Error extracting calculation knowledge:', error);
    return res.status(500).json({ error: 'Failed to extract calculation knowledge' });
  }
});

/**
 * Find similar knowledge items
 */
router.post('/find-similar-knowledge', async (req, res) => {
  try {
    const requestSchema = z.object({
      query: z.string(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { query, category, tags } = validationResult.data;

    // Find similar knowledge items
    const intelligentLearningSystem = getIntelligentLearningSystem();
    const knowledgeItems = await intelligentLearningSystem.findSimilarKnowledgeItems(
      query,
      category,
      tags
    );

    return res.json({ knowledgeItems });
  } catch (error) {
    console.error('Error finding similar knowledge:', error);
    return res.status(500).json({ error: 'Failed to find similar knowledge' });
  }
});

/**
 * Generate best practices
 */
router.post('/generate-best-practices', async (req, res) => {
  try {
    const requestSchema = z.object({
      modelType: z.string().optional(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { modelType } = validationResult.data;

    // Generate best practices
    const intelligentLearningSystem = getIntelligentLearningSystem();
    const bestPractices = await intelligentLearningSystem.generateBestPractices(modelType);

    return res.json({ bestPractices });
  } catch (error) {
    console.error('Error generating best practices:', error);
    return res.status(500).json({ error: 'Failed to generate best practices' });
  }
});

/**
 * Generate improvement suggestions
 */
router.post('/generate-improvement-suggestions', async (req, res) => {
  try {
    const requestSchema = z.object({
      modelId: z.string(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { modelId } = validationResult.data;

    // Generate improvement suggestions
    const intelligentLearningSystem = getIntelligentLearningSystem();
    const suggestions = await intelligentLearningSystem.generateImprovementSuggestions(modelId);

    return res.json({ suggestions });
  } catch (error) {
    console.error('Error generating improvement suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate improvement suggestions' });
  }
});

/**
 * Detect learning patterns
 */
router.post('/detect-learning-patterns', async (req, res) => {
  try {
    // Detect learning patterns
    const intelligentLearningSystem = getIntelligentLearningSystem();
    const patterns = await intelligentLearningSystem.detectLearningPatterns();

    return res.json({ patterns });
  } catch (error) {
    console.error('Error detecting learning patterns:', error);
    return res.status(500).json({ error: 'Failed to detect learning patterns' });
  }
});

/**
 * Get knowledge items
 */
router.get('/knowledge', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;

    const intelligentLearningSystem = getIntelligentLearningSystem();
    const knowledgeItems = await intelligentLearningSystem.getKnowledgeItems(category, tags);

    return res.json({ knowledgeItems });
  } catch (error) {
    console.error('Error getting knowledge items:', error);
    return res.status(500).json({ error: 'Failed to get knowledge items' });
  }
});

/**
 * Get best practices
 */
router.get('/best-practices', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const modelType = req.query.modelType as string | undefined;

    const intelligentLearningSystem = getIntelligentLearningSystem();
    const bestPractices = await intelligentLearningSystem.getBestPractices(category, modelType);

    return res.json({ bestPractices });
  } catch (error) {
    console.error('Error getting best practices:', error);
    return res.status(500).json({ error: 'Failed to get best practices' });
  }
});

/**
 * Get improvement suggestions
 */
router.get('/improvement-suggestions/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const targetEntityType = req.query.targetEntityType as string | undefined;

    const intelligentLearningSystem = getIntelligentLearningSystem();
    const suggestions = await intelligentLearningSystem.getImprovementSuggestions(
      modelId,
      targetEntityType
    );

    return res.json({ suggestions });
  } catch (error) {
    console.error('Error getting improvement suggestions:', error);
    return res.status(500).json({ error: 'Failed to get improvement suggestions' });
  }
});

/**
 * Get learning patterns
 */
router.get('/learning-patterns', async (req, res) => {
  try {
    const patternType = req.query.patternType as string | undefined;

    const intelligentLearningSystem = getIntelligentLearningSystem();
    const patterns = await intelligentLearningSystem.getLearningPatterns(patternType);

    return res.json({ patterns });
  } catch (error) {
    console.error('Error getting learning patterns:', error);
    return res.status(500).json({ error: 'Failed to get learning patterns' });
  }
});

export default router;

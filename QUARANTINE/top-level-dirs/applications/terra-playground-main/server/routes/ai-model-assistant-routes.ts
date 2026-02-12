/**
 * AI Model Assistant Routes
 *
 * Provides API endpoints for AI-powered model building assistance:
 * - Code template generation
 * - Formula optimization
 * - Code validation
 * - Test case generation
 */

import express from 'express';
import { z } from 'zod';
import { getAIModelAssistant } from '../services/development/ai-model-assistant';
import { assessmentModelWorkbench } from '../services/development/assessment-model-workbench';

const router = express.Router();

/**
 * Generate code template
 */
router.post('/generate-template', async (req, res) => {
  try {
    const requestSchema = z.object({
      description: z.string(),
      modelId: z.string().optional(),
      templateType: z.enum(['component', 'calculation', 'validator']).optional(),
      language: z.string().optional(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { description, modelId, templateType, language } = validationResult.data;

    // Get model context if modelId is provided
    let modelContext = undefined;

    if (modelId) {
      const model = await assessmentModelWorkbench.getModelByModelId(modelId);

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const variables = await assessmentModelWorkbench.getVariablesByModel(modelId);
      const components = await assessmentModelWorkbench.getComponentsByModel(modelId);

      modelContext = {
        variables,
        existingComponents: components,
        modelType: model.type,
      };
    }

    // Generate code template
    const aiModelAssistant = getAIModelAssistant();
    const code = await aiModelAssistant.generateCodeTemplate({
      description,
      modelContext,
      language,
      templateType,
    });

    return res.json({ code });
  } catch (error) {
    console.error('Error generating code template:', error);
    return res.status(500).json({ error: 'Failed to generate code template' });
  }
});

/**
 * Optimize formula
 */
router.post('/optimize-formula', async (req, res) => {
  try {
    const requestSchema = z.object({
      formula: z.string(),
      modelId: z.string().optional(),
      description: z.string().optional(),
      optimizationGoals: z.array(z.enum(['performance', 'readability', 'accuracy'])).optional(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { formula, modelId, description, optimizationGoals } = validationResult.data;

    // Get model context if modelId is provided
    let context = undefined;

    if (modelId) {
      const variables = await assessmentModelWorkbench.getVariablesByModel(modelId);

      context = {
        variables,
        description,
      };
    } else if (description) {
      context = { description };
    }

    // Optimize formula
    const aiModelAssistant = getAIModelAssistant();
    const result = await aiModelAssistant.optimizeFormula({
      formula,
      context,
      optimizationGoals,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error optimizing formula:', error);
    return res.status(500).json({ error: 'Failed to optimize formula' });
  }
});

/**
 * Validate code
 */
router.post('/validate-code', async (req, res) => {
  try {
    const requestSchema = z.object({
      code: z.string(),
      type: z.enum(['component', 'calculation', 'validator']),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { code, type } = validationResult.data;

    // Validate code
    const aiModelAssistant = getAIModelAssistant();
    const result = await aiModelAssistant.validateCode(code, type);

    return res.json(result);
  } catch (error) {
    console.error('Error validating code:', error);
    return res.status(500).json({ error: 'Failed to validate code' });
  }
});

/**
 * Generate test cases
 */
router.post('/generate-tests', async (req, res) => {
  try {
    const requestSchema = z.object({
      componentId: z.number().optional(),
      calculationId: z.number().optional(),
      modelId: z.string().optional(),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { componentId, calculationId, modelId } = validationResult.data;

    if (!componentId && !calculationId) {
      return res
        .status(400)
        .json({ error: 'Either componentId or calculationId must be provided' });
    }

    if (!modelId) {
      return res.status(400).json({ error: 'modelId is required' });
    }

    // Get variables
    const variables = await assessmentModelWorkbench.getVariablesByModel(modelId);

    // Get component or calculation
    let component;

    if (componentId) {
      component = await assessmentModelWorkbench.getComponentById(componentId);

      if (!component) {
        return res.status(404).json({ error: 'Component not found' });
      }
    } else if (calculationId) {
      component = await assessmentModelWorkbench.getCalculationById(calculationId);

      if (!component) {
        return res.status(404).json({ error: 'Calculation not found' });
      }
    }

    // Generate test cases
    const aiModelAssistant = getAIModelAssistant();
    const testCases = await aiModelAssistant.generateTestCases(component, variables);

    return res.json({ testCases });
  } catch (error) {
    console.error('Error generating test cases:', error);
    return res.status(500).json({ error: 'Failed to generate test cases' });
  }
});

export default router;

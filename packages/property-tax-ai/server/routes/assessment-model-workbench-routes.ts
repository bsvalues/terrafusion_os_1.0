/**
 * Assessment Model Workbench Routes
 * 
 * Provides API endpoints for managing assessment models, variables, components,
 * calculations, validation rules, test cases, and model versioning.
 */

import express from 'express';
import { z } from 'zod';
import { assessmentModelWorkbench } from '../services/development/assessment-model-workbench';
import {
  insertAssessmentModelSchema,
  insertModelVariableSchema,
  insertModelComponentSchema,
  insertModelCalculationSchema,
  insertModelValidationRuleSchema,
  insertModelTestCaseSchema,
  insertAssessmentModelVersionSchema
} from '@shared/schema';

const router = express.Router();

// Assessment Models Routes
router.get('/models', async (req, res) => {
  try {
    const models = await assessmentModelWorkbench.getAllModels();
    res.json(models);
  } catch (error) {
    console.error('Error getting assessment models:', error);
    res.status(500).json({ error: 'Failed to get assessment models' });
  }
});

router.get('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    
    // Check if modelId is a numeric ID or a UUID string
    const model = !isNaN(Number(modelId))
      ? await assessmentModelWorkbench.getModelById(Number(modelId))
      : await assessmentModelWorkbench.getModelByModelId(modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'Assessment model not found' });
    }
    
    res.json(model);
  } catch (error) {
    console.error('Error getting assessment model:', error);
    res.status(500).json({ error: 'Failed to get assessment model' });
  }
});

router.post('/models', async (req, res) => {
  try {
    const validationResult = insertAssessmentModelSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const model = await assessmentModelWorkbench.createModel(validationResult.data);
    res.status(201).json(model);
  } catch (error) {
    console.error('Error creating assessment model:', error);
    res.status(500).json({ error: 'Failed to create assessment model' });
  }
});

router.put('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const validatedData = insertAssessmentModelSchema.partial().parse(req.body);
    
    const model = await assessmentModelWorkbench.updateModel(modelId, validatedData);
    
    if (!model) {
      return res.status(404).json({ error: 'Assessment model not found' });
    }
    
    res.json(model);
  } catch (error) {
    console.error('Error updating assessment model:', error);
    res.status(500).json({ error: 'Failed to update assessment model' });
  }
});

router.delete('/models/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const result = await assessmentModelWorkbench.deleteModel(modelId);
    
    if (!result) {
      return res.status(404).json({ error: 'Assessment model not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting assessment model:', error);
    res.status(500).json({ error: 'Failed to delete assessment model' });
  }
});

// Model Types and Statuses
router.get('/model-types', (req, res) => {
  try {
    const types = assessmentModelWorkbench.getModelTypes();
    res.json(types);
  } catch (error) {
    console.error('Error getting model types:', error);
    res.status(500).json({ error: 'Failed to get model types' });
  }
});

router.get('/model-statuses', (req, res) => {
  try {
    const statuses = assessmentModelWorkbench.getModelStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error getting model statuses:', error);
    res.status(500).json({ error: 'Failed to get model statuses' });
  }
});

// Model Variables Routes
router.get('/models/:modelId/variables', async (req, res) => {
  try {
    const { modelId } = req.params;
    const variables = await assessmentModelWorkbench.getVariablesByModel(modelId);
    res.json(variables);
  } catch (error) {
    console.error('Error getting model variables:', error);
    res.status(500).json({ error: 'Failed to get model variables' });
  }
});

router.get('/variables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const variable = await assessmentModelWorkbench.getVariableById(Number(id));
    
    if (!variable) {
      return res.status(404).json({ error: 'Model variable not found' });
    }
    
    res.json(variable);
  } catch (error) {
    console.error('Error getting model variable:', error);
    res.status(500).json({ error: 'Failed to get model variable' });
  }
});

router.post('/variables', async (req, res) => {
  try {
    const validationResult = insertModelVariableSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const variable = await assessmentModelWorkbench.createVariable(validationResult.data);
    res.status(201).json(variable);
  } catch (error) {
    console.error('Error creating model variable:', error);
    res.status(500).json({ error: 'Failed to create model variable' });
  }
});

router.put('/variables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertModelVariableSchema.partial().parse(req.body);
    
    const variable = await assessmentModelWorkbench.updateVariable(Number(id), validatedData);
    
    if (!variable) {
      return res.status(404).json({ error: 'Model variable not found' });
    }
    
    res.json(variable);
  } catch (error) {
    console.error('Error updating model variable:', error);
    res.status(500).json({ error: 'Failed to update model variable' });
  }
});

router.delete('/variables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await assessmentModelWorkbench.deleteVariable(Number(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Model variable not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting model variable:', error);
    res.status(500).json({ error: 'Failed to delete model variable' });
  }
});

// Model Components Routes
router.get('/models/:modelId/components', async (req, res) => {
  try {
    const { modelId } = req.params;
    const components = await assessmentModelWorkbench.getComponentsByModel(modelId);
    res.json(components);
  } catch (error) {
    console.error('Error getting model components:', error);
    res.status(500).json({ error: 'Failed to get model components' });
  }
});

router.get('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await assessmentModelWorkbench.getComponentById(Number(id));
    
    if (!component) {
      return res.status(404).json({ error: 'Model component not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error('Error getting model component:', error);
    res.status(500).json({ error: 'Failed to get model component' });
  }
});

router.post('/components', async (req, res) => {
  try {
    const validationResult = insertModelComponentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const component = await assessmentModelWorkbench.createComponent(validationResult.data);
    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating model component:', error);
    res.status(500).json({ error: 'Failed to create model component' });
  }
});

router.put('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertModelComponentSchema.partial().parse(req.body);
    
    const component = await assessmentModelWorkbench.updateComponent(Number(id), validatedData);
    
    if (!component) {
      return res.status(404).json({ error: 'Model component not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error('Error updating model component:', error);
    res.status(500).json({ error: 'Failed to update model component' });
  }
});

router.delete('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await assessmentModelWorkbench.deleteComponent(Number(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Model component not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting model component:', error);
    res.status(500).json({ error: 'Failed to delete model component' });
  }
});

// Model Calculations Routes
router.get('/models/:modelId/calculations', async (req, res) => {
  try {
    const { modelId } = req.params;
    const calculations = await assessmentModelWorkbench.getCalculationsByModel(modelId);
    res.json(calculations);
  } catch (error) {
    console.error('Error getting model calculations:', error);
    res.status(500).json({ error: 'Failed to get model calculations' });
  }
});

router.get('/calculations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const calculation = await assessmentModelWorkbench.getCalculationById(Number(id));
    
    if (!calculation) {
      return res.status(404).json({ error: 'Model calculation not found' });
    }
    
    res.json(calculation);
  } catch (error) {
    console.error('Error getting model calculation:', error);
    res.status(500).json({ error: 'Failed to get model calculation' });
  }
});

router.post('/calculations', async (req, res) => {
  try {
    const validationResult = insertModelCalculationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const calculation = await assessmentModelWorkbench.createCalculation(validationResult.data);
    res.status(201).json(calculation);
  } catch (error) {
    console.error('Error creating model calculation:', error);
    res.status(500).json({ error: 'Failed to create model calculation' });
  }
});

router.put('/calculations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertModelCalculationSchema.partial().parse(req.body);
    
    const calculation = await assessmentModelWorkbench.updateCalculation(Number(id), validatedData);
    
    if (!calculation) {
      return res.status(404).json({ error: 'Model calculation not found' });
    }
    
    res.json(calculation);
  } catch (error) {
    console.error('Error updating model calculation:', error);
    res.status(500).json({ error: 'Failed to update model calculation' });
  }
});

router.delete('/calculations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await assessmentModelWorkbench.deleteCalculation(Number(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Model calculation not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting model calculation:', error);
    res.status(500).json({ error: 'Failed to delete model calculation' });
  }
});

// Model Validation Rules Routes
router.get('/models/:modelId/validation-rules', async (req, res) => {
  try {
    const { modelId } = req.params;
    const rules = await assessmentModelWorkbench.getValidationRulesByModel(modelId);
    res.json(rules);
  } catch (error) {
    console.error('Error getting model validation rules:', error);
    res.status(500).json({ error: 'Failed to get model validation rules' });
  }
});

router.get('/validation-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await assessmentModelWorkbench.getValidationRuleById(Number(id));
    
    if (!rule) {
      return res.status(404).json({ error: 'Model validation rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error getting model validation rule:', error);
    res.status(500).json({ error: 'Failed to get model validation rule' });
  }
});

router.post('/validation-rules', async (req, res) => {
  try {
    const validationResult = insertModelValidationRuleSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const rule = await assessmentModelWorkbench.createValidationRule(validationResult.data);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating model validation rule:', error);
    res.status(500).json({ error: 'Failed to create model validation rule' });
  }
});

router.put('/validation-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertModelValidationRuleSchema.partial().parse(req.body);
    
    const rule = await assessmentModelWorkbench.updateValidationRule(Number(id), validatedData);
    
    if (!rule) {
      return res.status(404).json({ error: 'Model validation rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error updating model validation rule:', error);
    res.status(500).json({ error: 'Failed to update model validation rule' });
  }
});

router.delete('/validation-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await assessmentModelWorkbench.deleteValidationRule(Number(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Model validation rule not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting model validation rule:', error);
    res.status(500).json({ error: 'Failed to delete model validation rule' });
  }
});

// Model Test Cases Routes
router.get('/models/:modelId/test-cases', async (req, res) => {
  try {
    const { modelId } = req.params;
    const testCases = await assessmentModelWorkbench.getTestCasesByModel(modelId);
    res.json(testCases);
  } catch (error) {
    console.error('Error getting model test cases:', error);
    res.status(500).json({ error: 'Failed to get model test cases' });
  }
});

router.get('/test-cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testCase = await assessmentModelWorkbench.getTestCaseById(Number(id));
    
    if (!testCase) {
      return res.status(404).json({ error: 'Model test case not found' });
    }
    
    res.json(testCase);
  } catch (error) {
    console.error('Error getting model test case:', error);
    res.status(500).json({ error: 'Failed to get model test case' });
  }
});

router.post('/test-cases', async (req, res) => {
  try {
    const validationResult = insertModelTestCaseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const testCase = await assessmentModelWorkbench.createTestCase(validationResult.data);
    res.status(201).json(testCase);
  } catch (error) {
    console.error('Error creating model test case:', error);
    res.status(500).json({ error: 'Failed to create model test case' });
  }
});

router.put('/test-cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertModelTestCaseSchema.partial().parse(req.body);
    
    const testCase = await assessmentModelWorkbench.updateTestCase(Number(id), validatedData);
    
    if (!testCase) {
      return res.status(404).json({ error: 'Model test case not found' });
    }
    
    res.json(testCase);
  } catch (error) {
    console.error('Error updating model test case:', error);
    res.status(500).json({ error: 'Failed to update model test case' });
  }
});

router.post('/test-cases/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const { inputData } = req.body;
    
    const testCase = await assessmentModelWorkbench.runTestCase(Number(id), inputData);
    
    if (!testCase) {
      return res.status(404).json({ error: 'Model test case not found' });
    }
    
    res.json(testCase);
  } catch (error) {
    console.error('Error running model test case:', error);
    res.status(500).json({ error: 'Failed to run model test case' });
  }
});

router.delete('/test-cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await assessmentModelWorkbench.deleteTestCase(Number(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Model test case not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting model test case:', error);
    res.status(500).json({ error: 'Failed to delete model test case' });
  }
});

// Model Versions Routes
router.get('/models/:modelId/versions', async (req, res) => {
  try {
    const { modelId } = req.params;
    const versions = await assessmentModelWorkbench.getVersionsByModel(modelId);
    res.json(versions);
  } catch (error) {
    console.error('Error getting model versions:', error);
    res.status(500).json({ error: 'Failed to get model versions' });
  }
});

router.get('/models/:modelId/versions/latest', async (req, res) => {
  try {
    const { modelId } = req.params;
    const version = await assessmentModelWorkbench.getLatestVersion(modelId);
    
    if (!version) {
      return res.status(404).json({ error: 'No versions found for this model' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error getting latest model version:', error);
    res.status(500).json({ error: 'Failed to get latest model version' });
  }
});

router.get('/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const version = await assessmentModelWorkbench.getVersionById(Number(id));
    
    if (!version) {
      return res.status(404).json({ error: 'Model version not found' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error getting model version:', error);
    res.status(500).json({ error: 'Failed to get model version' });
  }
});

router.post('/versions', async (req, res) => {
  try {
    const validationResult = insertAssessmentModelVersionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    const version = await assessmentModelWorkbench.createVersion(validationResult.data);
    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating model version:', error);
    res.status(500).json({ error: 'Failed to create model version' });
  }
});

export default router;
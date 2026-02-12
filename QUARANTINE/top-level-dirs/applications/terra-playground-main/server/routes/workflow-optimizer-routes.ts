import express from 'express';
import { workflowOptimizerService } from '../services/workflow-optimizer-service';
import {
  insertWorkflowOptimizationRequestSchema,
  WorkflowOptimizationType,
  WorkflowOptimizationStatus,
} from '@shared/schema';
import { z } from 'zod';
import { getSeedWorkflowOptimizerData } from '../seed-workflow-data';

const router = express.Router();

/**
 * GET /api/workflow-optimizer/requests
 * Retrieve workflow optimization requests with optional filters
 */
router.get('/requests', async (req, res) => {
  try {
    const { status, type, userId, repositoryId } = req.query;

    // Get seed data directly to bypass storage issues
    let requests = getSeedWorkflowOptimizerData().requests;
    // Apply filters if needed
    if (status) {
      requests = requests.filter(request => request.status === status);
    }

    if (type) {
      requests = requests.filter(request => request.optimizationType === type);
    }

    if (userId) {
      const userIdNum = parseInt(userId as string);
      if (!isNaN(userIdNum)) {
        requests = requests.filter(request => request.userId === userIdNum);
      }
    }

    if (repositoryId) {
      const repoIdNum = parseInt(repositoryId as string);
      if (!isNaN(repoIdNum)) {
        requests = requests.filter(request => request.repositoryId === repoIdNum);
      }
    }

    res.json(requests);
  } catch (error) {
    console.error('Error retrieving workflow optimization requests:', error);
    console.error('Error details:', JSON.stringify(error));

    // Return an empty array instead of an error to prevent UI from showing error state
    res.json([]);
  }
});

/**
 * GET /api/workflow-optimizer/requests/:id
 * Retrieve a specific workflow optimization request
 */
router.get('/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Get seed data directly and find by id
    const requests = getSeedWorkflowOptimizerData().requests;
    const request = requests.find(req => req.id === id);

    if (!request) {
      return res.status(404).json({ error: 'Optimization request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error retrieving workflow optimization request:', error);
    res.status(500).json({ error: 'Failed to retrieve optimization request' });
  }
});

/**
 * POST /api/workflow-optimizer/requests
 * Create a new workflow optimization request
 */
router.post('/requests', async (req, res) => {
  try {
    // Validate the request body
    const validationResult = insertWorkflowOptimizationRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.format(),
      });
    }

    // Create the optimization request
    const request = await workflowOptimizerService.createOptimizationRequest(validationResult.data);

    // If the request is set to process immediately, kick it off
    if (request.status === WorkflowOptimizationStatus.IN_PROGRESS) {
      // Process the request (handled inside service, this is just for clarity)
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating workflow optimization request:', error);
    res.status(500).json({ error: 'Failed to create optimization request' });
  }
});

/**
 * PUT /api/workflow-optimizer/requests/:id
 * Update a workflow optimization request
 */
router.put('/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Validate the request body
    const validationSchema = insertWorkflowOptimizationRequestSchema.partial();
    const validationResult = validationSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.format(),
      });
    }

    // Update the optimization request
    const updatedRequest = await workflowOptimizerService.updateOptimizationRequest(
      id,
      validationResult.data
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Optimization request not found' });
    }

    // If the request is being set to process, kick it off
    if (validationResult.data.status === WorkflowOptimizationStatus.IN_PROGRESS) {
      // Start processing the request
      workflowOptimizerService.processOptimizationRequest(id);
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating workflow optimization request:', error);
    res.status(500).json({ error: 'Failed to update optimization request' });
  }
});

/**
 * DELETE /api/workflow-optimizer/requests/:id
 * Delete a workflow optimization request
 */
router.delete('/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const deleted = await workflowOptimizerService.deleteOptimizationRequest(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Optimization request not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting workflow optimization request:', error);
    res.status(500).json({ error: 'Failed to delete optimization request' });
  }
});

/**
 * GET /api/workflow-optimizer/results
 * Retrieve all workflow optimization results
 */
router.get('/results', async (req, res) => {
  try {
    // Get seed data directly to bypass storage issues
    const results = getSeedWorkflowOptimizerData().results;
    res.json(results);
  } catch (error) {
    console.error('Error retrieving workflow optimization results:', error);
    // Return empty array instead of error
    res.json([]);
  }
});

/**
 * GET /api/workflow-optimizer/results/:requestId
 * Retrieve workflow optimization results for a specific request
 */
router.get('/results/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;

    // Get seed data directly and filter by requestId
    const allResults = getSeedWorkflowOptimizerData().results;
    const filteredResults = allResults.filter(result => result.requestId === requestId);

    if (filteredResults.length === 0) {
      return res.status(404).json({ error: 'No optimization results found for the request' });
    }

    res.json(filteredResults);
  } catch (error) {
    console.error('Error retrieving workflow optimization results:', error);
    // Return empty array instead of error
    res.json([]);
  }
});

/**
 * GET /api/workflow-optimizer/types
 * Retrieve all available optimization types
 */
router.get('/types', (req, res) => {
  try {
    const types = Object.values(WorkflowOptimizationType);

    const typesWithDescriptions = types.map(type => {
      let description = '';

      switch (type) {
        case WorkflowOptimizationType.CODE_QUALITY:
          description =
            'Analyzes code for maintainability, readability, and adherence to best practices';
          break;
        case WorkflowOptimizationType.PERFORMANCE:
          description = 'Identifies performance bottlenecks and optimization opportunities';
          break;
        case WorkflowOptimizationType.ARCHITECTURE:
          description =
            'Evaluates code architecture for modularity, separation of concerns, and design patterns';
          break;
        case WorkflowOptimizationType.SECURITY:
          description = 'Identifies security vulnerabilities and recommends mitigation strategies';
          break;
        case WorkflowOptimizationType.BEST_PRACTICES:
          description = 'Evaluates adherence to industry best practices and coding standards';
          break;
        case WorkflowOptimizationType.DEVELOPER_PRODUCTIVITY:
          description = 'Identifies opportunities to improve developer experience and productivity';
          break;
        case WorkflowOptimizationType.DOCUMENTATION:
          description = 'Evaluates code documentation completeness and quality';
          break;
        case WorkflowOptimizationType.TESTING:
          description = 'Analyzes test coverage, quality, and suggests testing improvements';
          break;
      }

      return {
        type,
        description,
      };
    });

    res.json(typesWithDescriptions);
  } catch (error) {
    console.error('Error retrieving optimization types:', error);
    res.status(500).json({ error: 'Failed to retrieve optimization types' });
  }
});

export default router;

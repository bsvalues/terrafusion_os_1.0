import { Router, Response, NextFunction } from 'express';
import { personalizedAgentService } from '../services/personalized-agents/personalized-agent-service';
import { z } from 'zod';
import { insertPersonalizedDeveloperAgentSchema } from '@shared/schema';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

/**
 * Get all personalized agents for the current user
 */
router.get('/api/personalized-agents', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const agents = await personalizedAgentService.getUserAgents(req.user!.userId);
    res.json(agents);
  } catch (error) {
    console.error('Error fetching personalized agents:', error);
    res.status(500).json({ error: 'Failed to fetch personalized agents' });
  }
});

/**
 * Get shared personalized agents
 */
router.get('/api/personalized-agents/shared', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const agents = await personalizedAgentService.getSharedAgents();
    res.json(agents);
  } catch (error) {
    console.error('Error fetching shared personalized agents:', error);
    res.status(500).json({ error: 'Failed to fetch shared personalized agents' });
  }
});

/**
 * Get a personalized agent by ID
 */
router.get('/api/personalized-agents/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const agent = await personalizedAgentService.getAgentById(id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check if user is authorized to access this agent
    if (agent.userId !== req.user!.userId && !agent.isShared) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error fetching personalized agent:', error);
    res.status(500).json({ error: 'Failed to fetch personalized agent' });
  }
});

/**
 * Create a new personalized agent
 */
router.post('/api/personalized-agents', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Validate the request body
    const validatedData = insertPersonalizedDeveloperAgentSchema.parse({
      ...req.body,
      userId: req.user!.userId,
    });

    // Check if agent with this name already exists for this user
    const existing = await personalizedAgentService.getAgentByName(
      validatedData.name,
      req.user!.userId
    );
    if (existing) {
      return res.status(400).json({ error: 'An agent with this name already exists' });
    }

    const result = await personalizedAgentService.createAgent(validatedData);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating personalized agent:', error);
    res.status(500).json({ error: 'Failed to create personalized agent' });
  }
});

/**
 * Update an existing personalized agent
 */
router.put('/api/personalized-agents/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    // Check if agent exists and belongs to the user
    const existing = await personalizedAgentService.getAgentById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (existing.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate the request body
    const validationSchema = insertPersonalizedDeveloperAgentSchema.partial();
    const validatedData = validationSchema.parse(req.body);

    // Update the agent
    const result = await personalizedAgentService.updateAgent(id, req.user!.userId, validatedData);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating personalized agent:', error);
    res.status(500).json({ error: 'Failed to update personalized agent' });
  }
});

/**
 * Delete a personalized agent
 */
router.delete('/api/personalized-agents/:id', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const success = await personalizedAgentService.deleteAgent(id, req.user!.userId);

    if (!success) {
      return res
        .status(404)
        .json({ error: "Agent not found or you don't have permission to delete it" });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting personalized agent:', error);
    res.status(500).json({ error: 'Failed to delete personalized agent' });
  }
});

/**
 * Increment usage count for an agent
 */
router.post(
  '/api/personalized-agents/:id/use',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }

      const agent = await personalizedAgentService.getAgentById(id);

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if user is authorized to use this agent
      if (agent.userId !== req.user!.userId && !agent.isShared) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedAgent = await personalizedAgentService.incrementUsageCount(id);
      res.json(updatedAgent);
    } catch (error) {
      console.error('Error incrementing agent usage count:', error);
      res.status(500).json({ error: 'Failed to increment agent usage count' });
    }
  }
);

export default router;

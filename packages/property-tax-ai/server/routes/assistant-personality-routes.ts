/**
 * AI Assistant Personality Routes
 * 
 * This file defines the API routes for managing AI assistant personalities,
 * allowing users to create, update, and customize assistant interactions.
 */

import { Request, Response, Router } from 'express';
import { assistantPersonalityService } from '../services/assistant-personality-service';
import { 
  insertAssistantPersonalitySchema, 
  insertPersonalityTemplateSchema,
  InsertAssistantPersonality
} from '@shared/schema';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all personality templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await assistantPersonalityService.getPersonalityTemplates();
    res.json(templates);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error retrieving personality templates - ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve personality templates' });
  }
});

/**
 * Get all personalities accessible to the current user
 */
router.get('/personalities', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const personalities = await assistantPersonalityService.getPersonalitiesForUser(userId);
    res.json(personalities);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error retrieving personalities - ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve personalities' });
  }
});

/**
 * Get the default personality for the current user
 */
router.get('/personalities/default', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const defaultPersonality = await assistantPersonalityService.getDefaultPersonalityForUser(userId);
    
    if (!defaultPersonality) {
      return res.status(404).json({ error: 'No default personality found' });
    }
    
    res.json(defaultPersonality);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error retrieving default personality - ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve default personality' });
  }
});

/**
 * Get a specific personality by ID
 */
router.get('/personalities/:id', async (req: Request, res: Response) => {
  try {
    const personalityId = parseInt(req.params.id);
    
    if (isNaN(personalityId)) {
      return res.status(400).json({ error: 'Invalid personality ID' });
    }
    
    const personality = await assistantPersonalityService.getPersonalityById(personalityId);
    
    if (!personality) {
      return res.status(404).json({ error: 'Personality not found' });
    }
    
    // Check if the user has access to this personality
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    if (personality.userId !== userId && !personality.isPublic) {
      return res.status(403).json({ error: 'You do not have permission to access this personality' });
    }
    
    res.json(personality);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error retrieving personality ID: ${req.params.id} - ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve personality' });
  }
});

/**
 * Create a new personality
 */
router.post('/personalities', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const result = insertAssistantPersonalitySchema.safeParse({
      ...req.body,
      userId
    });

    if (!result.success) {
      return res.status(400).json({ error: 'Invalid personality data', details: result.error.format() });
    }

    const personalityData = result.data as InsertAssistantPersonality;
    const newPersonality = await assistantPersonalityService.createPersonality(personalityData);
    
    res.status(201).json(newPersonality);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error creating personality - ${error.message}`);
    res.status(500).json({ error: 'Failed to create personality' });
  }
});

/**
 * Create a personality from a template
 */
router.post('/personalities/from-template/:templateId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const templateId = parseInt(req.params.templateId);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    const customData = req.body || {};
    
    const newPersonality = await assistantPersonalityService.createPersonalityFromTemplate(
      templateId,
      userId,
      customData
    );
    
    res.status(201).json(newPersonality);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error creating personality from template ID: ${req.params.templateId} - ${error.message}`);
    res.status(500).json({ error: 'Failed to create personality from template' });
  }
});

/**
 * Update an existing personality
 */
router.put('/personalities/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const personalityId = parseInt(req.params.id);
    
    if (isNaN(personalityId)) {
      return res.status(400).json({ error: 'Invalid personality ID' });
    }
    
    const updatedPersonality = await assistantPersonalityService.updatePersonality(
      personalityId,
      userId,
      req.body
    );
    
    res.json(updatedPersonality);
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error updating personality ID: ${req.params.id} - ${error.message}`);
    
    if (error.message?.includes('not found') || error.message?.includes('permission')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update personality' });
  }
});

/**
 * Delete a personality
 */
router.delete('/personalities/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const personalityId = parseInt(req.params.id);
    
    if (isNaN(personalityId)) {
      return res.status(400).json({ error: 'Invalid personality ID' });
    }
    
    await assistantPersonalityService.deletePersonality(personalityId, userId);
    
    res.status(204).send();
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error deleting personality ID: ${req.params.id} - ${error.message}`);
    
    if (error.message?.includes('not found') || error.message?.includes('permission')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to delete personality' });
  }
});

/**
 * Set a personality as the default for the current user
 */
router.post('/personalities/:id/set-default', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const personalityId = parseInt(req.params.id);
    
    if (isNaN(personalityId)) {
      return res.status(400).json({ error: 'Invalid personality ID' });
    }
    
    await assistantPersonalityService.setDefaultPersonality(personalityId, userId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`AssistantPersonalityRoutes: Error setting default personality ID: ${req.params.id} - ${error.message}`);
    
    if (error.message?.includes('not found') || error.message?.includes('permission')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to set default personality' });
  }
});

export default router;
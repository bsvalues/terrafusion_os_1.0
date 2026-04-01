/**
 * Voice Command Help Routes
 * 
 * API endpoints for managing voice command help content:
 * - Creating help content
 * - Updating help content
 * - Deleting help content
 * - Getting contextual help
 */

import { Router } from 'express';
import { z } from 'zod';
import { voiceCommandHelpService } from '../services/voice-command/voice-command-help-service';
import { insertVoiceCommandHelpContentSchema, VoiceCommandType } from '@shared/schema';

const router = Router();

// Create help content validation schema
const createHelpContentSchema = insertVoiceCommandHelpContentSchema.extend({
  // Add any additional validation
});

// Update help content validation schema
const updateHelpContentSchema = z.object({
  commandType: z.enum([
    VoiceCommandType.NAVIGATION,
    VoiceCommandType.DATA_QUERY,
    VoiceCommandType.PROPERTY_ASSESSMENT,
    VoiceCommandType.WORKFLOW,
    VoiceCommandType.SYSTEM,
    VoiceCommandType.CUSTOM
  ]).optional(),
  contextId: z.string().nullable().optional(),
  title: z.string().optional(),
  examplePhrases: z.array(z.string()).optional(),
  description: z.string().optional(),
  parameters: z.any().optional(),
  responseExample: z.string().optional(),
  priority: z.number().int().min(0).optional(),
  isHidden: z.boolean().optional()
});

/**
 * Create new help content
 * 
 * POST /api/voice-command/help
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validationResult = createHelpContentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid help content data',
        details: validationResult.error.format()
      });
    }
    
    const helpData = validationResult.data;
    
    // Create the help content
    const helpContent = await voiceCommandHelpService.createHelpContent(helpData);
    
    return res.status(201).json(helpContent);
  } catch (error) {
    console.error('Error creating help content:', error);
    return res.status(500).json({ error: 'Failed to create help content' });
  }
});

/**
 * Update existing help content
 * 
 * PATCH /api/voice-command/help/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const helpId = parseInt(req.params.id);
    
    if (isNaN(helpId)) {
      return res.status(400).json({ error: 'Invalid help content ID' });
    }
    
    // Validate request body
    const validationResult = updateHelpContentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid help content data',
        details: validationResult.error.format()
      });
    }
    
    const helpData = validationResult.data;
    
    // Check if help content exists
    const existingHelp = await voiceCommandHelpService.getHelpContentById(helpId);
    
    if (!existingHelp) {
      return res.status(404).json({ error: 'Help content not found' });
    }
    
    // Update the help content
    const updatedHelp = await voiceCommandHelpService.updateHelpContent(helpId, helpData);
    
    return res.json(updatedHelp);
  } catch (error) {
    console.error('Error updating help content:', error);
    return res.status(500).json({ error: 'Failed to update help content' });
  }
});

/**
 * Delete help content
 * 
 * DELETE /api/voice-command/help/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const helpId = parseInt(req.params.id);
    
    if (isNaN(helpId)) {
      return res.status(400).json({ error: 'Invalid help content ID' });
    }
    
    // Check if help content exists
    const existingHelp = await voiceCommandHelpService.getHelpContentById(helpId);
    
    if (!existingHelp) {
      return res.status(404).json({ error: 'Help content not found' });
    }
    
    // Delete the help content
    await voiceCommandHelpService.deleteHelpContent(helpId);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting help content:', error);
    return res.status(500).json({ error: 'Failed to delete help content' });
  }
});

/**
 * Get help content by ID
 * 
 * GET /api/voice-command/help/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const helpId = parseInt(req.params.id);
    
    if (isNaN(helpId)) {
      return res.status(400).json({ error: 'Invalid help content ID' });
    }
    
    const helpContent = await voiceCommandHelpService.getHelpContentById(helpId);
    
    if (!helpContent) {
      return res.status(404).json({ error: 'Help content not found' });
    }
    
    return res.json(helpContent);
  } catch (error) {
    console.error('Error getting help content:', error);
    return res.status(500).json({ error: 'Failed to retrieve help content' });
  }
});

/**
 * Get all help content
 * 
 * GET /api/voice-command/help
 */
router.get('/', async (req, res) => {
  try {
    // Check if hidden content should be included
    const includeHidden = req.query.includeHidden === 'true';
    
    const helpContent = await voiceCommandHelpService.getAllHelpContent(includeHidden);
    
    return res.json(helpContent);
  } catch (error) {
    console.error('Error getting all help content:', error);
    return res.status(500).json({ error: 'Failed to retrieve help content' });
  }
});

/**
 * Get help content by command type
 * 
 * GET /api/voice-command/help/type/:commandType
 */
router.get('/type/:commandType', async (req, res) => {
  try {
    const commandType = req.params.commandType as VoiceCommandType;
    
    // Validate command type
    if (!Object.values(VoiceCommandType).includes(commandType)) {
      return res.status(400).json({ error: 'Invalid command type' });
    }
    
    // Check if hidden content should be included
    const includeHidden = req.query.includeHidden === 'true';
    
    const helpContent = await voiceCommandHelpService.getHelpContentByCommandType(commandType, includeHidden);
    
    return res.json(helpContent);
  } catch (error) {
    console.error('Error getting help content by type:', error);
    return res.status(500).json({ error: 'Failed to retrieve help content' });
  }
});

/**
 * Get contextual help
 * 
 * GET /api/voice-command/help/context/:contextId
 */
router.get('/context/:contextId', async (req, res) => {
  try {
    const contextId = req.params.contextId;
    
    // Check if hidden content should be included
    const includeHidden = req.query.includeHidden === 'true';
    
    const helpContent = await voiceCommandHelpService.getContextualHelp(contextId, includeHidden);
    
    return res.json(helpContent);
  } catch (error) {
    console.error('Error getting contextual help:', error);
    return res.status(500).json({ error: 'Failed to retrieve contextual help' });
  }
});

/**
 * Search for help content
 * 
 * GET /api/voice-command/help/search
 */
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }
    
    // Check if hidden content should be included
    const includeHidden = req.query.includeHidden === 'true';
    
    const helpContent = await voiceCommandHelpService.searchHelpContent(searchTerm, includeHidden);
    
    return res.json(helpContent);
  } catch (error) {
    console.error('Error searching help content:', error);
    return res.status(500).json({ error: 'Failed to search help content' });
  }
});

/**
 * Initialize default help content
 * 
 * POST /api/voice-command/help/initialize-defaults
 */
router.post('/initialize-defaults', async (req, res) => {
  try {
    await voiceCommandHelpService.initializeDefaultHelpContent();
    
    // Get all help content
    const helpContent = await voiceCommandHelpService.getAllHelpContent(true);
    
    return res.status(201).json({
      message: 'Default help content initialized successfully',
      count: helpContent.length,
      helpContent
    });
  } catch (error) {
    console.error('Error initializing default help content:', error);
    return res.status(500).json({ error: 'Failed to initialize default help content' });
  }
});

export default router;
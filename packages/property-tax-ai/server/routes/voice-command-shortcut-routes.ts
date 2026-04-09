/**
 * Voice Command Shortcut Routes
 * 
 * API endpoints for managing voice command shortcuts:
 * - Creating shortcuts
 * - Updating shortcuts
 * - Deleting shortcuts
 * - Getting shortcuts
 */

import { Router } from 'express';
import { z } from 'zod';
import { voiceCommandShortcutService } from '../services/voice-command/voice-command-shortcut-service';
import { insertVoiceCommandShortcutSchema, VoiceCommandType } from '@shared/schema';

const router = Router();

// Create shortcut validation schema
const createShortcutSchema = insertVoiceCommandShortcutSchema.extend({
  // Add any additional validation
});

// Update shortcut validation schema
const updateShortcutSchema = z.object({
  shortcutPhrase: z.string().optional(),
  expandedCommand: z.string().optional(),
  commandType: z.enum([
    VoiceCommandType.NAVIGATION,
    VoiceCommandType.DATA_QUERY,
    VoiceCommandType.PROPERTY_ASSESSMENT,
    VoiceCommandType.WORKFLOW,
    VoiceCommandType.SYSTEM,
    VoiceCommandType.CUSTOM
  ]).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(0).optional(),
  isEnabled: z.boolean().optional(),
  isGlobal: z.boolean().optional()
});

/**
 * Create a new voice command shortcut
 * 
 * POST /api/voice-command/shortcuts
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validationResult = createShortcutSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid shortcut data',
        details: validationResult.error.format()
      });
    }
    
    const shortcutData = validationResult.data;
    
    // Create the shortcut
    const shortcut = await voiceCommandShortcutService.createShortcut(shortcutData);
    
    return res.status(201).json(shortcut);
  } catch (error) {
    console.error('Error creating shortcut:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to create shortcut' });
  }
});

/**
 * Update an existing voice command shortcut
 * 
 * PATCH /api/voice-command/shortcuts/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const shortcutId = parseInt(req.params.id);
    
    if (isNaN(shortcutId)) {
      return res.status(400).json({ error: 'Invalid shortcut ID' });
    }
    
    // Validate request body
    const validationResult = updateShortcutSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid shortcut data',
        details: validationResult.error.format()
      });
    }
    
    const shortcutData = validationResult.data;
    
    // Check if shortcut exists
    const existingShortcut = await voiceCommandShortcutService.getShortcutById(shortcutId);
    
    if (!existingShortcut) {
      return res.status(404).json({ error: 'Shortcut not found' });
    }
    
    // Update the shortcut
    const updatedShortcut = await voiceCommandShortcutService.updateShortcut(shortcutId, shortcutData);
    
    return res.json(updatedShortcut);
  } catch (error) {
    console.error('Error updating shortcut:', error);
    
    // Handle unique constraint violation
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to update shortcut' });
  }
});

/**
 * Delete a voice command shortcut
 * 
 * DELETE /api/voice-command/shortcuts/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const shortcutId = parseInt(req.params.id);
    
    if (isNaN(shortcutId)) {
      return res.status(400).json({ error: 'Invalid shortcut ID' });
    }
    
    // Check if shortcut exists
    const existingShortcut = await voiceCommandShortcutService.getShortcutById(shortcutId);
    
    if (!existingShortcut) {
      return res.status(404).json({ error: 'Shortcut not found' });
    }
    
    // Delete the shortcut
    await voiceCommandShortcutService.deleteShortcut(shortcutId);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting shortcut:', error);
    return res.status(500).json({ error: 'Failed to delete shortcut' });
  }
});

/**
 * Get all shortcuts for a user
 * 
 * GET /api/voice-command/shortcuts/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const shortcuts = await voiceCommandShortcutService.getUserShortcuts(userId);
    
    return res.json(shortcuts);
  } catch (error) {
    console.error('Error getting user shortcuts:', error);
    return res.status(500).json({ error: 'Failed to retrieve shortcuts' });
  }
});

/**
 * Get all global shortcuts
 * 
 * GET /api/voice-command/shortcuts/global
 */
router.get('/global', async (req, res) => {
  try {
    const shortcuts = await voiceCommandShortcutService.getGlobalShortcuts();
    
    return res.json(shortcuts);
  } catch (error) {
    console.error('Error getting global shortcuts:', error);
    return res.status(500).json({ error: 'Failed to retrieve global shortcuts' });
  }
});

/**
 * Get all available shortcuts for a user (personal + global)
 * 
 * GET /api/voice-command/shortcuts/available/:userId
 */
router.get('/available/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const shortcuts = await voiceCommandShortcutService.getAllAvailableShortcuts(userId);
    
    return res.json(shortcuts);
  } catch (error) {
    console.error('Error getting available shortcuts:', error);
    return res.status(500).json({ error: 'Failed to retrieve shortcuts' });
  }
});

/**
 * Get shortcut usage statistics for a user
 * 
 * GET /api/voice-command/shortcuts/stats/:userId
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const stats = await voiceCommandShortcutService.getShortcutUsageStats(userId);
    
    return res.json(stats);
  } catch (error) {
    console.error('Error getting shortcut usage stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve shortcut statistics' });
  }
});

/**
 * Create default shortcuts for a user
 * 
 * POST /api/voice-command/shortcuts/defaults/:userId
 */
router.post('/defaults/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    await voiceCommandShortcutService.createDefaultShortcutsForUser(userId);
    
    // Get the created shortcuts
    const shortcuts = await voiceCommandShortcutService.getUserShortcuts(userId);
    
    return res.status(201).json(shortcuts);
  } catch (error) {
    console.error('Error creating default shortcuts:', error);
    return res.status(500).json({ error: 'Failed to create default shortcuts' });
  }
});

export default router;
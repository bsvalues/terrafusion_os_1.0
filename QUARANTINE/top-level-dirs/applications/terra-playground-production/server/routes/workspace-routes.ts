import { Router, Response, NextFunction } from 'express';
import { workspacePreferencesService } from '../services/workspace-customization/workspace-preferences-service';
import { z } from 'zod';
import { insertWorkspacePreferenceSchema } from '@shared/schema';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

/**
 * Get workspace preferences for the current user
 */
router.get('/api/workspace/preferences', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const preferences = await workspacePreferencesService.getOrCreatePreferences(req.user!.userId);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching workspace preferences:', error);
    res.status(500).json({ error: 'Failed to fetch workspace preferences' });
  }
});

/**
 * Update workspace preferences for the current user
 */
router.post('/api/workspace/preferences', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Validate the request body against a partial schema
    const validationSchema = insertWorkspacePreferenceSchema.partial();
    const validatedData = validationSchema.parse(req.body);

    const existing = await workspacePreferencesService.getUserPreferences(req.user!.userId);

    let result;
    if (existing) {
      // Update existing preferences
      result = await workspacePreferencesService.updatePreferences(req.user!.userId, validatedData);
    } else {
      // Create new preferences with provided values and defaults
      result = await workspacePreferencesService.createPreferences({
        userId: req.user!.userId,
        ...validatedData,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating workspace preferences:', error);
    res.status(500).json({ error: 'Failed to update workspace preferences' });
  }
});

/**
 * Reset workspace preferences to defaults
 */
router.post(
  '/api/workspace/preferences/reset',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const result = await workspacePreferencesService.resetToDefaults(req.user!.userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error resetting workspace preferences:', error);
      res.status(500).json({ error: 'Failed to reset workspace preferences' });
    }
  }
);

export default router;

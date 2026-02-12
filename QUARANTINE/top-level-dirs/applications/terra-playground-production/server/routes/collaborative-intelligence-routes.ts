/**
 * Collaborative Intelligence Routes
 *
 * Provides API endpoints for real-time collaboration features:
 * - Team workspaces and access controls
 * - Activity feeds and model changes
 * - Comments and suggestions
 */

import express from 'express';
import { z } from 'zod';
import { getCollaborativeIntelligence } from '../services/development/collaborative-intelligence';

const router = express.Router();

/**
 * Get active users
 */
router.get('/active-users', async (req, res) => {
  try {
    const collaborativeIntelligence = getCollaborativeIntelligence();
    const users = await collaborativeIntelligence.getActiveUsers();

    return res.json(users);
  } catch (error) {
    console.error('Error getting active users:', error);
    return res.status(500).json({ error: 'Failed to get active users' });
  }
});

/**
 * Get recent activity events
 */
router.get('/activity/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const events = await collaborativeIntelligence.getRecentActivityEvents(
      parseInt(workspaceId),
      limit
    );

    return res.json(events);
  } catch (error) {
    console.error('Error getting activity events:', error);
    return res.status(500).json({ error: 'Failed to get activity events' });
  }
});

/**
 * Get model changes
 */
router.get('/changes/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const changes = await collaborativeIntelligence.getModelChanges(modelId, limit);

    return res.json(changes);
  } catch (error) {
    console.error('Error getting model changes:', error);
    return res.status(500).json({ error: 'Failed to get model changes' });
  }
});

/**
 * Get comments for a model
 */
router.get('/comments/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const comments = await collaborativeIntelligence.getModelComments(
      modelId,
      entityType,
      entityId
    );

    return res.json(comments);
  } catch (error) {
    console.error('Error getting comments:', error);
    return res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * Get collaboration suggestions
 */
router.get('/suggestions/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const modelId = req.query.modelId as string | undefined;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const suggestions = await collaborativeIntelligence.getCollaborationSuggestions(
      parseInt(workspaceId),
      modelId
    );

    return res.json(suggestions);
  } catch (error) {
    console.error('Error getting collaboration suggestions:', error);
    return res.status(500).json({ error: 'Failed to get collaboration suggestions' });
  }
});

/**
 * Create a new workspace
 */
router.post('/workspaces', async (req, res) => {
  try {
    const requestSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      modelIds: z.array(z.string()),
      members: z.array(
        z.object({
          memberId: z.number(),
          role: z.enum(['owner', 'editor', 'viewer']),
        })
      ),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const workspaceData = validationResult.data;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const workspace = await collaborativeIntelligence.createWorkspace(workspaceData);

    return res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return res.status(500).json({ error: 'Failed to create workspace' });
  }
});

/**
 * Get workspaces for a user
 */
router.get('/workspaces/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const workspaces = await collaborativeIntelligence.getUserWorkspaces(parseInt(userId));

    return res.json(workspaces);
  } catch (error) {
    console.error('Error getting user workspaces:', error);
    return res.status(500).json({ error: 'Failed to get user workspaces' });
  }
});

/**
 * Get workspace members
 */
router.get('/workspaces/:workspaceId/members', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    const members = await collaborativeIntelligence.getWorkspaceMembers(parseInt(workspaceId));

    return res.json(members);
  } catch (error) {
    console.error('Error getting workspace members:', error);
    return res.status(500).json({ error: 'Failed to get workspace members' });
  }
});

/**
 * Add a member to a workspace
 */
router.post('/workspaces/:workspaceId/members', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const requestSchema = z.object({
      memberId: z.number(),
      role: z.enum(['owner', 'editor', 'viewer']),
    });

    const validationResult = requestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { memberId, role } = validationResult.data;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    await collaborativeIntelligence.addWorkspaceMember(parseInt(workspaceId), memberId, role);

    return res.sendStatus(204);
  } catch (error) {
    console.error('Error adding workspace member:', error);
    return res.status(500).json({ error: 'Failed to add workspace member' });
  }
});

/**
 * Remove a member from a workspace
 */
router.delete('/workspaces/:workspaceId/members/:memberId', async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;

    const collaborativeIntelligence = getCollaborativeIntelligence();
    await collaborativeIntelligence.removeWorkspaceMember(
      parseInt(workspaceId),
      parseInt(memberId)
    );

    return res.sendStatus(204);
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return res.status(500).json({ error: 'Failed to remove workspace member' });
  }
});

export default router;

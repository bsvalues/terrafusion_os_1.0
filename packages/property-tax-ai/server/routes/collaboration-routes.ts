import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import {
  insertSharedWorkflowSchema,
  insertSharedWorkflowCollaboratorSchema,
  insertSharedWorkflowActivitySchema,
  insertWorkflowSessionSchema,
  CollaborationRole
} from '../../shared/schema';
import z from 'zod';

const router = express.Router();

// Create a new shared workflow
router.post('/shared-workflows', async (req: Request, res: Response) => {
  try {
    const validatedData = insertSharedWorkflowSchema.parse(req.body);
    const sharedWorkflow = await storage.createSharedWorkflow(validatedData);
    
    res.status(201).json(sharedWorkflow);
  } catch (error) {
    console.error('Error creating shared workflow:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to create shared workflow' });
  }
});

// Get a shared workflow by ID
router.get('/shared-workflows/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const sharedWorkflow = await storage.getSharedWorkflowById(id);
    
    if (!sharedWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    res.json(sharedWorkflow);
  } catch (error) {
    console.error('Error retrieving shared workflow:', error);
    res.status(500).json({ error: 'Failed to retrieve shared workflow' });
  }
});

// Get a shared workflow by share code
router.get('/shared-workflows/code/:shareCode', async (req: Request, res: Response) => {
  try {
    const shareCode = req.params.shareCode;
    
    const sharedWorkflow = await storage.getSharedWorkflowByShareCode(shareCode);
    
    if (!sharedWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    // Increment view count
    if (sharedWorkflow) {
      await storage.updateSharedWorkflow(sharedWorkflow.id, {
        viewCount: sharedWorkflow.viewCount + 1,
        lastViewed: new Date()
      });
    }
    
    res.json(sharedWorkflow);
  } catch (error) {
    console.error('Error retrieving shared workflow by share code:', error);
    res.status(500).json({ error: 'Failed to retrieve shared workflow' });
  }
});

// Get shared workflows by user ID
router.get('/users/:userId/shared-workflows', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const sharedWorkflows = await storage.getSharedWorkflowsByUser(userId);
    res.json(sharedWorkflows);
  } catch (error) {
    console.error('Error retrieving user shared workflows:', error);
    res.status(500).json({ error: 'Failed to retrieve shared workflows' });
  }
});

// Get workflows shared with user (as collaborator)
router.get('/users/:userId/collaborated-workflows', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const collaborations = await storage.getCollaboratorsByUserId(userId);
    
    // Fetch the actual workflow details for each collaboration
    const workflowPromises = collaborations.map(collab => 
      storage.getSharedWorkflowById(collab.sharedWorkflowId)
    );
    
    const workflows = await Promise.all(workflowPromises);
    
    // Filter out any null results (workflows that might have been deleted)
    const validWorkflows = workflows.filter(wf => wf !== null);
    
    res.json(validWorkflows);
  } catch (error) {
    console.error('Error retrieving user collaborated workflows:', error);
    res.status(500).json({ error: 'Failed to retrieve collaborated workflows' });
  }
});

// Get public shared workflows
router.get('/shared-workflows/public', async (req: Request, res: Response) => {
  try {
    const publicWorkflows = await storage.getPublicSharedWorkflows();
    res.json(publicWorkflows);
  } catch (error) {
    console.error('Error retrieving public shared workflows:', error);
    res.status(500).json({ error: 'Failed to retrieve public shared workflows' });
  }
});

// Update a shared workflow
router.patch('/shared-workflows/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(id);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    // Validate incoming data (partial validation)
    const updateSchema = insertSharedWorkflowSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    const updatedWorkflow = await storage.updateSharedWorkflow(id, validatedData);
    
    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Error updating shared workflow:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to update shared workflow' });
  }
});

// Delete a shared workflow
router.delete('/shared-workflows/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const deleted = await storage.deleteSharedWorkflow(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shared workflow:', error);
    res.status(500).json({ error: 'Failed to delete shared workflow' });
  }
});

// Add a collaborator to a shared workflow
router.post('/shared-workflows/:id/collaborators', async (req: Request, res: Response) => {
  try {
    const sharedWorkflowId = parseInt(req.params.id);
    
    if (isNaN(sharedWorkflowId)) {
      return res.status(400).json({ error: 'Invalid shared workflow ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(sharedWorkflowId);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    // Add the workflow ID to the request body
    const collaboratorData = {
      ...req.body,
      sharedWorkflowId
    };
    
    const validatedData = insertSharedWorkflowCollaboratorSchema.parse(collaboratorData);
    const collaborator = await storage.addCollaborator(validatedData);
    
    // Log the activity
    await storage.logWorkflowActivity({
      sharedWorkflowId,
      userId: req.body.invitedBy || 0,
      activityType: 'collaborator_added',
      details: {
        collaboratorId: collaborator.id,
        userId: collaborator.userId,
        role: collaborator.role
      }
    });
    
    res.status(201).json(collaborator);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Get collaborators for a shared workflow
router.get('/shared-workflows/:id/collaborators', async (req: Request, res: Response) => {
  try {
    const sharedWorkflowId = parseInt(req.params.id);
    
    if (isNaN(sharedWorkflowId)) {
      return res.status(400).json({ error: 'Invalid shared workflow ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(sharedWorkflowId);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    const collaborators = await storage.getCollaboratorsByWorkflowId(sharedWorkflowId);
    res.json(collaborators);
  } catch (error) {
    console.error('Error retrieving collaborators:', error);
    res.status(500).json({ error: 'Failed to retrieve collaborators' });
  }
});

// Update a collaborator's role
router.patch('/shared-workflows/collaborators/:id/role', async (req: Request, res: Response) => {
  try {
    const collaboratorId = parseInt(req.params.id);
    
    if (isNaN(collaboratorId)) {
      return res.status(400).json({ error: 'Invalid collaborator ID format' });
    }
    
    const { role } = req.body;
    
    if (!role || !Object.values(CollaborationRole).includes(role as CollaborationRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const updatedCollaborator = await storage.updateCollaboratorRole(collaboratorId, role as CollaborationRole);
    
    if (!updatedCollaborator) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }
    
    res.json(updatedCollaborator);
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    res.status(500).json({ error: 'Failed to update collaborator role' });
  }
});

// Remove a collaborator
router.delete('/shared-workflows/collaborators/:id', async (req: Request, res: Response) => {
  try {
    const collaboratorId = parseInt(req.params.id);
    
    if (isNaN(collaboratorId)) {
      return res.status(400).json({ error: 'Invalid collaborator ID format' });
    }
    
    // Note: We'll need to implement this method in the storage interface
    // For now, we'll return a not implemented error
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// Get activities for a shared workflow
router.get('/shared-workflows/:id/activities', async (req: Request, res: Response) => {
  try {
    const sharedWorkflowId = parseInt(req.params.id);
    
    if (isNaN(sharedWorkflowId)) {
      return res.status(400).json({ error: 'Invalid shared workflow ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(sharedWorkflowId);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const activities = await storage.getWorkflowActivities(sharedWorkflowId, limit);
    
    res.json(activities);
  } catch (error) {
    console.error('Error retrieving workflow activities:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow activities' });
  }
});

// Log an activity for a shared workflow
router.post('/shared-workflows/:id/activities', async (req: Request, res: Response) => {
  try {
    const sharedWorkflowId = parseInt(req.params.id);
    
    if (isNaN(sharedWorkflowId)) {
      return res.status(400).json({ error: 'Invalid shared workflow ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(sharedWorkflowId);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    // Add the workflow ID to the request body
    const activityData = {
      ...req.body,
      sharedWorkflowId
    };
    
    const validatedData = insertSharedWorkflowActivitySchema.parse(activityData);
    const activity = await storage.logWorkflowActivity(validatedData);
    
    res.status(201).json(activity);
  } catch (error) {
    console.error('Error logging workflow activity:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to log workflow activity' });
  }
});

// Create a real-time session for a shared workflow
router.post('/shared-workflows/:id/sessions', async (req: Request, res: Response) => {
  try {
    const sharedWorkflowId = parseInt(req.params.id);
    
    if (isNaN(sharedWorkflowId)) {
      return res.status(400).json({ error: 'Invalid shared workflow ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(sharedWorkflowId);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Add the workflow ID and session ID to the request body
    const sessionData = {
      ...req.body,
      sessionId,
      sharedWorkflowId
    };
    
    const validatedData = insertWorkflowSessionSchema.parse(sessionData);
    const session = await storage.createWorkflowSession(validatedData);
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating workflow session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to create workflow session' });
  }
});

// Get active sessions for a shared workflow
router.get('/shared-workflows/:id/sessions', async (req: Request, res: Response) => {
  try {
    const sharedWorkflowId = parseInt(req.params.id);
    
    if (isNaN(sharedWorkflowId)) {
      return res.status(400).json({ error: 'Invalid shared workflow ID format' });
    }
    
    const existingWorkflow = await storage.getSharedWorkflowById(sharedWorkflowId);
    
    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Shared workflow not found' });
    }
    
    const sessions = await storage.getActiveWorkflowSessions(sharedWorkflowId);
    res.json(sessions);
  } catch (error) {
    console.error('Error retrieving workflow sessions:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow sessions' });
  }
});

// Update session status
router.patch('/workflow-sessions/:sessionId/status', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedSession = await storage.updateWorkflowSessionStatus(sessionId, status);
    
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

// Update session participants
router.patch('/workflow-sessions/:sessionId/participants', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { participants } = req.body;
    
    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Participants array is required' });
    }
    
    const updatedSession = await storage.updateWorkflowSessionParticipants(sessionId, participants);
    
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating session participants:', error);
    res.status(500).json({ error: 'Failed to update session participants' });
  }
});

// End a session
router.patch('/workflow-sessions/:sessionId/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const endedSession = await storage.endWorkflowSession(sessionId);
    
    if (!endedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(endedSession);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router;
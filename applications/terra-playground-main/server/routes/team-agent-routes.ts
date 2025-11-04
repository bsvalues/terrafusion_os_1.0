import { Request, Response } from 'express';
import { Express } from 'express';
import { IStorage } from '../storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Register team agent routes
 * @param app Express application
 * @param storage Storage implementation
 */
export function registerTeamAgentRoutes(app: Express, storage: IStorage) {
  /**
   * Get all team agents
   */
  app.get('/api/team-agents', async (req: Request, res: Response) => {
    try {
      const agents = await storage.getTeamMembers();
      res.json(agents);
    } catch (error) {
      console.error('Error getting team agents:', error);
      res.status(500).json({ error: 'Failed to retrieve team agents' });
    }
  });

  /**
   * Get a specific team agent by ID
   */
  app.get('/api/team-agents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getTeamMember(id);

      if (!agent) {
        return res.status(404).json({ error: 'Team agent not found' });
      }

      res.json(agent);
    } catch (error) {
      console.error('Error getting team agent:', error);
      res.status(500).json({ error: 'Failed to retrieve team agent' });
    }
  });

  /**
   * Create a new team agent
   */
  app.post('/api/team-agents', async (req: Request, res: Response) => {
    try {
      const agent = req.body;

      if (!agent.name || !agent.role) {
        return res.status(400).json({ error: 'Name and role are required' });
      }

      const newAgent = await storage.createTeamMember({
        name: agent.name,
        role: agent.role,
        email: agent.email || `${agent.role.toLowerCase()}@example.com`,
        status: 'available',
        capabilities: agent.capabilities || {
          skills: [],
          expertiseLevel: 'mid',
          toolsAndFrameworks: [],
          availability: {
            hoursPerWeek: 40,
            preferredWorkingHours: {
              start: '09:00',
              end: '17:00',
            },
            timeZone: 'UTC',
          },
        },
        avatar: agent.avatar || null,
      });

      await storage.createSystemActivity({
        activity_type: 'team_collaboration',
        component: 'team_agents',
        status: 'created',
        details: {
          agentId: newAgent.id,
          agentName: newAgent.name,
          agentRole: newAgent.role,
        },
      });

      res.status(201).json(newAgent);
    } catch (error) {
      console.error('Error creating team agent:', error);
      res.status(500).json({ error: 'Failed to create team agent' });
    }
  });

  /**
   * Update a team agent
   */
  app.put('/api/team-agents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const agent = req.body;

      const existingAgent = await storage.getTeamMember(id);
      if (!existingAgent) {
        return res.status(404).json({ error: 'Team agent not found' });
      }

      const updatedAgent = await storage.updateTeamMember(id, agent);

      await storage.createSystemActivity({
        activity_type: 'team_collaboration',
        component: 'team_agents',
        status: 'updated',
        details: {
          agentId: updatedAgent.id,
          agentName: updatedAgent.name,
          agentRole: updatedAgent.role,
          changes: Object.keys(agent),
        },
      });

      res.json(updatedAgent);
    } catch (error) {
      console.error('Error updating team agent:', error);
      res.status(500).json({ error: 'Failed to update team agent' });
    }
  });

  /**
   * Get team agent tasks
   */
  app.get('/api/team-tasks', async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();

      // Enhance tasks with comments
      const enhancedTasks = await Promise.all(
        tasks.map(async task => {
          const comments = await storage.getTaskComments(task.id);
          return { ...task, comments };
        })
      );

      res.json(enhancedTasks);
    } catch (error) {
      console.error('Error getting team tasks:', error);
      res.status(500).json({ error: 'Failed to retrieve team tasks' });
    }
  });

  /**
   * Get a specific task
   */
  app.get('/api/team-tasks/:id', async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const comments = await storage.getTaskComments(taskId);

      res.json({ ...task, comments });
    } catch (error) {
      console.error('Error getting task:', error);
      res.status(500).json({ error: 'Failed to retrieve task' });
    }
  });

  /**
   * Create a new task
   */
  app.post('/api/team-tasks', async (req: Request, res: Response) => {
    try {
      const task = req.body;

      if (!task.title || !task.createdBy) {
        return res.status(400).json({ error: 'Title and creator are required' });
      }

      const newTask = await storage.createTask({
        id: uuidv4(),
        title: task.title,
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        createdBy: task.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: task.assignedTo || null,
        dueDate: task.dueDate || null,
        estimatedHours: task.estimatedHours || null,
        actualHours: task.actualHours || null,
        tags: task.tags || [],
        attachments: task.attachments || [],
      });

      await storage.createSystemActivity({
        activity_type: 'team_collaboration',
        component: 'team_tasks',
        status: 'created',
        details: {
          taskId: newTask.id,
          taskTitle: newTask.title,
          assignedTo: newTask.assignedTo,
          createdBy: newTask.createdBy,
        },
      });

      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  /**
   * Update a task
   */
  app.put('/api/team-tasks/:id', async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id;
      const update = req.body;

      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Prepare the update
      const taskUpdate = {
        ...update,
        updatedAt: new Date(),
      };

      const updatedTask = await storage.updateTask(taskId, taskUpdate);

      await storage.createSystemActivity({
        activity_type: 'team_collaboration',
        component: 'team_tasks',
        status: 'updated',
        details: {
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          assignedTo: updatedTask.assignedTo,
          status: updatedTask.status,
          changes: Object.keys(update),
        },
      });

      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  /**
   * Get task comments
   */
  app.get('/api/team-tasks/:id/comments', async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id;
      const comments = await storage.getTaskComments(taskId);

      res.json(comments);
    } catch (error) {
      console.error('Error getting task comments:', error);
      res.status(500).json({ error: 'Failed to retrieve task comments' });
    }
  });

  /**
   * Add a comment to a task
   */
  app.post('/api/team-tasks/:id/comments', async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id;
      const { userId, content } = req.body;

      if (!userId || !content) {
        return res.status(400).json({ error: 'User ID and content are required' });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const comment = await storage.createTaskComment({
        id: uuidv4(),
        taskId,
        userId,
        content,
        createdAt: new Date(),
      });

      await storage.createSystemActivity({
        activity_type: 'team_collaboration',
        component: 'task_comments',
        status: 'created',
        details: {
          taskId,
          taskTitle: task.title,
          commentId: comment.id,
          userId,
          contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating task comment:', error);
      res.status(500).json({ error: 'Failed to create task comment' });
    }
  });

  /**
   * Get all team chat messages for a session
   */
  app.get('/api/team-chat/:sessionId', async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const messages = await storage.getTeamChatMessages(sessionId);

      res.json(messages);
    } catch (error) {
      console.error('Error getting team chat messages:', error);
      res.status(500).json({ error: 'Failed to retrieve team chat messages' });
    }
  });

  /**
   * Create a team chat message
   */
  app.post('/api/team-chat/:sessionId', async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const { fromUserId, content, threadId } = req.body;

      if (!fromUserId || !content) {
        return res.status(400).json({ error: 'User ID and content are required' });
      }

      const message = await storage.createTeamChatMessage({
        id: uuidv4(),
        sessionId,
        fromUserId,
        content,
        timestamp: new Date(),
        threadId: threadId || null,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating team chat message:', error);
      res.status(500).json({ error: 'Failed to create team chat message' });
    }
  });
}

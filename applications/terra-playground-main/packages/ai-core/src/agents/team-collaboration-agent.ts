/**
 * Team Collaboration Agent
 *
 * This agent manages team collaboration processes, facilitates
 * communication between team members, and coordinates tasks.
 */

import { BaseAgent } from './base-agent';
import { AgentConfig, AgentCapability, AgentStatus } from '../models/agent-types';
import { IStorage } from '../services/storage-interface';
import { LLMService } from '../services/llm-service';

/**
 * Collaboration session options
 */
export interface CollaborationSessionOptions {
  /**
   * Collaboration session title
   */
  title: string;

  /**
   * Session description
   */
  description?: string;

  /**
   * List of participant IDs
   */
  participants: string[];

  /**
   * Session topic or focus area
   */
  topic?: string;

  /**
   * Scheduled start time (ISO string)
   */
  scheduledStart?: string;

  /**
   * Scheduled end time (ISO string)
   */
  scheduledEnd?: string;

  /**
   * Whether to auto-generate session summary
   */
  autoSummarize?: boolean;
}

/**
 * Team message interface
 */
export interface TeamMessage {
  /**
   * Message ID
   */
  id: string;

  /**
   * Sender ID
   */
  senderId: string;

  /**
   * Message content
   */
  content: string;

  /**
   * Message timestamp (ISO string)
   */
  timestamp: string;

  /**
   * Session ID this message belongs to
   */
  sessionId: string;

  /**
   * Message type (text, action, etc.)
   */
  type?: 'text' | 'action' | 'decision' | 'question' | 'answer';

  /**
   * Parent message ID (for threaded replies)
   */
  parentId?: string;

  /**
   * Additional message metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Team action interface
 */
export interface TeamAction {
  /**
   * Action ID
   */
  id: string;

  /**
   * Action description
   */
  description: string;

  /**
   * Assigned user IDs
   */
  assignees: string[];

  /**
   * Action status
   */
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';

  /**
   * Due date (ISO string)
   */
  dueDate?: string;

  /**
   * Session ID this action belongs to
   */
  sessionId: string;

  /**
   * Creation timestamp (ISO string)
   */
  createdAt: string;

  /**
   * Last update timestamp (ISO string)
   */
  updatedAt: string;

  /**
   * Action priority
   */
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Additional action metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Team Collaboration Agent implementation
 */
export class TeamCollaborationAgent extends BaseAgent {
  constructor(
    id: string,
    name: string,
    description: string,
    storage: IStorage,
    llmService: LLMService,
    config?: AgentConfig
  ) {
    super(id, name, description, config || {}, storage, llmService);
  }

  /**
   * Register agent capabilities
   */
  protected registerCapabilities(): void {
    this.registerCapability({
      id: 'create-session',
      name: 'Create Collaboration Session',
      description: 'Create a new team collaboration session',
      parameterSchema: {
        options: { type: 'object', required: true },
      },
      handler: async params => this.createSession(params.options),
    });

    this.registerCapability({
      id: 'get-session',
      name: 'Get Collaboration Session',
      description: 'Get details about a collaboration session',
      parameterSchema: {
        sessionId: { type: 'string', required: true },
      },
      handler: async params => this.getSession(params.sessionId),
    });

    this.registerCapability({
      id: 'list-sessions',
      name: 'List Collaboration Sessions',
      description: 'List all collaboration sessions, optionally filtered',
      parameterSchema: {
        filter: { type: 'object', required: false },
        options: { type: 'object', required: false },
      },
      handler: async params => this.listSessions(params.filter, params.options),
    });

    this.registerCapability({
      id: 'add-session-message',
      name: 'Add Session Message',
      description: 'Add a message to a collaboration session',
      parameterSchema: {
        sessionId: { type: 'string', required: true },
        message: { type: 'object', required: true },
      },
      handler: async params => this.addSessionMessage(params.sessionId, params.message),
    });

    this.registerCapability({
      id: 'get-session-messages',
      name: 'Get Session Messages',
      description: 'Get messages from a collaboration session',
      parameterSchema: {
        sessionId: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params => this.getSessionMessages(params.sessionId, params.options),
    });

    this.registerCapability({
      id: 'create-team-action',
      name: 'Create Team Action',
      description: 'Create a new team action item',
      parameterSchema: {
        sessionId: { type: 'string', required: true },
        action: { type: 'object', required: true },
      },
      handler: async params => this.createTeamAction(params.sessionId, params.action),
    });

    this.registerCapability({
      id: 'update-team-action',
      name: 'Update Team Action',
      description: 'Update an existing team action item',
      parameterSchema: {
        actionId: { type: 'string', required: true },
        updates: { type: 'object', required: true },
      },
      handler: async params => this.updateTeamAction(params.actionId, params.updates),
    });

    this.registerCapability({
      id: 'generate-session-summary',
      name: 'Generate Session Summary',
      description: 'Generate a summary of a collaboration session',
      parameterSchema: {
        sessionId: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params => this.generateSessionSummary(params.sessionId, params.options),
    });
  }

  /**
   * Create a new collaboration session
   */
  private async createSession(options: CollaborationSessionOptions): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      if (!options.title || !options.participants || options.participants.length === 0) {
        throw new Error('Session title and at least one participant are required');
      }

      const sessionId = `session-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const session = {
        id: sessionId,
        title: options.title,
        description: options.description || '',
        participants: options.participants,
        topic: options.topic || '',
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
        scheduledStart: options.scheduledStart,
        scheduledEnd: options.scheduledEnd,
        autoSummarize: options.autoSummarize !== undefined ? options.autoSummarize : true,
      };

      // Save session to storage
      await this.storage.setItem('collaboration_sessions', sessionId, session);

      // Create initial system message
      const initialMessage: TeamMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        content: `Session "${options.title}" created with ${options.participants.length} participants.`,
        timestamp,
        sessionId,
        type: 'text',
      };

      await this.storage.setItem('collaboration_messages', initialMessage.id, initialMessage);

      this.setStatus(AgentStatus.READY);
      return {
        session,
        message: initialMessage,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Get a collaboration session by ID
   */
  private async getSession(sessionId: string): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      const session = await this.storage.getItem('collaboration_sessions', sessionId);

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      this.setStatus(AgentStatus.READY);
      return { session };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * List collaboration sessions
   */
  private async listSessions(
    filter?: Record<string, any>,
    options?: { limit?: number; skip?: number; sort?: Record<string, 1 | -1> }
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      const sessions = await this.storage.find('collaboration_sessions', filter, options);

      this.setStatus(AgentStatus.READY);
      return {
        sessions,
        count: sessions.length,
        filter,
        options,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Add a message to a collaboration session
   */
  private async addSessionMessage(
    sessionId: string,
    messageData: Partial<TeamMessage>
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Verify the session exists
      const session = await this.storage.getItem('collaboration_sessions', sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Create the message
      const messageId = messageData.id || `msg-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const message: TeamMessage = {
        id: messageId,
        senderId: messageData.senderId || 'unknown',
        content: messageData.content || '',
        timestamp,
        sessionId,
        type: messageData.type || 'text',
        parentId: messageData.parentId,
        metadata: messageData.metadata,
      };

      // Save message to storage
      await this.storage.setItem('collaboration_messages', messageId, message);

      // Update session's updatedAt timestamp
      await this.storage.setItem('collaboration_sessions', sessionId, {
        ...session,
        updatedAt: timestamp,
      });

      // If it's a decision message, maybe auto-generate an action
      if (message.type === 'decision') {
        await this.maybeCreateActionFromDecision(message);
      }

      this.setStatus(AgentStatus.READY);
      return { message };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Get messages from a collaboration session
   */
  private async getSessionMessages(
    sessionId: string,
    options?: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      includeThreads?: boolean;
    }
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Verify the session exists
      const session = await this.storage.getItem('collaboration_sessions', sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Default options
      const defaultOptions = {
        sort: { timestamp: 1 }, // Sort by timestamp, oldest first
        includeThreads: true,
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Get messages for this session
      const messages = await this.storage.find(
        'collaboration_messages',
        { sessionId },
        {
          limit: mergedOptions.limit,
          skip: mergedOptions.skip,
          sort: mergedOptions.sort,
        }
      );

      // Group messages by thread if requested
      let result = messages;
      if (mergedOptions.includeThreads) {
        result = this.organizeMessageThreads(messages);
      }

      this.setStatus(AgentStatus.READY);
      return {
        messages: result,
        count: messages.length,
        sessionId,
        options: mergedOptions,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Create a new team action
   */
  private async createTeamAction(sessionId: string, actionData: Partial<TeamAction>): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Verify the session exists
      const session = await this.storage.getItem('collaboration_sessions', sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (!actionData.description || !actionData.assignees || actionData.assignees.length === 0) {
        throw new Error('Action description and at least one assignee are required');
      }

      // Create the action
      const actionId = `action-${Date.now()}`;
      const timestamp = new Date().toISOString();

      const action: TeamAction = {
        id: actionId,
        description: actionData.description,
        assignees: actionData.assignees,
        status: actionData.status || 'pending',
        sessionId,
        createdAt: timestamp,
        updatedAt: timestamp,
        dueDate: actionData.dueDate,
        priority: actionData.priority || 'medium',
        metadata: actionData.metadata,
      };

      // Save action to storage
      await this.storage.setItem('team_actions', actionId, action);

      // Create a system message about the new action
      const message: TeamMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        content: `New action created: "${action.description}" assigned to ${action.assignees.join(', ')}`,
        timestamp,
        sessionId,
        type: 'action',
        metadata: { actionId },
      };

      await this.storage.setItem('collaboration_messages', message.id, message);

      this.setStatus(AgentStatus.READY);
      return {
        action,
        message,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Update an existing team action
   */
  private async updateTeamAction(actionId: string, updates: Partial<TeamAction>): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Get the existing action
      const action = await this.storage.getItem('team_actions', actionId);
      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      // Create updated action
      const timestamp = new Date().toISOString();
      const updatedAction: TeamAction = {
        ...action,
        ...updates,
        id: actionId, // Ensure ID doesn't change
        updatedAt: timestamp,
      };

      // Save updated action
      await this.storage.setItem('team_actions', actionId, updatedAction);

      // If status changed, create a status update message
      if (updates.status && updates.status !== action.status) {
        const message: TeamMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          content: `Action "${action.description}" status changed from ${action.status} to ${updates.status}`,
          timestamp,
          sessionId: action.sessionId,
          type: 'action',
          metadata: { actionId },
        };

        await this.storage.setItem('collaboration_messages', message.id, message);
      }

      this.setStatus(AgentStatus.READY);
      return { action: updatedAction };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Generate a summary of a collaboration session
   */
  private async generateSessionSummary(
    sessionId: string,
    options?: { includeActions?: boolean; includeDecisions?: boolean }
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Default options
      const defaultOptions = {
        includeActions: true,
        includeDecisions: true,
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Get the session
      const session = await this.storage.getItem('collaboration_sessions', sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Get session messages
      const messages = await this.storage.find(
        'collaboration_messages',
        { sessionId },
        { sort: { timestamp: 1 } }
      );

      // Get actions if requested
      let actions = [];
      if (mergedOptions.includeActions) {
        actions = await this.storage.find('team_actions', { sessionId });
      }

      // Extract decisions if requested
      let decisions = [];
      if (mergedOptions.includeDecisions) {
        decisions = messages.filter(msg => msg.type === 'decision');
      }

      // Build prompt for the LLM
      let prompt = `Summarize the following collaboration session:\n\n`;
      prompt += `Title: ${session.title}\n`;
      prompt += `Description: ${session.description}\n`;
      prompt += `Participants: ${session.participants.join(', ')}\n\n`;
      prompt += `Messages (${messages.length}):\n`;

      // Add messages to the prompt
      for (const msg of messages) {
        if (msg.type !== 'system') {
          // Skip system messages in the summary
          prompt += `[${new Date(msg.timestamp).toLocaleString()}] ${msg.senderId}: ${msg.content}\n`;
        }
      }

      // Add decision points if included
      if (mergedOptions.includeDecisions && decisions.length > 0) {
        prompt += `\nKey Decisions:\n`;
        for (const decision of decisions) {
          prompt += `- ${decision.content}\n`;
        }
      }

      // Add actions if included
      if (mergedOptions.includeActions && actions.length > 0) {
        prompt += `\nAction Items:\n`;
        for (const action of actions) {
          prompt += `- ${action.description} (${action.status}, assigned to: ${action.assignees.join(', ')})\n`;
        }
      }

      prompt += `\nProvide a concise summary of this collaboration session, highlighting the main topics discussed, key decisions, and next steps.`;

      // Generate summary using LLM
      const result = await this.llmService.complete({
        prompt,
        options: {
          model: this.config.modelName || 'gpt-4',
          temperature: 0.3,
          maxTokens: 500,
        },
      });

      const summary = {
        id: `summary-${Date.now()}`,
        sessionId,
        content: result.text,
        generatedAt: new Date().toISOString(),
        messageCount: messages.length,
        actionCount: actions.length,
        decisionCount: decisions.length,
      };

      // Save the summary
      await this.storage.setItem('session_summaries', summary.id, summary);

      this.setStatus(AgentStatus.READY);
      return { summary };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Helper: Organize messages into threads
   */
  private organizeMessageThreads(messages: TeamMessage[]): any {
    // Group messages by parent
    const threadMap = new Map<string, TeamMessage[]>();
    const topLevelMessages: TeamMessage[] = [];

    // First pass: categorize messages
    for (const message of messages) {
      if (!message.parentId) {
        // This is a top-level message
        topLevelMessages.push(message);
      } else {
        // This is a reply - add to the thread
        if (!threadMap.has(message.parentId)) {
          threadMap.set(message.parentId, []);
        }
        threadMap.get(message.parentId)!.push(message);
      }
    }

    // Second pass: build the threaded structure
    const result = topLevelMessages.map(msg => {
      const replies = threadMap.get(msg.id) || [];
      return {
        ...msg,
        replies: replies.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      };
    });

    // Sort by timestamp
    return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Helper: Maybe create an action from a decision message
   */
  private async maybeCreateActionFromDecision(message: TeamMessage): Promise<void> {
    if (message.type !== 'decision') {
      return;
    }

    try {
      // Use LLM to determine if this decision needs an action
      const prompt = `The following is a decision made in a team meeting:\n\n"${message.content}"\n\nDoes this decision require follow-up actions? If yes, extract what actions should be taken and who (if mentioned) should be responsible. If no actions are needed, respond with "No actions required."`;

      const result = await this.llmService.complete({
        prompt,
        options: {
          model: this.config.modelName || 'gpt-4',
          temperature: 0.3,
          maxTokens: 200,
        },
      });

      // Check if actions are required
      if (result.text.toLowerCase().includes('no actions required')) {
        return;
      }

      // Create an action (this is a simplified version; in a real system, you'd parse the LLM response more carefully)
      const actionData: Partial<TeamAction> = {
        description: `Follow up on decision: ${message.content}`,
        assignees: [message.senderId], // Default to the decision maker
        status: 'pending',
        priority: 'medium',
        metadata: { sourceDecisionId: message.id },
      };

      await this.createTeamAction(message.sessionId, actionData);
    } catch (error) {
      console.error('Error creating action from decision:', error);
    }
  }
}

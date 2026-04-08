/**
 * Collaborative Intelligence Service
 * 
 * Provides real-time collaboration features for assessment model building:
 * - Real-time collaborative editing
 * - Team workspaces and access controls
 * - Presence indicators and activity feeds
 * - AI-powered team suggestions
 */

import { IStorage } from '../../storage';
import { AIAssistantService } from '../ai-assistant-service';
import { WebSocket } from 'ws';

// Type definitions for collaborative intelligence
export type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastActive: string;
};

export type Workspace = {
  id: number;
  name: string;
  description?: string;
  modelIds: string[];
  members: {
    memberId: number;
    role: 'owner' | 'editor' | 'viewer';
  }[];
  createdAt: string;
  updatedAt: string;
};

export type ActivityEvent = {
  id: number;
  workspaceId: number;
  modelId?: string;
  userId: number;
  userName: string;
  eventType: 'model_created' | 'model_updated' | 'model_published' | 'model_tested' | 'comment_added' | 'user_joined' | 'user_left';
  details: any;
  timestamp: string;
};

export type ModelChange = {
  id: number;
  modelId: string;
  userId: number;
  userName: string;
  entityType: 'component' | 'calculation' | 'variable' | 'validation_rule' | 'test_case';
  entityId: number;
  entityName: string;
  changeType: 'created' | 'updated' | 'deleted';
  diff?: {
    before: any;
    after: any;
  };
  timestamp: string;
};

export type Comment = {
  id: number;
  modelId: string;
  entityType: 'component' | 'calculation' | 'variable' | 'validation_rule' | 'test_case' | 'model';
  entityId?: number;
  userId: number;
  userName: string;
  text: string;
  resolved: boolean;
  replies: {
    id: number;
    userId: number;
    userName: string;
    text: string;
    timestamp: string;
  }[];
  timestamp: string;
};

export type CollaborationSuggestion = {
  id: number;
  workspaceId: number;
  modelId?: string;
  suggestionType: 'team_member' | 'expert' | 'resource' | 'approach' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  applied: boolean;
  timestamp: string;
};

export type EditorState = {
  modelId: string;
  entityType: 'component' | 'calculation' | 'variable' | 'validation_rule' | 'test_case';
  entityId: number;
  activeUsers: {
    userId: number;
    userName: string;
    cursor?: {
      line: number;
      character: number;
    };
    selection?: {
      start: {
        line: number;
        character: number;
      };
      end: {
        line: number;
        character: number;
      };
    };
  }[];
};

// Define WebSocket message types
export type CollaborationMessage = {
  type: 'cursor_update' | 'selection_update' | 'content_update' | 'user_joined' | 'user_left' | 'comment_added' | 'suggestion_added';
  userId: number;
  userName: string;
  modelId: string;
  entityType?: 'component' | 'calculation' | 'variable' | 'validation_rule' | 'test_case';
  entityId?: number;
  data: any;
  timestamp: string;
};

export class CollaborativeIntelligence {
  private storage: IStorage;
  private aiAssistantService: AIAssistantService;
  private activeClients: Map<number, WebSocket[]> = new Map();
  private modelEditors: Map<string, EditorState> = new Map();
  
  constructor(storage: IStorage, aiAssistantService: AIAssistantService) {
    this.storage = storage;
    this.aiAssistantService = aiAssistantService;
  }
  
  /**
   * Register a WebSocket client for a user
   */
  registerClient(userId: number, socket: WebSocket): void {
    if (!this.activeClients.has(userId)) {
      this.activeClients.set(userId, []);
    }
    
    this.activeClients.get(userId)?.push(socket);
    
    // Update user status to online
    this.updateUserStatus(userId, 'online');
    
    // Notify other users that this user has come online
    this.broadcastUserStatus(userId, 'online');
    
    // Handle socket close
    socket.on('close', () => {
      this.unregisterClient(userId, socket);
    });
  }
  
  /**
   * Unregister a WebSocket client for a user
   */
  unregisterClient(userId: number, socket: WebSocket): void {
    const clients = this.activeClients.get(userId);
    
    if (clients) {
      const index = clients.indexOf(socket);
      
      if (index !== -1) {
        clients.splice(index, 1);
      }
      
      if (clients.length === 0) {
        this.activeClients.delete(userId);
        
        // Update user status to offline
        this.updateUserStatus(userId, 'offline');
        
        // Notify other users that this user has gone offline
        this.broadcastUserStatus(userId, 'offline');
        
        // Remove user from any active editor sessions
        this.removeUserFromEditors(userId);
      }
    }
  }
  
  /**
   * Update user status in the database
   */
  private async updateUserStatus(userId: number, status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      await this.storage.updateTeamMember(userId, {
        status,
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating user status for user ${userId}:`, error);
    }
  }
  
  /**
   * Broadcast user status change to all connected clients
   */
  private broadcastUserStatus(userId: number, status: 'online' | 'offline' | 'away'): void {
    this.broadcastToAllExcept(userId, {
      type: status === 'online' ? 'user_joined' : 'user_left',
      userId,
      userName: '', // Would be populated from the database in a real implementation
      modelId: '',
      data: { status },
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Remove user from any active editor sessions
   */
  private removeUserFromEditors(userId: number): void {
    for (const [modelId, editorState] of this.modelEditors.entries()) {
      const userIndex = editorState.activeUsers.findIndex(user => user.userId === userId);
      
      if (userIndex !== -1) {
        editorState.activeUsers.splice(userIndex, 1);
        
        // Broadcast that user has left the editor
        this.broadcastToAllExcept(userId, {
          type: 'user_left',
          userId,
          userName: '', // Would be populated from the database in a real implementation
          modelId,
          entityType: editorState.entityType,
          entityId: editorState.entityId,
          data: {},
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  /**
   * Handle a collaboration message from a client
   */
  handleMessage(userId: number, message: CollaborationMessage): void {
    // Validate message
    if (!message.modelId) {
      console.error('Invalid message: modelId is required');
      return;
    }
    
    // Process message based on type
    switch (message.type) {
      case 'cursor_update':
        this.handleCursorUpdate(userId, message);
        break;
        
      case 'selection_update':
        this.handleSelectionUpdate(userId, message);
        break;
        
      case 'content_update':
        this.handleContentUpdate(userId, message);
        break;
        
      case 'comment_added':
        this.handleCommentAdded(userId, message);
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Handle cursor update message
   */
  private handleCursorUpdate(userId: number, message: CollaborationMessage): void {
    if (!message.entityType || !message.entityId) {
      console.error('Invalid cursor update: entityType and entityId are required');
      return;
    }
    
    // Get or create editor state
    const editorKey = `${message.modelId}-${message.entityType}-${message.entityId}`;
    
    if (!this.modelEditors.has(editorKey)) {
      this.modelEditors.set(editorKey, {
        modelId: message.modelId,
        entityType: message.entityType,
        entityId: message.entityId,
        activeUsers: []
      });
    }
    
    const editorState = this.modelEditors.get(editorKey)!;
    
    // Update user cursor
    const userIndex = editorState.activeUsers.findIndex(user => user.userId === userId);
    
    if (userIndex === -1) {
      // Add user to editor
      editorState.activeUsers.push({
        userId,
        userName: message.userName,
        cursor: message.data.cursor
      });
    } else {
      // Update user cursor
      editorState.activeUsers[userIndex].cursor = message.data.cursor;
    }
    
    // Broadcast cursor update to all other clients editing this entity
    this.broadcastToAllExcept(userId, message);
  }
  
  /**
   * Handle selection update message
   */
  private handleSelectionUpdate(userId: number, message: CollaborationMessage): void {
    if (!message.entityType || !message.entityId) {
      console.error('Invalid selection update: entityType and entityId are required');
      return;
    }
    
    // Get or create editor state
    const editorKey = `${message.modelId}-${message.entityType}-${message.entityId}`;
    
    if (!this.modelEditors.has(editorKey)) {
      this.modelEditors.set(editorKey, {
        modelId: message.modelId,
        entityType: message.entityType,
        entityId: message.entityId,
        activeUsers: []
      });
    }
    
    const editorState = this.modelEditors.get(editorKey)!;
    
    // Update user selection
    const userIndex = editorState.activeUsers.findIndex(user => user.userId === userId);
    
    if (userIndex === -1) {
      // Add user to editor
      editorState.activeUsers.push({
        userId,
        userName: message.userName,
        selection: message.data.selection
      });
    } else {
      // Update user selection
      editorState.activeUsers[userIndex].selection = message.data.selection;
    }
    
    // Broadcast selection update to all other clients editing this entity
    this.broadcastToAllExcept(userId, message);
  }
  
  /**
   * Handle content update message
   */
  private async handleContentUpdate(userId: number, message: CollaborationMessage): Promise<void> {
    if (!message.entityType || !message.entityId) {
      console.error('Invalid content update: entityType and entityId are required');
      return;
    }
    
    // Update the content in the database
    try {
      switch (message.entityType) {
        case 'component':
          await this.storage.updateModelComponent(message.entityId, message.data.content);
          break;
          
        case 'calculation':
          await this.storage.updateModelCalculation(message.entityId, message.data.content);
          break;
          
        case 'variable':
          await this.storage.updateModelVariable(message.entityId, message.data.content);
          break;
          
        case 'validation_rule':
          await this.storage.updateModelValidationRule(message.entityId, message.data.content);
          break;
          
        case 'test_case':
          await this.storage.updateModelTestCase(message.entityId, message.data.content);
          break;
      }
      
      // Record the change
      await this.recordModelChange(userId, message);
      
      // Broadcast content update to all other clients
      this.broadcastToAllExcept(userId, message);
      
      // Generate AI suggestions if appropriate
      if (message.data.suggestImprovements) {
        this.generateCollaborationSuggestion(userId, message);
      }
    } catch (error) {
      console.error(`Error updating ${message.entityType} content:`, error);
    }
  }
  
  /**
   * Handle comment added message
   */
  private async handleCommentAdded(userId: number, message: CollaborationMessage): Promise<void> {
    try {
      // Save comment to database
      const comment = await this.storage.createComment({
        modelId: message.modelId,
        entityType: message.entityType!,
        entityId: message.entityId,
        userId,
        text: message.data.text,
        resolved: false,
        timestamp: message.timestamp
      });
      
      // Update the message with the saved comment ID
      message.data.commentId = comment.id;
      
      // Broadcast comment to all clients
      this.broadcastToAll(message);
      
      // Create an activity event
      await this.createActivityEvent(userId, {
        workspaceId: message.data.workspaceId,
        modelId: message.modelId,
        userId,
        userName: message.userName,
        eventType: 'comment_added',
        details: {
          commentId: comment.id,
          entityType: message.entityType,
          entityId: message.entityId,
          text: message.data.text.substring(0, 100) + (message.data.text.length > 100 ? '...' : '')
        },
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }
  
  /**
   * Record a model change
   */
  private async recordModelChange(userId: number, message: CollaborationMessage): Promise<void> {
    try {
      // Get user name
      const user = await this.storage.getTeamMember(userId);
      
      if (!user) {
        console.warn(`User ${userId} not found`);
        return;
      }
      
      // Get entity name
      let entityName = '';
      
      switch (message.entityType) {
        case 'component':
          const component = await this.storage.getModelComponent(message.entityId!);
          entityName = component?.name || '';
          break;
          
        case 'calculation':
          const calculation = await this.storage.getModelCalculation(message.entityId!);
          entityName = calculation?.name || '';
          break;
          
        case 'variable':
          const variable = await this.storage.getModelVariable(message.entityId!);
          entityName = variable?.name || '';
          break;
          
        case 'validation_rule':
          const rule = await this.storage.getModelValidationRule(message.entityId!);
          entityName = rule?.name || '';
          break;
          
        case 'test_case':
          const testCase = await this.storage.getModelTestCase(message.entityId!);
          entityName = testCase?.name || '';
          break;
      }
      
      // Record the change
      await this.storage.createModelChange({
        modelId: message.modelId,
        userId,
        userName: user.name,
        entityType: message.entityType!,
        entityId: message.entityId!,
        entityName,
        changeType: 'updated',
        diff: {
          before: message.data.previousContent,
          after: message.data.content
        },
        timestamp: message.timestamp
      });
      
      // Create an activity event
      await this.createActivityEvent(userId, {
        workspaceId: message.data.workspaceId,
        modelId: message.modelId,
        userId,
        userName: user.name,
        eventType: 'model_updated',
        details: {
          entityType: message.entityType,
          entityId: message.entityId,
          entityName
        },
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error recording model change:', error);
    }
  }
  
  /**
   * Create an activity event
   */
  private async createActivityEvent(userId: number, event: Omit<ActivityEvent, 'id'>): Promise<void> {
    try {
      await this.storage.createActivityEvent(event);
    } catch (error) {
      console.error('Error creating activity event:', error);
    }
  }
  
  /**
   * Generate a collaboration suggestion using AI
   */
  private async generateCollaborationSuggestion(userId: number, message: CollaborationMessage): Promise<void> {
    try {
      // Get user and entity information
      const user = await this.storage.getTeamMember(userId);
      
      if (!user) {
        console.warn(`User ${userId} not found`);
        return;
      }
      
      let entityName = '';
      let entityContent = message.data.content;
      
      // Prepare context for AI assistant
      const promptTemplate = `
You are an expert assessment model developer providing collaborative suggestions.

USER: ${user.name} (${user.role})
MODEL ID: ${message.modelId}
ENTITY TYPE: ${message.entityType}
ENTITY NAME: ${entityName}

CONTENT:
\`\`\`
${entityContent}
\`\`\`

Please analyze the code and provide a helpful suggestion to improve it.
Consider the following aspects:
1. Code quality and best practices
2. Performance optimization
3. Readability and maintainability
4. Error handling and edge cases
5. Domain-specific improvements for assessment models

Provide your response in JSON format:
{
  "suggestionType": "improvement",
  "title": "Brief, specific suggestion title",
  "description": "Detailed explanation with specific recommendations",
  "confidence": 0.85 // Between 0 and 1
}
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();
      
      if (providers.length === 0) {
        console.warn('No AI providers available for generating collaboration suggestions');
        return;
      }
      
      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.3,
              maxTokens: 1000
            }
          });
          
          try {
            // Extract JSON response
            const jsonMatch = response.message.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                          response.message.match(/(\{[\s\S]*\})/);
                          
            if (jsonMatch && jsonMatch[1]) {
              const suggestion = JSON.parse(jsonMatch[1]);
              
              // Save suggestion to database
              const savedSuggestion = await this.storage.createCollaborationSuggestion({
                workspaceId: message.data.workspaceId,
                modelId: message.modelId,
                suggestionType: suggestion.suggestionType,
                title: suggestion.title,
                description: suggestion.description,
                confidence: suggestion.confidence,
                applied: false,
                timestamp: new Date().toISOString()
              });
              
              // Broadcast suggestion to all clients
              this.broadcastToAll({
                type: 'suggestion_added',
                userId: 0, // System-generated suggestion
                userName: 'AI Assistant',
                modelId: message.modelId,
                entityType: message.entityType,
                entityId: message.entityId,
                data: {
                  suggestion: savedSuggestion
                },
                timestamp: new Date().toISOString()
              });
              
              break; // Stop after the first successful suggestion
            }
          } catch (parseError) {
            console.error('Error parsing AI suggestion:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error generating suggestion with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }
    } catch (error) {
      console.error('Error generating collaboration suggestion:', error);
    }
  }
  
  /**
   * Broadcast a message to all connected clients
   */
  private broadcastToAll(message: CollaborationMessage): void {
    for (const clients of this.activeClients.values()) {
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    }
  }
  
  /**
   * Broadcast a message to all connected clients except the sender
   */
  private broadcastToAllExcept(exceptUserId: number, message: CollaborationMessage): void {
    for (const [userId, clients] of this.activeClients.entries()) {
      if (userId !== exceptUserId) {
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        }
      }
    }
  }
  
  /**
   * Get a list of all active users
   */
  async getActiveUsers(): Promise<TeamMember[]> {
    const activeUserIds = Array.from(this.activeClients.keys());
    
    if (activeUserIds.length === 0) {
      return [];
    }
    
    // Get user details from database
    return this.storage.getTeamMembersByIds(activeUserIds);
  }
  
  /**
   * Get recent activity events
   */
  async getRecentActivityEvents(workspaceId: number, limit: number = 50): Promise<ActivityEvent[]> {
    return this.storage.getActivityEventsByWorkspace(workspaceId, limit);
  }
  
  /**
   * Get model changes
   */
  async getModelChanges(modelId: string, limit: number = 50): Promise<ModelChange[]> {
    return this.storage.getModelChangesByModel(modelId, limit);
  }
  
  /**
   * Get comments for a model
   */
  async getModelComments(modelId: string, entityType?: string, entityId?: number): Promise<Comment[]> {
    if (entityType && entityId) {
      return this.storage.getCommentsByEntity(modelId, entityType, entityId);
    } else {
      return this.storage.getCommentsByModel(modelId);
    }
  }
  
  /**
   * Get collaboration suggestions
   */
  async getCollaborationSuggestions(workspaceId: number, modelId?: string): Promise<CollaborationSuggestion[]> {
    if (modelId) {
      return this.storage.getCollaborationSuggestionsByModel(workspaceId, modelId);
    } else {
      return this.storage.getCollaborationSuggestionsByWorkspace(workspaceId);
    }
  }
  
  /**
   * Create a new workspace
   */
  async createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    return this.storage.createWorkspace({
      ...workspace,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Get workspaces for a user
   */
  async getUserWorkspaces(userId: number): Promise<Workspace[]> {
    return this.storage.getWorkspacesByUserId(userId);
  }
  
  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: number): Promise<TeamMember[]> {
    return this.storage.getTeamMembersByWorkspace(workspaceId);
  }
  
  /**
   * Add a member to a workspace
   */
  async addWorkspaceMember(workspaceId: number, memberId: number, role: 'owner' | 'editor' | 'viewer'): Promise<void> {
    await this.storage.addWorkspaceMember(workspaceId, memberId, role);
    
    // Get member and workspace details
    const member = await this.storage.getTeamMember(memberId);
    const workspace = await this.storage.getWorkspace(workspaceId);
    
    if (!member || !workspace) {
      return;
    }
    
    // Create activity event
    await this.createActivityEvent(memberId, {
      workspaceId,
      userId: memberId,
      userName: member.name,
      eventType: 'user_joined',
      details: {
        workspaceName: workspace.name,
        role
      },
      timestamp: new Date().toISOString()
    });
    
    // Notify workspace members
    this.notifyWorkspaceMembers(workspaceId, {
      type: 'user_joined',
      userId: memberId,
      userName: member.name,
      modelId: '', // No specific model
      data: {
        workspaceId,
        workspaceName: workspace.name,
        role
      },
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Remove a member from a workspace
   */
  async removeWorkspaceMember(workspaceId: number, memberId: number): Promise<void> {
    // Get member and workspace details before removal
    const member = await this.storage.getTeamMember(memberId);
    const workspace = await this.storage.getWorkspace(workspaceId);
    
    if (!member || !workspace) {
      return;
    }
    
    // Remove member
    await this.storage.removeWorkspaceMember(workspaceId, memberId);
    
    // Create activity event
    await this.createActivityEvent(memberId, {
      workspaceId,
      userId: memberId,
      userName: member.name,
      eventType: 'user_left',
      details: {
        workspaceName: workspace.name
      },
      timestamp: new Date().toISOString()
    });
    
    // Notify workspace members
    this.notifyWorkspaceMembers(workspaceId, {
      type: 'user_left',
      userId: memberId,
      userName: member.name,
      modelId: '', // No specific model
      data: {
        workspaceId,
        workspaceName: workspace.name
      },
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Notify all members of a workspace
   */
  private async notifyWorkspaceMembers(workspaceId: number, message: CollaborationMessage): Promise<void> {
    try {
      // Get workspace members
      const members = await this.storage.getTeamMembersByWorkspace(workspaceId);
      
      if (!members || members.length === 0) {
        return;
      }
      
      // Send message to all online members
      for (const member of members) {
        const clients = this.activeClients.get(member.id);
        
        if (clients) {
          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(message));
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error notifying workspace ${workspaceId} members:`, error);
    }
  }
}

// Singleton instance
let collaborativeIntelligence: CollaborativeIntelligence;

/**
 * Initialize the Collaborative Intelligence service
 */
export function initializeCollaborativeIntelligence(
  storage: IStorage,
  aiAssistantService: AIAssistantService
): CollaborativeIntelligence {
  collaborativeIntelligence = new CollaborativeIntelligence(storage, aiAssistantService);
  return collaborativeIntelligence;
}

/**
 * Get the Collaborative Intelligence service instance
 */
export function getCollaborativeIntelligence(): CollaborativeIntelligence {
  if (!collaborativeIntelligence) {
    throw new Error('Collaborative Intelligence service not initialized');
  }
  return collaborativeIntelligence;
}

export default collaborativeIntelligence;
/**
 * SignalRService - Real-Time Communication Service
 *
 * Manages SignalR connections to all backend hubs with automatic
 * reconnection, error handling, and event subscription management.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 3
 */

import { getViteEnv } from '@/env/getViteEnv';
import * as signalR from '@microsoft/signalr';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';

/**
 * SignalR Service for managing real-time connections
 */
export class SignalRService {
  private notebookConnection: HubConnection | null = null;
  private analyticsConnection: HubConnection | null = null;
  private workflowConnection: HubConnection | null = null;
  private collaborationConnection: HubConnection | null = null;

  private readonly baseUrl: string;
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly maxReconnectAttempts = 5;

  constructor(baseUrl: string = getViteEnv().VITE_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  // ==================== NOTEBOOK HUB ====================

  /**
   * Connect to NotebookHub
   */
  async connectToNotebook(
    notebookId: number,
    userId: number,
    countyId: number,
    userName: string
  ): Promise<HubConnection> {
    if (this.notebookConnection?.state === HubConnectionState.Connected) {
      return this.notebookConnection;
    }

    this.notebookConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/notebook`, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop reconnecting
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup reconnection handlers
    this.setupReconnectionHandlers(this.notebookConnection, 'Notebook');

    try {
      await this.notebookConnection.start();

      // Join the notebook
      await this.notebookConnection.invoke('JoinNotebook', notebookId, userId, countyId, userName);

      return this.notebookConnection;
    } catch (error) {
      console.error('❌ Failed to connect to NotebookHub:', error);
      throw error;
    }
  }

  /**
   * Disconnect from NotebookHub
   */
  async disconnectFromNotebook(notebookId: number, userName: string): Promise<void> {
    if (this.notebookConnection?.state === HubConnectionState.Connected) {
      try {
        await this.notebookConnection.invoke('LeaveNotebook', notebookId, userName);
        await this.notebookConnection.stop();
      } catch (error) {
        console.error('❌ Error disconnecting from NotebookHub:', error);
      }
    }
  }

  /**
   * Get NotebookHub connection
   */
  getNotebookConnection(): HubConnection | null {
    return this.notebookConnection;
  }

  // ==================== ANALYTICS HUB ====================

  /**
   * Connect to AnalyticsHub
   */
  async connectToAnalytics(): Promise<HubConnection> {
    if (this.analyticsConnection?.state === HubConnectionState.Connected) {
      return this.analyticsConnection;
    }

    this.analyticsConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/analytics`, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null;
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupReconnectionHandlers(this.analyticsConnection, 'Analytics');

    try {
      await this.analyticsConnection.start();
      return this.analyticsConnection;
    } catch (error) {
      console.error('❌ Failed to connect to AnalyticsHub:', error);
      throw error;
    }
  }

  /**
   * Disconnect from AnalyticsHub
   */
  async disconnectFromAnalytics(): Promise<void> {
    if (this.analyticsConnection?.state === HubConnectionState.Connected) {
      try {
        await this.analyticsConnection.stop();
      } catch (error) {
        console.error('❌ Error disconnecting from AnalyticsHub:', error);
      }
    }
  }

  /**
   * Get AnalyticsHub connection
   */
  getAnalyticsConnection(): HubConnection | null {
    return this.analyticsConnection;
  }

  // ==================== WORKFLOW HUB ====================

  /**
   * Connect to WorkflowHub
   */
  async connectToWorkflow(
    workflowId: number,
    userId: number,
    countyId: number
  ): Promise<HubConnection> {
    if (this.workflowConnection?.state === HubConnectionState.Connected) {
      return this.workflowConnection;
    }

    this.workflowConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/workflow`, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null;
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupReconnectionHandlers(this.workflowConnection, 'Workflow');

    try {
      await this.workflowConnection.start();

      // Subscribe to workflow
      await this.workflowConnection.invoke('SubscribeToWorkflow', workflowId, userId, countyId);

      return this.workflowConnection;
    } catch (error) {
      console.error('❌ Failed to connect to WorkflowHub:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WorkflowHub
   */
  async disconnectFromWorkflow(workflowId: number): Promise<void> {
    if (this.workflowConnection?.state === HubConnectionState.Connected) {
      try {
        await this.workflowConnection.invoke('UnsubscribeFromWorkflow', workflowId);
        await this.workflowConnection.stop();
      } catch (error) {
        console.error('❌ Error disconnecting from WorkflowHub:', error);
      }
    }
  }

  /**
   * Get WorkflowHub connection
   */
  getWorkflowConnection(): HubConnection | null {
    return this.workflowConnection;
  }

  // ==================== COLLABORATION HUB ====================

  /**
   * Connect to CollaborationHub
   */
  async connectToCollaboration(sessionId: string, user: UserInfo): Promise<HubConnection> {
    if (this.collaborationConnection?.state === HubConnectionState.Connected) {
      return this.collaborationConnection;
    }

    this.collaborationConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/collaboration`, {
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null;
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupReconnectionHandlers(this.collaborationConnection, 'Collaboration');

    try {
      await this.collaborationConnection.start();

      // Join session
      await this.collaborationConnection.invoke('JoinSession', sessionId, user);

      return this.collaborationConnection;
    } catch (error) {
      console.error('❌ Failed to connect to CollaborationHub:', error);
      throw error;
    }
  }

  /**
   * Disconnect from CollaborationHub
   */
  async disconnectFromCollaboration(sessionId: string): Promise<void> {
    if (this.collaborationConnection?.state === HubConnectionState.Connected) {
      try {
        await this.collaborationConnection.invoke('LeaveSession', sessionId);
        await this.collaborationConnection.stop();
      } catch (error) {
        console.error('❌ Error disconnecting from CollaborationHub:', error);
      }
    }
  }

  /**
   * Get CollaborationHub connection
   */
  getCollaborationConnection(): HubConnection | null {
    return this.collaborationConnection;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Setup reconnection event handlers
   */
  private setupReconnectionHandlers(connection: HubConnection, hubName: string): void {
    connection.onreconnecting((error) => {
      const attempts = this.reconnectAttempts.get(hubName) || 0;
      this.reconnectAttempts.set(hubName, attempts + 1);
    });

    connection.onreconnected((connectionId) => {
      this.reconnectAttempts.set(hubName, 0);
    });

    connection.onclose((error) => {
      console.error(`❌ ${hubName}Hub connection closed:`, error);
      this.reconnectAttempts.delete(hubName);
    });
  }

  /**
   * Get connection state for a hub
   */
  getConnectionState(
    hubType: 'notebook' | 'analytics' | 'workflow' | 'collaboration'
  ): HubConnectionState | null {
    const connectionMap = {
      notebook: this.notebookConnection,
      analytics: this.analyticsConnection,
      workflow: this.workflowConnection,
      collaboration: this.collaborationConnection,
    };

    return connectionMap[hubType]?.state || null;
  }

  /**
   * Check if connected to a hub
   */
  isConnected(hubType: 'notebook' | 'analytics' | 'workflow' | 'collaboration'): boolean {
    return this.getConnectionState(hubType) === HubConnectionState.Connected;
  }

  /**
   * Disconnect all hubs
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];

    if (this.notebookConnection) {
      disconnectPromises.push(this.notebookConnection.stop().catch(console.error));
    }
    if (this.analyticsConnection) {
      disconnectPromises.push(this.analyticsConnection.stop().catch(console.error));
    }
    if (this.workflowConnection) {
      disconnectPromises.push(this.workflowConnection.stop().catch(console.error));
    }
    if (this.collaborationConnection) {
      disconnectPromises.push(this.collaborationConnection.stop().catch(console.error));
    }

    await Promise.all(disconnectPromises);
  }
}

// ==================== TYPES ====================

export interface UserInfo {
  userId: number;
  userName: string;
  avatar?: string;
  role?: string;
}

export interface CellUpdate {
  cellIndex: number;
  content: string;
  cellType: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CursorPosition {
  cellIndex: number;
  line: number;
  column: number;
}

export interface AnalysisProgress {
  analysisId: number;
  progress: number;
  currentStep: string;
  updatedAt: string;
}

export interface ExecutionProgress {
  nodesExecuted: number;
  nodesFailed: number;
  totalNodes: number;
  progressPercentage: number;
  currentNode: string;
}

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  userId: number;
  userName: string;
  content: string;
  messageType: string;
  timestamp: string;
}

// ==================== SINGLETON INSTANCE ====================

export const signalRService = new SignalRService();
export default signalRService;

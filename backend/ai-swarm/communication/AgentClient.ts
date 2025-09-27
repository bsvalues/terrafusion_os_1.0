import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import {
  AgentMessage,
  AgentHeartbeat,
  MessageType,
  MessagePriority,
  AgentStatus
} from './AgentCommunicationProtocol';

/**
 * Agent Communication Client - Individual agent's communication interface
 * Connects agents to the central communication hub
 */
export class AgentClient extends EventEmitter {
  private logger: Logger;
  private ws: WebSocket | null = null;
  private agentId: string;
  private tier: string;
  private capabilities: string[];
  private status: AgentStatus = AgentStatus.INITIALIZING;
  private load: number = 0;
  private activeWorkflows: string[] = [];
  private hubUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: NodeJS.Timer | null = null;
  private messageQueue: AgentMessage[] = [];
  private isConnected: boolean = false;

  constructor(agentId: string, capabilities: string[], hubUrl?: string) {
    super();
    this.agentId = agentId;
    this.tier = this.extractTierFromAgentId(agentId);
    this.capabilities = capabilities;
    // Dynamic port configuration - no hardcoded ports!
    this.hubUrl = hubUrl || `ws://localhost:${process.env.TF_API_PORT || '5000'}`;
    this.logger = new Logger(`AgentClient:${agentId}`);
  }

  private extractTierFromAgentId(agentId: string): string {
    const parts = agentId.split('_');
    return parts[0] || 'UNKNOWN';
  }

  /**
   * Connect to the communication hub
   */
  public async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.hubUrl}?agentId=${encodeURIComponent(this.agentId)}`;
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          this.logger.info(`🔗 Connected to communication hub`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.status = AgentStatus.ACTIVE;

          this.startHeartbeat();
          this.processQueuedMessages();
          this.sendCapabilityBroadcast();

          resolve(true);
        });

        this.ws.on('message', (data: WebSocket.RawData) => {
          this.handleIncomingMessage(data);
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
          this.handleDisconnection(code, reason.toString());
        });

        this.ws.on('error', (error: Error) => {
          this.logger.error('WebSocket connection error:', error);
          this.handleConnectionError(error);
          reject(error);
        });

      } catch (error) {
        this.logger.error('Failed to connect to communication hub:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the communication hub
   */
  public disconnect(): void {
    this.isConnected = false;
    this.status = AgentStatus.OFFLINE;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Agent shutdown');
      this.ws = null;
    }

    this.logger.info('🔌 Disconnected from communication hub');
  }

  /**
   * Send message to another agent or broadcast
   */
  public sendMessage(
    recipient: string | 'broadcast' | 'tier',
    type: MessageType,
    payload: any,
    priority: MessagePriority = MessagePriority.NORMAL,
    correlationId?: string
  ): void {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      type,
      sender: this.agentId,
      recipient,
      timestamp: new Date(),
      payload,
      priority,
      ttl: this.getTTLForPriority(priority),
      correlationId
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessageNow(message);
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Send task result
   */
  public sendTaskResult(workflowId: string, stepId: string, result: any, success: boolean): void {
    this.sendMessage(
      'broadcast',
      MessageType.TASK_RESULT,
      {
        workflowId,
        stepId,
        result,
        success,
        agentId: this.agentId,
        timestamp: new Date()
      },
      MessagePriority.HIGH,
      workflowId
    );
  }

  /**
   * Update agent status
   */
  public updateStatus(status: AgentStatus, load?: number): void {
    this.status = status;
    if (load !== undefined) {
      this.load = Math.max(0, Math.min(100, load));
    }

    this.sendMessage(
      'broadcast',
      MessageType.STATUS_UPDATE,
      {
        status: this.status,
        load: this.load,
        activeWorkflows: this.activeWorkflows
      },
      MessagePriority.NORMAL
    );
  }

  /**
   * Report error to coordination tier
   */
  public reportError(error: Error, context?: any): void {
    this.sendMessage(
      'tier',
      MessageType.ERROR_REPORT,
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        targetTier: 'SWARM_COORDINATOR',
        severity: 'error',
        timestamp: new Date()
      },
      MessagePriority.HIGH
    );
  }

  /**
   * Request resources from coordination tier
   */
  public requestResources(resourceType: string, amount: number, reason: string): void {
    this.sendMessage(
      'tier',
      MessageType.RESOURCE_REQUEST,
      {
        resourceType,
        amount,
        reason,
        targetTier: 'SWARM_COORDINATOR',
        currentLoad: this.load,
        capabilities: this.capabilities
      },
      MessagePriority.NORMAL
    );
  }

  /**
   * Add active workflow
   */
  public addActiveWorkflow(workflowId: string): void {
    if (!this.activeWorkflows.includes(workflowId)) {
      this.activeWorkflows.push(workflowId);
      this.updateStatus(AgentStatus.BUSY);
    }
  }

  /**
   * Remove active workflow
   */
  public removeActiveWorkflow(workflowId: string): void {
    const index = this.activeWorkflows.indexOf(workflowId);
    if (index !== -1) {
      this.activeWorkflows.splice(index, 1);

      if (this.activeWorkflows.length === 0) {
        this.updateStatus(AgentStatus.IDLE);
      }
    }
  }

  private handleIncomingMessage(data: WebSocket.RawData): void {
    try {
      const message: AgentMessage = JSON.parse(data.toString());
      this.processIncomingMessage(message);
    } catch (error) {
      this.logger.error('Failed to parse incoming message:', error);
    }
  }

  private processIncomingMessage(message: AgentMessage): void {
    this.logger.debug(`📨 Received ${message.type} from ${message.sender}`);

    // Emit message event for application handling
    this.emit('message', message);

    // Handle specific message types
    switch (message.type) {
      case MessageType.COORDINATION:
        this.handleCoordinationMessage(message);
        break;

      case MessageType.TASK_ASSIGNMENT:
        this.handleTaskAssignment(message);
        break;

      case MessageType.WORKFLOW_EVENT:
        this.handleWorkflowEvent(message);
        break;

      case MessageType.SHUTDOWN:
        this.handleShutdownRequest(message);
        break;

      default:
        // Forward to application layer
        this.emit(`message:${message.type}`, message);
    }
  }

  private handleCoordinationMessage(message: AgentMessage): void {
    if (message.payload.action === 'welcome') {
      this.logger.info('🎉 Received welcome message from hub');
      this.emit('connected', {
        topology: message.payload.topology,
        assignedTier: message.payload.assignedTier
      });
    }
  }

  private handleTaskAssignment(message: AgentMessage): void {
    const { workflowId, stepId, task } = message.payload;

    this.addActiveWorkflow(workflowId);
    this.emit('task_assigned', {
      workflowId,
      stepId,
      task,
      correlationId: message.correlationId
    });
  }

  private handleWorkflowEvent(message: AgentMessage): void {
    const { event, workflowId } = message.payload;

    if (event === 'workflow_completed' || event === 'workflow_failed') {
      this.removeActiveWorkflow(workflowId);
    }

    this.emit('workflow_event', message.payload);
  }

  private handleShutdownRequest(message: AgentMessage): void {
    this.logger.warn('🛑 Received shutdown request');
    this.emit('shutdown_requested', message.payload);

    // Graceful shutdown
    setTimeout(() => {
      this.disconnect();
    }, 1000);
  }

  private handleDisconnection(code: number, reason: string): void {
    this.isConnected = false;
    this.status = AgentStatus.OFFLINE;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.logger.warn(`🔌 Disconnected from hub (${code}): ${reason}`);
    this.emit('disconnected', { code, reason });

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnection();
    }
  }

  private handleConnectionError(error: Error): void {
    this.logger.error('Connection error:', error);
    this.emit('connection_error', error);
  }

  private attemptReconnection(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.logger.info(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection failed:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.logger.error('🚫 Max reconnection attempts reached');
          this.emit('reconnection_failed');
        }
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 10000); // Every 10 seconds
  }

  private sendHeartbeat(): void {
    const heartbeat: AgentHeartbeat = {
      agentId: this.agentId,
      timestamp: new Date(),
      status: this.status,
      load: this.load,
      capabilities: this.capabilities,
      activeWorkflows: this.activeWorkflows,
      networkLatency: 0, // TODO: Calculate actual latency
      lastActivity: new Date()
    };

    this.sendMessage(
      'broadcast',
      MessageType.HEARTBEAT,
      heartbeat,
      MessagePriority.BACKGROUND
    );
  }

  private sendCapabilityBroadcast(): void {
    this.sendMessage(
      'tier',
      MessageType.CAPABILITY_BROADCAST,
      {
        capabilities: this.capabilities,
        targetTier: 'SWARM_COORDINATOR'
      },
      MessagePriority.NORMAL
    );
  }

  private sendMessageNow(message: AgentMessage): void {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        this.logger.debug(`📤 Sent ${message.type} to ${message.recipient}`);
      }
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      this.queueMessage(message);
    }
  }

  private queueMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    this.logger.debug(`📋 Queued ${message.type} message (queue size: ${this.messageQueue.length})`);
  }

  private processQueuedMessages(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()!;

      // Check if message has expired
      const age = Date.now() - message.timestamp.getTime();
      if (age > message.ttl) {
        this.logger.warn(`⏰ Dropping expired message: ${message.id}`);
        continue;
      }

      this.sendMessageNow(message);
    }
  }

  private getTTLForPriority(priority: MessagePriority): number {
    switch (priority) {
      case MessagePriority.CRITICAL: return 5000;   // 5 seconds
      case MessagePriority.HIGH: return 30000;      // 30 seconds
      case MessagePriority.NORMAL: return 60000;    // 1 minute
      case MessagePriority.LOW: return 300000;      // 5 minutes
      case MessagePriority.BACKGROUND: return 600000; // 10 minutes
      default: return 60000;
    }
  }

  private generateMessageId(): string {
    return `${this.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // ==========================================
  // PUBLIC API METHODS
  // ==========================================

  /**
   * Get agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent load
   */
  public getLoad(): number {
    return this.load;
  }

  /**
   * Get active workflows
   */
  public getActiveWorkflows(): string[] {
    return [...this.activeWorkflows];
  }

  /**
   * Check if connected
   */
  public isConnectedToHub(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection info
   */
  public getConnectionInfo(): any {
    return {
      agentId: this.agentId,
      tier: this.tier,
      capabilities: this.capabilities,
      status: this.status,
      load: this.load,
      connected: this.isConnected,
      activeWorkflows: this.activeWorkflows.length,
      queuedMessages: this.messageQueue.length
    };
  }
}

export default AgentClient;
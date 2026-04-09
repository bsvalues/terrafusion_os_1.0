/**
 * Agent Communication Protocol
 * 
 * This module defines a structured communication protocol for agents
 * to coordinate and exchange information within the extension system.
 */

import { EventEmitter } from 'events';

/**
 * Types of messages that can be exchanged between agents
 */
export enum AgentMessageType {
  QUERY = 'query',             // Request for information
  RESPONSE = 'response',       // Response to a query
  NOTIFICATION = 'notification', // One-way information sharing
  ACTION = 'action',           // Request to perform an action
  RESULT = 'result',           // Result of an action
  ERROR = 'error',             // Error notification
  CAPABILITY = 'capability',   // Capability advertisement
  COORDINATION = 'coordination' // Coordination message
}

/**
 * Priority levels for messages
 */
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

/**
 * Status of a message
 */
export enum MessageStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

/**
 * Message envelope for agent communication
 */
export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  senderId: string;
  recipientId: string | 'broadcast';
  topic: string;
  priority: MessagePriority;
  timestamp: number;
  expiresAt?: number;
  correlationId?: string;
  payload: any;
  status: MessageStatus;
}

/**
 * Agent capability advertisement
 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  topics: string[];
  actions: string[];
  schema?: any;  // JSON Schema for the capability
}

/**
 * Configuration for the agent protocol
 */
export interface AgentProtocolConfig {
  timeoutMs: number;
  retries: number;
  logMessages: boolean;
  broadcastEnabled: boolean;
}

/**
 * Agent protocol for structured communication between agents
 */
export class AgentProtocol {
  private static instance: AgentProtocol;
  private eventEmitter: EventEmitter;
  private messageLog: AgentMessage[] = [];
  private capabilities: Map<string, Map<string, AgentCapability>> = new Map();
  private config: AgentProtocolConfig;
  
  /**
   * Initialize the agent protocol
   */
  private constructor(config?: Partial<AgentProtocolConfig>) {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(50); // Allow many listeners for broadcast scenarios
    
    this.config = {
      timeoutMs: config?.timeoutMs || 30000,
      retries: config?.retries || 3,
      logMessages: config?.logMessages || true,
      broadcastEnabled: config?.broadcastEnabled || true
    };
  }
  
  /**
   * Get the singleton instance of the agent protocol
   */
  public static getInstance(config?: Partial<AgentProtocolConfig>): AgentProtocol {
    if (!AgentProtocol.instance) {
      AgentProtocol.instance = new AgentProtocol(config);
    }
    return AgentProtocol.instance;
  }
  
  /**
   * Send a message to another agent
   * 
   * @param message Message to send
   * @returns Promise that resolves when the message is delivered
   */
  public async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const id = this.generateId();
    const fullMessage: AgentMessage = {
      ...message,
      id,
      timestamp: Date.now(),
      status: MessageStatus.PENDING
    };
    
    // Log the message if enabled
    if (this.config.logMessages) {
      this.messageLog.push(fullMessage);
    }
    
    // Handle broadcast messages
    if (message.recipientId === 'broadcast') {
      if (!this.config.broadcastEnabled) {
        throw new Error('Broadcast messages are disabled');
      }
      
      // Emit the message on the broadcast channel
      this.eventEmitter.emit(`broadcast:${message.topic}`, fullMessage);
      
      // Update status to delivered
      fullMessage.status = MessageStatus.DELIVERED;
      return id;
    }
    
    // Direct message to a specific recipient
    this.eventEmitter.emit(`agent:${message.recipientId}:${message.topic}`, fullMessage);
    
    // Update status to delivered
    fullMessage.status = MessageStatus.DELIVERED;
    return id;
  }
  
  /**
   * Query another agent and wait for a response
   * 
   * @param query Query message
   * @returns Promise that resolves with the response
   */
  public async queryAgent(query: Omit<AgentMessage, 'id' | 'timestamp' | 'status' | 'type'>): Promise<AgentMessage> {
    // Set the message type to QUERY
    const messageId = await this.sendMessage({
      ...query,
      type: AgentMessageType.QUERY
    });
    
    // Wait for the response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.eventEmitter.removeListener(`response:${messageId}`, responseHandler);
        reject(new Error(`Query timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);
      
      const responseHandler = (response: AgentMessage) => {
        clearTimeout(timeout);
        resolve(response);
      };
      
      this.eventEmitter.once(`response:${messageId}`, responseHandler);
    });
  }
  
  /**
   * Respond to a query
   * 
   * @param originalMessageId ID of the original message
   * @param response Response payload
   */
  public async respondToQuery(originalMessageId: string, senderId: string, payload: any): Promise<void> {
    // Find the original message
    const originalMessage = this.messageLog.find(m => m.id === originalMessageId);
    if (!originalMessage) {
      throw new Error(`Original message ${originalMessageId} not found`);
    }
    
    // Create and send the response
    const responseMessage: AgentMessage = {
      id: this.generateId(),
      type: AgentMessageType.RESPONSE,
      senderId,
      recipientId: originalMessage.senderId,
      topic: originalMessage.topic,
      priority: originalMessage.priority,
      timestamp: Date.now(),
      correlationId: originalMessageId,
      payload,
      status: MessageStatus.COMPLETED
    };
    
    // Log the message if enabled
    if (this.config.logMessages) {
      this.messageLog.push(responseMessage);
    }
    
    // Emit the response event
    this.eventEmitter.emit(`response:${originalMessageId}`, responseMessage);
  }
  
  /**
   * Subscribe to messages on a specific topic
   * 
   * @param agentId Agent ID
   * @param topic Topic to subscribe to
   * @param callback Callback to execute when a message is received
   * @returns Unsubscribe function
   */
  public subscribe(agentId: string, topic: string, callback: (message: AgentMessage) => void): () => void {
    const handler = (message: AgentMessage) => {
      // Update message status to processing
      message.status = MessageStatus.PROCESSING;
      callback(message);
    };
    
    // Listen for direct messages
    this.eventEmitter.on(`agent:${agentId}:${topic}`, handler);
    
    // Listen for broadcast messages
    this.eventEmitter.on(`broadcast:${topic}`, handler);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(`agent:${agentId}:${topic}`, handler);
      this.eventEmitter.off(`broadcast:${topic}`, handler);
    };
  }
  
  /**
   * Register an agent's capabilities
   * 
   * @param agentId Agent ID
   * @param capabilities Array of capabilities
   */
  public registerCapabilities(agentId: string, capabilities: AgentCapability[]): void {
    const agentCapabilities = new Map<string, AgentCapability>();
    
    capabilities.forEach(capability => {
      agentCapabilities.set(capability.id, capability);
    });
    
    this.capabilities.set(agentId, agentCapabilities);
  }
  
  /**
   * Unregister an agent's capabilities
   * 
   * @param agentId Agent ID
   */
  public unregisterCapabilities(agentId: string): void {
    this.capabilities.delete(agentId);
  }
  
  /**
   * Find agents with specific capabilities
   * 
   * @param topicOrAction Topic or action capability to search for
   * @returns Array of agent IDs
   */
  public findAgentsWithCapability(topicOrAction: string): string[] {
    const result: string[] = [];
    
    this.capabilities.forEach((agentCapabilities, agentId) => {
      agentCapabilities.forEach(capability => {
        if (
          capability.topics.includes(topicOrAction) ||
          capability.actions.includes(topicOrAction)
        ) {
          result.push(agentId);
        }
      });
    });
    
    return result;
  }
  
  /**
   * Get all capabilities for a specific agent
   * 
   * @param agentId Agent ID
   * @returns Map of capabilities
   */
  public getAgentCapabilities(agentId: string): Map<string, AgentCapability> | undefined {
    return this.capabilities.get(agentId);
  }
  
  /**
   * Get all capabilities for all agents
   * 
   * @returns Map of agent IDs to capabilities
   */
  public getAllCapabilities(): Map<string, Map<string, AgentCapability>> {
    return this.capabilities;
  }
  
  /**
   * Generate a unique ID
   * 
   * @returns Unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
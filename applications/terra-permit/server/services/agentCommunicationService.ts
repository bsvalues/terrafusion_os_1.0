/**
 * Agent Communication Service
 * 
 * Implements the IAgentCommunication interface for agent messaging.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as WebSocket from 'ws';
import { log } from '../vite';

import {
  BaseMessage,
  MessageType
} from '@shared/mcp/agents/schemas';

import {
  BaseAgentCommunication,
  IAgentCommunication
} from '@shared/mcp/agents/communication';

/**
 * In-memory implementation of agent communication
 */
export class AgentCommunicationService extends BaseAgentCommunication {
  private messages: BaseMessage[] = [];
  private eventEmitter: EventEmitter = new EventEmitter();
  private wsClients: Map<string, WebSocket.WebSocket> = new Map();
  private static readonly MESSAGE_EVENT = 'message';
  private static readonly MAX_HISTORY = 1000; // Maximum number of messages to keep in memory
  
  constructor() {
    super();
    log('Agent Communication Service initialized', 'agent-communication');
  }
  
  /**
   * Send a message
   */
  async sendMessage(message: BaseMessage): Promise<void> {
    // Store the message
    this.messages.push(message);
    
    // Trim message history if needed
    if (this.messages.length > AgentCommunicationService.MAX_HISTORY) {
      this.messages = this.messages.slice(-AgentCommunicationService.MAX_HISTORY);
    }
    
    // Emit the message event
    this.eventEmitter.emit(AgentCommunicationService.MESSAGE_EVENT, message);
    
    // Send to WebSocket clients if recipients are specified
    if (message.recipients && message.recipients.length > 0) {
      for (const recipientId of message.recipients) {
        const client = this.wsClients.get(recipientId);
        if (client && client.readyState === WebSocket.WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    } else {
      // Broadcast to all connected clients
      Array.from(this.wsClients.entries()).forEach(([_, client]) => {
        if (client.readyState === WebSocket.WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
    
    log(`Message sent: ${message.type} from ${message.sender} (ID: ${message.id})`, 'agent-communication');
  }

  /**
   * Subscribe to all messages
   */
  subscribeToMessages(callback: (message: BaseMessage) => void): () => void {
    this.eventEmitter.on(AgentCommunicationService.MESSAGE_EVENT, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(AgentCommunicationService.MESSAGE_EVENT, callback);
    };
  }

  /**
   * Get message history
   */
  async getMessageHistory(limit: number = 100, offset: number = 0): Promise<BaseMessage[]> {
    // Apply pagination
    const start = Math.max(0, this.messages.length - offset - limit);
    const end = Math.min(this.messages.length, start + limit);
    
    return this.messages.slice(start, end);
  }

  /**
   * Get a message by its ID
   */
  async getMessageById(messageId: string): Promise<BaseMessage | null> {
    const message = this.messages.find(m => m.id === messageId);
    return message || null;
  }

  /**
   * Get messages by correlation ID
   */
  async getMessagesByCorrelationId(correlationId: string): Promise<BaseMessage[]> {
    return this.messages.filter(m => m.correlationId === correlationId);
  }
  
  /**
   * Register a WebSocket client for an agent
   */
  registerWebSocketClient(agentId: string, client: WebSocket.WebSocket): void {
    this.wsClients.set(agentId, client);
    log(`WebSocket client registered for agent ${agentId}`, 'agent-communication');
    
    // Set up message handler
    client.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as BaseMessage;
        
        // Validate the message has required fields
        if (!message.id || !message.type || !message.sender) {
          throw new Error('Invalid message format');
        }
        
        // If the sender doesn't match the registered agent ID, reject the message
        if (message.sender !== agentId) {
          throw new Error('Sender ID mismatch');
        }
        
        // Process the received message
        this.sendMessage(message);
      } catch (error) {
        log(`Error processing WebSocket message: ${error}`, 'agent-communication');
        
        // Send error back to client
        const errorMessage = {
          id: uuidv4(),
          type: MessageType.ERROR,
          timestamp: new Date(),
          sender: 'system',
          recipients: [agentId],
          error: {
            code: 'invalid_message',
            message: `Invalid message format: ${error}`,
            recoverable: true,
            retryable: false
          }
        };
        
        client.send(JSON.stringify(errorMessage));
      }
    });
    
    // Handle disconnect
    client.on('close', () => {
      this.wsClients.delete(agentId);
      log(`WebSocket client disconnected for agent ${agentId}`, 'agent-communication');
    });
  }
  
  /**
   * Unregister a WebSocket client
   */
  unregisterWebSocketClient(agentId: string): void {
    const client = this.wsClients.get(agentId);
    
    if (client) {
      client.terminate();
      this.wsClients.delete(agentId);
      log(`WebSocket client unregistered for agent ${agentId}`, 'agent-communication');
    }
  }
}
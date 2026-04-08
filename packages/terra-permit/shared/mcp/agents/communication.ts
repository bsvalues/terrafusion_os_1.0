/**
 * Model Content Protocol - Agent Communication Interface
 * 
 * Defines standardized communication patterns for agent interaction.
 */

import {
  BaseMessage,
  TaskRequest,
  TaskResponse,
  ErrorMessage,
  HeartbeatMessage,
  WorkflowEvent,
  MessageType
} from './schemas';

/**
 * Interface for agent message handlers
 */
export interface IAgentCommunication {
  // Message sending
  sendMessage(message: BaseMessage): Promise<void>;
  sendTaskRequest(request: TaskRequest): Promise<void>;
  sendTaskResponse(response: TaskResponse): Promise<void>;
  sendErrorMessage(error: ErrorMessage): Promise<void>;
  sendHeartbeat(heartbeat: HeartbeatMessage): Promise<void>;
  sendWorkflowEvent(event: WorkflowEvent): Promise<void>;
  
  // Message receiving
  subscribeToMessages(callback: (message: BaseMessage) => void): () => void;
  subscribeToTaskRequests(callback: (request: TaskRequest) => void): () => void;
  subscribeToTaskResponses(callback: (response: TaskResponse) => void): () => void;
  subscribeToErrorMessages(callback: (error: ErrorMessage) => void): () => void;
  subscribeToHeartbeats(callback: (heartbeat: HeartbeatMessage) => void): () => void;
  subscribeToWorkflowEvents(callback: (event: WorkflowEvent) => void): () => void;
  
  // Filtering options
  subscribeToMessagesForAgent(agentId: string, callback: (message: BaseMessage) => void): () => void;
  subscribeToMessagesOfType(type: MessageType, callback: (message: BaseMessage) => void): () => void;
  
  // Message retrieval
  getMessageHistory(limit?: number, offset?: number): Promise<BaseMessage[]>;
  getMessageById(messageId: string): Promise<BaseMessage | null>;
  getMessagesByCorrelationId(correlationId: string): Promise<BaseMessage[]>;
}

/**
 * Abstract base class that handles common agent communication functionality
 */
export abstract class BaseAgentCommunication implements IAgentCommunication {
  /**
   * Send a message
   */
  abstract sendMessage(message: BaseMessage): Promise<void>;
  
  /**
   * Send a task request
   */
  async sendTaskRequest(request: TaskRequest): Promise<void> {
    await this.sendMessage(request);
  }
  
  /**
   * Send a task response
   */
  async sendTaskResponse(response: TaskResponse): Promise<void> {
    await this.sendMessage(response);
  }
  
  /**
   * Send an error message
   */
  async sendErrorMessage(error: ErrorMessage): Promise<void> {
    await this.sendMessage(error);
  }
  
  /**
   * Send a heartbeat message
   */
  async sendHeartbeat(heartbeat: HeartbeatMessage): Promise<void> {
    await this.sendMessage(heartbeat);
  }
  
  /**
   * Send a workflow event
   */
  async sendWorkflowEvent(event: WorkflowEvent): Promise<void> {
    await this.sendMessage(event);
  }
  
  /**
   * Subscribe to all messages
   */
  abstract subscribeToMessages(callback: (message: BaseMessage) => void): () => void;
  
  /**
   * Subscribe to task requests
   */
  subscribeToTaskRequests(callback: (request: TaskRequest) => void): () => void {
    return this.subscribeToMessagesOfType(MessageType.TASK_REQUEST, (message) => {
      callback(message as TaskRequest);
    });
  }
  
  /**
   * Subscribe to task responses
   */
  subscribeToTaskResponses(callback: (response: TaskResponse) => void): () => void {
    return this.subscribeToMessagesOfType(MessageType.TASK_RESPONSE, (message) => {
      callback(message as TaskResponse);
    });
  }
  
  /**
   * Subscribe to error messages
   */
  subscribeToErrorMessages(callback: (error: ErrorMessage) => void): () => void {
    return this.subscribeToMessagesOfType(MessageType.ERROR, (message) => {
      callback(message as ErrorMessage);
    });
  }
  
  /**
   * Subscribe to heartbeat messages
   */
  subscribeToHeartbeats(callback: (heartbeat: HeartbeatMessage) => void): () => void {
    return this.subscribeToMessagesOfType(MessageType.HEARTBEAT, (message) => {
      callback(message as HeartbeatMessage);
    });
  }
  
  /**
   * Subscribe to workflow events
   */
  subscribeToWorkflowEvents(callback: (event: WorkflowEvent) => void): () => void {
    const workflowEventTypes = [
      MessageType.WORKFLOW_START,
      MessageType.WORKFLOW_END,
      MessageType.WORKFLOW_PROGRESS
    ];
    
    // Create array of unsubscribe functions
    const unsubscribes = workflowEventTypes.map(type => 
      this.subscribeToMessagesOfType(type, (message) => {
        callback(message as WorkflowEvent);
      })
    );
    
    // Return combined unsubscribe function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Subscribe to messages for a specific agent
   */
  subscribeToMessagesForAgent(agentId: string, callback: (message: BaseMessage) => void): () => void {
    return this.subscribeToMessages((message) => {
      if (message.sender === agentId || 
          (message.recipients && message.recipients.includes(agentId))) {
        callback(message);
      }
    });
  }
  
  /**
   * Subscribe to messages of a specific type
   */
  subscribeToMessagesOfType(type: MessageType, callback: (message: BaseMessage) => void): () => void {
    return this.subscribeToMessages((message) => {
      if (message.type === type) {
        callback(message);
      }
    });
  }
  
  /**
   * Get message history
   */
  abstract getMessageHistory(limit?: number, offset?: number): Promise<BaseMessage[]>;
  
  /**
   * Get a message by its ID
   */
  abstract getMessageById(messageId: string): Promise<BaseMessage | null>;
  
  /**
   * Get messages by correlation ID
   */
  abstract getMessagesByCorrelationId(correlationId: string): Promise<BaseMessage[]>;
}
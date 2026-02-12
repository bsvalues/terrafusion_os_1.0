/**
 * BaseAgent Abstract Class
 * 
 * This abstract class provides the foundation for all agents in the system.
 * It implements core functionality like message handling, metrics collection,
 * learning capabilities, and standardized communication with the MCP.
 */

import {
  AgentMessage,
  AgentExperience,
  AgentStatus,
  AgentType,
  EventType,
  ErrorCode
} from '../shared/agentProtocol';

/**
 * Map of capabilities to the agents that provide them
 */
export type CapabilityMap = Map<string, Set<string>>;

/**
 * Message handler type for handling agent messages
 */
export type MessageHandler = (message: AgentMessage) => Promise<void>;

/**
 * Interface for agent implementations
 */
export interface IAgent {
  // Core agent functionality
  processRequest(request: any): Promise<any>;
  sendMessage(message: AgentMessage): void;
  handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void>;
  learn(experiences: AgentExperience[]): Promise<void>;
  
  // Agent identification
  getAgentId(): string;
  getAgentType(): AgentType;
  getCapabilities(): string[];
  
  // Message handling
  onMessage(message: AgentMessage): Promise<void>;
  setMessageHandler(handler: MessageHandler): void;
  
  // Metrics
  getMetrics(): any;
  getStatus(): AgentStatus;
}

/**
 * Abstract base class for all agents
 */
export abstract class BaseAgent implements IAgent {
  protected agentId: string;
  protected agentType: AgentType;
  protected capabilities: string[] = [];
  protected startTime: Date;
  protected lastActivity: Date;
  protected messageHandler: MessageHandler | null = null;
  
  // Performance metrics
  protected metrics = {
    requestsReceived: 0,
    requestsProcessed: 0,
    requestsFailed: 0,
    helpRequestsReceived: 0,
    helpRequestsProvided: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    messagesSent: 0,
    messagesReceived: 0,
    lastErrors: [] as string[]
  };
  
  // Active tasks tracking
  private activeRequests = new Map<string, {
    startTime: number;
    type: string;
    data: any;
  }>();
  
  /**
   * Create a new base agent
   * @param agentId Unique ID for this agent
   * @param agentType Type of agent
   */
  constructor(agentId: string, agentType: AgentType) {
    this.agentId = agentId;
    this.agentType = agentType;
    this.startTime = new Date();
    this.lastActivity = new Date();
  }
  
  /**
   * Process a request sent to this agent
   * @param request The request to process
   * @returns Promise resolving to the result
   */
  public abstract processRequest(request: any): Promise<any>;
  
  /**
   * Send a message to another agent or the MCP
   * @param message The message to send
   */
  public sendMessage(message: AgentMessage): void {
    this.metrics.messagesSent++;
    
    if (this.messageHandler) {
      this.messageHandler(message);
    } else {
      console.warn(`${this.agentId} has no message handler configured`);
    }
  }
  
  /**
   * Handle a help request from another agent
   * @param helpRequest The help request payload
   * @param requestingAgentId ID of the agent requesting help
   * @returns Promise resolving when help is provided
   */
  public async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    // Base implementation - should be overridden by specific agents
    console.log(`${this.agentId} received help request from ${requestingAgentId} but doesn't know how to handle it`);
  }
  
  /**
   * Learn from a set of experiences
   * @param experiences The experiences to learn from
   * @returns Promise resolving when learning is complete
   */
  public async learn(experiences: AgentExperience[]): Promise<void> {
    // Base implementation - should be overridden by specific agents
    console.log(`${this.agentId} received ${experiences.length} experiences but doesn't know how to learn from them`);
  }
  
  /**
   * Get the agent's unique ID
   * @returns The agent ID
   */
  public getAgentId(): string {
    return this.agentId;
  }
  
  /**
   * Get the agent's type
   * @returns The agent type
   */
  public getAgentType(): AgentType {
    return this.agentType;
  }
  
  /**
   * Get the agent's capabilities
   * @returns Array of capability strings
   */
  public getCapabilities(): string[] {
    return this.capabilities;
  }
  
  /**
   * Handle a received message
   * @param message The received message
   * @returns Promise resolving when message is handled
   */
  public async onMessage(message: AgentMessage): Promise<void> {
    this.metrics.messagesReceived++;
    this.lastActivity = new Date();
    
    // Handle message based on event type
    try {
      switch (message.eventType) {
        case EventType.REQUEST:
          await this.handleRequestMessage(message);
          break;
          
        case EventType.ASSISTANCE_REQUESTED:
          await this.handleAssistanceRequestMessage(message);
          break;
          
        case EventType.LEARNING_TRIGGERED:
          await this.handleLearningMessage(message);
          break;
          
        case EventType.COMMAND:
          await this.handleCommandMessage(message);
          break;
          
        case EventType.BROADCAST:
          // Simply acknowledge broadcasts
          this.sendMessage({
            messageId: crypto.randomUUID(),
            correlationId: message.correlationId,
            sourceAgentId: this.agentId,
            targetAgentId: message.sourceAgentId,
            timestamp: new Date().toISOString(),
            eventType: EventType.STATUS_UPDATE,
            payload: {
              status: 'received',
              message: `Received broadcast from ${message.sourceAgentId}`
            }
          });
          break;
          
        default:
          // Ignore other message types
          break;
      }
    } catch (error) {
      console.error(`Error handling message in ${this.agentId}:`, error);
      
      // Report error to sender
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: message.correlationId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: `Error handling message: ${(error as Error).message}`,
          originalMessage: message.messageId
        }
      });
    }
  }
  
  /**
   * Set the message handler for this agent
   * @param handler The message handler function
   */
  public setMessageHandler(handler: MessageHandler): void {
    this.messageHandler = handler;
  }
  
  /**
   * Get the agent's performance metrics
   * @returns Metrics object
   */
  public getMetrics(): any {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime.getTime(),
      activeRequests: this.activeRequests.size
    };
  }
  
  /**
   * Get the agent's current status
   * @returns Agent status object
   */
  public getStatus(): AgentStatus {
    const activeRequestCount = this.activeRequests.size;
    
    // Calculate success and error rates
    const totalRequests = this.metrics.requestsProcessed + this.metrics.requestsFailed;
    const successRate = totalRequests > 0 ? this.metrics.requestsProcessed / totalRequests : 1;
    const errorRate = totalRequests > 0 ? this.metrics.requestsFailed / totalRequests : 0;
    
    // Determine overall status
    let status: 'healthy' | 'degraded' | 'error' = 'healthy';
    if (errorRate > 0.5) {
      status = 'error';
    } else if (errorRate > 0.2 || this.metrics.lastErrors.length > 3) {
      status = 'degraded';
    }
    
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      status,
      lastActivity: this.lastActivity.toISOString(),
      activeRequests: activeRequestCount,
      metrics: {
        avgResponseTime: this.metrics.averageResponseTime,
        successRate,
        errorRate,
        requestsProcessed: this.metrics.requestsProcessed
      },
      errors: this.metrics.lastErrors.length > 0 ? this.metrics.lastErrors : undefined
    };
  }
  
  /**
   * Register a capability
   * @param capability The capability to register
   */
  protected registerCapability(capability: string): void {
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
    }
  }
  
  /**
   * Handle a request message
   * @param message The request message
   */
  private async handleRequestMessage(message: AgentMessage): Promise<void> {
    this.metrics.requestsReceived++;
    const requestId = message.correlationId;
    
    try {
      // Track the request
      this.activeRequests.set(requestId, {
        startTime: Date.now(),
        type: 'request',
        data: message.payload
      });
      
      // Process the request
      const result = await this.processRequest(message.payload);
      
      // Send response
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: requestId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.RESPONSE,
        payload: {
          status: 'success',
          result
        }
      });
      
      // Update metrics
      this.metrics.requestsProcessed++;
      this.updateResponseTimeMetrics(requestId);
      
    } catch (error) {
      // Update error metrics
      this.metrics.requestsFailed++;
      this.addError(`Request processing error: ${(error as Error).message}`);
      
      // Send error response
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: requestId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: (error as Error).message,
          originalRequest: message.payload
        }
      });
    } finally {
      // Remove from active requests
      this.activeRequests.delete(requestId);
    }
  }
  
  /**
   * Handle an assistance request message
   * @param message The assistance request message
   */
  private async handleAssistanceRequestMessage(message: AgentMessage): Promise<void> {
    this.metrics.helpRequestsReceived++;
    const requestId = message.correlationId;
    
    try {
      // Track the request
      this.activeRequests.set(requestId, {
        startTime: Date.now(),
        type: 'assistance',
        data: message.payload
      });
      
      // Process the assistance request
      await this.handleHelpRequest(message.payload, message.sourceAgentId);
      
      // Do not send a direct response - the handleHelpRequest method should send responses
      
    } catch (error) {
      // Update error metrics
      this.addError(`Help request processing error: ${(error as Error).message}`);
      
      // Send error response
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: requestId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: (error as Error).message,
          originalRequest: message.payload
        }
      });
    } finally {
      // Remove from active requests
      this.activeRequests.delete(requestId);
    }
  }
  
  /**
   * Handle a learning message
   * @param message The learning message
   */
  private async handleLearningMessage(message: AgentMessage): Promise<void> {
    try {
      // Extract experiences
      const experiences = message.payload.experiences;
      
      if (!Array.isArray(experiences)) {
        throw new Error('Invalid learning experiences format');
      }
      
      // Trigger learning
      await this.learn(experiences);
      
      // Send acknowledgment
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: message.correlationId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.STATUS_UPDATE,
        payload: {
          status: 'success',
          learningCompleted: true,
          experiencesProcessed: experiences.length
        }
      });
      
    } catch (error) {
      this.addError(`Learning error: ${(error as Error).message}`);
      
      // Send error response
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: message.correlationId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: `Error during learning: ${(error as Error).message}`
        }
      });
    }
  }
  
  /**
   * Handle a command message
   * @param message The command message
   */
  private async handleCommandMessage(message: AgentMessage): Promise<void> {
    const commandId = message.correlationId;
    const command = message.payload.command;
    const params = message.payload.parameters || {};
    
    try {
      let result: any;
      
      // Handle common commands
      switch (command) {
        case 'get_status':
          result = this.getStatus();
          break;
          
        case 'get_metrics':
          result = this.getMetrics();
          break;
          
        case 'get_capabilities':
          result = this.getCapabilities();
          break;
          
        case 'reset_metrics':
          this.resetMetrics();
          result = { status: 'metrics_reset' };
          break;
          
        default:
          // Unknown command
          throw new Error(`Unknown command: ${command}`);
      }
      
      // Send response
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: commandId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.COMMAND_RESULT,
        payload: {
          status: 'success',
          command,
          result
        }
      });
      
    } catch (error) {
      this.addError(`Command error: ${(error as Error).message}`);
      
      // Send error response
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: commandId,
        sourceAgentId: this.agentId,
        targetAgentId: message.sourceAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: `Error executing command: ${(error as Error).message}`,
          command
        }
      });
    }
  }
  
  /**
   * Record successful result and metrics
   * @param result The result data
   * @param processingTime Time taken to process in ms
   * @param tags Optional tags for categorization
   * @param correlationId Optional correlation ID
   */
  protected reportResult(result: any, processingTime: number, tags?: string[], correlationId?: string): void {
    // Update metrics
    this.metrics.requestsProcessed++;
    
    // Update average response time
    const newTotalTime = this.metrics.totalResponseTime + processingTime;
    const newCount = this.metrics.requestsProcessed;
    this.metrics.totalResponseTime = newTotalTime;
    this.metrics.averageResponseTime = newTotalTime / newCount;
  }
  
  /**
   * Record an error
   * @param error The error that occurred
   * @param taskId ID of the task that failed
   * @param correlationId Optional correlation ID
   */
  protected reportError(error: Error, taskId: string, correlationId?: string): void {
    // Update metrics
    this.metrics.requestsFailed++;
    
    // Add to last errors
    this.addError(`Task ${taskId}: ${error.message}`);
  }
  
  /**
   * Request help from another agent
   * @param problemDescription Description of the problem
   * @param taskId ID of the task needing help
   * @param priority Priority level (1-3, higher is more important)
   * @param errorDetails Detailed error information
   * @param contextData Additional context data
   */
  protected requestHelp(
    problemDescription: string,
    taskId: string,
    priority: number = 1,
    errorDetails?: string,
    contextData?: any
  ): void {
    // Send help request message to MCP
    this.sendMessage({
      messageId: crypto.randomUUID(),
      correlationId: taskId,
      sourceAgentId: this.agentId,
      targetAgentId: 'MCP', // MCP will route to appropriate agent
      timestamp: new Date().toISOString(),
      eventType: EventType.ASSISTANCE_REQUESTED,
      payload: {
        problemDescription,
        taskId,
        priority,
        errorDetails,
        contextData,
        requiredCapabilities: this.determineRequiredCapabilities(problemDescription, errorDetails)
      }
    });
  }
  
  /**
   * Determine what capabilities might be needed to solve a problem
   * @param problemDescription The problem description
   * @param errorDetails Optional error details
   * @returns Array of capability strings
   */
  private determineRequiredCapabilities(problemDescription: string, errorDetails?: string): string[] {
    const requiredCapabilities: string[] = [];
    
    // This is a simple keyword-based capability matching system
    // In a real system, this would be more sophisticated
    
    const lowerProblem = problemDescription.toLowerCase();
    const lowerError = errorDetails ? errorDetails.toLowerCase() : '';
    
    // Data-related capabilities
    if (lowerProblem.includes('data') || lowerProblem.includes('validation') || 
        lowerError.includes('data') || lowerError.includes('validation')) {
      requiredCapabilities.push('data_validation');
      requiredCapabilities.push('data_quality_analysis');
    }
    
    // Analysis-related capabilities
    if (lowerProblem.includes('analysis') || lowerProblem.includes('insight') || 
        lowerError.includes('analysis')) {
      requiredCapabilities.push('insight_generation');
      requiredCapabilities.push('trend_analysis');
    }
    
    // Valuation-related capabilities
    if (lowerProblem.includes('valuation') || lowerProblem.includes('calculation') || 
        lowerError.includes('valuation') || lowerError.includes('calculation')) {
      requiredCapabilities.push('valuation_calculation');
      requiredCapabilities.push('multiplier_optimization');
    }
    
    // Report-related capabilities
    if (lowerProblem.includes('report') || lowerProblem.includes('summary') || 
        lowerError.includes('report')) {
      requiredCapabilities.push('report_generation');
      requiredCapabilities.push('recommendation_generation');
    }
    
    return requiredCapabilities;
  }
  
  /**
   * Add an error to the error history
   * @param errorMessage The error message
   */
  private addError(errorMessage: string): void {
    // Keep only the last 10 errors
    if (this.metrics.lastErrors.length >= 10) {
      this.metrics.lastErrors.shift();
    }
    
    this.metrics.lastErrors.push(errorMessage);
  }
  
  /**
   * Update response time metrics
   * @param requestId ID of the request to update metrics for
   */
  private updateResponseTimeMetrics(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (request) {
      const processingTime = Date.now() - request.startTime;
      
      // Update average response time
      const newTotalTime = this.metrics.totalResponseTime + processingTime;
      const newCount = this.metrics.requestsProcessed;
      this.metrics.totalResponseTime = newTotalTime;
      this.metrics.averageResponseTime = newTotalTime / newCount;
    }
  }
  
  /**
   * Reset all metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      requestsReceived: 0,
      requestsProcessed: 0,
      requestsFailed: 0,
      helpRequestsReceived: 0,
      helpRequestsProvided: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      messagesSent: 0,
      messagesReceived: 0,
      lastErrors: []
    };
  }
}
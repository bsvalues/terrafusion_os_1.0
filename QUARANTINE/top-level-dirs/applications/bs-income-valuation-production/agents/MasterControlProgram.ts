/**
 * Master Control Program (MCP)
 * 
 * This module implements the Master Control Program (MCP) which is the central
 * coordination component of the multi-agent system. It manages message routing,
 * agent registration, and system-wide coordination.
 */

import { EventEmitter } from 'events';
import {
  AgentMessage, AgentType, EventType, ErrorCode, AgentStatus, SystemHealthStatus
} from '../shared/agentProtocol';
import { ReplayBuffer } from './ReplayBuffer';
import { IAgent } from './BaseAgent';

/**
 * MCP configuration options
 */
interface MCPConfig {
  maxAgents: number;
  messageTimeout: number;
  maxRetries: number;
  logMessages: boolean;
  throttleRequests: boolean;
  throttleLimit: number;
}

/**
 * Default configuration for the MCP
 */
const DEFAULT_CONFIG: MCPConfig = {
  maxAgents: 20,
  messageTimeout: 30000,
  maxRetries: 3,
  logMessages: true,
  throttleRequests: false,
  throttleLimit: 10
};

/**
 * Master Control Program for coordinating agents
 */
export class MasterControlProgram extends EventEmitter {
  private static instance: MasterControlProgram;
  private agents: Map<string, IAgent> = new Map();
  private agentsByType: Map<AgentType, Set<string>> = new Map();
  private capabilityRegistry: Map<string, Set<string>> = new Map();
  private messageQueue: AgentMessage[] = [];
  private processingMessage: boolean = false;
  private config: MCPConfig;
  private messageCounters: Map<string, number> = new Map();
  private replayBuffer: ReplayBuffer;
  private startTime: Date;
  private metrics = {
    messagesProcessed: 0,
    messageErrors: 0,
    helpRequestsRouted: 0,
    agentRegistrations: 0,
    agentUnregistrations: 0,
    broadcastsSent: 0,
    lastErrors: [] as string[]
  };
  private healthStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
  
  /**
   * Private constructor - use MasterControlProgram.getInstance() instead
   * @param config Configuration options
   */
  private constructor(config: Partial<MCPConfig>) {
    super();
    
    // Initialize configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    this.startTime = new Date();
    
    // Initialize replay buffer
    this.replayBuffer = new ReplayBuffer({
      maxSize: 1000,
      expiryTimeMs: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    // Initialize agent type registry
    Object.values(AgentType).forEach(type => {
      this.agentsByType.set(type, new Set<string>());
    });
    
    // Set up message processing
    setImmediate(() => this.processMessageQueue());
  }
  
  /**
   * Get the MCP instance (Singleton pattern)
   * @param config Configuration options
   * @returns The MCP instance
   */
  public static getInstance(config: Partial<MCPConfig> = {}): MasterControlProgram {
    if (!MasterControlProgram.instance) {
      MasterControlProgram.instance = new MasterControlProgram(config);
    }
    return MasterControlProgram.instance;
  }
  
  /**
   * Register an agent with the MCP
   * @param agent The agent to register
   */
  public registerAgent(agent: IAgent): void {
    const agentId = agent.getAgentId();
    const agentType = agent.getAgentType();
    
    // Check if we already have this agent
    if (this.agents.has(agentId)) {
      console.warn(`Agent ${agentId} already registered, replacing`);
    }
    
    // Add to main registry
    this.agents.set(agentId, agent);
    
    // Add to type registry
    const typeSet = this.agentsByType.get(agentType);
    if (typeSet) {
      typeSet.add(agentId);
    } else {
      this.agentsByType.set(agentType, new Set([agentId]));
    }
    
    // Register capabilities
    this.registerAgentCapabilities(agent);
    
    // Update metrics
    this.metrics.agentRegistrations++;
    
    // Emit registration event
    this.emit('agent_registered', {
      agentId,
      agentType
    });
    
    // Send welcome message
    this.sendSystemMessage(
      agentId,
      EventType.REGISTRATION,
      {
        message: `Welcome, ${agentId}! You are now registered with the MCP.`,
        timestamp: new Date().toISOString(),
        systemInfo: {
          totalAgents: this.agents.size,
          messageQueueSize: this.messageQueue.length
        }
      }
    );
    
    console.log(`Agent ${agentId} of type ${agentType} registered with MCP`);
  }
  
  /**
   * Unregister an agent from the MCP
   * @param agentId The ID of the agent to unregister
   */
  public unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn(`Cannot unregister agent ${agentId}: not found`);
      return;
    }
    
    const agentType = agent.getAgentType();
    
    // Remove from main registry
    this.agents.delete(agentId);
    
    // Remove from type registry
    const typeSet = this.agentsByType.get(agentType);
    if (typeSet) {
      typeSet.delete(agentId);
    }
    
    // Remove from capability registry
    this.unregisterAgentCapabilities(agent);
    
    // Update metrics
    this.metrics.agentUnregistrations++;
    
    // Emit unregistration event
    this.emit('agent_unregistered', {
      agentId,
      agentType
    });
    
    console.log(`Agent ${agentId} unregistered from MCP`);
  }
  
  /**
   * Handle a message received from an agent
   * @param message The message to handle
   */
  public handleMessage(message: AgentMessage): void {
    // Validate message structure
    if (!this.validateMessage(message)) {
      console.error(`Invalid message structure:`, message);
      return;
    }
    
    // Check if the source agent is registered
    const sourceAgentId = message.sourceAgentId;
    if (sourceAgentId !== 'CORE' && !this.agents.has(sourceAgentId)) {
      console.warn(`Message from unregistered agent ${sourceAgentId} rejected`);
      return;
    }
    
    // Log the message if enabled
    if (this.config.logMessages) {
      this.logMessage(message);
    }
    
    // Add to queue
    this.messageQueue.push(message);
    
    // Trigger processing if not already in progress
    if (!this.processingMessage) {
      setImmediate(() => this.processMessageQueue());
    }
  }
  
  /**
   * Send a system message to an agent
   * @param targetAgentId The ID of the target agent
   * @param eventType The type of event
   * @param payload The message payload
   * @returns The message ID
   */
  public sendSystemMessage(targetAgentId: string, eventType: EventType, payload: any): string {
    const messageId = crypto.randomUUID();
    
    const message: AgentMessage = {
      messageId,
      correlationId: messageId,
      sourceAgentId: 'MCP',
      targetAgentId,
      timestamp: new Date().toISOString(),
      eventType,
      payload
    };
    
    // If target is a registered agent, send directly
    const targetAgent = this.agents.get(targetAgentId);
    if (targetAgent) {
      targetAgent.onMessage(message);
    } else if (targetAgentId === 'BROADCAST') {
      // If target is broadcast, send to all agents
      this.agents.forEach(agent => {
        agent.onMessage({
          ...message,
          targetAgentId: agent.getAgentId()
        });
      });
    } else {
      console.warn(`Cannot send system message to unknown agent ${targetAgentId}`);
    }
    
    return messageId;
  }
  
  /**
   * Broadcast a message to all agents
   * @param message The message to broadcast
   * @param sourceAgentId The ID of the source agent (default: MCP)
   */
  public broadcastMessage(message: string, sourceAgentId: string = 'MCP'): void {
    const broadcastId = crypto.randomUUID();
    
    this.agents.forEach((agent, agentId) => {
      // Don't send to the source agent
      if (agentId === sourceAgentId) return;
      
      const broadcastMessage: AgentMessage = {
        messageId: crypto.randomUUID(),
        correlationId: broadcastId,
        sourceAgentId,
        targetAgentId: agentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.BROADCAST,
        payload: {
          message,
          timestamp: new Date().toISOString()
        }
      };
      
      agent.onMessage(broadcastMessage);
    });
    
    // Update metrics
    this.metrics.broadcastsSent++;
  }
  
  /**
   * Process the message queue
   */
  private async processMessageQueue(): Promise<void> {
    // If already processing or queue is empty, return
    if (this.processingMessage || this.messageQueue.length === 0) {
      return;
    }
    
    this.processingMessage = true;
    
    try {
      // Get the next message
      const message = this.messageQueue.shift();
      if (!message) {
        this.processingMessage = false;
        return;
      }
      
      // Update message counters for throttling
      if (this.config.throttleRequests) {
        const sourceId = message.sourceAgentId;
        const currentCount = this.messageCounters.get(sourceId) || 0;
        
        if (currentCount >= this.config.throttleLimit) {
          console.warn(`Throttling messages from ${sourceId}, too many requests`);
          this.messageQueue.push(message); // Put back in queue
          setTimeout(() => this.processMessageQueue(), 1000); // Try again after 1 second
          this.processingMessage = false;
          return;
        }
        
        this.messageCounters.set(sourceId, currentCount + 1);
        setTimeout(() => {
          const newCount = (this.messageCounters.get(sourceId) || 1) - 1;
          if (newCount <= 0) {
            this.messageCounters.delete(sourceId);
          } else {
            this.messageCounters.set(sourceId, newCount);
          }
        }, 1000);
      }
      
      // Process message based on event type
      await this.processMessage(message);
      
      // Update metrics
      this.metrics.messagesProcessed++;
      
      // Record successful handling in replay buffer
      this.recordExperience(message, 'success', null);
      
    } catch (error) {
      console.error(`Error processing message queue:`, error);
      this.metrics.messageErrors++;
      this.addError(`Message queue error: ${(error as Error).message}`);
      
      // If we're processing a message, record the error
      if (this.messageQueue.length > 0) {
        this.recordExperience(this.messageQueue[0], 'error', error as Error);
      }
    } finally {
      this.processingMessage = false;
      
      // If there are more messages, process them
      if (this.messageQueue.length > 0) {
        setImmediate(() => this.processMessageQueue());
      }
    }
  }
  
  /**
   * Process a single message
   * @param message The message to process
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    const { targetAgentId, eventType } = message;
    
    try {
      // If target is MCP, handle locally
      if (targetAgentId === 'MCP') {
        await this.handleMCPMessage(message);
        return;
      }
      
      // If target is BROADCAST, send to all agents
      if (targetAgentId === 'BROADCAST') {
        this.agents.forEach((agent) => {
          // Don't send back to source
          if (agent.getAgentId() === message.sourceAgentId) return;
          
          agent.onMessage({
            ...message,
            targetAgentId: agent.getAgentId()
          });
        });
        return;
      }
      
      // Otherwise, route to specific agent
      const targetAgent = this.agents.get(targetAgentId);
      if (!targetAgent) {
        throw new Error(`Target agent ${targetAgentId} not found`);
      }
      
      // Route the message
      await targetAgent.onMessage(message);
      
    } catch (error) {
      console.error(`Error routing message:`, error);
      
      // Send error back to source
      const sourceAgent = this.agents.get(message.sourceAgentId);
      if (sourceAgent) {
        const errorMessage: AgentMessage = {
          messageId: crypto.randomUUID(),
          correlationId: message.correlationId,
          sourceAgentId: 'MCP',
          targetAgentId: message.sourceAgentId,
          timestamp: new Date().toISOString(),
          eventType: EventType.ERROR,
          payload: {
            errorCode: ErrorCode.AGENT_UNREACHABLE,
            errorMessage: `Error routing message to ${targetAgentId}: ${(error as Error).message}`,
            originalMessage: message
          }
        };
        
        sourceAgent.onMessage(errorMessage);
      }
    }
  }
  
  /**
   * Handle a message directed to the MCP
   * @param message The message to handle
   */
  private async handleMCPMessage(message: AgentMessage): Promise<void> {
    const { eventType, sourceAgentId, payload } = message;
    
    switch (eventType) {
      case EventType.ASSISTANCE_REQUESTED:
        // Handle help request by finding suitable agent
        await this.routeHelpRequest(message);
        break;
        
      case EventType.HEARTBEAT:
        // Acknowledge heartbeat
        this.sendSystemMessage(
          sourceAgentId,
          EventType.HEARTBEAT,
          {
            status: 'received',
            timestamp: new Date().toISOString(),
            systemInfo: {
              totalAgents: this.agents.size,
              messageQueueSize: this.messageQueue.length
            }
          }
        );
        break;
        
      case EventType.COMMAND:
        // Handle command directed to MCP
        await this.handleMCPCommand(message);
        break;
        
      default:
        // Unknown event type for MCP
        console.warn(`Unknown event type ${eventType} for MCP message`);
        break;
    }
  }
  
  /**
   * Handle a command directed to the MCP
   * @param message The command message
   */
  private async handleMCPCommand(message: AgentMessage): Promise<void> {
    const { sourceAgentId, correlationId, payload } = message;
    const command = payload.command;
    const params = payload.parameters || {};
    
    let result: any;
    
    try {
      switch (command) {
        case 'get_agent_list':
          result = this.getAgentList(params.type as AgentType | undefined);
          break;
          
        case 'get_agent_status':
          result = this.getAgentStatus(params.agentId as string);
          break;
          
        case 'get_capability_map':
          result = this.getCapabilityMap();
          break;
          
        case 'trigger_training':
          result = await this.triggerAgentTraining(
            params.agentIds as string[] | undefined,
            params.experienceCount as number | undefined
          );
          break;
          
        case 'system_info':
          result = this.getSystemInfo();
          break;
          
        default:
          throw new Error(`Unknown MCP command: ${command}`);
      }
      
      // Send response
      this.sendSystemMessage(
        sourceAgentId,
        EventType.COMMAND_RESULT,
        {
          command,
          status: 'success',
          result,
          correlationId
        }
      );
      
    } catch (error) {
      // Send error
      this.sendSystemMessage(
        sourceAgentId,
        EventType.ERROR,
        {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: `Error processing command ${command}: ${(error as Error).message}`,
          correlationId
        }
      );
    }
  }
  
  /**
   * Route a help request to a suitable agent
   * @param message The help request message
   */
  private async routeHelpRequest(message: AgentMessage): Promise<void> {
    const { sourceAgentId, correlationId, payload } = message;
    
    try {
      const requiredCapabilities = payload.requiredCapabilities || [];
      const problemDescription = payload.problemDescription;
      const priority = payload.priority || 1;
      
      // Find most suitable agent(s) based on capabilities
      const suitableAgents = this.findSuitableAgents(requiredCapabilities, sourceAgentId);
      
      if (suitableAgents.length === 0) {
        throw new Error(`No suitable agents found for help request`);
      }
      
      // Choose the first (most suitable) agent
      const chosenAgentId = suitableAgents[0];
      const chosenAgent = this.agents.get(chosenAgentId);
      
      if (!chosenAgent) {
        throw new Error(`Chosen agent ${chosenAgentId} not found`);
      }
      
      // Route help request
      const helpMessage: AgentMessage = {
        messageId: crypto.randomUUID(),
        correlationId,
        sourceAgentId: 'MCP',
        targetAgentId: chosenAgentId,
        timestamp: new Date().toISOString(),
        eventType: EventType.ASSISTANCE_REQUESTED,
        payload: {
          ...payload,
          originalSource: sourceAgentId
        }
      };
      
      await chosenAgent.onMessage(helpMessage);
      
      // Update metrics
      this.metrics.helpRequestsRouted++;
      
      // Notify the requester that help is on the way
      this.sendSystemMessage(
        sourceAgentId,
        EventType.STATUS_UPDATE,
        {
          status: 'help_request_routed',
          chosenAgent: chosenAgentId,
          message: `Your help request has been routed to ${chosenAgentId}`,
          correlationId
        }
      );
      
    } catch (error) {
      // Send error back to requester
      this.sendSystemMessage(
        sourceAgentId,
        EventType.ERROR,
        {
          errorCode: ErrorCode.CAPABILITY_MISMATCH,
          errorMessage: `Error routing help request: ${(error as Error).message}`,
          correlationId
        }
      );
    }
  }
  
  /**
   * Find suitable agents based on required capabilities
   * @param requiredCapabilities Array of required capabilities
   * @param excludeAgentId Agent ID to exclude (usually the requestor)
   * @returns Array of agent IDs sorted by suitability
   */
  private findSuitableAgents(requiredCapabilities: string[], excludeAgentId: string): string[] {
    // If no specific capabilities required, just select any agent not matching excludeAgentId
    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return Array.from(this.agents.keys())
        .filter(id => id !== excludeAgentId);
    }
    
    // Calculate a suitability score for each agent
    const agentScores: { agentId: string; score: number }[] = [];
    
    this.agents.forEach((agent, agentId) => {
      // Skip the requesting agent
      if (agentId === excludeAgentId) return;
      
      const agentCapabilities = agent.getCapabilities();
      
      // Calculate how many required capabilities this agent has
      const matchingCapabilities = requiredCapabilities.filter(
        cap => agentCapabilities.includes(cap)
      );
      
      // Calculate score based on matching capabilities
      const score = matchingCapabilities.length / requiredCapabilities.length;
      
      // Only consider agents with at least one matching capability
      if (matchingCapabilities.length > 0) {
        agentScores.push({ agentId, score });
      }
    });
    
    // Sort by score (descending)
    agentScores.sort((a, b) => b.score - a.score);
    
    // Return sorted agent IDs
    return agentScores.map(item => item.agentId);
  }
  
  /**
   * Register an agent's capabilities
   * @param agent The agent to register capabilities for
   */
  private registerAgentCapabilities(agent: IAgent): void {
    const agentId = agent.getAgentId();
    const capabilities = agent.getCapabilities();
    
    capabilities.forEach(capability => {
      if (!this.capabilityRegistry.has(capability)) {
        this.capabilityRegistry.set(capability, new Set<string>());
      }
      this.capabilityRegistry.get(capability)!.add(agentId);
    });
  }
  
  /**
   * Unregister an agent's capabilities
   * @param agent The agent to unregister capabilities for
   */
  private unregisterAgentCapabilities(agent: IAgent): void {
    const agentId = agent.getAgentId();
    const capabilities = agent.getCapabilities();
    
    capabilities.forEach(capability => {
      const capabilitySet = this.capabilityRegistry.get(capability);
      if (capabilitySet) {
        capabilitySet.delete(agentId);
        if (capabilitySet.size === 0) {
          this.capabilityRegistry.delete(capability);
        }
      }
    });
  }
  
  /**
   * Record an experience in the replay buffer
   * @param message The message related to the experience
   * @param result The result (success or error)
   * @param error Optional error if the result was an error
   */
  private recordExperience(message: AgentMessage, result: 'success' | 'error', error: Error | null): void {
    const experienceId = crypto.randomUUID();
    const sourceAgentId = message.sourceAgentId;
    
    // Only record experiences for registered agents
    if (sourceAgentId === 'MCP' || sourceAgentId === 'CORE') return;
    
    // Create experience record
    const experience = {
      experienceId,
      agentId: sourceAgentId,
      timestamp: new Date().toISOString(),
      taskId: message.correlationId,
      metadata: {
        messageType: message.eventType,
        processingTime: 0, // We don't track processing time in MCP
        successRate: result === 'success' ? 1.0 : 0.0
      },
      request: message.payload,
      result: result === 'success' ? 
        { status: 'success', message: 'Successfully processed by MCP' } : 
        { status: 'error', errorMessage: error?.message || 'Unknown error' },
      tags: [result, message.eventType]
    };
    
    // Add to replay buffer
    this.replayBuffer.addExperience(experience);
  }
  
  /**
   * Validate a message structure
   * @param message The message to validate
   * @returns True if valid, false otherwise
   */
  private validateMessage(message: any): boolean {
    // Check required fields
    if (!message.messageId || !message.sourceAgentId || 
        !message.targetAgentId || !message.eventType) {
      return false;
    }
    
    // Check event type is valid
    const validEventTypes = Object.values(EventType);
    if (!validEventTypes.includes(message.eventType)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Log a message
   * @param message The message to log
   */
  private logMessage(message: AgentMessage): void {
    const { sourceAgentId, targetAgentId, eventType } = message;
    console.log(`Message: ${sourceAgentId} -> ${targetAgentId} (${eventType})`);
  }
  
  /**
   * Get a list of registered agents
   * @param type Optional agent type to filter by
   * @returns Array of agent IDs and types
   */
  public getAgentList(type?: AgentType): { id: string; type: AgentType }[] {
    if (type) {
      const agentIds = this.agentsByType.get(type) || new Set<string>();
      return Array.from(agentIds).map(id => {
        const agent = this.agents.get(id);
        return { id, type: agent ? agent.getAgentType() : type };
      });
    } else {
      return Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        type: agent.getAgentType()
      }));
    }
  }
  
  /**
   * Get the status of a specific agent
   * @param agentId The ID of the agent
   * @returns The agent's status or undefined if not found
   */
  /**
   * Get an agent by ID
   * @param agentId The agent ID
   * @returns The agent, or undefined if not found
   */
  public getAgentById(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }
  
  public getAgentStatus(agentId: string): AgentStatus | undefined {
    const agent = this.agents.get(agentId);
    return agent ? agent.getStatus() : undefined;
  }
  
  /**
   * Get the capability map
   * @returns Map of capabilities to agent IDs
   */
  public getCapabilityMap(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    // Convert the map entries to arrays to avoid Iterator issues
    Array.from(this.capabilityRegistry.entries()).forEach(([capability, agentIds]) => {
      result[capability] = Array.from(agentIds);
    });
    
    return result;
  }
  
  /**
   * Trigger training for one or more agents
   * @param agentIds Optional array of agent IDs to train (if omitted, all agents are trained)
   * @param experienceCount Optional number of experiences to use for training
   * @returns Object containing training results
   */
  public async triggerAgentTraining(agentIds?: string[], experienceCount: number = 50): Promise<any> {
    // Determine which agents to train
    const agentsToTrain = agentIds ? 
      agentIds.filter(id => this.agents.has(id)).map(id => this.agents.get(id)!) :
      Array.from(this.agents.values());
    
    if (agentsToTrain.length === 0) {
      return { status: 'error', message: 'No valid agents to train' };
    }
    
    // Train each agent with its experiences
    const results: Record<string, any> = {};
    
    for (const agent of agentsToTrain) {
      const agentId = agent.getAgentId();
      try {
        // Get experiences for this agent
        const experiences = this.replayBuffer.getExperiencesByAgent(agentId, experienceCount);
        
        if (experiences.length === 0) {
          results[agentId] = { status: 'skipped', message: 'No experiences available' };
          continue;
        }
        
        // Trigger learning
        await agent.learn(experiences);
        
        results[agentId] = { 
          status: 'success', 
          experiencesUsed: experiences.length 
        };
        
      } catch (error) {
        results[agentId] = { 
          status: 'error', 
          message: `Training error: ${(error as Error).message}` 
        };
      }
    }
    
    return {
      status: 'completed',
      agentResults: results,
      totalAgentsTrained: Object.values(results).filter(r => r.status === 'success').length
    };
  }
  
  /**
   * Get general system information
   * @returns System info object
   */
  public getSystemInfo(): any {
    return {
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      totalAgents: this.agents.size,
      agentsByType: Object.fromEntries(
        Array.from(this.agentsByType.entries()).map(([type, ids]) => [type, ids.size])
      ),
      messageQueueSize: this.messageQueue.length,
      replayBufferSize: this.replayBuffer.getSize(),
      metrics: this.metrics
    };
  }
  
  /**
   * Get experiences from the replay buffer
   * @param count Maximum number of experiences to return
   * @returns Array of experiences
   */
  public getExperiences(count: number = 50): any[] {
    return this.replayBuffer.getRecentExperiences(count);
  }
  
  /**
   * Get the MCP's status
   * @returns MCP status object
   */
  public getStatus(): any {
    return {
      status: this.healthStatus,
      lastActivity: new Date().toISOString(),
      metrics: {
        messageQueueSize: this.messageQueue.length,
        messagesProcessed: this.metrics.messagesProcessed,
        activeAgents: this.agents.size
      }
    };
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
    
    // Update health status based on error count
    if (this.metrics.lastErrors.length > 5) {
      this.healthStatus = 'error';
    } else if (this.metrics.lastErrors.length > 2) {
      this.healthStatus = 'degraded';
    }
  }
  
  /**
   * Shut down the MCP
   */
  public shutdown(): void {
    // Clean up resources
    this.messageQueue = [];
    
    // Clear error state
    this.metrics.lastErrors = [];
    this.healthStatus = 'healthy';
  }
}
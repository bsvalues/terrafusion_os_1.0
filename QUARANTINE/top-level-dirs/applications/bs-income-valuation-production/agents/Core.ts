/**
 * Core System Orchestrator
 * 
 * This module implements the central orchestration component of the AI system.
 * It manages the Master Control Program (MCP) and provides high-level coordination
 * of all agents in the system.
 */

import { EventEmitter } from 'events';
import { AgentType, AgentMessage, EventType, SystemHealthStatus, AgentStatus } from '../shared/agentProtocol';
import { MCP_CONFIG } from '../config/mcpConfig';
import { MasterControlProgram } from './MasterControlProgram';
import { IAgent, MessageHandler } from './BaseAgent';
import { MASTER_PROMPT } from '../config/masterPrompt';

/**
 * Core configuration options
 */
export interface CoreConfig {
  systemName: string;
  version: string;
  environment: 'development' | 'production' | 'testing';
  enableLogging: boolean;
}

/**
 * Default configuration for the Core
 */
const DEFAULT_CONFIG: CoreConfig = {
  systemName: 'Benton County Property Valuation System',
  version: '1.0.0',
  environment: 'development',
  enableLogging: true
};

/**
 * Core Orchestrator for the AI System
 */
export class Core extends EventEmitter {
  private static instance: Core;
  private mcp: MasterControlProgram;
  private config: CoreConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private systemStartTime: Date;
  private agents: Map<string, IAgent> = new Map();
  
  /**
   * Private constructor - use Core.getInstance() instead
   * @param config Configuration options
   */
  private constructor(config: Partial<CoreConfig>) {
    super();
    
    // Initialize configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    this.systemStartTime = new Date();
    
    // Create the MCP
    this.mcp = MasterControlProgram.getInstance({
      maxAgents: MCP_CONFIG.maxAgents,
      messageTimeout: MCP_CONFIG.messageTimeout,
      maxRetries: MCP_CONFIG.maxRetries,
      logMessages: MCP_CONFIG.logMessages && this.config.enableLogging,
      throttleRequests: MCP_CONFIG.throttleRequests,
      throttleLimit: MCP_CONFIG.throttleLimit
    });
    
    // Create and register the Core adapter as an IAgent to receive messages
    this.registerCoreAsAgent();
    
    // Set up health check interval
    this.setupHealthCheck();
    
    // Log initialization
    this.log(`Core initialized successfully`);
  }
  
  /**
   * Register the Core as a special agent with the MCP
   * This allows it to receive messages sent to "CORE"
   */
  private registerCoreAsAgent(): void {
    // Create an adapter that implements IAgent
    const coreAgentAdapter: IAgent = {
      processRequest: async (request: any): Promise<any> => {
        this.log(`Core received request: ${JSON.stringify(request)}`);
        return { status: 'processed_by_core', timestamp: new Date().toISOString() };
      },
      
      sendMessage: (message: AgentMessage): void => {
        this.mcp.handleMessage(message);
      },
      
      handleHelpRequest: async (helpRequest: any, requestingAgentId: string): Promise<void> => {
        this.log(`Core received help request from ${requestingAgentId}`);
        
        // Emit help request event
        this.emit('message_assistance_requested', {
          sourceAgentId: requestingAgentId,
          payload: helpRequest
        });
        
        // Send acknowledgment
        const ackMessage: AgentMessage = {
          messageId: crypto.randomUUID(),
          correlationId: helpRequest.correlationId || crypto.randomUUID(),
          sourceAgentId: 'CORE',
          targetAgentId: requestingAgentId,
          timestamp: new Date().toISOString(),
          eventType: EventType.STATUS_UPDATE,
          payload: {
            status: 'help_request_acknowledged',
            message: 'Your request for assistance has been received'
          }
        };
        
        this.mcp.handleMessage(ackMessage);
      },
      
      learn: async (experiences: any[]): Promise<void> => {
        this.log(`Core received ${experiences.length} experiences for learning`);
        // Core doesn't actually learn but can process the experiences
      },
      
      getAgentId: (): string => 'CORE',
      
      getAgentType: (): AgentType => AgentType.SYSTEM,
      
      getCapabilities: (): string[] => [
        'system_orchestration',
        'inter_agent_coordination',
        'health_monitoring'
      ],
      
      onMessage: async (message: AgentMessage): Promise<void> => {
        this.log(`Core received message: ${message.eventType} from ${message.sourceAgentId}`);
        
        // Handle message based on event type
        switch (message.eventType) {
          case EventType.STATUS_UPDATE:
            // Process status update
            this.emit('agent_status_update', {
              agentId: message.sourceAgentId,
              status: message.payload
            });
            break;
            
          case EventType.ERROR:
            // Process error message
            this.emit('message_error', message);
            this.log(`Error from ${message.sourceAgentId}: ${message.payload.errorMessage}`, 'error');
            break;
            
          case EventType.ASSISTANCE_REQUESTED:
            // Process assistance request
            this.emit('message_assistance_requested', message);
            break;
            
          case EventType.COMMAND:
            // Process command (if supported)
            const command = message.payload.command;
            
            if (command === 'get_master_prompt') {
              // Return the master prompt
              const responseMsg: AgentMessage = {
                messageId: crypto.randomUUID(),
                correlationId: message.correlationId,
                sourceAgentId: 'CORE',
                targetAgentId: message.sourceAgentId,
                timestamp: new Date().toISOString(),
                eventType: EventType.COMMAND_RESULT,
                payload: {
                  command,
                  status: 'success',
                  masterPrompt: this.getMasterPrompt()
                }
              };
              
              this.mcp.handleMessage(responseMsg);
            } else {
              // Unknown command
              const errorMsg: AgentMessage = {
                messageId: crypto.randomUUID(),
                correlationId: message.correlationId,
                sourceAgentId: 'CORE',
                targetAgentId: message.sourceAgentId,
                timestamp: new Date().toISOString(),
                eventType: EventType.ERROR,
                payload: {
                  errorCode: 'COMMAND_NOT_SUPPORTED',
                  errorMessage: `Core does not support command: ${command}`
                }
              };
              
              this.mcp.handleMessage(errorMsg);
            }
            break;
        }
      },
      
      setMessageHandler: (handler: MessageHandler): void => {
        // Core uses its own message handling
      },
      
      getMetrics: (): any => {
        return {
          systemUptime: Date.now() - this.systemStartTime.getTime(),
          agentCount: this.agents.size,
          startTime: this.systemStartTime.toISOString()
        };
      },
      
      getStatus: (): AgentStatus => {
        return {
          agentId: 'CORE',
          agentType: AgentType.SYSTEM,
          status: 'healthy',
          lastActivity: new Date().toISOString(),
          activeRequests: 0,
          metrics: {
            avgResponseTime: 0,
            successRate: 1.0,
            errorRate: 0.0,
            requestsProcessed: 0
          }
        };
      }
    };
    
    // Register the Core adapter with the MCP
    this.mcp.registerAgent(coreAgentAdapter);
    this.log('Core registered as agent with ID: CORE');
  }
  
  /**
   * Get the Core instance (Singleton pattern)
   * @param config Configuration options
   * @returns The Core instance
   */
  public static getInstance(config: Partial<CoreConfig> = {}): Core {
    if (!Core.instance) {
      Core.instance = new Core(config);
    }
    return Core.instance;
  }
  
  /**
   * Register an agent with the system
   * @param agent The agent to register
   */
  public registerAgent(agent: IAgent): void {
    const agentId = agent.getAgentId();
    const agentType = agent.getAgentType();
    
    // Register with MCP
    this.mcp.registerAgent(agent);
    
    // Store in local registry
    this.agents.set(agentId, agent);
    
    // Set up message handler
    agent.setMessageHandler(async (message: AgentMessage) => {
      // Forward message to MCP
      this.mcp.handleMessage(message);
    });
    
    // Emit registration event
    this.emit('agent_registered', {
      agentId,
      agentType
    });
    
    this.log(`Agent registered: ${agentId} (${agentType})`);
  }
  
  /**
   * Get an agent by ID
   * @param agentId The agent ID
   * @returns The agent, or undefined if not found
   */
  public getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents of a specified type
   * @param agentType The type of agents to get
   * @returns Array of agents of that type
   */
  public getAgentsByType(agentType: AgentType): IAgent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.getAgentType() === agentType);
  }
  
  /**
   * Broadcast an announcement to all agents
   * @param message The message to broadcast
   * @param priority The priority level (high, medium, low)
   */
  public broadcastAnnouncement(message: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const broadcastMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: 'CORE',
      targetAgentId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: EventType.BROADCAST,
      payload: {
        message,
        priority,
        systemName: this.config.systemName,
        version: this.config.version,
        timestamp: new Date().toISOString()
      }
    };
    
    // Send to MCP for distribution
    this.mcp.handleMessage(broadcastMessage);
  }
  
  /**
   * Set up system health check
   */
  private setupHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, MCP_CONFIG.healthCheckInterval);
  }
  
  /**
   * Perform a system health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Get MCP status with error handling
      let mcpStatus = {
        status: 'healthy' as 'healthy' | 'degraded' | 'error',
        lastActivity: new Date().toISOString(),
        metrics: {
          messageQueueSize: 0,
          messagesProcessed: 0,
          activeAgents: 0
        }
      };
      
      try {
        const status = this.mcp.getStatus();
        if (status && typeof status === 'object' && status.status) {
          // Create a new object to avoid reference issues
          mcpStatus = {
            // Start with our default values
            ...mcpStatus,
            // Add metrics and other properties
            ...status,
            // Ensure status is a valid value, defaulting to 'degraded' if not valid
            status: (status.status === 'healthy' || status.status === 'error') 
              ? status.status 
              : 'degraded'
          };
        }
      } catch (err) {
        this.log(`Error getting MCP status: ${(err as Error).message}`, 'warn');
        mcpStatus.status = 'degraded';
      }
      
      // Get status of all registered agents using a simpler approach
      const agentStatuses: Record<string, AgentStatus> = {};
      
      // Use agents from our local collection (safer than querying MCP directly)
      // Use Array.from to convert the Map entries to an array before iterating
      Array.from(this.agents.entries()).forEach(([agentId, agent]) => {
        try {
          const status = agent.getStatus();
          agentStatuses[agentId] = status;
        } catch (err) {
          this.log(`Error getting status for agent ${agentId}: ${(err as Error).message}`, 'warn');
          // Create a placeholder status
          agentStatuses[agentId] = {
            agentId: agentId,
            agentType: agent.getAgentType(),
            status: 'degraded' as 'degraded' | 'healthy' | 'error',
            lastActivity: new Date().toISOString(),
            activeRequests: 0,
            metrics: { 
              avgResponseTime: 0, 
              successRate: 0, 
              errorRate: 1.0, 
              requestsProcessed: 0 
            }
          };
        }
      });
      
      // Also add a status for the CORE agent
      agentStatuses['CORE'] = {
        agentId: 'CORE',
        agentType: AgentType.SYSTEM,
        status: 'healthy',
        lastActivity: new Date().toISOString(),
        activeRequests: 0,
        metrics: { 
          avgResponseTime: 0, 
          successRate: 1.0, 
          errorRate: 0.0, 
          requestsProcessed: 0 
        }
      };
      
      // Determine overall system status
      let systemStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
      const issues: string[] = [];
      
      // Check MCP status
      if (mcpStatus.status !== 'healthy') {
        systemStatus = mcpStatus.status;
        issues.push(`MCP status: ${mcpStatus.status}`);
      }
      
      // Check agent statuses
      for (const [agentId, status] of Object.entries(agentStatuses)) {
        // Ensure status object is properly formatted
        if (status && typeof status === 'object' && 'status' in status) {
          if (status.status !== 'healthy') {
            if (status.status === 'error' && systemStatus !== 'error') {
              systemStatus = 'error';
            } else if (status.status === 'degraded' && systemStatus === 'healthy') {
              systemStatus = 'degraded';
            }
            
            issues.push(`Agent ${agentId} status: ${status.status}`);
          }
        } else {
          // Handle missing or malformed status
          systemStatus = 'degraded';
          issues.push(`Agent ${agentId} returned invalid status`);
          
          // Create default status for the agent if missing
          agentStatuses[agentId] = agentStatuses[agentId] || {
            agentId: agentId,
            agentType: AgentType.SYSTEM,
            status: 'degraded',
            lastActivity: new Date().toISOString(),
            activeRequests: 0,
            metrics: { 
              avgResponseTime: 0, 
              successRate: 0, 
              errorRate: 1.0, 
              requestsProcessed: 0 
            }
          };
        }
      }
      
      // Build health status object
      const healthStatus: SystemHealthStatus = {
        status: systemStatus,
        timestamp: new Date().toISOString(),
        components: {
          mcp: mcpStatus,
          agents: agentStatuses
        },
        issues: issues.length > 0 ? issues : undefined
      };
      
      // Emit health check event
      this.emit('health_check', healthStatus);
      
      this.log(`Health check completed. System status: ${systemStatus}`);
      
      // Alert if system is not healthy
      if (systemStatus !== 'healthy') {
        this.log(`System health issues detected: ${issues.join(', ')}`, 'warn');
      }
    } catch (error) {
      this.log(`Error performing health check: ${(error as Error).message}`, 'error');
    }
  }
  
  /**
   * Add a custom event listener
   * @param event The event name
   * @param listener The event listener function
   */
  public addEventListener(event: string, listener: (...args: any[]) => void): void {
    this.on(event, listener);
  }
  
  /**
   * Get the Master Control Program
   * @returns The MCP instance
   */
  public getMCP(): MasterControlProgram {
    return this.mcp;
  }
  
  /**
   * Get the master prompt
   * @returns The master prompt
   */
  public getMasterPrompt(): string {
    return MASTER_PROMPT;
  }
  
  /**
   * Log a message (if logging is enabled)
   * @param message The message to log
   * @param level The log level
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.config.enableLogging) {
      const timestamp = new Date().toISOString();
      const prefix = `[CORE ${timestamp}]`;
      
      switch (level) {
        case 'info':
          console.log(`${prefix} ${message}`);
          break;
        case 'warn':
          console.warn(`${prefix} WARNING: ${message}`);
          break;
        case 'error':
          console.error(`${prefix} ERROR: ${message}`);
          break;
      }
    }
  }
  
  /**
   * Shut down the Core and all components
   */
  public shutdown(): void {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Shutdown MCP
    this.mcp.shutdown();
    
    // Log shutdown
    this.log(`Core shutting down after ${Math.floor((Date.now() - this.systemStartTime.getTime()) / 1000)} seconds of operation`);
    
    // Remove all listeners
    this.removeAllListeners();
  }
}
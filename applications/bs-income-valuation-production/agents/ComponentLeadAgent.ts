/**
 * Component Lead Agent
 * 
 * This module implements the Component Lead Agent base class, which is responsible
 * for coordinating and leading a specific domain of specialized agents.
 * It serves as an intermediary between the command structure and operational agents.
 */

import { BaseAgent } from './BaseAgent';
import { AgentType, AgentMessage, EventType } from '../shared/agentProtocol';

/**
 * Component domain types
 */
export enum ComponentDomain {
  VALUATION = 'VALUATION',
  DATA_CLEANING = 'DATA_CLEANING',
  REPORTING = 'REPORTING'
}

/**
 * Configuration options for Component Lead Agents
 */
export interface ComponentLeadConfig {
  teamCheckInterval: number; // Interval for checking team agent health (in ms)
  qualityThreshold: number; // Threshold for output quality (0-1)
  enableAutoCorrection: boolean; // Whether to automatically correct low-quality outputs
  enablePerformanceReporting: boolean; // Whether to generate performance reports
  enableBestPracticesEnforcement: boolean; // Whether to enforce domain best practices
  learningRate: number; // Rate at which to incorporate new patterns (0-1)
}

/**
 * Default configuration for Component Lead Agents
 */
const DEFAULT_CONFIG: ComponentLeadConfig = {
  teamCheckInterval: 60000, // 1 minute
  qualityThreshold: 0.8, // 80% quality threshold
  enableAutoCorrection: true,
  enablePerformanceReporting: true,
  enableBestPracticesEnforcement: true,
  learningRate: 0.1
};

/**
 * Domain best practice definition
 */
interface DomainBestPractice {
  id: string;
  name: string;
  description: string;
  checkFunction: (data: any) => boolean;
  fixFunction?: (data: any) => any;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Team agent status record
 */
interface TeamAgentStatus {
  agentId: string;
  lastChecked: string; // ISO timestamp
  status: 'healthy' | 'degraded' | 'error';
  metrics: {
    outputQuality: number; // 0-1
    responseTime: number; // ms
    errorRate: number; // 0-1
  };
  issues?: string[];
}

/**
 * ComponentLeadAgent - Base class for domain-specific component leads
 */
export abstract class ComponentLeadAgent extends BaseAgent {
  protected config: ComponentLeadConfig;
  protected teamCheckInterval: NodeJS.Timeout | null = null;
  protected domain: ComponentDomain;
  protected teamAgents: Map<string, TeamAgentStatus> = new Map();
  protected bestPractices: DomainBestPractice[] = [];
  
  /**
   * Log a message with the agent's prefix
   * @param message The message to log
   * @param level The log level (info, warn, error)
   */
  protected logMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${this.agentId}:${this.domain} ${timestamp}]`;
    
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
  
  /**
   * Create a new Component Lead Agent
   * @param agentId Unique identifier for this agent
   * @param domain The domain this component lead oversees
   * @param config Configuration options
   */
  constructor(agentId: string, domain: ComponentDomain, config: Partial<ComponentLeadConfig> = {}) {
    super(agentId, AgentType.COMPONENT_LEAD);
    
    this.domain = domain;
    
    // Initialize configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Set up domain-specific capabilities
    this.setupCapabilities();
    
    // Initialize best practices
    this.initializeBestPractices();
    
    // Set up scheduled tasks
    this.setupScheduledTasks();
    
    this.logMessage(`${domain} Component Lead Agent initialized`);
  }
  
  /**
   * Set up agent capabilities based on domain
   */
  protected abstract setupCapabilities(): void;
  
  /**
   * Initialize domain-specific best practices
   */
  protected abstract initializeBestPractices(): void;
  
  /**
   * Set up scheduled tasks
   */
  private setupScheduledTasks(): void {
    // Set up team check interval
    this.teamCheckInterval = setInterval(() => {
      this.checkTeamAgents();
    }, this.config.teamCheckInterval);
  }
  
  /**
   * Check the status of team agents
   */
  protected async checkTeamAgents(): Promise<void> {
    this.logMessage('Checking team agent status');
    
    // Implementation will request status from all team agents
    // via the MCP and record their health/performance
    
    // For each agent in our domain, we'll send a status request message
    // and update the teamAgents map with the results
    
    // Send team health report
    await this.sendTeamReport();
  }
  
  /**
   * Send a report on team health
   */
  protected async sendTeamReport(): Promise<void> {
    // Count issues by status
    const stats = {
      healthy: 0,
      degraded: 0,
      error: 0,
      total: this.teamAgents.size
    };
    
    // Analyze team agent statuses
    Array.from(this.teamAgents.values()).forEach(agent => {
      stats[agent.status]++;
    });
    
    // Collect issues
    const issues = Array.from(this.teamAgents.entries())
      .filter(([_, status]) => status.status !== 'healthy')
      .map(([agentId, status]) => ({
        agentId,
        status: status.status,
        issues: status.issues
      }));
    
    // Send report to ARCHITECT_PRIME and INTEGRATION_COORDINATOR
    const reportMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: EventType.STATUS_UPDATE,
      payload: {
        messageType: 'TEAM_STATUS_REPORT',
        domain: this.domain,
        stats,
        teamStatus: stats.error > 0 ? 'error' : (stats.degraded > 0 ? 'degraded' : 'healthy'),
        issues: issues.length > 0 ? issues : undefined,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendMessage(reportMessage);
  }
  
  /**
   * Register a team agent with this component lead
   * @param agentId The ID of the agent to register
   */
  public registerTeamAgent(agentId: string): void {
    this.teamAgents.set(agentId, {
      agentId,
      lastChecked: new Date().toISOString(),
      status: 'healthy',
      metrics: {
        outputQuality: 1.0,
        responseTime: 0,
        errorRate: 0
      }
    });
    
    this.logMessage(`Registered team agent: ${agentId}`);
  }
  
  /**
   * Check if an output adheres to domain best practices
   * @param output The output to check
   * @returns Object with validation results
   */
  protected validateAgainstBestPractices(output: any): {
    valid: boolean;
    issues: { practiceId: string, message: string, severity: string }[];
    fixedOutput?: any;
  } {
    const issues: { practiceId: string, message: string, severity: string }[] = [];
    let fixedOutput = { ...output };
    let valid = true;
    
    // Check each best practice
    for (const practice of this.bestPractices) {
      if (!practice.checkFunction(output)) {
        valid = false;
        issues.push({
          practiceId: practice.id,
          message: `Output does not conform to best practice: ${practice.name}`,
          severity: practice.severity
        });
        
        // Apply fix if available and auto-correction is enabled
        if (this.config.enableAutoCorrection && practice.fixFunction) {
          fixedOutput = practice.fixFunction(fixedOutput);
        }
      }
    }
    
    return {
      valid,
      issues,
      fixedOutput: valid ? undefined : fixedOutput
    };
  }
  
  /**
   * Process a request sent to this agent
   * @param request The request to process
   * @returns Promise resolving to the response
   */
  public async processRequest(request: any): Promise<any> {
    this.logMessage(`Processing request: ${JSON.stringify(request)}`);
    
    const requestType = request.type || '';
    
    switch (requestType) {
      case 'get-team-status':
        return {
          domain: this.domain,
          teamAgents: Array.from(this.teamAgents.entries()).map(([id, status]) => ({
            agentId: id,
            status: status.status,
            metrics: status.metrics
          })),
          timestamp: new Date().toISOString()
        };
        
      case 'enforce-best-practices':
        if (!request.output) {
          return {
            success: false,
            error: 'No output provided for best practices enforcement',
            timestamp: new Date().toISOString()
          };
        }
        
        const validationResult = this.validateAgainstBestPractices(request.output);
        return {
          success: true,
          valid: validationResult.valid,
          issues: validationResult.issues,
          fixedOutput: validationResult.fixedOutput,
          timestamp: new Date().toISOString()
        };
        
      case 'get-best-practices':
        return {
          domain: this.domain,
          bestPractices: this.bestPractices.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            severity: p.severity
          })),
          timestamp: new Date().toISOString()
        };
        
      default:
        return {
          error: `Unknown request type: ${requestType}`,
          supportedTypes: ['get-team-status', 'enforce-best-practices', 'get-best-practices'],
          timestamp: new Date().toISOString()
        };
    }
  }
  
  /**
   * Handle an incoming message from another agent
   * @param message The message to handle
   */
  public async onMessage(message: AgentMessage): Promise<void> {
    const { eventType, payload, sourceAgentId } = message;
    
    switch (eventType) {
      case EventType.COMMAND:
        // Handle commands
        if (payload.command === 'validate_output') {
          this.handleValidateOutputCommand(message);
        } else if (payload.command === 'register_team_agent') {
          this.handleRegisterTeamAgentCommand(message);
        } else {
          this.sendCommandResponse(message, {
            status: 'error',
            message: `Unknown command: ${payload.command}`,
            errorCode: 'UNKNOWN_COMMAND'
          });
        }
        break;
        
      case EventType.STATUS_UPDATE:
        // Handle status updates from team agents
        if (this.teamAgents.has(sourceAgentId)) {
          this.updateTeamAgentStatus(sourceAgentId, payload);
        }
        break;
        
      case EventType.ASSISTANCE_REQUESTED:
        // Handle assistance requests
        if (payload.domain === this.domain || payload.domainExpertise === this.domain) {
          this.provideDomainAssistance(message);
        }
        break;
        
      default:
        // Log but don't specifically handle other message types
        this.logMessage(`Received ${eventType} message from ${sourceAgentId}`);
        break;
    }
  }
  
  /**
   * Handle command to validate output
   * @param message The command message
   */
  protected handleValidateOutputCommand(message: AgentMessage): void {
    const { payload } = message;
    const output = payload.output;
    
    if (!output) {
      this.sendCommandResponse(message, {
        status: 'error',
        message: 'No output provided for validation',
        errorCode: 'MISSING_PARAMETERS'
      });
      return;
    }
    
    const validation = this.validateAgainstBestPractices(output);
    
    this.sendCommandResponse(message, {
      status: 'success',
      valid: validation.valid,
      issues: validation.issues,
      fixedOutput: validation.fixedOutput
    });
  }
  
  /**
   * Handle command to register a team agent
   * @param message The command message
   */
  protected handleRegisterTeamAgentCommand(message: AgentMessage): void {
    const { payload } = message;
    const agentId = payload.agentId;
    
    if (!agentId) {
      this.sendCommandResponse(message, {
        status: 'error',
        message: 'No agent ID provided for registration',
        errorCode: 'MISSING_PARAMETERS'
      });
      return;
    }
    
    this.registerTeamAgent(agentId);
    
    this.sendCommandResponse(message, {
      status: 'success',
      message: `Agent ${agentId} registered with ${this.domain} Component Lead`,
      domain: this.domain
    });
  }
  
  /**
   * Update team agent status based on status update message
   * @param agentId ID of the agent
   * @param statusPayload Status payload from message
   */
  protected updateTeamAgentStatus(agentId: string, statusPayload: any): void {
    if (!this.teamAgents.has(agentId)) {
      this.registerTeamAgent(agentId);
    }
    
    const currentStatus = this.teamAgents.get(agentId)!;
    
    // Calculate metrics based on payload
    const outputQuality = statusPayload.metrics?.outputQuality ?? currentStatus.metrics.outputQuality;
    const responseTime = statusPayload.metrics?.responseTime ?? currentStatus.metrics.responseTime;
    const errorRate = statusPayload.metrics?.errorRate ?? currentStatus.metrics.errorRate;
    
    // Determine status based on metrics and reported status
    let status: 'healthy' | 'degraded' | 'error';
    if (statusPayload.status === 'error') {
      status = 'error';
    } else if (statusPayload.status === 'degraded' || 
              outputQuality < this.config.qualityThreshold ||
              errorRate > 0.2) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    // Update team agent status
    this.teamAgents.set(agentId, {
      agentId,
      lastChecked: new Date().toISOString(),
      status,
      metrics: {
        outputQuality,
        responseTime,
        errorRate
      },
      issues: statusPayload.issues || currentStatus.issues
    });
  }
  
  /**
   * Provide domain-specific assistance to requesting agents
   * @param requestMessage The assistance request message
   */
  protected abstract provideDomainAssistance(requestMessage: AgentMessage): void;
  
  /**
   * Send a command response message
   * @param originalMessage The message being responded to
   * @param responsePayload The response data
   */
  protected sendCommandResponse(originalMessage: AgentMessage, responsePayload: any): void {
    const responseMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: originalMessage.correlationId,
      sourceAgentId: this.agentId,
      targetAgentId: originalMessage.sourceAgentId,
      timestamp: new Date().toISOString(),
      eventType: EventType.COMMAND_RESULT,
      payload: {
        ...responsePayload,
        originalCommand: originalMessage.payload.command
      }
    };
    
    this.sendMessage(responseMessage);
  }
  
  /**
   * Clean up resources when agent is shut down
   */
  public shutdown(): void {
    // Clear scheduled tasks
    if (this.teamCheckInterval) {
      clearInterval(this.teamCheckInterval);
      this.teamCheckInterval = null;
    }
    
    // Log shutdown
    this.logMessage(`${this.domain} Component Lead Agent shutting down`);
  }
}
/**
 * Architect Prime Agent
 * 
 * This module implements the Architect Prime Agent, which is responsible
 * for maintaining architectural vision and system integrity.
 * It's the highest level agent in the command structure.
 */

import { BaseAgent } from './BaseAgent';
import { AgentType, AgentMessage, EventType } from '../shared/agentProtocol';
import { MASTER_PROMPT } from '../config/masterPrompt';

/**
 * Configuration options for the Architect Prime Agent
 */
interface ArchitectPrimeConfig {
  visionUpdateInterval: number; // Interval for sending vision statements (in ms)
  architecturalReviewInterval: number; // Interval for reviewing system architecture (in ms)
  enableAutomaticDiagramming: boolean; // Whether to automatically generate system diagrams
  enableVisionBroadcasts: boolean; // Whether to broadcast vision statements
}

/**
 * Default configuration for the Architect Prime Agent
 */
const DEFAULT_CONFIG: ArchitectPrimeConfig = {
  visionUpdateInterval: 24 * 60 * 60 * 1000, // Daily
  architecturalReviewInterval: 7 * 24 * 60 * 60 * 1000, // Weekly
  enableAutomaticDiagramming: true,
  enableVisionBroadcasts: true
};

/**
 * Architect Prime Agent - Maintains system vision and architectural integrity
 */
export class ArchitectPrimeAgent extends BaseAgent {
  private config: ArchitectPrimeConfig;
  private visionUpdateInterval: NodeJS.Timeout | null = null;
  private architecturalReviewInterval: NodeJS.Timeout | null = null;
  private systemVision: string;
  private latestArchitectureDiagram: string = '';
  
  /**
   * Log a message with the agent's prefix
   * @param message The message to log
   * @param level The log level (info, warn, error)
   */
  protected logMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${this.agentId} ${timestamp}]`;
    
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
   * Create a new Architect Prime Agent
   * @param agentId Unique identifier for this agent
   * @param config Configuration options
   */
  constructor(agentId: string, config: Partial<ArchitectPrimeConfig> = {}) {
    super(agentId, AgentType.ARCHITECT_PRIME); // Architect Prime has its own agent type
    
    // Initialize configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Set capabilities
    this.capabilities = [
      'system_architecture',
      'vision_maintenance',
      'architecture_review',
      'system_diagramming',
      'architectural_decision_making'
    ];
    
    // Initialize system vision from master prompt
    this.systemVision = this.extractVisionFromMasterPrompt();
    
    // Set up scheduled tasks
    this.setupScheduledTasks();
  }
  
  /**
   * Extract system vision from the master prompt
   * @returns Vision statement based on the master prompt
   */
  private extractVisionFromMasterPrompt(): string {
    // Parse the master prompt to extract vision elements
    const visionElements = [
      'Benton County Property Valuation System',
      'Provide accurate, insightful property valuations and analysis',
      'Coordinated AI agent system for property valuation',
      'Accuracy, clarity, and actionable intelligence'
    ];
    
    return visionElements.join(' | ');
  }
  
  /**
   * Set up scheduled tasks
   */
  private setupScheduledTasks(): void {
    if (this.config.enableVisionBroadcasts) {
      this.visionUpdateInterval = setInterval(() => {
        this.broadcastVisionStatement();
      }, this.config.visionUpdateInterval);
    }
    
    if (this.config.enableAutomaticDiagramming) {
      this.architecturalReviewInterval = setInterval(() => {
        this.performArchitecturalReview();
      }, this.config.architecturalReviewInterval);
    }
  }
  
  /**
   * Broadcast a vision statement to all agents
   */
  private broadcastVisionStatement(): void {
    const visionMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: EventType.BROADCAST,
      payload: {
        messageType: 'VISION_STATEMENT',
        vision: this.systemVision,
        priority: 'high',
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendMessage(visionMessage);
    this.logMessage(`Broadcasted vision statement: ${this.systemVision}`);
  }
  
  /**
   * Perform an architectural review of the system
   */
  private async performArchitecturalReview(): Promise<void> {
    this.logMessage('Performing architectural review');
    
    // Generate updated architecture diagram
    await this.generateArchitectureDiagram();
    
    // Analyze system health and structure
    const architecturalReview = this.analyzeSystemArchitecture();
    
    // Send review results to CORE
    const reviewMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'CORE',
      timestamp: new Date().toISOString(),
      eventType: EventType.STATUS_UPDATE,
      payload: {
        messageType: 'ARCHITECTURAL_REVIEW',
        review: architecturalReview,
        diagram: this.latestArchitectureDiagram,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendMessage(reviewMessage);
    this.logMessage('Architectural review completed and sent to CORE');
  }
  
  /**
   * Generate a system architecture diagram in Mermaid format
   */
  private async generateArchitectureDiagram(): Promise<void> {
    // Create a Mermaid diagram of the current system architecture
    this.latestArchitectureDiagram = `
    graph TB
      Client[Client API Request]
      API[API Layer]
      MCP[Master Control Program]
      Core[Core Orchestrator]
      ArchPrime[Architect Prime]
      ValAgent[Valuation Agent]
      DataAgent[Data Cleaner Agent]
      RepAgent[Reporting Agent]
      IntCoord[Integration Coordinator]
      ReplayBuffer[Replay Buffer]
      DB[(Database)]
      
      Client -->|Request| API
      API -->|Process| MCP
      MCP -->|Route| ValAgent
      MCP -->|Route| DataAgent
      MCP -->|Route| RepAgent
      ArchPrime -->|Vision| MCP
      ArchPrime -->|Architecture Review| Core
      Core -->|Monitoring| MCP
      Core -->|Registration| MCP
      IntCoord -->|Integration| MCP
      MCP -->|Store Experience| ReplayBuffer
      ValAgent -->|DB Operations| DB
      
      classDef client fill:#f9f,stroke:#333,stroke-width:2px;
      classDef system fill:#bbf,stroke:#33f,stroke-width:2px;
      classDef agent fill:#bfb,stroke:#3a3,stroke-width:2px;
      classDef storage fill:#ffb,stroke:#aa3,stroke-width:2px;
      
      class Client client;
      class API,MCP,Core,ArchPrime,IntCoord system;
      class ValAgent,DataAgent,RepAgent agent;
      class ReplayBuffer,DB storage;
    `;
    
    this.logMessage('Generated new system architecture diagram');
  }
  
  /**
   * Analyze the current system architecture
   * @returns Analysis of system architecture
   */
  private analyzeSystemArchitecture(): any {
    return {
      components: {
        core: { status: 'healthy', recommendations: [] },
        mcp: { status: 'healthy', recommendations: [] },
        agents: {
          valuation: { status: 'healthy', recommendations: [] },
          dataCleaner: { status: 'healthy', recommendations: [] },
          reporting: { status: 'healthy', recommendations: [] }
        },
        new: {
          architectPrime: { status: 'healthy', recommendations: [] },
          integrationCoordinator: { status: 'not_implemented', recommendations: ['Implement Integration Coordinator'] }
        }
      },
      systemIntegrity: 'strong',
      architecturalDebt: 'low',
      recommendations: [
        'Add Integration Coordinator Agent for cross-component coordination',
        'Enhance Replay Buffer to support priority-based experience retrieval',
        'Consider implementing Component Lead Agents for specialized domains'
      ]
    };
  }
  
  /**
   * Update the system vision
   * @param newVision Updated vision statement
   */
  public updateSystemVision(newVision: string): void {
    this.systemVision = newVision;
    this.logMessage(`Updated system vision: ${newVision}`);
    
    // Broadcast the updated vision immediately
    if (this.config.enableVisionBroadcasts) {
      this.broadcastVisionStatement();
    }
  }
  
  /**
   * Get the latest architecture diagram
   * @returns The most recent architecture diagram in Mermaid format
   */
  public getArchitectureDiagram(): string {
    return this.latestArchitectureDiagram;
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
      case 'get-vision':
        return {
          vision: this.systemVision,
          timestamp: new Date().toISOString()
        };
        
      case 'update-vision':
        if (request.vision) {
          this.updateSystemVision(request.vision);
          return {
            success: true,
            message: 'Vision updated successfully',
            vision: this.systemVision,
            timestamp: new Date().toISOString()
          };
        } else {
          return {
            success: false,
            error: 'No vision provided in request',
            timestamp: new Date().toISOString()
          };
        }
        
      case 'get-architecture-diagram':
        // Generate a fresh diagram if none exists
        if (!this.latestArchitectureDiagram) {
          await this.generateArchitectureDiagram();
        }
        
        return {
          diagram: this.latestArchitectureDiagram,
          format: 'mermaid',
          timestamp: new Date().toISOString()
        };
        
      case 'perform-architecture-review':
        await this.performArchitecturalReview();
        return {
          success: true,
          message: 'Architectural review completed',
          timestamp: new Date().toISOString()
        };
        
      default:
        return {
          error: `Unknown request type: ${requestType}`,
          supportedTypes: ['get-vision', 'update-vision', 'get-architecture-diagram', 'perform-architecture-review'],
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
        // Handle commands sent to the Architect Prime
        if (payload.command === 'update_vision') {
          if (payload.vision) {
            this.updateSystemVision(payload.vision);
            
            // Send acknowledgment
            this.sendCommandResponse(message, {
              status: 'success',
              message: 'Vision updated successfully',
              vision: this.systemVision
            });
          } else {
            this.sendCommandResponse(message, {
              status: 'error',
              message: 'No vision provided in command',
              errorCode: 'MISSING_PARAMETERS'
            });
          }
        } else if (payload.command === 'generate_diagram') {
          await this.generateArchitectureDiagram();
          
          this.sendCommandResponse(message, {
            status: 'success',
            message: 'Architecture diagram generated',
            diagram: this.latestArchitectureDiagram
          });
        } else {
          this.sendCommandResponse(message, {
            status: 'error',
            message: `Unknown command: ${payload.command}`,
            errorCode: 'UNKNOWN_COMMAND'
          });
        }
        break;
        
      case EventType.ASSISTANCE_REQUESTED:
        // Provide architectural guidance when requested
        if (payload.problemType === 'architectural_question') {
          this.provideArchitecturalGuidance(message);
        } else {
          // Forward to CORE for other assistance types
          const forwardMessage: AgentMessage = {
            ...message,
            sourceAgentId: this.agentId,
            targetAgentId: 'CORE'
          };
          
          this.sendMessage(forwardMessage);
        }
        break;
        
      default:
        // Log but don't specifically handle other message types
        this.logMessage(`Received ${eventType} message from ${sourceAgentId}`);
        break;
    }
  }
  
  /**
   * Send a command response message
   * @param originalMessage The message being responded to
   * @param responsePayload The response data
   */
  private sendCommandResponse(originalMessage: AgentMessage, responsePayload: any): void {
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
   * Provide architectural guidance in response to a request
   * @param requestMessage The assistance request message
   */
  private provideArchitecturalGuidance(requestMessage: AgentMessage): void {
    const { sourceAgentId, correlationId, payload } = requestMessage;
    
    // Generate architectural guidance based on the question
    const guidance = this.generateArchitecturalGuidance(payload.problemDescription);
    
    // Send response
    const guidanceMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: correlationId,
      sourceAgentId: this.agentId,
      targetAgentId: sourceAgentId,
      timestamp: new Date().toISOString(),
      eventType: EventType.ASSISTANCE_RESPONSE,
      payload: {
        guidance,
        diagram: this.latestArchitectureDiagram,
        relatedPrinciples: [
          'Maintain modular component boundaries',
          'Ensure clear messaging protocols',
          'Respect established data flows'
        ]
      }
    };
    
    this.sendMessage(guidanceMessage);
    this.logMessage(`Provided architectural guidance to ${sourceAgentId}`);
  }
  
  /**
   * Generate architectural guidance based on a question
   * @param question The architectural question
   * @returns Architectural guidance
   */
  private generateArchitecturalGuidance(question: string): string {
    // In a real implementation, this would use more sophisticated logic
    // or potentially call an AI service for generating guidance
    
    if (question.toLowerCase().includes('add new agent')) {
      return 'When adding a new agent to the system, ensure it: (1) Extends BaseAgent class, (2) Declares its capabilities, (3) Registers with MCP, (4) Provides proper message handling, (5) Uses standardized message protocol.';
    } else if (question.toLowerCase().includes('communicate between agents')) {
      return 'Agent communication should always flow through the MCP. Direct agent-to-agent communication is discouraged as it bypasses monitoring, experience collection, and centralized control.';
    } else if (question.toLowerCase().includes('system architecture')) {
      return 'The system follows a hierarchical organization with the Core orchestrating the MCP, which in turn manages specialized agents. The Command Structure (Architect Prime, Integration Coordinator, Component Leads) provides strategic direction.';
    } else {
      return 'Consider how your question relates to the system principles: modularity, clear communication, standardized protocols, and centralized coordination. Refer to the architecture diagram for visual representation of component relationships.';
    }
  }
  
  /**
   * Clean up resources when agent is shut down
   */
  public shutdown(): void {
    // Clear intervals
    if (this.visionUpdateInterval) {
      clearInterval(this.visionUpdateInterval);
      this.visionUpdateInterval = null;
    }
    
    if (this.architecturalReviewInterval) {
      clearInterval(this.architecturalReviewInterval);
      this.architecturalReviewInterval = null;
    }
    
    // Log shutdown
    this.logMessage('Architect Prime Agent shutting down');
  }
}
/**
 * Integration Coordinator Agent
 * 
 * This module implements the Integration Coordinator Agent, which is responsible
 * for managing cross-component integration, verifying API contracts, and ensuring
 * smooth interaction between different parts of the system.
 */

import { BaseAgent } from './BaseAgent';
import { AgentType, AgentMessage, EventType } from '../shared/agentProtocol';

/**
 * Configuration options for the Integration Coordinator Agent
 */
interface IntegrationCoordinatorConfig {
  integrationCheckInterval: number; // Interval for integration checks (in ms)
  contractValidationInterval: number; // Interval for API contract validation (in ms)
  dependencyMapUpdateInterval: number; // Interval for updating dependency maps (in ms)
  enableDetailedReporting: boolean; // Whether to generate detailed integration reports
}

/**
 * Default configuration for the Integration Coordinator Agent
 */
const DEFAULT_CONFIG: IntegrationCoordinatorConfig = {
  integrationCheckInterval: 60 * 60 * 1000, // Hourly
  contractValidationInterval: 24 * 60 * 60 * 1000, // Daily
  dependencyMapUpdateInterval: 7 * 24 * 60 * 60 * 1000, // Weekly
  enableDetailedReporting: true
};

/**
 * Integration point between two components
 */
interface IntegrationPoint {
  sourceComponent: string;
  targetComponent: string;
  integrationMethod: 'message' | 'api' | 'event' | 'shared_data';
  contract?: string; // API contract reference
  lastValidated?: string; // ISO date string
  status: 'healthy' | 'degraded' | 'error';
  issues?: string[];
}

/**
 * API Contract definition
 */
interface ApiContract {
  name: string;
  version: string;
  endpoints: {
    path: string;
    method: string;
    parameters?: any;
    response?: any;
  }[];
  lastUpdated: string; // ISO date string
}

/**
 * Integration Coordinator Agent - Manages cross-component integration
 */
export class IntegrationCoordinatorAgent extends BaseAgent {
  private config: IntegrationCoordinatorConfig;
  private integrationCheckInterval: NodeJS.Timeout | null = null;
  private contractValidationInterval: NodeJS.Timeout | null = null;
  private dependencyMapUpdateInterval: NodeJS.Timeout | null = null;
  
  private integrationPoints: IntegrationPoint[] = [];
  private apiContracts: ApiContract[] = [];
  private dependencyMap: Record<string, string[]> = {};
  
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
   * Create a new Integration Coordinator Agent
   * @param agentId Unique identifier for this agent
   * @param config Configuration options
   */
  constructor(agentId: string, config: Partial<IntegrationCoordinatorConfig> = {}) {
    super(agentId, AgentType.INTEGRATION_COORDINATOR); // Integration Coordinator has its own agent type
    
    // Initialize configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Set capabilities
    this.capabilities = [
      'integration_coordination',
      'api_contract_validation',
      'dependency_mapping',
      'cross_component_testing',
      'integration_monitoring'
    ];
    
    // Initialize integration data
    this.initializeIntegrationData();
    
    // Set up scheduled tasks
    this.setupScheduledTasks();
  }
  
  /**
   * Initialize integration data with known integration points
   */
  private initializeIntegrationData(): void {
    // Initialize with known integration points in the system
    this.integrationPoints = [
      {
        sourceComponent: 'ValuationAgent',
        targetComponent: 'DataCleanerAgent',
        integrationMethod: 'message',
        status: 'healthy'
      },
      {
        sourceComponent: 'ValuationAgent',
        targetComponent: 'Database',
        integrationMethod: 'api',
        contract: 'database_access_v1',
        status: 'healthy'
      },
      {
        sourceComponent: 'DataCleanerAgent',
        targetComponent: 'ReportingAgent',
        integrationMethod: 'message',
        status: 'healthy'
      },
      {
        sourceComponent: 'API',
        targetComponent: 'MCP',
        integrationMethod: 'api',
        contract: 'mcp_api_v1',
        status: 'healthy'
      }
    ];
    
    // Initialize API contracts
    this.apiContracts = [
      {
        name: 'mcp_api_v1',
        version: '1.0.0',
        endpoints: [
          {
            path: '/api/mcp/status',
            method: 'GET'
          },
          {
            path: '/api/mcp/process/:agentType',
            method: 'POST'
          },
          {
            path: '/api/mcp/command/:agentType',
            method: 'POST'
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'database_access_v1',
        version: '1.0.0',
        endpoints: [
          {
            path: '/api/valuations',
            method: 'GET'
          },
          {
            path: '/api/valuations',
            method: 'POST'
          },
          {
            path: '/api/incomes',
            method: 'GET'
          }
        ],
        lastUpdated: new Date().toISOString()
      }
    ];
    
    // Initialize dependency map
    this.dependencyMap = {
      'ValuationAgent': ['DataCleanerAgent', 'Database', 'MCP'],
      'DataCleanerAgent': ['MCP'],
      'ReportingAgent': ['ValuationAgent', 'Database', 'MCP'],
      'API': ['MCP'],
      'MCP': ['Core']
    };
  }
  
  /**
   * Set up scheduled tasks
   */
  private setupScheduledTasks(): void {
    // Set up integration check interval
    this.integrationCheckInterval = setInterval(() => {
      this.performIntegrationCheck();
    }, this.config.integrationCheckInterval);
    
    // Set up contract validation interval
    this.contractValidationInterval = setInterval(() => {
      this.validateApiContracts();
    }, this.config.contractValidationInterval);
    
    // Set up dependency map update interval
    this.dependencyMapUpdateInterval = setInterval(() => {
      this.updateDependencyMap();
    }, this.config.dependencyMapUpdateInterval);
  }
  
  /**
   * Perform an integration check across all integration points
   */
  private async performIntegrationCheck(): Promise<void> {
    this.logMessage('Performing integration check');
    
    // Check each integration point
    for (const point of this.integrationPoints) {
      try {
        // In a real implementation, this would test the actual integration
        // For now, we'll simulate with random success/failure
        const isSuccessful = Math.random() > 0.1; // 90% success rate
        
        if (isSuccessful) {
          point.status = 'healthy';
          point.issues = undefined;
        } else {
          point.status = 'degraded';
          point.issues = ['Simulated integration issue for testing'];
        }
      } catch (error) {
        point.status = 'error';
        point.issues = [(error as Error).message];
      }
    }
    
    // Send integration check report
    await this.sendIntegrationReport();
    
    this.logMessage('Integration check completed');
  }
  
  /**
   * Validate all API contracts
   */
  private async validateApiContracts(): Promise<void> {
    this.logMessage('Validating API contracts');
    
    const validationResults = {
      validContracts: [] as string[],
      invalidContracts: [] as { name: string, issues: string[] }[]
    };
    
    // Validate each API contract
    for (const contract of this.apiContracts) {
      try {
        // In a real implementation, this would test actual endpoints
        // For now, we'll simulate with random success/failure
        const isValid = Math.random() > 0.05; // 95% validity rate
        
        if (isValid) {
          validationResults.validContracts.push(contract.name);
        } else {
          validationResults.invalidContracts.push({
            name: contract.name,
            issues: ['Simulated contract validation issue for testing']
          });
        }
      } catch (error) {
        validationResults.invalidContracts.push({
          name: contract.name,
          issues: [(error as Error).message]
        });
      }
    }
    
    // Send validation report
    const reportMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'CORE',
      timestamp: new Date().toISOString(),
      eventType: EventType.STATUS_UPDATE,
      payload: {
        messageType: 'CONTRACT_VALIDATION_REPORT',
        results: validationResults,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendMessage(reportMessage);
    this.logMessage('API contract validation completed');
  }
  
  /**
   * Update the dependency map
   */
  private async updateDependencyMap(): Promise<void> {
    this.logMessage('Updating dependency map');
    
    // In a real implementation, this would analyze actual dependencies
    // For now, we'll just use our static map
    
    // Generate dependency diagram in Mermaid format
    const diagram = this.generateDependencyDiagram();
    
    // Send dependency map update
    const mapMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'CORE',
      timestamp: new Date().toISOString(),
      eventType: EventType.STATUS_UPDATE,
      payload: {
        messageType: 'DEPENDENCY_MAP_UPDATE',
        dependencyMap: this.dependencyMap,
        diagram,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendMessage(mapMessage);
    this.logMessage('Dependency map updated');
  }
  
  /**
   * Generate dependency diagram in Mermaid format
   * @returns Mermaid diagram of component dependencies
   */
  private generateDependencyDiagram(): string {
    let diagram = 'graph TD\n';
    
    // Add nodes
    const components = new Set<string>();
    
    Object.keys(this.dependencyMap).forEach(component => {
      components.add(component);
      this.dependencyMap[component].forEach(dep => components.add(dep));
    });
    
    components.forEach(component => {
      diagram += `  ${component}[${component}]\n`;
    });
    
    // Add edges
    Object.entries(this.dependencyMap).forEach(([component, dependencies]) => {
      dependencies.forEach(dep => {
        diagram += `  ${component} --> ${dep}\n`;
      });
    });
    
    return diagram;
  }
  
  /**
   * Send an integration status report
   */
  private async sendIntegrationReport(): Promise<void> {
    // Count issues by status
    const stats = {
      healthy: 0,
      degraded: 0,
      error: 0,
      total: this.integrationPoints.length
    };
    
    this.integrationPoints.forEach(point => {
      stats[point.status]++;
    });
    
    // Create issue list
    const issues = this.integrationPoints
      .filter(point => point.status !== 'healthy')
      .map(point => ({
        source: point.sourceComponent,
        target: point.targetComponent,
        status: point.status,
        issues: point.issues
      }));
    
    // Create report message
    const reportMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: EventType.BROADCAST,
      payload: {
        messageType: 'INTEGRATION_STATUS_REPORT',
        stats,
        systemStatus: stats.error > 0 ? 'degraded' : 'healthy',
        issues: issues.length > 0 ? issues : undefined,
        detailedReport: this.config.enableDetailedReporting ? this.integrationPoints : undefined,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendMessage(reportMessage);
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
      case 'check-integration':
        await this.performIntegrationCheck();
        return {
          success: true,
          message: 'Integration check triggered',
          timestamp: new Date().toISOString()
        };
        
      case 'validate-contracts':
        await this.validateApiContracts();
        return {
          success: true,
          message: 'Contract validation triggered',
          timestamp: new Date().toISOString()
        };
        
      case 'update-dependency-map':
        await this.updateDependencyMap();
        return {
          success: true,
          message: 'Dependency map update triggered',
          timestamp: new Date().toISOString()
        };
        
      case 'get-integration-points':
        return {
          integrationPoints: this.integrationPoints,
          timestamp: new Date().toISOString()
        };
        
      case 'get-api-contracts':
        return {
          apiContracts: this.apiContracts,
          timestamp: new Date().toISOString()
        };
        
      case 'get-dependency-map':
        return {
          dependencyMap: this.dependencyMap,
          diagram: this.generateDependencyDiagram(),
          timestamp: new Date().toISOString()
        };
        
      default:
        return {
          error: `Unknown request type: ${requestType}`,
          supportedTypes: [
            'check-integration', 
            'validate-contracts', 
            'update-dependency-map', 
            'get-integration-points', 
            'get-api-contracts', 
            'get-dependency-map'
          ],
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
        // Handle commands sent to the Integration Coordinator
        if (payload.command === 'register_integration_point') {
          this.handleRegisterIntegrationPoint(message);
        } else if (payload.command === 'update_api_contract') {
          this.handleUpdateApiContract(message);
        } else {
          this.sendCommandResponse(message, {
            status: 'error',
            message: `Unknown command: ${payload.command}`,
            errorCode: 'UNKNOWN_COMMAND'
          });
        }
        break;
        
      case EventType.STATUS_UPDATE:
        // Monitor status updates for integration-related issues
        if (payload.status === 'error' || payload.status === 'degraded') {
          this.checkForIntegrationIssues(sourceAgentId, payload);
        }
        break;
        
      case EventType.ASSISTANCE_REQUESTED:
        // Provide integration assistance when requested
        if (payload.problemType === 'integration_issue') {
          this.provideIntegrationAssistance(message);
        }
        break;
        
      default:
        // Log but don't specifically handle other message types
        this.logMessage(`Received ${eventType} message from ${sourceAgentId}`);
        break;
    }
  }
  
  /**
   * Handle registration of a new integration point
   * @param message The command message
   */
  private handleRegisterIntegrationPoint(message: AgentMessage): void {
    const { payload, sourceAgentId } = message;
    const { sourceComponent, targetComponent, integrationMethod, contract } = payload.parameters || {};
    
    if (!sourceComponent || !targetComponent || !integrationMethod) {
      this.sendCommandResponse(message, {
        status: 'error',
        message: 'Missing required parameters',
        errorCode: 'MISSING_PARAMETERS'
      });
      return;
    }
    
    // Check if integration point already exists
    const existingIndex = this.integrationPoints.findIndex(
      point => point.sourceComponent === sourceComponent && 
               point.targetComponent === targetComponent
    );
    
    if (existingIndex >= 0) {
      // Update existing integration point
      this.integrationPoints[existingIndex] = {
        ...this.integrationPoints[existingIndex],
        integrationMethod,
        contract,
        status: 'healthy',
        lastValidated: new Date().toISOString()
      };
    } else {
      // Add new integration point
      this.integrationPoints.push({
        sourceComponent,
        targetComponent,
        integrationMethod,
        contract,
        status: 'healthy',
        lastValidated: new Date().toISOString()
      });
      
      // Update dependency map
      if (!this.dependencyMap[sourceComponent]) {
        this.dependencyMap[sourceComponent] = [targetComponent];
      } else if (!this.dependencyMap[sourceComponent].includes(targetComponent)) {
        this.dependencyMap[sourceComponent].push(targetComponent);
      }
    }
    
    this.sendCommandResponse(message, {
      status: 'success',
      message: 'Integration point registered successfully',
      integrationPoint: this.integrationPoints.find(
        point => point.sourceComponent === sourceComponent && 
                 point.targetComponent === targetComponent
      )
    });
  }
  
  /**
   * Handle updating an API contract
   * @param message The command message
   */
  private handleUpdateApiContract(message: AgentMessage): void {
    const { payload } = message;
    const { name, version, endpoints } = payload.parameters || {};
    
    if (!name || !version || !endpoints) {
      this.sendCommandResponse(message, {
        status: 'error',
        message: 'Missing required parameters',
        errorCode: 'MISSING_PARAMETERS'
      });
      return;
    }
    
    // Check if contract already exists
    const existingIndex = this.apiContracts.findIndex(
      contract => contract.name === name
    );
    
    if (existingIndex >= 0) {
      // Update existing contract
      this.apiContracts[existingIndex] = {
        ...this.apiContracts[existingIndex],
        version,
        endpoints,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add new contract
      this.apiContracts.push({
        name,
        version,
        endpoints,
        lastUpdated: new Date().toISOString()
      });
    }
    
    this.sendCommandResponse(message, {
      status: 'success',
      message: 'API contract updated successfully',
      contract: this.apiContracts.find(
        contract => contract.name === name
      )
    });
  }
  
  /**
   * Check if a status update indicates an integration issue
   * @param agentId The agent ID that sent the status update
   * @param statusPayload The status update payload
   */
  private checkForIntegrationIssues(agentId: string, statusPayload: any): void {
    // Check if the error is related to an integration point
    const relevantPoints = this.integrationPoints.filter(
      point => point.sourceComponent === agentId || point.targetComponent === agentId
    );
    
    if (relevantPoints.length > 0) {
      // Updated affected integration points
      relevantPoints.forEach(point => {
        point.status = statusPayload.status;
        point.issues = [statusPayload.errorMessage || 'Unknown integration issue'];
      });
      
      // Send integration status report with new issues
      this.sendIntegrationReport();
    }
  }
  
  /**
   * Provide integration assistance
   * @param requestMessage The assistance request message
   */
  private provideIntegrationAssistance(requestMessage: AgentMessage): void {
    const { sourceAgentId, correlationId, payload } = requestMessage;
    
    // Find relevant integration points
    const relevantPoints = this.integrationPoints.filter(
      point => point.sourceComponent === sourceAgentId || point.targetComponent === sourceAgentId
    );
    
    let guidance = 'No specific integration guidance available for your component.';
    
    if (relevantPoints.length > 0) {
      // Generate guidance based on integration points
      guidance = `Integration Guidance:\n\n`;
      
      relevantPoints.forEach(point => {
        guidance += `- ${point.sourceComponent} → ${point.targetComponent}\n`;
        guidance += `  Method: ${point.integrationMethod}\n`;
        if (point.contract) {
          guidance += `  Contract: ${point.contract}\n`;
        }
        guidance += `  Status: ${point.status}\n`;
        if (point.issues && point.issues.length > 0) {
          guidance += `  Issues: ${point.issues.join(', ')}\n`;
        }
        guidance += '\n';
      });
      
      guidance += 'Recommendations:\n';
      guidance += '1. Ensure all message handlers are properly registered\n';
      guidance += '2. Check that API endpoints match the contract specifications\n';
      guidance += '3. Verify data formats match between components\n';
      guidance += '4. Use the MCP for all inter-agent communication\n';
    }
    
    // Send response
    const assistanceMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: correlationId,
      sourceAgentId: this.agentId,
      targetAgentId: sourceAgentId,
      timestamp: new Date().toISOString(),
      eventType: EventType.ASSISTANCE_RESPONSE,
      payload: {
        guidance,
        integrationPoints: relevantPoints,
        apiContracts: this.apiContracts.filter(
          contract => relevantPoints.some(point => point.contract === contract.name)
        )
      }
    };
    
    this.sendMessage(assistanceMessage);
    this.logMessage(`Provided integration assistance to ${sourceAgentId}`);
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
   * Clean up resources when agent is shut down
   */
  public shutdown(): void {
    // Clear intervals
    if (this.integrationCheckInterval) {
      clearInterval(this.integrationCheckInterval);
      this.integrationCheckInterval = null;
    }
    
    if (this.contractValidationInterval) {
      clearInterval(this.contractValidationInterval);
      this.contractValidationInterval = null;
    }
    
    if (this.dependencyMapUpdateInterval) {
      clearInterval(this.dependencyMapUpdateInterval);
      this.dependencyMapUpdateInterval = null;
    }
    
    // Log shutdown
    this.logMessage('Integration Coordinator Agent shutting down');
  }
}
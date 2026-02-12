/**
 * MCP Controller
 * 
 * This module initializes and manages the Master Control Program (MCP) and Agent Army.
 * It provides methods for interacting with agents through the MCP.
 */

import { MasterControlProgram } from '../agents/MasterControlProgram';
import { getMCPConfig } from '../config/mcpConfig';
import { ValuationAgent } from '../agents/ValuationAgent.new';
import { DataCleanerAgent } from '../agents/DataCleanerAgent.new';
import { ReportingAgent } from '../agents/ReportingAgent.new';
import { IAgent } from '../agents/BaseAgent';
import { AgentType, EventType } from '../shared/agentProtocol';

// Singleton instance of the MCP
let mcpInstance: MasterControlProgram | null = null;

/**
 * Initialize the MCP and register all agents
 * This should be called during application startup
 */
export function initializeMcp(): MasterControlProgram {
  if (mcpInstance) {
    console.log('MCP already initialized');
    return mcpInstance;
  }
  
  console.log('Initializing MCP and Agent Army...');
  
  // Create MCP instance with configuration
  const config = getMCPConfig();
  mcpInstance = MasterControlProgram.getInstance(config);
  
  // Initialize and register agents
  registerCoreAgents(mcpInstance);
  
  console.log('MCP and Agent Army initialization complete');
  
  return mcpInstance;
}

/**
 * Get the MCP instance
 * @returns The MCP instance
 */
export function getMcp(): MasterControlProgram {
  if (!mcpInstance) {
    return initializeMcp();
  }
  return mcpInstance;
}

/**
 * Process a request through an agent
 * @param agentType Type of agent to handle the request
 * @param request Request data
 * @returns Promise resolving to the response
 */
export async function processAgentRequest(agentType: AgentType, request: any): Promise<any> {
  const mcp = getMcp();
  
  // Find an agent with the requested capability based on the request type
  let capability = '';
  
  switch (request.type) {
    case 'analyze-income':
      capability = 'income_analysis';
      break;
    case 'detect-anomalies':
      capability = 'anomaly_detection';
      break;
    case 'analyze-data-quality':
      capability = 'data_validation';
      break;
    case 'generate-report':
      capability = 'report_generation';
      break;
    default:
      // Default to finding any agent of the requested type
      const agents = getAgentsByType(agentType);
      if (agents.length > 0) {
        return await agents[0].processRequest(request);
      }
      throw new Error(`No agent available for type: ${agentType}`);
  }
  
  // Find an agent with the required capability
  // Use the capability map to find suitable agents
  const capabilityMap = mcp.getCapabilityMap();
  const agentsWithCapability = capabilityMap[capability] || [];
  
  if (agentsWithCapability.length === 0) {
    throw new Error(`No agent available with capability: ${capability}`);
  }
  
  // Use the first agent with the capability
  const agentId = agentsWithCapability[0];
  
  // Get the agent and process the request
  const agent = getAgentById(agentId);
  
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }
  
  return await agent.processRequest(request);
}

/**
 * Send a command to all agents of a specific type
 * @param agentType Type of agents to target
 * @param commandName Name of the command
 * @param parameters Command parameters
 */
export function broadcastAgentCommand(
  agentType: AgentType,
  commandName: string,
  parameters: any
): void {
  const mcp = getMcp();
  
  // Get all agents of the specified type
  const agents = getAgentsByType(agentType);
  
  // Send command to each agent
  agents.forEach(agent => {
    mcp.sendSystemMessage(
      agent.getAgentId(),
      EventType.COMMAND,
      {
        command: commandName,
        parameters
      }
    );
  });
}

/**
 * Get agent performance metrics
 * @returns Object mapping agent IDs to their metrics
 */
export function getAgentMetrics(): Record<string, any> {
  const mcp = getMcp();
  // Use system info which includes metrics
  const systemInfo = mcp.getSystemInfo();
  const agentList = mcp.getAgentList();
  
  // Create metrics map
  const metrics: Record<string, any> = {};
  
  agentList.forEach(agent => {
    const agentStatus = mcp.getAgentStatus(agent.id);
    if (agentStatus) {
      metrics[agent.id] = agentStatus;
    }
  });
  
  return metrics;
}

/**
 * Get all experiences from the replay buffer
 * @param count Maximum number of experiences to retrieve
 * @returns Array of experiences
 */
export function getExperiences(count: number = 100): any[] {
  const mcp = getMcp();
  return mcp.getExperiences(count);
}

/**
 * Register core agents with the MCP
 * @param mcp The MCP instance
 */
function registerCoreAgents(mcp: MasterControlProgram): void {
  // Create and register ValuationAgent
  const valuationAgent = new ValuationAgent('valuation-agent-1');
  mcp.registerAgent(valuationAgent);
  
  // Create and register DataCleanerAgent
  const dataCleanerAgent = new DataCleanerAgent('data-cleaner-agent-1');
  mcp.registerAgent(dataCleanerAgent);
  
  // Create and register ReportingAgent
  const reportingAgent = new ReportingAgent('reporting-agent-1');
  mcp.registerAgent(reportingAgent);
  
  // Add any additional agents here
  
  console.log('Core agents registered with MCP');
}

/**
 * Get an agent by ID
 * @param agentId ID of the agent to retrieve
 * @returns The agent instance or null if not found
 */
function getAgentById(agentId: string): IAgent | null {
  // This would lookup the agent in the MCP
  // For now, our implementation doesn't expose this directly from the MCP
  // In a real implementation, you would add a method to the MCP to get an agent by ID
  
  // This is a workaround for our current implementation
  const allAgents = getAllAgents();
  return allAgents.find(agent => agent.getAgentId() === agentId) || null;
}

/**
 * Get all registered agents
 * @returns Array of all agents
 */
function getAllAgents(): IAgent[] {
  // This would get all agents from the MCP
  // For now, our implementation doesn't expose this directly from the MCP
  // In a real implementation, you would add a method to the MCP to get all agents
  
  // For this example, we'll recreate our agents
  // This is not ideal and would be replaced with proper MCP integration
  const agents: IAgent[] = [
    new ValuationAgent('valuation-agent-1'),
    new DataCleanerAgent('data-cleaner-agent-1'),
    new ReportingAgent('reporting-agent-1')
  ];
  
  return agents;
}

/**
 * Get agents by type
 * @param agentType Type of agents to retrieve
 * @returns Array of matching agents
 */
function getAgentsByType(agentType: AgentType): IAgent[] {
  // Get all agents and filter by type
  const allAgents = getAllAgents();
  return allAgents.filter(agent => agent.getAgentType() === agentType);
}
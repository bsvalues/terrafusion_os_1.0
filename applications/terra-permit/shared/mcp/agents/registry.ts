/**
 * Model Content Protocol - Agent Registry Interface
 * 
 * Defines the interface for agent registry operations within the MCP framework.
 */

import { 
  AgentRegistration, 
  AgentState, 
  AgentCapability,
  AgentStatus,
  AgentQuery,
  WorkflowDefinition,
  WorkflowInstance
} from './schemas';

/**
 * Interface defining operations for an agent registry service
 */
export interface IAgentRegistry {
  // Agent registration and management
  registerAgent(agent: AgentRegistration): Promise<AgentState>;
  updateAgentStatus(agentId: string, status: AgentStatus, load?: number): Promise<AgentState>;
  deregisterAgent(agentId: string): Promise<boolean>;
  getAgent(agentId: string): Promise<AgentState | null>;
  
  // Agent discovery
  listAgents(query?: Partial<AgentQuery>): Promise<AgentState[]>;
  findAgentsByCapability(capability: AgentCapability, availableOnly?: boolean): Promise<AgentState[]>;
  findBestAgentForCapability(capability: AgentCapability): Promise<AgentState | null>;
  
  // Workflow management
  registerWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>;
  getWorkflow(workflowId: string): Promise<WorkflowDefinition | null>;
  listWorkflows(): Promise<WorkflowDefinition[]>;
  
  // Workflow execution
  startWorkflow(workflowId: string, input: Record<string, any>): Promise<WorkflowInstance>;
  getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null>;
  listWorkflowInstances(workflowId?: string): Promise<WorkflowInstance[]>;
  
  // Agent metrics
  reportAgentMetrics(
    agentId: string, 
    metrics: {
      successRate?: number;
      averageResponseTime?: number;
      requestsProcessed?: number;
    }
  ): Promise<AgentState>;
  
  // Subscription management
  subscribeToAgentUpdates(callback: (agent: AgentState) => void): () => void;
  subscribeToWorkflowEvents(callback: (instance: WorkflowInstance) => void): () => void;
}

/**
 * Standard error codes for agent registry operations
 */
export enum AgentRegistryErrorCode {
  AGENT_NOT_FOUND = 'agent_not_found',
  DUPLICATE_AGENT = 'duplicate_agent',
  WORKFLOW_NOT_FOUND = 'workflow_not_found',
  DUPLICATE_WORKFLOW = 'duplicate_workflow',
  INSTANCE_NOT_FOUND = 'instance_not_found',
  VALIDATION_ERROR = 'validation_error',
  UNAUTHORIZED = 'unauthorized',
  INTERNAL_ERROR = 'internal_error',
}

/**
 * Custom error class for agent registry operations
 */
export class AgentRegistryError extends Error {
  constructor(
    public code: AgentRegistryErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentRegistryError';
  }
}

/**
 * Helper functions for agent selection
 */
export const AgentSelectionStrategies = {
  /**
   * Select the agent with the lowest current load
   */
  lowestLoad: (agents: AgentState[]): AgentState | null => {
    if (!agents.length) return null;
    return agents.reduce((lowest, current) => 
      current.currentLoad < lowest.currentLoad ? current : lowest, agents[0]);
  },
  
  /**
   * Select the agent with the highest success rate
   */
  highestSuccessRate: (agents: AgentState[]): AgentState | null => {
    if (!agents.length) return null;
    return agents.reduce((highest, current) => 
      current.successRate > highest.successRate ? current : highest, agents[0]);
  },
  
  /**
   * Select the agent with the fastest response time
   */
  fastestResponseTime: (agents: AgentState[]): AgentState | null => {
    if (!agents.length) return null;
    const agentsWithResponseTime = agents.filter(a => a.averageResponseTime !== undefined);
    if (!agentsWithResponseTime.length) return agents[0];
    
    return agentsWithResponseTime.reduce((fastest, current) => 
      current.averageResponseTime! < fastest.averageResponseTime! ? current : fastest, 
      agentsWithResponseTime[0]);
  },
  
  /**
   * Select an agent using a weighted score based on multiple factors
   */
  weightedScore: (
    agents: AgentState[], 
    weights = { load: 0.5, successRate: 0.3, responseTime: 0.2 }
  ): AgentState | null => {
    if (!agents.length) return null;
    
    // Normalize weights
    const totalWeight = weights.load + weights.successRate + weights.responseTime;
    const normalizedWeights = {
      load: weights.load / totalWeight,
      successRate: weights.successRate / totalWeight,
      responseTime: weights.responseTime / totalWeight
    };
    
    // Calculate scores (higher is better)
    const scores = agents.map(agent => {
      let score = 0;
      
      // Load score (invert since lower load is better)
      score += (1 - agent.currentLoad) * normalizedWeights.load;
      
      // Success rate score
      score += agent.successRate * normalizedWeights.successRate;
      
      // Response time score (normalize to 0-1 range where 1 is fastest)
      if (agent.averageResponseTime !== undefined) {
        const maxResponseTime = Math.max(...agents
          .filter(a => a.averageResponseTime !== undefined)
          .map(a => a.averageResponseTime!));
        
        if (maxResponseTime > 0) {
          score += (1 - (agent.averageResponseTime / maxResponseTime)) * normalizedWeights.responseTime;
        }
      }
      
      return { agent, score };
    });
    
    // Select agent with highest score
    return scores.reduce((best, current) => 
      current.score > best.score ? current : best, scores[0]).agent;
  }
};
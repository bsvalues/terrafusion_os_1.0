/**
 * Agent Registry Service
 * 
 * Implements the IAgentRegistry interface for managing and coordinating agents.
 */

import { 
  AgentRegistration,
  AgentState,
  AgentStatus,
  AgentCapability,
  AgentQuery,
  WorkflowDefinition,
  WorkflowInstance
} from '@shared/mcp/agents/schemas';

import { 
  IAgentRegistry, 
  AgentRegistryError, 
  AgentRegistryErrorCode,
  AgentSelectionStrategies
} from '@shared/mcp/agents/registry';

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../vite';

/**
 * In-memory implementation of the agent registry
 */
export class AgentRegistryService implements IAgentRegistry {
  private agents: Map<string, AgentState> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private workflowInstances: Map<string, WorkflowInstance> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  
  // Event names
  private static readonly AGENT_UPDATED = 'agent_updated';
  private static readonly WORKFLOW_UPDATED = 'workflow_updated';
  
  constructor() {
    log('Agent Registry Service initialized', 'agent-registry');
    this.setupHeartbeatCheck();
  }
  
  /**
   * Set up a periodic check for agent heartbeats
   */
  private setupHeartbeatCheck() {
    const checkInterval = 30000; // 30 seconds
    
    setInterval(() => {
      const now = new Date();
      // Convert the Map iterator to an array to avoid the downlevelIteration issue
      Array.from(this.agents.entries()).forEach(([agentId, agent]) => {
        if (agent.status !== AgentStatus.OFFLINE && agent.lastHeartbeat) {
          const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
          
          // If no heartbeat for 2 minutes, mark as offline
          if (timeSinceHeartbeat > 120000) {
            this.updateAgentStatus(agentId, AgentStatus.OFFLINE);
            log(`Agent ${agent.name} (${agentId}) marked offline due to missing heartbeat`, 'agent-registry');
          }
        }
      });
    }, checkInterval);
  }

  /**
   * Register a new agent with the registry
   */
  async registerAgent(agent: AgentRegistration): Promise<AgentState> {
    // Check if agent with this ID already exists
    if (this.agents.has(agent.id)) {
      throw new AgentRegistryError(
        AgentRegistryErrorCode.DUPLICATE_AGENT,
        `Agent with ID ${agent.id} already exists`
      );
    }
    
    // Create agent state with default values
    const agentState: AgentState = {
      ...agent,
      status: AgentStatus.AVAILABLE,
      lastHeartbeat: new Date(),
      currentLoad: 0,
      totalRequestsProcessed: 0,
      successRate: 1,
      activeWorkflows: []
    };
    
    // Store the agent
    this.agents.set(agent.id, agentState);
    
    log(`Agent registered: ${agent.name} (${agent.id}) with capabilities: ${agent.capabilities.join(', ')}`, 'agent-registry');
    
    // Emit event
    this.eventEmitter.emit(AgentRegistryService.AGENT_UPDATED, agentState);
    
    return agentState;
  }

  /**
   * Update an agent's status and load
   */
  async updateAgentStatus(agentId: string, status: AgentStatus, load: number = 0): Promise<AgentState> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new AgentRegistryError(
        AgentRegistryErrorCode.AGENT_NOT_FOUND,
        `Agent with ID ${agentId} not found`
      );
    }
    
    // Update agent state
    const updatedAgent: AgentState = {
      ...agent,
      status,
      currentLoad: load,
      lastHeartbeat: new Date()
    };
    
    this.agents.set(agentId, updatedAgent);
    
    log(`Agent ${agent.name} (${agentId}) status updated to ${status} with load ${load}`, 'agent-registry');
    
    // Emit event
    this.eventEmitter.emit(AgentRegistryService.AGENT_UPDATED, updatedAgent);
    
    return updatedAgent;
  }

  /**
   * Deregister an agent from the registry
   */
  async deregisterAgent(agentId: string): Promise<boolean> {
    if (!this.agents.has(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId)!;
    log(`Agent deregistered: ${agent.name} (${agentId})`, 'agent-registry');
    
    // Clean up any active workflows for this agent
    Array.from(this.workflowInstances.entries()).forEach(([instanceId, instance]) => {
      if (instance.status === 'running' && instance.currentSteps.length > 0) {
        // Update workflow instance to remove this agent from current steps
        // This is a simplified approach - in a real system, you'd need to handle this more gracefully
        this.workflowInstances.set(instanceId, {
          ...instance,
          errors: [
            ...instance.errors,
            {
              stepId: instance.currentSteps[0], // Simplified - assume first current step
              error: `Agent ${agentId} deregistered while step was in progress`,
              timestamp: new Date()
            }
          ]
        });
      }
    });
    
    // Remove the agent
    this.agents.delete(agentId);
    
    // Emit a final update event with offline status
    this.eventEmitter.emit(AgentRegistryService.AGENT_UPDATED, {
      ...agent,
      status: AgentStatus.OFFLINE
    });
    
    return true;
  }

  /**
   * Get an agent by its ID
   */
  async getAgent(agentId: string): Promise<AgentState | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * List agents based on a query
   */
  async listAgents(query?: Partial<AgentQuery>): Promise<AgentState[]> {
    let agents = Array.from(this.agents.values());
    
    // Apply filters based on query
    if (query) {
      if (query.capabilities && query.capabilities.length > 0) {
        agents = agents.filter(agent => 
          query.capabilities!.every(cap => agent.capabilities.includes(cap))
        );
      }
      
      if (query.provider) {
        agents = agents.filter(agent => agent.provider === query.provider);
      }
      
      if (query.status) {
        agents = agents.filter(agent => agent.status === query.status);
      }
      
      if (query.minSuccessRate !== undefined) {
        agents = agents.filter(agent => agent.successRate >= query.minSuccessRate!);
      }
      
      if (query.maxResponseTime !== undefined && query.maxResponseTime > 0) {
        agents = agents.filter(agent => 
          agent.averageResponseTime === undefined || 
          agent.averageResponseTime <= query.maxResponseTime!
        );
      }
      
      if (query.tags && query.tags.length > 0) {
        agents = agents.filter(agent => 
          query.tags!.some(tag => agent.metadata?.tags?.includes(tag))
        );
      }
      
      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      
      agents = agents.slice(offset, offset + limit);
    }
    
    return agents;
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: AgentCapability, availableOnly: boolean = true): Promise<AgentState[]> {
    const agents = Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.includes(capability) && 
      (!availableOnly || agent.status === AgentStatus.AVAILABLE)
    );
    
    return agents;
  }

  /**
   * Find the best agent for a given capability
   */
  async findBestAgentForCapability(capability: AgentCapability): Promise<AgentState | null> {
    const availableAgents = await this.findAgentsByCapability(capability, true);
    
    if (availableAgents.length === 0) {
      return null;
    }
    
    // Use the weighted score strategy for selecting the best agent
    return AgentSelectionStrategies.weightedScore(availableAgents);
  }

  /**
   * Register a workflow definition
   */
  async registerWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    // Check if workflow with this ID already exists
    if (this.workflows.has(workflow.id)) {
      throw new AgentRegistryError(
        AgentRegistryErrorCode.DUPLICATE_WORKFLOW,
        `Workflow with ID ${workflow.id} already exists`
      );
    }
    
    // Store the workflow
    this.workflows.set(workflow.id, {
      ...workflow,
      updatedAt: new Date()
    });
    
    log(`Workflow registered: ${workflow.name} (${workflow.id}) with ${workflow.steps.length} steps`, 'agent-registry');
    
    return workflow;
  }

  /**
   * Get a workflow by its ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * List all registered workflows
   */
  async listWorkflows(): Promise<WorkflowDefinition[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Start a workflow instance
   */
  async startWorkflow(workflowId: string, input: Record<string, any>): Promise<WorkflowInstance> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new AgentRegistryError(
        AgentRegistryErrorCode.WORKFLOW_NOT_FOUND,
        `Workflow with ID ${workflowId} not found`
      );
    }
    
    // Determine initial steps (simplified approach)
    // In a real system, you'd analyze the workflow graph to find starting nodes
    const initialSteps = workflow.steps.length > 0 ? [workflow.steps[0].id] : [];
    
    // Create a new workflow instance
    const instance: WorkflowInstance = {
      id: uuidv4(),
      workflowId,
      status: 'running',
      currentSteps: initialSteps,
      completedSteps: [],
      input,
      intermediateResults: {},
      errors: [],
      startTime: new Date(),
      priority: 5
    };
    
    // Store the instance
    this.workflowInstances.set(instance.id, instance);
    
    log(`Workflow instance started: ${instance.id} for workflow ${workflow.name} (${workflowId})`, 'agent-registry');
    
    // Emit event
    this.eventEmitter.emit(AgentRegistryService.WORKFLOW_UPDATED, instance);
    
    // In a real implementation, you would now begin executing the workflow steps
    // by finding agents for each capability and dispatching tasks
    // This is simplified for this example
    
    return instance;
  }

  /**
   * Get a workflow instance by its ID
   */
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
    return this.workflowInstances.get(instanceId) || null;
  }

  /**
   * List workflow instances, optionally filtered by workflow ID
   */
  async listWorkflowInstances(workflowId?: string): Promise<WorkflowInstance[]> {
    const instances = Array.from(this.workflowInstances.values());
    
    if (workflowId) {
      return instances.filter(instance => instance.workflowId === workflowId);
    }
    
    return instances;
  }

  /**
   * Report agent metrics
   */
  async reportAgentMetrics(
    agentId: string, 
    metrics: {
      successRate?: number;
      averageResponseTime?: number;
      requestsProcessed?: number;
    }
  ): Promise<AgentState> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new AgentRegistryError(
        AgentRegistryErrorCode.AGENT_NOT_FOUND,
        `Agent with ID ${agentId} not found`
      );
    }
    
    // Update agent with new metrics
    const updatedAgent: AgentState = {
      ...agent,
      successRate: metrics.successRate !== undefined ? metrics.successRate : agent.successRate,
      averageResponseTime: metrics.averageResponseTime !== undefined ? 
        metrics.averageResponseTime : agent.averageResponseTime,
      totalRequestsProcessed: metrics.requestsProcessed !== undefined ?
        agent.totalRequestsProcessed + metrics.requestsProcessed : agent.totalRequestsProcessed,
      lastHeartbeat: new Date()
    };
    
    this.agents.set(agentId, updatedAgent);
    
    log(`Agent ${agent.name} (${agentId}) metrics updated: ${JSON.stringify(metrics)}`, 'agent-registry');
    
    // Emit event
    this.eventEmitter.emit(AgentRegistryService.AGENT_UPDATED, updatedAgent);
    
    return updatedAgent;
  }

  /**
   * Subscribe to agent updates
   */
  subscribeToAgentUpdates(callback: (agent: AgentState) => void): () => void {
    this.eventEmitter.on(AgentRegistryService.AGENT_UPDATED, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(AgentRegistryService.AGENT_UPDATED, callback);
    };
  }

  /**
   * Subscribe to workflow events
   */
  subscribeToWorkflowEvents(callback: (instance: WorkflowInstance) => void): () => void {
    this.eventEmitter.on(AgentRegistryService.WORKFLOW_UPDATED, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(AgentRegistryService.WORKFLOW_UPDATED, callback);
    };
  }
}
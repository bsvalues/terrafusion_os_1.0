import { AgentBase, AgentTask } from "../interfaces/agent";
import { BaseAgent } from "./base-agent";
import { ValuationAgent } from "../agents/valuation-agent";
import { DataProcessingAgent } from "../agents/data-processing-agent";
import { TerminologyAgent } from "../agents/terminology-agent";

/**
 * Agent Coordinator
 *
 * Responsible for coordinating tasks between different AI agents
 * and ensuring they work together effectively.
 */
export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private agents: Map<string, AgentBase>;
  private logger: Console;

  private constructor() {
    this.agents = new Map<string, AgentBase>();
    this.logger = console;

    // Register built-in agents
    this.registerBuiltInAgents();
  }

  /**
   * Get the singleton instance of the AgentCoordinator
   */
  public static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }

  /**
   * Register a new agent with the coordinator
   * @param agent The agent to register
   */
  public registerAgent(agent: AgentBase): void {
    this.logger.info(`[Agent Coordinator] Registering agent "${agent.name}" (${agent.id})`);
    this.agents.set(agent.id, agent);
  }

  /**
   * Get an agent by its ID
   * @param agentId The ID of the agent to get
   */
  public getAgent(agentId: string): AgentBase | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): AgentBase[] {
    return Array.from(this.agents.values());
  }

  /**
   * Dispatch a task to the appropriate agent
   * @param task The task to dispatch
   * @param agentId Optional specific agent ID to dispatch to
   */
  public async dispatchTask<T, R>(task: AgentTask<T>, agentId?: string): Promise<R> {
    if (agentId) {
      const agent = this.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }
      return (await agent.processTask(task)) as R;
    }

    // Find the best agent for this task type
    const bestAgent = this.findBestAgentForTask(task);
    if (!bestAgent) {
      throw new Error(`No agent found for task type: ${task.type}`);
    }

    return (await bestAgent.processTask(task)) as R;
  }

  /**
   * Find the best agent to handle a given task
   * @param task The task to find an agent for
   */
  private findBestAgentForTask<T>(task: AgentTask<T>): AgentBase | undefined {
    // This is a simple implementation that just returns the first agent
    // that can handle the task. In a real system, this would be more sophisticated.
    for (const agent of this.agents.values()) {
      if (agent instanceof BaseAgent) {
        if (agent.canHandleTask(task)) {
          return agent;
        }
      }
    }
    return undefined;
  }

  /**
   * Register the built-in agents
   */
  private registerBuiltInAgents(): void {
    // Register the valuation agent
    this.registerAgent(new ValuationAgent());

    // Register the data processing agent
    this.registerAgent(new DataProcessingAgent());

    // Register the terminology agent
    this.registerAgent(new TerminologyAgent());

    // Add more built-in agents as needed
  }
}

// Export a singleton instance of the coordinator
export const agentCoordinator = AgentCoordinator.getInstance();

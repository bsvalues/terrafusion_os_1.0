/**
 * Agent Factory
 * 
 * This service is responsible for creating and managing all AI agents
 * in the system. It provides a central point for initializing and
 * coordinating the behavior of different specialized agents.
 */

import { logger } from '../utils/logger';
import { IStorage } from '../storage';
import { PropertyIntelligenceAgent } from './property-intelligence-agent';
import { AgentCoordinator } from './agent-coordinator';

/**
 * Agent factory service
 */
export class AgentFactory {
  private static instance: AgentFactory;
  private storage: IStorage;
  private agents: Map<string, any> = new Map();
  private agentCoordinator: AgentCoordinator;
  private initialized: boolean = false;
  
  /**
   * Create a new agent factory
   * 
   * @param storage Storage service
   */
  private constructor(storage: IStorage) {
    this.storage = storage;
    this.agentCoordinator = AgentCoordinator.getInstance(storage);
    
    logger.info('Agent Factory created');
  }
  
  /**
   * Get the singleton instance of the agent factory
   * 
   * @param storage Storage service
   * @returns The agent factory instance
   */
  public static getInstance(storage: IStorage): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory(storage);
    }
    return AgentFactory.instance;
  }
  
  /**
   * Initialize all agents
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('Agent Factory already initialized');
      return;
    }
    
    logger.info('Initializing Agent Factory...');
    
    try {
      // Create and start the Property Intelligence Agent
      const propertyIntelligenceAgent = PropertyIntelligenceAgent.getInstance(this.storage);
      await propertyIntelligenceAgent.start();
      this.agents.set('property-intelligence-agent', propertyIntelligenceAgent);
      
      // Add more agents here as needed
      
      // Mark as initialized
      this.initialized = true;
      
      // Log success
      logger.info('Agent Factory initialized successfully');
      
      // Record in system activity log
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_ready',
        component: 'agent-factory',
        status: 'success',
        details: {
          agentCount: this.agents.size,
          initializedAgents: Array.from(this.agents.keys())
        }
      });
    } catch (error) {
      logger.error(`Error initializing Agent Factory: ${error.message}`);
      
      // Record error in system activity log
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_error',
        component: 'agent-factory',
        status: 'error',
        details: {
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Shutdown all agents
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      logger.info('Agent Factory not initialized');
      return;
    }
    
    logger.info('Shutting down Agent Factory...');
    
    try {
      // Stop all agents
      for (const [agentId, agent] of this.agents.entries()) {
        if (agent.stop) {
          await agent.stop();
          logger.info(`Agent ${agentId} stopped`);
        }
      }
      
      // Clear the agents map
      this.agents.clear();
      
      // Mark as not initialized
      this.initialized = false;
      
      // Log success
      logger.info('Agent Factory shut down successfully');
      
      // Record in system activity log
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_shutdown',
        component: 'agent-factory',
        status: 'success'
      });
    } catch (error) {
      logger.error(`Error shutting down Agent Factory: ${error.message}`);
      
      // Record error in system activity log
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_error',
        component: 'agent-factory',
        status: 'error',
        details: {
          error: error.message
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Get an agent by ID
   * 
   * @param agentId Agent ID
   * @returns The agent or undefined if not found
   */
  public getAgent(agentId: string): any {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents
   * 
   * @returns Map of all agents
   */
  public getAllAgents(): Map<string, any> {
    return this.agents;
  }
  
  /**
   * Get the agent coordinator
   * 
   * @returns The agent coordinator
   */
  public getAgentCoordinator(): AgentCoordinator {
    return this.agentCoordinator;
  }
}
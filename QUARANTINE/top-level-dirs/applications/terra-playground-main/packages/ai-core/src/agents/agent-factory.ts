/**
 * Agent Factory
 *
 * Provides a factory for creating different types of agents.
 */

import { BaseAgent } from './base-agent';
import { PropertyAssessmentAgent } from './property-agent';
import { MappingAgent } from './mapping-agent';
import { TeamCollaborationAgent } from './team-collaboration-agent';
import { AgentFactoryOptions, AgentCreationOptions } from '../models/agent-types';

/**
 * Agent factory class
 */
export class AgentFactory {
  private options: AgentFactoryOptions;

  constructor(options: AgentFactoryOptions) {
    this.options = options;
  }

  /**
   * Create an agent based on type
   */
  public createAgent(options: AgentCreationOptions): BaseAgent {
    switch (options.type) {
      case 'property-assessment':
        return new PropertyAssessmentAgent(
          options.id,
          options.name,
          options.description,
          this.options.storage,
          this.options.llmService,
          options.config || this.options.defaultConfig
        );

      case 'mapping':
        return new MappingAgent(
          options.id,
          options.name,
          options.description,
          this.options.storage,
          this.options.llmService,
          options.config || this.options.defaultConfig
        );

      case 'team-collaboration':
        return new TeamCollaborationAgent(
          options.id,
          options.name,
          options.description,
          this.options.storage,
          this.options.llmService,
          options.config || this.options.defaultConfig
        );

      default:
        throw new Error(`Unsupported agent type: ${options.type}`);
    }
  }

  /**
   * Create a property assessment agent
   */
  public createPropertyAssessmentAgent(
    id: string,
    name: string,
    description: string,
    config?: any
  ): PropertyAssessmentAgent {
    return new PropertyAssessmentAgent(
      id,
      name,
      description,
      this.options.storage,
      this.options.llmService,
      config || this.options.defaultConfig
    );
  }

  /**
   * Create a mapping agent
   */
  public createMappingAgent(
    id: string,
    name: string,
    description: string,
    config?: any
  ): MappingAgent {
    return new MappingAgent(
      id,
      name,
      description,
      this.options.storage,
      this.options.llmService,
      config || this.options.defaultConfig
    );
  }

  /**
   * Create a team collaboration agent
   */
  public createTeamCollaborationAgent(
    id: string,
    name: string,
    description: string,
    config?: any
  ): TeamCollaborationAgent {
    return new TeamCollaborationAgent(
      id,
      name,
      description,
      this.options.storage,
      this.options.llmService,
      config || this.options.defaultConfig
    );
  }
}

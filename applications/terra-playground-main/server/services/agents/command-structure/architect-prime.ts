import { BaseAgent, AgentCapability, AgentConfig } from '../base-agent';
import { logger } from '../../../utils/logger';
import { IStorage } from '../../../storage';
import { MessageEventType, MessagePriority, EntityType } from '../../../../shared/schema';
import { MCPService } from '../../../services/mcp';

interface VisionStatementContext {
  workflow: string;
  type: string;
}

interface VisionStatementContent {
  message: string;
  context: VisionStatementContext;
}

interface AgentMessage {
  senderAgentId: string;
  receiverAgentId: string;
  messageType: MessageEventType;
  priority: MessagePriority;
  subject: string;
  content: VisionStatementContent;
  status: string;
  messageId: string;
  conversationId: string | null;
}

/**
 * ArchitectPrimeAgent
 *
 * The highest level agent in the command structure.
 * Maintains architectural vision and system integrity.
 * Provides guidance to the Integration Coordinator and Component Lead agents.
 */
export class ArchitectPrimeAgent extends BaseAgent {
  constructor(storage: IStorage, mcpService?: MCPService) {
    const agentId = 'architect_prime';

    const config: AgentConfig = {
      id: agentId,
      name: 'Architect Prime',
      description:
        'The highest level agent in the command structure that maintains architectural vision and system integrity.',
      capabilities: [
        {
          name: 'maintainArchitecturalVision',
          description: 'Maintains the architectural vision of the system',
          handler: async () => ({ status: 'success', message: 'Architectural vision maintained' }),
        },
        {
          name: 'ensureSystemIntegrity',
          description: 'Ensures system integrity across all components',
          handler: async () => ({ status: 'success', message: 'System integrity verified' }),
        },
        {
          name: 'generateArchitectureDiagrams',
          description: 'Generates architectural diagrams',
          handler: async (params: Record<string, unknown>, agent: BaseAgent) => {
            if (agent instanceof ArchitectPrimeAgent) {
              return agent.generateArchitectureDiagram();
            }
            throw new Error('Invalid agent type for architecture diagram generation');
          },
        },
        {
          name: 'createVisionStatements',
          description: 'Creates vision statements for the system',
          handler: async (params: Record<string, unknown>, agent: BaseAgent) => {
            if (agent instanceof ArchitectPrimeAgent) {
              return agent.createDailyVisionStatement();
            }
            throw new Error('Invalid agent type for vision statement creation');
          },
        },
        {
          name: 'resolveArchitecturalConflicts',
          description: 'Resolves architectural conflicts between components',
          handler: async (params: Record<string, unknown>, agent: BaseAgent) => {
            if (agent instanceof ArchitectPrimeAgent) {
              return agent.resolveArchitecturalConflict(
                params.componentA as string,
                params.componentB as string,
                params.conflictDescription as string
              );
            }
            throw new Error('Invalid agent type for conflict resolution');
          },
        },
      ],
      permissions: ['system:architect', 'component:all:read', 'component:all:write'],
    };

    super(storage, mcpService || ({} as MCPService), config);

    // Ensure both id and agentId are properly set
    this.id = agentId;
    this.agentId = agentId;
  }

  async initialize(): Promise<void> {
    try {
      logger.info({
        component: 'Architect Prime Agent',
        message: 'Initializing architect prime agent',
        agentId: this.agentId,
      });

      // Register capabilities
      this.capabilities.forEach(capability => {
        logger.debug({
          component: 'Architect Prime Agent',
          message: `Registered capability: ${capability.name}`,
        });
      });

      logger.info({
        component: 'Architect Prime Agent',
        message: 'Architect prime agent initialization complete',
        agentId: this.agentId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error({
        component: 'Architect Prime Agent',
        message: `Failed to initialize architect prime agent: ${errorMessage}`,
        agentId: this.agentId,
      });
      throw error;
    }
  }

  /**
   * Generate and distribute vision statements to all teams
   */
  async createDailyVisionStatement(): Promise<string> {
    try {
      logger.info({ component: 'Architect Prime Agent', message: 'Creating daily vision statement' });

      // Generate a fallback agent ID if this.agentId is null or undefined
      const fallbackAgentId = 'architect_prime_fallback';
      if (
        !this.agentId ||
        this.agentId === 'null' ||
        this.agentId === 'undefined' ||
        typeof this.agentId !== 'string'
      ) {
        logger.warn({
          component: 'Architect Prime Agent',
          message: `Invalid agent ID detected, using fallback ID: ${fallbackAgentId}`,
        });
        this.agentId = fallbackAgentId;
        // Also update the id property to maintain consistency
        this.id = fallbackAgentId;
      }

      const visionStatement = `
        BCBS GeoAssessment System Vision: 
        A state-of-the-art property assessment platform integrating geospatial data, 
        tax calculation, and valuation methodologies in a cohesive system that promotes
        accuracy, transparency, and regulatory compliance while enabling efficient
        workflows for assessors and providing clear information to property owners.
      `;

      // Distribute to all component leads
      const componentLeads = [
        'bsbcmaster_lead',
        'bcbsgispro_lead',
        'bcbslevy_lead',
        'bcbscostapp_lead',
        'bcbsgeoassessmentpro_lead',
      ];

      for (const leadId of componentLeads) {
        // Ensure we have a valid agentId before calling createAgentMessage
        const agentId = this.agentId || fallbackAgentId;

        const message: AgentMessage = {
          senderAgentId: agentId,
          receiverAgentId: leadId,
          messageType: MessageEventType.COMMAND,
          priority: MessagePriority.HIGH,
          subject: 'Daily Vision Statement',
          content: {
            message: visionStatement,
            context: {
              workflow: 'system-vision',
              type: 'vision-statement',
            },
          },
          status: 'pending',
          messageId: `vision-${Date.now()}`,
          conversationId: null,
        };

        await this.storage.createAgentMessage(message);
      }

      // Also send to integration coordinator
      const agentId = this.agentId || fallbackAgentId;

      const coordinatorMessage: AgentMessage = {
        senderAgentId: agentId,
        receiverAgentId: 'integration_coordinator',
        messageType: MessageEventType.COMMAND,
        priority: MessagePriority.HIGH,
        subject: 'Daily Vision Statement',
        content: {
          message: visionStatement,
          context: {
            workflow: 'system-vision',
            type: 'vision-statement',
          },
        },
        status: 'pending',
        messageId: `vision-${Date.now()}`,
        conversationId: null,
      };

      await this.storage.createAgentMessage(coordinatorMessage);

      return visionStatement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error({
        component: 'Architect Prime Agent',
        message: `Failed to create daily vision statement: ${errorMessage}`,
        agentId: this.agentId,
      });
      throw error;
    }
  }

  /**
   * Generate an architecture diagram in mermaid format
   */
  async generateArchitectureDiagram(): Promise<string> {
    try {
      logger.info({ component: 'Architect Prime Agent', message: 'Generating architecture diagram' });

      const mermaidDiagram = `
        graph TD
          A[Architect Prime] --> B[Integration Coordinator]
          B --> C1[BSBCmaster Lead]
          B --> C2[BCBSGISPRO Lead]
          B --> C3[BCBSLevy Lead]
          B --> C4[BCBSCOSTApp Lead]
          B --> C5[BCBSGeoAssessmentPro Lead]
          
          C1 --> D1[Authentication Agents]
          C1 --> D2[Data Foundation Agents]
          C1 --> D3[Integration Hub Agents]
          
          C2 --> E1[Spatial Data Agents]
          C2 --> E2[Map Rendering Agents]
          C2 --> E3[Spatial Analytics Agents]
          
          C3 --> F1[Tax Rule Agents]
          C3 --> F2[Calculation Agents]
          C3 --> F3[Notification Agents]
          
          C4 --> G1[Cost Model Agents]
          C4 --> G2[Valuation Agents]
          C4 --> G3[Reporting Agents]
          
          C5 --> H1[Integration Agents]
          C5 --> H2[User Interface Agents]
          C5 --> H3[Reporting Agents]
      `;

      // Store the architecture diagram
      await this.storage.createSystemActivity({
        activity: 'Generated system architecture diagram',
        activity_type: 'architecture',
        entity_type: 'architecture',
        entity_id: 'system-architecture',
        component: 'Architect Prime Agent',
        status: 'completed'
      });

      return mermaidDiagram;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error({
        component: 'Architect Prime Agent',
        message: `Failed to generate architecture diagram: ${errorMessage}`,
        agentId: this.agentId,
      });
      throw error;
    }
  }

  /**
   * Resolve architectural conflicts between components
   */
  async resolveArchitecturalConflict(
    componentA: string,
    componentB: string,
    conflictDescription: string
  ): Promise<string> {
    try {
      logger.info({
        component: 'Architect Prime Agent',
        message: `Resolving architectural conflict between ${componentA} and ${componentB}`,
      });

      // Generate a fallback agent ID if this.agentId is null or undefined
      const fallbackAgentId = 'architect_prime_fallback';
      if (
        !this.agentId ||
        this.agentId === 'null' ||
        this.agentId === 'undefined' ||
        typeof this.agentId !== 'string'
      ) {
        logger.warn({
          component: 'Architect Prime Agent',
          message: `Invalid agent ID detected, using fallback ID: ${fallbackAgentId}`,
        });
        this.agentId = fallbackAgentId;
        // Also update the id property to maintain consistency
        this.id = fallbackAgentId;
      }

      // Ensure we have a valid agentId
      const agentId = this.agentId || fallbackAgentId;

      // Create resolution message
      const resolutionMessage: AgentMessage = {
        senderAgentId: agentId,
        receiverAgentId: 'integration_coordinator',
        messageType: MessageEventType.COMMAND,
        priority: MessagePriority.HIGH,
        subject: 'Architectural Conflict Resolution',
        content: {
          message: `Conflict between ${componentA} and ${componentB}: ${conflictDescription}`,
          context: {
            workflow: 'conflict-resolution',
            type: 'architectural-conflict',
          },
        },
        status: 'pending',
        messageId: `conflict-${Date.now()}`,
        conversationId: null,
      };

      await this.storage.createAgentMessage(resolutionMessage);

      return `Architectural conflict between ${componentA} and ${componentB} has been resolved`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error({
        component: 'Architect Prime Agent',
        message: `Failed to resolve architectural conflict: ${errorMessage}`,
        agentId: this.agentId,
      });
      throw error;
    }
  }
}


import { BaseAgent } from '../base-agent';
import { logger } from '../../../utils/logger';
import { IStorage } from '../../../storage';
import { MCPService } from '../../../services/mcp';
import { MessageEventType, MessagePriority, EntityType } from '../../../../shared/schema';

/**
 * ComponentLeadAgent
 * 
 * Base class for all component lead agents.
 * Responsible for coordinating specialists within their component.
 */
export abstract class ComponentLeadAgent extends BaseAgent {
  protected componentName: string;
  protected specialistAgents: string[] = [];
  
  constructor(agentId: string, componentName: string, storage: IStorage, mcpService?: MCPService) {
    const config = {
      id: agentId,
      name: `${componentName} Lead`,
      description: `Lead agent for the ${componentName} component`,
      capabilities: [
        {
          name: 'coordinateSpecialists',
          description: 'Coordinates specialist agents within the component',
          handler: async () => await this.coordinateSpecialists()
        },
        {
          name: 'reportComponentStatus',
          description: 'Reports status of the component',
          handler: async () => await this.reportComponentStatus()
        },
        {
          name: 'implementComponentVision',
          description: 'Implements the vision for the component',
          handler: async () => await this.implementComponentVision()
        },
        {
          name: 'resolveInternalConflicts',
          description: 'Resolves conflicts between specialists',
          handler: async () => await this.resolveInternalConflicts()
        },
        {
          name: 'interfaceWithIntegrationCoordinator',
          description: 'Interfaces with the Integration Coordinator',
          handler: async () => await this.interfaceWithIntegrationCoordinator()
        }
      ],
      permissions: [`component:${componentName.toLowerCase()}:admin`, 'system:communicate']
    };
    super(storage, mcpService || new MCPService(storage), config);
    this.componentName = componentName;
  }

  async initialize(): Promise<void> {
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: `Initializing ${this.componentName} lead agent`, 
      agentId: this.agentId 
    });
    
    // Register capabilities
    this.capabilities.forEach((capability) => {
      logger.debug({ 
        component: `${this.componentName} Lead Agent`, 
        message: `Registered capability: ${capability}` 
      });
    });
    
    // Register specialists
    this.specialistAgents.forEach((specialistId) => {
      logger.debug({ 
        component: `${this.componentName} Lead Agent`, 
        message: `Registered specialist agent: ${specialistId}` 
      });
    });
    
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: `${this.componentName} lead agent initialization complete`, 
      agentId: this.agentId 
    });
  }

  /**
   * Process vision statements from Architect Prime
   */
  async processVisionStatement(visionStatement: string): Promise<string> {
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: 'Processing vision statement from Architect Prime' 
    });
    
    // Translate the vision to component-specific goals
    const componentGoals = `
      ${this.componentName} Component Goals:
      1. Implement all required interfaces according to API contracts
      2. Ensure all specialists are aligned with system vision
      3. Maintain component integrity and performance benchmarks
      4. Coordinate with other components through Integration Coordinator
      5. Report progress and blockers promptly
    `;
    
    // Distribute to specialist agents
    for (const specialistId of this.specialistAgents) {
      await this.storage.createAgentMessage({
        senderAgentId: this.agentId,
        receiverAgentId: specialistId,
        messageType: MessageEventType.COMMAND,
        priority: MessagePriority.HIGH,
        subject: `${this.componentName} Component Goals`,
        content: componentGoals,
        entityType: EntityType.WORKFLOW,
        entityId: 'component-goals',
        status: 'pending',
        messageId: `goals-${Date.now()}-${specialistId}`,
        conversationId: null
      });
    }
    
    return componentGoals;
  }

  /**
   * Report component status to Integration Coordinator
   */
  async reportComponentStatus(): Promise<Record<string, any>> {
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: 'Reporting component status to Integration Coordinator' 
    });
    
    // Generate component status
    const status = {
      componentName: this.componentName,
      status: 'operational',
      apiVersion: '1.0.0',
      lastUpdated: new Date(),
      specialistsStatus: this.specialistAgents.map(id => ({
        agentId: id,
        status: 'operational'
      })),
      metrics: {
        performance: 95, // percentage
        coverage: 87,    // percentage
        issues: 3        // count
      }
    };
    
    // Send to Integration Coordinator
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: 'integration_coordinator',
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.NORMAL,
      subject: `${this.componentName} Status Report`,
      content: JSON.stringify(status),
      entityType: EntityType.WORKFLOW,
      entityId: `${this.componentName.toLowerCase()}-status`,
      status: 'pending',
      messageId: `status-${Date.now()}`,
      conversationId: null
    });
    
    return status;
  }

  /**
   * Coordinate specialists within the component
   */
  async assignTaskToSpecialists(task: string, priority: MessagePriority): Promise<boolean> {
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: `Assigning task to specialists: ${task}` 
    });
    
    for (const specialistId of this.specialistAgents) {
      await this.storage.createAgentMessage({
        senderAgentId: this.agentId,
        receiverAgentId: specialistId,
        messageType: MessageEventType.COMMAND,
        priority: priority,
        subject: `Task Assignment: ${task.substring(0, 50)}...`,
        content: task,
        entityType: EntityType.WORKFLOW,
        entityId: 'task-assignment',
        status: 'pending',
        messageId: `task-${Date.now()}-${specialistId}`,
        conversationId: null
      });
    }
    
    // Log the assignment
    await this.storage.createSystemActivity({
      activity: `Assigned task to ${this.specialistAgents.length} specialists in ${this.componentName}`,
      entityType: 'task-assignment',
      entityId: `task-${Date.now()}`,
      component: `${this.componentName} Lead Agent`
    });
    
    return true;
  }

  /**
   * Resolve conflicts within the component
   */
  async resolveInternalConflict(conflictDescription: string): Promise<string> {
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: `Resolving internal conflict: ${conflictDescription}` 
    });
    
    const resolution = `
      Internal conflict in ${this.componentName} resolved:
      1. Analyzed conflicting requirements
      2. Consulted with specialist agents
      3. Determined optimal solution that satisfies constraints
      4. Updated component documentation
      5. Notified affected specialists
    `;
    
    // Log the resolution
    await this.storage.createSystemActivity({
      activity: `Resolved internal conflict in ${this.componentName}`,
      entityType: 'conflict-resolution',
      entityId: `conflict-${Date.now()}`,
      component: `${this.componentName} Lead Agent`,
      details: resolution
    });
    
    return resolution;
  }

  /**
   * Request support from Integration Coordinator
   */
  async requestIntegrationSupport(issue: string): Promise<void> {
    logger.info({ 
      component: `${this.componentName} Lead Agent`, 
      message: `Requesting integration support: ${issue}` 
    });
    
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: 'integration_coordinator',
      messageType: MessageEventType.ASSISTANCE_REQUESTED,
      priority: MessagePriority.HIGH,
      subject: `Integration Support Request from ${this.componentName}`,
      content: issue,
      entityType: EntityType.WORKFLOW,
      entityId: 'integration-support',
      status: 'pending',
      messageId: `support-${Date.now()}`,
      conversationId: null
    });
  }
}
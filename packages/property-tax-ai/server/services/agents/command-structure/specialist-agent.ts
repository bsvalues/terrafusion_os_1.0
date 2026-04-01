import { BaseAgent } from '../base-agent';
import { logger } from '../../../utils/logger';
import { IStorage } from '../../../storage';
import { MCPService } from '../../../services/mcp';
import { MessageEventType, MessagePriority, EntityType } from '../../../../shared/schema';

/**
 * SpecialistAgent
 * 
 * Base class for specialist agents that work under component leads.
 * These agents have specialized skills and focus on specific tasks.
 */
export abstract class SpecialistAgent extends BaseAgent {
  protected componentName: string;
  protected specialization: string;
  protected componentLeadId: string;
  
  constructor(agentId: string, componentName: string, specialization: string, componentLeadId: string, storage: IStorage, mcpService?: MCPService) {
    const config = {
      id: agentId,
      name: `${componentName} ${specialization} Agent`,
      description: `Specialist agent for ${specialization} in ${componentName} component`,
      capabilities: [
        {
          name: 'executeSpecializedTasks',
          description: 'Execute specialized tasks within area of expertise',
          handler: async () => null
        },
        {
          name: 'reportTaskStatus',
          description: 'Report status of ongoing tasks',
          handler: async () => null
        },
        {
          name: 'collaborateWithPeers',
          description: 'Collaborate with other specialist agents',
          handler: async () => null
        },
        {
          name: 'requestAssistance',
          description: 'Request assistance from component lead or other specialists',
          handler: async () => null
        },
        {
          name: 'provideExpertise',
          description: 'Provide expert knowledge and advice',
          handler: async () => null
        }
      ],
      permissions: [`component:${componentName.toLowerCase()}:specialist`]
    };
    
    super(storage, mcpService || new MCPService(storage), config);
    this.componentName = componentName;
    this.specialization = specialization;
    this.componentLeadId = componentLeadId;
  }

  async initialize(): Promise<void> {
    logger.info({ 
      component: `${this.componentName} ${this.specialization} Agent`, 
      message: `Initializing ${this.specialization} specialist agent`, 
      agentId: this.agentId 
    });
    
    // Register capabilities
    this.capabilities.forEach((capability) => {
      logger.debug({ 
        component: `${this.componentName} ${this.specialization} Agent`, 
        message: `Registered capability: ${capability}` 
      });
    });
    
    // Register with component lead
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.NORMAL,
      subject: `Specialist Registration`,
      content: `${this.specialization} specialist is initialized and ready for assignments.`,
      entityType: EntityType.WORKFLOW,
      entityId: 'specialist-registration',
      status: 'pending',
      messageId: `reg-${Date.now()}`,
      conversationId: null
    });
    
    logger.info({ 
      component: `${this.componentName} ${this.specialization} Agent`, 
      message: `${this.specialization} specialist agent initialization complete`, 
      agentId: this.agentId 
    });
  }

  /**
   * Process tasks assigned by component lead
   */
  async processAssignedTask(task: string): Promise<string> {
    logger.info({ 
      component: `${this.componentName} ${this.specialization} Agent`, 
      message: `Processing assigned task: ${task.substring(0, 50)}...` 
    });
    
    // Simulate task execution time
    const executionTime = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    const result = `
      Task executed successfully by ${this.specialization} specialist.
      Execution time: ${executionTime}ms
      Results: [Simulation] Task completed with expected outcomes.
    `;
    
    // Report result to component lead
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.NORMAL,
      subject: `Task Execution Report`,
      content: result,
      entityType: EntityType.WORKFLOW,
      entityId: 'task-execution',
      status: 'pending',
      messageId: `result-${Date.now()}`,
      conversationId: null
    });
    
    // Log task completion
    await this.storage.createSystemActivity({
      activity: `Executed assigned task`,
      entityType: 'task-execution',
      entityId: `task-${Date.now()}`,
      component: `${this.componentName} ${this.specialization} Agent`,
      details: result
    });
    
    return result;
  }

  /**
   * Request assistance from peers or component lead
   */
  async requestAssistance(issue: string): Promise<void> {
    logger.info({ 
      component: `${this.componentName} ${this.specialization} Agent`, 
      message: `Requesting assistance: ${issue}` 
    });
    
    // Request help from component lead
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.ASSISTANCE_REQUESTED,
      priority: MessagePriority.HIGH,
      subject: `Assistance Request from ${this.specialization} specialist`,
      content: issue,
      entityType: EntityType.WORKFLOW,
      entityId: 'assistance-request',
      status: 'pending',
      messageId: `assist-${Date.now()}`,
      conversationId: null
    });
  }

  /**
   * Report current status to component lead
   */
  async reportStatus(): Promise<Record<string, any>> {
    logger.info({ 
      component: `${this.componentName} ${this.specialization} Agent`, 
      message: `Reporting status to component lead` 
    });
    
    const status = {
      agentId: this.agentId,
      componentName: this.componentName,
      specialization: this.specialization,
      status: 'operational',
      activeTasks: 2,
      completedTasks: 15,
      lastActive: new Date(),
      metrics: {
        successRate: 0.95,
        averageExecutionTime: 750, // ms
        resourceUtilization: 0.65 // percentage
      }
    };
    
    // Send status to component lead
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.NORMAL,
      subject: `Status Report from ${this.specialization} specialist`,
      content: JSON.stringify(status),
      entityType: EntityType.WORKFLOW,
      entityId: 'specialist-status',
      status: 'pending',
      messageId: `status-${Date.now()}`,
      conversationId: null
    });
    
    return status;
  }

  /**
   * Collaborate with peer specialists
   */
  async collaborateWithPeer(peerAgentId: string, collaborationTask: string): Promise<void> {
    logger.info({ 
      component: `${this.componentName} ${this.specialization} Agent`, 
      message: `Collaborating with peer ${peerAgentId} on task: ${collaborationTask.substring(0, 50)}...` 
    });
    
    // Send collaboration request
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: peerAgentId,
      messageType: MessageEventType.COMMAND,
      priority: MessagePriority.NORMAL,
      subject: `Collaboration Request`,
      content: collaborationTask,
      entityType: EntityType.WORKFLOW,
      entityId: 'peer-collaboration',
      status: 'pending',
      messageId: `collab-${Date.now()}`,
      conversationId: `collab-${Date.now()}`
    });
    
    // Inform component lead about collaboration
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.LOW,
      subject: `Peer Collaboration Initiated`,
      content: `Initiated collaboration with ${peerAgentId} on task: ${collaborationTask.substring(0, 50)}...`,
      entityType: EntityType.WORKFLOW,
      entityId: 'peer-collaboration',
      status: 'pending',
      messageId: `collab-info-${Date.now()}`,
      conversationId: null
    });
  }
}
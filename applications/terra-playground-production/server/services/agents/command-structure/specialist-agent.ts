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

  constructor(
    agentId: string,
    componentName: string,
    specialization: string,
    componentLeadId: string,
    storage: IStorage,
    mcpService?: MCPService
  ) {
    // Ensure agentId is a non-null string with a fallback for safety
    const safeAgentId =
      agentId ||
      `${componentName.toLowerCase()}_${specialization.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const config = {
      id: safeAgentId,
      name: `${componentName} ${specialization} Agent`,
      description: `Specialist agent for ${specialization} in ${componentName} component`,
      capabilities: [
        {
          name: 'executeSpecializedTasks',
          description: 'Execute specialized tasks within area of expertise',
          handler: async () => null,
        },
        {
          name: 'reportTaskStatus',
          description: 'Report status of ongoing tasks',
          handler: async () => null,
        },
        {
          name: 'collaborateWithPeers',
          description: 'Collaborate with other specialist agents',
          handler: async () => null,
        },
        {
          name: 'requestAssistance',
          description: 'Request assistance from component lead or other specialists',
          handler: async () => null,
        },
        {
          name: 'provideExpertise',
          description: 'Provide expert knowledge and advice',
          handler: async () => null,
        },
      ],
      permissions: [`component:${componentName.toLowerCase()}:specialist`],
    };

    super(storage, mcpService || new MCPService(storage), config);

    // Double check that both id and agentId are properly set after the super constructor call
    this.id = safeAgentId;
    this.agentId = safeAgentId;

    this.componentName = componentName;
    this.specialization = specialization;
    this.componentLeadId = componentLeadId;

    console.log(`SpecialistAgent constructed with id: ${this.id} and agentId: ${this.agentId}`);
  }

  async initialize(): Promise<void> {
    logger.info(
      `${this.componentName} ${this.specialization} Agent: Initializing ${this.specialization} specialist agent (ID: ${this.agentId})`
    );

    // Register capabilities
    this.capabilities.forEach(capability => {
      logger.debug(
        `${this.componentName} ${this.specialization} Agent: Registered capability: ${capability}`
      );
    });

    // Register with component lead
    // Generate a fallback ID in case both id and agentId are missing or invalid
    const fallbackId = `${this.componentName.toLowerCase()}_${this.specialization.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    let agentId = this.id || this.agentId || fallbackId; // Make sure we have a valid ID

    // Ensure agentId is not null, undefined, 'null', 'undefined', or empty string
    if (!agentId || agentId === 'null' || agentId === 'undefined' || agentId.trim() === '') {
      console.log(
        `WARNING: Specialist agent ${this.specialization} had invalid ID, using fallback: ${fallbackId}`
      );
      agentId = fallbackId;
      // Update the instance property to maintain consistency
      this.agentId = fallbackId;
      this.id = fallbackId;
    }

    console.log(
      `Specialist agent ${this.specialization} registering with component lead. Agent ID: ${agentId}`
    );

    try {
      await this.storage.createAgentMessage({
        senderAgentId: agentId,
        receiverAgentId: this.componentLeadId,
        messageType: MessageEventType.STATUS_UPDATE,
        priority: MessagePriority.NORMAL,
        subject: `Specialist Registration`,
        content: {
          message: `${this.specialization} specialist is initialized and ready for assignments.`,
          type: 'registration',
          capabilities: this.capabilities,
        },
        status: 'pending',
        messageId: `reg-${Date.now()}`,
        conversationId: null,
      });
    } catch (error) {
      console.error(`Error registering specialist agent (${this.specialization}):`, error);
      // Continue execution even if registration fails - don't block initialization
    }

    logger.info(
      `${this.componentName} ${this.specialization} Agent: ${this.specialization} specialist agent initialization complete (ID: ${this.agentId})`
    );
  }

  /**
   * Process tasks assigned by component lead
   */
  async processAssignedTask(task: string): Promise<string> {
    logger.info(
      `${this.componentName} ${this.specialization} Agent: Processing assigned task: ${task.substring(0, 50)}...`
    );

    // Simulate task execution time
    const executionTime = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));

    const result = `
      Task executed successfully by ${this.specialization} specialist.
      Execution time: ${executionTime}ms
      Results: [Simulation] Task completed with expected outcomes.
    `;

    // Report result to component lead
    // Generate a fallback ID in case both id and agentId are missing or invalid
    const fallbackId = `${this.componentName.toLowerCase()}_${this.specialization.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    let agentId = this.id || this.agentId || fallbackId; // Make sure we have a valid ID

    // Ensure agentId is not null, undefined, 'null', 'undefined', or empty string
    if (!agentId || agentId === 'null' || agentId === 'undefined' || agentId.trim() === '') {
      console.log(
        `WARNING: Specialist agent ${this.specialization} had invalid ID, using fallback: ${fallbackId}`
      );
      agentId = fallbackId;
      // Update the instance property to maintain consistency
      this.agentId = fallbackId;
      this.id = fallbackId;
    }

    await this.storage.createAgentMessage({
      senderAgentId: agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.NORMAL,
      subject: `Task Execution Report`,
      content: result,

      status: 'pending',
      messageId: `result-${Date.now()}`,
      conversationId: null,
    });

    // Log task completion
    await this.storage.createSystemActivity({
      activity_type: `task_executed`,
      component: `${this.componentName} ${this.specialization} Agent`,
      status: 'info',
      details: {
        message: `Executed assigned task`,
        task_result: result,
        specialization: this.specialization,
        executionTime: executionTime,
      },
    });

    return result;
  }

  /**
   * Request assistance from peers or component lead
   */
  async requestAssistance(issue: string): Promise<void> {
    logger.info(
      `${this.componentName} ${this.specialization} Agent: Requesting assistance: ${issue}`
    );

    // Request help from component lead
    const agentId = this.id || this.agentId; // Make sure we have a valid ID
    if (!agentId) {
      console.error(
        `ERROR: Specialist agent ${this.specialization} has no valid ID when requesting assistance!`
      );
      throw new Error(`Specialist agent ${this.specialization} has no valid ID!`);
    }

    await this.storage.createAgentMessage({
      senderAgentId: agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.ASSISTANCE_REQUESTED,
      priority: MessagePriority.HIGH,
      subject: `Assistance Request from ${this.specialization} specialist`,
      content: {
        message: issue,
        context: {
          workflow: 'assistance-request',
          requestedBy: this.specialization,
        },
      },
      status: 'pending',
      messageId: `assist-${Date.now()}`,
      conversationId: null,
    });
  }

  /**
   * Report current status to component lead
   */
  async reportStatus(): Promise<Record<string, any>> {
    logger.info(
      `${this.componentName} ${this.specialization} Agent: Reporting status to component lead`
    );

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
        resourceUtilization: 0.65, // percentage
      },
    };

    // Send status to component lead
    const agentId = this.id || this.agentId; // Make sure we have a valid ID
    if (!agentId) {
      console.error(
        `ERROR: Specialist agent ${this.specialization} has no valid ID when reporting status!`
      );
      throw new Error(`Specialist agent ${this.specialization} has no valid ID!`);
    }

    await this.storage.createAgentMessage({
      senderAgentId: agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.NORMAL,
      subject: `Status Report from ${this.specialization} specialist`,
      content: status, // Pass the object directly, content should be a JSON-compatible object
      status: 'pending',
      messageId: `status-${Date.now()}`,
      conversationId: null,
    });

    return status;
  }

  /**
   * Collaborate with peer specialists
   */
  async collaborateWithPeer(peerAgentId: string, collaborationTask: string): Promise<void> {
    logger.info(
      `${this.componentName} ${this.specialization} Agent: Collaborating with peer ${peerAgentId} on task: ${collaborationTask.substring(0, 50)}...`
    );

    // Send collaboration request
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: peerAgentId,
      messageType: MessageEventType.COMMAND,
      priority: MessagePriority.NORMAL,
      subject: `Collaboration Request`,
      content: {
        task: collaborationTask,
        type: 'peer-collaboration',
      },
      status: 'pending',
      messageId: `collab-${Date.now()}`,
      conversationId: `collab-${Date.now()}`,
    });

    // Inform component lead about collaboration
    await this.storage.createAgentMessage({
      senderAgentId: this.agentId,
      receiverAgentId: this.componentLeadId,
      messageType: MessageEventType.STATUS_UPDATE,
      priority: MessagePriority.LOW,
      subject: `Peer Collaboration Initiated`,
      content: {
        message: `Initiated collaboration with ${peerAgentId} on task: ${collaborationTask.substring(0, 50)}...`,
        peerAgentId: peerAgentId,
        collaborationType: 'peer-collaboration',
      },
      status: 'pending',
      messageId: `collab-info-${Date.now()}`,
      conversationId: null,
    });
  }
}

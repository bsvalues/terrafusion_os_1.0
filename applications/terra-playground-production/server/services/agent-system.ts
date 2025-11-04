/**
 * Agent System Manager
 *
 * This service manages the MCP agent system, handling the registration, initialization,
 * and coordination of all AI agents within the platform.
 */

import { IStorage } from '../storage';
import { MCPService } from './mcp';
import { BaseAgent } from './agents/base-agent';
import { PropertyAssessmentAgent } from './agents/property-assessment-agent';
import { IngestionAgent } from './agents/ingestion-agent';
import { ReportingAgent } from './agents/reporting-agent';
import { SpatialGISAgent } from './agents/spatial-gis-agent';
import { MarketAnalysisAgent } from './agents/market-analysis-agent';
import { FtpDataAgent } from './agents/ftp-data-agent';
import { SuperintelligenceAgent } from './agents/superintelligence-agent';
import { ComplianceAgentImpl } from './agents/compliance-agent';
import { DataQualityAgent } from './agents/data-quality-agent';
import { PropertyStoryGenerator } from './property-story-generator';
import { FtpService } from './ftp-service';
import { ArcGISService } from './arcgis-service';
import { BentonMarketFactorService } from './benton-market-factor-service';
import { LLMService } from './llm-service';
import { MarketPredictionModel } from './market-prediction-model';
import { RiskAssessmentEngine } from './risk-assessment-engine';
import { NotificationService } from './notification-service';
import { PropertyValidationEngine } from './data-quality/property-validation-engine';
import { AgentReplayBufferService, ReplayBufferConfig } from './agent-replay-buffer';
import { CommandStructure } from './command-structure';
import { AgentLearningService, agentLearningService } from './agent-learning-service';
import { LearningEventType, FeedbackSentiment } from '../../shared/schema';

export class AgentSystem {
  private _storage: IStorage;
  private mcpService: MCPService;
  private agents: Map<string, BaseAgent> = new Map();
  private replayBuffer: AgentReplayBufferService;
  private commandStructure: CommandStructure;
  public isInitialized: boolean = false;

  constructor(storage: IStorage) {
    this._storage = storage;
    this.mcpService = new MCPService(storage);
    this.commandStructure = new CommandStructure(storage);

    // Initialize the agent replay buffer with default config
    const replayBufferConfig: ReplayBufferConfig = {
      maxSize: 10000,
      priorityScoreThreshold: 0.7,
      samplingBatchSize: 64,
      trainingInterval: 60000, // 1 minute
    };
    this.replayBuffer = new AgentReplayBufferService(storage, replayBufferConfig);
  }

  /**
   * Get the storage instance used by the agent system
   * This is primarily used for logging operations
   */
  get storage(): IStorage {
    return this._storage;
  }

  /**
   * Get the agent replay buffer service
   */
  get replayBufferService(): AgentReplayBufferService {
    return this.replayBuffer;
  }

  /**
   * Get the command structure
   */
  get commandStructureService(): CommandStructure {
    return this.commandStructure;
  }

  /**
   * Get the agent learning service
   */
  get learningService(): AgentLearningService {
    return agentLearningService;
  }

  /**
   * Initialize the agent system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Log initialization
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_init',
        component: 'agent_system',
        status: 'info',
        details: {
          timestamp: new Date().toISOString(),
        },
        created_at: new Date(),
      });

      // Create required services
      const propertyStoryGenerator = new PropertyStoryGenerator(this.storage);
      const ftpService = new FtpService();
      const arcgisService = new ArcGISService(this.storage);
      const bentonMarketFactorService = new BentonMarketFactorService(this.storage);
      const llmService = new LLMService({
        defaultProvider: 'openai',
        openaiApiKey: process.env.OPENAI_API_KEY,
        defaultModels: {
          openai: 'gpt-4o',
          anthropic: 'claude-3-opus-20240229',
        },
      });

      // Create and register agents
      const propertyAssessmentAgent = new PropertyAssessmentAgent(
        this.storage,
        this.mcpService,
        propertyStoryGenerator,
        llmService
      );
      this.registerAgent('property_assessment', propertyAssessmentAgent);

      const ingestionAgent = new IngestionAgent(this.storage, this.mcpService, ftpService);
      this.registerAgent('data_ingestion', ingestionAgent);

      const reportingAgent = new ReportingAgent(this.storage, this.mcpService);
      this.registerAgent('reporting', reportingAgent);

      const spatialGisAgent = new SpatialGISAgent(
        this.storage,
        this.mcpService,
        arcgisService,
        bentonMarketFactorService
      );
      this.registerAgent('spatial_gis', spatialGisAgent);

      const marketAnalysisAgent = new MarketAnalysisAgent(
        this.storage,
        this.mcpService,
        bentonMarketFactorService,
        llmService
      );
      this.registerAgent('market_analysis', marketAnalysisAgent);

      const ftpDataAgent = new FtpDataAgent(this.storage, this.mcpService);
      this.registerAgent('ftp_data', ftpDataAgent);

      // Create notification service for compliance agent
      const notificationService = new NotificationService(this.storage);

      // Create the compliance agent for regulatory compliance
      const complianceAgent = new ComplianceAgentImpl(this.storage, notificationService);
      this.registerAgent('compliance', complianceAgent);

      const propertyValidationEngine = new PropertyValidationEngine(this.storage);
      const dataQualityAgent = new DataQualityAgent(
        this.storage,
        propertyValidationEngine,
        notificationService
      );
      this.registerAgent('data_quality', dataQualityAgent);

      // Create advanced services for superintelligence agent
      const marketPredictionModel = new MarketPredictionModel(this.storage, llmService);

      const riskAssessmentEngine = new RiskAssessmentEngine(this.storage, llmService);

      const superintelligenceAgent = new SuperintelligenceAgent(
        this.storage,
        this.mcpService,
        llmService,
        propertyStoryGenerator,
        marketPredictionModel,
        riskAssessmentEngine
      );
      this.registerAgent('superintelligence', superintelligenceAgent);

      // Initialize agents
      for (const [name, agent] of this.agents.entries()) {
        try {
          await agent.initialize();
        } catch (error) {
          console.error(`Error initializing agent ${name}:`, error);
        }
      }

      // Initialize the command structure
      await this.commandStructure.initialize();
      this.isInitialized = true;
      // Log successful initialization
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_ready',
        component: 'agent_system',
        status: 'info',
        details: {
          agentCount: this.agents.size,
          agents: Array.from(this.agents.keys()),
        },
        created_at: new Date(),
      });
    } catch (error) {
      console.error('Error initializing Agent System:', error);

      // Log initialization error
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_error',
        component: 'agent_system',
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null,
        },
        created_at: new Date(),
      });

      throw error;
    }
  }

  /**
   * Register an agent with the system
   */
  public registerAgent(name: string, agent: BaseAgent): void {
    this.agents.set(name, agent);
  }

  /**
   * Get an agent by name
   */
  public getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): Map<string, BaseAgent> {
    return this.agents;
  }

  /**
   * Get the count of registered agents
   */
  public getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Get agent status by ID
   */
  public getAgentStatus(agentId: string): any {
    // Check if agent exists
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    // Get agent status with safety check
    try {
      if (agent && typeof agent.getStatus === 'function') {
        return agent.getStatus();
      } else {
        // Fallback if getStatus method is not available
        return {
          id:
            typeof agent.id !== 'undefined'
              ? agent.id
              : typeof agent.agentId !== 'undefined'
                ? agent.agentId
                : agentId,
          name: typeof agent.name !== 'undefined' ? agent.name : agentId,
          isActive: typeof agent.isActive !== 'undefined' ? agent.isActive : false,
          lastActivity: typeof agent.lastActivity !== 'undefined' ? agent.lastActivity : null,
          performanceScore:
            typeof agent.performanceScore !== 'undefined' ? agent.performanceScore : 0,
          initialized: true,
        };
      }
    } catch (error) {
      console.error(`Error getting status for agent ${agentId}:`, error);
      return {
        id: agentId,
        name: agentId,
        error: 'Failed to get status',
        isActive: false,
        lastActivity: null,
        performanceScore: 0,
        initialized: false,
      };
    }
  }

  /**
   * Start all agents
   */
  public async startAllAgents(): Promise<void> {
    for (const [name, agent] of this.agents.entries()) {
      try {
        await agent.start();
      } catch (error) {
        console.error(`Error starting agent ${name}:`, error);
      }
    }
  }

  /**
   * Stop all agents
   */
  public async stopAllAgents(): Promise<void> {
    for (const [name, agent] of this.agents.entries()) {
      try {
        await agent.stop();
      } catch (error) {
        console.error(`Error stopping agent ${name}:`, error);
      }
    }
  }

  /**
   * Execute a capability on an agent
   */
  public async executeCapability(
    agentName: string,
    capabilityName: string,
    parameters: any
  ): Promise<any> {
    const agent = this.agents.get(agentName);

    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }

    return agent.executeCapability(capabilityName, parameters);
  }

  /**
   * Get the status of all agents, command structure, and the replay buffer
   */
  public getSystemStatus(): any {
    const agentStatuses = {};

    for (const [name, agent] of this.agents.entries()) {
      // Safety check for getStatus method
      try {
        if (agent && typeof agent.getStatus === 'function') {
          agentStatuses[name] = agent.getStatus();
        } else {
          // Fallback for agents that don't implement getStatus
          agentStatuses[name] = {
            id:
              typeof agent.id !== 'undefined'
                ? agent.id
                : typeof agent.agentId !== 'undefined'
                  ? agent.agentId
                  : name,
            name: typeof agent.name !== 'undefined' ? agent.name : name,
            isActive: typeof agent.isActive !== 'undefined' ? agent.isActive : false,
            lastActivity: typeof agent.lastActivity !== 'undefined' ? agent.lastActivity : null,
            performanceScore:
              typeof agent.performanceScore !== 'undefined' ? agent.performanceScore : 0,
          };
        }
      } catch (error) {
        console.error(`Error getting status for agent ${name}:`, error);
        agentStatuses[name] = {
          id: name,
          name: name,
          error: 'Failed to get status',
          isActive: false,
          lastActivity: null,
          performanceScore: 0,
        };
      }
    }

    // Include replay buffer statistics in the system status
    const replayBufferStats = this.replayBuffer
      ? this.replayBuffer.getBufferStats()
      : { size: 0, maxSize: 0 };

    // Safely get command structure information with error handling
    let commandStructureInfo = {};
    try {
      // Check if each component is initialized before getting status
      const architectPrime = this.commandStructure.getArchitectPrime();
      const integrationCoordinator = this.commandStructure.getIntegrationCoordinator();
      const bsbcmasterLead = this.commandStructure.getBSBCmasterLead();

      commandStructureInfo = {
        architectPrime: architectPrime ? architectPrime.getStatus() : { status: 'not_initialized' },
        integrationCoordinator: integrationCoordinator
          ? integrationCoordinator.getStatus()
          : { status: 'not_initialized' },
        bsbcmasterLead: bsbcmasterLead ? bsbcmasterLead.getStatus() : { status: 'not_initialized' },
      };
    } catch (error) {
      console.error('Error getting command structure status:', error);
      commandStructureInfo = {
        error: 'Failed to retrieve command structure status',
        message: error instanceof Error ? error.message : String(error),
      };
    }

    // Get learning service status
    const learningServiceEnabled = agentLearningService.config.enabled;
    const learningServiceProviders = agentLearningService.config.providers;

    return {
      isInitialized: this.isInitialized,
      agentCount: this.agents.size,
      agents: agentStatuses,
      replayBuffer: replayBufferStats,
      commandStructure: commandStructureInfo,
      learningSystem: {
        enabled: learningServiceEnabled,
        providers: learningServiceProviders,
      },
    };
  }

  /**
   * Record a learning event for an agent
   */
  public async recordAgentLearningEvent(
    agentName: string,
    eventType: LearningEventType,
    eventData: any,
    sourceContext?: any,
    priority: number = 3
  ): Promise<any> {
    try {
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent '${agentName}' not found`);
      }

      // Get the unique agent ID
      const agentId = agent.id;

      // Record the learning event
      const event = await this.learningService.recordLearningEvent(
        agentId,
        eventType,
        eventData,
        sourceContext,
        priority
      );

      return {
        success: true,
        eventId: event ? event.id : null,
        message: event
          ? `Learning event recorded for agent ${agentName}`
          : 'Learning system is disabled',
      };
    } catch (error) {
      console.error(`Error recording learning event for agent ${agentName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Record user feedback for an agent
   */
  public async recordAgentFeedback(
    agentName: string,
    feedbackData: {
      userId?: number;
      conversationId?: string;
      taskId?: string;
      feedbackText?: string;
      sentiment?: FeedbackSentiment;
      rating?: number;
      categories?: string[];
    }
  ): Promise<any> {
    try {
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent '${agentName}' not found`);
      }

      // Get the unique agent ID
      const agentId = agent.id;

      // Record the feedback
      const feedback = await this.learningService.recordUserFeedback(agentId, feedbackData);

      return {
        success: true,
        feedbackId: feedback ? feedback.id : null,
        message: feedback
          ? `Feedback recorded for agent ${agentName}`
          : 'Learning system is disabled',
      };
    } catch (error) {
      console.error(`Error recording feedback for agent ${agentName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get knowledge for an agent
   */
  public async getAgentKnowledge(
    agentName: string,
    knowledgeType?: string,
    searchTerm?: string,
    verifiedOnly: boolean = false
  ): Promise<any> {
    try {
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent '${agentName}' not found`);
      }

      // Get the unique agent ID
      const agentId = agent.id;

      // Get the knowledge
      const knowledge = await this.learningService.getAgentKnowledge(
        agentId,
        knowledgeType,
        searchTerm,
        verifiedOnly
      );

      return {
        success: true,
        knowledge: knowledge || [],
        count: knowledge ? knowledge.length : 0,
      };
    } catch (error) {
      console.error(`Error getting knowledge for agent ${agentName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        knowledge: [],
      };
    }
  }
}

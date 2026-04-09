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
      trainingInterval: 60000 // 1 minute
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
   * Initialize the agent system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      console.log("Initializing Agent System...");
      
      // Log initialization
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_init',
        component: 'agent_system',
        status: 'info',
        details: {
          timestamp: new Date().toISOString()
        },
        created_at: new Date()
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
          anthropic: 'claude-3-opus-20240229'
        }
      });
      
      // Create and register agents
      console.log("Creating Property Assessment Agent...");
      const propertyAssessmentAgent = new PropertyAssessmentAgent(
        this.storage, 
        this.mcpService,
        propertyStoryGenerator,
        llmService
      );
      this.registerAgent('property_assessment', propertyAssessmentAgent);
      
      console.log("Creating Data Ingestion Agent...");
      const ingestionAgent = new IngestionAgent(
        this.storage,
        this.mcpService,
        ftpService
      );
      this.registerAgent('data_ingestion', ingestionAgent);
      
      console.log("Creating Reporting Agent...");
      const reportingAgent = new ReportingAgent(
        this.storage,
        this.mcpService
      );
      this.registerAgent('reporting', reportingAgent);
      
      console.log("Creating Spatial GIS Agent...");
      const spatialGisAgent = new SpatialGISAgent(
        this.storage,
        this.mcpService,
        arcgisService,
        bentonMarketFactorService
      );
      this.registerAgent('spatial_gis', spatialGisAgent);
      
      console.log("Creating Market Analysis Agent...");
      const marketAnalysisAgent = new MarketAnalysisAgent(
        this.storage,
        this.mcpService,
        bentonMarketFactorService,
        llmService
      );
      this.registerAgent('market_analysis', marketAnalysisAgent);
      
      console.log("Creating FTP Data Agent...");
      const ftpDataAgent = new FtpDataAgent(
        this.storage,
        this.mcpService
      );
      this.registerAgent('ftp_data', ftpDataAgent);
      
      // Create notification service for compliance agent
      const notificationService = new NotificationService(this.storage);
      
      // Create the compliance agent for regulatory compliance
      console.log("Creating Compliance Agent...");
      const complianceAgent = new ComplianceAgentImpl(
        this.storage,
        notificationService
      );
      this.registerAgent('compliance', complianceAgent);
      
      console.log("Creating Data Quality Agent...");
      const propertyValidationEngine = new PropertyValidationEngine(this.storage);
      const dataQualityAgent = new DataQualityAgent(
        this.storage,
        propertyValidationEngine,
        notificationService
      );
      this.registerAgent('data_quality', dataQualityAgent);
      
      // Create advanced services for superintelligence agent
      console.log("Creating Market Prediction Model...");
      const marketPredictionModel = new MarketPredictionModel(this.storage, llmService);
      
      console.log("Creating Risk Assessment Engine...");
      const riskAssessmentEngine = new RiskAssessmentEngine(this.storage, llmService);
      
      console.log("Creating Superintelligence Agent...");
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
          console.log(`Initializing agent: ${name}...`);
          await agent.initialize();
          console.log(`Agent ${name} initialized successfully.`);
        } catch (error) {
          console.error(`Error initializing agent ${name}:`, error);
        }
      }
      
      // Initialize the command structure
      console.log("Initializing Command Structure...");
      await this.commandStructure.initialize();
      console.log("Command Structure initialized successfully.");
      
      this.isInitialized = true;
      console.log("Agent System initialized successfully.");
      
      // Log successful initialization
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_ready',
        component: 'agent_system',
        status: 'info',
        details: {
          agentCount: this.agents.size,
          agents: Array.from(this.agents.keys())
        },
        created_at: new Date()
      });
    } catch (error) {
      console.error("Error initializing Agent System:", error);
      
      // Log initialization error
      await this.storage.createSystemActivity({
        activity_type: 'agent_system_error',
        component: 'agent_system',
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null
        },
        created_at: new Date()
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
   * Start all agents
   */
  public async startAllAgents(): Promise<void> {
    for (const [name, agent] of this.agents.entries()) {
      try {
        console.log(`Starting agent: ${name}...`);
        await agent.start();
        console.log(`Agent ${name} started successfully.`);
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
        console.log(`Stopping agent: ${name}...`);
        await agent.stop();
        console.log(`Agent ${name} stopped successfully.`);
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
      agentStatuses[name] = agent.getStatus();
    }
    
    // Include replay buffer statistics in the system status
    const replayBufferStats = this.replayBuffer.getBufferStats();
    
    // Safely get command structure information with error handling
    let commandStructureInfo = {};
    try {
      // Check if each component is initialized before getting status
      const architectPrime = this.commandStructure.getArchitectPrime();
      const integrationCoordinator = this.commandStructure.getIntegrationCoordinator();
      const bsbcmasterLead = this.commandStructure.getBSBCmasterLead();
      
      commandStructureInfo = {
        architectPrime: architectPrime ? architectPrime.getStatus() : { status: 'not_initialized' },
        integrationCoordinator: integrationCoordinator ? integrationCoordinator.getStatus() : { status: 'not_initialized' },
        bsbcmasterLead: bsbcmasterLead ? bsbcmasterLead.getStatus() : { status: 'not_initialized' }
      };
    } catch (error) {
      console.error('Error getting command structure status:', error);
      commandStructureInfo = {
        error: 'Failed to retrieve command structure status',
        message: error.message
      };
    }
    
    return {
      isInitialized: this.isInitialized,
      agentCount: this.agents.size,
      agents: agentStatuses,
      replayBuffer: replayBufferStats,
      commandStructure: commandStructureInfo
    };
  }
}
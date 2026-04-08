import { logger } from '../utils/logger';
import { IStorage } from '../storage';
import { MCPService } from './mcp';

import { ArchitectPrimeAgent } from './agents/command-structure/architect-prime';
import { IntegrationCoordinatorAgent } from './agents/command-structure/integration-coordinator';
import { BSBCmasterLeadAgent } from './agents/command-structure/bsbcmaster-lead';
import { AuthenticationServiceAgent } from './agents/command-structure/authentication-service-agent';

/**
 * CommandStructure
 * 
 * Manages the hierarchical command structure of agents according to the strategic guide.
 * Initializes and coordinates the Agent Command Chain.
 */
export class CommandStructure {
  private storage: IStorage;
  private mcpService: MCPService;
  private initialized: boolean = false;
  
  // Command structure agents
  private architectPrime: ArchitectPrimeAgent;
  private integrationCoordinator: IntegrationCoordinatorAgent;
  private bsbcmasterLead: BSBCmasterLeadAgent;
  
  // Specialist agents
  private authServiceAgent: AuthenticationServiceAgent;
  
  // Add more component leads and specialists as implemented
  
  constructor(storage: IStorage) {
    this.storage = storage;
    this.mcpService = new MCPService(storage);
  }
  
  /**
   * Initialize the command structure
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn({ component: 'CommandStructure', message: 'Command structure already initialized' });
      return;
    }
    
    logger.info({ component: 'CommandStructure', message: 'Initializing agent command structure' });
    
    try {
      // Initialize command chain from top to bottom
      
      // 1. Initialize Architect Prime (top level)
      this.architectPrime = new ArchitectPrimeAgent(this.storage, this.mcpService);
      await this.architectPrime.initialize();
      logger.info({ component: 'CommandStructure', message: 'Architect Prime initialized' });
      
      // 2. Initialize Integration Coordinator (second level)
      this.integrationCoordinator = new IntegrationCoordinatorAgent(this.storage, this.mcpService);
      await this.integrationCoordinator.initialize();
      logger.info({ component: 'CommandStructure', message: 'Integration Coordinator initialized' });
      
      // 3. Initialize Component Leads (third level)
      this.bsbcmasterLead = new BSBCmasterLeadAgent(this.storage, this.mcpService);
      await this.bsbcmasterLead.initialize();
      logger.info({ component: 'CommandStructure', message: 'BSBCmaster Lead initialized' });
      
      // 4. Initialize Specialist Agents (bottom level)
      this.authServiceAgent = new AuthenticationServiceAgent(this.storage, this.mcpService);
      await this.authServiceAgent.initialize();
      logger.info({ component: 'CommandStructure', message: 'Authentication Service Agent initialized' });
      
      // TODO: Initialize other component leads and specialist agents
      
      // Generate initial architecture diagram
      const architectureDiagram = await this.architectPrime.generateArchitectureDiagram();
      logger.info({ component: 'CommandStructure', message: 'Generated initial architecture diagram' });
      
      // Create daily vision statement
      const visionStatement = await this.architectPrime.createDailyVisionStatement();
      logger.info({ component: 'CommandStructure', message: 'Created daily vision statement' });
      
      // Run initial integration checkpoint
      const integrationState = await this.integrationCoordinator.performIntegrationCheckpoint();
      logger.info({ component: 'CommandStructure', message: 'Performed initial integration checkpoint' });
      
      // Initialize BSBCmaster component
      await this.bsbcmasterLead.initializeComponent();
      logger.info({ component: 'CommandStructure', message: 'Initialized BSBCmaster component' });
      
      this.initialized = true;
      logger.info({ component: 'CommandStructure', message: 'Command structure initialization complete' });
      
      // Store system activity for successful initialization
      await this.storage.createSystemActivity({
        activity: 'Initialized agent command structure',
        entityType: 'system',
        entityId: 'command-structure',
        component: 'CommandStructure',
        details: JSON.stringify({
          architectureDiagram: architectureDiagram.substring(0, 100) + '...',
          visionStatement: visionStatement.substring(0, 100) + '...',
          integrationState: JSON.stringify(integrationState).substring(0, 100) + '...'
        })
      });
      
    } catch (error) {
      logger.error({ component: 'CommandStructure', message: 'Error initializing command structure', error });
      throw error;
    }
  }
  
  /**
   * Get the Architect Prime agent
   */
  getArchitectPrime(): ArchitectPrimeAgent {
    return this.architectPrime;
  }
  
  /**
   * Get the Integration Coordinator agent
   */
  getIntegrationCoordinator(): IntegrationCoordinatorAgent {
    return this.integrationCoordinator;
  }
  
  /**
   * Get the BSBCmaster Lead agent
   */
  getBSBCmasterLead(): BSBCmasterLeadAgent {
    return this.bsbcmasterLead;
  }
  
  /**
   * Get the Authentication Service agent
   */
  getAuthServiceAgent(): AuthenticationServiceAgent {
    return this.authServiceAgent;
  }
  
  /**
   * Run an integration checkpoint
   */
  async runIntegrationCheckpoint(): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Command structure not initialized');
    }
    
    logger.info({ component: 'CommandStructure', message: 'Running integration checkpoint' });
    return await this.integrationCoordinator.performIntegrationCheckpoint();
  }
  
  /**
   * Create a new vision statement
   */
  async createVisionStatement(): Promise<string> {
    if (!this.initialized) {
      throw new Error('Command structure not initialized');
    }
    
    logger.info({ component: 'CommandStructure', message: 'Creating new vision statement' });
    return await this.architectPrime.createDailyVisionStatement();
  }
  
  /**
   * Resolve a conflict between components
   */
  async resolveConflict(componentA: string, componentB: string, conflictDescription: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Command structure not initialized');
    }
    
    logger.info({ 
      component: 'CommandStructure', 
      message: `Resolving conflict between ${componentA} and ${componentB}`
    });
    
    return await this.architectPrime.resolveArchitecturalConflict(componentA, componentB, conflictDescription);
  }
}
/**
 * Property Intelligence Agent
 * 
 * This agent integrates with the AI extension system to provide
 * intelligent property analysis and insights.
 */

import { AgentProtocol, AgentMessageType, MessagePriority } from '../extensions/agent-protocol';
import { logger } from '../utils/logger';
import { IStorage } from '../storage';
import { EventEmitter } from 'events';

/**
 * Property analysis request
 */
export interface PropertyAnalysisRequest {
  propertyId: string;
  analysisType: 'valuation' | 'market-trends' | 'comparables' | 'risk-assessment' | 'full';
  options?: Record<string, any>;
}

/**
 * Market trend request
 */
export interface MarketTrendRequest {
  region: string;
  timeRange: 'monthly' | 'quarterly' | 'yearly';
  metrics: string[];
  options?: Record<string, any>;
}

/**
 * Property Intelligence Agent
 */
export class PropertyIntelligenceAgent {
  private static instance: PropertyIntelligenceAgent;
  private agentId: string = 'property-intelligence-agent';
  private agentProtocol: AgentProtocol;
  private storage: IStorage;
  private eventEmitter: EventEmitter;
  private isActive: boolean = false;
  
  /**
   * Create a new property intelligence agent
   * 
   * @param storage Storage service
   */
  private constructor(storage: IStorage) {
    this.storage = storage;
    this.agentProtocol = AgentProtocol.getInstance();
    this.eventEmitter = new EventEmitter();
    
    // Log agent creation
    logger.info('Property Intelligence Agent created');
  }
  
  /**
   * Get the singleton instance of the property intelligence agent
   * 
   * @param storage Storage service
   * @returns The agent instance
   */
  public static getInstance(storage: IStorage): PropertyIntelligenceAgent {
    if (!PropertyIntelligenceAgent.instance) {
      PropertyIntelligenceAgent.instance = new PropertyIntelligenceAgent(storage);
    }
    return PropertyIntelligenceAgent.instance;
  }
  
  /**
   * Start the agent
   */
  public async start(): Promise<void> {
    if (this.isActive) return;
    
    // Register capabilities
    await this.registerCapabilities();
    
    // Set up subscriptions
    this.setupSubscriptions();
    
    // Mark as active
    this.isActive = true;
    
    // Log agent start
    logger.info('Property Intelligence Agent started');
    
    // Register with the agent coordinator
    this.agentProtocol.sendMessage({
      type: AgentMessageType.COORDINATION,
      senderId: this.agentId,
      recipientId: 'agent-coordinator',
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'register-agent',
        name: 'Property Intelligence Agent',
        description: 'AI-powered property analysis and intelligence',
        capabilities: [
          'property-analysis',
          'market-trends',
          'comparable-properties',
          'risk-assessment'
        ]
      }
    });
  }
  
  /**
   * Stop the agent
   */
  public async stop(): Promise<void> {
    if (!this.isActive) return;
    
    // Unregister from the agent coordinator
    this.agentProtocol.sendMessage({
      type: AgentMessageType.COORDINATION,
      senderId: this.agentId,
      recipientId: 'agent-coordinator',
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'unregister-agent'
      }
    });
    
    // Mark as inactive
    this.isActive = false;
    
    // Log agent stop
    logger.info('Property Intelligence Agent stopped');
  }
  
  /**
   * Register agent capabilities
   */
  private async registerCapabilities(): Promise<void> {
    await Promise.all([
      // Register property analysis capability
      this.agentProtocol.registerCapabilities(this.agentId, [
        {
          id: 'property-analysis',
          name: 'Property Analysis',
          description: 'AI-powered property valuation and analysis',
          topics: ['property', 'valuation', 'analysis'],
          actions: ['analyze', 'value', 'predict']
        }
      ]),
      
      // Register market trends capability
      this.agentProtocol.registerCapabilities(this.agentId, [
        {
          id: 'market-trends',
          name: 'Market Trends',
          description: 'Analysis of property market trends and forecasts',
          topics: ['market', 'trends', 'forecast'],
          actions: ['analyze', 'predict']
        }
      ]),
      
      // Register comparable properties capability
      this.agentProtocol.registerCapabilities(this.agentId, [
        {
          id: 'comparable-properties',
          name: 'Comparable Properties',
          description: 'Finding and analyzing comparable properties',
          topics: ['property', 'comparables', 'similarity'],
          actions: ['find', 'analyze', 'compare']
        }
      ]),
      
      // Register risk assessment capability
      this.agentProtocol.registerCapabilities(this.agentId, [
        {
          id: 'risk-assessment',
          name: 'Risk Assessment',
          description: 'Assessment of property risks and opportunities',
          topics: ['risk', 'assessment', 'opportunities'],
          actions: ['assess', 'analyze', 'predict']
        }
      ])
    ]);
    
    logger.info('Property Intelligence Agent capabilities registered');
  }
  
  /**
   * Set up protocol subscriptions
   */
  private setupSubscriptions(): void {
    // Subscribe to task assignments
    this.agentProtocol.subscribe(this.agentId, 'task-assignment', async (message) => {
      if (message.payload.action === 'task-assigned') {
        const { taskId, task } = message.payload;
        
        logger.info(`Property Intelligence Agent assigned task: ${taskId}`);
        
        // Process the task based on its type
        try {
          switch (task.type) {
            case 'property-analysis':
              await this.handlePropertyAnalysisTask(taskId, task);
              break;
            case 'market-trends':
              await this.handleMarketTrendsTask(taskId, task);
              break;
            case 'comparable-properties':
              await this.handleComparablePropertiesTask(taskId, task);
              break;
            case 'risk-assessment':
              await this.handleRiskAssessmentTask(taskId, task);
              break;
            default:
              throw new Error(`Unsupported task type: ${task.type}`);
          }
        } catch (error) {
          logger.error(`Error processing task ${taskId}: ${error.message}`);
          
          // Report task failure
          this.agentProtocol.sendMessage({
            type: AgentMessageType.COORDINATION,
            senderId: this.agentId,
            recipientId: 'agent-coordinator',
            topic: 'coordination',
            priority: MessagePriority.HIGH,
            payload: {
              action: 'fail-task',
              taskId,
              error: error.message
            }
          });
        }
      }
    });
    
    // Subscribe to property analysis requests
    this.agentProtocol.subscribe(this.agentId, 'property', async (message) => {
      if (message.type === AgentMessageType.QUERY && message.payload.action === 'analyze') {
        const request: PropertyAnalysisRequest = message.payload;
        
        logger.info(`Property analysis request received for property ${request.propertyId}`);
        
        try {
          const result = await this.analyzeProperty(request);
          
          // Respond to the query
          this.agentProtocol.respondToQuery(message.id, this.agentId, result);
        } catch (error) {
          logger.error(`Error analyzing property: ${error.message}`);
          
          // Respond with error
          this.agentProtocol.respondToQuery(message.id, this.agentId, {
            error: error.message
          });
        }
      }
    });
    
    // Subscribe to market trend requests
    this.agentProtocol.subscribe(this.agentId, 'market', async (message) => {
      if (message.type === AgentMessageType.QUERY && message.payload.action === 'analyze-trends') {
        const request: MarketTrendRequest = message.payload;
        
        logger.info(`Market trend analysis request received for region ${request.region}`);
        
        try {
          const result = await this.analyzeMarketTrends(request);
          
          // Respond to the query
          this.agentProtocol.respondToQuery(message.id, this.agentId, result);
        } catch (error) {
          logger.error(`Error analyzing market trends: ${error.message}`);
          
          // Respond with error
          this.agentProtocol.respondToQuery(message.id, this.agentId, {
            error: error.message
          });
        }
      }
    });
  }
  
  /**
   * Handle a property analysis task
   * 
   * @param taskId Task ID
   * @param task Task data
   */
  private async handlePropertyAnalysisTask(taskId: string, task: any): Promise<void> {
    const { propertyId, analysisType, options } = task.metadata || {};
    
    if (!propertyId) {
      throw new Error('Property ID is required for property analysis tasks');
    }
    
    logger.info(`Processing property analysis task for property ${propertyId}`);
    
    // Analyze the property
    const result = await this.analyzeProperty({
      propertyId,
      analysisType: analysisType || 'full',
      options
    });
    
    // Complete the task
    this.agentProtocol.sendMessage({
      type: AgentMessageType.COORDINATION,
      senderId: this.agentId,
      recipientId: 'agent-coordinator',
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'complete-task',
        taskId,
        result
      }
    });
    
    logger.info(`Property analysis task ${taskId} completed`);
  }
  
  /**
   * Handle a market trends task
   * 
   * @param taskId Task ID
   * @param task Task data
   */
  private async handleMarketTrendsTask(taskId: string, task: any): Promise<void> {
    const { region, timeRange, metrics, options } = task.metadata || {};
    
    if (!region) {
      throw new Error('Region is required for market trends tasks');
    }
    
    logger.info(`Processing market trends task for region ${region}`);
    
    // Analyze market trends
    const result = await this.analyzeMarketTrends({
      region,
      timeRange: timeRange || 'yearly',
      metrics: metrics || ['price', 'demand', 'supply'],
      options
    });
    
    // Complete the task
    this.agentProtocol.sendMessage({
      type: AgentMessageType.COORDINATION,
      senderId: this.agentId,
      recipientId: 'agent-coordinator',
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'complete-task',
        taskId,
        result
      }
    });
    
    logger.info(`Market trends task ${taskId} completed`);
  }
  
  /**
   * Handle a comparable properties task
   * 
   * @param taskId Task ID
   * @param task Task data
   */
  private async handleComparablePropertiesTask(taskId: string, task: any): Promise<void> {
    const { propertyId, count, criteria, options } = task.metadata || {};
    
    if (!propertyId) {
      throw new Error('Property ID is required for comparable properties tasks');
    }
    
    logger.info(`Processing comparable properties task for property ${propertyId}`);
    
    // Find comparable properties
    const result = await this.findComparableProperties(
      propertyId,
      count || 5,
      criteria,
      options
    );
    
    // Complete the task
    this.agentProtocol.sendMessage({
      type: AgentMessageType.COORDINATION,
      senderId: this.agentId,
      recipientId: 'agent-coordinator',
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'complete-task',
        taskId,
        result
      }
    });
    
    logger.info(`Comparable properties task ${taskId} completed`);
  }
  
  /**
   * Handle a risk assessment task
   * 
   * @param taskId Task ID
   * @param task Task data
   */
  private async handleRiskAssessmentTask(taskId: string, task: any): Promise<void> {
    const { propertyId, riskTypes, options } = task.metadata || {};
    
    if (!propertyId) {
      throw new Error('Property ID is required for risk assessment tasks');
    }
    
    logger.info(`Processing risk assessment task for property ${propertyId}`);
    
    // Assess property risks
    const result = await this.assessPropertyRisks(
      propertyId,
      riskTypes || ['market', 'environmental', 'regulatory'],
      options
    );
    
    // Complete the task
    this.agentProtocol.sendMessage({
      type: AgentMessageType.COORDINATION,
      senderId: this.agentId,
      recipientId: 'agent-coordinator',
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'complete-task',
        taskId,
        result
      }
    });
    
    logger.info(`Risk assessment task ${taskId} completed`);
  }
  
  /**
   * Analyze a property
   * 
   * @param request Property analysis request
   * @returns Analysis result
   */
  public async analyzeProperty(request: PropertyAnalysisRequest): Promise<any> {
    const { propertyId, analysisType, options } = request;
    
    logger.info(`Analyzing property ${propertyId} (type: ${analysisType})`);
    
    try {
      // Get property data
      const property = await this.storage.getPropertyById(propertyId);
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      // Use the AI extension for analysis
      const message = await this.agentProtocol.queryAgent({
        senderId: this.agentId,
        recipientId: 'property-analysis',
        topic: 'property',
        priority: MessagePriority.NORMAL,
        payload: {
          action: 'analyze',
          propertyId,
          type: analysisType,
          options
        }
      });
      
      // Add request information to the result
      return {
        request,
        timestamp: new Date().toISOString(),
        result: message.payload
      };
    } catch (error) {
      logger.error(`Error analyzing property ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze market trends
   * 
   * @param request Market trend request
   * @returns Analysis result
   */
  public async analyzeMarketTrends(request: MarketTrendRequest): Promise<any> {
    const { region, timeRange, metrics, options } = request;
    
    logger.info(`Analyzing market trends for region ${region}`);
    
    try {
      // Get market trend data
      const trends = await this.storage.getMarketTrends(region);
      
      // Use the AI extension for analysis
      const message = await this.agentProtocol.queryAgent({
        senderId: this.agentId,
        recipientId: 'property-analysis',
        topic: 'market',
        priority: MessagePriority.NORMAL,
        payload: {
          action: 'analyze-trends',
          region,
          timeRange,
          metrics,
          options,
          trendsData: trends
        }
      });
      
      // Add request information to the result
      return {
        request,
        timestamp: new Date().toISOString(),
        result: message.payload
      };
    } catch (error) {
      logger.error(`Error analyzing market trends for region ${region}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find comparable properties
   * 
   * @param propertyId Target property ID
   * @param count Number of comparables to find
   * @param criteria Optional comparison criteria
   * @param options Optional additional options
   * @returns Comparable properties with similarity scores
   */
  public async findComparableProperties(
    propertyId: string,
    count: number = 5,
    criteria?: string[],
    options?: Record<string, any>
  ): Promise<any> {
    logger.info(`Finding ${count} comparable properties for property ${propertyId}`);
    
    try {
      // Use the findComparableProperties method from the property analysis extension
      const message = await this.agentProtocol.queryAgent({
        senderId: this.agentId,
        recipientId: 'property-analysis',
        topic: 'property',
        priority: MessagePriority.NORMAL,
        payload: {
          action: 'find-comparables',
          propertyId,
          count,
          criteria,
          options
        }
      });
      
      // Return the result
      return {
        propertyId,
        timestamp: new Date().toISOString(),
        comparables: message.payload
      };
    } catch (error) {
      logger.error(`Error finding comparable properties for ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Assess property risks
   * 
   * @param propertyId Property ID
   * @param riskTypes Types of risks to assess
   * @param options Optional additional options
   * @returns Risk assessment result
   */
  public async assessPropertyRisks(
    propertyId: string,
    riskTypes: string[] = ['market', 'environmental', 'regulatory'],
    options?: Record<string, any>
  ): Promise<any> {
    logger.info(`Assessing risks for property ${propertyId}`);
    
    try {
      // Get property data
      const property = await this.storage.getPropertyById(propertyId);
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      // Get market trends for risk assessment
      const trends = await this.storage.getMarketTrends();
      
      // Query for environmental risks if applicable
      let environmentalRisks = null;
      if (riskTypes.includes('environmental')) {
        try {
          environmentalRisks = await this.storage.getEnvironmentalRisks(propertyId);
        } catch (error) {
          logger.warn(`Could not get environmental risks for property ${propertyId}: ${error.message}`);
        }
      }
      
      // Query for regulatory framework if applicable
      let regulatoryFramework = null;
      if (riskTypes.includes('regulatory')) {
        try {
          // Use the region from the property data
          const region = property.address.split(',').pop()?.trim() || '';
          regulatoryFramework = await this.storage.getRegulatoryFramework(region);
        } catch (error) {
          logger.warn(`Could not get regulatory framework: ${error.message}`);
        }
      }
      
      // Use AI to assess risks
      const message = await this.agentProtocol.queryAgent({
        senderId: this.agentId,
        recipientId: 'property-analysis',
        topic: 'risk',
        priority: MessagePriority.NORMAL,
        payload: {
          action: 'assess-risks',
          propertyId,
          property,
          riskTypes,
          marketTrends: trends,
          environmentalRisks,
          regulatoryFramework,
          options
        }
      });
      
      // Return the result
      return {
        propertyId,
        timestamp: new Date().toISOString(),
        riskAssessment: message.payload
      };
    } catch (error) {
      logger.error(`Error assessing risks for property ${propertyId}: ${error.message}`);
      throw error;
    }
  }
}
import { AIExtension, AIExtensionConfig } from './ai-extension';
import { IStorage } from '../storage';
import { AIService } from '../services/ai-service';
import { AgentProtocol, AgentMessageType, MessagePriority, AgentCapability } from './agent-protocol';

/**
 * Property analysis result
 */
interface PropertyAnalysisResult {
  propertyId: string;
  estimatedValue: number;
  confidenceScore: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  comparables: string[];
  recommendations: string[];
  marketTrends: string[];
}

/**
 * History data point
 */
interface PropertyHistoryDataPoint {
  date: string;
  value: number;
  event?: string;
}

/**
 * PropertyAnalysisAIExtension provides AI-powered property analysis capabilities
 */
export class PropertyAnalysisAIExtension extends AIExtension {
  protected id: string = 'property-analysis';
  protected settings: Array<{
    id: string;
    label: string;
    type: string;
    defaultValue: any;
  }> = [];
  protected storage: IStorage;
  
  /**
   * Activate the extension
   */
  public async activate(): Promise<void> {
    console.log('PropertyAnalysisAIExtension activated');
    
    // Register event listeners
    this.subscribeToAgentMessages();
    
    // Initialize extension state
    await this.loadSettings();
  }
  
  /**
   * Deactivate the extension
   */
  public async deactivate(): Promise<void> {
    console.log('PropertyAnalysisAIExtension deactivated');
    
    // Unregister capabilities 
    this.agentProtocol.unregisterCapabilities(this.id);
    
    // Clean up resources
    this.clearActiveConversations();
  }
  
  /**
   * Load extension settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      // In a real implementation, this would load the settings from storage
      console.log('Loading property analysis extension settings');
    } catch (error) {
      console.error('Error loading PropertyAnalysisAIExtension settings:', error);
    }
  }
  
  /**
   * Clear active conversation memory
   */
  private clearActiveConversations(): void {
    // Clear all conversation history to free up memory
    const conversationKeys = Array.from(this.conversationHistory.keys());
    for (const key of conversationKeys) {
      this.clearConversation(key);
    }
  }
  private agentProtocol: AgentProtocol;
  
  /**
   * Create a new property analysis extension
   * 
   * @param storage Storage service
   * @param aiService AI service
   * @param config AI extension configuration
   */
  constructor(
    storage: IStorage,
    aiService: AIService,
    config?: AIExtensionConfig
  ) {
    super('property-analysis', storage, aiService, {
      model: 'gpt-4-turbo',
      temperature: 0.2,
      maxTokens: 4000,
      systemPrompt: 'You are an expert property appraiser AI assistant. Your job is to analyze property data and provide accurate valuations and insights.',
      ...config
    });
    
    // Initialize the agent protocol
    this.agentProtocol = AgentProtocol.getInstance();
    
    // Register our capabilities
    this.registerAgentCapabilities();
    
    // Register extension commands
    this.registerCommands();
    
    // Configure extension settings
    this.configureSettings();
    
    // Create webviews
    this.createWebviews();
    
    // Listen for agent messages
    this.subscribeToAgentMessages();
  }
  
  /**
   * Register this extension's capabilities with the agent protocol
   */
  private registerAgentCapabilities(): void {
    const capabilities: AgentCapability[] = [
      {
        id: 'property-valuation',
        name: 'Property Valuation',
        description: 'AI-powered property valuation based on historical data and market trends',
        topics: ['property', 'valuation', 'appraisal'],
        actions: ['analyze', 'compare', 'predict']
      },
      {
        id: 'market-analysis',
        name: 'Market Analysis',
        description: 'Analysis of property market trends and forecasts',
        topics: ['market', 'trends', 'forecast'],
        actions: ['analyze', 'predict']
      }
    ];
    
    this.agentProtocol.registerCapabilities(this.id, capabilities);
  }
  
  /**
   * Register extension commands
   */
  private registerCommands(): void {
    this.registerCommand(
      'analyze-property', 
      'Analyze Property', 
      'analyzeProperty',
      { icon: 'bar-chart-2' }
    );
    
    this.registerCommand(
      'predict-future-value', 
      'Predict Future Value', 
      'predictFutureValue',
      { icon: 'trending-up' }
    );
    
    this.registerCommand(
      'generate-property-story', 
      'Generate Property Story', 
      'generatePropertyStory',
      { icon: 'book-open' }
    );
    
    this.registerCommand(
      'find-comparable-properties', 
      'Find Comparable Properties', 
      'findComparableProperties',
      { icon: 'search' }
    );
  }
  
  /**
   * Configure extension settings
   */
  private configureSettings(): void {
    this.settings = [
      {
        id: 'enableAdvancedAnalysis',
        label: 'Enable Advanced Analysis',
        type: 'boolean',
        defaultValue: true
      },
      {
        id: 'confidenceThreshold',
        label: 'Confidence Threshold',
        type: 'number',
        defaultValue: 0.7
      },
      {
        id: 'maxComparables',
        label: 'Maximum Comparable Properties',
        type: 'number',
        defaultValue: 5
      },
      {
        id: 'includePredictions',
        label: 'Include Future Value Predictions',
        type: 'boolean',
        defaultValue: true
      }
    ];
  }
  
  /**
   * Create webviews for the extension
   */
  private createWebviews(): void {
    const dashboardContent = `
      <div class="property-analysis-dashboard">
        <h1>Property Analysis Dashboard</h1>
        <div class="dashboard-content">
          <div class="metrics-panel">
            <h2>Key Metrics</h2>
            <div id="key-metrics-content">
              <!-- Dynamic content will be loaded here -->
              <p>Select a property to view analysis</p>
            </div>
          </div>
          <div class="valuation-panel">
            <h2>Valuation History</h2>
            <div id="valuation-chart">
              <!-- Chart will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    const comparisonContent = `
      <div class="property-comparison-view">
        <h1>Property Comparison</h1>
        <div class="comparison-content">
          <div class="property-list">
            <h2>Comparable Properties</h2>
            <div id="property-list-content">
              <!-- Dynamic content will be loaded here -->
              <p>Select properties to compare</p>
            </div>
          </div>
          <div class="comparison-table">
            <h2>Comparison Table</h2>
            <div id="comparison-table-content">
              <!-- Table will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.registerWebview('property-analysis-dashboard', 'Property Analysis Dashboard', dashboardContent, 'AI-powered property analysis tools');
    this.registerWebview('property-comparison', 'Property Comparison', comparisonContent, 'Compare properties with AI insights');
  }
  
  /**
   * Subscribe to agent messages
   */
  private subscribeToAgentMessages(): void {
    // Subscribe to property analysis requests
    this.agentProtocol.subscribe(this.id, 'property', async (message) => {
      if (message.type === AgentMessageType.QUERY && message.payload.action === 'analyze') {
        const propertyId = message.payload.propertyId;
        try {
          const analysisResult = await this.analyzeProperty(propertyId);
          this.agentProtocol.respondToQuery(message.id, this.id, analysisResult);
        } catch (error) {
          console.error(`Error analyzing property: ${error}`);
          this.agentProtocol.respondToQuery(message.id, this.id, { error: 'Failed to analyze property' });
        }
      }
    });
    
    // Subscribe to market trend requests
    this.agentProtocol.subscribe(this.id, 'market', async (message) => {
      if (message.type === AgentMessageType.QUERY && message.payload.action === 'predict') {
        const propertyId = message.payload.propertyId;
        const years = message.payload.years || 5;
        try {
          const prediction = await this.predictFutureValue(propertyId, years);
          this.agentProtocol.respondToQuery(message.id, this.id, prediction);
        } catch (error) {
          console.error(`Error predicting market trends: ${error}`);
          this.agentProtocol.respondToQuery(message.id, this.id, { error: 'Failed to predict market trends' });
        }
      }
    });
  }
  
  /**
   * Analyze a property using AI
   * 
   * @param propertyId ID of the property to analyze
   * @returns Analysis result
   */
  public async analyzeProperty(propertyId: string): Promise<PropertyAnalysisResult> {
    // Get property data
    const property = await this.storage.getPropertyById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }
    
    // Get comparable properties
    const comparableProperties = await this.storage.findComparableProperties(propertyId, 5);
    
    // Get historical property data
    const propertyHistory = await this.storage.getPropertyHistory(propertyId);
    
    // Create a conversation ID for this analysis
    const conversationId = `property-analysis-${propertyId}-${Date.now()}`;
    
    // Create a prompt for the AI
    await this.addUserMessage(conversationId, `
      I need a detailed analysis of property ${propertyId}.
      
      Property Details:
      ${JSON.stringify(property, null, 2)}
      
      Comparable Properties:
      ${JSON.stringify(comparableProperties, null, 2)}
      
      Historical Data:
      ${JSON.stringify(propertyHistory, null, 2)}
      
      Please provide:
      1. An estimated current market value with a confidence score
      2. Key factors affecting the valuation with impact scores
      3. List of most relevant comparable properties
      4. Recommendations for property improvements
      5. Current market trends affecting this property
      
      Format your response as a valid JSON object with the following structure:
      {
        "estimatedValue": number,
        "confidenceScore": number,
        "factors": [{ "name": string, "impact": number, "description": string }],
        "comparables": string[],
        "recommendations": string[],
        "marketTrends": string[]
      }
    `);
    
    // Generate completion
    const response = await this.generateCompletion(conversationId);
    
    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Add propertyId to the result
      return {
        propertyId,
        ...analysis
      };
    } catch (error) {
      console.error(`Error parsing property analysis: ${error}`);
      throw new Error('Failed to analyze property');
    }
  }
  
  /**
   * Predict the future value of a property
   * 
   * @param propertyId ID of the property
   * @param yearsAhead Number of years to predict ahead
   * @returns Predicted value and confidence
   */
  public async predictFutureValue(propertyId: string, yearsAhead: number = 5): Promise<{
    propertyId: string;
    currentValue: number;
    predictedValue: number;
    confidenceInterval: [number, number];
    growthRate: number;
    timeline: PropertyHistoryDataPoint[];
  }> {
    // Get property data
    const property = await this.storage.getPropertyById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }
    
    // Get historical property data
    const propertyHistory = await this.storage.getPropertyHistory(propertyId);
    
    // Get market trends
    const marketTrends = await this.storage.getMarketTrends();
    
    // Create a conversation ID for this prediction
    const conversationId = `property-prediction-${propertyId}-${Date.now()}`;
    
    // Create a prompt for the AI
    await this.addUserMessage(conversationId, `
      I need a prediction of the future value of property ${propertyId} ${yearsAhead} years from now.
      
      Property Details:
      ${JSON.stringify(property, null, 2)}
      
      Historical Data:
      ${JSON.stringify(propertyHistory, null, 2)}
      
      Market Trends:
      ${JSON.stringify(marketTrends, null, 2)}
      
      Please predict:
      1. The future value of the property in ${yearsAhead} years
      2. A confidence interval (low and high estimates)
      3. The estimated annual growth rate
      4. A timeline of projected values for each year
      
      Format your response as a valid JSON object with the following structure:
      {
        "currentValue": number,
        "predictedValue": number,
        "confidenceInterval": [number, number],
        "growthRate": number,
        "timeline": [{ "date": string, "value": number, "event": string }]
      }
    `);
    
    // Generate completion
    const response = await this.generateCompletion(conversationId, {
      temperature: 0.3 // Lower temperature for more deterministic predictions
    });
    
    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const prediction = JSON.parse(jsonMatch[0]);
      
      // Add propertyId to the result
      return {
        propertyId,
        ...prediction
      };
    } catch (error) {
      console.error(`Error parsing property prediction: ${error}`);
      throw new Error('Failed to predict property value');
    }
  }
  
  /**
   * Generate a narrative story about a property
   * 
   * @param propertyId ID of the property
   * @returns Property story
   */
  public async generatePropertyStory(propertyId: string): Promise<{
    propertyId: string;
    title: string;
    summary: string;
    fullStory: string;
    keyEvents: { date: string; event: string; impact: string }[];
  }> {
    // Get property data
    const property = await this.storage.getPropertyById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }
    
    // Get historical property data
    const propertyHistory = await this.storage.getPropertyHistory(propertyId);
    
    // Create a conversation ID for this story
    const conversationId = `property-story-${propertyId}-${Date.now()}`;
    
    // Create a prompt for the AI
    await this.addUserMessage(conversationId, `
      I need a compelling narrative story about property ${propertyId}.
      
      Property Details:
      ${JSON.stringify(property, null, 2)}
      
      Historical Data:
      ${JSON.stringify(propertyHistory, null, 2)}
      
      Please create:
      1. A catchy title for the property
      2. A brief summary (50 words max)
      3. A detailed story of the property's history and potential future
      4. A timeline of key events in the property's history
      
      Format your response as a valid JSON object with the following structure:
      {
        "title": string,
        "summary": string,
        "fullStory": string,
        "keyEvents": [{ "date": string, "event": string, "impact": string }]
      }
    `);
    
    // Generate completion
    const response = await this.generateCompletion(conversationId, {
      temperature: 0.8, // Higher temperature for more creative storytelling
      maxTokens: 2000 // Allow for longer responses
    });
    
    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const story = JSON.parse(jsonMatch[0]);
      
      // Add propertyId to the result
      return {
        propertyId,
        ...story
      };
    } catch (error) {
      console.error(`Error parsing property story: ${error}`);
      throw new Error('Failed to generate property story');
    }
  }
  
  /**
   * Find comparable properties
   * 
   * @param propertyId ID of the property
   * @param count Number of comparables to find
   * @returns Array of comparable properties with similarity scores
   */
  public async findComparableProperties(propertyId: string, count: number = 5): Promise<{
    propertyId: string;
    comparables: {
      id: string;
      similarityScore: number;
      matchingFeatures: string[];
      differentiatingFeatures: string[];
    }[];
  }> {
    // Get property data
    const property = await this.storage.getPropertyById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }
    
    // Get all properties
    const allProperties = await this.storage.getAllProperties();
    const otherProperties = allProperties.filter(p => p.propertyId !== propertyId);
    
    // Create a conversation ID for this comparison
    const conversationId = `property-comparables-${propertyId}-${Date.now()}`;
    
    // Create a prompt for the AI
    await this.addUserMessage(conversationId, `
      I need to find the top ${count} most comparable properties to property ${propertyId}.
      
      Target Property:
      ${JSON.stringify(property, null, 2)}
      
      Candidate Properties:
      ${JSON.stringify(otherProperties, null, 2)}
      
      Please find:
      1. The ${count} most similar properties
      2. A similarity score for each (0-1)
      3. Matching features between the target and each comparable
      4. Key differentiating features
      
      Format your response as a valid JSON object with the following structure:
      {
        "comparables": [
          {
            "id": string,
            "similarityScore": number,
            "matchingFeatures": string[],
            "differentiatingFeatures": string[]
          }
        ]
      }
    `);
    
    // Generate completion
    const response = await this.generateCompletion(conversationId, {
      temperature: 0.2, // Lower temperature for more consistent comparisons
      maxTokens: 1500 // Allow for longer responses to handle many properties
    });
    
    // Parse the JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Add propertyId to the result
      return {
        propertyId,
        ...result
      };
    } catch (error) {
      console.error(`Error parsing property comparables: ${error}`);
      throw new Error('Failed to find comparable properties');
    }
  }
}
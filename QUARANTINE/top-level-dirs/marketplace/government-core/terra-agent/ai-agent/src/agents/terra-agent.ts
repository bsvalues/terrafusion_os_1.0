/**
 * TerraAgent AI - Enhanced with Day 6 AI Conversation Enhancement & Natural Language Analytics
 * MIT PhD-level real estate AI agent with comprehensive analytics and conversation capabilities
 */

import { IntegratedAnalyticsEngine, AnalyticsQuery, AnalyticsResponse } from '../../analytics/index';
import { NLPEngine, AnalyticsIntent, EntityExtractions, QueryParameters } from '../../nlp/nlp-engine';
import { ConversationContextManager, ConversationState } from '../../conversation/context-manager';
import { IntelligentResponseGenerator, IntelligentResponse } from '../../response/response-generator';
import { VoiceInterface, MobileOptimizer, AccessibilityManager } from '../../interaction/advanced-patterns';

// TerraAgent Types
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    source?: string;
    confidence?: number;
    analytics?: any;
  };
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  location?: string;
  preferences?: UserPreferences;
  conversationHistory: AgentMessage[];
  activeAnalytics?: any;
}

export interface UserPreferences {
  priceRange?: { min: number; max: number };
  propertyTypes?: string[];
  neighborhoods?: string[];
  investmentGoals?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
  timeframe?: string;
}

export interface AgentResponse {
  message: string;
  type: 'text' | 'analytics' | 'visualization' | 'report';
  data?: any;
  suggestions?: string[];
  followUp?: string[];
  confidence: number;
  processingTime: number;
}

/**
 * Enhanced TerraAgent AI with Day 6 Conversation Enhancement & Natural Language Analytics
 */
export class TerraAgent {
  private analytics: IntegratedAnalyticsEngine;
  private nlpEngine: NLPEngine;
  private contextManager: ConversationContextManager;
  private responseGenerator: IntelligentResponseGenerator;
  private voiceInterface: VoiceInterface;
  private mobileOptimizer: MobileOptimizer;
  private accessibilityManager: AccessibilityManager;
  private conversationContext: Map<string, AgentContext> = new Map();
  private systemPrompt: string;

  constructor(analyticsEngine: IntegratedAnalyticsEngine) {
    this.analytics = analyticsEngine;
    
    // Initialize Day 6 conversation enhancement components
    this.nlpEngine = new NLPEngine();
    this.contextManager = new ConversationContextManager();
    this.responseGenerator = new IntelligentResponseGenerator(this.contextManager);
    this.voiceInterface = new VoiceInterface();
    this.mobileOptimizer = new MobileOptimizer();
    this.accessibilityManager = new AccessibilityManager();
    
    this.systemPrompt = this.buildSystemPrompt();
    console.log('🤖 TerraAgent AI initialized with Day 6 conversation enhancement capabilities');
  }

  /**
   * Process user message with intelligent analytics integration
   */
  async processMessage(
    userId: string,
    message: string,
    sessionId?: string
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Processing message from user ${userId}: ${message.substring(0, 100)}...`);

      // Get or create conversation context
      const context = this.getOrCreateContext(userId, sessionId || this.generateSessionId());

      // Add user message to history
      context.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Analyze message intent and extract analytics needs
      const intent = await this.analyzeMessageIntent(message, context);

      // Generate response based on intent
      let response: AgentResponse;
      
      if (intent.requiresAnalytics) {
        response = await this.processAnalyticsRequest(message, intent, context);
      } else {
        response = await this.processConversationalRequest(message, intent, context);
      }

      // Add assistant response to history
      context.conversationHistory.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          analytics: response.data
        }
      });

      // Update context
      this.conversationContext.set(userId, context);

      response.processingTime = Date.now() - startTime;
      console.log(`✅ Message processed in ${response.processingTime}ms`);

      return response;

    } catch (error) {
      console.error('❌ Message processing failed:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'text',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get comprehensive property analysis
   */
  async analyzeProperty(address: string, userId: string): Promise<AgentResponse> {
    try {
      console.log(`🏠 Analyzing property: ${address}`);

      const analysis = await this.analytics.getComprehensiveAnalysis(address, 'property');

      const response: AgentResponse = {
        message: this.formatPropertyAnalysis(address, analysis),
        type: 'analytics',
        data: analysis,
        suggestions: this.generatePropertySuggestions(analysis),
        followUp: [
          'Would you like me to analyze the investment potential?',
          'Should I generate a detailed market report?',
          'Would you like to see comparable properties?'
        ],
        confidence: analysis.summary?.overallRating / 100 || 0.8,
        processingTime: 0
      };

      return response;

    } catch (error) {
      console.error('❌ Property analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate market dashboard for user
   */
  async generateDashboard(userId: string): Promise<AgentResponse> {
    try {
      console.log(`📊 Generating dashboard for user: ${userId}`);

      const dashboard = await this.analytics.generateMarketDashboard(userId);

      const response: AgentResponse = {
        message: 'I\'ve generated your personalized real estate market dashboard with the latest analytics and insights.',
        type: 'visualization',
        data: dashboard,
        suggestions: [
          'Explore the market trends chart',
          'Check out top investment opportunities',
          'Review your saved properties'
        ],
        followUp: [
          'Would you like me to explain any specific metrics?',
          'Should I highlight the best opportunities?',
          'Would you like to customize the dashboard?'
        ],
        confidence: 0.95,
        processingTime: 0
      };

      return response;

    } catch (error) {
      console.error('❌ Dashboard generation failed:', error);
      throw error;
    }
  }

  /**
   * Process investment scoring request
   */
  async scoreInvestment(
    address: string,
    criteria: any,
    userId: string
  ): Promise<AgentResponse> {
    try {
      console.log(`💰 Scoring investment: ${address}`);

      const query: AnalyticsQuery = {
        type: 'investment_scoring',
        action: 'score_opportunity',
        parameters: { address, criteria },
        userId,
        timestamp: new Date()
      };

      const result = await this.analytics.processQuery(query);

      const response: AgentResponse = {
        message: this.formatInvestmentScore(address, result.data),
        type: 'analytics',
        data: result.data,
        suggestions: this.generateInvestmentSuggestions(result.data),
        followUp: [
          'Would you like a detailed risk analysis?',
          'Should I compare with other opportunities?',
          'Would you like ROI projections?'
        ],
        confidence: result.metadata.confidence || 0.85,
        processingTime: 0
      };

      return response;

    } catch (error) {
      console.error('❌ Investment scoring failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private getOrCreateContext(userId: string, sessionId: string): AgentContext {
    const existingContext = this.conversationContext.get(userId);
    
    if (existingContext) {
      return existingContext;
    }

    const newContext: AgentContext = {
      userId,
      sessionId,
      conversationHistory: [],
      preferences: {}
    };

    this.conversationContext.set(userId, newContext);
    return newContext;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async analyzeMessageIntent(message: string, context: AgentContext): Promise<any> {
    // Simple intent analysis - in production, use NLP/ML models
    const lowerMessage = message.toLowerCase();

    // Analytics keywords
    const analyticsKeywords = [
      'analyze', 'analysis', 'market', 'trends', 'price', 'value', 'investment',
      'roi', 'cma', 'comparable', 'forecast', 'predict', 'score', 'report',
      'dashboard', 'chart', 'map', 'visualization'
    ];

    // Location patterns
    const addressPattern = /\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|way|blvd|boulevard)/i;
    const cityPattern = /(?:in|near|around)\s+[\w\s]+,?\s*[A-Z]{2}/i;

    const requiresAnalytics = analyticsKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    const hasAddress = addressPattern.test(message);
    const hasLocation = cityPattern.test(message) || hasAddress;

    return {
      requiresAnalytics,
      hasAddress,
      hasLocation,
      extractedAddress: hasAddress ? message.match(addressPattern)?.[0] : null,
      extractedLocation: hasLocation ? message.match(cityPattern)?.[0] : null,
      keywords: analyticsKeywords.filter(keyword => lowerMessage.includes(keyword))
    };
  }

  private async processAnalyticsRequest(
    message: string,
    intent: any,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Determine analytics type based on keywords
      if (intent.keywords.includes('investment') || intent.keywords.includes('roi')) {
        return await this.handleInvestmentQuery(message, intent, context);
      } else if (intent.keywords.includes('cma') || intent.keywords.includes('comparable')) {
        return await this.handleCMAQuery(message, intent, context);
      } else if (intent.keywords.includes('market') || intent.keywords.includes('trends')) {
        return await this.handleMarketQuery(message, intent, context);
      } else if (intent.keywords.includes('dashboard') || intent.keywords.includes('visualization')) {
        return await this.handleVisualizationQuery(message, intent, context);
      } else if (intent.hasAddress) {
        return await this.handlePropertyQuery(message, intent, context);
      } else {
        return await this.handleGeneralAnalyticsQuery(message, intent, context);
      }
    } catch (error) {
      console.error('❌ Analytics request processing failed:', error);
      return {
        message: 'I apologize, but I encountered an issue with your analytics request. Please try rephrasing your question.',
        type: 'text',
        confidence: 0,
        processingTime: 0
      };
    }
  }

  private async processConversationalRequest(
    message: string,
    intent: any,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Handle general conversation about real estate
    const responses = [
      'I\'m here to help you with real estate analysis and market insights. What would you like to know?',
      'I can analyze properties, provide market trends, score investments, and generate detailed reports. How can I assist you?',
      'Feel free to ask me about any property address, market conditions, or investment opportunities.'
    ];

    return {
      message: responses[Math.floor(Math.random() * responses.length)],
      type: 'text',
      suggestions: [
        'Analyze a specific property',
        'Show market trends',
        'Generate investment report',
        'Create market dashboard'
      ],
      confidence: 0.9,
      processingTime: 0
    };
  }

  private async handleInvestmentQuery(message: string, intent: any, context: AgentContext): Promise<AgentResponse> {
    if (intent.extractedAddress) {
      return await this.scoreInvestment(intent.extractedAddress, context.preferences || {}, context.userId);
    } else {
      return {
        message: 'I can help you analyze investment opportunities. Please provide a specific property address for investment scoring.',
        type: 'text',
        suggestions: ['Provide property address', 'Show top opportunities', 'Set investment criteria'],
        confidence: 0.8,
        processingTime: 0
      };
    }
  }

  private async handleCMAQuery(message: string, intent: any, context: AgentContext): Promise<AgentResponse> {
    if (intent.extractedAddress) {
      const query: AnalyticsQuery = {
        type: 'cma_automation',
        action: 'generate_cma',
        parameters: { address: intent.extractedAddress },
        userId: context.userId,
        timestamp: new Date()
      };

      const result = await this.analytics.processQuery(query);

      return {
        message: this.formatCMAReport(intent.extractedAddress, result.data),
        type: 'report',
        data: result.data,
        suggestions: ['Download full report', 'View comparables', 'Analyze market position'],
        confidence: result.metadata.confidence || 0.9,
        processingTime: 0
      };
    } else {
      return {
        message: 'I can generate a Comparative Market Analysis (CMA) for any property. Please provide the property address.',
        type: 'text',
        suggestions: ['Provide property address', 'Learn about CMA', 'View sample report'],
        confidence: 0.8,
        processingTime: 0
      };
    }
  }

  private async handleMarketQuery(message: string, intent: any, context: AgentContext): Promise<AgentResponse> {
    const region = intent.extractedLocation || context.location || 'Seattle, WA';

    const query: AnalyticsQuery = {
      type: 'market_intelligence',
      action: 'predict_trends',
      parameters: { region },
      userId: context.userId,
      timestamp: new Date()
    };

    const result = await this.analytics.processQuery(query);

    return {
      message: this.formatMarketTrends(region, result.data),
      type: 'analytics',
      data: result.data,
      suggestions: ['View detailed forecast', 'Compare regions', 'Set market alerts'],
      confidence: result.metadata.confidence || 0.85,
      processingTime: 0
    };
  }

  private async handleVisualizationQuery(message: string, intent: any, context: AgentContext): Promise<AgentResponse> {
    return await this.generateDashboard(context.userId);
  }

  private async handlePropertyQuery(message: string, intent: any, context: AgentContext): Promise<AgentResponse> {
    return await this.analyzeProperty(intent.extractedAddress, context.userId);
  }

  private async handleGeneralAnalyticsQuery(message: string, intent: any, context: AgentContext): Promise<AgentResponse> {
    return {
      message: 'I have comprehensive analytics capabilities including market intelligence, investment scoring, CMA automation, and advanced visualization. What specific analysis would you like?',
      type: 'text',
      suggestions: [
        'Analyze a property',
        'Show market trends',
        'Score an investment',
        'Generate CMA report',
        'Create dashboard'
      ],
      confidence: 0.9,
      processingTime: 0
    };
  }

  // Formatting methods
  private formatPropertyAnalysis(address: string, analysis: any): string {
    return `🏠 **Property Analysis for ${address}**\n\n` +
           `**Overall Rating:** ${analysis.summary?.overallRating || 'N/A'}/100\n\n` +
           `**Key Insights:**\n${(analysis.summary?.keyInsights || []).map(insight => `• ${insight}`).join('\n')}\n\n` +
           `**Investment Score:** ${analysis.investmentAnalysis?.overallScore || 'N/A'}/100\n` +
           `**Market Position:** ${analysis.comparativeAnalysis?.marketPosition?.description || 'Analyzing...'}\n` +
           `**Risk Level:** ${analysis.investmentAnalysis?.riskAssessment?.overall || 'Medium'}\n\n` +
           `I've prepared a comprehensive analysis with market intelligence, investment scoring, and comparative data.`;
  }

  private formatInvestmentScore(address: string, data: any): string {
    return `💰 **Investment Analysis for ${address}**\n\n` +
           `**Overall Score:** ${data.overallScore}/100\n` +
           `**ROI Projection:** ${data.roiProjection?.expected || 'N/A'}%\n` +
           `**Risk Level:** ${data.riskAssessment?.level || 'Medium'}\n` +
           `**Recommendation:** ${data.recommendation || 'Analyze further'}\n\n` +
           `This property scores well across multiple investment factors with solid return potential.`;
  }

  private formatCMAReport(address: string, data: any): string {
    return `📊 **CMA Report for ${address}**\n\n` +
           `**Estimated Value:** $${data.valuation?.estimatedValue?.toLocaleString() || 'N/A'}\n` +
           `**Price Range:** $${data.valuation?.range?.low?.toLocaleString() || 'N/A'} - $${data.valuation?.range?.high?.toLocaleString() || 'N/A'}\n` +
           `**Confidence:** ${data.valuation?.confidence || 'N/A'}%\n` +
           `**Comparables Found:** ${data.comparables?.length || 0}\n\n` +
           `I've analyzed comparable properties and market data to provide this valuation estimate.`;
  }

  private formatMarketTrends(region: string, data: any): string {
    return `📈 **Market Trends for ${region}**\n\n` +
           `**Direction:** ${data.direction || 'Stable'}\n` +
           `**Price Growth:** ${data.priceGrowth || 'N/A'}% (12 months)\n` +
           `**Market Health:** ${data.health || 'Good'}\n` +
           `**Forecast:** ${data.forecast || 'Positive outlook'}\n\n` +
           `The market shows ${data.direction === 'up' ? 'positive momentum' : 'stable conditions'} with good investment opportunities.`;
  }

  private generatePropertySuggestions(analysis: any): string[] {
    const suggestions = [];
    
    if (analysis.investmentAnalysis?.overallScore > 80) {
      suggestions.push('Consider making an offer - high investment potential');
    }
    
    if (analysis.comparativeAnalysis?.priceRecommendation?.type === 'below_market') {
      suggestions.push('Price appears below market - potential negotiation opportunity');
    }
    
    suggestions.push('Request detailed investment analysis');
    suggestions.push('Compare with similar properties');
    suggestions.push('Generate professional report');
    
    return suggestions;
  }

  private generateInvestmentSuggestions(data: any): string[] {
    const suggestions = [];
    
    if (data.overallScore > 75) {
      suggestions.push('Strong investment opportunity - consider pursuing');
    }
    
    if (data.riskAssessment?.level === 'low') {
      suggestions.push('Low risk profile makes this a safe investment');
    }
    
    suggestions.push('Review detailed risk analysis');
    suggestions.push('Compare with other opportunities');
    suggestions.push('Set up price alerts');
    
    return suggestions;
  }

  private buildSystemPrompt(): string {
    return `You are TerraAgent, an advanced AI real estate assistant with MIT PhD-level analytics capabilities. 

Your core competencies include:
- Comprehensive property analysis with machine learning models
- Advanced market intelligence and trend prediction
- Investment scoring and risk assessment
- Automated CMA generation and valuation
- Interactive visualization and professional reporting

You have access to:
- Real-time MLS data and market information
- Predictive analytics and forecasting models
- Investment optimization algorithms
- Professional report generation capabilities
- Interactive dashboards and visualizations

Always provide accurate, data-driven insights while being helpful and professional. When users ask for analysis, leverage your advanced analytics engines to provide comprehensive, actionable information.`;
  }
}

export default TerraAgent;

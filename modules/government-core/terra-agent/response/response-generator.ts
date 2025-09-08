/**
 * Intelligent Response Generator for TerraAgent AI
 * Day 6 Phase 3: Natural language response synthesis and visual integration
 */

import { ConversationState, ConversationContextManager } from '../conversation/context-manager';
import { AnalyticsIntent, EntityExtractions } from '../nlp/nlp-engine';

// Response Types
export interface IntelligentResponse {
  naturalLanguageResponse: string;
  visualComponents: VisualComponent[];
  actionableInsights: ActionableInsight[];
  followUpSuggestions: string[];
  confidence: number;
  responseMetadata: ResponseMetadata;
  conversationContinuation: ConversationContinuation;
}

export interface VisualComponent {
  type: 'chart' | 'map' | 'table' | 'card' | 'report' | 'comparison' | 'timeline';
  title: string;
  description: string;
  data: any;
  configuration: VisualConfiguration;
  priority: number;
  interactive: boolean;
  embedUrl?: string;
}

export interface VisualConfiguration {
  width?: string;
  height?: string;
  theme: 'light' | 'dark' | 'auto';
  responsive: boolean;
  exportable: boolean;
  realTimeUpdates: boolean;
  customStyling?: any;
}

export interface ActionableInsight {
  insight: string;
  actionType: 'immediate' | 'recommended' | 'future_consideration';
  priority: 'high' | 'medium' | 'low';
  category: 'financial' | 'market' | 'property' | 'timing' | 'risk' | 'opportunity';
  reasoning: string;
  estimatedImpact: string;
  timeframe: string;
  nextSteps: string[];
  confidence: number;
}

export interface ResponseMetadata {
  generatedAt: Date;
  processingTime: number;
  dataSourcesUsed: string[];
  analyticsEnginesInvolved: string[];
  confidenceFactors: ConfidenceFactor[];
  personalizationApplied: string[];
  conversationContext: string;
}

export interface ConfidenceFactor {
  factor: string;
  weight: number;
  score: number;
  explanation: string;
}

export interface ConversationContinuation {
  suggestedQuestions: string[];
  contextForNext: any;
  conversationGoals: string[];
  completionStatus: number; // 0-100%
  nextPhaseRecommended?: string;
}

export interface ResponsePersonalization {
  userId: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert' | 'professional';
  communicationStyle: 'casual' | 'professional' | 'technical';
  responseFormat: 'conversational' | 'structured' | 'data_focused';
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  visualPreferences: VisualPreferences;
}

export interface VisualPreferences {
  preferredChartTypes: string[];
  colorScheme: 'vibrant' | 'professional' | 'minimal' | 'accessible';
  animationLevel: 'none' | 'subtle' | 'normal' | 'enhanced';
  densityPreference: 'compact' | 'comfortable' | 'spacious';
}

export interface NaturalLanguageTemplate {
  pattern: string;
  variables: string[];
  contextTypes: string[];
  personalizationFactors: string[];
  examples: string[];
}

/**
 * Advanced Intelligent Response Generator
 * Synthesizes natural language responses with visual components and actionable insights
 */
export class IntelligentResponseGenerator {
  private contextManager: ConversationContextManager;
  private responseTemplates: Map<string, NaturalLanguageTemplate[]> = new Map();
  private visualComponentGenerators: Map<string, Function> = new Map();
  private insightEngines: Map<string, Function> = new Map();

  constructor(contextManager: ConversationContextManager) {
    this.contextManager = contextManager;
    this.initializeResponseTemplates();
    this.initializeVisualGenerators();
    this.initializeInsightEngines();
    console.log('🧠 Intelligent Response Generator initialized');
  }

  /**
   * Generate comprehensive intelligent response
   */
  async generateResponse(
    query: string,
    analyticsResult: any,
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): Promise<IntelligentResponse> {
    try {
      console.log(`🎯 Generating intelligent response for: ${query.substring(0, 50)}...`);

      const startTime = Date.now();

      // Generate natural language response
      const naturalLanguageResponse = await this.generateNaturalLanguageResponse(
        query,
        analyticsResult,
        conversation,
        intent
      );

      // Generate visual components
      const visualComponents = await this.generateVisualComponents(
        analyticsResult,
        conversation,
        intent
      );

      // Extract actionable insights
      const actionableInsights = await this.extractActionableInsights(
        analyticsResult,
        conversation,
        intent
      );

      // Generate follow-up suggestions
      const followUpSuggestions = await this.contextManager.suggestFollowUps(
        analyticsResult,
        conversation
      );

      // Calculate overall confidence
      const confidence = this.calculateResponseConfidence(
        analyticsResult,
        conversation,
        intent
      );

      // Generate response metadata
      const responseMetadata = this.generateResponseMetadata(
        startTime,
        analyticsResult,
        conversation,
        intent
      );

      // Create conversation continuation
      const conversationContinuation = await this.createConversationContinuation(
        conversation,
        intent,
        analyticsResult
      );

      const response: IntelligentResponse = {
        naturalLanguageResponse,
        visualComponents,
        actionableInsights,
        followUpSuggestions,
        confidence,
        responseMetadata,
        conversationContinuation
      };

      console.log(`✅ Intelligent response generated: ${naturalLanguageResponse.length} chars, ${visualComponents.length} visuals, ${actionableInsights.length} insights`);
      return response;

    } catch (error) {
      console.error('❌ Response generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate natural language response with personalization
   */
  private async generateNaturalLanguageResponse(
    query: string,
    analyticsResult: any,
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): Promise<string> {
    try {
      console.log(`📝 Generating natural language response for ${intent.analyticsType}`);

      const personalization = this.extractPersonalization(conversation);
      const templates = this.getResponseTemplates(intent.analyticsType, conversation.currentTopic);
      
      // Select appropriate template based on context
      const selectedTemplate = this.selectTemplate(templates, conversation, analyticsResult);
      
      // Extract key data points for response
      const responseData = this.extractResponseData(analyticsResult, intent);
      
      // Generate base response
      let response = await this.generateFromTemplate(selectedTemplate, responseData, conversation);
      
      // Apply personalization
      response = this.personalizeResponse(response, personalization, responseData);
      
      // Add context-aware enhancements
      response = this.enhanceWithContext(response, conversation, analyticsResult);
      
      // Format for readability
      response = this.formatForReadability(response, personalization);

      console.log(`✅ Natural language response generated: ${response.length} characters`);
      return response;

    } catch (error) {
      console.error('❌ Natural language generation failed:', error);
      return this.generateFallbackResponse(query, analyticsResult, conversation);
    }
  }

  /**
   * Generate visual components based on analytics results
   */
  private async generateVisualComponents(
    analyticsResult: any,
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): Promise<VisualComponent[]> {
    try {
      console.log(`📊 Generating visual components for ${intent.analyticsType}`);

      const components: VisualComponent[] = [];
      const userPrefs = conversation.userProfile.visualPreferences || this.getDefaultVisualPreferences();

      // Generate components based on analytics type
      switch (intent.analyticsType) {
        case 'market_intelligence':
          components.push(...await this.generateMarketVisuals(analyticsResult, userPrefs));
          break;
        case 'investment_scoring':
          components.push(...await this.generateInvestmentVisuals(analyticsResult, userPrefs));
          break;
        case 'cma_automation':
          components.push(...await this.generateCMAVisuals(analyticsResult, userPrefs));
          break;
        case 'visualization':
          components.push(...await this.generateCustomVisuals(analyticsResult, userPrefs, intent));
          break;
        default:
          components.push(...await this.generateGeneralVisuals(analyticsResult, userPrefs));
      }

      // Sort by priority and limit to reasonable number
      components.sort((a, b) => b.priority - a.priority);
      const limitedComponents = components.slice(0, 6);

      console.log(`✅ Generated ${limitedComponents.length} visual components`);
      return limitedComponents;

    } catch (error) {
      console.error('❌ Visual component generation failed:', error);
      return [];
    }
  }

  /**
   * Extract actionable insights from analytics results
   */
  private async extractActionableInsights(
    analyticsResult: any,
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): Promise<ActionableInsight[]> {
    try {
      console.log(`💡 Extracting actionable insights from ${intent.analyticsType} analysis`);

      const insights: ActionableInsight[] = [];
      const userProfile = conversation.userProfile;

      // Extract insights based on analytics type
      switch (intent.analyticsType) {
        case 'investment_scoring':
          insights.push(...await this.extractInvestmentInsights(analyticsResult, userProfile));
          break;
        case 'market_intelligence':
          insights.push(...await this.extractMarketInsights(analyticsResult, userProfile));
          break;
        case 'cma_automation':
          insights.push(...await this.extractPropertyInsights(analyticsResult, userProfile));
          break;
        default:
          insights.push(...await this.extractGeneralInsights(analyticsResult, userProfile));
      }

      // Add conversation-aware insights
      insights.push(...await this.extractConversationInsights(conversation, analyticsResult));

      // Sort by priority and confidence
      insights.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      });

      // Limit to top insights
      const topInsights = insights.slice(0, 8);

      console.log(`✅ Extracted ${topInsights.length} actionable insights`);
      return topInsights;

    } catch (error) {
      console.error('❌ Insight extraction failed:', error);
      return [];
    }
  }

  // Template and personalization methods
  private initializeResponseTemplates(): void {
    // Investment Analysis Templates
    this.responseTemplates.set('investment_scoring', [
      {
        pattern: "Based on my analysis of {property}, this property scores {score}/100 for investment potential. {keyFactors}",
        variables: ['property', 'score', 'keyFactors'],
        contextTypes: ['property_analysis'],
        personalizationFactors: ['experience_level', 'communication_style'],
        examples: ['Based on my analysis of 123 Main St, this property scores 85/100 for investment potential. The strong rental demand and appreciation trends are key factors.']
      },
      {
        pattern: "Looking at the investment metrics for {property}, I found {positiveAspects}. However, {concerns}. Overall, {recommendation}.",
        variables: ['property', 'positiveAspects', 'concerns', 'recommendation'],
        contextTypes: ['investment_analysis'],
        personalizationFactors: ['risk_tolerance', 'experience_level'],
        examples: ['Looking at the investment metrics for 456 Oak Ave, I found strong cash flow potential and good location fundamentals. However, the property needs some maintenance work. Overall, this could be a solid long-term investment.']
      }
    ]);

    // Market Intelligence Templates
    this.responseTemplates.set('market_intelligence', [
      {
        pattern: "The {location} market is currently {trend}. {trendDetails} {timing}",
        variables: ['location', 'trend', 'trendDetails', 'timing'],
        contextTypes: ['market_analysis'],
        personalizationFactors: ['detail_level', 'investment_goals'],
        examples: ['The Seattle market is currently showing strong buyer activity. Inventory is down 15% year-over-year while demand remains high. This suggests continued price appreciation in the near term.']
      }
    ]);

    // CMA Templates
    this.responseTemplates.set('cma_automation', [
      {
        pattern: "The comparative market analysis for {property} suggests a value range of {valueRange}. {comparableDetails} {marketPosition}",
        variables: ['property', 'valueRange', 'comparableDetails', 'marketPosition'],
        contextTypes: ['property_valuation'],
        personalizationFactors: ['detail_level', 'communication_style'],
        examples: ['The comparative market analysis for 789 Pine St suggests a value range of $450,000 - $480,000. Three recent sales within 0.3 miles support this range. The property is positioned competitively in the current market.']
      }
    ]);

    console.log(`📝 Initialized ${this.responseTemplates.size} template categories`);
  }

  private initializeVisualGenerators(): void {
    // Market Intelligence Visuals
    this.visualComponentGenerators.set('market_trends', (data: any, prefs: VisualPreferences) => ({
      type: 'chart',
      title: 'Market Trends',
      description: 'Price and inventory trends over time',
      data: data.trendData,
      configuration: {
        theme: prefs.colorScheme === 'professional' ? 'light' : 'auto',
        responsive: true,
        exportable: true,
        realTimeUpdates: false
      },
      priority: 9,
      interactive: true
    }));

    // Investment Scoring Visuals
    this.visualComponentGenerators.set('investment_scorecard', (data: any, prefs: VisualPreferences) => ({
      type: 'card',
      title: 'Investment Scorecard',
      description: 'Comprehensive investment analysis summary',
      data: data.investmentMetrics,
      configuration: {
        theme: prefs.colorScheme === 'minimal' ? 'light' : 'auto',
        responsive: true,
        exportable: true,
        realTimeUpdates: false
      },
      priority: 10,
      interactive: false
    }));

    console.log(`📊 Initialized ${this.visualComponentGenerators.size} visual generators`);
  }

  private initializeInsightEngines(): void {
    // Investment Insight Engine
    this.insightEngines.set('investment', (data: any, userProfile: any) => {
      const insights: ActionableInsight[] = [];

      if (data.cashFlow > 0) {
        insights.push({
          insight: `This property generates positive cash flow of $${data.cashFlow}/month`,
          actionType: 'immediate',
          priority: 'high',
          category: 'financial',
          reasoning: 'Positive cash flow provides immediate income and reduces investment risk',
          estimatedImpact: `$${data.cashFlow * 12} annual income`,
          timeframe: 'Immediate',
          nextSteps: ['Verify rent estimates', 'Analyze operating expenses', 'Calculate net ROI'],
          confidence: 0.85
        });
      }

      if (data.appreciationRate > 0.05) {
        insights.push({
          insight: `Strong appreciation potential with ${(data.appreciationRate * 100).toFixed(1)}% annual growth expected`,
          actionType: 'recommended',
          priority: 'high',
          category: 'market',
          reasoning: 'Above-average appreciation builds long-term wealth',
          estimatedImpact: `${(data.appreciationRate * 100).toFixed(1)}% annual value increase`,
          timeframe: '1-5 years',
          nextSteps: ['Monitor market indicators', 'Consider holding strategy', 'Plan exit timing'],
          confidence: 0.75
        });
      }

      return insights;
    });

    console.log(`💡 Initialized ${this.insightEngines.size} insight engines`);
  }

  // Helper methods for response generation
  private getResponseTemplates(analyticsType: string, topic: string): NaturalLanguageTemplate[] {
    return this.responseTemplates.get(analyticsType) || this.responseTemplates.get('default') || [];
  }

  private selectTemplate(
    templates: NaturalLanguageTemplate[],
    conversation: ConversationState,
    analyticsResult: any
  ): NaturalLanguageTemplate {
    // Simple selection - use first template that matches context
    const matchingTemplate = templates.find(template => 
      template.contextTypes.includes(conversation.currentTopic)
    );

    return matchingTemplate || templates[0] || this.getDefaultTemplate();
  }

  private getDefaultTemplate(): NaturalLanguageTemplate {
    return {
      pattern: "Based on the analysis, {summary}. {details}",
      variables: ['summary', 'details'],
      contextTypes: ['general'],
      personalizationFactors: [],
      examples: []
    };
  }

  private extractResponseData(analyticsResult: any, intent: AnalyticsIntent): any {
    return {
      property: intent.parameters.address || 'the property',
      location: intent.parameters.location || 'the area',
      score: analyticsResult.score || analyticsResult.overallScore || 'N/A',
      summary: analyticsResult.summary || 'Analysis completed successfully',
      details: analyticsResult.details || analyticsResult.keyFindings || '',
      keyFactors: this.extractKeyFactors(analyticsResult),
      trend: analyticsResult.trend || 'stable',
      valueRange: analyticsResult.valueRange || analyticsResult.estimatedValue || 'To be determined'
    };
  }

  private extractKeyFactors(analyticsResult: any): string {
    const factors = [];
    
    if (analyticsResult.cashFlow > 0) factors.push('positive cash flow');
    if (analyticsResult.appreciationRate > 0.05) factors.push('strong appreciation potential');
    if (analyticsResult.locationScore > 8) factors.push('excellent location');
    if (analyticsResult.marketDemand === 'high') factors.push('high market demand');

    return factors.length > 0 ? factors.join(', ') : 'multiple market factors';
  }

  private async generateFromTemplate(
    template: NaturalLanguageTemplate,
    data: any,
    conversation: ConversationState
  ): Promise<string> {
    let response = template.pattern;

    // Replace variables with actual data
    template.variables.forEach(variable => {
      const placeholder = `{${variable}}`;
      const value = data[variable] || `[${variable}]`;
      response = response.replace(new RegExp(placeholder, 'g'), value);
    });

    return response;
  }

  private personalizeResponse(
    response: string,
    personalization: ResponsePersonalization,
    data: any
  ): string {
    // Adjust complexity based on experience level
    if (personalization.experienceLevel === 'beginner') {
      response = this.simplifyLanguage(response);
    } else if (personalization.experienceLevel === 'expert') {
      response = this.addTechnicalDetails(response, data);
    }

    // Adjust tone based on communication style
    if (personalization.communicationStyle === 'casual') {
      response = this.casualizeTone(response);
    } else if (personalization.communicationStyle === 'technical') {
      response = this.addTechnicalLanguage(response);
    }

    return response;
  }

  private enhanceWithContext(
    response: string,
    conversation: ConversationState,
    analyticsResult: any
  ): string {
    // Add context-aware references
    if (conversation.activeReferences.properties.length > 0) {
      const recentProperty = conversation.activeReferences.properties[0];
      if (!response.includes(recentProperty.address)) {
        response += ` This analysis builds on our previous discussion about ${recentProperty.address}.`;
      }
    }

    // Add conversation flow awareness
    if (conversation.conversationFlow.currentPhase === 'analysis') {
      response += ' Let me know if you\'d like me to dive deeper into any specific aspect.';
    }

    return response;
  }

  private formatForReadability(response: string, personalization: ResponsePersonalization): string {
    if (personalization.responseFormat === 'structured') {
      return this.addStructuredFormatting(response);
    }
    
    return response;
  }

  private extractPersonalization(conversation: ConversationState): ResponsePersonalization {
    const profile = conversation.userProfile;
    
    return {
      userId: profile.userId,
      experienceLevel: profile.experienceLevel,
      communicationStyle: profile.communicationStyle,
      responseFormat: profile.responseFormat,
      detailLevel: profile.preferredDetailLevel,
      visualPreferences: profile.visualPreferences || this.getDefaultVisualPreferences()
    };
  }

  private getDefaultVisualPreferences(): VisualPreferences {
    return {
      preferredChartTypes: ['line', 'bar', 'pie'],
      colorScheme: 'professional',
      animationLevel: 'subtle',
      densityPreference: 'comfortable'
    };
  }

  // Visual component generation methods
  private async generateMarketVisuals(data: any, prefs: VisualPreferences): Promise<VisualComponent[]> {
    const components: VisualComponent[] = [];

    if (data.trendData) {
      const trendGenerator = this.visualComponentGenerators.get('market_trends');
      if (trendGenerator) {
        components.push(trendGenerator(data, prefs));
      }
    }

    return components;
  }

  private async generateInvestmentVisuals(data: any, prefs: VisualPreferences): Promise<VisualComponent[]> {
    const components: VisualComponent[] = [];

    if (data.investmentMetrics) {
      const scorecardGenerator = this.visualComponentGenerators.get('investment_scorecard');
      if (scorecardGenerator) {
        components.push(scorecardGenerator(data, prefs));
      }
    }

    return components;
  }

  private async generateCMAVisuals(data: any, prefs: VisualPreferences): Promise<VisualComponent[]> {
    const components: VisualComponent[] = [];

    if (data.comparables) {
      components.push({
        type: 'table',
        title: 'Comparable Sales',
        description: 'Recent sales used in valuation analysis',
        data: data.comparables,
        configuration: {
          theme: prefs.colorScheme === 'minimal' ? 'light' : 'auto',
          responsive: true,
          exportable: true,
          realTimeUpdates: false
        },
        priority: 8,
        interactive: true
      });
    }

    return components;
  }

  private async generateCustomVisuals(data: any, prefs: VisualPreferences, intent: AnalyticsIntent): Promise<VisualComponent[]> {
    // Generate visuals based on specific visualization request
    return [];
  }

  private async generateGeneralVisuals(data: any, prefs: VisualPreferences): Promise<VisualComponent[]> {
    // Generate basic visuals for general analytics
    return [];
  }

  // Insight extraction methods
  private async extractInvestmentInsights(data: any, userProfile: any): Promise<ActionableInsight[]> {
    const engine = this.insightEngines.get('investment');
    return engine ? engine(data, userProfile) : [];
  }

  private async extractMarketInsights(data: any, userProfile: any): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    if (data.marketTrend === 'rising') {
      insights.push({
        insight: 'Market is trending upward - good time for buyers to act quickly',
        actionType: 'immediate',
        priority: 'high',
        category: 'timing',
        reasoning: 'Rising markets often lead to increased competition and prices',
        estimatedImpact: 'Could save thousands by acting soon',
        timeframe: 'Next 30-60 days',
        nextSteps: ['Schedule property viewings', 'Get pre-approved for financing', 'Submit competitive offers'],
        confidence: 0.8
      });
    }

    return insights;
  }

  private async extractPropertyInsights(data: any, userProfile: any): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    if (data.daysOnMarket < 30) {
      insights.push({
        insight: 'Property is relatively new to market - opportunity for negotiation',
        actionType: 'recommended',
        priority: 'medium',
        category: 'opportunity',
        reasoning: 'Newer listings may have more flexible sellers',
        estimatedImpact: 'Potential 3-5% savings on purchase price',
        timeframe: 'Within 2 weeks',
        nextSteps: ['Research seller motivation', 'Prepare competitive offer', 'Include inspection contingencies'],
        confidence: 0.7
      });
    }

    return insights;
  }

  private async extractGeneralInsights(data: any, userProfile: any): Promise<ActionableInsight[]> {
    // Extract general insights applicable to any analysis
    return [];
  }

  private async extractConversationInsights(conversation: ConversationState, data: any): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // Add insights based on conversation context
    if (conversation.conversationFlow.currentPhase === 'analysis' && 
        conversation.contextStack.length > 2) {
      insights.push({
        insight: 'You\'ve analyzed multiple properties - consider creating a comparison report',
        actionType: 'recommended',
        priority: 'medium',
        category: 'opportunity',
        reasoning: 'Comparing multiple properties helps identify the best opportunity',
        estimatedImpact: 'Better investment decision',
        timeframe: 'Next session',
        nextSteps: ['Generate comparison report', 'Rank properties by criteria', 'Schedule follow-up analysis'],
        confidence: 0.8
      });
    }

    return insights;
  }

  // Utility methods
  private calculateResponseConfidence(
    analyticsResult: any,
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on data quality
    if (analyticsResult.dataQuality === 'high') confidence += 0.1;
    if (analyticsResult.dataQuality === 'low') confidence -= 0.2;

    // Adjust based on conversation context
    if (conversation.contextStack.length > 3) confidence += 0.05; // More context
    if (conversation.pendingClarifications.length > 0) confidence -= 0.1; // Unresolved issues

    // Adjust based on intent specificity
    if (intent.confidence > 0.9) confidence += 0.05;
    if (intent.confidence < 0.7) confidence -= 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateResponseMetadata(
    startTime: number,
    analyticsResult: any,
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): ResponseMetadata {
    return {
      generatedAt: new Date(),
      processingTime: Date.now() - startTime,
      dataSourcesUsed: analyticsResult.dataSources || ['default'],
      analyticsEnginesInvolved: [intent.analyticsType],
      confidenceFactors: [
        {
          factor: 'Data Quality',
          weight: 0.3,
          score: analyticsResult.dataQuality === 'high' ? 0.9 : 0.7,
          explanation: 'Quality of underlying data used in analysis'
        },
        {
          factor: 'Context Completeness',
          weight: 0.2,
          score: conversation.contextStack.length > 2 ? 0.8 : 0.6,
          explanation: 'Amount of conversation context available'
        }
      ],
      personalizationApplied: [
        conversation.userProfile.experienceLevel,
        conversation.userProfile.communicationStyle
      ],
      conversationContext: conversation.currentTopic
    };
  }

  private async createConversationContinuation(
    conversation: ConversationState,
    intent: AnalyticsIntent,
    analyticsResult: any
  ): Promise<ConversationContinuation> {
    return {
      suggestedQuestions: await this.contextManager.suggestFollowUps(analyticsResult, conversation),
      contextForNext: {
        lastAnalysis: analyticsResult,
        lastIntent: intent,
        activeReferences: conversation.activeReferences
      },
      conversationGoals: this.identifyConversationGoals(conversation),
      completionStatus: this.calculateCompletionStatus(conversation),
      nextPhaseRecommended: this.recommendNextPhase(conversation)
    };
  }

  private identifyConversationGoals(conversation: ConversationState): string[] {
    const goals = [];
    
    switch (conversation.conversationFlow.currentPhase) {
      case 'discovery':
        goals.push('Identify property preferences', 'Understand investment goals');
        break;
      case 'analysis':
        goals.push('Complete property analysis', 'Provide actionable insights');
        break;
      case 'recommendation':
        goals.push('Deliver recommendations', 'Plan next steps');
        break;
    }

    return goals;
  }

  private calculateCompletionStatus(conversation: ConversationState): number {
    return conversation.conversationFlow.completionPercentage;
  }

  private recommendNextPhase(conversation: ConversationState): string | undefined {
    const flow = conversation.conversationFlow;
    
    if (flow.completionPercentage > 80) {
      return 'action';
    } else if (flow.currentPhase === 'analysis' && flow.completionPercentage > 60) {
      return 'recommendation';
    }
    
    return undefined;
  }

  private generateFallbackResponse(query: string, analyticsResult: any, conversation: ConversationState): string {
    return `I've completed the analysis you requested. The results show ${JSON.stringify(analyticsResult).substring(0, 100)}... Let me know if you'd like me to explain any specific aspect in more detail.`;
  }

  // Language adjustment methods
  private simplifyLanguage(response: string): string {
    return response
      .replace(/utilize/g, 'use')
      .replace(/comprehensive/g, 'complete')
      .replace(/methodology/g, 'method')
      .replace(/optimize/g, 'improve');
  }

  private addTechnicalDetails(response: string, data: any): string {
    if (data.technicalMetrics) {
      response += ` Technical metrics include: ${Object.keys(data.technicalMetrics).join(', ')}.`;
    }
    return response;
  }

  private casualizeTone(response: string): string {
    return response
      .replace(/I have analyzed/g, 'I looked at')
      .replace(/based on my analysis/g, 'from what I can see')
      .replace(/I recommend/g, 'I think you should');
  }

  private addTechnicalLanguage(response: string): string {
    return response
      .replace(/good/g, 'optimal')
      .replace(/bad/g, 'suboptimal')
      .replace(/show/g, 'indicate');
  }

  private addStructuredFormatting(response: string): string {
    // Add bullet points and structure for better readability
    return response.replace(/\. ([A-Z])/g, '.\n\n• $1');
  }
}

export default IntelligentResponseGenerator;

/**
 * Conversational Context Manager for TerraAgent AI
 * Day 6 Phase 2: Multi-turn conversation management and context resolution
 */

import { AnalyticsIntent, QueryParameters, EntityExtractions } from '../nlp/nlp-engine';

// Conversation Types
export interface ConversationState {
  userId: string;
  sessionId: string;
  currentTopic: string;
  conversationPhase: ConversationPhase;
  contextStack: ContextFrame[];
  userProfile: UserProfile;
  activeReferences: ReferenceMap;
  conversationFlow: FlowState;
  pendingClarifications: Clarification[];
  lastAnalyticsResult?: any;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ConversationPhase {
  name: 'greeting' | 'discovery' | 'analysis' | 'recommendation' | 'action' | 'follow_up';
  step: number;
  completionPercentage: number;
  expectedNextActions: string[];
  canProgress: boolean;
}

export interface ContextFrame {
  frameId: string;
  topic: string;
  intent: AnalyticsIntent;
  entities: EntityExtractions;
  parameters: QueryParameters;
  results?: any;
  timestamp: Date;
  resolved: boolean;
  importance: 'high' | 'medium' | 'low';
  expiresAt?: Date;
}

export interface UserProfile {
  userId: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert' | 'professional';
  preferredDetailLevel: 'summary' | 'detailed' | 'comprehensive';
  communicationStyle: 'casual' | 'professional' | 'technical';
  responseFormat: 'conversational' | 'structured' | 'data_focused';
  investmentProfile?: InvestmentProfile;
  searchPreferences?: SearchPreferences;
  locationHistory: string[];
  priceRangeHistory: Array<{ min?: number; max?: number; timestamp: Date }>;
  frequentQueries: string[];
  lastActiveLocation?: string;
  lastActiveProperty?: string;
}

export interface InvestmentProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  preferredPropertyTypes: string[];
  budgetRange: { min: number; max: number };
  timeHorizon: 'short_term' | 'medium_term' | 'long_term';
  cashFlowImportance: number; // 1-10 scale
  appreciationImportance: number; // 1-10 scale
}

export interface SearchPreferences {
  defaultLocation?: string;
  preferredPropertyTypes: string[];
  typicalPriceRange?: { min: number; max: number };
  bedroomPreference?: { min?: number; max?: number };
  bathroomPreference?: { min?: number; max?: number };
  sqftPreference?: { min?: number; max?: number };
  amenityPreferences: string[];
}

export interface ReferenceMap {
  properties: PropertyReference[];
  locations: LocationReference[];
  analyses: AnalysisReference[];
  reports: ReportReference[];
  comparisons: ComparisonReference[];
}

export interface PropertyReference {
  id: string;
  address: string;
  aliases: string[];
  lastMentioned: Date;
  contextFrameId: string;
  importance: number;
  analyticsSummary?: any;
}

export interface LocationReference {
  id: string;
  name: string;
  type: 'neighborhood' | 'city' | 'county' | 'state' | 'region';
  aliases: string[];
  lastMentioned: Date;
  contextFrameId: string;
  importance: number;
}

export interface AnalysisReference {
  id: string;
  type: string;
  subject: string;
  results: any;
  timestamp: Date;
  contextFrameId: string;
  accessible: boolean;
}

export interface ReportReference {
  id: string;
  title: string;
  type: string;
  subject: string;
  timestamp: Date;
  accessible: boolean;
  downloadUrl?: string;
}

export interface ComparisonReference {
  id: string;
  subjects: string[];
  type: string;
  results: any;
  timestamp: Date;
  contextFrameId: string;
}

export interface FlowState {
  currentPhase: ConversationPhase['name'];
  stepInPhase: number;
  totalSteps: number;
  completionPercentage: number;
  nextExpectedInputs: string[];
  canSkipToPhase?: ConversationPhase['name'];
  blockedReasons?: string[];
}

export interface Clarification {
  id: string;
  question: string;
  type: 'missing_parameter' | 'ambiguous_reference' | 'confirmation' | 'preference';
  priority: 'high' | 'medium' | 'low';
  context: string;
  suggestedAnswers?: string[];
  timeout?: Date;
}

export interface ResolvedQuery {
  originalQuery: string;
  resolvedParameters: QueryParameters;
  resolvedReferences: ResolvedReference[];
  confidence: number;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

export interface ResolvedReference {
  originalText: string;
  resolvedTo: string;
  type: 'property' | 'location' | 'analysis' | 'comparison';
  confidence: number;
  contextSource: string;
}

/**
 * Advanced Conversational Context Manager
 * Maintains conversation state and resolves references across multi-turn interactions
 */
export class ConversationContextManager {
  private activeConversations: Map<string, ConversationState> = new Map();
  private globalUserProfiles: Map<string, UserProfile> = new Map();
  private referenceDatabase: Map<string, any> = new Map();
  private conversationMemory: Map<string, ContextFrame[]> = new Map();

  constructor() {
    console.log('💭 Conversation Context Manager initialized');
  }

  /**
   * Track and update conversation context
   */
  async trackContext(
    userId: string,
    query: string,
    intent: AnalyticsIntent,
    entities: EntityExtractions,
    sessionId?: string
  ): Promise<ConversationState> {
    try {
      console.log(`🔄 Tracking context for user ${userId}: ${query.substring(0, 50)}...`);

      const conversationKey = `${userId}_${sessionId || 'default'}`;
      let conversation = this.activeConversations.get(conversationKey);

      if (!conversation) {
        conversation = await this.createNewConversation(userId, sessionId);
      }

      // Create new context frame
      const contextFrame = await this.createContextFrame(query, intent, entities);

      // Update conversation state
      conversation.contextStack.push(contextFrame);
      conversation.currentTopic = this.determineTopic(intent, entities);
      conversation.lastUpdated = new Date();

      // Update conversation flow
      await this.updateConversationFlow(conversation, intent);

      // Update user profile
      await this.updateUserProfile(conversation, intent, entities);

      // Update active references
      await this.updateActiveReferences(conversation, entities, contextFrame);

      // Store updated conversation
      this.activeConversations.set(conversationKey, conversation);

      // Store in memory for future reference
      this.storeConversationMemory(userId, contextFrame);

      console.log(
        `✅ Context tracked: Topic=${conversation.currentTopic}, Phase=${conversation.conversationFlow.currentPhase}`
      );
      return conversation;
    } catch (error) {
      console.error('❌ Context tracking failed:', error);
      throw error;
    }
  }

  /**
   * Resolve references in queries using conversation context
   */
  async resolveReferences(query: string, context: ConversationState): Promise<ResolvedQuery> {
    try {
      console.log(`🔍 Resolving references in query: "${query}"`);

      const resolvedQuery: ResolvedQuery = {
        originalQuery: query,
        resolvedParameters: {},
        resolvedReferences: [],
        confidence: 1.0,
        requiresConfirmation: false,
      };

      // Detect and resolve pronouns and demonstratives
      resolvedQuery.resolvedReferences.push(
        ...(await this.resolvePronounalReferences(query, context))
      );

      // Resolve contextual references
      resolvedQuery.resolvedReferences.push(
        ...(await this.resolveContextualReferences(query, context))
      );

      // Resolve implicit references
      resolvedQuery.resolvedReferences.push(
        ...(await this.resolveImplicitReferences(query, context))
      );

      // Build resolved parameters
      resolvedQuery.resolvedParameters = await this.buildResolvedParameters(
        query,
        context,
        resolvedQuery.resolvedReferences
      );

      // Calculate overall confidence
      resolvedQuery.confidence = this.calculateResolutionConfidence(
        resolvedQuery.resolvedReferences
      );

      // Determine if confirmation needed
      if (
        resolvedQuery.confidence < 0.8 ||
        resolvedQuery.resolvedReferences.some(ref => ref.confidence < 0.7)
      ) {
        resolvedQuery.requiresConfirmation = true;
        resolvedQuery.confirmationMessage = this.generateConfirmationMessage(resolvedQuery);
      }

      console.log(
        `✅ References resolved: ${resolvedQuery.resolvedReferences.length} refs, confidence: ${resolvedQuery.confidence}`
      );
      return resolvedQuery;
    } catch (error) {
      console.error('❌ Reference resolution failed:', error);
      throw error;
    }
  }

  /**
   * Suggest relevant follow-up questions based on context
   */
  async suggestFollowUps(analytics: any, context: ConversationState): Promise<string[]> {
    try {
      console.log(`💡 Generating follow-up suggestions for topic: ${context.currentTopic}`);

      const suggestions: string[] = [];

      // Topic-specific follow-ups
      switch (context.currentTopic) {
        case 'property_analysis':
          suggestions.push(...this.getPropertyAnalysisFollowUps(analytics, context));
          break;
        case 'investment_analysis':
          suggestions.push(...this.getInvestmentAnalysisFollowUps(analytics, context));
          break;
        case 'market_analysis':
          suggestions.push(...this.getMarketAnalysisFollowUps(analytics, context));
          break;
        case 'comparison':
          suggestions.push(...this.getComparisonFollowUps(analytics, context));
          break;
        default:
          suggestions.push(...this.getGeneralFollowUps(analytics, context));
      }

      // Add personalized suggestions based on user profile
      suggestions.push(...this.getPersonalizedSuggestions(analytics, context));

      // Add flow-based suggestions
      suggestions.push(...this.getFlowBasedSuggestions(context));

      // Remove duplicates and limit to top 5
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

      console.log(`✅ Generated ${uniqueSuggestions.length} follow-up suggestions`);
      return uniqueSuggestions;
    } catch (error) {
      console.error('❌ Follow-up suggestion failed:', error);
      return [];
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<ContextFrame[]> {
    const history = this.conversationMemory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Clear conversation context (privacy/GDPR compliance)
   */
  async clearConversationContext(userId: string, sessionId?: string): Promise<void> {
    const conversationKey = sessionId ? `${userId}_${sessionId}` : userId;

    if (sessionId) {
      this.activeConversations.delete(`${userId}_${sessionId}`);
    } else {
      // Clear all conversations for user
      for (const [key] of this.activeConversations) {
        if (key.startsWith(`${userId}_`)) {
          this.activeConversations.delete(key);
        }
      }
      this.conversationMemory.delete(userId);
      this.globalUserProfiles.delete(userId);
    }

    console.log(`🗑️ Cleared conversation context for user ${userId}`);
  }

  // Private helper methods
  private async createNewConversation(
    userId: string,
    sessionId?: string
  ): Promise<ConversationState> {
    const userProfile =
      this.globalUserProfiles.get(userId) || (await this.createDefaultUserProfile(userId));

    return {
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      currentTopic: 'greeting',
      conversationPhase: {
        name: 'greeting',
        step: 1,
        completionPercentage: 0,
        expectedNextActions: ['introduce_services', 'ask_preferences'],
        canProgress: true,
      },
      contextStack: [],
      userProfile,
      activeReferences: {
        properties: [],
        locations: [],
        analyses: [],
        reports: [],
        comparisons: [],
      },
      conversationFlow: {
        currentPhase: 'greeting',
        stepInPhase: 1,
        totalSteps: 5,
        completionPercentage: 0,
        nextExpectedInputs: ['location_preference', 'property_interest', 'investment_goals'],
      },
      pendingClarifications: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  }

  private async createDefaultUserProfile(userId: string): Promise<UserProfile> {
    const profile: UserProfile = {
      userId,
      experienceLevel: 'intermediate',
      preferredDetailLevel: 'detailed',
      communicationStyle: 'professional',
      responseFormat: 'conversational',
      locationHistory: [],
      priceRangeHistory: [],
      frequentQueries: [],
    };

    this.globalUserProfiles.set(userId, profile);
    return profile;
  }

  private async createContextFrame(
    query: string,
    intent: AnalyticsIntent,
    entities: EntityExtractions
  ): Promise<ContextFrame> {
    return {
      frameId: `frame_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      topic: this.determineTopic(intent, entities),
      intent,
      entities,
      parameters: intent.parameters,
      timestamp: new Date(),
      resolved: false,
      importance: this.calculateFrameImportance(intent, entities),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  private determineTopic(intent: AnalyticsIntent, entities: EntityExtractions): string {
    if (intent.analyticsType === 'investment_scoring') return 'investment_analysis';
    if (intent.analyticsType === 'cma_automation') return 'property_valuation';
    if (intent.analyticsType === 'market_intelligence') return 'market_analysis';
    if (intent.analyticsType === 'visualization') return 'data_visualization';
    if (entities.comparatives.length > 0) return 'comparison';
    if (entities.addresses.length > 0) return 'property_analysis';
    if (entities.locations.length > 0) return 'location_analysis';
    return 'general_inquiry';
  }

  private calculateFrameImportance(
    intent: AnalyticsIntent,
    entities: EntityExtractions
  ): ContextFrame['importance'] {
    let score = 0;

    // High importance for specific analytics
    if (intent.analyticsType !== 'general') score += 3;

    // High importance for addresses
    if (entities.addresses.length > 0) score += 3;

    // Medium importance for locations
    if (entities.locations.length > 0) score += 2;

    // Medium importance for prices
    if (entities.priceAmounts.length > 0) score += 2;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private async updateConversationFlow(
    conversation: ConversationState,
    intent: AnalyticsIntent
  ): Promise<void> {
    const flow = conversation.conversationFlow;

    // Simple state progression
    switch (flow.currentPhase) {
      case 'greeting':
        if (intent.analyticsType !== 'general') {
          flow.currentPhase = 'analysis';
          flow.stepInPhase = 1;
          flow.completionPercentage = 40;
        }
        break;
      case 'discovery':
        if (intent.parameters.address || intent.parameters.location) {
          flow.currentPhase = 'analysis';
          flow.stepInPhase = 1;
          flow.completionPercentage = 60;
        }
        break;
      case 'analysis':
        flow.stepInPhase += 1;
        flow.completionPercentage = Math.min(flow.completionPercentage + 20, 80);
        break;
    }

    // Update expected next inputs
    flow.nextExpectedInputs = this.getExpectedInputs(flow.currentPhase, intent);
  }

  private getExpectedInputs(phase: ConversationPhase['name'], intent: AnalyticsIntent): string[] {
    switch (phase) {
      case 'greeting':
        return ['location_preference', 'property_type', 'budget_range'];
      case 'discovery':
        return ['specific_address', 'neighborhood', 'criteria'];
      case 'analysis':
        return ['follow_up_questions', 'additional_analysis', 'comparison_request'];
      case 'recommendation':
        return ['feedback', 'next_steps', 'report_request'];
      default:
        return ['any_question'];
    }
  }

  private async updateUserProfile(
    conversation: ConversationState,
    intent: AnalyticsIntent,
    entities: EntityExtractions
  ): Promise<void> {
    const profile = conversation.userProfile;

    // Update location history
    entities.locations.forEach(location => {
      if (!profile.locationHistory.includes(location.normalized)) {
        profile.locationHistory.push(location.normalized);
        profile.lastActiveLocation = location.normalized;
      }
    });

    // Update price range history
    if (intent.parameters.priceRange) {
      profile.priceRangeHistory.push({
        ...intent.parameters.priceRange,
        timestamp: new Date(),
      });
    }

    // Update frequent queries
    const queryType = `${intent.primaryAction}_${intent.analyticsType}`;
    profile.frequentQueries.push(queryType);

    // Update investment profile if relevant
    if (intent.analyticsType === 'investment_scoring' && intent.parameters.investmentCriteria) {
      if (!profile.investmentProfile) {
        profile.investmentProfile = {
          riskTolerance: 'moderate',
          investmentGoals: [],
          preferredPropertyTypes: [],
          budgetRange: { min: 0, max: 2000000 },
          timeHorizon: 'medium_term',
          cashFlowImportance: 5,
          appreciationImportance: 5,
        };
      }

      // Update based on criteria
      const criteria = intent.parameters.investmentCriteria;
      if (criteria.maxRisk) {
        profile.investmentProfile.riskTolerance = criteria.maxRisk;
      }
    }
  }

  private async updateActiveReferences(
    conversation: ConversationState,
    entities: EntityExtractions,
    contextFrame: ContextFrame
  ): Promise<void> {
    const refs = conversation.activeReferences;

    // Add property references
    entities.addresses.forEach((address, index) => {
      const existing = refs.properties.find(p => p.address === address.normalized);
      if (existing) {
        existing.lastMentioned = new Date();
        existing.importance += 1;
      } else {
        refs.properties.push({
          id: `prop_${Date.now()}_${index}`,
          address: address.normalized,
          aliases: [address.text],
          lastMentioned: new Date(),
          contextFrameId: contextFrame.frameId,
          importance: 1,
        });
      }
    });

    // Add location references
    entities.locations.forEach((location, index) => {
      const existing = refs.locations.find(l => l.name === location.normalized);
      if (existing) {
        existing.lastMentioned = new Date();
        existing.importance += 1;
      } else {
        refs.locations.push({
          id: `loc_${Date.now()}_${index}`,
          name: location.normalized,
          type: location.type,
          aliases: [location.text],
          lastMentioned: new Date(),
          contextFrameId: contextFrame.frameId,
          importance: 1,
        });
      }
    });

    // Cleanup old references (older than 1 hour)
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    refs.properties = refs.properties.filter(p => p.lastMentioned > cutoff);
    refs.locations = refs.locations.filter(l => l.lastMentioned > cutoff);
  }

  private storeConversationMemory(userId: string, contextFrame: ContextFrame): void {
    const memory = this.conversationMemory.get(userId) || [];
    memory.push(contextFrame);

    // Keep only last 50 frames
    if (memory.length > 50) {
      memory.splice(0, memory.length - 50);
    }

    this.conversationMemory.set(userId, memory);
  }

  private async resolvePronounalReferences(
    query: string,
    context: ConversationState
  ): Promise<ResolvedReference[]> {
    const references: ResolvedReference[] = [];
    const pronouns = ['it', 'this', 'that', 'these', 'those', 'here', 'there'];

    for (const pronoun of pronouns) {
      if (query.toLowerCase().includes(pronoun)) {
        const resolved = this.findMostRecentReference(context, pronoun);
        if (resolved) {
          references.push({
            originalText: pronoun,
            resolvedTo: resolved.value,
            type: resolved.type,
            confidence: resolved.confidence,
            contextSource: resolved.source,
          });
        }
      }
    }

    return references;
  }

  private async resolveContextualReferences(
    query: string,
    context: ConversationState
  ): Promise<ResolvedReference[]> {
    const references: ResolvedReference[] = [];

    // Check for references to "the property", "the area", etc.
    if (query.includes('the property') && context.activeReferences.properties.length > 0) {
      const mostRecent = context.activeReferences.properties[0];
      references.push({
        originalText: 'the property',
        resolvedTo: mostRecent.address,
        type: 'property',
        confidence: 0.9,
        contextSource: 'recent_mention',
      });
    }

    if (query.includes('the area') && context.activeReferences.locations.length > 0) {
      const mostRecent = context.activeReferences.locations[0];
      references.push({
        originalText: 'the area',
        resolvedTo: mostRecent.name,
        type: 'location',
        confidence: 0.9,
        contextSource: 'recent_mention',
      });
    }

    return references;
  }

  private async resolveImplicitReferences(
    query: string,
    context: ConversationState
  ): Promise<ResolvedReference[]> {
    const references: ResolvedReference[] = [];

    // If no location specified but user has active location preference
    if (
      !query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*[,\s]+[A-Z]{2}\b/) &&
      context.userProfile.lastActiveLocation
    ) {
      references.push({
        originalText: '[implicit location]',
        resolvedTo: context.userProfile.lastActiveLocation,
        type: 'location',
        confidence: 0.7,
        contextSource: 'user_preference',
      });
    }

    return references;
  }

  private findMostRecentReference(context: ConversationState, pronoun: string): any {
    // Simple heuristic - return most recent property or location
    const recentProperty = context.activeReferences.properties.sort(
      (a, b) => b.lastMentioned.getTime() - a.lastMentioned.getTime()
    )[0];

    if (recentProperty) {
      return {
        value: recentProperty.address,
        type: 'property',
        confidence: 0.8,
        source: 'recent_property',
      };
    }

    const recentLocation = context.activeReferences.locations.sort(
      (a, b) => b.lastMentioned.getTime() - a.lastMentioned.getTime()
    )[0];

    if (recentLocation) {
      return {
        value: recentLocation.name,
        type: 'location',
        confidence: 0.8,
        source: 'recent_location',
      };
    }

    return null;
  }

  private async buildResolvedParameters(
    query: string,
    context: ConversationState,
    references: ResolvedReference[]
  ): Promise<QueryParameters> {
    const parameters: QueryParameters = {};

    // Apply resolved references
    references.forEach(ref => {
      switch (ref.type) {
        case 'property':
          parameters.address = ref.resolvedTo;
          break;
        case 'location':
          parameters.location = ref.resolvedTo;
          break;
      }
    });

    // Apply user preferences as defaults
    if (!parameters.location && context.userProfile.lastActiveLocation) {
      parameters.location = context.userProfile.lastActiveLocation;
    }

    // Apply search preferences
    if (context.userProfile.searchPreferences) {
      const prefs = context.userProfile.searchPreferences;

      if (!parameters.propertyTypes && prefs.preferredPropertyTypes.length > 0) {
        parameters.propertyTypes = prefs.preferredPropertyTypes;
      }

      if (!parameters.priceRange && prefs.typicalPriceRange) {
        parameters.priceRange = prefs.typicalPriceRange;
      }
    }

    return parameters;
  }

  private calculateResolutionConfidence(references: ResolvedReference[]): number {
    if (references.length === 0) return 1.0;

    const totalConfidence = references.reduce((sum, ref) => sum + ref.confidence, 0);
    return totalConfidence / references.length;
  }

  private generateConfirmationMessage(resolvedQuery: ResolvedQuery): string {
    const uncertainRefs = resolvedQuery.resolvedReferences.filter(ref => ref.confidence < 0.8);

    if (uncertainRefs.length > 0) {
      const refList = uncertainRefs
        .map(ref => `"${ref.originalText}" → ${ref.resolvedTo}`)
        .join(', ');
      return `I want to make sure I understand correctly. When you mentioned ${refList}, is that what you meant?`;
    }

    return 'Let me confirm I understood your request correctly before proceeding.';
  }

  // Follow-up suggestion methods
  private getPropertyAnalysisFollowUps(analytics: any, context: ConversationState): string[] {
    const suggestions = [];

    if (analytics.investmentScore) {
      suggestions.push("What's the investment potential for this property?");
    }

    if (analytics.marketPosition) {
      suggestions.push('How does this compare to similar properties?');
    }

    suggestions.push('Generate a detailed report for this property');
    suggestions.push('Show me market trends for this area');

    return suggestions;
  }

  private getInvestmentAnalysisFollowUps(analytics: any, context: ConversationState): string[] {
    const suggestions = [];

    suggestions.push('What are the risks with this investment?');
    suggestions.push('Show me ROI projections');
    suggestions.push('Compare with other investment opportunities');
    suggestions.push('What financing options work best?');

    return suggestions;
  }

  private getMarketAnalysisFollowUps(analytics: any, context: ConversationState): string[] {
    const suggestions = [];

    suggestions.push('What properties should I consider in this market?');
    suggestions.push('How do prices compare to neighboring areas?');
    suggestions.push("What's driving these market trends?");
    suggestions.push('Should I wait or buy now?');

    return suggestions;
  }

  private getComparisonFollowUps(analytics: any, context: ConversationState): string[] {
    const suggestions = [];

    suggestions.push('Which option is the better investment?');
    suggestions.push('What are the key differences?');
    suggestions.push('Add another property to compare');
    suggestions.push('Generate a comparison report');

    return suggestions;
  }

  private getGeneralFollowUps(analytics: any, context: ConversationState): string[] {
    return [
      'Tell me more about the local market',
      'Find properties matching my criteria',
      'Analyze a specific property',
      'Show me investment opportunities',
    ];
  }

  private getPersonalizedSuggestions(analytics: any, context: ConversationState): string[] {
    const suggestions = [];
    const profile = context.userProfile;

    if (profile.investmentProfile?.riskTolerance === 'conservative') {
      suggestions.push('Show me low-risk investment options');
    }

    if (profile.experienceLevel === 'beginner') {
      suggestions.push('Explain the market analysis in simple terms');
    }

    if (profile.locationHistory.length > 0) {
      const recentLocation = profile.locationHistory[profile.locationHistory.length - 1];
      suggestions.push(`Compare this to properties in ${recentLocation}`);
    }

    return suggestions;
  }

  private getFlowBasedSuggestions(context: ConversationState): string[] {
    const suggestions = [];
    const flow = context.conversationFlow;

    switch (flow.currentPhase) {
      case 'analysis':
        suggestions.push('Generate a professional report');
        suggestions.push('Set up price alerts');
        break;
      case 'recommendation':
        suggestions.push('Schedule a property viewing');
        suggestions.push('Contact the listing agent');
        break;
    }

    return suggestions;
  }
}

export default ConversationContextManager;

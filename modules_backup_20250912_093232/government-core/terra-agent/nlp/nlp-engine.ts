/**
 * Natural Language Processing Engine for TerraAgent AI
 * Day 6 Phase 1: Advanced NLP for Real Estate Analytics Queries
 */

// NLP Types and Interfaces
export interface AnalyticsIntent {
  primaryAction: string;
  analyticsType:
    | 'market_intelligence'
    | 'investment_scoring'
    | 'cma_automation'
    | 'visualization'
    | 'general';
  confidence: number;
  parameters: QueryParameters;
  urgency: 'low' | 'medium' | 'high';
  outputFormat: 'conversation' | 'report' | 'visualization' | 'quick_answer';
  requiresClarification: boolean;
  clarificationQuestions?: string[];
}

export interface QueryParameters {
  address?: string;
  location?: string;
  priceRange?: { min?: number; max?: number };
  propertyTypes?: string[];
  bedrooms?: { min?: number; max?: number };
  bathrooms?: { min?: number; max?: number };
  sqftRange?: { min?: number; max?: number };
  timeframe?: string;
  investmentCriteria?: InvestmentCriteria;
  comparisonTargets?: string[];
  reportType?: string;
  customFilters?: Record<string, any>;
}

export interface InvestmentCriteria {
  minRoi?: number;
  maxRisk?: 'low' | 'medium' | 'high';
  investmentType?: 'fix_flip' | 'rental' | 'appreciation' | 'mixed';
  timeline?: string;
  cashFlow?: boolean;
}

export interface EntityExtractions {
  addresses: AddressEntity[];
  locations: LocationEntity[];
  priceAmounts: PriceEntity[];
  propertyFeatures: FeatureEntity[];
  timeExpressions: TimeEntity[];
  comparatives: ComparativeEntity[];
  sentimentIndicators: SentimentEntity[];
}

export interface AddressEntity {
  text: string;
  normalized: string;
  confidence: number;
  type: 'full_address' | 'street_only' | 'partial';
  components: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export interface LocationEntity {
  text: string;
  normalized: string;
  confidence: number;
  type: 'neighborhood' | 'city' | 'county' | 'state' | 'region';
  coordinates?: { lat: number; lng: number };
  boundaries?: any;
}

export interface PriceEntity {
  text: string;
  amount: number;
  confidence: number;
  type: 'exact' | 'range_min' | 'range_max' | 'around';
  currency: string;
}

export interface FeatureEntity {
  text: string;
  feature: string;
  value: string | number;
  confidence: number;
  category: 'bedrooms' | 'bathrooms' | 'sqft' | 'lot_size' | 'year_built' | 'amenity' | 'condition';
}

export interface TimeEntity {
  text: string;
  normalized: Date | DateRange;
  confidence: number;
  type: 'specific_date' | 'relative' | 'range' | 'recurring';
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ComparativeEntity {
  text: string;
  type: 'compare_to' | 'better_than' | 'similar_to' | 'different_from';
  target: string;
  confidence: number;
}

export interface SentimentEntity {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number;
  confidence: number;
}

export interface QueryContext {
  previousQueries: string[];
  activeLocation?: string;
  activeProperty?: string;
  userPreferences: UserProfile;
  conversationState: ConversationState;
  referenceTargets: ReferenceTarget[];
}

export interface UserProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  preferredDetailLevel: 'summary' | 'detailed' | 'comprehensive';
  communicationStyle: 'casual' | 'professional' | 'technical';
  investmentProfile?: InvestmentProfile;
  locationPreferences?: string[];
  priceRangePreferences?: { min: number; max: number };
}

export interface InvestmentProfile {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  timeline: string;
  preferredPropertyTypes: string[];
  cashAvailable?: number;
}

export interface ConversationState {
  currentTopic: string;
  contextStack: ContextFrame[];
  pendingClarifications: string[];
  lastAnalyticsResult?: any;
  conversationFlow: FlowState;
}

export interface ContextFrame {
  topic: string;
  entities: EntityExtractions;
  parameters: QueryParameters;
  timestamp: Date;
  resolved: boolean;
}

export interface FlowState {
  phase: 'introduction' | 'information_gathering' | 'analysis' | 'recommendation' | 'action';
  stepInPhase: number;
  expectedNextActions: string[];
  completionPercentage: number;
}

export interface ReferenceTarget {
  type: 'property' | 'location' | 'analysis' | 'report';
  identifier: string;
  description: string;
  timestamp: Date;
  accessible: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  missingParameters: string[];
  ambiguousParameters: string[];
  suggestedClarifications: string[];
  canProceedWithDefaults: boolean;
  defaultsApplied?: Record<string, any>;
}

/**
 * Advanced Natural Language Processing Engine for Real Estate Analytics
 */
export class NLPEngine {
  private realEstateTerms: Map<string, string[]>;
  private intentPatterns: Map<string, RegExp[]>;
  private entityPatterns: Map<string, RegExp>;
  private locationDatabase: Map<string, LocationEntity>;
  private conversationHistory: Map<string, QueryContext>;

  constructor() {
    this.realEstateTerms = this.initializeRealEstateTerms();
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityPatterns = this.initializeEntityPatterns();
    this.locationDatabase = this.initializeLocationDatabase();
    this.conversationHistory = new Map();

    console.log('🧠 NLP Engine initialized with real estate intelligence');
  }

  /**
   * Parse natural language query into structured analytics intent
   */
  async parseQuery(query: string, userId?: string): Promise<AnalyticsIntent> {
    try {
      console.log(`🔍 Parsing query: "${query.substring(0, 100)}..."`);

      // Clean and normalize query
      const normalizedQuery = this.normalizeQuery(query);

      // Extract entities
      const entities = await this.extractEntities(normalizedQuery);

      // Determine primary intent
      const primaryAction = this.classifyIntent(normalizedQuery, entities);

      // Determine analytics type
      const analyticsType = this.determineAnalyticsType(normalizedQuery, entities);

      // Extract parameters
      const parameters = this.extractQueryParameters(normalizedQuery, entities);

      // Get context if user provided
      const context = userId ? this.getQueryContext(userId) : null;

      // Resolve references
      if (context) {
        this.resolveReferences(parameters, context);
      }

      // Determine output format preference
      const outputFormat = this.determineOutputFormat(normalizedQuery);

      // Calculate confidence
      const confidence = this.calculateParsingConfidence(entities, parameters);

      // Check if clarification needed
      const validation = await this.validateQuery({
        primaryAction,
        analyticsType,
        confidence,
        parameters,
        urgency: 'medium',
        outputFormat,
        requiresClarification: false,
      });

      const intent: AnalyticsIntent = {
        primaryAction,
        analyticsType,
        confidence,
        parameters,
        urgency: this.determineUrgency(normalizedQuery),
        outputFormat,
        requiresClarification: !validation.isValid,
        clarificationQuestions: validation.suggestedClarifications,
      };

      console.log(
        `✅ Parsed intent: ${primaryAction} (${analyticsType}) - Confidence: ${confidence}`
      );
      return intent;
    } catch (error) {
      console.error('❌ Query parsing failed:', error);
      throw error;
    }
  }

  /**
   * Extract structured entities from natural language
   */
  async extractEntities(query: string): Promise<EntityExtractions> {
    try {
      const entities: EntityExtractions = {
        addresses: await this.extractAddresses(query),
        locations: await this.extractLocations(query),
        priceAmounts: await this.extractPrices(query),
        propertyFeatures: await this.extractFeatures(query),
        timeExpressions: await this.extractTimeExpressions(query),
        comparatives: await this.extractComparatives(query),
        sentimentIndicators: await this.extractSentiment(query),
      };

      console.log(
        `📍 Extracted entities: ${entities.addresses.length} addresses, ${entities.locations.length} locations`
      );
      return entities;
    } catch (error) {
      console.error('❌ Entity extraction failed:', error);
      throw error;
    }
  }

  /**
   * Determine conversation context for multi-turn interactions
   */
  async determineContext(query: string, history: any[], userId: string): Promise<QueryContext> {
    try {
      const existingContext =
        this.conversationHistory.get(userId) || this.createDefaultContext(userId);

      // Update conversation state
      existingContext.conversationState.contextStack.push({
        topic: this.extractTopic(query),
        entities: await this.extractEntities(query),
        parameters: {} as QueryParameters,
        timestamp: new Date(),
        resolved: false,
      });

      // Update conversation flow
      this.updateConversationFlow(existingContext, query);

      // Store updated context
      this.conversationHistory.set(userId, existingContext);

      console.log(
        `💭 Context determined for user ${userId}: ${existingContext.conversationState.currentTopic}`
      );
      return existingContext;
    } catch (error) {
      console.error('❌ Context determination failed:', error);
      throw error;
    }
  }

  /**
   * Validate query completeness and suggest clarifications
   */
  async validateQuery(intent: AnalyticsIntent): Promise<ValidationResult> {
    try {
      const validation: ValidationResult = {
        isValid: true,
        confidence: intent.confidence,
        missingParameters: [],
        ambiguousParameters: [],
        suggestedClarifications: [],
        canProceedWithDefaults: true,
      };

      // Check required parameters based on analytics type
      const requiredParams = this.getRequiredParameters(intent.analyticsType);

      for (const param of requiredParams) {
        if (!intent.parameters[param] && !this.hasDefaultValue(param)) {
          validation.missingParameters.push(param);
          validation.isValid = false;
        }
      }

      // Check for ambiguous parameters
      this.checkParameterAmbiguity(intent.parameters, validation);

      // Generate clarification questions
      if (!validation.isValid) {
        validation.suggestedClarifications = this.generateClarificationQuestions(validation);
      }

      console.log(`✅ Query validation: ${validation.isValid ? 'VALID' : 'NEEDS CLARIFICATION'}`);
      return validation;
    } catch (error) {
      console.error('❌ Query validation failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s$,.-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private classifyIntent(query: string, entities: EntityExtractions): string {
    // Intent classification patterns
    const intentKeywords = {
      analyze: ['analyze', 'analysis', 'study', 'examine', 'review'],
      find: ['find', 'search', 'look for', 'show me', 'get me'],
      compare: ['compare', 'versus', 'vs', 'against', 'difference'],
      predict: ['predict', 'forecast', 'project', 'estimate', 'expect'],
      score: ['score', 'rate', 'rank', 'evaluate', 'assess'],
      report: ['report', 'generate', 'create', 'prepare', 'document'],
      value: ['value', 'worth', 'price', 'cost', 'appraise'],
      invest: ['invest', 'investment', 'roi', 'return', 'profit'],
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return intent;
      }
    }

    return 'general_inquiry';
  }

  private determineAnalyticsType(
    query: string,
    entities: EntityExtractions
  ): AnalyticsIntent['analyticsType'] {
    // Analytics type classification
    if (query.match(/\b(invest|roi|return|profit|cash flow)\b/)) {
      return 'investment_scoring';
    }
    if (query.match(/\b(cma|comparable|market analysis|value|appraisal)\b/)) {
      return 'cma_automation';
    }
    if (query.match(/\b(trend|forecast|market|predict|growth)\b/)) {
      return 'market_intelligence';
    }
    if (query.match(/\b(chart|graph|map|dashboard|visual|report)\b/)) {
      return 'visualization';
    }

    return 'general';
  }

  private extractQueryParameters(query: string, entities: EntityExtractions): QueryParameters {
    const parameters: QueryParameters = {};

    // Extract address/location
    if (entities.addresses.length > 0) {
      parameters.address = entities.addresses[0].normalized;
    } else if (entities.locations.length > 0) {
      parameters.location = entities.locations[0].normalized;
    }

    // Extract price range
    if (entities.priceAmounts.length > 0) {
      const prices = entities.priceAmounts.map(p => p.amount).sort((a, b) => a - b);
      if (prices.length === 1) {
        if (query.includes('under') || query.includes('below')) {
          parameters.priceRange = { max: prices[0] };
        } else if (query.includes('over') || query.includes('above')) {
          parameters.priceRange = { min: prices[0] };
        } else {
          parameters.priceRange = { min: prices[0] * 0.9, max: prices[0] * 1.1 };
        }
      } else {
        parameters.priceRange = { min: prices[0], max: prices[prices.length - 1] };
      }
    }

    // Extract property features
    const bedroomFeatures = entities.propertyFeatures.filter(f => f.category === 'bedrooms');
    if (bedroomFeatures.length > 0) {
      parameters.bedrooms = { min: Number(bedroomFeatures[0].value) };
    }

    const bathroomFeatures = entities.propertyFeatures.filter(f => f.category === 'bathrooms');
    if (bathroomFeatures.length > 0) {
      parameters.bathrooms = { min: Number(bathroomFeatures[0].value) };
    }

    // Extract property types
    const propertyTypeMatches = query.match(
      /\b(house|home|condo|townhouse|apartment|duplex|commercial)\b/g
    );
    if (propertyTypeMatches) {
      parameters.propertyTypes = [...new Set(propertyTypeMatches)];
    }

    return parameters;
  }

  private async extractAddresses(query: string): Promise<AddressEntity[]> {
    const addresses: AddressEntity[] = [];

    // Address patterns
    const fullAddressPattern =
      /\b\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|way|blvd|boulevard)[,\s]+[\w\s]+[,\s]+[A-Z]{2}\b/gi;
    const streetOnlyPattern =
      /\b\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|way|blvd|boulevard)\b/gi;

    // Full addresses
    const fullMatches = query.match(fullAddressPattern);
    if (fullMatches) {
      for (const match of fullMatches) {
        addresses.push({
          text: match,
          normalized: this.normalizeAddress(match),
          confidence: 0.9,
          type: 'full_address',
          components: this.parseAddressComponents(match),
        });
      }
    }

    // Street-only addresses
    const streetMatches = query.match(streetOnlyPattern);
    if (streetMatches) {
      for (const match of streetMatches) {
        if (!fullMatches?.includes(match)) {
          addresses.push({
            text: match,
            normalized: this.normalizeAddress(match),
            confidence: 0.7,
            type: 'street_only',
            components: this.parseAddressComponents(match),
          });
        }
      }
    }

    return addresses;
  }

  private async extractLocations(query: string): Promise<LocationEntity[]> {
    const locations: LocationEntity[] = [];

    // Location patterns
    const cityStatePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*[,\s]+[A-Z]{2}\b/g;
    const neighborhoodPattern = /\b(?:in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;

    // City, State matches
    const cityMatches = query.match(cityStatePattern);
    if (cityMatches) {
      for (const match of cityMatches) {
        locations.push({
          text: match,
          normalized: match.trim(),
          confidence: 0.85,
          type: 'city',
        });
      }
    }

    // Neighborhood matches
    let neighborhoodMatch;
    while ((neighborhoodMatch = neighborhoodPattern.exec(query)) !== null) {
      locations.push({
        text: neighborhoodMatch[1],
        normalized: neighborhoodMatch[1],
        confidence: 0.8,
        type: 'neighborhood',
      });
    }

    return locations;
  }

  private async extractPrices(query: string): Promise<PriceEntity[]> {
    const prices: PriceEntity[] = [];

    // Price patterns
    const pricePatterns = [
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[kK]?/g,
      /(\d{1,3}(?:,\d{3})*)\s*(?:thousand|k|K)/g,
      /(\d{1,3}(?:\.\d{1,2})?)\s*(?:million|M|mil)/g,
    ];

    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        const amount = this.parsePrice(match[0]);
        prices.push({
          text: match[0],
          amount,
          confidence: 0.9,
          type: 'exact',
          currency: 'USD',
        });
      }
    }

    return prices;
  }

  private async extractFeatures(query: string): Promise<FeatureEntity[]> {
    const features: FeatureEntity[] = [];

    // Feature patterns
    const featurePatterns = {
      bedrooms: /(\d+)[\s-]*(?:bed|bedroom|br)\b/gi,
      bathrooms: /(\d+(?:\.\d+)?)[\s-]*(?:bath|bathroom|ba)\b/gi,
      sqft: /(\d{1,3}(?:,\d{3})*)[\s-]*(?:sq\.?\s*ft|square\s*feet|sqft)\b/gi,
    };

    for (const [category, pattern] of Object.entries(featurePatterns)) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        features.push({
          text: match[0],
          feature: category,
          value: category === 'sqft' ? parseInt(match[1].replace(/,/g, '')) : parseFloat(match[1]),
          confidence: 0.85,
          category: category as FeatureEntity['category'],
        });
      }
    }

    return features;
  }

  private async extractTimeExpressions(query: string): Promise<TimeEntity[]> {
    const timeExpressions: TimeEntity[] = [];

    // Time patterns
    const timePatterns = {
      last_month: /\b(?:last|past)\s+month\b/gi,
      last_year: /\b(?:last|past)\s+year\b/gi,
      recently: /\brecently\b/gi,
      now: /\b(?:now|current|currently|today)\b/gi,
    };

    for (const [type, pattern] of Object.entries(timePatterns)) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          timeExpressions.push({
            text: match,
            normalized: this.parseTimeExpression(type),
            confidence: 0.8,
            type: 'relative',
          });
        }
      }
    }

    return timeExpressions;
  }

  private async extractComparatives(query: string): Promise<ComparativeEntity[]> {
    const comparatives: ComparativeEntity[] = [];

    // Comparative patterns
    const comparativePatterns = {
      compare_to: /\b(?:compare|versus|vs|against)\b/gi,
      better_than: /\b(?:better|superior|higher)\s+than\b/gi,
      similar_to: /\b(?:similar|like|comparable)\s+to\b/gi,
    };

    for (const [type, pattern] of Object.entries(comparativePatterns)) {
      const matches = query.match(pattern);
      if (matches) {
        for (const match of matches) {
          comparatives.push({
            text: match,
            type: type as ComparativeEntity['type'],
            target: '',
            confidence: 0.75,
          });
        }
      }
    }

    return comparatives;
  }

  private async extractSentiment(query: string): Promise<SentimentEntity[]> {
    const sentiments: SentimentEntity[] = [];

    // Sentiment indicators
    const sentimentWords = {
      positive: ['good', 'great', 'excellent', 'amazing', 'perfect', 'best', 'love', 'interested'],
      negative: ['bad', 'terrible', 'awful', 'worst', 'hate', 'avoid', 'problems', 'issues'],
      neutral: ['okay', 'fine', 'decent', 'acceptable', 'average', 'normal'],
    };

    for (const [sentiment, words] of Object.entries(sentimentWords)) {
      for (const word of words) {
        if (query.includes(word)) {
          sentiments.push({
            text: word,
            sentiment: sentiment as SentimentEntity['sentiment'],
            intensity: sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? 0.8 : 0.5,
            confidence: 0.7,
          });
        }
      }
    }

    return sentiments;
  }

  // Helper methods
  private normalizeAddress(address: string): string {
    return address
      .replace(/\b(st|street)\b/gi, 'Street')
      .replace(/\b(ave|avenue)\b/gi, 'Avenue')
      .replace(/\b(rd|road)\b/gi, 'Road')
      .replace(/\b(dr|drive)\b/gi, 'Drive')
      .trim();
  }

  private parseAddressComponents(address: string): AddressEntity['components'] {
    const components: AddressEntity['components'] = {};

    // Simple parsing - in production, use a proper address parsing library
    const parts = address.split(/[,\s]+/);

    if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
      components.streetNumber = parts[0];
      components.streetName = parts.slice(1, -2).join(' ');
    }

    return components;
  }

  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[\$,]/g, '');

    if (cleaned.includes('k') || cleaned.includes('K')) {
      return parseFloat(cleaned.replace(/[kK]/g, '')) * 1000;
    }

    if (cleaned.includes('million') || cleaned.includes('M') || cleaned.includes('mil')) {
      return parseFloat(cleaned.replace(/(million|M|mil)/g, '')) * 1000000;
    }

    return parseFloat(cleaned);
  }

  private parseTimeExpression(type: string): Date {
    const now = new Date();

    switch (type) {
      case 'last_month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'last_year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case 'recently':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      default:
        return now;
    }
  }

  private determineOutputFormat(query: string): AnalyticsIntent['outputFormat'] {
    if (query.includes('report') || query.includes('document')) return 'report';
    if (query.includes('chart') || query.includes('graph') || query.includes('visual'))
      return 'visualization';
    if (query.includes('quick') || query.includes('brief')) return 'quick_answer';
    return 'conversation';
  }

  private determineUrgency(query: string): AnalyticsIntent['urgency'] {
    if (query.includes('urgent') || query.includes('asap') || query.includes('now')) return 'high';
    if (query.includes('when you can') || query.includes('sometime')) return 'low';
    return 'medium';
  }

  private calculateParsingConfidence(
    entities: EntityExtractions,
    parameters: QueryParameters
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on entities found
    if (entities.addresses.length > 0) confidence += 0.2;
    if (entities.locations.length > 0) confidence += 0.15;
    if (entities.priceAmounts.length > 0) confidence += 0.1;
    if (entities.propertyFeatures.length > 0) confidence += 0.1;

    // Increase confidence based on parameter completeness
    const parameterCount = Object.keys(parameters).length;
    confidence += Math.min(parameterCount * 0.05, 0.2);

    return Math.min(confidence, 1.0);
  }

  private getQueryContext(userId: string): QueryContext | null {
    return this.conversationHistory.get(userId) || null;
  }

  private resolveReferences(parameters: QueryParameters, context: QueryContext): void {
    // Simple reference resolution - check for pronouns and context
    if (context.activeProperty && !parameters.address) {
      parameters.address = context.activeProperty;
    }
    if (context.activeLocation && !parameters.location) {
      parameters.location = context.activeLocation;
    }
  }

  private createDefaultContext(userId: string): QueryContext {
    return {
      previousQueries: [],
      userPreferences: {
        experienceLevel: 'intermediate',
        preferredDetailLevel: 'detailed',
        communicationStyle: 'professional',
      },
      conversationState: {
        currentTopic: 'general',
        contextStack: [],
        pendingClarifications: [],
        conversationFlow: {
          phase: 'introduction',
          stepInPhase: 1,
          expectedNextActions: [],
          completionPercentage: 0,
        },
      },
      referenceTargets: [],
    };
  }

  private extractTopic(query: string): string {
    if (query.includes('investment')) return 'investment_analysis';
    if (query.includes('market')) return 'market_analysis';
    if (query.includes('value') || query.includes('price')) return 'valuation';
    if (query.includes('compare')) return 'comparison';
    return 'general_inquiry';
  }

  private updateConversationFlow(context: QueryContext, query: string): void {
    // Simple flow management - in production, use state machine
    const flow = context.conversationState.conversationFlow;

    if (flow.phase === 'introduction' && this.hasSpecificQuery(query)) {
      flow.phase = 'information_gathering';
      flow.stepInPhase = 1;
    }

    flow.completionPercentage = Math.min(flow.completionPercentage + 10, 100);
  }

  private hasSpecificQuery(query: string): boolean {
    return (
      query.length > 20 &&
      (query.includes('$') ||
        query.includes('bed') ||
        query.includes('bath') ||
        /\b\d+\s+[\w\s]+(?:st|street|ave|avenue)\b/i.test(query))
    );
  }

  private getRequiredParameters(analyticsType: AnalyticsIntent['analyticsType']): string[] {
    switch (analyticsType) {
      case 'investment_scoring':
        return ['address'];
      case 'cma_automation':
        return ['address'];
      case 'market_intelligence':
        return ['location'];
      case 'visualization':
        return [];
      default:
        return [];
    }
  }

  private hasDefaultValue(param: string): boolean {
    const defaultParams = ['location', 'priceRange', 'propertyTypes'];
    return defaultParams.includes(param);
  }

  private checkParameterAmbiguity(parameters: QueryParameters, validation: ValidationResult): void {
    // Check for ambiguous parameters that need clarification
    if (parameters.priceRange && !parameters.priceRange.min && !parameters.priceRange.max) {
      validation.ambiguousParameters.push('priceRange');
    }

    if (parameters.location && parameters.location.length < 3) {
      validation.ambiguousParameters.push('location');
    }
  }

  private generateClarificationQuestions(validation: ValidationResult): string[] {
    const questions: string[] = [];

    for (const missing of validation.missingParameters) {
      switch (missing) {
        case 'address':
          questions.push('What specific property address would you like me to analyze?');
          break;
        case 'location':
          questions.push('Which area or neighborhood are you interested in?');
          break;
        case 'priceRange':
          questions.push("What's your target price range?");
          break;
      }
    }

    for (const ambiguous of validation.ambiguousParameters) {
      switch (ambiguous) {
        case 'priceRange':
          questions.push('Could you specify a price range (e.g., $400k to $600k)?');
          break;
        case 'location':
          questions.push('Could you be more specific about the location?');
          break;
      }
    }

    return questions;
  }

  private initializeRealEstateTerms(): Map<string, string[]> {
    const terms = new Map();

    terms.set('property_types', [
      'house',
      'home',
      'single family',
      'condo',
      'condominium',
      'townhouse',
      'duplex',
      'apartment',
      'commercial',
      'land',
      'lot',
    ]);

    terms.set('features', [
      'bedroom',
      'bed',
      'br',
      'bathroom',
      'bath',
      'ba',
      'square feet',
      'sqft',
      'lot size',
      'garage',
      'parking',
      'pool',
      'deck',
      'patio',
    ]);

    terms.set('analytics_actions', [
      'analyze',
      'compare',
      'evaluate',
      'score',
      'predict',
      'forecast',
      'estimate',
      'value',
      'appraise',
      'report',
      'chart',
      'graph',
    ]);

    return terms;
  }

  private initializeIntentPatterns(): Map<string, RegExp[]> {
    const patterns = new Map();

    patterns.set('search', [
      /\b(?:find|search|look for|show me)\b/i,
      /\b(?:properties|homes|houses)\b/i,
    ]);

    patterns.set('analyze', [
      /\b(?:analyze|analysis|study|examine)\b/i,
      /\b(?:investment|roi|return)\b/i,
    ]);

    patterns.set('compare', [
      /\b(?:compare|versus|vs|against)\b/i,
      /\b(?:difference|better|worse)\b/i,
    ]);

    return patterns;
  }

  private initializeEntityPatterns(): Map<string, RegExp> {
    const patterns = new Map();

    patterns.set(
      'address',
      /\b\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|way|blvd|boulevard)\b/gi
    );
    patterns.set('price', /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[kKmM]?/g);
    patterns.set('bedrooms', /(\d+)[\s-]*(?:bed|bedroom|br)\b/gi);
    patterns.set('bathrooms', /(\d+(?:\.\d+)?)[\s-]*(?:bath|bathroom|ba)\b/gi);

    return patterns;
  }

  private initializeLocationDatabase(): Map<string, LocationEntity> {
    const database = new Map();

    // Sample location data - in production, load from comprehensive database
    database.set('seattle', {
      text: 'Seattle',
      normalized: 'Seattle, WA',
      confidence: 1.0,
      type: 'city',
      coordinates: { lat: 47.6062, lng: -122.3321 },
    });

    database.set('capitol hill', {
      text: 'Capitol Hill',
      normalized: 'Capitol Hill, Seattle, WA',
      confidence: 1.0,
      type: 'neighborhood',
      coordinates: { lat: 47.6205, lng: -122.3212 },
    });

    return database;
  }
}

export default NLPEngine;

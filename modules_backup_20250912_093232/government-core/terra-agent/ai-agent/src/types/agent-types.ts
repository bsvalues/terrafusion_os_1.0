/**
 * TerraAgent AI Agent Type Definitions
 * MIT PhD-level type system for intelligent real estate AI agent
 */

import { JSONSchema7 } from 'json-schema';

// Core AI Agent Types
export interface AIAgent {
  /** Unique agent identifier */
  id: string;

  /** Agent name and description */
  name: string;
  description: string;

  /** Agent capabilities and specializations */
  capabilities: AgentCapability[];

  /** Agent configuration */
  config: AgentConfig;

  /** Agent state and memory */
  state: AgentState;

  /** Execute agent operation */
  execute(request: AgentRequest): Promise<AgentResponse>;

  /** Process natural language input */
  processNaturalLanguage(input: string, context?: ConversationContext): Promise<AgentResponse>;

  /** Learn from interactions */
  learn(interaction: AgentInteraction): Promise<void>;
}

export interface AgentCapability {
  /** Capability name */
  name: string;

  /** Capability description */
  description: string;

  /** Confidence level (0-1) */
  confidence: number;

  /** Required tools/services */
  dependencies: string[];
}

export interface AgentConfig {
  /** AI model configuration */
  model: {
    provider: 'openai' | 'anthropic' | 'cohere' | 'local';
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };

  /** Memory configuration */
  memory: {
    enabled: boolean;
    vectorStore: 'chroma' | 'pinecone' | 'local';
    embeddingModel: string;
    maxMemories: number;
    retrievalCount: number;
  };

  /** Knowledge base configuration */
  knowledge: {
    enabled: boolean;
    sources: KnowledgeSource[];
    updateFrequency: string;
  };

  /** Tool integration */
  tools: {
    mcpServer: string;
    availableTools: string[];
    toolTimeout: number;
  };
}

export interface AgentState {
  /** Current conversation state */
  conversationId?: string;
  sessionId: string;

  /** Agent status */
  status: 'idle' | 'processing' | 'learning' | 'error';

  /** Working memory */
  workingMemory: WorkingMemory;

  /** Performance metrics */
  metrics: AgentMetrics;

  /** Last updated timestamp */
  lastUpdated: Date;
}

export interface WorkingMemory {
  /** Current context */
  currentContext: ConversationContext;

  /** Recent interactions */
  recentInteractions: AgentInteraction[];

  /** Active property focus */
  activeProperty?: PropertyContext;

  /** User preferences */
  userPreferences: UserProfile;

  /** Temporary variables */
  variables: Record<string, any>;
}

export interface ConversationContext {
  /** User information */
  userId: string;
  userProfile: UserProfile;

  /** Conversation metadata */
  conversationId: string;
  messageHistory: ConversationMessage[];

  /** Current topic/intent */
  currentTopic: string;
  detectedIntent: string;
  confidence: number;

  /** Property context if applicable */
  propertyContext?: PropertyContext;

  /** Location context */
  locationContext?: LocationContext;
}

export interface UserProfile {
  /** User identification */
  id: string;
  name?: string;
  email?: string;

  /** Real estate preferences */
  preferences: {
    propertyTypes: string[];
    priceRange?: { min: number; max: number };
    locations: string[];
    features: string[];
    timeline?: string;
  };

  /** User expertise level */
  expertiseLevel: 'novice' | 'intermediate' | 'expert' | 'professional';

  /** Interaction history */
  interactionHistory: {
    totalInteractions: number;
    lastInteraction: Date;
    commonQueries: string[];
    satisfactionRating: number;
  };
}

export interface PropertyContext {
  /** Property identification */
  propertyId?: string;
  address?: string;
  parcelId?: string;

  /** Property details */
  propertyType: string;
  details: PropertyDetails;

  /** Analysis context */
  analysisType: 'valuation' | 'market' | 'investment' | 'comparison' | 'inspection';
  analysisParameters: Record<string, any>;

  /** Related properties */
  relatedProperties: string[];
}

export interface PropertyDetails {
  /** Basic information */
  address: string;
  city: string;
  state: string;
  zipCode: string;

  /** Property characteristics */
  propertyType: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lotSize?: number;

  /** Financial information */
  currentValue?: number;
  lastSalePrice?: number;
  lastSaleDate?: Date;
  annualTaxes?: number;

  /** Market information */
  marketTrends?: MarketTrend[];
  neighborhoodInfo?: NeighborhoodInfo;
}

export interface MarketTrend {
  /** Time period */
  period: string;
  startDate: Date;
  endDate: Date;

  /** Market metrics */
  averagePrice: number;
  medianPrice: number;
  priceChange: number;
  volumeChange: number;
  daysOnMarket: number;

  /** Market indicators */
  marketCondition: 'hot' | 'balanced' | 'cold';
  inventoryLevel: 'low' | 'normal' | 'high';
  demandLevel: 'low' | 'moderate' | 'high';
}

export interface NeighborhoodInfo {
  /** Demographics */
  population: number;
  medianIncome: number;
  ageDistribution: Record<string, number>;

  /** Amenities */
  schools: SchoolInfo[];
  transportation: TransportationInfo;
  amenities: AmenityInfo[];

  /** Safety and quality */
  crimeRate: number;
  walkScore: number;
  qualityOfLife: number;
}

export interface SchoolInfo {
  name: string;
  type: 'elementary' | 'middle' | 'high' | 'university';
  rating: number;
  distance: number;
}

export interface TransportationInfo {
  publicTransit: boolean;
  busRoutes: string[];
  trainStations: string[];
  highways: string[];
  walkability: number;
}

export interface AmenityInfo {
  name: string;
  type: string;
  distance: number;
  rating: number;
}

export interface LocationContext {
  /** Geographic information */
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;

  /** Coordinates */
  latitude?: number;
  longitude?: number;

  /** Market information */
  marketData?: MarketData;
  demographics?: Demographics;
}

export interface MarketData {
  /** Market statistics */
  medianPrice: number;
  averagePrice: number;
  pricePerSqft: number;
  daysOnMarket: number;

  /** Market trends */
  priceChange1Year: number;
  priceChange5Year: number;
  volumeTrend: number;

  /** Inventory */
  activeListings: number;
  newListings: number;
  soldListings: number;
  inventoryMonths: number;
}

export interface Demographics {
  /** Population */
  totalPopulation: number;
  populationGrowth: number;

  /** Income */
  medianHouseholdIncome: number;
  incomeGrowth: number;

  /** Employment */
  employmentRate: number;
  majorEmployers: string[];

  /** Education */
  educationLevel: Record<string, number>;
}

export interface ConversationMessage {
  /** Message identification */
  id: string;
  timestamp: Date;

  /** Message content */
  role: 'user' | 'agent' | 'system';
  content: string;

  /** Message metadata */
  intent?: string;
  entities?: Record<string, any>;
  sentiment?: number;

  /** Agent processing */
  toolsUsed?: string[];
  processingTime?: number;
  confidence?: number;
}

export interface AgentRequest {
  /** Request identification */
  requestId: string;
  timestamp: Date;

  /** Request content */
  input: string;
  inputType: 'natural_language' | 'structured' | 'voice';

  /** Request context */
  context: ConversationContext;

  /** Request parameters */
  parameters?: Record<string, any>;

  /** Response preferences */
  responseFormat?: 'text' | 'structured' | 'audio' | 'visual';
}

export interface AgentResponse {
  /** Response identification */
  responseId: string;
  requestId: string;
  timestamp: Date;

  /** Response content */
  content: string;
  contentType: 'text' | 'structured' | 'multimedia';

  /** Structured data */
  data?: any;

  /** Response metadata */
  confidence: number;
  processingTime: number;
  toolsUsed: string[];

  /** Follow-up suggestions */
  suggestions?: string[];

  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AgentInteraction {
  /** Interaction identification */
  interactionId: string;
  sessionId: string;
  timestamp: Date;

  /** Interaction content */
  request: AgentRequest;
  response: AgentResponse;

  /** User feedback */
  userFeedback?: {
    rating: number;
    feedback: string;
    helpful: boolean;
  };

  /** Learning data */
  learningData: {
    successfulTools: string[];
    failedTools: string[];
    improvedResponses: string[];
    userSatisfaction: number;
  };
}

export interface AgentMetrics {
  /** Performance metrics */
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  averageConfidence: number;

  /** Tool usage */
  toolUsageStats: Record<
    string,
    {
      count: number;
      successRate: number;
      averageTime: number;
    }
  >;

  /** User satisfaction */
  averageRating: number;
  totalFeedback: number;
  positivefeedback: number;

  /** Learning progress */
  knowledgeGrowth: number;
  memoryUtilization: number;
  adaptationRate: number;
}

export interface KnowledgeSource {
  /** Source information */
  id: string;
  name: string;
  type: 'document' | 'api' | 'database' | 'web' | 'manual';

  /** Source configuration */
  connection: {
    url?: string;
    credentials?: Record<string, string>;
    parameters?: Record<string, any>;
  };

  /** Content processing */
  processing: {
    enabled: boolean;
    chunking: 'semantic' | 'fixed' | 'sliding';
    chunkSize: number;
    overlap: number;
    embedding: boolean;
  };

  /** Update schedule */
  updateSchedule: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
    lastUpdate: Date;
    nextUpdate: Date;
  };
}

// MCP Integration Types
export interface MCPToolCall {
  /** Tool identification */
  toolName: string;

  /** Tool parameters */
  parameters: Record<string, any>;

  /** Execution context */
  context: {
    requestId: string;
    userId: string;
    sessionId: string;
  };
}

export interface MCPToolResponse {
  /** Response status */
  success: boolean;

  /** Response data */
  data?: any;

  /** Error information */
  error?: {
    code: string;
    message: string;
  };

  /** Execution metadata */
  executionTime: number;
  timestamp: Date;
}

// Natural Language Processing Types
export interface NLPResult {
  /** Intent detection */
  intent: {
    name: string;
    confidence: number;
    alternatives: Array<{
      name: string;
      confidence: number;
    }>;
  };

  /** Entity extraction */
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
  }>;

  /** Sentiment analysis */
  sentiment: {
    polarity: number; // -1 to 1
    subjectivity: number; // 0 to 1
    emotion: string;
  };

  /** Context understanding */
  context: {
    topic: string;
    domain: string;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

// Memory and Learning Types
export interface MemoryEntry {
  /** Memory identification */
  id: string;
  type: 'episodic' | 'semantic' | 'procedural';

  /** Memory content */
  content: string;
  embedding: number[];

  /** Memory metadata */
  context: {
    userId: string;
    sessionId: string;
    timestamp: Date;
    relevance: number;
  };

  /** Memory associations */
  associations: string[];

  /** Access information */
  accessCount: number;
  lastAccessed: Date;
  importance: number;
}

export interface LearningUpdate {
  /** Update type */
  type: 'feedback' | 'correction' | 'reinforcement' | 'new_knowledge';

  /** Update content */
  content: {
    original: string;
    updated: string;
    reason: string;
  };

  /** Update confidence */
  confidence: number;

  /** Update source */
  source: {
    type: 'user' | 'system' | 'external';
    identifier: string;
  };
}

export interface KnowledgeSource {
  /** Source identification */
  id: string;
  name: string;

  /** Source type and location */
  type: 'document' | 'api' | 'database' | 'web' | 'manual';
  url?: string;

  /** Update configuration */
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';

  /** Source metadata */
  lastUpdated?: Date;
  version?: string;
  active?: boolean;
}

// MCP (Model Context Protocol) Types
export interface MCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  executeTool(toolCall: MCPToolCall): Promise<MCPToolResponse>;
  getAvailableTools(): string[];
  getToolCapabilities(): any[];
  isConnectedToServer(): boolean;
}

export interface MCPToolCall {
  toolName: string;
  parameters: Record<string, any>;
  requestContext?: Record<string, any>;
}

export interface MCPToolResponse {
  toolName: string;
  success: boolean;
  result: any;
  error?: {
    code: string;
    message: string;
  };
  executionTime: number;
  metadata: {
    timestamp: Date;
    [key: string]: any;
  };
}

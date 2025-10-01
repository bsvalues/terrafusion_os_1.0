/**
 * TerraAgent MCP Server Type Definitions
 * Comprehensive type system for the Model Context Protocol implementation
 */

import { JSONSchema7 } from 'json-schema';
import { Logger } from '../utils/logger.js';
import { MCPMetrics } from '../utils/metrics.js';

// Base MCP Types
export interface MCPTool {
  /** Unique tool identifier */
  name: string;

  /** Human-readable tool description */
  description: string;

  /** JSON Schema for input validation */
  inputSchema: JSONSchema7;

  /** Cache configuration for tool results */
  cacheConfig?: CacheConfig;

  /** Execute the tool with given arguments */
  execute(args: any, context: ToolExecutionContext): Promise<any>;
}

export interface ToolExecutionContext {
  /** Name of the tool being executed */
  toolName: string;

  /** Input arguments for the tool */
  arguments: any;

  /** Execution timestamp */
  timestamp: Date;

  /** Unique request identifier */
  requestId: string;

  /** Logger instance for this execution */
  logger: Logger;

  /** Metrics collector */
  metrics: MCPMetrics;

  /** Server configuration */
  config: ServerConfig;
}

export interface CacheConfig {
  /** Cache time-to-live in seconds */
  ttlSeconds: number;

  /** Whether to use cache for this tool */
  enabled: boolean;

  /** Cache invalidation tags */
  tags?: string[];
}

// Server Configuration
export interface ServerConfig {
  /** Server identification */
  server: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };

  /** Database configuration */
  database: DatabaseConfig;

  /** Cache configuration */
  cache: {
    provider: 'memory' | 'redis';
    redis?: RedisConfig;
    defaultTtl: number;
    maxMemoryMB: number;
  };

  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
    file?: string;
  };

  /** Performance and security settings */
  performance: {
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
    cacheEnabled: boolean;
  };

  /** External service configurations */
  services: {
    terraAgentBackend: ServiceConfig;
    propertyData: ServiceConfig;
    assessmentAPI: ServiceConfig;
  };
}

export interface DatabaseConfig {
  type: 'postgresql' | 'sqlite';
  postgresql?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
  };
  sqlite?: {
    filename: string;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  connectTimeout: number;
  commandTimeout: number;
}

export interface ServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  apiKey?: string;
  headers?: Record<string, string>;
}

// Property Data Types
export interface Property {
  /** Unique property identifier */
  id: string;

  /** Parcel identification number */
  parcelId: string;

  /** Property address information */
  address: PropertyAddress;

  /** Property characteristics */
  characteristics: PropertyCharacteristics;

  /** Current assessment information */
  assessment?: Assessment;

  /** Recent sales data */
  sales?: Sale[];

  /** Property location data */
  location: PropertyLocation;

  /** Additional property metadata */
  metadata: PropertyMetadata;
}

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  fullAddress: string;
}

export interface PropertyCharacteristics {
  propertyType: PropertyType;
  landUse: string;
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  condition?: PropertyCondition;
  features?: string[];
}

export interface PropertyLocation {
  latitude: number;
  longitude: number;
  elevation?: number;
  zoning?: string;
  floodZone?: string;
  schoolDistrict?: string;
  municipality?: string;
}

export interface PropertyMetadata {
  lastUpdated: Date;
  dataSource: string;
  confidence: number;
  flags?: string[];
  notes?: string;
}

export type PropertyType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural'
  | 'vacant_land'
  | 'mixed_use'
  | 'other';

export type PropertyCondition = 'excellent' | 'good' | 'average' | 'fair' | 'poor' | 'unknown';

// Assessment Types
export interface Assessment {
  /** Assessment ID */
  id: string;

  /** Property being assessed */
  propertyId: string;

  /** Assessment year */
  assessmentYear: number;

  /** Assessed values */
  values: AssessmentValues;

  /** Tax calculations */
  taxes: TaxCalculation;

  /** Assessment metadata */
  metadata: AssessmentMetadata;
}

export interface AssessmentValues {
  /** Total assessed value */
  totalValue: number;

  /** Land value */
  landValue: number;

  /** Improvement value */
  improvementValue: number;

  /** Market value estimate */
  marketValue?: number;

  /** Agricultural use value (if applicable) */
  agriculturalValue?: number;

  /** Value change from previous year */
  valueChange?: ValueChange;
}

export interface ValueChange {
  /** Absolute change in dollars */
  absoluteChange: number;

  /** Percentage change */
  percentChange: number;

  /** Previous year value */
  previousValue: number;
}

export interface TaxCalculation {
  /** Total tax amount */
  totalTax: number;

  /** Tax rate (mills) */
  taxRate: number;

  /** Individual levy breakdowns */
  levies: TaxLevy[];

  /** Exemptions applied */
  exemptions?: TaxExemption[];
}

export interface TaxLevy {
  /** Levy authority name */
  authority: string;

  /** Levy type */
  type: string;

  /** Levy rate (mills) */
  rate: number;

  /** Levy amount */
  amount: number;
}

export interface TaxExemption {
  /** Exemption type */
  type: string;

  /** Exemption description */
  description: string;

  /** Exemption amount */
  amount: number;

  /** Percentage exempted */
  percentage?: number;
}

export interface AssessmentMetadata {
  /** Assessment date */
  assessmentDate: Date;

  /** Assessor information */
  assessor: string;

  /** Assessment method */
  method: string;

  /** Data quality indicators */
  quality: AssessmentQuality;

  /** Last updated */
  lastUpdated: Date;
}

export interface AssessmentQuality {
  /** Confidence score (0-1) */
  confidence: number;

  /** Data completeness (0-1) */
  completeness: number;

  /** Age of data in days */
  dataAge: number;

  /** Quality flags */
  flags?: string[];
}

// Sales Data Types
export interface Sale {
  /** Sale ID */
  id: string;

  /** Property sold */
  propertyId: string;

  /** Sale information */
  saleInfo: SaleInformation;

  /** Sale verification */
  verification: SaleVerification;

  /** Market context */
  marketContext?: MarketContext;
}

export interface SaleInformation {
  /** Sale date */
  saleDate: Date;

  /** Sale price */
  salePrice: number;

  /** Price per square foot */
  pricePerSqFt?: number;

  /** Sale type */
  saleType: SaleType;

  /** Financing information */
  financing?: SaleFinancing;

  /** Sale conditions */
  conditions?: string[];
}

export interface SaleVerification {
  /** Whether sale is verified */
  verified: boolean;

  /** Verification source */
  source: string;

  /** Verification date */
  verificationDate: Date;

  /** Verification confidence */
  confidence: number;

  /** Verification notes */
  notes?: string;
}

export interface MarketContext {
  /** Market conditions at time of sale */
  marketConditions: string;

  /** Days on market */
  daysOnMarket?: number;

  /** List price */
  listPrice?: number;

  /** Sale to list ratio */
  saleToListRatio?: number;
}

export type SaleType =
  | 'arms_length'
  | 'foreclosure'
  | 'short_sale'
  | 'estate_sale'
  | 'family_transfer'
  | 'other';

export interface SaleFinancing {
  /** Financing type */
  type: string;

  /** Down payment amount */
  downPayment?: number;

  /** Loan amount */
  loanAmount?: number;

  /** Interest rate */
  interestRate?: number;
}

// Analysis Result Types
export interface PropertyAnalysisResult {
  /** Property being analyzed */
  property: Property;

  /** Valuation estimates */
  valuation: PropertyValuation;

  /** Market analysis */
  marketAnalysis: MarketAnalysis;

  /** Comparable properties */
  comparables?: ComparableProperty[];

  /** Risk assessment */
  riskAssessment?: RiskAssessment;

  /** Analysis metadata */
  metadata: AnalysisMetadata;
}

export interface PropertyValuation {
  /** Estimated market value */
  estimatedValue: number;

  /** Confidence interval */
  confidenceInterval: {
    low: number;
    high: number;
    confidence: number;
  };

  /** Valuation methods used */
  methods: ValuationMethod[];

  /** Value per square foot */
  valuePerSqFt?: number;

  /** Valuation date */
  valuationDate: Date;
}

export interface ValuationMethod {
  /** Method name */
  name: string;

  /** Method description */
  description: string;

  /** Estimated value from this method */
  value: number;

  /** Weight in final estimate */
  weight: number;

  /** Method confidence */
  confidence: number;
}

export interface MarketAnalysis {
  /** Neighborhood trends */
  neighborhood: NeighborhoodTrends;

  /** Market conditions */
  marketConditions: string;

  /** Price trends */
  priceTrends: PriceTrends;

  /** Market velocity */
  velocity: MarketVelocity;

  /** Supply and demand */
  supplyDemand: SupplyDemandMetrics;
}

export interface NeighborhoodTrends {
  /** Average days on market */
  avgDaysOnMarket: number;

  /** Price appreciation rate */
  appreciationRate: number;

  /** Sale volume trends */
  saleVolume: VolumeMetrics;

  /** Inventory levels */
  inventory: InventoryMetrics;
}

export interface PriceTrends {
  /** 12-month price change */
  yearOverYear: number;

  /** 3-month price change */
  quarterOverQuarter: number;

  /** Monthly price change */
  monthOverMonth: number;

  /** Price trend direction */
  direction: 'increasing' | 'decreasing' | 'stable';
}

export interface MarketVelocity {
  /** Average days on market */
  avgDaysOnMarket: number;

  /** Median days on market */
  medianDaysOnMarket: number;

  /** Percentage selling within 30 days */
  soldWithin30Days: number;

  /** Market absorption rate */
  absorptionRate: number;
}

export interface SupplyDemandMetrics {
  /** Active listings */
  activeListings: number;

  /** New listings (monthly) */
  newListings: number;

  /** Pending sales */
  pendingSales: number;

  /** Months of inventory */
  monthsOfInventory: number;

  /** Supply/demand ratio */
  supplyDemandRatio: number;
}

export interface VolumeMetrics {
  /** Sales this month */
  currentMonth: number;

  /** Sales last month */
  previousMonth: number;

  /** Sales same month last year */
  sameMonthLastYear: number;

  /** Volume change percentage */
  changePercent: number;
}

export interface InventoryMetrics {
  /** Current inventory count */
  current: number;

  /** Previous month inventory */
  previousMonth: number;

  /** Inventory change */
  change: number;

  /** Inventory change percentage */
  changePercent: number;
}

export interface ComparableProperty {
  /** Comparable property details */
  property: Property;

  /** Recent sale information */
  sale: Sale;

  /** Similarity score to subject property */
  similarityScore: number;

  /** Distance from subject property */
  distance: number;

  /** Adjustments made for comparison */
  adjustments?: PropertyAdjustment[];

  /** Adjusted sale price */
  adjustedPrice: number;
}

export interface PropertyAdjustment {
  /** Adjustment factor */
  factor: string;

  /** Adjustment description */
  description: string;

  /** Adjustment amount */
  amount: number;

  /** Adjustment percentage */
  percentage: number;

  /** Adjustment reasoning */
  reasoning: string;
}

export interface RiskAssessment {
  /** Overall risk score (0-100) */
  overallRisk: number;

  /** Market risk factors */
  marketRisk: RiskFactor[];

  /** Property-specific risks */
  propertyRisk: RiskFactor[];

  /** Environmental risks */
  environmentalRisk: RiskFactor[];

  /** Financial risks */
  financialRisk: RiskFactor[];
}

export interface RiskFactor {
  /** Risk category */
  category: string;

  /** Risk level */
  level: 'low' | 'medium' | 'high' | 'critical';

  /** Risk score (0-100) */
  score: number;

  /** Risk description */
  description: string;

  /** Mitigation suggestions */
  mitigation?: string[];
}

export interface AnalysisMetadata {
  /** Analysis timestamp */
  timestamp: Date;

  /** Analysis duration in milliseconds */
  duration: number;

  /** Data sources used */
  dataSources: string[];

  /** Analysis confidence */
  confidence: number;

  /** Analysis limitations */
  limitations?: string[];

  /** Analysis version */
  version: string;
}

// Search and Filter Types
export interface PropertySearchFilters {
  /** Geographic filters */
  location?: LocationFilter;

  /** Property characteristic filters */
  characteristics?: CharacteristicFilter;

  /** Price and value filters */
  pricing?: PricingFilter;

  /** Assessment filters */
  assessment?: AssessmentFilter;

  /** Market filters */
  market?: MarketFilter;
}

export interface LocationFilter {
  /** Bounding box search */
  boundingBox?: BoundingBox;

  /** Radius search */
  radius?: RadiusSearch;

  /** Specific addresses */
  addresses?: string[];

  /** ZIP codes */
  zipCodes?: string[];

  /** School districts */
  schoolDistricts?: string[];

  /** Municipalities */
  municipalities?: string[];
}

export interface BoundingBox {
  northEast: Coordinates;
  southWest: Coordinates;
}

export interface RadiusSearch {
  center: Coordinates;
  radiusMiles: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CharacteristicFilter {
  /** Property types */
  propertyTypes?: PropertyType[];

  /** Square footage range */
  squareFootage?: NumericRange;

  /** Lot size range */
  lotSize?: NumericRange;

  /** Year built range */
  yearBuilt?: NumericRange;

  /** Bedroom count */
  bedrooms?: NumericRange;

  /** Bathroom count */
  bathrooms?: NumericRange;

  /** Property condition */
  condition?: PropertyCondition[];

  /** Required features */
  features?: string[];
}

export interface PricingFilter {
  /** Sale price range */
  salePrice?: NumericRange;

  /** Price per square foot range */
  pricePerSqFt?: NumericRange;

  /** Assessed value range */
  assessedValue?: NumericRange;

  /** Market value range */
  marketValue?: NumericRange;
}

export interface AssessmentFilter {
  /** Assessment year */
  assessmentYear?: number[];

  /** Total assessed value range */
  totalValue?: NumericRange;

  /** Land value range */
  landValue?: NumericRange;

  /** Improvement value range */
  improvementValue?: NumericRange;

  /** Tax amount range */
  taxAmount?: NumericRange;
}

export interface MarketFilter {
  /** Sale date range */
  saleDate?: DateRange;

  /** Sale types */
  saleTypes?: SaleType[];

  /** Days on market range */
  daysOnMarket?: NumericRange;

  /** Verified sales only */
  verifiedOnly?: boolean;
}

export interface NumericRange {
  min?: number;
  max?: number;
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

// Pagination and Sorting
export interface PaginationOptions {
  /** Page number (1-based) */
  page: number;

  /** Items per page */
  limit: number;

  /** Sort options */
  sort?: SortOption[];
}

export interface SortOption {
  /** Field to sort by */
  field: string;

  /** Sort direction */
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  /** Result items */
  items: T[];

  /** Pagination metadata */
  pagination: PaginationMetadata;
}

export interface PaginationMetadata {
  /** Current page */
  page: number;

  /** Items per page */
  limit: number;

  /** Total item count */
  total: number;

  /** Total page count */
  pages: number;

  /** Has next page */
  hasNext: boolean;

  /** Has previous page */
  hasPrevious: boolean;
}

// Error Types
export interface MCPError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error details */
  details?: any;

  /** Stack trace */
  stack?: string;

  /** Timestamp */
  timestamp: Date;
}

// Validation Types
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings?: string[];
}

// Export all types
// End of MCP Type Definitions

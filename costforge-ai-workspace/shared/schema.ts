/**
 * CostForge AI - Quantum Building Cost Intelligence Schema
 * Elite Government OS Engineering - PhD-Level Property Analysis
 *
 * TerraFusion OS - Government. Transcended.
 */

import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  json,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/*********************
 * QUANTUM USERS & AUTHENTICATION
 *********************/

// Elite Users Table for PhD-level professionals
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  username: text('username').unique().notNull(),
  email: text('email').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  professionalTitle: text('professional_title'), // MAI, PhD, etc.
  certifications: json('certifications').$type<string[]>(),
  bio: text('bio'),
  profileImageUrl: text('profile_image_url'),
  role: text('role').default('analyst').notNull(), // analyst, researcher, admin
  clearanceLevel: text('clearance_level').default('standard').notNull(), // standard, classified, quantum
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  preferences: json('preferences').$type<{
    theme?: string;
    notifications?: boolean;
    defaultModel?: string;
    analysisDepth?: 'standard' | 'advanced' | 'quantum';
  }>(),
});

// Quantum Sessions Table
export const sessions = pgTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

/*********************
 * QUANTUM PROPERTY INTELLIGENCE
 *********************/

// Enhanced Properties Table with Quantum Intelligence
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  propertyId: uuid('property_id').defaultRandom().notNull().unique(),
  parcelId: text('parcel_id').notNull().unique(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  county: text('county').notNull().default('Benton'),
  ownerName: text('owner_name'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  propertyType: text('property_type').notNull(),
  zoning: text('zoning'),
  acreage: real('acreage'),

  // Quantum Intelligence Fields
  aiConfidenceScore: real('ai_confidence_score'), // 0-1 confidence in AI analysis
  quantumAnalysisVersion: text('quantum_analysis_version'), // Track AI model version
  uncertaintyMetrics: json('uncertainty_metrics').$type<{
    bayesianUncertainty?: number;
    monteCarloVariance?: number;
    modelUncertainty?: number;
  }>(),

  // Enhanced Valuation
  assessedValue: integer('assessed_value'),
  totalValue: integer('total_value'),
  landValue: integer('land_value'),
  aiPredictedValue: integer('ai_predicted_value'),
  valueRange: json('value_range').$type<{ min: number; max: number; confidence: number }>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastAssessment: timestamp('last_assessment'),
  lastAiAnalysis: timestamp('last_ai_analysis'),

  // Metadata
  metaData: json('meta_data').$type<Record<string, any>>(),
  quantumMetadata: json('quantum_metadata').$type<{
    materialPhysics?: any;
    structuralAnalysis?: any;
    environmentalFactors?: any;
  }>(),
});

// Quantum Building Analysis Table
export const improvements = pgTable('improvements', {
  id: serial('id').primaryKey(),
  improvementId: uuid('improvement_id').defaultRandom().notNull().unique(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.propertyId, { onDelete: 'cascade' }),

  // Basic Building Information
  buildingType: text('building_type').notNull(),
  description: text('description').notNull(),
  yearBuilt: integer('year_built').notNull(),
  quality: text('quality').notNull(),
  condition: text('condition').notNull(),
  squareFeet: integer('square_feet').notNull(),
  stories: integer('stories').notNull().default(1),

  // Physical Characteristics
  basementType: text('basement_type'),
  basementFinished: boolean('basement_finished').default(false),
  exteriorWall: text('exterior_wall'),
  roofType: text('roof_type'),
  heatingType: text('heating_type'),
  coolingType: text('cooling_type'),
  garageType: text('garage_type'),
  garageSquareFeet: integer('garage_square_feet').default(0),

  // Cost Analysis
  costPerSqFt: real('cost_per_sqft'),
  calculatedValue: integer('calculated_value'),
  depreciatedValue: integer('depreciated_value'),

  // Quantum Analysis Fields
  materialPhysicsAnalysis: json('material_physics_analysis').$type<{
    density?: number;
    thermalConductivity?: number;
    structuralIntegrity?: number;
    quantumMaterialProperties?: any[];
  }>(),

  aiAnalysisResults: json('ai_analysis_results').$type<{
    predictedLifespan?: number;
    maintenanceCosts?: number;
    energyEfficiency?: number;
    riskFactors?: string[];
    optimizationRecommendations?: string[];
  }>(),

  uncertaintyQuantification: json('uncertainty_quantification').$type<{
    costUncertainty?: number;
    modelConfidence?: number;
    dataQuality?: number;
  }>(),

  // Regional and Adjustment Factors
  region: text('region').notNull().default('BC-CENTRAL'),
  adjustmentFactor: real('adjustment_factor').default(1.0),

  // Documentation
  documentReference: text('document_reference'),
  imageUrls: json('image_urls').$type<string[]>(),
  additionalFeatures: json('additional_features').$type<Record<string, any>>(),

  // Timestamps
  lastUpdated: timestamp('last_updated').defaultNow(),
  lastAiAnalysis: timestamp('last_ai_analysis'),
});

/*********************
 * QUANTUM COST INTELLIGENCE MATRIX
 *********************/

// Advanced Cost Matrix with AI Enhancement
export const costMatrix = pgTable('cost_matrix', {
  id: serial('id').primaryKey(),
  buildingType: text('building_type').notNull(),
  region: text('region').notNull(),
  year: integer('matrix_year').notNull(),
  baseRate: real('base_cost').notNull(),
  description: text('matrix_description'),

  // Quantum Intelligence Fields
  aiEnhancedRate: real('ai_enhanced_rate'), // AI-adjusted cost
  predictionAccuracy: real('prediction_accuracy'), // Historical accuracy
  uncertaintyBounds: json('uncertainty_bounds').$type<{ lower: number; upper: number }>(),

  // Factor Analysis
  complexityFactorBase: real('complexity_factor_base').default(1.0),
  qualityFactorBase: real('quality_factor_base').default(1.0),
  conditionFactorBase: real('condition_factor_base').default(1.0),

  // Statistical Metadata
  dataPoints: integer('data_points'),
  minCost: real('min_cost'),
  maxCost: real('max_cost'),
  standardDeviation: real('standard_deviation'),
  confidenceInterval: json('confidence_interval').$type<{ lower: number; upper: number }>(),

  // Geographic
  county: text('county'),
  state: text('state'),

  // Source and Quality
  sourceMatrixId: integer('source_matrix_id'),
  buildingTypeDescription: text('building_type_description'),
  dataQualityScore: real('data_quality_score'), // 0-1 quality assessment

  // Status
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastAiUpdate: timestamp('last_ai_update'),
});

// Building Types with Enhanced Intelligence
export const buildingTypes = pgTable('building_types', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),

  // Base Rates
  baseRateMin: real('base_rate_min'),
  baseRateMax: real('base_rate_max'),
  baseRateAvg: real('base_rate_avg'),

  // AI Enhancement
  aiOptimizedRate: real('ai_optimized_rate'),
  predictionModel: text('prediction_model'), // Which AI model to use

  // Metadata
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

// Regional Intelligence Factors
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  state: text('state').notNull(),
  county: text('county'),

  // Cost Multipliers
  multiplier: real('multiplier').notNull().default(1.0),
  aiAdjustedMultiplier: real('ai_adjusted_multiplier'),

  // Market Intelligence
  marketTrends: json('market_trends').$type<{
    appreciationRate?: number;
    volatility?: number;
    demandIndex?: number;
  }>(),

  // Geographic Factors
  economicFactors: json('economic_factors').$type<{
    averageIncome?: number;
    unemploymentRate?: number;
    costOfLiving?: number;
  }>(),

  // Quality and Source
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

/*********************
 * QUANTUM CALCULATIONS & ANALYSIS
 *********************/

// Enhanced Calculation History with AI Insights
export const calculations = pgTable('calculation_history', {
  id: serial('id').primaryKey(),
  calculationId: uuid('calculation_id').defaultRandom().notNull().unique(),
  userId: text('user_id').references(() => users.id),

  // Basic Calculation Data
  squareFootage: integer('square_footage'),
  buildingType: text('building_type'),
  region: text('region'),
  quality: text('quality'),
  complexity: text('complexity'),
  condition: text('condition'),

  // Cost Results
  baseCost: real('base_cost'),
  costPerSqft: real('cost_per_sqft'),
  totalCost: real('total_cost'),
  adjustedCost: real('adjusted_cost'),
  assessedValue: real('assessed_value'),

  // Factors Applied
  qualityFactor: real('quality_factor'),
  complexityFactor: real('complexity_factor'),
  conditionFactor: real('condition_factor'),
  regionFactor: real('region_factor'),

  // Quantum Analysis Results
  aiModel: text('ai_model'), // Which AI model was used
  aiConfidence: real('ai_confidence'), // Model confidence score
  uncertaintyRange: json('uncertainty_range').$type<{ min: number; max: number }>(),

  // Statistical Analysis
  bayesianResults: json('bayesian_results').$type<{
    posteriorMean?: number;
    credibleInterval?: [number, number];
    modelEvidence?: number;
  }>(),

  monteCarloResults: json('monte_carlo_results').$type<{
    meanEstimate?: number;
    standardError?: number;
    probabilityDistribution?: number[];
  }>(),

  regressionResults: json('regression_results').$type<{
    rSquared?: number;
    coefficients?: Record<string, number>;
    residualAnalysis?: any;
  }>(),

  // Research Insights
  aiInsights: json('ai_insights').$type<string[]>(),
  recommendations: json('recommendations').$type<string[]>(),
  riskFactors: json('risk_factors').$type<string[]>(),

  // Metadata
  name: text('name'),
  calculationMethod: text('calculation_method'), // 'standard', 'bayesian', 'monte_carlo', 'quantum'
  analysisDepth: text('analysis_depth'), // 'basic', 'advanced', 'phd_level'

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

/*********************
 * AI AGENT STATUS & MONITORING
 *********************/

// Enhanced Agent Status for Quantum Intelligence
export const agentStatus = pgTable('agent_status', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull().unique(),
  agentType: text('agent_type').notNull(), // 'analysis', 'prediction', 'research', 'quantum'
  status: text('status').notNull().default('offline'), // 'online', 'offline', 'processing', 'error'

  // Performance Metrics
  lastActive: timestamp('last_active').defaultNow(),
  processingLoad: real('processing_load'), // 0-1 current load
  accuracyScore: real('accuracy_score'), // Historical accuracy
  responsiveness: real('responsiveness'), // Average response time

  // Capabilities
  capabilities: json('capabilities').$type<string[]>(),
  supportedModels: json('supported_models').$type<string[]>(),

  // Health Monitoring
  errorMessage: text('error_message'),
  errorCount: integer('error_count').default(0),
  lastErrorTime: timestamp('last_error_time'),

  // Quantum Metrics
  quantumProcessingCapability: boolean('quantum_processing_capability').default(false),
  neuralNetworkVersion: text('neural_network_version'),

  // Metadata
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/*********************
 * RESEARCH & ANALYSIS SESSIONS
 *********************/

// PhD-Level Research Sessions
export const researchSessions = pgTable('research_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),

  // Session Details
  title: text('title').notNull(),
  description: text('description'),
  researchType: text('research_type'), // 'comparative', 'predictive', 'causal', 'exploratory'
  methodology: text('methodology'), // 'bayesian', 'frequentist', 'quantum', 'hybrid'

  // Analysis Configuration
  analysisParameters: json('analysis_parameters').$type<{
    confidenceLevel?: number;
    iterations?: number;
    priorDistribution?: string;
    kernelFunction?: string;
  }>(),

  // Results
  findings: json('findings').$type<{
    hypothesis?: string;
    conclusion?: string;
    statisticalSignificance?: number;
    effectSize?: number;
  }>(),

  // Data and References
  dataSourcesUsed: json('data_sources_used').$type<string[]>(),
  calculationsIncluded: json('calculations_included').$type<string[]>(),
  literatureReferences: json('literature_references').$type<string[]>(),

  // Quality Metrics
  researchQualityScore: real('research_quality_score'),
  peerReviewStatus: text('peer_review_status'), // 'pending', 'approved', 'requires_revision'

  // Status and Timeline
  status: text('status').default('active'), // 'active', 'completed', 'archived'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  lastActivity: timestamp('last_activity').defaultNow(),
});

/*********************
 * RELATIONS
 *********************/

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  calculations: many(calculations),
  researchSessions: many(researchSessions),
}));

// Properties relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  improvements: many(improvements),
}));

// Improvements relations
export const improvementsRelations = relations(improvements, ({ one }) => ({
  property: one(properties, {
    fields: [improvements.propertyId],
    references: [properties.propertyId],
  }),
}));

// Calculations relations
export const calculationsRelations = relations(calculations, ({ one }) => ({
  user: one(users, {
    fields: [calculations.userId],
    references: [users.id],
  }),
}));

// Research Sessions relations
export const researchSessionsRelations = relations(researchSessions, ({ one }) => ({
  researcher: one(users, {
    fields: [researchSessions.userId],
    references: [users.id],
  }),
}));

/*********************
 * INSERT SCHEMAS
 *********************/

// Core Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastAssessment: true,
  lastAiAnalysis: true,
});

export const insertImprovementSchema = createInsertSchema(improvements).omit({
  id: true,
  lastUpdated: true,
  lastAiAnalysis: true,
});

export const insertCostMatrixSchema = createInsertSchema(costMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastAiUpdate: true,
});

export const insertCalculationSchema = createInsertSchema(calculations).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResearchSessionSchema = createInsertSchema(researchSessions).omit({
  id: true,
  startedAt: true,
  lastActivity: true,
});

/*********************
 * TYPE EXPORTS
 *********************/

// Core Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Improvement = typeof improvements.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;

export type CostMatrix = typeof costMatrix.$inferSelect;
export type InsertCostMatrix = z.infer<typeof insertCostMatrixSchema>;

export type Calculation = typeof calculations.$inferSelect;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;

export type BuildingType = typeof buildingTypes.$inferSelect;
export type Region = typeof regions.$inferSelect;

export type AgentStatus = typeof agentStatus.$inferSelect;
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;

export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;

// Quantum Analysis Types
export interface QuantumAnalysisResult {
  propertyId: string;
  confidence: number;
  uncertaintyMetrics: {
    bayesianUncertainty: number;
    monteCarloVariance: number;
    modelUncertainty: number;
  };
  recommendations: string[];
  riskFactors: string[];
}

export interface MaterialPhysicsAnalysis {
  density: number;
  thermalConductivity: number;
  structuralIntegrity: number;
  quantumMaterialProperties: any[];
}

export interface AIInsightResult {
  insight: string;
  confidence: number;
  supportingData: any[];
  methodology: string;
}

// Research Configuration Types
export interface BayesianAnalysisConfig {
  priorType: 'jeffreys' | 'conjugate' | 'non_informative';
  iterations: number;
  convergenceThreshold: number;
}

export interface MonteCarloConfig {
  samples: number;
  uncertaintyModel: any;
  convergenceThreshold: number;
}

export interface RegressionConfig {
  modelType: 'linear' | 'polynomial' | 'ridge' | 'lasso' | 'elastic_net';
  regularizationParameter?: number;
  polynomialDegree?: number;
}

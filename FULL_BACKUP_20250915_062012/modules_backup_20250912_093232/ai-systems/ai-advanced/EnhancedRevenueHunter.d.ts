import { EventEmitter } from 'events';
import { SwarmReport } from './RevenueHunterSwarm.js';
export interface MLModel {
  modelType: string;
  features: string[];
  accuracy: number;
  lastTrained: string;
}
export interface LearningEngine {
  enabled: boolean;
  learningRate: number;
  batchSize: number;
  updateFrequency: string;
  validationSplit: number;
  metricsTracking: string[];
}
export interface PredictiveAnalytics {
  enabled: boolean;
  forecastHorizon: string;
  confidenceThreshold: number;
  alertThresholds: Record<string, number>;
}
export interface CompetitiveIntelligence {
  enabled: boolean;
  benchmarkSources: string[];
  updateFrequency: string;
  analysisDepth: string;
}
export interface EnhancedSwarmReport extends SwarmReport {
  mlPredictions: any;
  learningInsights: any;
  predictiveForecasts: any;
  competitiveAnalysis: any;
  enhancedRecommendations: string[];
  automationOpportunities: string[];
  riskAssessment: any;
}
export declare class EnhancedRevenueHunter extends EventEmitter {
  private mlModels;
  private learningEngine;
  private predictiveAnalytics;
  private realTimeMonitor;
  private competitiveIntelligence;
  private isInitialized;
  constructor();
  /**
   * Initialize enhanced capabilities
   */
  initialize(): Promise<void>;
  /**
   * Initialize all components
   */
  private initializeComponents;
  /**
   * Load pre-trained ML models for better revenue prediction
   */
  private loadMLModels;
  /**
   * Set up continuous learning from discoveries
   */
  private setupLearningEngine;
  /**
   * Initialize predictive analytics capabilities
   */
  private initializePredictiveAnalytics;
  /**
   * Set up real-time monitoring
   */
  private setupRealTimeMonitoring;
  /**
   * Initialize competitive intelligence
   */
  private initializeCompetitiveIntelligence;
  /**
   * Launch enhanced revenue hunting with ML capabilities
   */
  launchEnhancedHunting(jurisdiction: string, swarmSize?: number): Promise<EnhancedSwarmReport>;
  /**
   * Apply ML predictions to enhance discovery accuracy
   */
  private applyMLPredictions;
  /**
   * Generate learning insights from discovery patterns
   */
  private generateLearningInsights;
  /**
   * Generate predictive forecasts for revenue opportunities
   */
  private generatePredictiveForecasts;
  /**
   * Perform competitive analysis against peer jurisdictions
   */
  private performCompetitiveAnalysis;
  /**
   * Generate enhanced recommendations using ML insights
   */
  private generateEnhancedRecommendations;
  /**
   * Identify automation opportunities
   */
  private identifyAutomationOpportunities;
  /**
   * Perform comprehensive risk assessment
   */
  private performRiskAssessment;
  /**
   * Update learning models with new discovery data
   */
  private updateLearningModels;
  /**
   * Start continuous learning background process
   */
  private startContinuousLearning;
  /**
   * Perform continuous learning updates
   */
  private performContinuousLearning;
  /**
   * Get ML models status
   */
  getMLModelsStatus(): Record<string, MLModel>;
  /**
   * Get learning engine status
   */
  getLearningEngineStatus(): LearningEngine;
  /**
   * Get predictive analytics status
   */
  getPredictiveAnalyticsStatus(): PredictiveAnalytics;
}
export declare const enhancedRevenueHunter: EnhancedRevenueHunter;
//# sourceMappingURL=EnhancedRevenueHunter.d.ts.map

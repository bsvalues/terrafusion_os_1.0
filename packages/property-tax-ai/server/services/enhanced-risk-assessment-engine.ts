/**
 * Enhanced Risk Assessment Engine
 * 
 * An enhanced version of the RiskAssessmentEngine with improved error handling,
 * logging, and performance monitoring.
 */

import { 
  RiskAssessmentEngine, 
  RiskAssessment, 
  RiskFactor, 
  RegulatoryFramework 
} from './risk-assessment-engine';
import { IStorage } from '../storage';
import { LLMService } from './llm-service';
import { logger } from '../utils/logger';
import { ErrorHandler, ErrorType } from '../utils/error-handler';
import { enhanceMarketStorageMethods } from '../utils/storage-enhancer';

export class EnhancedRiskAssessmentEngine extends RiskAssessmentEngine {
  private enhancedStorage: IStorage;

  constructor(storage: IStorage, llmService?: LLMService) {
    // Enhance storage with error handling for risk assessment methods
    const enhancedStorage = enhanceMarketStorageMethods(storage);
    
    // Call parent constructor with enhanced storage
    super(enhancedStorage, llmService);
    
    // Store reference to enhanced storage
    this.enhancedStorage = enhancedStorage;
    
    logger.info('Enhanced Risk Assessment Engine initialized', {
      component: 'EnhancedRiskAssessmentEngine'
    });
  }
  
  /**
   * Override assessPropertyRisks with enhanced error handling
   */
  public async assessPropertyRisks(propertyId: string): Promise<RiskAssessment> {
    const startTime = Date.now();
    logger.debug(`Starting risk assessment for property ${propertyId}`, {
      component: 'EnhancedRiskAssessmentEngine',
      metadata: { propertyId }
    });
    
    try {
      // Call parent method
      const result = await super.assessPropertyRisks(propertyId);
      
      const duration = Date.now() - startTime;
      logger.info(`Completed risk assessment for property ${propertyId} in ${duration}ms`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          propertyId, 
          duration,
          overallRiskScore: result.overallRiskScore,
          confidenceScore: result.confidenceScore,
          riskFactorCount: result.riskFactors.length,
          categoryCount: Object.keys(result.riskCategories).length
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed to assess risks for property ${propertyId}`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          propertyId, 
          duration,
          error
        }
      });
      
      // Transform error to AppError
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
        } else {
          throw ErrorHandler.handleError(error, 'assessPropertyRisks');
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Override getRegulatoryFramework with enhanced error handling
   */
  public async getRegulatoryFramework(region: string): Promise<RegulatoryFramework> {
    const startTime = Date.now();
    logger.debug(`Fetching regulatory framework for region ${region}`, {
      component: 'EnhancedRiskAssessmentEngine',
      metadata: { region }
    });
    
    try {
      // Call parent method
      const result = await super.getRegulatoryFramework(region);
      
      const duration = Date.now() - startTime;
      logger.info(`Retrieved regulatory framework for region ${region} in ${duration}ms`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          region, 
          duration,
          zoningRegulationsCount: result.zoningRegulations.length,
          buildingCodesCount: result.buildingCodes.length,
          environmentalRegulationsCount: result.environmentalRegulations.length,
          taxPoliciesCount: result.taxPolicies.length
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed to get regulatory framework for region ${region}`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          region,
          duration,
          error
        }
      });
      
      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getRegulatoryFramework');
      }
      
      throw error;
    }
  }
  
  /**
   * Override getHistoricalRegulatoryChanges with enhanced error handling
   */
  public async getHistoricalRegulatoryChanges(region: string): Promise<any[]> {
    const startTime = Date.now();
    logger.debug(`Fetching historical regulatory changes for region ${region}`, {
      component: 'EnhancedRiskAssessmentEngine',
      metadata: { region }
    });
    
    try {
      // Call parent method
      const result = await super.getHistoricalRegulatoryChanges(region);
      
      const duration = Date.now() - startTime;
      logger.info(`Retrieved ${result.length} historical regulatory changes for region ${region} in ${duration}ms`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          region, 
          changesCount: result.length,
          duration
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed to get historical regulatory changes for region ${region}`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          region,
          duration,
          error
        }
      });
      
      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'getHistoricalRegulatoryChanges');
      }
      
      throw error;
    }
  }
  
  /**
   * Override getEnvironmentalRisks with enhanced error handling
   */
  public async getEnvironmentalRisks(propertyId: string): Promise<any> {
    const startTime = Date.now();
    logger.debug(`Fetching environmental risks for property ${propertyId}`, {
      component: 'EnhancedRiskAssessmentEngine',
      metadata: { propertyId }
    });
    
    try {
      // Call parent method
      const result = await super.getEnvironmentalRisks(propertyId);
      
      const duration = Date.now() - startTime;
      logger.info(`Retrieved environmental risks for property ${propertyId} in ${duration}ms`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          propertyId, 
          risksCount: result.risks?.length || 0,
          hazardsCount: result.hazards?.length || 0,
          duration
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed to get environmental risks for property ${propertyId}`, {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          propertyId,
          duration,
          error
        }
      });
      
      // Transform error to AppError
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
        } else {
          throw ErrorHandler.handleError(error, 'getEnvironmentalRisks');
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Override calculateCompositScore with enhanced error handling
   */
  public calculateCompositeScore(scores: number[], weights: number[]): number {
    try {
      // Basic validation
      if (scores.length !== weights.length) {
        throw ErrorHandler.validation('Scores and weights arrays must be the same length');
      }
      
      if (weights.reduce((sum, weight) => sum + weight, 0) !== 1) {
        logger.warn('Weights do not sum to 1, normalizing', {
          component: 'EnhancedRiskAssessmentEngine',
          metadata: { weights }
        });
        
        // Normalize weights to sum to 1
        const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
        weights = weights.map(weight => weight / weightSum);
      }
      
      // Call parent method by implementing the calculation directly
      let weightedSum = 0;
      for (let i = 0; i < scores.length; i++) {
        weightedSum += scores[i] * weights[i];
      }
      return weightedSum;
      
    } catch (error) {
      logger.error('Failed to calculate composite score', {
        component: 'EnhancedRiskAssessmentEngine',
        metadata: { 
          scores,
          weights,
          error
        }
      });
      
      // Transform error to AppError
      if (error instanceof Error) {
        throw ErrorHandler.handleError(error, 'calculateCompositeScore');
      }
      
      throw error;
    }
  }
}
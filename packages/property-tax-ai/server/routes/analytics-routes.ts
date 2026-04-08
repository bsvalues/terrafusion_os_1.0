/**
 * Advanced Analytics API Routes
 * 
 * Provides endpoints for advanced analytics capabilities including
 * investment analysis, neighborhood analysis, and sensitivity analysis.
 */

import { Router } from 'express';
import { IStorage } from '../storage';
import { EnhancedMarketPredictionModel } from '../services/enhanced-market-prediction-model';
import { EnhancedRiskAssessmentEngine } from '../services/enhanced-risk-assessment-engine';
import { AdvancedAnalyticsService } from '../services/advanced-analytics-service';
import { LLMService } from '../services/llm-service';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { asyncHandler } from '../middleware/error-middleware';

export function createAnalyticsRoutes(
  storage: IStorage, 
  marketPredictionModel: EnhancedMarketPredictionModel,
  riskAssessmentEngine: EnhancedRiskAssessmentEngine,
  llmService: LLMService
) {
  const router = Router();
  const analyticsService = new AdvancedAnalyticsService(
    storage,
    marketPredictionModel,
    riskAssessmentEngine,
    llmService
  );
  
  /**
   * Get investment opportunity analysis for a property
   * GET /api/analytics/investment/:propertyId
   */
  router.get('/investment/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    
    logger.info(`Getting investment opportunity analysis for property: ${propertyId}`, {
      component: 'analytics-routes',
      metadata: { propertyId }
    });
    
    // Check if property exists
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    const analysis = await analyticsService.generateInvestmentOpportunityAnalysis(propertyId);
    res.json(analysis);
  }));
  
  /**
   * Get neighborhood analysis for a zip code
   * GET /api/analytics/neighborhood/:zipCode?radius=:radius&includeComparables=:includeComparables
   */
  router.get('/neighborhood/:zipCode', asyncHandler(async (req, res) => {
    const zipCode = req.params.zipCode;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 1;
    const includeComparables = req.query.includeComparables !== 'false';
    
    logger.info(`Getting neighborhood analysis for zip code: ${zipCode}`, {
      component: 'analytics-routes',
      metadata: { zipCode, radius, includeComparables }
    });
    
    const analysis = await analyticsService.generateNeighborhoodAnalysis(
      zipCode,
      radius,
      includeComparables
    );
    res.json(analysis);
  }));
  
  /**
   * Get valuation sensitivity analysis for a property
   * GET /api/analytics/sensitivity/:propertyId
   */
  router.get('/sensitivity/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    
    logger.info(`Getting valuation sensitivity analysis for property: ${propertyId}`, {
      component: 'analytics-routes',
      metadata: { propertyId }
    });
    
    // Check if property exists
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    const analysis = await analyticsService.generateValuationSensitivityAnalysis(propertyId);
    res.json(analysis);
  }));
  
  return router;
}
/**
 * Market Analysis API Routes
 * 
 * Provides endpoints for market trends, economic indicators, and property value predictions.
 */

import { Router } from 'express';
import { IStorage } from '../storage';
import { EnhancedMarketPredictionModel } from '../services/enhanced-market-prediction-model';
import { LLMService } from '../services/llm-service';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { asyncHandler } from '../middleware/error-middleware';

export function createMarketRoutes(storage: IStorage, llmService: LLMService) {
  const router = Router();
  const marketPredictionModel = new EnhancedMarketPredictionModel(storage, llmService);
  
  /**
   * Get market trends for a specific region
   * GET /api/market/trends?region=:region
   */
  router.get('/trends', asyncHandler(async (req, res) => {
    const region = req.query.region as string;
    
    if (!region) {
      throw ErrorHandler.validation('Region parameter is required');
    }
    
    logger.info(`Getting market trends for region: ${region}`, {
      component: 'market-routes',
      metadata: { region }
    });
    
    const trends = await marketPredictionModel.getMarketTrends(region);
    res.json(trends);
  }));
  
  /**
   * Get market trends for a specific property
   * GET /api/market/trends/property/:propertyId
   */
  router.get('/trends/property/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    
    logger.info(`Getting market trends for property: ${propertyId}`, {
      component: 'market-routes',
      metadata: { propertyId }
    });
    
    // Get the property to find its region
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    // Extract region from property data (using address as fallback)
    const region = property.region || property.address.split(',').pop()?.trim() || 'Unknown';
    
    const trends = await marketPredictionModel.getMarketTrends(region);
    res.json(trends);
  }));
  
  /**
   * Get economic indicators for a region
   * GET /api/market/economic-indicators?region=:region
   */
  router.get('/economic-indicators', asyncHandler(async (req, res) => {
    const region = req.query.region as string;
    
    if (!region) {
      throw ErrorHandler.validation('Region parameter is required');
    }
    
    logger.info(`Getting economic indicators for region: ${region}`, {
      component: 'market-routes',
      metadata: { region }
    });
    
    const indicators = await marketPredictionModel.getEconomicIndicators(region);
    res.json(indicators);
  }));
  
  /**
   * Get economic indicators for a specific property
   * GET /api/market/economic-indicators/property/:propertyId
   */
  router.get('/economic-indicators/property/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    
    logger.info(`Getting economic indicators for property: ${propertyId}`, {
      component: 'market-routes',
      metadata: { propertyId }
    });
    
    // Get the property to find its region
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    // Extract region from property data (using address as fallback)
    const region = property.region || property.address.split(',').pop()?.trim() || 'Unknown';
    
    const indicators = await marketPredictionModel.getEconomicIndicators(region);
    res.json(indicators);
  }));
  
  /**
   * Get economic forecasts for a region
   * GET /api/market/economic-forecasts?region=:region&years=:years
   */
  router.get('/economic-forecasts', asyncHandler(async (req, res) => {
    const region = req.query.region as string;
    const years = parseInt(req.query.years as string || '5');
    
    if (!region) {
      throw ErrorHandler.validation('Region parameter is required');
    }
    
    logger.info(`Getting economic forecasts for region: ${region}, years: ${years}`, {
      component: 'market-routes',
      metadata: { region, years }
    });
    
    const forecasts = await marketPredictionModel.getEconomicForecasts(region, years);
    res.json(forecasts);
  }));
  
  /**
   * Get historical market data for a region
   * GET /api/market/historical-data?region=:region
   */
  router.get('/historical-data', asyncHandler(async (req, res) => {
    const region = req.query.region as string;
    
    if (!region) {
      throw ErrorHandler.validation('Region parameter is required');
    }
    
    logger.info(`Getting historical market data for region: ${region}`, {
      component: 'market-routes',
      metadata: { region }
    });
    
    const historicalData = await marketPredictionModel.getHistoricalData(region);
    res.json(historicalData);
  }));
  
  /**
   * Predict future property value
   * GET /api/market/future-value/:propertyId?years=:years
   */
  router.get('/future-value/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    const years = parseInt(req.query.years as string || '5');
    
    logger.info(`Predicting future value for property: ${propertyId}, years: ${years}`, {
      component: 'market-routes',
      metadata: { propertyId, years }
    });
    
    // Check if property exists
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    const prediction = await marketPredictionModel.predictForProperty(propertyId, years);
    
    // Enhance the prediction with confidence intervals and additional metadata
    const enhancedPrediction = {
      propertyId: property.propertyId,
      address: property.address,
      currentValue: prediction.currentValue,
      predictedValues: prediction.predictedValues.map((pred, index) => {
        const year = pred.year - new Date().getFullYear();
        const confidence = pred.confidence;
        const value = pred.value;
        
        // Calculate confidence interval based on confidence level
        const variability = (1 - confidence) * value * 0.5;
        
        return {
          timeframe: year.toString(),
          value,
          confidenceInterval: {
            lower: Math.round(value - variability),
            upper: Math.round(value + variability)
          },
          confidenceLevel: confidence
        };
      }),
      influencingFactors: prediction.influencingFactors.map(factor => ({
        factor: factor.factor,
        impact: factor.impact > 0 ? 'positive' : factor.impact < 0 ? 'negative' : 'neutral',
        weight: Math.abs(factor.impact) / 10, // Normalize to 0-1 scale
        description: `This factor ${factor.impact > 0 ? 'positively' : 'negatively'} impacts the property value with ${Math.abs(factor.impact).toFixed(1)} points of influence.`
      })),
      methodology: "Combined statistical analysis with AI-augmented predictive modeling and comparable property analysis",
      generatedDate: new Date().toISOString()
    };
    
    res.json(enhancedPrediction);
  }));
  
  return router;
}
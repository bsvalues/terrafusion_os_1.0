/**
 * Risk Assessment API Routes
 * 
 * Provides endpoints for property risk assessment, regulatory framework analysis,
 * and environmental risk evaluation.
 */

import { Router } from 'express';
import { IStorage } from '../storage';
import { EnhancedRiskAssessmentEngine } from '../services/enhanced-risk-assessment-engine';
import { LLMService } from '../services/llm-service';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { asyncHandler } from '../middleware/error-middleware';

export function createRiskRoutes(storage: IStorage, llmService: LLMService) {
  const router = Router();
  const riskAssessmentEngine = new EnhancedRiskAssessmentEngine(storage, llmService);
  
  /**
   * Get regulatory framework for a region
   * GET /api/risk-assessment/regulatory-framework?region=:region
   */
  router.get('/regulatory-framework', asyncHandler(async (req, res) => {
    const region = req.query.region as string;
    
    if (!region) {
      throw ErrorHandler.validation('Region parameter is required');
    }
    
    logger.info(`Getting regulatory framework for region: ${region}`, {
      component: 'risk-routes',
      metadata: { region }
    });
    
    const framework = await riskAssessmentEngine.getRegulatoryFramework(region);
    res.json(framework);
  }));
  
  /**
   * Get historical regulatory changes for a region
   * GET /api/risk-assessment/regulatory-changes?region=:region
   */
  router.get('/regulatory-changes', asyncHandler(async (req, res) => {
    const region = req.query.region as string;
    
    if (!region) {
      throw ErrorHandler.validation('Region parameter is required');
    }
    
    logger.info(`Getting historical regulatory changes for region: ${region}`, {
      component: 'risk-routes',
      metadata: { region }
    });
    
    const changes = await riskAssessmentEngine.getHistoricalRegulatoryChanges(region);
    res.json(changes);
  }));
  
  /**
   * Get environmental risks for a property
   * GET /api/risk-assessment/environmental-risks/:propertyId
   */
  router.get('/environmental-risks/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    
    logger.info(`Getting environmental risks for property: ${propertyId}`, {
      component: 'risk-routes',
      metadata: { propertyId }
    });
    
    // Check if property exists
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    const environmentalRisks = await riskAssessmentEngine.getEnvironmentalRisks(propertyId);
    res.json(environmentalRisks);
  }));
  
  /**
   * Get full risk assessment for a property
   * GET /api/risk-assessment/:propertyId
   */
  router.get('/:propertyId', asyncHandler(async (req, res) => {
    const propertyId = req.params.propertyId;
    
    logger.info(`Getting full risk assessment for property: ${propertyId}`, {
      component: 'risk-routes',
      metadata: { propertyId }
    });
    
    // Check if property exists
    const property = await storage.getPropertyByPropertyId(propertyId);
    
    if (!property) {
      throw ErrorHandler.notFound(`Property with ID ${propertyId} not found`);
    }
    
    // Get the full risk assessment
    const assessment = await riskAssessmentEngine.assessPropertyRisks(propertyId);
    
    // Enhanced response structure with additional details
    const enhancedAssessment = {
      propertyId: property.propertyId,
      address: property.address,
      overallRiskScore: assessment.overallRiskScore,
      riskLevel: getRiskLevel(assessment.overallRiskScore),
      riskFactors: assessment.riskFactors.map(factor => ({
        category: factor.category,
        score: factor.score,
        level: getRiskLevel(factor.score),
        description: factor.description,
        mitigationSuggestions: factor.mitigationStrategies || []
      })),
      economicFactors: await getEconomicRiskFactors(property.region || 'unknown'),
      regulatoryFactors: await getRegulatoryRiskFactors(property.region || 'unknown'),
      environmentalFactors: await getEnvironmentalRiskFactors(propertyId),
      generatedDate: new Date().toISOString()
    };
    
    res.json(enhancedAssessment);
  }));
  
  /**
   * Helper function to get risk level text based on score
   */
  function getRiskLevel(score: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Very High';
  }
  
  /**
   * Get economic risk factors for a region
   */
  async function getEconomicRiskFactors(region: string) {
    try {
      // Get economic indicators and extract key risk factors
      const economicIndicators = await storage.getEconomicIndicators(region);
      
      // Identify top economic risk factors
      return economicIndicators
        .filter(indicator => indicator.significance > 0.7) // Only include significant factors
        .map(indicator => ({
          name: indicator.name,
          impact: indicator.impact === 'negative' ? 'High' : 
                 indicator.impact === 'positive' ? 'Low' : 'Moderate',
          trend: indicator.value > 0 ? 'Increasing' : indicator.value < 0 ? 'Decreasing' : 'Stable',
          description: `This economic indicator is showing a ${indicator.value.toFixed(1)}% change, which has a ${indicator.impact} impact on property values in this region.`
        }))
        .slice(0, 3); // Top 3 economic risk factors
    } catch (error) {
      logger.error(`Error getting economic risk factors: ${error}`, {
        component: 'risk-routes',
        metadata: { region, error }
      });
      return [];
    }
  }
  
  /**
   * Get regulatory risk factors for a region
   */
  async function getRegulatoryRiskFactors(region: string) {
    try {
      // Get recent regulatory changes
      const regulatoryChanges = await riskAssessmentEngine.getHistoricalRegulatoryChanges(region);
      
      // Identify top regulatory risk factors
      return regulatoryChanges
        .filter(change => change.impact.toLowerCase().includes('high') || 
                         change.marketEffect.toLowerCase().includes('negative'))
        .map(change => ({
          name: change.category,
          impact: change.impact,
          probability: 'High', // Default probability for historical changes
          description: `${change.description} This change impacts property markets through: ${change.marketEffect}`
        }))
        .slice(0, 3); // Top 3 regulatory risk factors
    } catch (error) {
      logger.error(`Error getting regulatory risk factors: ${error}`, {
        component: 'risk-routes',
        metadata: { region, error }
      });
      return [];
    }
  }
  
  /**
   * Get environmental risk factors for a property
   */
  async function getEnvironmentalRiskFactors(propertyId: string) {
    try {
      // Get environmental risks
      const environmentalRisks = await riskAssessmentEngine.getEnvironmentalRisks(propertyId);
      
      // Convert to standard format
      return [
        ...environmentalRisks.risks.map(risk => ({
          name: risk.type,
          impact: risk.level,
          probability: 'High',
          description: risk.description
        })),
        ...environmentalRisks.hazards.map(hazard => ({
          name: hazard.type,
          impact: 'High',
          probability: hazard.probability,
          description: hazard.description
        }))
      ].slice(0, 3); // Top 3 environmental risk factors
    } catch (error) {
      logger.error(`Error getting environmental risk factors: ${error}`, {
        component: 'risk-routes',
        metadata: { propertyId, error }
      });
      return [];
    }
  }
  
  return router;
}
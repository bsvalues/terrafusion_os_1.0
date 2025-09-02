/**
 * Cost Analysis Routes for CostForge AI Champion
 * 
 * Handles cost calculation, matrix management, and analysis workflows
 * combining traditional algorithms with AI-enhanced predictions.
 */

import { Router, Request, Response } from 'express';
import SupabaseService from '../services/database/SupabaseService.js';
import AnthropicService from '../services/ai/AnthropicService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ==================== COST CALCULATION ====================

/**
 * Calculate building cost using traditional matrix-based approach
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const {
      buildingType,
      squareFootage,
      region,
      quality,
      yearBuilt,
      conditionFactor,
      complexityFactor
    } = req.body;

    // Validate required fields
    if (!buildingType || !squareFootage || !region) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['buildingType', 'squareFootage', 'region']
      });
    }

    // Get cost matrices from database if available
    let costMatrices = [];
    if (SupabaseService.isAvailable()) {
      try {
        costMatrices = await SupabaseService.getCostMatricesByRegionAndType(region, buildingType);
      } catch (dbError) {
        logger.warn('Database lookup failed, using fallback calculation:', dbError);
      }
    }

    // Calculate base cost
    let baseCostPerSqFt = 150; // Default fallback
    
    if (costMatrices.length > 0) {
      // Find matching quality level or use closest
      const qualityMatch = costMatrices.find(m => m.quality_level.toLowerCase() === (quality || 'average').toLowerCase());
      if (qualityMatch) {
        baseCostPerSqFt = qualityMatch.cost_per_sqft;
      } else {
        // Use average of available matrices
        baseCostPerSqFt = costMatrices.reduce((sum, m) => sum + m.cost_per_sqft, 0) / costMatrices.length;
      }
    } else {
      // Fallback calculation based on building type
      const typeMuiltipliers = {
        'Residential': 1.0,
        'Commercial': 1.3,
        'Industrial': 1.5,
        'Agricultural': 0.8
      };
      baseCostPerSqFt *= typeMuiltipliers[buildingType as keyof typeof typeMuiltipliers] || 1.0;
    }

    const baseCost = Number(squareFootage) * baseCostPerSqFt;

    // Calculate adjustments
    const currentYear = new Date().getFullYear();
    const buildingAge = yearBuilt ? currentYear - Number(yearBuilt) : 0;
    const depreciationRate = Math.min(buildingAge * 0.01, 0.7); // 1% per year up to 70%
    const depreciationAdjustment = baseCost * depreciationRate * -1;

    const complexityAdjustment = baseCost * ((Number(complexityFactor) || 0.5) - 0.5) * 0.2;
    const conditionAdjustment = baseCost * ((Number(conditionFactor) || 0.8) - 0.5) * 0.3;

    const totalCost = Math.max(
      baseCost + complexityAdjustment + conditionAdjustment + depreciationAdjustment,
      0
    );

    // Create breakdown
    const breakdown = {
      foundation: totalCost * 0.15,
      framing: totalCost * 0.20,
      roofing: totalCost * 0.10,
      electrical: totalCost * 0.15,
      plumbing: totalCost * 0.12,
      hvac: totalCost * 0.08,
      finishes: totalCost * 0.20
    };

    const result = {
      baseCost,
      baseCostPerSqFt,
      totalCost,
      costPerSqFt: totalCost / Number(squareFootage),
      adjustments: {
        depreciation: depreciationAdjustment,
        complexity: complexityAdjustment,
        condition: conditionAdjustment
      },
      breakdown,
      metadata: {
        buildingAge,
        depreciationRate,
        matricesUsed: costMatrices.length,
        calculationMethod: costMatrices.length > 0 ? 'database-matrix' : 'fallback-algorithm'
      }
    };

    // Save analysis result if database is available
    if (SupabaseService.isAvailable()) {
      try {
        await SupabaseService.saveAnalysisResult({
          analysis_type: 'traditional-cost-calculation',
          input_data: req.body,
          result_data: result,
          confidence_score: costMatrices.length > 0 ? 0.8 : 0.6,
          ai_provider: 'traditional'
        });
      } catch (saveError) {
        logger.warn('Failed to save analysis result:', saveError);
      }
    }

    res.json({
      success: true,
      method: 'traditional-calculation',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in cost calculation:', error);
    res.status(500).json({
      error: 'Cost calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get enhanced cost analysis combining traditional and AI methods
 */
router.post('/enhanced-analysis', async (req: Request, res: Response) => {
  try {
    const inputData = req.body;

    // Run traditional calculation
    const traditionalResponse = await fetch(`${req.protocol}://${req.get('host')}/api/cost-analysis/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });
    
    const traditionalResult = await traditionalResponse.json();

    let aiResult = null;
    let aiProvider = null;

    // Try to get AI-enhanced prediction if available
    if (AnthropicService.isAvailable()) {
      try {
        aiResult = await AnthropicService.generateBuildingCostPrediction({
          buildingType: inputData.buildingType,
          squareFootage: Number(inputData.squareFootage),
          region: inputData.region,
          quality: inputData.quality || 'AVERAGE',
          buildingAge: inputData.buildingAge || 0,
          yearBuilt: Number(inputData.yearBuilt) || new Date().getFullYear(),
          complexityFactor: Number(inputData.complexityFactor) || 0.5,
          conditionFactor: Number(inputData.conditionFactor) || 0.8,
          features: inputData.features || []
        });
        aiProvider = 'anthropic';
      } catch (aiError) {
        logger.warn('AI enhancement failed:', aiError);
      }
    }

    // Compare results if both are available
    let comparison = null;
    if (aiResult && traditionalResult.success) {
      const traditionalCost = traditionalResult.totalCost;
      const aiCost = parseFloat(aiResult.totalCost.replace(/,/g, ''));
      const difference = Math.abs(traditionalCost - aiCost);
      const percentageDiff = (difference / traditionalCost) * 100;

      comparison = {
        traditionalCost,
        aiCost,
        difference,
        percentageDifference: percentageDiff,
        recommendation: percentageDiff < 10 ? 'High confidence - methods agree' : 
                       percentageDiff < 25 ? 'Moderate confidence - some variance' : 
                       'Low confidence - significant variance, manual review recommended'
      };
    }

    const result = {
      success: true,
      traditional: traditionalResult,
      ai: aiResult ? { 
        provider: aiProvider, 
        result: aiResult 
      } : null,
      comparison,
      recommendation: comparison ? 
        (comparison.percentageDifference < 10 ? traditionalResult : 
         'Manual review recommended due to significant variance between methods') :
        traditionalResult,
      timestamp: new Date().toISOString()
    };

    // Save enhanced analysis result
    if (SupabaseService.isAvailable()) {
      try {
        await SupabaseService.saveAnalysisResult({
          analysis_type: 'enhanced-cost-analysis',
          input_data: inputData,
          result_data: result,
          confidence_score: comparison ? 
            (comparison.percentageDifference < 10 ? 0.9 : 
             comparison.percentageDifference < 25 ? 0.7 : 0.5) : 0.6,
          ai_provider: aiProvider || 'traditional-only'
        });
      } catch (saveError) {
        logger.warn('Failed to save enhanced analysis result:', saveError);
      }
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in enhanced cost analysis:', error);
    res.status(500).json({
      error: 'Enhanced cost analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== COST MATRICES MANAGEMENT ====================

/**
 * Get all cost matrices
 */
router.get('/matrices', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available',
        message: 'Cost matrices require database connectivity'
      });
    }

    const { limit, offset } = req.query;
    const matrices = await SupabaseService.getAllCostMatrices({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });

    res.json({
      success: true,
      matrices,
      count: matrices.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching cost matrices:', error);
    res.status(500).json({
      error: 'Failed to fetch cost matrices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get cost matrices by region and building type
 */
router.get('/matrices/:region/:buildingType', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { region, buildingType } = req.params;
    const matrices = await SupabaseService.getCostMatricesByRegionAndType(region, buildingType);

    res.json({
      success: true,
      region,
      buildingType,
      matrices,
      count: matrices.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching cost matrices by region and type:', error);
    res.status(500).json({
      error: 'Failed to fetch cost matrices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create new cost matrix entry
 */
router.post('/matrices', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { region, building_type, cost_per_sqft, quality_level, metadata } = req.body;

    if (!region || !building_type || !cost_per_sqft || !quality_level) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['region', 'building_type', 'cost_per_sqft', 'quality_level']
      });
    }

    const matrix = await SupabaseService.createCostMatrix({
      region,
      building_type,
      cost_per_sqft: Number(cost_per_sqft),
      quality_level,
      metadata
    });

    res.status(201).json({
      success: true,
      matrix,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error creating cost matrix:', error);
    res.status(500).json({
      error: 'Failed to create cost matrix',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== ANALYSIS HISTORY ====================

/**
 * Get analysis history
 */
router.get('/history/:type?', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { type } = req.params;
    const { limit } = req.query;

    const analysisType = type || 'enhanced-cost-analysis';
    const results = await SupabaseService.getAnalysisResultsByType(
      analysisType, 
      limit ? Number(limit) : 50
    );

    res.json({
      success: true,
      analysisType,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching analysis history:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as costAnalysisRoutes };
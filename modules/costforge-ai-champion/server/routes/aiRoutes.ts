/**
 * AI Service Routes for CostForge AI Champion
 * 
 * Handles requests to AI services (Anthropic and OpenAI) for cost analysis,
 * natural language processing, and intelligent predictions.
 */

import { Router, Request, Response } from 'express';
import AnthropicService from '../services/ai/AnthropicService.js';
import OpenAIService from '../services/ai/OpenAIService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ==================== SERVICE STATUS ====================

router.get('/status', (req: Request, res: Response) => {
  const status = {
    anthropic: {
      available: AnthropicService.isAvailable(),
      provider: 'Anthropic Claude'
    },
    openai: {
      available: OpenAIService.isAvailable(),
      provider: 'OpenAI GPT'
    }
  };

  res.json({
    ...status,
    anyAvailable: Object.values(status).some(service => service.available),
    timestamp: new Date().toISOString()
  });
});

// ==================== ANTHROPIC ROUTES ====================

/**
 * Generate building cost prediction using Claude
 */
router.post('/anthropic/predict-cost', async (req: Request, res: Response) => {
  try {
    if (!AnthropicService.isAvailable()) {
      return res.status(503).json({
        error: 'Anthropic service is not available',
        message: 'Please check API key configuration'
      });
    }

    const {
      buildingType,
      squareFootage,
      region,
      quality,
      buildingAge,
      yearBuilt,
      complexityFactor,
      conditionFactor,
      features,
      targetYear
    } = req.body;

    // Validate required fields
    if (!buildingType || !squareFootage || !region || !quality) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['buildingType', 'squareFootage', 'region', 'quality']
      });
    }

    const result = await AnthropicService.generateBuildingCostPrediction({
      buildingType,
      squareFootage: Number(squareFootage),
      region,
      quality,
      buildingAge: Number(buildingAge) || 0,
      yearBuilt: Number(yearBuilt) || new Date().getFullYear(),
      complexityFactor: Number(complexityFactor) || 0.5,
      conditionFactor: Number(conditionFactor) || 0.8,
      features: features || [],
      targetYear: Number(targetYear)
    });

    res.json({
      success: true,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in Anthropic cost prediction:', error);
    res.status(500).json({
      error: 'Cost prediction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze material substitutions using Claude
 */
router.post('/anthropic/material-substitutions', async (req: Request, res: Response) => {
  try {
    if (!AnthropicService.isAvailable()) {
      return res.status(503).json({
        error: 'Anthropic service is not available',
        message: 'Please check API key configuration'
      });
    }

    const { materials, constraints } = req.body;

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        error: 'Materials array is required and must not be empty'
      });
    }

    const result = await AnthropicService.analyzeMaterialSubstitutions({
      materials,
      constraints: constraints || {}
    });

    res.json({
      success: true,
      provider: 'anthropic',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in Anthropic material substitutions:', error);
    res.status(500).json({
      error: 'Material substitution analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== OPENAI ROUTES ====================

/**
 * Perform natural language cost analysis using GPT
 */
router.post('/openai/analyze-cost', async (req: Request, res: Response) => {
  try {
    if (!OpenAIService.isAvailable()) {
      return res.status(503).json({
        error: 'OpenAI service is not available',
        message: 'Please check API key configuration'
      });
    }

    const { buildingType, squareFootage, region, features, constraints } = req.body;

    if (!buildingType || !squareFootage || !region) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['buildingType', 'squareFootage', 'region']
      });
    }

    const result = await OpenAIService.analyzeCostWithNLP({
      buildingType,
      squareFootage: Number(squareFootage),
      region,
      features: features || [],
      constraints
    });

    res.json({
      success: true,
      provider: 'openai',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in OpenAI cost analysis:', error);
    res.status(500).json({
      error: 'Natural language cost analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process natural language queries about cost data
 */
router.post('/openai/query', async (req: Request, res: Response) => {
  try {
    if (!OpenAIService.isAvailable()) {
      return res.status(503).json({
        error: 'OpenAI service is not available',
        message: 'Please check API key configuration'
      });
    }

    const { query, context } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    const result = await OpenAIService.processNaturalLanguageQuery({
      query,
      context
    });

    res.json({
      success: true,
      provider: 'openai',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in OpenAI natural language query:', error);
    res.status(500).json({
      error: 'Natural language query failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate embeddings for cost data
 */
router.post('/openai/embeddings', async (req: Request, res: Response) => {
  try {
    if (!OpenAIService.isAvailable()) {
      return res.status(503).json({
        error: 'OpenAI service is not available',
        message: 'Please check API key configuration'
      });
    }

    const { texts } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Texts array is required and must not be empty'
      });
    }

    if (texts.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 texts allowed per request'
      });
    }

    const embeddings = await OpenAIService.generateEmbeddings(texts);

    res.json({
      success: true,
      provider: 'openai',
      embeddings,
      count: embeddings.length,
      dimension: embeddings[0]?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in OpenAI embeddings generation:', error);
    res.status(500).json({
      error: 'Embedding generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Classify cost data using GPT
 */
router.post('/openai/classify', async (req: Request, res: Response) => {
  try {
    if (!OpenAIService.isAvailable()) {
      return res.status(503).json({
        error: 'OpenAI service is not available',
        message: 'Please check API key configuration'
      });
    }

    const { costData } = req.body;

    if (!costData) {
      return res.status(400).json({
        error: 'Cost data is required for classification'
      });
    }

    const classification = await OpenAIService.classifyCostData(costData);

    res.json({
      success: true,
      provider: 'openai',
      classification,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in OpenAI cost data classification:', error);
    res.status(500).json({
      error: 'Cost data classification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== COMBINED AI ROUTES ====================

/**
 * Get best available AI prediction (tries Anthropic first, falls back to OpenAI)
 */
router.post('/best-prediction', async (req: Request, res: Response) => {
  try {
    const {
      buildingType,
      squareFootage,
      region,
      quality,
      buildingAge,
      yearBuilt,
      complexityFactor,
      conditionFactor,
      features
    } = req.body;

    // Validate required fields
    if (!buildingType || !squareFootage || !region) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['buildingType', 'squareFootage', 'region']
      });
    }

    let result;
    let provider;

    // Try Anthropic first (generally better for structured analysis)
    if (AnthropicService.isAvailable()) {
      try {
        result = await AnthropicService.generateBuildingCostPrediction({
          buildingType,
          squareFootage: Number(squareFootage),
          region,
          quality: quality || 'AVERAGE',
          buildingAge: Number(buildingAge) || 0,
          yearBuilt: Number(yearBuilt) || new Date().getFullYear(),
          complexityFactor: Number(complexityFactor) || 0.5,
          conditionFactor: Number(conditionFactor) || 0.8,
          features: features || []
        });
        provider = 'anthropic';
      } catch (anthropicError) {
        logger.warn('Anthropic prediction failed, trying OpenAI:', anthropicError);
      }
    }

    // Fall back to OpenAI if Anthropic failed or isn't available
    if (!result && OpenAIService.isAvailable()) {
      try {
        const nlpResult = await OpenAIService.analyzeCostWithNLP({
          buildingType,
          squareFootage: Number(squareFootage),
          region,
          features: features || []
        });
        result = nlpResult;
        provider = 'openai';
      } catch (openaiError) {
        logger.error('OpenAI prediction also failed:', openaiError);
      }
    }

    if (!result) {
      return res.status(503).json({
        error: 'No AI services available or all failed',
        message: 'Please check service configurations and try again'
      });
    }

    res.json({
      success: true,
      provider,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in best prediction endpoint:', error);
    res.status(500).json({
      error: 'Best prediction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as aiRoutes };
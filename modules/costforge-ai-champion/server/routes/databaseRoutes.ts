/**
 * Database Routes for CostForge AI Champion
 * 
 * Handles database operations, property data management,
 * and data synchronization with Supabase.
 */

import { Router, Request, Response } from 'express';
import SupabaseService from '../services/database/SupabaseService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ==================== DATABASE STATUS ====================

/**
 * Check database connection and service status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isAvailable = SupabaseService.isAvailable();
    let connectionTest = false;
    let stats = null;

    if (isAvailable) {
      connectionTest = await SupabaseService.testConnection();
      if (connectionTest) {
        stats = await SupabaseService.getDatabaseStats();
      }
    }

    res.json({
      available: isAvailable,
      connected: connectionTest,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error checking database status:', error);
    res.status(500).json({
      error: 'Database status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== PROPERTIES ====================

/**
 * Get all properties with pagination
 */
router.get('/properties', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available',
        message: 'Please check database configuration'
      });
    }

    const { limit, offset } = req.query;
    const properties = await SupabaseService.getAllProperties({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });

    res.json({
      success: true,
      properties,
      count: properties.length,
      pagination: {
        limit: limit ? Number(limit) : null,
        offset: offset ? Number(offset) : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching properties:', error);
    res.status(500).json({
      error: 'Failed to fetch properties',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get property by property ID
 */
router.get('/properties/:propId', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { propId } = req.params;
    const property = await SupabaseService.getPropertyByPropId(propId);

    if (!property) {
      return res.status(404).json({
        error: 'Property not found',
        propId
      });
    }

    res.json({
      success: true,
      property,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching property:', error);
    res.status(500).json({
      error: 'Failed to fetch property',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create new property
 */
router.post('/properties', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const {
      prop_id,
      building_type,
      square_footage,
      year_built,
      region,
      condition,
      features,
      estimated_cost
    } = req.body;

    // Validate required fields
    if (!prop_id || !building_type || !square_footage || !region) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['prop_id', 'building_type', 'square_footage', 'region']
      });
    }

    // Check if property already exists
    const existingProperty = await SupabaseService.getPropertyByPropId(prop_id);
    if (existingProperty) {
      return res.status(409).json({
        error: 'Property already exists',
        propId: prop_id
      });
    }

    const property = await SupabaseService.createProperty({
      prop_id,
      building_type,
      square_footage: Number(square_footage),
      year_built: year_built ? Number(year_built) : undefined,
      region,
      condition,
      features: features || [],
      estimated_cost: estimated_cost ? Number(estimated_cost) : undefined
    });

    res.status(201).json({
      success: true,
      property,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error creating property:', error);
    res.status(500).json({
      error: 'Failed to create property',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Bulk import properties
 */
router.post('/properties/bulk-import', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { properties } = req.body;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({
        error: 'Properties array is required and must not be empty'
      });
    }

    if (properties.length > 1000) {
      return res.status(400).json({
        error: 'Maximum 1000 properties allowed per bulk import'
      });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const propertyData of properties) {
      try {
        // Validate required fields
        if (!propertyData.prop_id || !propertyData.building_type || 
            !propertyData.square_footage || !propertyData.region) {
          results.errors.push(`Missing required fields for property: ${propertyData.prop_id || 'unknown'}`);
          continue;
        }

        // Check if property already exists
        const existing = await SupabaseService.getPropertyByPropId(propertyData.prop_id);
        if (existing) {
          results.skipped++;
          continue;
        }

        await SupabaseService.createProperty({
          prop_id: propertyData.prop_id,
          building_type: propertyData.building_type,
          square_footage: Number(propertyData.square_footage),
          year_built: propertyData.year_built ? Number(propertyData.year_built) : undefined,
          region: propertyData.region,
          condition: propertyData.condition,
          features: propertyData.features || [],
          estimated_cost: propertyData.estimated_cost ? Number(propertyData.estimated_cost) : undefined
        });

        results.created++;

      } catch (propertyError) {
        results.errors.push(`Error with property ${propertyData.prop_id}: ${propertyError instanceof Error ? propertyError.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      results,
      totalProcessed: properties.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in bulk property import:', error);
    res.status(500).json({
      error: 'Bulk import failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== COST MATRICES ====================

/**
 * Get all cost matrices (alias for cost-analysis route)
 */
router.get('/cost-matrices', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { limit, offset } = req.query;
    const matrices = await SupabaseService.getAllCostMatrices({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });

    res.json({
      success: true,
      costMatrices: matrices,
      count: matrices.length,
      pagination: {
        limit: limit ? Number(limit) : null,
        offset: offset ? Number(offset) : 0
      },
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

// ==================== ANALYSIS RESULTS ====================

/**
 * Get analysis results with filtering
 */
router.get('/analysis-results', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { type, limit } = req.query;
    const analysisType = (type as string) || 'enhanced-cost-analysis';
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
    logger.error('Error fetching analysis results:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Save new analysis result
 */
router.post('/analysis-results', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const {
      analysis_type,
      input_data,
      result_data,
      confidence_score,
      ai_provider,
      user_id
    } = req.body;

    if (!analysis_type || !input_data || !result_data) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['analysis_type', 'input_data', 'result_data']
      });
    }

    const analysisResult = await SupabaseService.saveAnalysisResult({
      analysis_type,
      input_data,
      result_data,
      confidence_score: confidence_score ? Number(confidence_score) : undefined,
      ai_provider,
      user_id
    });

    res.status(201).json({
      success: true,
      analysisResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error saving analysis result:', error);
    res.status(500).json({
      error: 'Failed to save analysis result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== DATA EXPORT ====================

/**
 * Export data in various formats
 */
router.get('/export/:table/:format?', async (req: Request, res: Response) => {
  try {
    if (!SupabaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Database service is not available'
      });
    }

    const { table, format } = req.params;
    const exportFormat = format || 'json';

    let data: any[] = [];

    switch (table) {
      case 'properties':
        data = await SupabaseService.getAllProperties({ limit: 10000 });
        break;
      case 'cost-matrices':
        data = await SupabaseService.getAllCostMatrices({ limit: 10000 });
        break;
      case 'analysis-results':
        data = await SupabaseService.getAnalysisResultsByType('enhanced-cost-analysis', 10000);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid table name',
          validTables: ['properties', 'cost-matrices', 'analysis-results']
        });
    }

    if (exportFormat === 'csv') {
      // Simple CSV conversion (for basic data types)
      if (data.length === 0) {
        return res.status(404).json({ error: 'No data to export' });
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle complex objects by stringifying
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
            // Escape quotes and wrap in quotes if contains comma
            return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${table}-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.json({
        success: true,
        table,
        format: exportFormat,
        data,
        count: data.length,
        exportedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({
      error: 'Data export failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as databaseRoutes };
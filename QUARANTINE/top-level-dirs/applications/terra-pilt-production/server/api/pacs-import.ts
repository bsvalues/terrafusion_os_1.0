import { Router } from 'express';
import { PacsDataImporter } from '../services/pacsDataImporter';
import { RealPiltCalculator } from '../services/realPiltCalculator';
import { logger } from '../utils/logger';

const router = Router();
const pacsImporter = new PacsDataImporter();
const piltCalculator = new RealPiltCalculator();

router.post('/import/levy-data', async (req, res) => {
  try {
    logger.info('🚀 API: Starting PACS levy data import...');
    
    const result = await pacsImporter.importLevyData();
    
    if (result.success) {
      logger.info(`✅ API: Import successful - ${result.imported} records`);
      res.json({
        success: true,
        data: {
          imported: result.imported,
          message: result.message,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      logger.error('❌ API: Import failed:', result.message);
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('❌ API: Import endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during import'
    });
  }
});

router.post('/import/property-data', async (req, res) => {
  try {
    logger.info('🏠 API: Starting property data import...');
    
    const result = await pacsImporter.importPropertyData();
    
    res.json({
      success: result.success,
      data: {
        message: result.message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ API: Property import error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during property import'
    });
  }
});

router.get('/import/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        pacsIntegration: 'Active',
        lastImport: new Date().toISOString(),
        availableFiles: [
          'PILT Tables Wookbook_2024-LevyData.csv (5.8KB)',
          'PILT Tables Wookbook_2024-City-CountyAcres.csv (8.9MB)',
          'PILT Tables Wookbook_2024-Dryacres.csv (423KB)',
          'PILT Tables Wookbook_2024-Irracres.csv (409KB)'
        ],
        system: 'TerraFusionPilt V2.0.0 - PACS Integration Active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Status check failed'
    });
  }
});

router.get('/calculate/real-pilt/:year?', async (req, res) => {
  try {
    const year = parseInt(req.params.year || '2024');
    logger.info(`🧮 API: Calculating REAL PILT for year ${year}...`);
    
    const calculation = await piltCalculator.calculateRealPilt(year);
    
    res.json({
      success: true,
      data: {
        calculation,
        timestamp: new Date().toISOString(),
        dataSource: 'Live Benton County PACS Data'
      }
    });
  } catch (error) {
    logger.error('❌ API: Real PILT calculation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Real PILT calculation failed'
    });
  }
});

router.get('/report/real-pilt/:year?', async (req, res) => {
  try {
    const year = parseInt(req.params.year || '2024');
    logger.info(`📊 API: Generating REAL PILT report for ${year}...`);
    
    const report = await piltCalculator.generateRealReport(year);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.send(report);
  } catch (error) {
    logger.error('❌ API: Real report generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Real report generation failed'
    });
  }
});

export default router; 
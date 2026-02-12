/**
 * Supabase Migration Routes
 *
 * This file contains API routes for Supabase data migration and operations.
 */

import express from 'express';
import { SupabaseMigrationService } from '../services/supabase-migration-service';
import { IStorage } from '../storage';
import { logger } from '../utils/logger';
import { checkSupabaseHealth } from '../../shared/supabase-client';

export function registerSupabaseRoutes(app: express.Application, storage: IStorage) {
  const router = express.Router();
  const migrationService = new SupabaseMigrationService(storage);

  /**
   * Check Supabase connection status
   * GET /api/supabase/health
   */
  router.get('/health', async (req, res) => {
    try {
      const isConnected = await checkSupabaseHealth();
      return res.json({ connected: isConnected });
    } catch (error) {
      logger.error('Error checking Supabase connection:', error);
      return res.status(500).json({
        connected: false,
        error: 'Failed to check Supabase connection',
      });
    }
  });

  /**
   * Start a migration for a specific data type
   * POST /api/supabase/migrate/:dataType
   */
  router.post('/migrate/:dataType', async (req, res) => {
    const { dataType } = req.params;
    const { batchSize } = req.body;

    try {
      // Set batch size if provided
      if (batchSize && typeof batchSize === 'number') {
        migrationService.setBatchSize(batchSize);
      }

      let result;
      switch (dataType) {
        case 'properties':
          result = await migrationService.migrateProperties();
          break;
        case 'property-analyses':
          result = await migrationService.migratePropertyAnalyses();
          break;
        case 'property-appeals':
          result = await migrationService.migratePropertyAppeals();
          break;
        case 'data-lineage':
          result = await migrationService.migrateDataLineage();
          break;
        case 'agent-experiences':
          result = await migrationService.migrateAgentExperiences();
          break;
        case 'property-market-trends':
          result = await migrationService.migratePropertyMarketTrends();
          break;
        case 'all':
          result = await migrationService.migrateAllData();
          break;
        default:
          return res.status(400).json({ error: `Unsupported data type: ${dataType}` });
      }

      return res.json(result);
    } catch (error) {
      logger.error(`Error migrating ${dataType}:`, error);
      return res.status(500).json({
        success: false,
        error: `Migration failed for ${dataType}`,
      });
    }
  });

  /**
   * Validate Supabase connection
   * GET /api/supabase/validate
   */
  router.get('/validate', async (req, res) => {
    try {
      const isValid = await migrationService.validateConnection();
      return res.json({
        valid: isValid,
        message: isValid ? 'Supabase connection is valid' : 'Supabase connection is invalid',
      });
    } catch (error) {
      logger.error('Error validating Supabase connection:', error);
      return res.status(500).json({
        valid: false,
        error: 'Failed to validate Supabase connection',
      });
    }
  });

  app.use('/api/supabase', router);
}

/**
 * Supabase Migration Service
 * 
 * This service handles the migration of data from the existing database to Supabase.
 * It includes functionality for validating connections, migrating data in batches,
 * and tracking progress of the migration.
 */

import { supabase } from '../../shared/supabase-client';
import { Database } from '../../shared/supabase-types';
import { TABLES, DATA_CHANGE_SOURCES } from '../../shared/supabase-schema';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';

// Type definitions for migration progress tracking
interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'failed';
  error?: string;
}

interface MigrationProgress {
  properties: MigrationStats;
  propertyAnalyses: MigrationStats;
  propertyAppeals: MigrationStats;
  propertyDataChanges: MigrationStats;
  propertyInsightShares: MigrationStats;
  propertyMarketTrends: MigrationStats;
  agentExperiences: MigrationStats;
}

export class SupabaseMigrationService {
  private migrationProgress: MigrationProgress;
  private batchSize: number;

  constructor(batchSize = 50) {
    this.batchSize = batchSize;
    // Initialize migration progress tracking
    this.migrationProgress = {
      properties: this.createDefaultMigrationStats(),
      propertyAnalyses: this.createDefaultMigrationStats(),
      propertyAppeals: this.createDefaultMigrationStats(),
      propertyDataChanges: this.createDefaultMigrationStats(),
      propertyInsightShares: this.createDefaultMigrationStats(),
      propertyMarketTrends: this.createDefaultMigrationStats(),
      agentExperiences: this.createDefaultMigrationStats(),
    };
  }

  /**
   * Create default migration stats object
   */
  private createDefaultMigrationStats(): MigrationStats {
    return {
      total: 0,
      migrated: 0,
      failed: 0,
      startTime: new Date(),
      status: 'in_progress'
    };
  }

  /**
   * Validates connection to Supabase and checks that tables exist
   */
  async validateConnection(): Promise<{ valid: boolean; message: string }> {
    try {
      // Check that we can connect to Supabase
      const { data, error } = await supabase
        .from(TABLES.PROPERTIES)
        .select('id')
        .limit(1);

      if (error) {
        logger.error('Supabase connection validation failed:', error);
        return { 
          valid: false, 
          message: `Failed to connect to Supabase: ${error.message}` 
        };
      }

      logger.info('Supabase connection validation successful');
      return { valid: true, message: 'Successfully connected to Supabase' };
    } catch (error) {
      logger.error('Error during Supabase connection validation:', error);
      return { 
        valid: false, 
        message: `Exception during connection validation: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Migrates all data from existing storage to Supabase
   */
  async migrateAllData(): Promise<MigrationProgress> {
    logger.info('Starting complete data migration to Supabase');
    
    try {
      // Migrate properties first as they are referenced by other tables
      await this.migrateProperties();
      
      // Migrate other data in parallel for efficiency
      await Promise.all([
        this.migratePropertyAnalyses(),
        this.migratePropertyAppeals(),
        this.migratePropertyDataChanges(),
        this.migratePropertyInsightShares(),
        this.migratePropertyMarketTrends(),
        this.migrateAgentExperiences()
      ]);

      logger.info('Complete data migration finished successfully');
      return this.migrationProgress;
    } catch (error) {
      logger.error('Error during complete data migration:', error);
      
      // Mark all unfinished migrations as failed
      for (const key of Object.keys(this.migrationProgress)) {
        const stats = this.migrationProgress[key as keyof MigrationProgress];
        if (stats.status === 'in_progress') {
          stats.status = 'failed';
          stats.endTime = new Date();
          stats.error = error instanceof Error ? error.message : String(error);
        }
      }
      
      return this.migrationProgress;
    }
  }

  /**
   * Migrates properties from existing storage to Supabase
   */
  async migrateProperties(): Promise<MigrationStats> {
    const stats = this.migrationProgress.properties;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all properties from existing storage
      const properties = await storage.getAllProperties();
      stats.total = properties.length;
      
      logger.info(`Starting migration of ${stats.total} properties`);
      
      // Process in batches
      for (let i = 0; i < properties.length; i += this.batchSize) {
        const batch = properties.slice(i, i + this.batchSize);
        
        const supabaseProperties = batch.map(property => ({
          id: uuidv4(),
          property_id: property.propertyId,
          address: property.address,
          parcel_number: property.parcelNumber,
          property_type: property.propertyType,
          status: property.status,
          acres: parseFloat(property.acres), // Convert string to number if stored as string
          value: property.value ? parseFloat(property.value.toString()) : null,
          extra_fields: property.extraFields || null,
          created_at: property.createdAt.toISOString(),
          updated_at: property.lastUpdated.toISOString()
        }));
        
        const { error } = await supabase
          .from(TABLES.PROPERTIES)
          .insert(supabaseProperties);
          
        if (error) {
          logger.error(`Error migrating properties batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated properties batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of properties: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during property migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Migrates property analyses from existing storage to Supabase
   */
  async migratePropertyAnalyses(): Promise<MigrationStats> {
    const stats = this.migrationProgress.propertyAnalyses;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all property analyses from existing storage
      const analyses = await storage.getAllPropertyAnalyses();
      stats.total = analyses.length;
      
      logger.info(`Starting migration of ${stats.total} property analyses`);
      
      // Process in batches
      for (let i = 0; i < analyses.length; i += this.batchSize) {
        const batch = analyses.slice(i, i + this.batchSize);
        
        const supabaseAnalyses = batch.map(analysis => ({
          id: uuidv4(),
          property_id: analysis.propertyId,
          analysis_id: analysis.analysisId,
          title: analysis.title,
          description: analysis.description,
          methodology: analysis.methodology,
          value_conclusion: analysis.valueConclusion ? parseFloat(analysis.valueConclusion.toString()) : null,
          confidence_level: analysis.confidenceLevel,
          comparable_properties: analysis.comparableProperties || null,
          adjustment_notes: analysis.adjustmentNotes,
          created_by: analysis.createdBy.toString(),
          approved_by: analysis.approvedBy ? analysis.approvedBy.toString() : null,
          review_date: analysis.reviewDate ? analysis.reviewDate.toISOString() : null,
          created_at: analysis.createdAt.toISOString(),
          updated_at: analysis.lastUpdated.toISOString(),
          status: analysis.status
        }));
        
        const { error } = await supabase
          .from(TABLES.PROPERTY_ANALYSES)
          .insert(supabaseAnalyses);
          
        if (error) {
          logger.error(`Error migrating property analyses batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated property analyses batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of property analyses: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during property analyses migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Migrates property appeals from existing storage to Supabase
   */
  async migratePropertyAppeals(): Promise<MigrationStats> {
    const stats = this.migrationProgress.propertyAppeals;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all property appeals from existing storage
      const appeals = await storage.getAllPropertyAppeals();
      stats.total = appeals.length;
      
      logger.info(`Starting migration of ${stats.total} property appeals`);
      
      // Process in batches
      for (let i = 0; i < appeals.length; i += this.batchSize) {
        const batch = appeals.slice(i, i + this.batchSize);
        
        const supabaseAppeals = batch.map(appeal => ({
          id: uuidv4(),
          property_id: appeal.propertyId,
          user_id: appeal.userId.toString(),
          appeal_number: appeal.appealNumber,
          appeal_type: appeal.appealType,
          reason: appeal.reason,
          evidence_urls: appeal.evidenceUrls,
          hearing_date: appeal.hearingDate ? appeal.hearingDate.toISOString() : null,
          decision: appeal.decision,
          decision_date: appeal.decisionDate ? appeal.decisionDate.toISOString() : null,
          notes: appeal.notes,
          status: appeal.status,
          created_at: appeal.createdAt.toISOString(),
          updated_at: appeal.lastUpdated.toISOString(),
          notification_sent: appeal.notificationSent
        }));
        
        const { error } = await supabase
          .from(TABLES.PROPERTY_APPEALS)
          .insert(supabaseAppeals);
          
        if (error) {
          logger.error(`Error migrating property appeals batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated property appeals batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of property appeals: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during property appeals migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Migrates property data changes from existing storage to Supabase
   */
  async migratePropertyDataChanges(): Promise<MigrationStats> {
    const stats = this.migrationProgress.propertyDataChanges;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all property data changes from existing storage
      const dataChanges = await storage.getAllPropertyDataChanges();
      stats.total = dataChanges.length;
      
      logger.info(`Starting migration of ${stats.total} property data changes`);
      
      // Process in batches
      for (let i = 0; i < dataChanges.length; i += this.batchSize) {
        const batch = dataChanges.slice(i, i + this.batchSize);
        
        const supabaseDataChanges = batch.map(change => ({
          id: uuidv4(),
          property_id: change.propertyId,
          field_name: change.fieldName,
          old_value: change.oldValue,
          new_value: change.newValue,
          change_timestamp: change.changeTimestamp.toISOString(),
          source: change.source,
          user_id: change.userId.toString(),
          source_details: change.sourceDetails || null,
          created_at: change.createdAt.toISOString()
        }));
        
        const { error } = await supabase
          .from(TABLES.PROPERTY_DATA_CHANGES)
          .insert(supabaseDataChanges);
          
        if (error) {
          logger.error(`Error migrating property data changes batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated property data changes batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of property data changes: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during property data changes migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Migrates property insight shares from existing storage to Supabase
   */
  async migratePropertyInsightShares(): Promise<MigrationStats> {
    const stats = this.migrationProgress.propertyInsightShares;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all property insight shares from existing storage
      const shares = await storage.getAllPropertyInsightShares();
      stats.total = shares.length;
      
      logger.info(`Starting migration of ${stats.total} property insight shares`);
      
      // Process in batches
      for (let i = 0; i < shares.length; i += this.batchSize) {
        const batch = shares.slice(i, i + this.batchSize);
        
        const supabaseShares = batch.map(share => ({
          id: uuidv4(),
          share_id: share.shareId,
          property_id: share.propertyId,
          property_name: share.propertyName,
          property_address: share.propertyAddress,
          analysis_ids: share.analysisIds,
          created_by: share.createdBy.toString(),
          access_token: share.accessToken,
          expires_at: share.expiresAt ? share.expiresAt.toISOString() : null,
          created_at: share.createdAt.toISOString(),
          access_count: share.accessCount,
          last_accessed_at: share.lastAccessedAt ? share.lastAccessedAt.toISOString() : null
        }));
        
        const { error } = await supabase
          .from(TABLES.PROPERTY_INSIGHT_SHARES)
          .insert(supabaseShares);
          
        if (error) {
          logger.error(`Error migrating property insight shares batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated property insight shares batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of property insight shares: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during property insight shares migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Migrates property market trends from existing storage to Supabase
   */
  async migratePropertyMarketTrends(): Promise<MigrationStats> {
    const stats = this.migrationProgress.propertyMarketTrends;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all property market trends from existing storage
      const trends = await storage.getAllPropertyMarketTrends();
      stats.total = trends.length;
      
      logger.info(`Starting migration of ${stats.total} property market trends`);
      
      // Process in batches
      for (let i = 0; i < trends.length; i += this.batchSize) {
        const batch = trends.slice(i, i + this.batchSize);
        
        const supabaseTrends = batch.map(trend => ({
          id: uuidv4(),
          property_id: trend.propertyId,
          timestamp: trend.timestamp.toISOString(),
          value: parseFloat(trend.value.toString()),
          percent_change: parseFloat(trend.percentChange.toString()),
          comparable_sales: trend.comparableSales,
          market_indicators: trend.marketIndicators,
          prediction_factors: trend.predictionFactors,
          confidence_score: parseFloat(trend.confidenceScore.toString()),
          created_at: trend.createdAt.toISOString()
        }));
        
        const { error } = await supabase
          .from(TABLES.PROPERTY_MARKET_TRENDS)
          .insert(supabaseTrends);
          
        if (error) {
          logger.error(`Error migrating property market trends batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated property market trends batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of property market trends: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during property market trends migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Migrates agent experiences from existing storage to Supabase
   */
  async migrateAgentExperiences(): Promise<MigrationStats> {
    const stats = this.migrationProgress.agentExperiences;
    stats.startTime = new Date();
    stats.status = 'in_progress';
    
    try {
      // Get all agent experiences from existing storage
      const experiences = await storage.getAllAgentExperiences();
      stats.total = experiences.length;
      
      logger.info(`Starting migration of ${stats.total} agent experiences`);
      
      // Process in batches
      for (let i = 0; i < experiences.length; i += this.batchSize) {
        const batch = experiences.slice(i, i + this.batchSize);
        
        const supabaseExperiences = batch.map(experience => ({
          id: uuidv4(),
          agent_id: experience.agentId.toString(),
          agent_name: experience.agentName,
          experience_id: experience.experienceId,
          action: experience.action,
          entity_type: experience.entityType,
          entity_id: experience.entityId,
          state: experience.state,
          reward: parseFloat(experience.reward.toString()),
          priority: experience.priority,
          feedback: experience.feedback,
          timestamp: experience.timestamp.toISOString(),
          created_at: experience.createdAt.toISOString(),
          used_for_training: experience.usedForTraining || false
        }));
        
        const { error } = await supabase
          .from(TABLES.AGENT_EXPERIENCES)
          .insert(supabaseExperiences);
          
        if (error) {
          logger.error(`Error migrating agent experiences batch (${i}-${i + batch.length}):`, error);
          stats.failed += batch.length;
        } else {
          stats.migrated += batch.length;
          logger.info(`Migrated agent experiences batch: ${stats.migrated}/${stats.total}`);
        }
      }
      
      stats.status = 'completed';
      stats.endTime = new Date();
      logger.info(`Completed migration of agent experiences: ${stats.migrated}/${stats.total} successful`);
      
      return stats;
    } catch (error) {
      logger.error('Error during agent experiences migration:', error);
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.error = error instanceof Error ? error.message : String(error);
      return stats;
    }
  }

  /**
   * Gets the current migration progress
   */
  getMigrationProgress(): MigrationProgress {
    return this.migrationProgress;
  }

  /**
   * Create FTP property change record in Supabase
   * Used when syncing FTP data directly to Supabase
   */
  async recordPropertyChangeFromFTP(
    propertyId: string, 
    fieldName: string, 
    oldValue: string, 
    newValue: string, 
    userId: string = 'system'
  ): Promise<boolean> {
    try {
      const changeRecord = {
        id: uuidv4(),
        property_id: propertyId,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        change_timestamp: new Date().toISOString(),
        source: DATA_CHANGE_SOURCES.FTP_SYNC,
        user_id: userId,
        source_details: { 
          system: 'FTP Import',
          sync_timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from(TABLES.PROPERTY_DATA_CHANGES)
        .insert(changeRecord);
        
      if (error) {
        logger.error(`Error recording property change from FTP for property ${propertyId}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Exception recording property change from FTP for property ${propertyId}:`, error);
      return false;
    }
  }
}

// Export a singleton instance for use throughout the application
export const supabaseMigrationService = new SupabaseMigrationService();
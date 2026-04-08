/**
 * Data Lineage Tracker
 * 
 * Tracks the complete history and origin of property data attributes,
 * providing traceability and audit capability for all data changes.
 */

import { IStorage } from '../../storage';
import { logger } from '../../utils/logger';

export interface DataLineageRecord {
  id?: number;
  propertyId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changeTimestamp: Date;
  source: 'import' | 'manual' | 'api' | 'calculated' | 'validated' | 'correction';
  userId: number;
  sourceDetails?: Record<string, any>;
  createdAt?: Date;
}

export class DataLineageTracker {
  constructor(private storage: IStorage) {}
  
  /**
   * Track a data change for a property field
   * 
   * @param propertyId The property identifier
   * @param fieldName The name of the field that changed
   * @param oldValue Previous value of the field
   * @param newValue New value of the field
   * @param source Source of the change (import, manual, api, calculated, validated, correction)
   * @param userId User who made the change
   * @param sourceDetails Additional details about the source of change
   */
  public async trackDataChange(
    propertyId: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    source: 'import' | 'manual' | 'api' | 'calculated' | 'validated' | 'correction',
    userId: number,
    sourceDetails?: Record<string, any>
  ): Promise<void> {
    try {
      // Serialize values to JSON strings if they're not already strings
      const oldValueStr = typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue);
      const newValueStr = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
      
      // Create lineage record
      await this.storage.createDataLineageRecord({
        propertyId,
        fieldName,
        oldValue: oldValueStr,
        newValue: newValueStr,
        changeTimestamp: new Date(),
        source,
        userId,
        sourceDetails: sourceDetails || {}
      });
      
      logger.info(`Data lineage recorded for ${propertyId}.${fieldName}`, {
        component: 'DataLineageTracker',
        propertyId,
        fieldName,
        source,
        userId
      });
    } catch (error) {
      logger.error(`Error tracking data lineage for ${propertyId}.${fieldName}`, {
        component: 'DataLineageTracker',
        propertyId,
        fieldName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Re-throw the error to allow the caller to handle it
      throw error;
    }
  }
  
  /**
   * Get change history for a specific property field
   * 
   * @param propertyId The property identifier
   * @param fieldName The name of the field
   * @returns Array of lineage records for the field
   */
  public async getFieldHistory(propertyId: string, fieldName: string): Promise<DataLineageRecord[]> {
    try {
      return this.storage.getDataLineageByField(propertyId, fieldName);
    } catch (error) {
      logger.error(`Error fetching field history for ${propertyId}.${fieldName}`, {
        component: 'DataLineageTracker',
        propertyId,
        fieldName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Get change history for all fields of a property
   * 
   * @param propertyId The property identifier
   * @returns Array of lineage records for the property
   */
  public async getPropertyChangeHistory(propertyId: string): Promise<DataLineageRecord[]> {
    try {
      return this.storage.getDataLineageByProperty(propertyId);
    } catch (error) {
      logger.error(`Error fetching property change history for ${propertyId}`, {
        component: 'DataLineageTracker',
        propertyId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Get change history for all changes made by a specific user
   * 
   * @param userId The user identifier
   * @param limit Maximum number of records to return
   * @returns Array of lineage records for the user
   */
  public async getUserChangeHistory(userId: number, limit = 100): Promise<DataLineageRecord[]> {
    try {
      return this.storage.getDataLineageByUser(userId, limit);
    } catch (error) {
      logger.error(`Error fetching user change history for user ${userId}`, {
        component: 'DataLineageTracker',
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Get changes made to properties within a specific time range
   * 
   * @param startDate Start date for the range
   * @param endDate End date for the range
   * @param limit Maximum number of records to return
   * @returns Array of lineage records for the time range
   */
  public async getChangesByDateRange(
    startDate: Date,
    endDate: Date,
    limit = 100
  ): Promise<DataLineageRecord[]> {
    try {
      return this.storage.getDataLineageByDateRange(startDate, endDate, limit);
    } catch (error) {
      logger.error(`Error fetching changes by date range`, {
        component: 'DataLineageTracker',
        startDate,
        endDate,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Get changes by source type
   * 
   * @param source The source of changes to filter by
   * @param limit Maximum number of records to return
   * @returns Array of lineage records for the specified source
   */
  public async getChangesBySource(
    source: 'import' | 'manual' | 'api' | 'calculated' | 'validated' | 'correction',
    limit = 100
  ): Promise<DataLineageRecord[]> {
    try {
      return this.storage.getDataLineageBySource(source, limit);
    } catch (error) {
      logger.error(`Error fetching changes by source ${source}`, {
        component: 'DataLineageTracker',
        source,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Get the full data provenance chain for a specific property field
   * Includes all changes plus calculated data information
   * 
   * @param propertyId The property identifier
   * @param fieldName The name of the field
   * @returns Enhanced lineage data with provenance information
   */
  public async getDataProvenance(
    propertyId: string,
    fieldName: string
  ): Promise<{
    currentValue: any;
    origin: {
      source: string;
      timestamp: Date;
      userId: number;
      details?: Record<string, any>;
    };
    changeChain: DataLineageRecord[];
    dependsOn?: string[];
    usedBy?: string[];
  }> {
    try {
      // Get the current property data
      const property = await this.storage.getPropertyByPropertyId(propertyId);
      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }
      
      // Get the field's current value
      let currentValue: any;
      
      // Handle nested fields in extraFields
      if (fieldName.startsWith('extraFields.')) {
        const extraField = fieldName.split('.')[1];
        currentValue = property.extraFields ? property.extraFields[extraField] : null;
      } else {
        currentValue = property[fieldName];
      }
      
      // Get the full change history
      const changeChain = await this.getFieldHistory(propertyId, fieldName);
      
      // Sort by timestamp ascending
      changeChain.sort((a, b) => a.changeTimestamp.getTime() - b.changeTimestamp.getTime());
      
      // Get origin information (first record)
      const origin = changeChain.length > 0 ? {
        source: changeChain[0].source,
        timestamp: changeChain[0].changeTimestamp,
        userId: changeChain[0].userId,
        details: changeChain[0].sourceDetails
      } : {
        source: 'unknown',
        timestamp: property.createdAt || new Date(),
        userId: 0,
        details: {}
      };
      
      // For calculated fields, get dependencies
      let dependsOn: string[] | undefined;
      let usedBy: string[] | undefined;
      
      if (changeChain.some(change => change.source === 'calculated')) {
        // Find calculation dependencies and field usage in calculation formulas
        // This is a placeholder for actual dependency tracking logic
        dependsOn = [];
        usedBy = [];
      }
      
      return {
        currentValue,
        origin,
        changeChain,
        dependsOn,
        usedBy
      };
    } catch (error) {
      logger.error(`Error fetching data provenance for ${propertyId}.${fieldName}`, {
        component: 'DataLineageTracker',
        propertyId,
        fieldName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
}
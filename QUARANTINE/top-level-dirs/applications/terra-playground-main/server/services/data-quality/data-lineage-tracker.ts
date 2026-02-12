/**
 * Data Lineage Tracker Service
 *
 * Provides comprehensive tracking of data changes with:
 * - Field-level change detection and recording
 * - Multi-level hierarchy for complex nested data structures
 * - Temporal tracking with precise timestamps
 * - Source attribution for all data changes
 * - Data provenance tracking for regulatory compliance
 */

import { IStorage } from '../../storage';
import { CacheManager, EntityType, DataChangeEventType } from '../cache';
import { logger } from '../../utils/logger';
import { Pool } from '@neondatabase/serverless';

// Data change source types
export enum ChangeSourceType {
  USER = 'user',
  IMPORT = 'import',
  ETL = 'etl',
  SYSTEM = 'system',
  API = 'api',
  INTEGRATION = 'integration',
}

// Data change operation types
export enum ChangeOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MERGE = 'merge',
  SPLIT = 'split',
  TRANSFORM = 'transform',
}

// Data lineage record
export interface DataLineageRecord {
  id?: number;
  entityType: string;
  entityId: string;
  changeTimestamp: Date;
  sourceType: ChangeSourceType;
  sourceId: string;
  operationType: ChangeOperationType;
  fieldChanges: FieldChange[];
  metadata?: Record<string, any>;
}

// Field change details
export interface FieldChange {
  field: string;
  oldValue?: any;
  newValue?: any;
  derived?: boolean;
  formula?: string;
  confidence?: number;
}

// Data lineage query options
export interface LineageQueryOptions {
  startDate?: Date;
  endDate?: Date;
  sourceTypes?: ChangeSourceType[];
  operationTypes?: ChangeOperationType[];
  fields?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Data Lineage Tracker Service implementation
 */
export class DataLineageTracker {
  private cacheManager?: CacheManager;

  /**
   * Create a new Data Lineage Tracker
   * @param storage Storage service
   * @param pool Database pool for direct queries
   */
  constructor(
    private storage: IStorage,
    private pool?: Pool
  ) {}

  /**
   * Set cache manager for integration with caching system
   * @param cacheManager Cache manager
   */
  setCacheManager(cacheManager: CacheManager): void {
    this.cacheManager = cacheManager;
  }

  /**
   * Track changes between old and new entity versions
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param oldVersion Previous entity version (null for creation)
   * @param newVersion New entity version (null for deletion)
   * @param sourceType Change source type
   * @param sourceId Source identifier
   * @param operationType Operation type
   * @param metadata Additional metadata
   * @returns Lineage record
   */
  async trackChanges(
    entityType: string,
    entityId: string,
    oldVersion: Record<string, any> | null,
    newVersion: Record<string, any> | null,
    sourceType: ChangeSourceType,
    sourceId: string,
    operationType: ChangeOperationType,
    metadata?: Record<string, any>
  ): Promise<DataLineageRecord> {
    // Detect field changes
    const fieldChanges = this.detectFieldChanges(oldVersion, newVersion);

    // Create lineage record
    const lineageRecord: DataLineageRecord = {
      entityType,
      entityId,
      changeTimestamp: new Date(),
      sourceType,
      sourceId,
      operationType,
      fieldChanges,
      metadata,
    };

    // Store lineage record
    const storedRecord = await this.storeLineageRecord(lineageRecord);

    // Invalidate cache if cache manager is available
    if (this.cacheManager) {
      let eventType: DataChangeEventType;

      switch (operationType) {
        case ChangeOperationType.CREATE:
          eventType = DataChangeEventType.CREATE;
          break;
        case ChangeOperationType.DELETE:
          eventType = DataChangeEventType.DELETE;
          break;
        default:
          eventType = DataChangeEventType.UPDATE;
      }

      await this.cacheManager.handleDataChangeEvent(entityType as EntityType, entityId, eventType);
    }

    logger.info(`Tracked ${operationType} changes for ${entityType} ${entityId}`, {
      component: 'DataLineageTracker',
      changedFields: fieldChanges.map(fc => fc.field),
      sourceType,
      sourceId,
    });

    return storedRecord;
  }

  /**
   * Detect changes between old and new versions
   * @param oldVersion Previous entity version
   * @param newVersion New entity version
   * @returns Field changes
   */
  private detectFieldChanges(
    oldVersion: Record<string, any> | null,
    newVersion: Record<string, any> | null
  ): FieldChange[] {
    const fieldChanges: FieldChange[] = [];

    // Handle creation
    if (!oldVersion && newVersion) {
      // For creation, all new fields are considered changes
      Object.entries(newVersion).forEach(([field, value]) => {
        // Skip metadata and internal fields
        if (this.shouldTrackField(field)) {
          fieldChanges.push({
            field,
            newValue: value,
          });
        }
      });
      return fieldChanges;
    }

    // Handle deletion
    if (oldVersion && !newVersion) {
      // For deletion, all old fields are considered changes
      Object.entries(oldVersion).forEach(([field, value]) => {
        // Skip metadata and internal fields
        if (this.shouldTrackField(field)) {
          fieldChanges.push({
            field,
            oldValue: value,
          });
        }
      });
      return fieldChanges;
    }

    // Handle update
    if (oldVersion && newVersion) {
      // Collect all fields from both versions
      const allFields = new Set([...Object.keys(oldVersion), ...Object.keys(newVersion)]);

      // Compare each field
      allFields.forEach(field => {
        // Skip metadata and internal fields
        if (!this.shouldTrackField(field)) {
          return;
        }

        const oldValue = oldVersion[field];
        const newValue = newVersion[field];

        // Check if values are different
        if (!this.areValuesEqual(oldValue, newValue)) {
          fieldChanges.push({
            field,
            oldValue,
            newValue,
          });
        }
      });
    }

    return fieldChanges;
  }

  /**
   * Check if field should be tracked
   * @param field Field name
   * @returns True if field should be tracked
   */
  private shouldTrackField(field: string): boolean {
    // Skip metadata fields, timestamps created by the system, and internal fields
    const skipFields = [
      'id',
      '_id',
      'createdAt',
      'created_at',
      'updatedAt',
      'updated_at',
      '_metadata',
      '_internal',
      '_version',
      '_hash',
    ];

    return !skipFields.includes(field);
  }

  /**
   * Compare two values for equality
   * @param oldValue Old value
   * @param newValue New value
   * @returns True if values are equal
   */
  private areValuesEqual(oldValue: any, newValue: any): boolean {
    // Handle null and undefined
    if (oldValue === null && newValue === null) return true;
    if (oldValue === undefined && newValue === undefined) return true;
    if (oldValue === null && newValue === undefined) return true;
    if (oldValue === undefined && newValue === null) return true;
    if (
      (oldValue === null || oldValue === undefined) &&
      newValue !== null &&
      newValue !== undefined
    )
      return false;
    if (
      (newValue === null || newValue === undefined) &&
      oldValue !== null &&
      oldValue !== undefined
    )
      return false;

    // Handle different types
    const oldType = typeof oldValue;
    const newType = typeof newValue;

    if (oldType !== newType) return false;

    // Handle dates
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() === newValue.getTime();
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (oldValue.length !== newValue.length) return false;

      // Simple array comparison (order-sensitive)
      // For a more complex comparison, implement a deeper comparison algorithm
      for (let i = 0; i < oldValue.length; i++) {
        if (!this.areValuesEqual(oldValue[i], newValue[i])) return false;
      }

      return true;
    }

    // Handle objects
    if (oldType === 'object' && newType === 'object') {
      const oldKeys = Object.keys(oldValue);
      const newKeys = Object.keys(newValue);

      if (oldKeys.length !== newKeys.length) return false;

      // Check if all keys in oldValue exist in newValue with the same values
      for (const key of oldKeys) {
        if (!newValue.hasOwnProperty(key)) return false;
        if (!this.areValuesEqual(oldValue[key], newValue[key])) return false;
      }

      return true;
    }

    // Handle primitives
    return oldValue === newValue;
  }

  /**
   * Store lineage record
   * @param record Lineage record
   * @returns Stored record
   */
  private async storeLineageRecord(record: DataLineageRecord): Promise<DataLineageRecord> {
    try {
      // Ideally, this would save to a database table
      // For now, we'll mock saving to a database

      // Return a copy with fake ID
      return {
        ...record,
        id: Date.now(),
      };

      // In a real implementation with a database:
      // const result = await this.pool.query(
      //   `INSERT INTO data_lineage
      //   (entity_type, entity_id, change_timestamp, source_type, source_id, operation_type, field_changes, metadata)
      //   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      //   RETURNING id`,
      //   [
      //     record.entityType,
      //     record.entityId,
      //     record.changeTimestamp,
      //     record.sourceType,
      //     record.sourceId,
      //     record.operationType,
      //     JSON.stringify(record.fieldChanges),
      //     JSON.stringify(record.metadata || {})
      //   ]
      // );
      //
      // return {
      //   ...record,
      //   id: result.rows[0].id
      // };
    } catch (error) {
      logger.error('Error storing lineage record', {
        component: 'DataLineageTracker',
        entityType: record.entityType,
        entityId: record.entityId,
        error,
      });

      throw error;
    }
  }

  /**
   * Get lineage history for an entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param options Query options
   * @returns Lineage history
   */
  async getLineageHistory(
    entityType: string,
    entityId: string,
    options: LineageQueryOptions = {}
  ): Promise<DataLineageRecord[]> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll return a mock result

      const mockHistory: DataLineageRecord[] = [
        {
          id: 1,
          entityType,
          entityId,
          changeTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          sourceType: ChangeSourceType.IMPORT,
          sourceId: 'initial_import',
          operationType: ChangeOperationType.CREATE,
          fieldChanges: [
            { field: 'address', newValue: '123 Test Street' },
            { field: 'propertyType', newValue: 'RES' },
            { field: 'value', newValue: '250000' },
          ],
        },
        {
          id: 2,
          entityType,
          entityId,
          changeTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          sourceType: ChangeSourceType.USER,
          sourceId: 'user_123',
          operationType: ChangeOperationType.UPDATE,
          fieldChanges: [{ field: 'value', oldValue: '250000', newValue: '275000' }],
          metadata: { reason: 'Appraisal update' },
        },
      ];

      // Apply filters based on options
      let filteredHistory = [...mockHistory];

      if (options.startDate) {
        filteredHistory = filteredHistory.filter(
          record => record.changeTimestamp >= options.startDate!
        );
      }

      if (options.endDate) {
        filteredHistory = filteredHistory.filter(
          record => record.changeTimestamp <= options.endDate!
        );
      }

      if (options.sourceTypes && options.sourceTypes.length > 0) {
        filteredHistory = filteredHistory.filter(record =>
          options.sourceTypes!.includes(record.sourceType)
        );
      }

      if (options.operationTypes && options.operationTypes.length > 0) {
        filteredHistory = filteredHistory.filter(record =>
          options.operationTypes!.includes(record.operationType)
        );
      }

      if (options.fields && options.fields.length > 0) {
        filteredHistory = filteredHistory.filter(record =>
          record.fieldChanges.some(change => options.fields!.includes(change.field))
        );
      }

      // Apply pagination
      if (options.offset || options.limit) {
        const offset = options.offset || 0;
        const limit = options.limit || filteredHistory.length;

        filteredHistory = filteredHistory.slice(offset, offset + limit);
      }

      return filteredHistory;

      // In a real implementation with a database:
      // let query = `
      //   SELECT * FROM data_lineage
      //   WHERE entity_type = $1 AND entity_id = $2
      // `;
      //
      // const params = [entityType, entityId];
      // let paramIndex = 3;
      //
      // if (options.startDate) {
      //   query += ` AND change_timestamp >= $${paramIndex++}`;
      //   params.push(options.startDate);
      // }
      //
      // if (options.endDate) {
      //   query += ` AND change_timestamp <= $${paramIndex++}`;
      //   params.push(options.endDate);
      // }
      //
      // if (options.sourceTypes && options.sourceTypes.length > 0) {
      //   query += ` AND source_type = ANY($${paramIndex++})`;
      //   params.push(options.sourceTypes);
      // }
      //
      // if (options.operationTypes && options.operationTypes.length > 0) {
      //   query += ` AND operation_type = ANY($${paramIndex++})`;
      //   params.push(options.operationTypes);
      // }
      //
      // // For fields filtering, we'd need a more complex query since field_changes is JSON
      // // This is simplified:
      // if (options.fields && options.fields.length > 0) {
      //   const fieldConditions = options.fields.map((field, i) => {
      //     const idx = paramIndex + i;
      //     return `field_changes @> ANY(ARRAY[jsonb_build_array(jsonb_build_object('field', $${idx}))])`;
      //   });
      //
      //   query += ` AND (${fieldConditions.join(' OR ')})`;
      //   params.push(...options.fields);
      //   paramIndex += options.fields.length;
      // }
      //
      // query += ` ORDER BY change_timestamp DESC`;
      //
      // if (options.limit) {
      //   query += ` LIMIT $${paramIndex++}`;
      //   params.push(options.limit);
      // }
      //
      // if (options.offset) {
      //   query += ` OFFSET $${paramIndex++}`;
      //   params.push(options.offset);
      // }
      //
      // const result = await this.pool.query(query, params);
      //
      // return result.rows.map(row => ({
      //   id: row.id,
      //   entityType: row.entity_type,
      //   entityId: row.entity_id,
      //   changeTimestamp: row.change_timestamp,
      //   sourceType: row.source_type,
      //   sourceId: row.source_id,
      //   operationType: row.operation_type,
      //   fieldChanges: row.field_changes,
      //   metadata: row.metadata
      // }));
    } catch (error) {
      logger.error('Error getting lineage history', {
        component: 'DataLineageTracker',
        entityType,
        entityId,
        error,
      });

      throw error;
    }
  }

  /**
   * Get data provenance for a specific field
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param field Field name
   * @returns Lineage records for the field
   */
  async getFieldProvenance(
    entityType: string,
    entityId: string,
    field: string
  ): Promise<DataLineageRecord[]> {
    try {
      // Get the full history first
      const history = await this.getLineageHistory(entityType, entityId);

      // Filter for records that include changes to the specified field
      return history.filter(record => record.fieldChanges.some(change => change.field === field));

      // In a real implementation with a database:
      // const query = `
      //   SELECT * FROM data_lineage
      //   WHERE entity_type = $1 AND entity_id = $2
      //   AND field_changes @> ANY(ARRAY[jsonb_build_array(jsonb_build_object('field', $3))])
      //   ORDER BY change_timestamp DESC
      // `;
      //
      // const result = await this.pool.query(query, [entityType, entityId, field]);
      //
      // return result.rows.map(row => ({
      //   id: row.id,
      //   entityType: row.entity_type,
      //   entityId: row.entity_id,
      //   changeTimestamp: row.change_timestamp,
      //   sourceType: row.source_type,
      //   sourceId: row.source_id,
      //   operationType: row.operation_type,
      //   fieldChanges: row.field_changes,
      //   metadata: row.metadata
      // }));
    } catch (error) {
      logger.error('Error getting field provenance', {
        component: 'DataLineageTracker',
        entityType,
        entityId,
        field,
        error,
      });

      throw error;
    }
  }

  /**
   * Get all changes made by a source
   * @param sourceType Source type
   * @param sourceId Source ID
   * @param options Query options
   * @returns Lineage records for the source
   */
  async getChangesBySource(
    sourceType: ChangeSourceType,
    sourceId: string,
    options: LineageQueryOptions = {}
  ): Promise<DataLineageRecord[]> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll return a mock result

      // Mock data (would come from database in real implementation)
      const mockChanges: DataLineageRecord[] = [
        {
          id: 1,
          entityType: 'property',
          entityId: 'PROP123',
          changeTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          sourceType,
          sourceId,
          operationType: ChangeOperationType.UPDATE,
          fieldChanges: [{ field: 'value', oldValue: '250000', newValue: '275000' }],
        },
        {
          id: 2,
          entityType: 'property',
          entityId: 'PROP456',
          changeTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
          sourceType,
          sourceId,
          operationType: ChangeOperationType.UPDATE,
          fieldChanges: [{ field: 'propertyType', oldValue: 'RES', newValue: 'COM' }],
        },
      ];

      // Apply filters based on options
      let filteredChanges = [...mockChanges];

      if (options.startDate) {
        filteredChanges = filteredChanges.filter(
          record => record.changeTimestamp >= options.startDate!
        );
      }

      if (options.endDate) {
        filteredChanges = filteredChanges.filter(
          record => record.changeTimestamp <= options.endDate!
        );
      }

      if (options.operationTypes && options.operationTypes.length > 0) {
        filteredChanges = filteredChanges.filter(record =>
          options.operationTypes!.includes(record.operationType)
        );
      }

      if (options.fields && options.fields.length > 0) {
        filteredChanges = filteredChanges.filter(record =>
          record.fieldChanges.some(change => options.fields!.includes(change.field))
        );
      }

      // Apply pagination
      if (options.offset || options.limit) {
        const offset = options.offset || 0;
        const limit = options.limit || filteredChanges.length;

        filteredChanges = filteredChanges.slice(offset, offset + limit);
      }

      return filteredChanges;

      // In a real implementation with a database:
      // let query = `
      //   SELECT * FROM data_lineage
      //   WHERE source_type = $1 AND source_id = $2
      // `;
      //
      // const params = [sourceType, sourceId];
      // let paramIndex = 3;
      //
      // if (options.startDate) {
      //   query += ` AND change_timestamp >= $${paramIndex++}`;
      //   params.push(options.startDate);
      // }
      //
      // if (options.endDate) {
      //   query += ` AND change_timestamp <= $${paramIndex++}`;
      //   params.push(options.endDate);
      // }
      //
      // if (options.operationTypes && options.operationTypes.length > 0) {
      //   query += ` AND operation_type = ANY($${paramIndex++})`;
      //   params.push(options.operationTypes);
      // }
      //
      // query += ` ORDER BY change_timestamp DESC`;
      //
      // if (options.limit) {
      //   query += ` LIMIT $${paramIndex++}`;
      //   params.push(options.limit);
      // }
      //
      // if (options.offset) {
      //   query += ` OFFSET $${paramIndex++}`;
      //   params.push(options.offset);
      // }
      //
      // const result = await this.pool.query(query, params);
      //
      // return result.rows.map(row => ({
      //   id: row.id,
      //   entityType: row.entity_type,
      //   entityId: row.entity_id,
      //   changeTimestamp: row.change_timestamp,
      //   sourceType: row.source_type,
      //   sourceId: row.source_id,
      //   operationType: row.operation_type,
      //   fieldChanges: row.field_changes,
      //   metadata: row.metadata
      // }));
    } catch (error) {
      logger.error('Error getting changes by source', {
        component: 'DataLineageTracker',
        sourceType,
        sourceId,
        error,
      });

      throw error;
    }
  }

  /**
   * Generate lineage report for an entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns Lineage report
   */
  async generateLineageReport(entityType: string, entityId: string): Promise<any> {
    try {
      // Get the full history
      const history = await this.getLineageHistory(entityType, entityId);

      // Extract unique fields that have been changed
      const changedFields = new Set<string>();
      history.forEach(record => {
        record.fieldChanges.forEach(change => {
          changedFields.add(change.field);
        });
      });

      // Generate field-level provenance
      const fieldProvenance: Record<string, any[]> = {};

      for (const field of changedFields) {
        const fieldHistory = history.filter(record =>
          record.fieldChanges.some(change => change.field === field)
        );

        fieldProvenance[field] = fieldHistory.map(record => ({
          timestamp: record.changeTimestamp,
          sourceType: record.sourceType,
          sourceId: record.sourceId,
          operation: record.operationType,
          oldValue: record.fieldChanges.find(c => c.field === field)?.oldValue,
          newValue: record.fieldChanges.find(c => c.field === field)?.newValue,
        }));
      }

      // Count changes by source
      const sourceChanges: Record<string, number> = {};
      history.forEach(record => {
        const key = `${record.sourceType}:${record.sourceId}`;
        sourceChanges[key] = (sourceChanges[key] || 0) + 1;
      });

      return {
        entityType,
        entityId,
        totalChanges: history.length,
        firstChangeTimestamp:
          history.length > 0 ? history[history.length - 1].changeTimestamp : null,
        lastChangeTimestamp: history.length > 0 ? history[0].changeTimestamp : null,
        changedFields: Array.from(changedFields),
        sourceBreakdown: Object.entries(sourceChanges).map(([key, count]) => {
          const [sourceType, sourceId] = key.split(':');
          return { sourceType, sourceId, count };
        }),
        fieldProvenance,
      };
    } catch (error) {
      logger.error('Error generating lineage report', {
        component: 'DataLineageTracker',
        entityType,
        entityId,
        error,
      });

      throw error;
    }
  }
}

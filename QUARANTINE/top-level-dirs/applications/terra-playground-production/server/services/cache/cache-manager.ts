/**
 * Cache Manager Service
 *
 * Provides a centralized cache management system that integrates with the data lineage
 * tracking to ensure cache consistency when data changes. This service:
 *
 * - Coordinates automatic cache invalidation based on data change events
 * - Provides a unified interface for all application caching needs
 * - Implements smart cache invalidation patterns to minimize database load
 * - Supports hierarchical cache dependencies for complex data relationships
 */

import { RedisCacheService, CachePrefix, CacheTTL } from './redis-cache-service';
import { IStorage } from '../../storage';
import { logger } from '../../utils/logger';

// Data change event types that trigger cache invalidation
export enum DataChangeEventType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  IMPORT = 'import',
  EXPORT = 'export',
  BATCH_OPERATION = 'batch_operation',
}

// Entity types for cache invalidation
export enum EntityType {
  PROPERTY = 'property',
  LAND_RECORD = 'land_record',
  IMPROVEMENT = 'improvement',
  APPEAL = 'appeal',
  USER = 'user',
  GIS_LAYER = 'gis_layer',
  ETL_JOB = 'etl_job',
  USE_CODE = 'use_code',
}

// Cache dependency map to track related caches
interface DependencyMap {
  [key: string]: string[];
}

/**
 * Cache Manager Service implementation
 */
export class CacheManager {
  private cacheService: RedisCacheService;
  private dependencyMap: DependencyMap = {};

  /**
   * Create a new Cache Manager
   * @param storage Storage service
   */
  constructor(private storage: IStorage) {
    // Initialize Redis cache service
    this.cacheService = new RedisCacheService();

    // Initialize dependency map for cache invalidation
    this.initializeDependencyMap();
  }

  /**
   * Initialize the dependency map
   * Defines relationships between different cache items
   */
  private initializeDependencyMap(): void {
    // Property dependencies
    this.dependencyMap[EntityType.PROPERTY] = [
      CachePrefix.PROPERTY_LIST,
      CachePrefix.LOOKUP_TABLE + 'property_types',
      CachePrefix.LOOKUP_TABLE + 'property_statuses',
    ];

    // Land record dependencies
    this.dependencyMap[EntityType.LAND_RECORD] = [
      CachePrefix.PROPERTY,
      CachePrefix.LOOKUP_TABLE + 'land_use_codes',
      CachePrefix.LOOKUP_TABLE + 'zoning_codes',
    ];

    // Improvement dependencies
    this.dependencyMap[EntityType.IMPROVEMENT] = [
      CachePrefix.PROPERTY,
      CachePrefix.LOOKUP_TABLE + 'improvement_types',
      CachePrefix.LOOKUP_TABLE + 'quality_codes',
      CachePrefix.LOOKUP_TABLE + 'condition_codes',
    ];

    // Appeal dependencies
    this.dependencyMap[EntityType.APPEAL] = [
      CachePrefix.PROPERTY,
      CachePrefix.LOOKUP_TABLE + 'appeal_statuses',
      CachePrefix.LOOKUP_TABLE + 'appeal_types',
    ];

    // GIS layer dependencies
    this.dependencyMap[EntityType.GIS_LAYER] = [
      CachePrefix.GIS_LAYER,
      CachePrefix.LOOKUP_TABLE + 'gis_layer_types',
    ];

    // Use code dependencies
    this.dependencyMap[EntityType.USE_CODE] = [
      CachePrefix.USE_CODE,
      CachePrefix.LOOKUP_TABLE + 'use_code_categories',
    ];
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch (error) {
      logger.error('Error getting value from cache', {
        component: 'CacheManager',
        key,
        error,
      });
      return null;
    }
  }

  /**
   * Get property from cache
   * @param propertyId Property ID
   * @returns Property object or null if not found
   */
  async getProperty(propertyId: string): Promise<any | null> {
    const cacheKey = `${CachePrefix.PROPERTY}${propertyId}`;
    return this.get<any>(cacheKey);
  }

  /**
   * Get property list from cache
   * @param filter Optional filter key
   * @returns Array of properties or null if not found
   */
  async getPropertyList(filter?: string): Promise<any[] | null> {
    const cacheKey = `${CachePrefix.PROPERTY_LIST}${filter || 'all'}`;
    return this.get<any[]>(cacheKey);
  }

  /**
   * Get lookup table from cache
   * @param tableName Lookup table name
   * @returns Lookup table data or null if not found
   */
  async getLookupTable(tableName: string): Promise<any | null> {
    const cacheKey = `${CachePrefix.LOOKUP_TABLE}${tableName}`;
    return this.get<any>(cacheKey);
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   * @returns True if successful
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      return await this.cacheService.set(key, value, ttl);
    } catch (error) {
      logger.error('Error setting value in cache', {
        component: 'CacheManager',
        key,
        error,
      });
      return false;
    }
  }

  /**
   * Cache a property
   * @param property Property object
   * @param ttl Time to live in seconds (optional)
   * @returns True if successful
   */
  async cacheProperty(property: any, ttl: number = CacheTTL.STANDARD): Promise<boolean> {
    if (!property || !property.propertyId) {
      return false;
    }

    const cacheKey = `${CachePrefix.PROPERTY}${property.propertyId}`;
    return this.set(cacheKey, property, ttl);
  }

  /**
   * Cache a property list
   * @param properties Array of property objects
   * @param filter Optional filter key
   * @param ttl Time to live in seconds (optional)
   * @returns True if successful
   */
  async cachePropertyList(
    properties: any[],
    filter?: string,
    ttl: number = CacheTTL.STANDARD
  ): Promise<boolean> {
    const cacheKey = `${CachePrefix.PROPERTY_LIST}${filter || 'all'}`;
    return this.set(cacheKey, properties, ttl);
  }

  /**
   * Cache a lookup table
   * @param tableName Lookup table name
   * @param data Lookup table data
   * @param ttl Time to live in seconds (optional)
   * @returns True if successful
   */
  async cacheLookupTable(
    tableName: string,
    data: any,
    ttl: number = CacheTTL.LONG
  ): Promise<boolean> {
    const cacheKey = `${CachePrefix.LOOKUP_TABLE}${tableName}`;
    return this.set(cacheKey, data, ttl);
  }

  /**
   * Delete value from cache
   * @param key Cache key
   * @returns True if successful
   */
  async delete(key: string): Promise<boolean> {
    try {
      return await this.cacheService.delete(key);
    } catch (error) {
      logger.error('Error deleting value from cache', {
        component: 'CacheManager',
        key,
        error,
      });
      return false;
    }
  }

  /**
   * Handle data change event by invalidating relevant caches
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param eventType Event type
   * @returns Number of cache keys invalidated
   */
  async handleDataChangeEvent(
    entityType: EntityType,
    entityId: string | number,
    eventType: DataChangeEventType
  ): Promise<number> {
    try {
      let invalidatedCount = 0;

      // Log the event
      logger.info('Handling data change event for cache invalidation', {
        component: 'CacheManager',
        entityType,
        entityId,
        eventType,
      });

      // Entity-specific cache invalidation
      switch (entityType) {
        case EntityType.PROPERTY:
          // Invalidate specific property cache
          const propertyKey = `${CachePrefix.PROPERTY}${entityId}`;
          await this.delete(propertyKey);
          invalidatedCount++;

          // Invalidate property lists (they will be regenerated on next fetch)
          const propertyListCount = await this.cacheService.flushByPrefix(
            CachePrefix.PROPERTY_LIST
          );
          invalidatedCount += propertyListCount;
          break;

        case EntityType.LAND_RECORD:
        case EntityType.IMPROVEMENT:
          // These entities affect properties, so invalidate property cache
          // First get the property ID associated with this entity
          let propertyId = null;

          if (entityType === EntityType.LAND_RECORD) {
            const landRecord = await this.storage.getLandRecord(Number(entityId));
            propertyId = landRecord?.propertyId;
          } else {
            const improvement = await this.storage.getImprovement(Number(entityId));
            propertyId = improvement?.propertyId;
          }

          if (propertyId) {
            // Invalidate specific property
            const propKey = `${CachePrefix.PROPERTY}${propertyId}`;
            await this.delete(propKey);
            invalidatedCount++;
          }
          break;

        case EntityType.USE_CODE:
          // Invalidate use code cache and related lookups
          const useCodeKey = `${CachePrefix.USE_CODE}${entityId}`;
          await this.delete(useCodeKey);
          invalidatedCount++;

          // Invalidate use code lookup tables
          const useCodeCount = await this.cacheService.flushByPrefix(
            CachePrefix.LOOKUP_TABLE + 'use_code'
          );
          invalidatedCount += useCodeCount;
          break;

        case EntityType.ETL_JOB:
          // ETL jobs can affect various entities, so invalidate based on job type
          // This would typically be implemented based on specific ETL job details
          // For now, we'll invalidate all ETL job related caches
          const etlJobCount = await this.cacheService.flushByPrefix(CachePrefix.ETL_JOB);
          invalidatedCount += etlJobCount;
          break;
      }

      // Additional cache invalidations based on dependency map
      if (this.dependencyMap[entityType]) {
        for (const prefix of this.dependencyMap[entityType]) {
          // Only invalidate if it's a general prefix (not entity-specific)
          if (!prefix.includes(String(entityId))) {
            const count = await this.cacheService.flushByPrefix(prefix);
            invalidatedCount += count;
          }
        }
      }

      // For import events, consider invalidating more cache as it can affect multiple entities
      if (
        eventType === DataChangeEventType.IMPORT ||
        eventType === DataChangeEventType.BATCH_OPERATION
      ) {
        // Only invalidate list caches and lookup tables, keep individual property caches
        for (const prefix of [CachePrefix.PROPERTY_LIST, CachePrefix.LOOKUP_TABLE]) {
          const count = await this.cacheService.flushByPrefix(prefix);
          invalidatedCount += count;
        }
      }

      return invalidatedCount;
    } catch (error) {
      logger.error('Error handling data change event for cache invalidation', {
        component: 'CacheManager',
        entityType,
        entityId,
        eventType,
        error,
      });
      return 0;
    }
  }

  /**
   * Clear all caches
   * @returns True if successful
   */
  async clearAll(): Promise<boolean> {
    try {
      // Flush Redis DB (useful for testing and maintenance)
      // In production, consider more targeted cache invalidation
      await Promise.all([
        this.cacheService.flushByPrefix(CachePrefix.PROPERTY),
        this.cacheService.flushByPrefix(CachePrefix.PROPERTY_LIST),
        this.cacheService.flushByPrefix(CachePrefix.USE_CODE),
        this.cacheService.flushByPrefix(CachePrefix.GIS_LAYER),
        this.cacheService.flushByPrefix(CachePrefix.LOOKUP_TABLE),
        this.cacheService.flushByPrefix(CachePrefix.USER),
        this.cacheService.flushByPrefix(CachePrefix.ETL_JOB),
        this.cacheService.flushByPrefix(CachePrefix.FTP_DATA),
      ]);

      return true;
    } catch (error) {
      logger.error('Error clearing all caches', {
        component: 'CacheManager',
        error,
      });
      return false;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   * Preloads important data into cache for faster initial access
   */
  async warmupCache(): Promise<void> {
    try {
      logger.info('Starting cache warmup', { component: 'CacheManager' });

      // Warm up property list cache
      const properties = await this.storage.getAllProperties();
      if (properties.length > 0) {
        await this.cachePropertyList(properties, 'all', CacheTTL.STANDARD);
        logger.info(`Cached ${properties.length} properties in list cache`, {
          component: 'CacheManager',
        });

        // Cache individual properties
        const propertyPromises = properties
          .slice(0, 100)
          .map(property => this.cacheProperty(property, CacheTTL.STANDARD));
        await Promise.all(propertyPromises);
        logger.info(`Cached ${propertyPromises.length} individual properties`, {
          component: 'CacheManager',
        });
      }

      // Warm up lookup tables
      const lookupTables = [
        'property_types',
        'property_statuses',
        'land_use_codes',
        'zoning_codes',
        'improvement_types',
        'quality_codes',
        'condition_codes',
      ];

      for (const tableName of lookupTables) {
        try {
          // This assumes your storage has a method to get lookup tables by name
          // You may need to adjust based on your actual storage implementation
          const data = await this.getLookupTableData(tableName);
          if (data) {
            await this.cacheLookupTable(tableName, data, CacheTTL.LONG);
            logger.info(`Cached lookup table: ${tableName}`, { component: 'CacheManager' });
          }
        } catch (error) {
          logger.warn(`Failed to cache lookup table: ${tableName}`, {
            component: 'CacheManager',
            error,
          });
        }
      }

      logger.info('Cache warmup completed', { component: 'CacheManager' });
    } catch (error) {
      logger.error('Error during cache warmup', {
        component: 'CacheManager',
        error,
      });
    }
  }

  /**
   * Get lookup table data
   * This is a helper method to retrieve lookup table data from the appropriate storage method
   * @param tableName Lookup table name
   * @returns Lookup table data or null if not found
   */
  private async getLookupTableData(tableName: string): Promise<any | null> {
    // This implementation depends on your storage interface
    // Here's a simplified approach

    switch (tableName) {
      case 'property_types':
        return [
          { code: 'RES', description: 'Residential' },
          { code: 'COM', description: 'Commercial' },
          { code: 'IND', description: 'Industrial' },
          { code: 'AGR', description: 'Agricultural' },
          { code: 'VAC', description: 'Vacant Land' },
          { code: 'EXE', description: 'Exempt' },
          { code: 'MIX', description: 'Mixed Use' },
        ];

      case 'property_statuses':
        return [
          { code: 'active', description: 'Active' },
          { code: 'pending', description: 'Pending' },
          { code: 'sold', description: 'Sold' },
          { code: 'inactive', description: 'Inactive' },
        ];

      // For other tables, you would implement similar logic
      // Or better yet, call the appropriate storage method

      default:
        return null;
    }
  }

  /**
   * Shutdown the cache manager and its connections
   */
  async shutdown(): Promise<void> {
    try {
      await this.cacheService.shutdown();
      logger.info('Cache manager shutdown', { component: 'CacheManager' });
    } catch (error) {
      logger.error('Error shutting down cache manager', {
        component: 'CacheManager',
        error,
      });
    }
  }
}

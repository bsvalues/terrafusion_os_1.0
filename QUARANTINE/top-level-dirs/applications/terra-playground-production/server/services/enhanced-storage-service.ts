/**
 * Enhanced Storage Service
 *
 * An extension of the base storage service that adds performance optimizations:
 *
 * - Batch processing for large datasets with automatic chunking
 * - Parallel processing for independent operations
 * - Adaptive batch sizing based on data characteristics
 * - Integrated caching with the CacheManager
 * - Progress tracking for long-running operations
 */

import { IStorage } from '../storage';
import { CacheManager, EntityType, DataChangeEventType } from './cache';
import { logger } from '../utils/logger';
import { Pool } from '@neondatabase/serverless';
import { InsertProperty } from '../../shared/schema';

// Progress callback interface for tracking batch operations
export interface ProgressCallback {
  (current: number, total: number, currentItem?: any): void;
}

// Batch operation options
export interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
  progressCallback?: ProgressCallback;
  continueOnError?: boolean;
  maxRetries?: number;
  initialDelay?: number;
  backoffFactor?: number;
  useCache?: boolean;
}

// Default batch options
const DEFAULT_BATCH_OPTIONS: BatchOptions = {
  batchSize: 100,
  concurrency: 4,
  continueOnError: false,
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  useCache: true,
};

/**
 * Enhanced Storage Service implementation
 */
export class EnhancedStorageService implements IStorage {
  private cacheManager: CacheManager;

  /**
   * Create a new Enhanced Storage Service
   * @param storage Base storage service
   */
  constructor(
    private storage: IStorage,
    private pool?: Pool
  ) {
    // Initialize cache manager
    this.cacheManager = new CacheManager(storage);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Warm up cache with frequently accessed data
    await this.cacheManager.warmupCache();
    logger.info('Enhanced Storage Service initialized', { component: 'EnhancedStorageService' });
  }

  /**
   * Process a batch of items with adaptive sizing and parallel execution
   * @param items Items to process
   * @param processor Function to process each item
   * @param options Batch options
   * @returns Processing results
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<{
    successful: R[];
    failed: { item: T; error: Error }[];
    totalProcessed: number;
  }> {
    // Merge options with defaults
    const opts = { ...DEFAULT_BATCH_OPTIONS, ...options };

    // Calculate initial batch size
    let batchSize = this.calculateAdaptiveBatchSize(items, opts.batchSize);

    const results: R[] = [];
    const failures: { item: T; error: Error }[] = [];
    let processedCount = 0;

    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      // Extract the current batch
      const batch = items.slice(i, i + batchSize);

      try {
        // Process batch items in parallel with limited concurrency
        const batchResults = await this.processWithConcurrency(
          batch,
          processor,
          opts.concurrency || 4,
          opts.continueOnError || false,
          opts.maxRetries || 1
        );

        // Add successful results
        results.push(...batchResults.successful);

        // Add failures
        failures.push(...batchResults.failed);

        // Update processed count
        processedCount += batch.length;

        // Call progress callback if provided
        if (opts.progressCallback) {
          opts.progressCallback(processedCount, items.length);
        }

        // Adaptive batch size adjustment based on failures
        if (batchResults.failed.length > 0) {
          // Reduce batch size if we encountered failures
          batchSize = Math.max(Math.floor(batchSize * 0.75), 10);
        } else if (batchResults.successful.length === batch.length) {
          // Increase batch size if all items were successful
          batchSize = Math.min(Math.floor(batchSize * 1.25), opts.batchSize || 100);
        }
      } catch (error) {
        logger.error('Error processing batch', {
          component: 'EnhancedStorageService',
          batchSize,
          currentIndex: i,
          error,
        });

        if (!opts.continueOnError) {
          throw error;
        }
      }
    }

    return {
      successful: results,
      failed: failures,
      totalProcessed: processedCount,
    };
  }

  /**
   * Process items with concurrency control
   * @param items Items to process
   * @param processor Function to process each item
   * @param concurrency Maximum number of concurrent operations
   * @param continueOnError Whether to continue on error
   * @param maxRetries Maximum number of retries
   * @returns Processing results
   */
  private async processWithConcurrency<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number,
    continueOnError: boolean,
    maxRetries: number
  ): Promise<{
    successful: R[];
    failed: { item: T; error: Error }[];
  }> {
    const successful: R[] = [];
    const failed: { item: T; error: Error }[] = [];

    // Process in chunks based on concurrency
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);

      // Create promises for each item in the chunk
      const promises = chunk.map(async (item /* , index */) => {
        try {
          // Process with retries
          let lastError: Error | undefined;

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const result = await processor(item);
              successful.push(result);
              return;
            } catch (error) {
              lastError = error as Error;

              // If this is not the last attempt, wait before retrying
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
              }
            }
          }

          // If we get here, all retries failed
          if (lastError) {
            failed.push({ item, error: lastError });

            if (!continueOnError) {
              throw lastError;
            }
          }
        } catch (error) {
          failed.push({ item, error: error as Error });

          if (!continueOnError) {
            throw error;
          }
        }
      });

      // Wait for all promises in the chunk to complete
      await Promise.all(promises);
    }

    return { successful, failed };
  }

  /**
   * Calculate adaptive batch size based on data characteristics
   * @param items Items to process
   * @param maxBatchSize Maximum batch size
   * @returns Calculated batch size
   */
  private calculateAdaptiveBatchSize<T>(items: T[], maxBatchSize: number = 100): number {
    // Start with default size
    let calculatedSize = maxBatchSize;

    // 1. Consider the total number of items
    if (items.length < maxBatchSize * 2) {
      // For small datasets, use smaller batches
      calculatedSize = Math.max(Math.floor(items.length / 4), 10);
    }

    // 2. Consider item size/complexity (if possible to determine)
    // This implementation would depend on the specific item type
    // For example, we could check the number of properties on objects
    if (items.length > 0 && typeof items[0] === 'object') {
      const sampleSize = Math.min(10, items.length);
      let averageProperties = 0;

      for (let i = 0; i < sampleSize; i++) {
        const item = items[i];
        if (item) {
          const propertyCount = Object.keys(item).length;
          averageProperties += propertyCount;
        }
      }

      averageProperties /= sampleSize;

      // Adjust batch size based on complexity
      if (averageProperties > 20) {
        // Complex objects with many properties
        calculatedSize = Math.min(calculatedSize, 50);
      } else if (averageProperties > 10) {
        // Moderate complexity
        calculatedSize = Math.min(calculatedSize, 75);
      }
    }

    // 3. System constraints (e.g., available memory)
    // This would ideally be dynamic based on system resources
    // For now, use a simple approach based on total item count
    if (items.length > 10000) {
      calculatedSize = Math.min(calculatedSize, 50);
    }

    return calculatedSize;
  }

  /**
   * Batch import properties
   * @param properties Array of properties to import
   * @param options Batch options
   * @returns Import results
   */
  async batchImportProperties(
    properties: InsertProperty[],
    options: BatchOptions = {}
  ): Promise<{
    successful: any[];
    failed: { item: InsertProperty; error: Error }[];
    totalProcessed: number;
  }> {
    logger.info(`Starting batch import of ${properties.length} properties`, {
      component: 'EnhancedStorageService',
    });

    const processor = async (property: InsertProperty) => {
      const result = await this.storage.createProperty(property);

      // Update cache if enabled
      if (options.useCache !== false) {
        await this.cacheManager.cacheProperty(result);

        // Invalidate property list cache
        await this.cacheManager.handleDataChangeEvent(
          EntityType.PROPERTY,
          result.propertyId,
          DataChangeEventType.CREATE
        );
      }

      return result;
    };

    return this.processBatch(properties, processor, options);
  }

  /**
   * Batch update properties
   * @param propertyUpdates Array of property updates
   * @param options Batch options
   * @returns Update results
   */
  async batchUpdateProperties(
    propertyUpdates: { propertyId: string; updates: Partial<InsertProperty> }[],
    options: BatchOptions = {}
  ): Promise<{
    successful: any[];
    failed: { item: { propertyId: string; updates: Partial<InsertProperty> }; error: Error }[];
    totalProcessed: number;
  }> {
    logger.info(`Starting batch update of ${propertyUpdates.length} properties`, {
      component: 'EnhancedStorageService',
    });

    const processor = async (update: { propertyId: string; updates: Partial<InsertProperty> }) => {
      const result = await this.storage.updateProperty(update.propertyId, update.updates);

      // Update cache if enabled
      if (options.useCache !== false) {
        await this.cacheManager.handleDataChangeEvent(
          EntityType.PROPERTY,
          update.propertyId,
          DataChangeEventType.UPDATE
        );
      }

      return result;
    };

    return this.processBatch(propertyUpdates, processor, options);
  }

  /**
   * Execute a database transaction with retry logic
   * @param callback Transaction callback
   * @param retries Maximum number of retries
   * @returns Transaction result
   */
  async transaction<T>(callback: (client: any) => Promise<T>, retries: number = 3): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not available');
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        lastError = error as Error;

        logger.error(`Transaction failed (attempt ${attempt + 1}/${retries + 1})`, {
          component: 'EnhancedStorageService',
          error: lastError,
        });

        // If this is not the last attempt, wait before retrying
        if (attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } finally {
        client.release();
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  /**
   * Get a property by ID with caching
   * @param id Property ID
   * @returns Property or undefined
   */
  async getProperty(id: number): Promise<any | undefined> {
    const propertyId = id.toString();

    // Try to get from cache first
    const cachedProperty = await this.cacheManager.getProperty(propertyId);
    if (cachedProperty) {
      return cachedProperty;
    }

    // If not found in cache, get from storage
    const property = await this.storage.getProperty(id);

    // Cache the result if found
    if (property) {
      await this.cacheManager.cacheProperty(property);
    }

    return property;
  }

  /**
   * Get a property by property ID with caching
   * @param propertyId Property ID string
   * @returns Property or undefined
   */
  async getPropertyByPropertyId(propertyId: string): Promise<any | undefined> {
    // Try to get from cache first
    const cachedProperty = await this.cacheManager.getProperty(propertyId);
    if (cachedProperty) {
      return cachedProperty;
    }

    // If not found in cache, get from storage
    const property = await this.storage.getPropertyByPropertyId(propertyId);

    // Cache the result if found
    if (property) {
      await this.cacheManager.cacheProperty(property);
    }

    return property;
  }

  /**
   * Get all properties with caching
   * @returns Array of properties
   */
  async getAllProperties(): Promise<any[]> {
    // Try to get from cache first
    const cachedProperties = await this.cacheManager.getPropertyList();
    if (cachedProperties) {
      return cachedProperties;
    }

    // If not found in cache, get from storage
    const properties = await this.storage.getAllProperties();

    // Cache the result
    await this.cacheManager.cachePropertyList(properties);

    return properties;
  }

  /**
   * Create a property with cache invalidation
   * @param property Property to create
   * @returns Created property
   */
  async createProperty(property: InsertProperty): Promise<any> {
    // Create in storage
    const createdProperty = await this.storage.createProperty(property);

    // Cache the new property
    await this.cacheManager.cacheProperty(createdProperty);

    // Invalidate property list cache
    await this.cacheManager.handleDataChangeEvent(
      EntityType.PROPERTY,
      createdProperty.propertyId,
      DataChangeEventType.CREATE
    );

    return createdProperty;
  }

  /**
   * Update a property with cache invalidation
   * @param propertyId Property ID
   * @param updates Property updates
   * @returns Updated property
   */
  async updateProperty(propertyId: string, updates: Partial<InsertProperty>): Promise<any> {
    // Update in storage
    const updatedProperty = await this.storage.updateProperty(propertyId, updates);

    // Invalidate caches
    await this.cacheManager.handleDataChangeEvent(
      EntityType.PROPERTY,
      propertyId,
      DataChangeEventType.UPDATE
    );

    return updatedProperty;
  }

  /**
   * Delete a property with cache invalidation
   * @param propertyId Property ID
   * @returns True if deleted
   */
  async deleteProperty(propertyId: string): Promise<boolean> {
    // Delete from storage
    const deleted = await this.storage.deleteProperty(propertyId);

    if (deleted) {
      // Invalidate caches
      await this.cacheManager.handleDataChangeEvent(
        EntityType.PROPERTY,
        propertyId,
        DataChangeEventType.DELETE
      );
    }

    return deleted;
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    // Shutdown cache manager
    await this.cacheManager.shutdown();
    logger.info('Enhanced Storage Service shutdown', { component: 'EnhancedStorageService' });
  }

  // Forward all other methods to the underlying storage implementation
  // This is a proxy pattern that allows us to selectively override methods

  getUser(id: number) {
    return this.storage.getUser(id);
  }
  getUserByUsername(username: string) {
    return this.storage.getUserByUsername(username);
  }
  createUser(user: any) {
    return this.storage.createUser(user);
  }
  updateUser(id: number, updates: any) {
    return this.storage.updateUser(id, updates);
  }
  deleteUser(id: number) {
    return this.storage.deleteUser(id);
  }

  getLandRecord(id: number) {
    return this.storage.getLandRecord(id);
  }
  getLandRecordByPropertyId(propertyId: string) {
    return this.storage.getLandRecordByPropertyId(propertyId);
  }
  createLandRecord(landRecord: any) {
    return this.storage.createLandRecord(landRecord);
  }
  updateLandRecord(id: number, updates: any) {
    return this.storage.updateLandRecord(id, updates);
  }
  deleteLandRecord(id: number) {
    return this.storage.deleteLandRecord(id);
  }

  getImprovement(id: number) {
    return this.storage.getImprovement(id);
  }
  getImprovementsByPropertyId(propertyId: string) {
    return this.storage.getImprovementsByPropertyId(propertyId);
  }
  createImprovement(improvement: any) {
    return this.storage.createImprovement(improvement);
  }
  updateImprovement(id: number, updates: any) {
    return this.storage.updateImprovement(id, updates);
  }
  deleteImprovement(id: number) {
    return this.storage.deleteImprovement(id);
  }

  // Add all other storage methods as needed
}

/**
 * Cache Performance Testing Script
 *
 * This script tests the performance of the caching system by:
 * 1. Measuring response times with and without cache
 * 2. Testing cache invalidation after data changes
 * 3. Benchmarking batch operations with different configurations
 * 4. Verifying resilience under high load
 */

import {
  RedisCacheService,
  CachePrefix,
  CacheTTL,
} from './server/services/cache/redis-cache-service.js';
import {
  CacheManager,
  EntityType,
  DataChangeEventType,
} from './server/services/cache/cache-manager.js';
import { EnhancedStorageService } from './server/services/enhanced-storage-service.js';
import { MemStorage } from './server/storage.js';
import fs from 'fs';
import path from 'path';

// Setup storage and cache services
const storage = new MemStorage();
const enhancedStorage = new EnhancedStorageService(storage);
const cacheService = new RedisCacheService();
const cacheManager = new CacheManager(storage);

// Sample property data for testing
const sampleProperties = [
  {
    propertyId: 'TEST001',
    address: '123 Test Street',
    parcelNumber: 'T-12345',
    propertyType: 'RES',
    status: 'active',
    acres: '1.2',
    value: '250000',
  },
  {
    propertyId: 'TEST002',
    address: '456 Sample Avenue',
    parcelNumber: 'T-67890',
    propertyType: 'COM',
    status: 'active',
    acres: '2.5',
    value: '750000',
  },
  {
    propertyId: 'TEST003',
    address: '789 Demo Boulevard',
    parcelNumber: 'T-24680',
    propertyType: 'IND',
    status: 'active',
    acres: '5.0',
    value: '1200000',
  },
];

/**
 * Measure execution time of a function
 * @param fn Function to measure
 * @param label Label for logging
 * @returns Result of the function
 */
async function measureExecutionTime(fn, label) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

/**
 * Generate a large property dataset for batch testing
 * @param count Number of properties to generate
 * @returns Array of properties
 */
function generateLargePropertyDataset(count) {
  const properties = [];

  for (let i = 0; i < count; i++) {
    const propertyId = `BATCH${i.toString().padStart(6, '0')}`;

    properties.push({
      propertyId,
      address: `${i} Batch Street`,
      parcelNumber: `B-${i}`,
      propertyType: ['RES', 'COM', 'IND', 'AGR'][i % 4],
      status: 'active',
      acres: (Math.random() * 10).toFixed(2),
      value: (Math.random() * 1000000).toFixed(0),
    });
  }

  return properties;
}

/**
 * Test cache basic operations
 */
async function testCacheBasicOperations() {
  console.log('\n=== Testing Basic Cache Operations ===');

  // Test set and get
  await cacheService.set('test:key1', 'test value', 60);
  const value1 = await cacheService.get('test:key1');
  console.log('Get cached value:', value1);

  // Test complex objects
  const complexObject = {
    id: 123,
    name: 'Test Object',
    nested: {
      field1: 'value1',
      field2: 42,
    },
  };

  await cacheService.set('test:complex', complexObject, 60);
  const value2 = await cacheService.get('test:complex');
  console.log('Get cached complex object:', value2);

  // Test multiple operations
  await cacheService.mset(
    {
      'test:multi1': 'multi value 1',
      'test:multi2': 'multi value 2',
      'test:multi3': { id: 3, name: 'Multi 3' },
    },
    60
  );

  const multiValues = await cacheService.mget(['test:multi1', 'test:multi2', 'test:multi3']);
  console.log('Multi-get results:', multiValues);

  // Test delete
  await cacheService.delete('test:key1');
  const deletedValue = await cacheService.get('test:key1');
  console.log('After delete:', deletedValue);

  // Test prefix flush
  await cacheService.set('prefix:item1', 'value1', 60);
  await cacheService.set('prefix:item2', 'value2', 60);
  await cacheService.set('prefix:item3', 'value3', 60);

  const flushCount = await cacheService.flushByPrefix('prefix:');
  console.log(`Flushed ${flushCount} items`);

  const afterFlush1 = await cacheService.get('prefix:item1');
  const afterFlush2 = await cacheService.get('prefix:item2');
  console.log('After flush:', afterFlush1, afterFlush2);
}

/**
 * Test cache performance for property operations
 */
async function testPropertyCachePerformance() {
  console.log('\n=== Testing Property Cache Performance ===');

  // Clear any existing properties and cache
  await cacheManager.clearAll();

  // Insert sample properties
  for (const property of sampleProperties) {
    await storage.createProperty(property);
  }

  // Test get property - first access (no cache)
  const { duration: firstAccessDuration } = await measureExecutionTime(
    () => enhancedStorage.getPropertyByPropertyId('TEST001'),
    'First property access (no cache)'
  );

  // Test get property - second access (with cache)
  const { duration: secondAccessDuration } = await measureExecutionTime(
    () => enhancedStorage.getPropertyByPropertyId('TEST001'),
    'Second property access (with cache)'
  );

  console.log(`Cache speedup: ${(firstAccessDuration / secondAccessDuration).toFixed(2)}x`);

  // Test update with cache invalidation
  await measureExecutionTime(
    () => enhancedStorage.updateProperty('TEST001', { value: '275000' }),
    'Update property with cache invalidation'
  );

  // Get updated property
  const updatedProperty = await enhancedStorage.getPropertyByPropertyId('TEST001');
  console.log('Updated property:', updatedProperty);

  // Test get all properties - first access (no cache)
  const { duration: firstListDuration } = await measureExecutionTime(
    () => enhancedStorage.getAllProperties(),
    'First property list access (no cache)'
  );

  // Test get all properties - second access (with cache)
  const { duration: secondListDuration } = await measureExecutionTime(
    () => enhancedStorage.getAllProperties(),
    'Second property list access (with cache)'
  );

  console.log(`List cache speedup: ${(firstListDuration / secondListDuration).toFixed(2)}x`);
}

/**
 * Test batch processing performance
 */
async function testBatchProcessingPerformance() {
  console.log('\n=== Testing Batch Processing Performance ===');

  // Clear any existing properties and cache
  await cacheManager.clearAll();

  // Generate datasets of different sizes
  const smallDataset = generateLargePropertyDataset(50);
  const mediumDataset = generateLargePropertyDataset(200);
  const largeDataset = generateLargePropertyDataset(500);

  // Test small batch
  console.log('\nTesting small batch (50 items):');
  await measureExecutionTime(
    () =>
      enhancedStorage.batchImportProperties(smallDataset, {
        batchSize: 10,
        concurrency: 2,
        progressCallback: (current, total) => {
          if (current % 10 === 0 || current === total) {
            process.stdout.write(
              `\rProgress: ${current}/${total} (${Math.round((current / total) * 100)}%)`
            );
          }
        },
      }),
    '\nSmall batch import'
  );

  // Test medium batch with different settings
  console.log('\nTesting medium batch (200 items):');

  // First with default settings
  await measureExecutionTime(
    () =>
      enhancedStorage.batchImportProperties(mediumDataset, {
        progressCallback: (current, total) => {
          if (current % 50 === 0 || current === total) {
            process.stdout.write(
              `\rProgress: ${current}/${total} (${Math.round((current / total) * 100)}%)`
            );
          }
        },
      }),
    '\nMedium batch - default settings'
  );

  // Create fresh properties for the next test
  const mediumDataset2 = generateLargePropertyDataset(200);

  // Then with optimized settings
  await measureExecutionTime(
    () =>
      enhancedStorage.batchImportProperties(mediumDataset2, {
        batchSize: 50,
        concurrency: 4,
        progressCallback: (current, total) => {
          if (current % 50 === 0 || current === total) {
            process.stdout.write(
              `\rProgress: ${current}/${total} (${Math.round((current / total) * 100)}%)`
            );
          }
        },
      }),
    '\nMedium batch - optimized settings'
  );

  // Test large batch with adaptive sizing
  console.log('\nTesting large batch (500 items) with adaptive sizing:');
  await measureExecutionTime(
    () =>
      enhancedStorage.batchImportProperties(largeDataset, {
        // Starting with a larger batch size, but it will adapt
        batchSize: 100,
        concurrency: 4,
        progressCallback: (current, total) => {
          if (current % 100 === 0 || current === total) {
            process.stdout.write(
              `\rProgress: ${current}/${total} (${Math.round((current / total) * 100)}%)`
            );
          }
        },
      }),
    '\nLarge batch - adaptive sizing'
  );
}

/**
 * Main test function
 */
async function runTests() {
  console.log('=== Cache Performance Test ===');

  try {
    // Test basic cache operations
    await testCacheBasicOperations();

    // Test property cache performance
    await testPropertyCachePerformance();

    // Test batch processing
    await testBatchProcessingPerformance();

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Shutdown services
    await cacheService.shutdown();
  }
}

// Run the tests
runTests();

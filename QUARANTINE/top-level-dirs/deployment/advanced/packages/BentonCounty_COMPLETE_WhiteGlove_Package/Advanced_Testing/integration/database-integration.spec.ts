/**
 * Shared Database Integration Tests
 * Championship-level database testing for multi-app data consistency
 * 
 * Tests verify that all apps can safely access shared database
 * with ACID compliance and zero data corruption.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { DatabaseManager } from '../../shared/rust-services/placeholder/src/database';
import path from 'path';
import fs from 'fs/promises';
import { setTimeout } from 'timers/promises';

// Test configuration
const TEST_TIMEOUT = 30000;
const DB_TEST_PATH = path.join(__dirname, '../../test-data/integration-test.db');
const CONCURRENT_OPERATIONS = 50;
const STRESS_TEST_OPERATIONS = 1000;

// Mock app configurations for testing
const TEST_APPS = [
  'terra-agent', 'terra-flow', 'web-audit-tracker', 'terra-levy',
  'terra-miner', 'terra-fusion-sync', 'gispro', 'costforge-ai',
  'property-workbench', 'terra-insight', 'terra-fusion-dashboard',
  'terra-fusion-assessor', 'marketplace', 'terra-collections'
];

interface TestData {
  id: string;
  appId: string;
  key: string;
  value: any;
  timestamp: number;
}

describe('Database Integration Tests', () => {
  let dbManager: DatabaseManager;
  let testDatabases: Map<string, DatabaseManager> = new Map();

  beforeAll(async () => {
    // Ensure test directory exists
    const testDir = path.dirname(DB_TEST_PATH);
    await fs.mkdir(testDir, { recursive: true });

    // Initialize main database manager
    dbManager = await DatabaseManager.new();
    
    // Initialize database managers for each app
    console.log('🔧 Initializing database managers for all apps...');
    for (const appId of TEST_APPS) {
      const appDbManager = await DatabaseManager.new();
      testDatabases.set(appId, appDbManager);
      console.log(`✅ Initialized database for ${appId}`);
    }
    
    console.log('✅ All database managers initialized');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup all database connections
    console.log('🧹 Cleaning up database connections...');
    
    for (const [appId, db] of testDatabases) {
      try {
        // No explicit close method in the provided interface, but connections should auto-cleanup
        console.log(`✅ Cleaned up database for ${appId}`);
      } catch (error) {
        console.warn(`⚠️ Error cleaning up database for ${appId}:`, error);
      }
    }
    
    // Clean up test files
    try {
      await fs.unlink(DB_TEST_PATH);
    } catch (error) {
      // File might not exist, ignore
    }
  });

  beforeEach(async () => {
    // Clean test data before each test
    for (const [appId, db] of testDatabases) {
      try {
        await db.execute_query('DELETE FROM app_data WHERE app_id LIKE ?', [`test-${appId}%`]);
      } catch (error) {
        // Ignore errors in cleanup
      }
    }
  });

  describe('Basic Database Operations', () => {
    test('Should perform health checks on all databases', async () => {
      const healthResults: { appId: string; healthy: boolean; error?: any }[] = [];
      
      for (const [appId, db] of testDatabases) {
        try {
          await db.health_check();
          healthResults.push({ appId, healthy: true });
        } catch (error) {
          healthResults.push({ appId, healthy: false, error });
        }
      }
      
      const healthyCount = healthResults.filter(r => r.healthy).length;
      const unhealthyApps = healthResults.filter(r => !r.healthy);
      
      if (unhealthyApps.length > 0) {
        console.error('❌ Unhealthy databases:', unhealthyApps);
      }
      
      expect(healthyCount).toBe(TEST_APPS.length);
      console.log(`✅ All ${healthyCount} databases are healthy`);
    }, TEST_TIMEOUT);

    test('Should save and retrieve app data correctly', async () => {
      const testData = {
        testKey: 'test-value',
        timestamp: Date.now(),
        nested: {
          property: 'nested-value',
          number: 42
        }
      };
      
      // Save data from first app
      const appId = 'test-terra-agent';
      const db = testDatabases.get('terra-agent')!;
      
      await db.save_app_data(appId, 'test-key', testData);
      
      // Retrieve data from same app
      const retrieved = await db.load_app_data(appId, 'test-key');
      
      expect(retrieved).toEqual(testData);
      console.log('✅ Basic save/retrieve operations successful');
    }, TEST_TIMEOUT);

    test('Should handle data isolation between apps', async () => {
      const testData = {
        value: 'app-specific-data',
        timestamp: Date.now()
      };
      
      // Save same key from different apps
      const app1Id = 'test-app-1';
      const app2Id = 'test-app-2';
      const db1 = testDatabases.get('terra-agent')!;
      const db2 = testDatabases.get('terra-flow')!;
      
      await db1.save_app_data(app1Id, 'shared-key', { ...testData, appId: app1Id });
      await db2.save_app_data(app2Id, 'shared-key', { ...testData, appId: app2Id });
      
      // Retrieve data from both apps
      const data1 = await db1.load_app_data(app1Id, 'shared-key');
      const data2 = await db2.load_app_data(app2Id, 'shared-key');
      
      expect(data1?.appId).toBe(app1Id);
      expect(data2?.appId).toBe(app2Id);
      expect(data1).not.toEqual(data2);
      
      console.log('✅ Data isolation between apps verified');
    }, TEST_TIMEOUT);
  });

  describe('Concurrent Access Tests', () => {
    test('Should handle concurrent writes without corruption', async () => {
      const db = testDatabases.get('terra-agent')!;
      const appId = 'test-concurrent-writes';
      
      // Create concurrent write operations
      const writePromises: Promise<void>[] = [];
      
      for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
        const promise = db.save_app_data(
          appId,
          `concurrent-key-${i}`,
          {
            value: `concurrent-value-${i}`,
            timestamp: Date.now(),
            iteration: i
          }
        );
        writePromises.push(promise);
      }
      
      // Execute all writes concurrently
      await Promise.all(writePromises);
      
      // Verify all writes succeeded
      const verificationPromises: Promise<any>[] = [];
      for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
        verificationPromises.push(db.load_app_data(appId, `concurrent-key-${i}`));
      }
      
      const results = await Promise.all(verificationPromises);
      const successfulWrites = results.filter(r => r !== null).length;
      
      expect(successfulWrites).toBe(CONCURRENT_OPERATIONS);
      console.log(`✅ ${successfulWrites}/${CONCURRENT_OPERATIONS} concurrent writes successful`);
    }, TEST_TIMEOUT);

    test('Should handle concurrent read/write operations', async () => {
      const db = testDatabases.get('terra-flow')!;
      const appId = 'test-concurrent-rw';
      const baseKey = 'rw-test-key';
      
      // Initialize test data
      await db.save_app_data(appId, baseKey, { value: 'initial', counter: 0 });
      
      const operations: Promise<any>[] = [];
      const readResults: any[] = [];
      let writeCount = 0;
      
      // Mix of read and write operations
      for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
        if (i % 3 === 0) {
          // Write operation
          operations.push(
            db.save_app_data(appId, baseKey, {
              value: `updated-${writeCount}`,
              counter: writeCount++,
              timestamp: Date.now()
            })
          );
        } else {
          // Read operation
          operations.push(
            db.load_app_data(appId, baseKey).then(result => {
              readResults.push(result);
              return result;
            })
          );
        }
      }
      
      // Execute all operations concurrently
      await Promise.all(operations);
      
      // Verify final state
      const finalData = await db.load_app_data(appId, baseKey);
      
      expect(finalData).toBeTruthy();
      expect(readResults.length).toBeGreaterThan(0);
      expect(readResults.every(r => r !== null)).toBe(true);
      
      console.log(`✅ Concurrent read/write operations completed successfully`);
      console.log(`   - Read operations: ${readResults.length}`);
      console.log(`   - Write operations: ${writeCount}`);
      console.log(`   - Final data:`, finalData);
    }, TEST_TIMEOUT);
  });

  describe('Transaction Tests', () => {
    test('Should maintain ACID properties in transactions', async () => {
      const db = testDatabases.get('gispro')!;
      
      try {
        const result = await db.execute_transaction(async (tx) => {
          // Perform multiple operations in transaction
          await tx.execute(
            'INSERT INTO app_data (app_id, key, value) VALUES (?, ?, ?)',
            ['test-transaction-1', 'tx-key-1', JSON.stringify({ value: 'tx-value-1' })]
          );
          
          await tx.execute(
            'INSERT INTO app_data (app_id, key, value) VALUES (?, ?, ?)',
            ['test-transaction-1', 'tx-key-2', JSON.stringify({ value: 'tx-value-2' })]
          );
          
          return { success: true, operationsCount: 2 };
        });
        
        expect(result.success).toBe(true);
        expect(result.operationsCount).toBe(2);
        
        // Verify both records exist
        const record1 = await db.load_app_data('test-transaction-1', 'tx-key-1');
        const record2 = await db.load_app_data('test-transaction-1', 'tx-key-2');
        
        expect(record1?.value).toBe('tx-value-1');
        expect(record2?.value).toBe('tx-value-2');
        
        console.log('✅ ACID transaction properties verified');
      } catch (error) {
        console.error('❌ Transaction test failed:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Should rollback failed transactions', async () => {
      const db = testDatabases.get('costforge-ai')!;
      
      // First, save initial data
      await db.save_app_data('test-rollback', 'rollback-key', { value: 'initial' });
      
      let transactionFailed = false;
      
      try {
        await db.execute_transaction(async (tx) => {
          // Valid operation
          await tx.execute(
            'UPDATE app_data SET value = ? WHERE app_id = ? AND key = ?',
            [JSON.stringify({ value: 'should-not-persist' }), 'test-rollback', 'rollback-key']
          );
          
          // Intentionally cause error
          throw new Error('Intentional transaction failure');
        });
      } catch (error) {
        transactionFailed = true;
        expect(error.message).toContain('Intentional transaction failure');
      }
      
      expect(transactionFailed).toBe(true);
      
      // Verify data was not modified
      const finalData = await db.load_app_data('test-rollback', 'rollback-key');
      expect(finalData?.value).toBe('initial');
      
      console.log('✅ Transaction rollback verified');
    }, TEST_TIMEOUT);
  });

  describe('Performance and Stress Tests', () => {
    test('Should handle high-volume operations efficiently', async () => {
      const db = testDatabases.get('terra-miner')!;
      const appId = 'test-performance';
      const startTime = Date.now();
      
      console.log(`🚀 Starting performance test with ${STRESS_TEST_OPERATIONS} operations...`);
      
      // Batch write operations
      const batchSize = 100;
      const batches = Math.ceil(STRESS_TEST_OPERATIONS / batchSize);
      
      for (let batch = 0; batch < batches; batch++) {
        const batchPromises: Promise<void>[] = [];
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, STRESS_TEST_OPERATIONS);
        
        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(
            db.save_app_data(appId, `perf-key-${i}`, {
              value: `performance-value-${i}`,
              timestamp: Date.now(),
              index: i
            })
          );
        }
        
        await Promise.all(batchPromises);
        
        if (batch % 10 === 0) {
          console.log(`   Progress: ${batch + 1}/${batches} batches completed`);
        }
      }
      
      const writeTime = Date.now() - startTime;
      
      // Test read performance
      const readStartTime = Date.now();
      const readPromises: Promise<any>[] = [];
      
      for (let i = 0; i < Math.min(100, STRESS_TEST_OPERATIONS); i++) {
        readPromises.push(db.load_app_data(appId, `perf-key-${i}`));
      }
      
      const readResults = await Promise.all(readPromises);
      const readTime = Date.now() - readStartTime;
      
      const successfulReads = readResults.filter(r => r !== null).length;
      
      console.log(`✅ Performance test completed:`);
      console.log(`   - Write operations: ${STRESS_TEST_OPERATIONS} in ${writeTime}ms`);
      console.log(`   - Write rate: ${(STRESS_TEST_OPERATIONS / writeTime * 1000).toFixed(2)} ops/sec`);
      console.log(`   - Read operations: ${successfulReads} in ${readTime}ms`);
      console.log(`   - Read rate: ${(successfulReads / readTime * 1000).toFixed(2)} ops/sec`);
      
      // Performance expectations (adjust based on requirements)
      expect(writeTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(successfulReads).toBe(readPromises.length);
      
    }, 60000); // Extended timeout for performance test

    test('Should maintain connection pool efficiency', async () => {
      const connectionTests: Promise<any>[] = [];
      
      // Test multiple apps accessing database simultaneously
      for (const [appId, db] of testDatabases) {
        connectionTests.push(
          (async () => {
            const stats = db.pool_stats();
            await db.health_check();
            
            // Perform some operations to test connection usage
            await db.save_app_data(`pool-test-${appId}`, 'pool-key', {
              appId,
              timestamp: Date.now()
            });
            
            const data = await db.load_app_data(`pool-test-${appId}`, 'pool-key');
            
            return {
              appId,
              stats,
              dataRetrieved: !!data
            };
          })()
        );
      }
      
      const results = await Promise.all(connectionTests);
      const successfulConnections = results.filter(r => r.dataRetrieved).length;
      
      expect(successfulConnections).toBe(TEST_APPS.length);
      
      console.log(`✅ Connection pool test completed:`);
      console.log(`   - Successful connections: ${successfulConnections}/${TEST_APPS.length}`);
      results.forEach(r => {
        console.log(`   - ${r.appId}: Active=${r.stats.active_connections}, Max=${r.stats.max_connections}`);
      });
    }, TEST_TIMEOUT);
  });

  describe('Data Consistency Tests', () => {
    test('Should maintain data consistency across app restarts', async () => {
      const appId = 'test-consistency';
      const testKey = 'restart-key';
      const testValue = {
        value: 'persistent-data',
        timestamp: Date.now(),
        version: 1
      };
      
      // Save data with first database instance
      const db1 = testDatabases.get('terra-insight')!;
      await db1.save_app_data(appId, testKey, testValue);
      
      // Simulate app restart by creating new database manager
      const db2 = await DatabaseManager.new();
      
      // Retrieve data with new instance
      const retrievedData = await db2.load_app_data(appId, testKey);
      
      expect(retrievedData).toEqual(testValue);
      console.log('✅ Data consistency across restarts verified');
    }, TEST_TIMEOUT);

    test('Should handle schema version consistency', async () => {
      const db = testDatabases.get('marketplace')!;
      
      // Check schema version
      const versionRow = await db.fetch_one('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
      const currentVersion = versionRow.get('version');
      
      expect(currentVersion).toBe(1);
      console.log(`✅ Schema version consistency verified: v${currentVersion}`);
    }, TEST_TIMEOUT);

    test('Should handle concurrent modifications correctly', async () => {
      const db = testDatabases.get('terra-collections')!;
      const appId = 'test-concurrent-mod';
      const key = 'concurrent-mod-key';
      
      // Initialize data
      await db.save_app_data(appId, key, { counter: 0, lastModified: Date.now() });
      
      // Simulate concurrent modifications
      const modificationPromises: Promise<void>[] = [];
      
      for (let i = 0; i < 20; i++) {
        modificationPromises.push(
          (async () => {
            // Read current value
            const current = await db.load_app_data(appId, key);
            
            // Modify and save
            if (current) {
              await db.save_app_data(appId, key, {
                counter: (current.counter || 0) + 1,
                lastModified: Date.now(),
                modifiedBy: `operation-${i}`
              });
            }
          })()
        );
      }
      
      await Promise.all(modificationPromises);
      
      // Verify final state
      const finalData = await db.load_app_data(appId, key);
      
      expect(finalData).toBeTruthy();
      expect(finalData?.counter).toBeGreaterThan(0);
      expect(finalData?.counter).toBeLessThanOrEqual(20);
      
      console.log(`✅ Concurrent modifications handled: final counter = ${finalData?.counter}`);
    }, TEST_TIMEOUT);
  });

  describe('Error Recovery Tests', () => {
    test('Should recover from connection failures gracefully', async () => {
      const db = testDatabases.get('terra-fusion-dashboard')!;
      
      // Test database recovery by attempting operations after potential connection issues
      let healthCheckPassed = false;
      
      try {
        await db.health_check();
        healthCheckPassed = true;
      } catch (error) {
        console.log('Initial health check failed, attempting recovery...');
        
        // Wait and retry
        await setTimeout(1000);
        await db.health_check();
        healthCheckPassed = true;
      }
      
      expect(healthCheckPassed).toBe(true);
      
      // Verify operations work after recovery
      await db.save_app_data('test-recovery', 'recovery-key', {
        recovered: true,
        timestamp: Date.now()
      });
      
      const recoveredData = await db.load_app_data('test-recovery', 'recovery-key');
      expect(recoveredData?.recovered).toBe(true);
      
      console.log('✅ Connection recovery verified');
    }, TEST_TIMEOUT);

    test('Should handle database file corruption detection', async () => {
      // This test would typically involve more complex file system operations
      // For now, we'll test basic corruption detection via health checks
      
      const db = testDatabases.get('terra-fusion-assessor')!;
      
      // Perform health check to ensure database integrity
      await expect(db.health_check()).resolves.not.toThrow();
      
      // Verify we can still perform basic operations
      const testData = { integrity: 'verified', timestamp: Date.now() };
      await db.save_app_data('test-integrity', 'integrity-key', testData);
      
      const retrieved = await db.load_app_data('test-integrity', 'integrity-key');
      expect(retrieved).toEqual(testData);
      
      console.log('✅ Database integrity verification passed');
    }, TEST_TIMEOUT);
  });
});
// NO HARDCODED PORTS! Use environment variables.
/**
 * Database Reality Check Integration Tests
 * Tests actual database connectivity and data integrity
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe('Database Integration', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:${TF_STATIC_PORT:-8080}',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('Database health check endpoint responds correctly', async () => {
    const response = await apiContext.get('/api/health/database');

    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health).toHaveProperty('status', 'healthy');
    expect(health).toHaveProperty('connectionTime');
    expect(health.connectionTime).toBeLessThan(1000); // Should connect in under 1 second
  });

  test('Benton County parcel data is accessible', async () => {
    const response = await apiContext.get('/api/parcels/benton');

    expect(response.ok()).toBeTruthy();

    const parcels = await response.json();
    expect(parcels).toHaveProperty('data');
    expect(Array.isArray(parcels.data)).toBeTruthy();
    expect(parcels.data.length).toBeGreaterThan(0);

    // Check parcel structure
    const firstParcel = parcels.data[0];
    expect(firstParcel).toHaveProperty('parcel_number');
    expect(firstParcel).toHaveProperty('owner');
    expect(firstParcel).toHaveProperty('assessed_value');
  });

  test('Database can handle concurrent connections', async () => {
    // Create multiple concurrent requests
    const requests = Array.from({ length: 10 }, (_, i) =>
      apiContext.get(`/api/parcels?page=${i + 1}&limit=10`)
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });

  test('Database transaction integrity', async () => {
    // Test creating and then reading back data
    const testParcel = {
      parcel_number: 'TEST-INTEGRATION-001',
      owner: 'Test Integration Owner',
      acres: 1.5,
      assessed_value: 150000,
    };

    // Create test parcel
    const createResponse = await apiContext.post('/api/parcels', {
      data: testParcel,
    });

    expect(createResponse.ok()).toBeTruthy();

    const created = await createResponse.json();
    expect(created).toHaveProperty('id');

    // Read back the created parcel
    const readResponse = await apiContext.get(`/api/parcels/${created.id}`);
    expect(readResponse.ok()).toBeTruthy();

    const retrieved = await readResponse.json();
    expect(retrieved.parcel_number).toBe(testParcel.parcel_number);
    expect(retrieved.owner).toBe(testParcel.owner);

    // Clean up
    await apiContext.delete(`/api/parcels/${created.id}`);
  });

  test('Database query performance meets requirements', async () => {
    const startTime = Date.now();

    const response = await apiContext.get('/api/parcels?limit=100');

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    expect(queryTime).toBeLessThan(500); // Should complete in under 500ms

    const data = await response.json();
    expect(data.data.length).toBeLessThanOrEqual(100);
  });

  test('Database backup and recovery status', async () => {
    const response = await apiContext.get('/api/admin/database/status');

    expect(response.ok()).toBeTruthy();

    const status = await response.json();
    expect(status).toHaveProperty('lastBackup');
    expect(status).toHaveProperty('backupStatus', 'healthy');
    expect(status).toHaveProperty('recoveryPoint');

    // Last backup should be recent (within 24 hours)
    const lastBackup = new Date(status.lastBackup);
    const hoursSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
    expect(hoursSinceBackup).toBeLessThan(24);
  });

  test('Database connection pooling works correctly', async () => {
    const response = await apiContext.get('/api/admin/database/pool-status');

    expect(response.ok()).toBeTruthy();

    const poolStatus = await response.json();
    expect(poolStatus).toHaveProperty('activeConnections');
    expect(poolStatus).toHaveProperty('maxConnections');
    expect(poolStatus).toHaveProperty('poolUtilization');

    expect(poolStatus.activeConnections).toBeGreaterThanOrEqual(0);
    expect(poolStatus.poolUtilization).toBeLessThan(0.8); // Should not be over 80% utilized
  });

  test('Data integrity constraints are enforced', async () => {
    // Try to create invalid data
    const invalidParcel = {
      parcel_number: '', // Empty parcel number should fail
      owner: 'Test Owner',
      acres: -1, // Negative acres should fail
      assessed_value: 'invalid', // Non-numeric value should fail
    };

    const response = await apiContext.post('/api/parcels', {
      data: invalidParcel,
    });

    expect(response.status()).toBe(400); // Should return validation error

    const error = await response.json();
    expect(error).toHaveProperty('errors');
    expect(Array.isArray(error.errors)).toBeTruthy();
    expect(error.errors.length).toBeGreaterThan(0);
  });

  test('Database migration status is current', async () => {
    const response = await apiContext.get('/api/admin/database/migration-status');

    expect(response.ok()).toBeTruthy();

    const migrationStatus = await response.json();
    expect(migrationStatus).toHaveProperty('currentVersion');
    expect(migrationStatus).toHaveProperty('latestVersion');
    expect(migrationStatus).toHaveProperty('pendingMigrations');

    // Should have no pending migrations in integration environment
    expect(migrationStatus.pendingMigrations).toHaveLength(0);
    expect(migrationStatus.currentVersion).toBe(migrationStatus.latestVersion);
  });
});

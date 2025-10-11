/**
 * Global Test Teardown for TerraFusion OS 1.0
 * 
 * This file runs ONCE after ALL tests complete.
 * Use it to:
 * - Stop test databases
 * - Clean up test services
 * - Remove test fixtures
 * - Generate final reports
 * 
 * @author TerraFusion Systems Engineering Team
 */

/**
 * Global teardown function
 */
export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Cleaning up test environment...');

  try {
    // Stop MongoDB in-memory server
    const mongoServer = (global as any).__MONGO_SERVER__;
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✅ MongoDB stopped');
    }

    // Stop Redis container
    const redisContainer = (global as any).__REDIS_CONTAINER__;
    if (redisContainer) {
      await redisContainer.stop();
      console.log('✅ Redis stopped');
    }

    // Stop PostgreSQL container
    const postgresContainer = (global as any).__POSTGRES_CONTAINER__;
    if (postgresContainer) {
      await postgresContainer.stop();
      console.log('✅ PostgreSQL stopped');
    }

    console.log('\n✅ Test environment cleaned up successfully!\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't throw - teardown errors shouldn't fail the test suite
  }
}
